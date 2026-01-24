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

    // allow guest even if they didn’t type anything
    if (!contact && !password && mode === "login") {
      return handleGuestLogin();
    }

    if (!contact || !password || (mode === "register" && !fullName)) {
      return setError("⚠ All fields are required.");
    }

    if (mode === "register" && password !== confirmPassword) {
      return setError("❌ Passwords do not match.");
    }

    // Admin API Key Login
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
      } else {
        // ✅ request verification code from correct backend route
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
        setMessage(`📩 Verification code sent to ${contact}.`);
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
    setMessage("");

    if (!verificationCode) return setError("⚠ Enter verification code.");

    try {
      setLoading(true);

      // ✅ verify using correct backend route
      const res = await fetch(`${baseUrl}/api/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, code: verificationCode }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "Verification failed");

      setMessage("✅ Account verified! Logging you in...");

      // Auto-login after verification
      const loginRes = await fetch(`${baseUrl}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok || !loginData.success)
        throw new Error(loginData.message || "Login after verification failed");

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

      setMessage("🔄 Verification code resent!");
    } catch (err) {
      setError(err.message || "❌ Could not resend code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="relative w-full max-w-md rounded-xl bg-white dark:bg-gray-900 p-6 shadow-xl space-y-4">
        {mode && (
          <button
            onClick={() => {
              setMode(null);
              setStep("form");
              setError("");
              setMessage("");
            }}
            className="absolute top-3 right-3 text-gray-400 hover:text-red-500"
          >
            <X />
          </button>
        )}

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

            <button
              onClick={resendCode}
              className="mt-2 w-full py-1 rounded border border-gray-400 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              disabled={loading}
            >
              🔄 Resend Code
            </button>
          </>
        )}

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {message && <p className="text-green-500 text-sm mt-2">{message}</p>}

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
