// frontend/components/StartModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import GuestOverlay from "./GuestOverlay.jsx";
import LegalDocs from "./LegalDocs.jsx";

export default function StartModal({ onLoginSuccess }) {
  const { guestMode, login } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // ---------- STATE ----------
  const [mode, setMode] = useState(null); // "login" | "register" | "forgot"
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [verificationCode, setVerificationCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showLegal, setShowLegal] = useState(false);

  const codeInputRef = useRef(null);
  const autoSubmitRef = useRef(false);
  const resendCooldownRef = useRef(false);

  // ---------- HELPERS ----------
  const resetAll = () => {
    setMode(null);
    setStep("form");
    setLoading(false);
    setFullName(""); setContact(""); setPassword(""); setConfirmPassword("");
    setVerificationCode(""); setResetNewPassword(""); setResetConfirmPassword("");
    setError(""); setMessage("");
    autoSubmitRef.current = false;
  };

  const goHomeByRole = (role) => {
    if (role === "admin") window.location.href = "/admin/dashboard";
    else if (role === "support") window.location.href = "/support/dashboard";
    else window.location.href = "/";
  };

  const handleGuestLogin = async () => {
    try {
      guestMode?.();
      const guestUser = { contact: "guest", fullName: "Guest User", role: "guest" };
      login(guestUser);
      onLoginSuccess?.(guestUser);
      goHomeByRole("guest");
    } catch {}
  };

  const apiPost = async (path, payload) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok || !data?.success) throw new Error(data?.message || "Request failed");
    return data;
  };

  const requestVerificationCode = (email) => apiPost("/api/request-code", { contact: email });
  const verifyCode = (email, code) => apiPost("/api/verify", { contact: email, code });
  const loginUser = (email, pass) => apiPost("/api/login", { contact: email, password: pass });
  const registerUser = () => apiPost("/api/register", { full_name: fullName, contact, password, confirm_password: confirmPassword });
  const resetPassword = (email, code, newPassword) => apiPost("/api/reset-password", { contact: email, code, new_password: newPassword });

  // ---------- FLOWS ----------
  const doVerifyAndLogin = async (code) => {
    await verifyCode(contact, code);
    setMessage("✅ Verified! Logging in...");
    const loginData = await loginUser(contact, password);
    const userData = { contact: loginData.contact, fullName: loginData.full_name, role: loginData.role || "user" };
    login(userData);
    onLoginSuccess?.(userData);
    goHomeByRole(userData.role);
  };

  const doVerifyAndResetPassword = async (code) => {
    await verifyCode(contact, code);
    setMessage("✅ Code verified. Resetting password...");
    await resetPassword(contact, code, resetNewPassword);
    setMessage("✅ Password reset successful. You can now login.");
    setTimeout(() => {
      setMode("login"); setStep("form"); setVerificationCode("");
      setResetNewPassword(""); setResetConfirmPassword(""); setError("");
    }, 900);
  };

  // ---------- HANDLERS ----------
  const handleSubmit = async (e) => {
    e.preventDefault(); setError(""); setMessage("");

    if (mode === "login" && !contact && !password) return handleGuestLogin();
    if (!mode) return;
    if (!contact) return setError("⚠ Please enter your email.");
    if (!contact.includes("@") || !contact.includes(".")) return setError("⚠ Invalid email format.");

    if (mode === "login" && !password) return setError("⚠ Please enter your password.");
    if (mode === "register") {
      if (!fullName) return setError("⚠ Please enter your full name.");
      if (!password || !confirmPassword) return setError("⚠ Please enter your password.");
      if (password.length < 6) return setError("⚠ Password must be at least 6 characters.");
      if (password !== confirmPassword) return setError("❌ Passwords do not match.");
    }

    try {
      setLoading(true);

      if (mode === "login") {
        const data = await loginUser(contact, password);
        const userData = { contact: data.contact, fullName: data.full_name, role: data.role || "user" };
        login(userData);
        onLoginSuccess?.(userData);
        goHomeByRole(userData.role);
        return;
      }

      if (mode === "register") {
        await registerUser();
        const codeRes = await requestVerificationCode(contact);
        setStep("verify");
        if (codeRes?.debug_code) {
          setMessage(`📩 Code sent to ${contact}. (DEV CODE: ${codeRes.debug_code})`);
          setVerificationCode(codeRes.debug_code); // auto-fill
        } else setMessage(`📩 Code sent to ${contact}. Enter it below.`);
        return;
      }

      if (mode === "forgot") {
        const codeRes = await requestVerificationCode(contact);
        setStep("verify");
        if (codeRes?.debug_code) setVerificationCode(codeRes.debug_code);
        setMessage(codeRes?.debug_code ? `📩 Reset code sent. (DEV CODE: ${codeRes.debug_code})` : `📩 Reset code sent.`);
        return;
      }
    } catch (err) {
      setError(err?.message || "❌ Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e?.preventDefault(); setError(""); setMessage("");

    const clean = (verificationCode || "").replace(/\D/g, "").slice(0, 6);
    if (clean.length !== 6) return setError("⚠ Enter the 6-digit verification code.");

    if (mode === "forgot") {
      if (!resetNewPassword || !resetConfirmPassword) return setError("⚠ Enter new password and confirm it.");
      if (resetNewPassword.length < 6) return setError("⚠ Password must be at least 6 characters.");
      if (resetNewPassword !== resetConfirmPassword) return setError("❌ Passwords do not match.");
    }

    try {
      setLoading(true);
      if (mode === "register") await doVerifyAndLogin(clean);
      else if (mode === "forgot") await doVerifyAndResetPassword(clean);
      else {
        await verifyCode(contact, clean);
        setMessage("✅ Verified. Please login now.");
        setMode("login"); setStep("form");
      }
    } catch (err) {
      setError(err?.message || "❌ Verification failed.");
      autoSubmitRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  // ---------- AUTO-SUBMIT ----------
  useEffect(() => {
    if (step !== "verify" || loading) return;
    const clean = (verificationCode || "").replace(/\D/g, "").slice(0, 6);
    if (verificationCode !== clean) { setVerificationCode(clean); return; }
    if (clean.length === 6 && !autoSubmitRef.current) {
      if (mode === "forgot" && (!resetNewPassword || !resetConfirmPassword)) return;
      autoSubmitRef.current = true;
      handleVerify();
    }
  }, [verificationCode, step, loading, mode, resetNewPassword, resetConfirmPassword]);

  const resendCode = async () => {
    if (!contact) return setError("⚠ Contact missing");
    if (resendCooldownRef.current) return setError("⚠ Wait a few seconds before resending");

    try {
      setLoading(true); setError(""); setMessage("");
      resendCooldownRef.current = true;
      setTimeout(() => (resendCooldownRef.current = false), 5000);

      const codeRes = await requestVerificationCode(contact);
      if (codeRes?.debug_code) setVerificationCode(codeRes.debug_code);
      setMessage(codeRes?.debug_code ? `🔄 New code sent. (DEV CODE: ${codeRes.debug_code})` : `🔄 New code sent.`);
    } catch (err) {
      setError(err?.message || "❌ Could not resend code");
    } finally { setLoading(false); }
  };

  const backFromVerify = () => {
    setStep("form"); setVerificationCode(""); setError(""); setMessage("");
    autoSubmitRef.current = false;
  };

  useEffect(() => {
    if (step === "verify") setTimeout(() => codeInputRef.current?.focus(), 200);
  }, [step]);

  // ---------- UI ----------
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
        <button onClick={resetAll} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X /></button>

        {!mode && (
          <div className="space-y-3">
            <GuestOverlay onLogin={() => setMode("login")} />
            <button onClick={handleGuestLogin} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">🚀 Continue as Guest</button>
            <div className="flex gap-2">
              <button onClick={() => {setMode("login"); setStep("form"); setError(""); setMessage("");}} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">🔐 Login</button>
              <button onClick={() => {setMode("register"); setStep("form"); setError(""); setMessage("");}} className="w-full py-2 rounded border border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-800">📝 Register</button>
            </div>
          </div>
        )}

        {/* FORM & VERIFY STEPS */}
        {mode && step === "form" && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {mode === "register" && <input placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>}
            <input placeholder="Email" value={contact} onChange={e => setContact(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>
            {mode !== "forgot" && <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>}
            {mode === "register" && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>}
            <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">{loading ? "Processing..." : mode === "login" ? "Login" : mode === "register" ? "Register" : "Send Reset Code"}</button>
            {mode === "login" && <button type="button" onClick={handleGuestLogin} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800">😎 Login as Guest</button>}
          </form>
        )}

        {mode && step === "verify" && (
          <>
            <h2 className="text-xl font-bold text-center mb-1 text-blue-600 dark:text-blue-400">🔐 Enter Verification Code</h2>
            <p className="text-sm text-center text-gray-500 dark:text-gray-300">We sent a 6-digit code to: <span className="font-semibold">{contact}</span></p>

            {mode === "forgot" && (
              <div className="space-y-2 mt-3">
                <input type="password" placeholder="New Password" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>
                <input type="password" placeholder="Confirm New Password" value={resetConfirmPassword} onChange={e => setResetConfirmPassword(e.target.value)} className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>
              </div>
            )}

            <form onSubmit={handleVerify} className="space-y-3 mt-3">
              <input ref={codeInputRef} inputMode="numeric" placeholder="Enter 6-digit code" value={verificationCode} onChange={e => setVerificationCode(e.target.value.replace(/\D/g,"").slice(0,6))} className="w-full p-3 rounded border text-center tracking-widest text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"/>
              <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">{loading ? "Verifying..." : mode === "forgot" ? "Verify & Reset" : "Verify & Continue"}</button>
            </form>

            <div className="flex gap-2 mt-2">
              <button onClick={resendCode} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" disabled={loading || resendCooldownRef.current}>🔄 Resend Code</button>
              <button onClick={backFromVerify} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800" disabled={loading}>⬅ Back</button>
            </div>
          </>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {message && <p className="text-green-500 text-sm mt-2">{message}</p>}

        <div className="text-xs text-center text-gray-400 mt-3">
          By continuing, you agree to our <button onClick={() => setShowLegal(true)} className="underline">terms & policy</button>
        </div>

        {showLegal && <LegalDocs onClose={() => setShowLegal(false)} />}
      </div>
    </div>
  );
}
