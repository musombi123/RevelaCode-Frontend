import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import GuestOverlay from "./GuestOverlay.jsx";
import LegalDocs from "./LegalDocs.jsx";

export default function StartModal({ onLoginSuccess }) {
  const { guestMode, login } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  const [mode, setMode] = useState(null); // null | "login" | "register"
  const [step, setStep] = useState("form"); // form | verify
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showLegal, setShowLegal] = useState(false);

  const codeInputRef = useRef(null);
  const hasAutoSubmittedRef = useRef(false);

  const resetAll = () => {
    setMode(null);
    setStep("form");
    setLoading(false);
    setFullName("");
    setContact("");
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setError("");
    setMessage("");
    hasAutoSubmittedRef.current = false;
  };

  const handleGuestLogin = () => {
    guestMode?.();
    const guestUser = { contact: "guest", fullName: "Guest User", role: "guest" };
    login(guestUser);
    onLoginSuccess?.(guestUser);
    window.location.href = "/";
  };

  useEffect(() => {
    if (step === "verify") {
      hasAutoSubmittedRef.current = false;
      setTimeout(() => codeInputRef.current?.focus(), 200);
    }
  }, [step]);

  const requestVerificationCode = async (email) => {
    const res = await fetch(`${baseUrl}/api/request-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact: email }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Failed to send verification code");

    // Auto-fill debug code in dev if available
    if (data.debug_code) {
      setVerificationCode(data.debug_code);
      setMessage(`📩 Debug code applied for ${email}.`);
    } else {
      setVerificationCode("");
      setMessage(`📩 Verification code sent to ${email}.`);
    }

    return data;
  };

  const doVerifyAndLogin = async (code) => {
    // Verify code
    const res = await fetch(`${baseUrl}/api/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact, code }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.message || "Verification failed");

    setMessage("✅ Verified! Logging you in...");

    // Auto-login
    const loginRes = await fetch(`${baseUrl}/api/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact, password }),
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.success) throw new Error(loginData.message || "Login failed");

    const userData = { contact: loginData.contact, fullName: loginData.full_name, role: loginData.role };
    login(userData);
    onLoginSuccess?.(userData);

    if (loginData.role === "admin") window.location.href = "/admin/dashboard";
    else if (loginData.role === "support") window.location.href = "/support/dashboard";
    else window.location.href = "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!contact && !password && mode === "login") return handleGuestLogin();

    if (!contact || !password || (mode === "register" && !fullName))
      return setError("⚠ Please fill all required fields.");

    if (mode === "register" && password !== confirmPassword)
      return setError("❌ Passwords do not match.");

    try {
      setLoading(true);
      const endpoint = mode === "login" ? "/api/login" : "/api/register";
      const payload =
        mode === "login"
          ? { contact, password }
          : { full_name: fullName, contact, password, confirm_password: confirmPassword };

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Authentication failed");

      if (mode === "login") {
        const userData = { contact: data.contact, fullName: data.full_name, role: data.role };
        login(userData);
        onLoginSuccess?.(userData);

        if (data.role === "admin") window.location.href = "/admin/dashboard";
        else if (data.role === "support") window.location.href = "/support/dashboard";
        else window.location.href = "/";
        return;
      }

      // Register -> request verification code
      await requestVerificationCode(contact);
      setStep("verify");
      hasAutoSubmittedRef.current = false;
    } catch (err) {
      setError(err.message || "❌ Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!verificationCode || verificationCode.length !== 6)
      return setError("⚠ Enter the 6-digit verification code.");

    try {
      setLoading(true);
      await doVerifyAndLogin(verificationCode);
    } catch (err) {
      setError(err.message || "❌ Verification error.");
      hasAutoSubmittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit 6-digit code
  useEffect(() => {
    if (step !== "verify" || loading) return;
    const clean = (verificationCode || "").replace(/\D/g, "").slice(0, 6);
    if (verificationCode !== clean) return setVerificationCode(clean);

    if (clean.length === 6 && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      (async () => {
        try {
          setError(""); setMessage("⏳ Verifying code..."); setLoading(true);
          await doVerifyAndLogin(clean);
        } catch (err) {
          setError(err.message || "❌ Verification failed"); setMessage(""); hasAutoSubmittedRef.current=false;
        } finally { setLoading(false); }
      })();
    }
  }, [verificationCode, step, loading]);

  const resendCode = async () => {
    if (!contact) return setError("⚠ Contact missing");
    try {
      setLoading(true); setError(""); setMessage("");
      await requestVerificationCode(contact);
      hasAutoSubmittedRef.current=false;
      setTimeout(() => codeInputRef.current?.focus(), 200);
    } catch (err) { setError(err.message || "❌ Could not resend code"); } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
        <button onClick={resetAll} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X /></button>

        {!mode && (
          <div className="space-y-3">
            <GuestOverlay onLogin={() => setMode("login")} />
            <button onClick={handleGuestLogin} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">🚀 Continue as Guest</button>
          </div>
        )}

        {mode && step === "form" && (
          <>
            <h2 className="text-xl font-bold text-center mb-4 text-blue-600 dark:text-blue-400">{mode === "login" ? "🔐 Login" : "📝 Create Account"}</h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && <input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>}
              <input placeholder="Email" value={contact} onChange={e => setContact(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>
              <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>
              {mode === "register" && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>}
              <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">{loading ? "Processing..." : mode === "login" ? "Login" : "Register"}</button>
              <button type="button" onClick={handleGuestLogin} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">😎 Login as Guest</button>
            </form>
            <div className="text-center text-sm mt-4">{mode==="login"?<>No account? <button onClick={()=>setMode("register")} className="underline text-blue-600">Register</button></>:<>Have an account? <button onClick={()=>setMode("login")} className="underline text-blue-600">Login</button></>}</div>
          </>
        )}

        {mode && step === "verify" && (
          <>
            <h2 className="text-xl font-bold text-center mb-1 text-blue-600 dark:text-blue-400">🔐 Enter Verification Code</h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-300">We sent a 6-digit code to: <span className="font-semibold">{contact}</span></p>
            <form onSubmit={handleVerify} className="space-y-3 mt-3">
              <input ref={codeInputRef} inputMode="numeric" placeholder="Enter 6-digit code" value={verificationCode} onChange={e=>setVerificationCode(e.target.value.replace(/\D/g,'').slice(0,6))} className="w-full p-3 rounded border text-center tracking-widest text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>
              <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">{loading?"Verifying...":"Verify & Continue"}</button>
            </form>
            <div className="flex gap-2 mt-2">
              <button onClick={resendCode} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" disabled={loading}>🔄 Resend Code</button>
              <button onClick={() => {setStep("form"); setVerificationCode(""); setMessage(""); setError(""); hasAutoSubmittedRef.current=false;}} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" disabled={loading}>⬅ Back</button>
            </div>
          </>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {message && <p className="text-green-500 text-sm mt-2">{message}</p>}

        <div className="text-xs text-center text-gray-400 mt-3">By continuing, you agree to our <button onClick={()=>setShowLegal(true)} className="underline">terms & policy</button></div>
        {showLegal && <LegalDocs onClose={()=>setShowLegal(false)}/>}
      </div>
    </div>
  );
}
