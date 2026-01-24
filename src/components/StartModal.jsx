import React, { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import GuestOverlay from "./GuestOverlay.jsx";
import LegalDocs from "./LegalDocs.jsx";

export default function StartModal({ onLoginSuccess }) {
  const { guestMode, login } = useAuth();

  const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const adminApiKey = import.meta.env.VITE_ADMIN_API_KEY;

  const [mode, setMode] = useState(null); // null | "login" | "register"
  const [step, setStep] = useState("form"); // form | verify
  const [loading, setLoading] = useState(false);

  const [fullName, setFullName] = useState("");
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showLegal, setShowLegal] = useState(false);

  const codeInputRef = useRef(null);

  // Auto-focus verification input when step changes to verify
  useEffect(() => {
    if (step === "verify") {
      setTimeout(() => codeInputRef.current?.focus(), 200);
    }
  }, [step]);

  const resetAll = () => {
    setMode(null);
    setStep("form");
    setLoading(false);

    setFullName("");
    setContact("");
    setPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setAdminKey("");

    setError("");
    setMessage("");
  };

  const handleGuestLogin = () => {
    guestMode?.();

    const guestUser = {
      contact: "guest",
      fullName: "Guest User",
      role: "guest",
    };

    login(guestUser);
    onLoginSuccess?.(guestUser);
    window.location.href = "/";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Guest shortcut (login form empty)
    if (!contact && !password && mode === "login") {
      return handleGuestLogin();
    }

    if (!contact || !password || (mode === "register" && !fullName)) {
      return setError("⚠ Please fill in all required fields.");
    }

    if (mode === "register" && password !== confirmPassword) {
      return setError("❌ Passwords do not match.");
    }

    // Admin API Key login (optional)
    if (adminKey && adminKey === adminApiKey) {
      const adminUser = { contact: "admin", fullName: "Administrator", role: "admin" };
      login(adminUser);
      onLoginSuccess?.(adminUser);
      window.location.href = "/admin/dashboard";
      return;
    }

    try {
      setLoading(true);

      const endpoint = mode === "login" ? "/api/login" : "/api/register";
      const payload =
        mode === "login"
          ? { contact, password }
          : {
              full_name: fullName,
              contact,
              password,
              confirm_password: confirmPassword,
            };

      const res = await fetch(`${baseUrl}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Authentication failed");

      // LOGIN SUCCESS
      if (mode === "login") {
        const userData = {
          contact: data.contact,
          fullName: data.full_name,
          role: data.role,
        };

        login(userData);
        onLoginSuccess?.(userData);

        if (data.role === "admin") window.location.href = "/admin/dashboard";
        else if (data.role === "support") window.location.href = "/support/dashboard";
        else window.location.href = "/";
        return;
      }

      // REGISTER SUCCESS -> SEND CODE -> SHOW VERIFY INPUT
      const codeRes = await fetch(`${baseUrl}/api/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });

      const codeData = await codeRes.json();

      if (!codeRes.ok || !codeData.success) {
        throw new Error(codeData.message || "Failed to send verification code");
      }

      setStep("verify");
      setMessage(`📩 Verification code sent to: ${contact} — Enter it below to activate your account.`);
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

    if (!verificationCode) return setError("⚠ Please enter the verification code.");

    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, code: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Verification failed");

      setMessage("✅ Verified successfully! Logging you in now...");

      // Auto login after verification
      const loginRes = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok || !loginData.success) {
        throw new Error(loginData.message || "Login after verification failed");
      }

      const userData = {
        contact: loginData.contact,
        fullName: loginData.full_name,
        role: loginData.role,
      };

      login(userData);
      onLoginSuccess?.(userData);

      if (loginData.role === "admin") window.location.href = "/admin/dashboard";
      else if (loginData.role === "support") window.location.href = "/support/dashboard";
      else window.location.href = "/";
    } catch (err) {
      setError(err.message || "❌ Verification error.");
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!contact) return setError("⚠ Contact is missing.");

    try {
      setLoading(true);
      setError("");
      setMessage("");

      const res = await fetch(`${baseUrl}/api/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Failed to resend code.");

      setMessage(`🔄 New code sent to: ${contact}. Check your inbox/spam.`);
    } catch (err) {
      setError(err.message || "❌ Could not resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
        {/* Close */}
        <button onClick={resetAll} className="absolute top-3 right-3 text-gray-400 hover:text-red-500">
          <X />
        </button>

        {/* Guest Overlay */}
        {!mode && (
          <div className="space-y-3">
            <GuestOverlay onLogin={() => setMode("login")} />

            <button
              onClick={handleGuestLogin}
              className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              🚀 Continue as Guest
            </button>
          </div>
        )}

        {/* FORM */}
        {mode && step === "form" && (
          <>
            <h2 className="text-xl font-bold text-center mb-4 text-blue-600 dark:text-blue-400">
              {mode === "login" ? "🔐 Login" : "📝 Create Account"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-3">
              {mode === "register" && (
                <input
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              )}

              <input
                placeholder="Email"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              {mode === "register" && (
                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                />
              )}

              <input
                type="password"
                placeholder="Admin API Key (optional)"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                😎 Login as Guest
              </button>
            </form>

            <div className="text-center text-sm mt-4">
              {mode === "login" ? (
                <>
                  No account?{" "}
                  <button onClick={() => setMode("register")} className="underline text-blue-600">
                    Register
                  </button>
                </>
              ) : (
                <>
                  Have an account?{" "}
                  <button onClick={() => setMode("login")} className="underline text-blue-600">
                    Login
                  </button>
                </>
              )}
            </div>
          </>
        )}

        {/* VERIFY */}
        {mode && step === "verify" && (
          <>
            <h2 className="text-xl font-bold text-center mb-1 text-blue-600 dark:text-blue-400">
              🔐 Enter Verification Code
            </h2>

            <p className="text-sm text-center text-gray-500 dark:text-gray-300">
              We sent a 6-digit code to: <span className="font-semibold">{contact}</span>
            </p>

            <form onSubmit={handleVerify} className="space-y-3 mt-3">
              <input
                ref={codeInputRef}
                placeholder="Enter 6-digit code (e.g. 123456)"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full p-3 rounded border text-center tracking-widest text-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>

            <div className="flex gap-2 mt-2">
              <button
                onClick={resendCode}
                className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={loading}
              >
                🔄 Resend Code
              </button>

              <button
                onClick={() => {
                  setStep("form");
                  setVerificationCode("");
                  setMessage("");
                  setError("");
                }}
                className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                disabled={loading}
              >
                ⬅ Back
              </button>
            </div>
          </>
        )}

        {/* FEEDBACK */}
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {message && <p className="text-green-500 text-sm mt-2">{message}</p>}

        {/* LEGAL */}
        <div className="text-xs text-center text-gray-400 mt-3">
          By continuing, you agree to our{" "}
          <button onClick={() => setShowLegal(true)} className="underline">
            terms & policy
          </button>
        </div>

        {showLegal && <LegalDocs onClose={() => setShowLegal(false)} />}
      </div>
    </div>
  );
}
