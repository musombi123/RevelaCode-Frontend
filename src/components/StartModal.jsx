import React, { useState } from "react";
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

  const resetMessages = () => {
    setError("");
    setMessage("");
  };

  const goLogin = () => {
    resetMessages();
    setMode("login");
    setStep("form");
  };

  const goRegister = () => {
    resetMessages();
    setMode("register");
    setStep("form");
  };

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

    resetMessages();
  };

  /* -------------------- REQUEST CODE (Reusable) -------------------- */
  const requestVerificationCode = async () => {
    resetMessages();

    if (!contact) {
      setError("⚠ Enter your email first.");
      return false;
    }

    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/api/request-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "❌ Failed to send verification code.");
      }

      setMessage(
        `📩 Verification code sent to ${contact}. ${
          data.debug_code ? "(Debug: " + data.debug_code + ")" : ""
        }`
      );

      setStep("verify");
      return true;
    } catch (err) {
      setError(err.message || "❌ Could not send code.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- AUTH SUBMIT -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!contact || !password || (mode === "register" && !fullName)) {
      return setError("⚠ All fields are required.");
    }

    if (mode === "register" && password !== confirmPassword) {
      return setError("❌ Passwords do not match.");
    }

    // Admin Key Login (Frontend shortcut)
    if (adminKey && adminKey === adminApiKey) {
      const userData = { contact: "admin", fullName: "Administrator", role: "admin" };
      login(userData);
      onLoginSuccess?.(userData);
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

      if (!res.ok || data.success === false) {
        // If backend says "Account not verified." allow direct jump to verification
        if (mode === "login" && res.status === 403) {
          setError(data.message || "⚠ Account not verified.");
          setMessage("👉 Request a verification code below and verify your account.");
          return;
        }
        throw new Error(data.message || "❌ Authentication failed.");
      }

      // LOGIN FLOW
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

      // REGISTER FLOW → auto request code
      await requestVerificationCode();
    } catch (err) {
      setError(err.message || "❌ Server error.");
    } finally {
      setLoading(false);
    }
  };

  /* -------------------- VERIFY -------------------- */
  const handleVerify = async (e) => {
    e.preventDefault();
    resetMessages();

    if (!verificationCode) return setError("⚠ Enter verification code.");

    try {
      setLoading(true);

      const res = await fetch(`${baseUrl}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, code: verificationCode }),
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(data.message || "❌ Verification failed.");
      }

      setMessage("✅ Verified! Logging you in...");

      // Auto-login after verification
      const loginRes = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, password }),
      });

      const loginData = await loginRes.json();

      if (!loginRes.ok || loginData.success === false) {
        throw new Error(loginData.message || "❌ Login after verification failed.");
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

  /* -------------------- GUEST -------------------- */
  const handleGuestClick = () => {
    guestMode?.();
    onLoginSuccess?.({ role: "guest" });
    setMessage("👀 Guest Mode active. You can still login anytime to save history + unlock full access.");
    setMode(null);
  };

  /* -------------------- RENDER -------------------- */
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
        {/* Close */}
        {mode && (
          <button
            onClick={resetAll}
            className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
          >
            <X />
          </button>
        )}

        {/* Guest overlay (Guest can still login/register) */}
        {!mode && (
          <GuestOverlay
            onLogin={() => goLogin()}
            onRegister={() => goRegister()}
            onGuest={() => handleGuestClick()}
          />
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

              {/* Optional Admin Key */}
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

              {/* 🔥 LOGIN ONLY: REQUEST CODE BUTTON */}
              {mode === "login" && (
                <button
                  type="button"
                  onClick={requestVerificationCode}
                  disabled={loading}
                  className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  📩 Request Verification Code
                </button>
              )}
            </form>

            <div className="text-center text-sm mt-4 space-y-2">
              {mode === "login" ? (
                <>
                  <div>
                    No account?{" "}
                    <button onClick={goRegister} className="underline text-blue-600">
                      Register
                    </button>
                  </div>

                  {/* Guest can still login */}
                  <div>
                    Want to explore first?{" "}
                    <button onClick={handleGuestClick} className="underline text-gray-600">
                      Continue as Guest
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    Have an account?{" "}
                    <button onClick={goLogin} className="underline text-blue-600">
                      Login
                    </button>
                  </div>

                  <div>
                    Not ready?{" "}
                    <button onClick={handleGuestClick} className="underline text-gray-600">
                      Continue as Guest
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* VERIFY */}
        {mode && step === "verify" && (
          <>
            <h2 className="text-xl font-bold text-center mb-4 text-blue-600 dark:text-blue-400">
              🔐 Verify Account
            </h2>

            <form onSubmit={handleVerify} className="space-y-3">
              <input
                placeholder="Verification Code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full p-2 rounded border dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Verifying..." : "Verify & Continue"}
              </button>
            </form>

            <button
              onClick={requestVerificationCode}
              className="mt-2 w-full py-1 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={loading}
            >
              🔄 Resend Code
            </button>

            <button
              onClick={goLogin}
              className="mt-2 w-full py-1 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={loading}
            >
              ⬅ Back to Login
            </button>
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
