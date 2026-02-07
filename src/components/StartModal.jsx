// frontend/components/StartModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import LegalDocs from "./LegalDocs.jsx";

export default function StartModal() {
  const { login, guestMode } = useAuth();
  const baseUrl = import.meta.env.VITE_API_URL;

  const [mode, setMode] = useState(null); // null | "login" | "register" | "forgot"
  const [step, setStep] = useState("form"); // "form" | "verify"
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showLegal, setShowLegal] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");

  const codeInputRef = useRef(null);
  const autoSubmittedRef = useRef(false);

  const resetAll = () => {
    setMode(null);
    setStep("form");
    setLoading(false);
    setFullName(""); setContact(""); setPassword(""); setConfirmPassword("");
    setVerificationCode(""); setResetNewPassword(""); setResetConfirmPassword("");
    setError(""); setMessage("");
    autoSubmittedRef.current = false;
  };

  const goHomeByRole = (role) => {
    if (role === "admin") window.location.href = "/admin/dashboard";
    else if (role === "support") window.location.href = "/support/dashboard";
    else window.location.href = "/";
  };

  // ------------------ API ------------------
  const apiPost = async (path, payload) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {}),
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok || !data.success) throw new Error(data.message || "Request failed");
    return data;
  };

  const loginUser = (contact, password) => apiPost("/api/login", { contact, password });
  const registerUser = () =>
    apiPost("/api/register", { full_name: fullName, contact, password, confirm_password: confirmPassword });
  const requestVerificationCode = (contact) => apiPost("/api/request-code", { contact });
  const verifyCode = (contact, code) => apiPost("/api/verify", { contact, code });
  const requestResetCode = (contact) => apiPost("/api/request-reset", { contact });
  const verifyResetCode = (contact, code) => apiPost("/api/verify-reset", { contact, code });
  const resetPasswordAPI = (contact, code, newPass, confirmPass) =>
    apiPost("/api/reset-password", { contact, code, new_password: newPass, confirm_password: confirmPass });

  // ------------------ FLOWS ------------------
  const handleVerifyAndLogin = async (code) => {
    await verifyCode(contact, code);
    setMessage("✅ Verified! Logging you in...");
    const data = await loginUser(contact, password);
    login({ contact: data.contact, fullName: data.full_name, role: data.role });
    goHomeByRole(data.role);
  };

  const handleVerifyAndReset = async (code) => {
    await verifyResetCode(contact, code);
    setMessage("✅ Code verified. Resetting password...");
    await resetPasswordAPI(contact, code, resetNewPassword, resetConfirmPassword);
    setMessage("✅ Password reset successful. Logging you in...");
    const data = await loginUser(contact, resetNewPassword);
    login({ contact: data.contact, fullName: data.full_name, role: data.role });
    goHomeByRole(data.role);
  };

  const handleGuestLogin = () => {
    guestMode();
    goHomeByRole("guest");
  };

  // ------------------ SUBMIT ------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");

    if (!mode) return;
    if (!contact) return setError("⚠ Please enter your email/contact.");
    if ((mode === "login" || mode === "register") && !password) return setError("⚠ Please enter your password.");
    if (mode === "register") {
      if (!fullName) return setError("⚠ Enter your full name.");
      if (!password || !confirmPassword) return setError("⚠ Enter password & confirm.");
      if (password !== confirmPassword) return setError("❌ Passwords do not match.");
      if (password.length < 6) return setError("⚠ Password too short.");
    }
    if (mode === "forgot") {
      if (step === "form" && (!contact)) return setError("⚠ Enter your email/contact to reset password.");
      if (step === "verify" && (!resetNewPassword || !resetConfirmPassword)) return setError("⚠ Enter new password & confirm.");
      if (step === "verify" && resetNewPassword !== resetConfirmPassword) return setError("❌ Passwords do not match.");
    }

    try {
      setLoading(true);
      if (mode === "login") {
        const data = await loginUser(contact, password);
        login({ contact: data.contact, fullName: data.full_name, role: data.role });
        goHomeByRole(data.role);
      } else if (mode === "register") {
        await registerUser();
        const codeRes = await requestVerificationCode(contact);
        if (codeRes.debug_code) setVerificationCode(codeRes.debug_code);
        setMessage(`📩 Verification code sent to ${contact}${codeRes.debug_code ? ` (DEV CODE: ${codeRes.debug_code})` : ""}`);
        setStep("verify");
      } else if (mode === "forgot") {
        if (step === "form") {
          const codeRes = await requestResetCode(contact);
          if (codeRes.debug_code) setVerificationCode(codeRes.debug_code);
          setMessage(`📩 Reset code sent to ${contact}${codeRes.debug_code ? ` (DEV CODE: ${codeRes.debug_code})` : ""}`);
          setStep("verify");
        } else if (step === "verify") {
          await handleVerifyAndReset(verificationCode);
        }
      }
    } catch (err) {
      setError(err.message || "❌ Server error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError(""); setMessage("");
    const cleanCode = (verificationCode || "").replace(/\D/g, "").slice(0, 6);
    if (!cleanCode || cleanCode.length !== 6) return setError("⚠ Enter 6-digit code.");

    try {
      setLoading(true);
      if (mode === "register") await handleVerifyAndLogin(cleanCode);
      else if (mode === "forgot") await handleVerifyAndReset(cleanCode);
    } catch (err) {
      setError(err.message || "❌ Verification failed");
      autoSubmittedRef.current = false;
    } finally { setLoading(false); }
  };

  // Auto-submit code when filled
  useEffect(() => {
    if (step !== "verify" || loading) return;
    const clean = (verificationCode || "").replace(/\D/g, "").slice(0, 6);
    if (clean.length === 6 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      handleVerify({ preventDefault: () => {} });
    }
  }, [verificationCode, step, loading, mode, resetNewPassword, resetConfirmPassword]);

  const backFromVerify = () => {
    setStep("form"); setVerificationCode(""); setError(""); setMessage(""); autoSubmittedRef.current = false;
  };

  // ------------------ UI ------------------
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
        <button onClick={resetAll} className="absolute top-3 right-3 text-gray-400 hover:text-red-500"><X /></button>

        {!mode && (
          <div className="space-y-3">
            <button onClick={handleGuestLogin} className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800">🚀 Continue as Guest</button>
            <div className="flex gap-2">
              <button onClick={() => setMode("login")} className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white">🔐 Login</button>
              <button onClick={() => setMode("register")} className="w-full py-2 rounded border border-blue-600 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-gray-800">📝 Register</button>
              <button onClick={() => setMode("forgot")} className="w-full py-2 rounded border border-gray-600 hover:bg-gray-50">🔑 Forgot Password</button>
            </div>
          </div>
        )}

        {mode && (
          <form onSubmit={step === "form" ? handleSubmit : handleVerify} className="space-y-3">
            {step === "form" && (
              <>
                {mode === "register" && <input type="text" placeholder="Full Name" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full p-2 border rounded" />}
                <input type="text" placeholder="Email / Contact" value={contact} onChange={e => setContact(e.target.value)} className="w-full p-2 border rounded" />
                {(mode === "login" || mode === "register") && <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-2 border rounded" />}
                {mode === "register" && <input type="password" placeholder="Confirm Password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full p-2 border rounded" />}
                {mode === "forgot" && step === "verify" && (
                  <>
                    <input type="password" placeholder="New Password" value={resetNewPassword} onChange={e => setResetNewPassword(e.target.value)} className="w-full p-2 border rounded" />
                    <input type="password" placeholder="Confirm Password" value={resetConfirmPassword} onChange={e => setResetConfirmPassword(e.target.value)} className="w-full p-2 border rounded" />
                  </>
                )}
                <button type="submit" disabled={loading} className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700">
                  {loading ? "⏳ Loading..." : (mode === "login" ? "Login" : mode === "register" ? "Register" : "Reset")}
                </button>
              </>
            )}

            {step === "verify" && (
              <>
                <input ref={codeInputRef} type="text" placeholder="Enter 6-digit code" value={verificationCode} onChange={e => setVerificationCode(e.target.value)} className="w-full p-2 border rounded" />
                <div className="flex justify-between gap-2">
                  <button type="button" onClick={backFromVerify} className="w-full py-2 rounded border">⬅ Back</button>
                  <button type="submit" disabled={loading} className="w-full py-2 rounded bg-green-600 text-white hover:bg-green-700">{loading ? "⏳ Verifying..." : "Verify"}</button>
                </div>
              </>
            )}
          </form>
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
