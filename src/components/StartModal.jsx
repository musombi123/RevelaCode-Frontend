// frontend/components/StartModal.jsx
import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import LegalDocs from "./LegalDocs.jsx";

export default function StartModal() {
  const { login, guestMode } = useAuth();

  const baseUrl =
    import.meta.env.VITE_REVELACODE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL;

  /* ===================== STATE ===================== */
  const [mode, setMode] = useState(null); // null | login | register | forgot
  const [step, setStep] = useState("form"); // form | verify
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

  /* ===================== HELPERS ===================== */

  const resetAll = () => {
    setMode(null);
    setStep("form");
    setLoading(false);
    setError("");
    setMessage("");
    setFullName("");
    setContact("");
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setResetNewPassword("");
    setResetConfirmPassword("");
    autoSubmittedRef.current = false;
  };

  const goHomeByRole = (role) => {
    if (role === "admin") window.location.href = "/admin/dashboard";
    else if (role === "support") window.location.href = "/support/dashboard";
    else window.location.href = "/";
  };

  /* ===================== API ===================== */

  const apiPost = async (path, payload = {}) => {
    const res = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok || data.success === false) {
      throw new Error(data.message || "Request failed");
    }

    return data;
  };

  const loginUser = (contact, password) =>
    apiPost("/api/login", { contact, password });

  const registerUser = () =>
    apiPost("/api/register", {
      full_name: fullName,
      contact,
      password,
      confirm_password: confirmPassword,
    });

  const requestVerificationCode = () =>
    apiPost("/api/request-code", { contact });

  const verifyCode = (code) =>
    apiPost("/api/verify", { contact, code });

  const requestResetCode = () =>
    apiPost("/api/request-reset", { contact });

  const verifyResetCode = (code) =>
    apiPost("/api/verify-reset", { contact, code });

  const resetPasswordAPI = () =>
    apiPost("/api/reset-password", {
      contact,
      code: verificationCode,
      new_password: resetNewPassword,
      confirm_password: resetConfirmPassword,
    });

  /* ===================== FLOWS ===================== */

  const handleVerifyAndLogin = async (code) => {
    await verifyCode(code);
    const data = await loginUser(contact, password);
    login({ contact: data.contact, fullName: data.full_name, role: data.role, apiKey: data.api_key });
    goHomeByRole(data.role);
  };

  const handleVerifyAndReset = async (code) => {
    await verifyResetCode(code);
    await resetPasswordAPI();
    const data = await loginUser(contact, resetNewPassword);
    login({ contact: data.contact, fullName: data.full_name, role: data.role });
    goHomeByRole(data.role);
  };

  const handleGuestLogin = () => {
    guestMode();
    goHomeByRole("guest");
  };

  /* ===================== SUBMIT ===================== */

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!mode) return;

    if (!contact) return setError("⚠ Enter email / contact.");

    if (mode === "login") {
      if (!password) return setError("⚠ Enter password.");
    }

    if (mode === "register") {
      if (!fullName) return setError("⚠ Enter full name.");
      if (!password || !confirmPassword) return setError("⚠ Enter passwords.");
      if (password !== confirmPassword) return setError("❌ Passwords do not match.");
      if (password.length < 6) return setError("⚠ Password too short.");
    }

    if (mode === "forgot" && step === "verify") {
      if (!resetNewPassword || !resetConfirmPassword)
        return setError("⚠ Enter new password.");
      if (resetNewPassword !== resetConfirmPassword)
        return setError("❌ Passwords do not match.");
    }

    try {
      setLoading(true);

      if (mode === "login") {
        const data = await loginUser(contact, password);
        login({ contact: data.contact, fullName: data.full_name, role: data.role , apiKey: data.api_key});
        goHomeByRole(data.role);
      }

      if (mode === "register") {
        await registerUser();

        const data = await requestVerificationCode();

        setMessage(
          `🛠 DEV MODE: Verification code = ${data.debug_code}`
        );

        setStep("verify");
      }

      if (mode === "forgot") {
        if (step === "form") {
          const data = await requestResetCode();

          setMessage(
            `🛠 DEV MODE: Reset code = ${data.debug_code}`
          );
          setStep("verify");
        } else {
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
    setError("");

    const cleanCode = verificationCode.replace(/\D/g, "").slice(0, 6);
    if (cleanCode.length !== 6) return setError("⚠ Enter 6-digit code.");

    try {
      setLoading(true);
      if (mode === "register") await handleVerifyAndLogin(cleanCode);
      if (mode === "forgot") await handleVerifyAndReset(cleanCode);
    } catch (err) {
      setError(err.message || "❌ Verification failed");
      autoSubmittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  /* ===================== AUTO VERIFY ===================== */

  useEffect(() => {
    if (step !== "verify" || loading) return;

    const clean = verificationCode.replace(/\D/g, "").slice(0, 6);
    if (clean.length === 6 && !autoSubmittedRef.current) {
      autoSubmittedRef.current = true;
      handleVerify({ preventDefault: () => {} });
    }
  }, [verificationCode, step, loading]);

  const backFromVerify = () => {
    setStep("form");
    setVerificationCode("");
    setError("");
    setMessage("");
    autoSubmittedRef.current = false;
  };

  /* ===================== UI ===================== */

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
        <button
          onClick={resetAll}
          className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
        >
          <X />
        </button>

        {!mode && (
          <div className="space-y-3">
            <button onClick={handleGuestLogin} className="w-full py-2 border rounded">
              🚀 Continue as Guest
            </button>
            <div className="flex gap-2">
              <button onClick={() => setMode("login")} className="w-full py-2 bg-blue-600 text-white rounded">
                🔐 Login
              </button>
              <button onClick={() => setMode("register")} className="w-full py-2 border rounded">
                📝 Register
              </button>
              <button onClick={() => setMode("forgot")} className="w-full py-2 border rounded">
                🔑 Forgot
              </button>
            </div>
          </div>
        )}

        {mode && (
          <form onSubmit={step === "form" ? handleSubmit : handleVerify} className="space-y-3">
            {step === "form" && (
              <>
                {mode === "register" && (
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Full Name" className="w-full p-2 border rounded" />
                )}
                <input value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Email / Contact" className="w-full p-2 border rounded" />
                {(mode === "login" || mode === "register") && (
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full p-2 border rounded" />
                )}
                {mode === "register" && (
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full p-2 border rounded" />
                )}
                {mode === "forgot" && step === "verify" && (
                  <>
                    <input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder="New Password" className="w-full p-2 border rounded" />
                    <input type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} placeholder="Confirm Password" className="w-full p-2 border rounded" />
                  </>
                )}
                <button disabled={loading} className="w-full py-2 bg-blue-600 text-white rounded">
                  {loading ? "⏳ Loading..." : "Continue"}
                </button>
              </>
            )}

            {step === "verify" && (
              <>
                <input
                  ref={codeInputRef}
                  value={verificationCode}
                  onChange={(e) =>
                    setVerificationCode(
                      e.target.value.replace(/\D/g, "").slice(0, 6)
                    )
                  }
                  placeholder="Enter debug code"
                  maxLength={6}
                  className="w-full p-2 border rounded"
                />
                <div className="flex gap-2">
                  <button type="button" onClick={backFromVerify} className="w-full border rounded py-2">
                    ⬅ Back
                  </button>
                  <button disabled={loading} className="w-full bg-green-600 text-white rounded py-2">
                    {loading ? "⏳ Verifying..." : "Verify"}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {message && <p className="text-green-500 text-sm">{message}</p>}

        <div className="text-xs text-center text-gray-400">
          By continuing you agree to our{" "}
          <button onClick={() => setShowLegal(true)} className="underline">
            terms & policy
          </button>
        </div>

        {showLegal && <LegalDocs onClose={() => setShowLegal(false)} />}
      </div>
    </div>
  );
}
