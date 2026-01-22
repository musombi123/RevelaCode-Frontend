import React, { useState } from "react";
import { Eye, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext.jsx";
import LegalDocs from "./LegalDocs.jsx";

export default function StartModal({ onLoginSuccess, onGuest }) {
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

  /* -------------------- AUTH ACTIONS -------------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!contact || !password || (mode === "register" && !fullName)) {
      return setError("⚠ All fields are required.");
    }

    if (mode === "register" && password !== confirmPassword) {
      return setError("❌ Passwords do not match.");
    }

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

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Authentication failed");
      }

      if (mode === "login") {
        const userData = {
          contact: data.contact,
          fullName: data.full_name,
          role: data.role,
        };
        login(userData);
        onLoginSuccess?.(userData);
      } else {
        setStep("verify");
        setMessage("📩 Verification code sent to your contact.");
      }
    } catch (err) {
      setError(err.message || "❌ Server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setError("");

    if (!verificationCode) return setError("⚠ Enter verification code.");

    try {
      setLoading(true);
      // Corrected verify endpoint
      const res = await fetch(`${baseUrl}/api/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, code: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok || data.message?.includes("❌")) {
        throw new Error(data.message || "Verification failed");
      }

      // After verify, auto-login
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
    } catch (err) {
      setError(err.message || "❌ Verification error.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestClick = () => {
    guestMode?.();
    onGuest?.();
  };

  /* -------------------- RENDER MODAL -------------------- */
  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl">

        {/* Close */}
        {mode && (
          <button
            onClick={() => setMode(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
          >
            <X />
          </button>
        )}

        {/* CHOICE SCREEN */}
        {!mode && (
          <div className="flex flex-col gap-4 items-center">
            <h2 className="text-2xl font-bold text-center text-blue-600 dark:text-blue-400">
              Welcome! 👋
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 text-center">
              Please login, register, or continue as a guest to proceed.
            </p>

            <button
              onClick={() => setMode("login")}
              className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className="w-full py-2 rounded bg-green-600 hover:bg-green-700 text-white"
            >
              Register
            </button>
            <button
              onClick={handleGuestClick}
              className="w-full py-2 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center gap-2"
            >
              <Eye className="w-4 h-4" />
              Continue as Guest
            </button>
          </div>
        )}

        {/* FORM SCREEN */}
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
                placeholder="Email or Phone"
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? "Processing..." : mode === "login" ? "Login" : "Register"}
              </button>
            </form>

            <div className="text-center text-sm mt-4">
              {mode === "login" ? (
                <>No account? <button onClick={() => setMode("register")} className="underline text-blue-600">Register</button></>
              ) : (
                <>Have an account? <button onClick={() => setMode("login")} className="underline text-blue-600">Login</button></>
              )}
            </div>
          </>
        )}

        {/* VERIFY SCREEN */}
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
                Verify & Continue
              </button>
            </form>
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
