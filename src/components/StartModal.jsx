import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";
import { useLocation } from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  Sun,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import LegalDocs from "./LegalDocs.jsx";


export default function StartModal() {
  const {
    login,
    guestMode,
    authFetch,
    getAccessToken,
  } = useAuth();
  const location = useLocation();
  const [modalDark, setModalDark] = useState(
    () => typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );

  const toggleModalTheme = () => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    const nextDark = !root.classList.contains("dark");
    root.classList.toggle("dark", nextDark);
    root.classList.toggle("light", !nextDark);
    root.dataset.theme = nextDark ? "dark" : "light";
    root.style.colorScheme = nextDark ? "dark" : "light";
    setModalDark(nextDark);
    try {
      localStorage.setItem("theme", nextDark ? "dark" : "light");
    } catch {
      // Theme remains active for this session if storage is unavailable.
    }
  };

  const baseUrl =
    String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

  // =======================================================
  // STATE
  // =======================================================

  const [mode, setMode] = useState("login");
  // null | login | register | forgot

  const [step, setStep] = useState("form");
  // form | verify | reset

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  const [message, setMessage] = useState("");

  const [showLegal, setShowLegal] = useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showResetPassword,
    setShowResetPassword,
  ] = useState(false);

  const [
    fullName,
    setFullName,
  ] = useState("");

  const [
    contact,
    setContact,
  ] = useState("");

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    verificationCode,
    setVerificationCode,
  ] = useState("");

  const [
    resetNewPassword,
    setResetNewPassword,
  ] = useState("");

  const [
    resetConfirmPassword,
    setResetConfirmPassword,
  ] = useState("");

  const codeInputRef = useRef(null);

  const autoSubmittedRef =
    useRef(false);


  // =======================================================
  // RESET
  // =======================================================

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

    setShowPassword(false);
    setShowResetPassword(false);

    autoSubmittedRef.current = false;
  };


  // =======================================================
  // ROLE REDIRECTION
  // =======================================================

  const goHomeByRole = (role) => {
    // Leave invitation acceptance in place; its own workflow consumes the session.
    if (window.location.pathname === "/elimu-invitation") return;

    // Return to the protected URL that caused AuthGate to request a login.
    // Only same-origin absolute paths are accepted; external URLs are ignored.
    const from = location?.state?.from;
    const fromPath = typeof from === "string" ? from : from?.pathname;
    const returnPath = fromPath
      ? `${fromPath}${typeof from === "object" ? (from.search || "") + (from.hash || "") : ""}`
      : "";
    if (
      returnPath.startsWith("/") &&
      !returnPath.startsWith("//") &&
      !["/login", "/admin/login", "/support/login"].includes(fromPath)
    ) {
      window.location.replace(returnPath);
      return;
    }

    switch (String(role || "").trim().toLowerCase()) {
      case "admin":
        window.location.replace(
          "/admin/dashboard"
        );
        return;

      case "support":
        window.location.replace(
          "/support/dashboard"
        );
        return;

      case "guest":
        window.location.replace("/");
        return;

      default:
        window.location.replace("/");
    }
  };

  // =======================================================
  // API
  // =======================================================

  const apiPost = async (
    path,
    payload = {}
  ) => {
    if (!baseUrl) {
      throw new Error(
        "Backend URL is not configured."
      );
    }

    const url = `${baseUrl}${path}`;
    const headers = {
      "Content-Type": "application/json",
    };

    // Optional license claims stay in storage and are never hard-coded.
    try {
      const license =
        localStorage.getItem("revela_license") ||
        localStorage.getItem("revela_license_token") ||
        "";
      if (license) headers["X-Revela-License"] = license;
    } catch {
      // Continue with JWT authentication if storage is restricted.
    }

    const requestOptions = {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    };

    // authFetch attaches the latest JWT and retries once after a successful
    // refresh. Modal visibility/close actions never clear authentication.
    const res = typeof authFetch === "function"
      ? await authFetch(url, requestOptions)
      : await fetch(url, requestOptions);

    const data =
      await res
        .json()
        .catch(() => ({}));

    if (
      !res.ok ||
      data.success === false
    ) {
      throw new Error(
        data.message ||
          data.error?.message ||
          "Request failed."
      );
    }

    return data;
  };


  const loginUser = (
    currentContact,
    currentPassword
  ) =>
    apiPost(
      "/api/login",
      {
        contact: currentContact,
        password: currentPassword,
      }
    );


  const registerUser = () =>
    apiPost(
      "/api/register",
      {
        full_name: fullName,
        contact,
        password,
        confirm_password:
          confirmPassword,
      }
    );


  const requestVerificationCode = () =>
    apiPost(
      "/api/request-code",
      {
        contact,
      }
    );


  const verifyCode = (
    code
  ) =>
    apiPost(
      "/api/verify",
      {
        contact,
        code,
      }
    );


  const requestResetCode = () =>
    apiPost(
      "/api/request-reset",
      {
        contact,
      }
    );


  const verifyResetCode = (
    code
  ) =>
    apiPost(
      "/api/verify-reset",
      {
        contact,
        code,
      }
    );


  const resetPasswordAPI = () =>
    apiPost(
      "/api/reset-password",
      {
        contact,
        code: verificationCode,
        new_password:
          resetNewPassword,
        confirm_password:
          resetConfirmPassword,
      }
    );


  // =======================================================
// STORE AUTHENTICATION
// =======================================================

const completeLogin = (data = {}) => {


  const level1 = data?.data || {};
  const level2 = level1?.data || {};

  const user =
    data?.user ||
    level1?.user ||
    level2?.user ||
    data?.account ||
    level1?.account ||
    level2?.account ||
    {};

  /*
   * -------------------------------------------------------
   * ACCESS TOKEN
   * -------------------------------------------------------
   */

  const accessToken =
    data?.access_token ||
    data?.accessToken ||
    data?.token ||
    level1?.access_token ||
    level1?.accessToken ||
    level1?.token ||
    level2?.access_token ||
    level2?.accessToken ||
    level2?.token ||
    user?.access_token ||
    user?.accessToken ||
    user?.token ||
    "";

  /*
   * -------------------------------------------------------
   * TOKEN TYPE
   * -------------------------------------------------------
   */

  const tokenType =
    data?.token_type ||
    data?.tokenType ||
    level1?.token_type ||
    level1?.tokenType ||
    level2?.token_type ||
    level2?.tokenType ||
    user?.token_type ||
    user?.tokenType ||
    "Bearer";

  const resolvedRefreshToken =
    data?.refresh_token ||
    data?.refreshToken ||
    level1?.refresh_token ||
    level1?.refreshToken ||
    level2?.refresh_token ||
    level2?.refreshToken ||
    user?.refresh_token ||
    user?.refreshToken ||
    "";

  /*
   * -------------------------------------------------------
   * USER ID
   * -------------------------------------------------------
   */

  const userId =
    data?.id ||
    data?._id ||
    data?.user_id ||
    level1?.id ||
    level1?._id ||
    level1?.user_id ||
    level2?.id ||
    level2?._id ||
    level2?.user_id ||
    user?.id ||
    user?._id ||
    user?.user_id ||
    "";

  /*
   * -------------------------------------------------------
   * FULL NAME
   * -------------------------------------------------------
   *
   * Support all common backend naming conventions.
   */

  const resolvedFullName =
    data?.full_name ||
    data?.fullName ||
    data?.name ||
    data?.display_name ||
    data?.displayName ||
    level1?.full_name ||
    level1?.fullName ||
    level1?.name ||
    level1?.display_name ||
    level1?.displayName ||
    level2?.full_name ||
    level2?.fullName ||
    level2?.name ||
    level2?.display_name ||
    level2?.displayName ||
    user?.full_name ||
    user?.fullName ||
    user?.name ||
    user?.display_name ||
    user?.displayName ||
    user?.username ||
    "";

  /*
   * -------------------------------------------------------
   * CONTACT
   * -------------------------------------------------------
   */

  const resolvedContact =
    data?.contact ||
    data?.email ||
    data?.phone ||
    level1?.contact ||
    level1?.email ||
    level1?.phone ||
    level2?.contact ||
    level2?.email ||
    level2?.phone ||
    user?.contact ||
    user?.email ||
    user?.phone ||
    "";

  /*
   * -------------------------------------------------------
   * ROLE
   * -------------------------------------------------------
   */

  const resolvedRole =
    data?.role ||
    level1?.role ||
    level2?.role ||
    user?.role ||
    "user";

  /*
   * -------------------------------------------------------
   * ROLES
   * -------------------------------------------------------
   */

  const resolvedRoles =
    Array.isArray(
      data?.roles
    )
      ? data.roles
      : Array.isArray(
          level1?.roles
        )
        ? level1.roles
        : Array.isArray(
            level2?.roles
          )
          ? level2.roles
          : Array.isArray(
              user?.roles
            )
            ? user.roles
            : [resolvedRole];

  /*
   * -------------------------------------------------------
   * API KEY
   * -------------------------------------------------------
   */

  const resolvedApiKey =
    data?.api_key ||
    data?.apiKey ||
    level1?.api_key ||
    level1?.apiKey ||
    level2?.api_key ||
    level2?.apiKey ||
    user?.api_key ||
    user?.apiKey ||
    "";

  /*
   * -------------------------------------------------------
   * EXPIRATION
   * -------------------------------------------------------
   */

  const expiresIn =
    data?.expires_in ||
    data?.expiresIn ||
    level1?.expires_in ||
    level1?.expiresIn ||
    level2?.expires_in ||
    level2?.expiresIn ||
    user?.expires_in ||
    user?.expiresIn ||
    0;

  /*
   * -------------------------------------------------------
   * TOKEN VALIDATION
   * -------------------------------------------------------
   */

  if (!accessToken) {
    // Never log authentication responses, which may contain credentials.
    console.error("Login response did not include an access token.");

    throw new Error(
      "Login succeeded, but the backend did not provide an access token."
    );
  }

  /*
   * -------------------------------------------------------
   * BUILD COMPLETE AUTH USER
   * -------------------------------------------------------
   *
   * Keep the original backend user properties while
   * guaranteeing the canonical properties expected by
   * AuthContext and the dashboard.
   */

  const authUser = {
    ...user,

    id: userId,

    full_name:
      user?.full_name ||
      resolvedFullName,

    fullName:
      resolvedFullName,

    name:
      user?.name ||
      resolvedFullName,

    contact:
      resolvedContact,

    role:
      resolvedRole,

    roles:
      resolvedRoles,

    api_key:
      user?.api_key ||
      resolvedApiKey,

    apiKey:
      resolvedApiKey,

    verified:
      Boolean(
        user?.verified ??
        user?.is_verified ??
        data?.verified ??
        level1?.verified ??
        level2?.verified
      ),

    access_token:
      accessToken,

    accessToken,

    token_type:
      tokenType,

    tokenType,

    refresh_token:
      resolvedRefreshToken,

    refreshToken:
      resolvedRefreshToken,

    expires_in:
      expiresIn,

    expiresIn,
  };

  /*
   * -------------------------------------------------------
   * UPDATE CENTRAL AUTH CONTEXT
   * -------------------------------------------------------
   */

  // Keep credentials outside the cached user/profile object. AuthContext owns
  // the single persistence path and applies the legacy-key migration policy.
  const safeAuthUser = { ...authUser };
  for (const key of [
    "accessToken", "access_token", "refreshToken", "refresh_token", "token",
    "apiKey", "api_key", "password", "password_hash", "secret",
  ]) {
    delete safeAuthUser[key];
  }

  login({
    user: safeAuthUser,
    access_token: accessToken,
    token_type: tokenType,
    refresh_token: resolvedRefreshToken,
  });

  /*
   * -------------------------------------------------------
   * VERIFY PERSISTENCE WITHOUT READING/LOGGING THE SECRET
   * -------------------------------------------------------
   */

  const storedToken =
    typeof getAccessToken === "function"
      ? getAccessToken()
      : "";

  if (!storedToken) {
    throw new Error(
      "Authentication succeeded, but the access token could not be stored."
    );
  }

  console.log(
    "RevelaCode authentication established.",
    {
      authenticated: true,
      tokenStored: true,
      tokenType,
      hasToken: Boolean(
        storedToken
      ),
      userId,
      fullName:
        resolvedFullName,
      contact:
        resolvedContact,
      role:
        resolvedRole,
    }
  );

  /*
   * Return the normalized user so callers can use
   * the correct role instead of reading data.role
   * from an unknown response level.
   */

  return {
    user: safeAuthUser,
    role: resolvedRole,
    fullName: resolvedFullName,
    contact: resolvedContact,
    tokenType,
  };
};


  // =======================================================
  // REGISTRATION VERIFICATION
  // =======================================================

  const handleVerifyRegistration =
    async (
      code
    ) => {
      await verifyCode(
        code
      );

      const data =
        await loginUser(
          contact,
          password
        );

      const authResult =
        completeLogin(data);

        goHomeByRole(
          authResult.role
        );
    };


  // =======================================================
  // PASSWORD RESET
  // =======================================================

  const handleVerifyReset =
    async (
      code
    ) => {
      /*
       * Step 1:
       * Verify the reset code.
       */
      await verifyResetCode(
        code
      );

      /*
       * Move to dedicated reset
       * password screen.
       */
      setStep("reset");

      setVerificationCode(
        code
      );

      setMessage(
        "Code verified. Create your new password."
      );

      autoSubmittedRef.current =
        false;
    };


  const handlePasswordReset =
    async () => {
      await resetPasswordAPI();

      /*
       * Automatically sign the user
       * into the new account credentials.
       */
      const data =
        await loginUser(
          contact,
          resetNewPassword
        );

      const authResult =
        completeLogin(data);
      
        goHomeByRole(
          authResult.role
        );

    };


  // =======================================================
  // GUEST
  // =======================================================

  const handleGuestLogin =
    () => {
      guestMode();

      goHomeByRole(
        "guest"
      );
    };


  // =======================================================
  // MAIN SUBMIT
  // =======================================================

  const handleSubmit =
    async (
      e
    ) => {
      e.preventDefault();

      setError("");
      setMessage("");

      if (!mode) {
        return;
      }

      // ---------------------------------------------------
      // CONTACT
      // ---------------------------------------------------

      if (!contact.trim()) {
        setError(
          "Enter your email or contact."
        );

        return;
      }


      // ---------------------------------------------------
      // LOGIN
      // ---------------------------------------------------

      if (
        mode === "login"
      ) {
        if (!password) {
          setError(
            "Enter your password."
          );

          return;
        }
      }


      // ---------------------------------------------------
      // REGISTER
      // ---------------------------------------------------

      if (
        mode === "register"
      ) {
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(contact.trim())) {
          setError("Enter a valid email address so we can send your activation code.");
          return;
        }

        if (!fullName.trim()) {
          setError(
            "Enter your full name."
          );

          return;
        }

        if (
          !password ||
          !confirmPassword
        ) {
          setError(
            "Enter both passwords."
          );

          return;
        }

        if (
          password !==
          confirmPassword
        ) {
          setError(
            "Passwords do not match."
          );

          return;
        }

        if (
          password.length <
          8
        ) {
          setError(
            "Password must be at least 8 characters."
          );

          return;
        }
      }


      // ---------------------------------------------------
      // FORGOT PASSWORD
      // ---------------------------------------------------

      if (
        mode === "forgot" &&
        step === "reset"
      ) {
        if (
          !resetNewPassword ||
          !resetConfirmPassword
        ) {
          setError(
            "Enter your new password."
          );

          return;
        }

        if (
          resetNewPassword !==
          resetConfirmPassword
        ) {
          setError(
            "Passwords do not match."
          );

          return;
        }

        if (
          resetNewPassword.length <
          8
        ) {
          setError(
            "New password must be at least 8 characters."
          );

          return;
        }
      }


      // ---------------------------------------------------
      // REQUEST
      // ---------------------------------------------------

      try {
        setLoading(true);

        // -----------------------------------------------
        // LOGIN
        // -----------------------------------------------

        if (
          mode === "login"
        ) {
          const data =
            await loginUser(
              contact,
              password
            );

          const authResult =
            completeLogin(data);

            goHomeByRole(
              authResult.role
            );

          return;
        }


        // -----------------------------------------------
        // REGISTER
        // -----------------------------------------------

        if (
          mode === "register"
        ) {
          await registerUser();

          const data =
            await requestVerificationCode();

          setMessage(
            data.message ||
              "Activation code sent to your email address. Check your inbox and spam folder."
          );

          setVerificationCode(
            ""
          );

          autoSubmittedRef.current =
            false;

          setStep(
            "verify"
          );

          return;
        }


        // -----------------------------------------------
        // FORGOT PASSWORD
        // -----------------------------------------------

        if (
          mode === "forgot"
        ) {
          if (
            step === "form"
          ) {
            const data =
              await requestResetCode();

            setMessage(
              data.message ||
                "Password reset code sent to your email address. Check your inbox and spam folder."
            );

            setVerificationCode(
              ""
            );

            autoSubmittedRef.current =
              false;

            setStep(
              "verify"
            );

            return;
          }

          if (
            step === "reset"
          ) {
            await handlePasswordReset();

            return;
          }
        }
      } catch (err) {
        setError(
          err?.message ||
            "Server error."
        );
      } finally {
        setLoading(
          false
        );
      }
    };


  // =======================================================
  // VERIFY SUBMIT
  // =======================================================

  const handleVerify =
    async (
      e
    ) => {
      e.preventDefault();

      setError(
        ""
      );

      const cleanCode =
        verificationCode
          .replace(/\D/g, "")
          .slice(0, 6);

      if (
        cleanCode.length !==
        6
      ) {
        setError(
          "Enter the 6-digit verification code."
        );

        return;
      }

      try {
        setLoading(
          true
        );

        if (
          mode === "register"
        ) {
          await handleVerifyRegistration(
            cleanCode
          );

          return;
        }

        if (
          mode === "forgot"
        ) {
          await handleVerifyReset(
            cleanCode
          );

          return;
        }
      } catch (err) {
        setError(
          err?.message ||
            "Verification failed."
        );

        autoSubmittedRef.current =
          false;
      } finally {
        setLoading(
          false
        );
      }
    };


  // =======================================================
  // AUTO VERIFY
  // =======================================================

  useEffect(() => {
    if (
      step !== "verify" ||
      loading
    ) {
      return;
    }

    const clean =
      verificationCode
        .replace(/\D/g, "")
        .slice(0, 6);

    if (
      clean.length === 6 &&
      !autoSubmittedRef.current
    ) {
      autoSubmittedRef.current =
        true;

      handleVerify({
        preventDefault:
          () => {},
      });
    }
  }, [
    verificationCode,
    step,
    loading,
  ]);


  // =======================================================
  // FOCUS CODE INPUT
  // =======================================================

  useEffect(() => {
    if (
      step === "verify" &&
      codeInputRef.current
    ) {
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 80);
    }
  }, [step]);


  // =======================================================
  // BACK
  // =======================================================

  const backFromVerify =
    () => {
      setStep("form");

      setVerificationCode("");

      setResetNewPassword("");

      setResetConfirmPassword("");

      setError("");

      setMessage("");

      autoSubmittedRef.current =
        false;
    };


  const backToStart =
    () => {
      resetAll();
    };


  // =======================================================
  // UI
  // =======================================================

  return (
    <>
      <div
        className="
          fixed inset-0 z-[100]
          flex items-end justify-center
          bg-[#e9f1ee]/95 backdrop-blur-xl
          dark:bg-[#030907]/95
          sm:items-center sm:px-4 sm:py-6
        "
      >
        <div className="pointer-events-none absolute -left-28 -top-28 h-80 w-80 rounded-full bg-emerald-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -right-24 h-80 w-80 rounded-full bg-teal-400/20 blur-3xl" />

        <div
          className="
            relative flex w-full max-w-[440px] flex-col
            max-h-[94dvh] overflow-hidden
            rounded-t-[30px] border border-emerald-500/25
            bg-white shadow-[0_30px_80px_-24px_rgba(4,60,45,0.4)]
            dark:bg-[#08110e]
            sm:max-h-[calc(100dvh-48px)] sm:rounded-[30px]
          "
          role="dialog"
          aria-modal="true"
          aria-label="RevelaCode account access"
        >
          <header
            className="
              relative isolate shrink-0 overflow-hidden
              border-b border-white/10 bg-[#04130f]
              px-5 pb-5 pt-5 text-white
              sm:px-6 sm:pb-6 sm:pt-6
            "
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-90"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.035) 1px,transparent 1px),radial-gradient(ellipse at 90% 0%,rgba(16,185,129,.38),transparent 65%),radial-gradient(ellipse at 0% 100%,rgba(45,212,191,.18),transparent 65%)",
                backgroundSize: "28px 28px,28px 28px,auto,auto",
              }}
            />
            <div className="relative z-10">
              <div className="mb-5 flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <img
                    src="/Logo.png"
                    alt="RevelaCode logo"
                    className="h-[38px] w-[38px] shrink-0 rounded-xl border border-white/15 bg-white/5 object-contain p-1 shadow-lg shadow-emerald-900/30"
                  />
                  <span className="truncate text-[15px] font-bold tracking-tight">RevelaCode</span>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={toggleModalTheme}
                    aria-label={modalDark ? "Switch to light theme" : "Switch to dark theme"}
                    title={modalDark ? "Light theme" : "Dark theme"}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-slate-300 backdrop-blur transition hover:bg-white/[0.14] hover:text-white"
                  >
                    {modalDark ? <Sun size={17} /> : <Moon size={17} />}
                  </button>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-slate-300 backdrop-blur transition hover:bg-white/[0.14] hover:text-white"
                    aria-label="Close"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <h2 className="pr-2 text-[clamp(27px,7vw,32px)] font-extrabold leading-[1.12] tracking-[-0.03em]">
                Your account.<br />
                <span className="bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">Your ecosystem.</span>
              </h2>
              <p className="mt-2.5 max-w-[340px] text-[13.5px] leading-6 text-[#a9bdb6]">
                One secure identity for Bible, study, business, farming, education, marketplace and community.
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {["Biashara", "Shamba", "Elimu", "Jumuiya"].map((name) => (
                  <span key={name} className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-emerald-100">
                    <span className="h-[5px] w-[5px] rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                    {name}
                  </span>
                ))}
              </div>
            </div>
          </header>

          <div
            className="
              min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain
              px-5 py-5 pb-[calc(20px+env(safe-area-inset-bottom))]
              sm:px-6 sm:py-6
            "
          >
          {/* =================================================
              CONTENT
          ================================================= */}

          <div
            className="
              space-y-5
              p-5
              sm:p-6
            "
          >

            {/* =================================================
                START SCREEN
            ================================================= */}

            {!mode && (
              <>
                <div
                  className="
                    grid
                    grid-cols-1
                    gap-3
                    sm:grid-cols-3
                  "
                >
                  <button
                    type="button"
                    onClick={() =>
                      setMode("login")
                    }
                    className="
                      group
                      rounded-2xl
                      border
                      border-emerald-200
                      bg-emerald-50
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:border-emerald-300
                      hover:shadow-lg
                      dark:border-emerald-900/50
                      dark:bg-emerald-950/30
                    "
                  >
                    <div
                      className="
                        mb-3
                        flex
                        h-10 w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-emerald-600
                        text-white
                      "
                    >
                      <LockKeyhole
                        size={19}
                      />
                    </div>

                    <div className="font-semibold">
                      Login
                    </div>

                    <div
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Access your account
                    </div>

                    <ArrowRight
                      size={16}
                      className="
                        mt-3
                        transition
                        group-hover:translate-x-1
                      "
                    />
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setMode("register")
                    }
                    className="
                      group
                      rounded-2xl
                      border
                      border-slate-200
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:shadow-lg
                      dark:border-white/10
                    "
                  >
                    <div
                      className="
                        mb-3
                        flex
                        h-10 w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-900
                        text-white
                        dark:bg-white
                        dark:text-slate-900
                      "
                    >
                      <UserPlus
                        size={19}
                      />
                    </div>

                    <div className="font-semibold">
                      Create account
                    </div>

                    <div
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Join RevelaCode
                    </div>

                    <ArrowRight
                      size={16}
                      className="
                        mt-3
                        transition
                        group-hover:translate-x-1
                      "
                    />
                  </button>


                  <button
                    type="button"
                    onClick={() =>
                      setMode("forgot")
                    }
                    className="
                      group
                      rounded-2xl
                      border
                      border-slate-200
                      p-4
                      text-left
                      transition
                      hover:-translate-y-0.5
                      hover:shadow-lg
                      dark:border-white/10
                    "
                  >
                    <div
                      className="
                        mb-3
                        flex
                        h-10 w-10
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-100
                        text-slate-900
                        dark:bg-white/10
                        dark:text-white
                      "
                    >
                      <KeyRound
                        size={19}
                      />
                    </div>

                    <div className="font-semibold">
                      Recover
                    </div>

                    <div
                      className="
                        mt-1
                        text-xs
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      Reset your password
                    </div>

                    <ArrowRight
                      size={16}
                      className="
                        mt-3
                        transition
                        group-hover:translate-x-1
                      "
                    />
                  </button>
                </div>


                {/* Guest */}

                <button
                  type="button"
                  onClick={
                    handleGuestLogin
                  }
                  className="
                    flex
                    w-full
                    items-center
                    justify-between
                    rounded-2xl
                    border
                    border-slate-200
                    px-4
                    py-3.5
                    transition
                    hover:bg-slate-50
                    dark:border-white/10
                    dark:hover:bg-white/5
                  "
                >
                  <div
                    className="
                      flex
                      items-center
                      gap-3
                    "
                  >
                    <div
                      className="
                        flex
                        h-9 w-9
                        items-center
                        justify-center
                        rounded-xl
                        bg-slate-100
                        dark:bg-white/10
                      "
                    >
                      <Users
                        size={17}
                      />
                    </div>

                    <div className="text-left">
                      <div className="font-medium">
                        Continue as guest
                      </div>

                      <div
                        className="
                          text-xs
                          text-slate-500
                          dark:text-slate-400
                        "
                      >
                        Explore without an account
                      </div>
                    </div>
                  </div>

                  <ArrowRight
                    size={17}
                  />
                </button>
              </>
            )}


            {/* =================================================
                ACTIVE FORM
            ================================================= */}

            {mode && (
              <>
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <div>
                    <div
                      className="
                        text-lg
                        font-semibold
                        text-slate-900
                        dark:text-white
                      "
                    >
                      {mode === "login" &&
                        "Welcome back"}

                      {mode === "register" &&
                        "Create your account"}

                      {mode === "forgot" &&
                        (
                          step === "reset"
                            ? "Create a new password"
                            : "Recover your account"
                        )}
                    </div>

                    <div
                      className="
                        mt-1
                        text-sm
                        text-slate-500
                        dark:text-slate-400
                      "
                    >
                      {mode === "login" &&
                        "Sign in to continue"}

                      {mode === "register" &&
                        "Start with one RevelaCode identity"}

                      {mode === "forgot" &&
                        (
                          step === "reset"
                            ? "Choose a secure new password"
                            : "We'll verify your account first"
                        )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={
                      backToStart
                    }
                    className="
                      text-xs
                      font-medium
                      text-emerald-700
                      hover:underline
                      dark:text-emerald-400
                    "
                  >
                    Change
                  </button>
                </div>


                <form
                  onSubmit={
                    step === "verify"
                      ? handleVerify
                      : handleSubmit
                  }
                  className="space-y-4"
                >

                  {/* =================================================
                      REGISTER FORM
                  ================================================= */}

                  {step === "form" &&
                    mode === "register" && (
                      <label className="block">
                        <span
                          className="
                            mb-1.5
                            block
                            text-sm
                            font-medium
                          "
                        >
                          Full name
                        </span>

                        <div className="relative">
                          <Users
                            size={17}
                            className="
                              pointer-events-none
                              absolute
                              left-3
                              top-1/2
                              -translate-y-1/2
                              text-slate-400
                            "
                          />

                          <input
                            value={fullName}
                            onChange={(e) =>
                              setFullName(
                                e.target.value
                              )
                            }
                            placeholder="Your full name"
                            autoComplete="name"
                            className="
                              w-full
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              py-3
                              pl-10
                              pr-3
                              outline-none
                              transition
                              focus:border-emerald-500
                              focus:ring-4
                              focus:ring-emerald-500/10
                              dark:border-white/10
                              dark:bg-white/5
                            "
                          />
                        </div>
                      </label>
                    )}


                  {/* =================================================
                      CONTACT
                  ================================================= */}

                  {step !== "reset" &&
                    mode !== null && (
                      <label className="block">
                        <span
                          className="
                            mb-1.5
                            block
                            text-sm
                            font-medium
                          "
                        >
                          {mode === "register" ? "Email address" : "Email or contact"}
                        </span>

                        <div className="relative">
                          <Mail
                            size={17}
                            className="
                              pointer-events-none
                              absolute
                              left-3
                              top-1/2
                              -translate-y-1/2
                              text-slate-400
                            "
                          />

                          <input
                            value={contact}
                            onChange={(e) =>
                              setContact(
                                e.target.value
                              )
                            }
                            placeholder="Email or phone"
                            autoComplete="username"
                            className="
                              w-full
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              py-3
                              pl-10
                              pr-3
                              outline-none
                              transition
                              focus:border-emerald-500
                              focus:ring-4
                              focus:ring-emerald-500/10
                              dark:border-white/10
                              dark:bg-white/5
                            "
                          />
                        </div>
                      </label>
                    )}


                  {/* =================================================
                      LOGIN PASSWORD
                  ================================================= */}

                  {step === "form" &&
                    (
                      mode === "login" ||
                      mode === "register"
                    ) && (
                      <label className="block">
                        <span
                          className="
                            mb-1.5
                            block
                            text-sm
                            font-medium
                          "
                        >
                          Password
                        </span>

                        <div className="relative">
                          <input
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            value={
                              password
                            }
                            onChange={(e) =>
                              setPassword(
                                e.target.value
                              )
                            }
                            placeholder="Enter password"
                            autoComplete={
                              mode === "login"
                                ? "current-password"
                                : "new-password"
                            }
                            className="
                              w-full
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              py-3
                              pl-3
                              pr-11
                              outline-none
                              transition
                              focus:border-emerald-500
                              focus:ring-4
                              focus:ring-emerald-500/10
                              dark:border-white/10
                              dark:bg-white/5
                            "
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                (value) =>
                                  !value
                              )
                            }
                            className="
                              absolute
                              right-3
                              top-1/2
                              -translate-y-1/2
                              text-slate-400
                            "
                            aria-label={
                              showPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >
                            {showPassword ? (
                              <EyeOff
                                size={18}
                              />
                            ) : (
                              <Eye
                                size={18}
                              />
                            )}
                          </button>
                        </div>
                      </label>
                    )}


                  {/* =================================================
                      REGISTER CONFIRM
                  ================================================= */}

                  {step === "form" &&
                    mode === "register" && (
                      <label className="block">
                        <span
                          className="
                            mb-1.5
                            block
                            text-sm
                            font-medium
                          "
                        >
                          Confirm password
                        </span>

                        <input
                          type="password"
                          value={
                            confirmPassword
                          }
                          onChange={(e) =>
                            setConfirmPassword(
                              e.target.value
                            )
                          }
                          placeholder="Repeat your password"
                          autoComplete="new-password"
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-3
                            py-3
                            outline-none
                            transition
                            focus:border-emerald-500
                            focus:ring-4
                            focus:ring-emerald-500/10
                            dark:border-white/10
                            dark:bg-white/5
                          "
                        />
                      </label>
                    )}


                  {/* =================================================
                      FORGOT VERIFICATION
                  ================================================= */}

                  {step === "verify" && (
                    <>
                      <div
                        className="
                          rounded-2xl
                          border
                          border-emerald-200
                          bg-emerald-50
                          p-4
                          dark:border-emerald-900/50
                          dark:bg-emerald-950/20
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            text-sm
                            font-medium
                          "
                        >
                          <ShieldCheck
                            size={17}
                          />

                          Verification required
                        </div>

                        <p
                          className="
                            mt-1
                            text-xs
                            leading-5
                            text-slate-600
                            dark:text-slate-400
                          "
                        >
                          Enter the 6-digit
                          verification code sent
                          for this account.
                        </p>
                      </div>

                      <label className="block">
                        <span
                          className="
                            mb-1.5
                            block
                            text-sm
                            font-medium
                          "
                        >
                          Verification code
                        </span>

                        <input
                          ref={
                            codeInputRef
                          }
                          value={
                            verificationCode
                          }
                          onChange={(e) =>
                            setVerificationCode(
                              e.target.value
                                .replace(
                                  /\D/g,
                                  ""
                                )
                                .slice(
                                  0,
                                  6
                                )
                            )
                          }
                          placeholder="000000"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          maxLength={6}
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-200
                            bg-white
                            px-4
                            py-4
                            text-center
                            text-2xl
                            font-bold
                            tracking-[0.4em]
                            outline-none
                            transition
                            focus:border-emerald-500
                            focus:ring-4
                            focus:ring-emerald-500/10
                            dark:border-white/10
                            dark:bg-white/5
                          "
                        />
                      </label>

                      <div
                        className="
                          flex
                          gap-3
                        "
                      >
                        <button
                          type="button"
                          onClick={
                            backFromVerify
                          }
                          className="
                            w-full
                            rounded-xl
                            border
                            border-slate-200
                            px-4
                            py-3
                            font-medium
                            dark:border-white/10
                          "
                        >
                          Back
                        </button>

                        <button
                          type="submit"
                          disabled={
                            loading
                          }
                          className="
                            w-full
                            rounded-xl
                            bg-emerald-600
                            px-4
                            py-3
                            font-semibold
                            text-white
                            transition
                            hover:bg-emerald-700
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        >
                          {loading
                            ? "Verifying..."
                            : "Verify"}
                        </button>
                      </div>
                    </>
                  )}


                  {/* =================================================
                      RESET PASSWORD
                  ================================================= */}

                  {step === "reset" &&
                    mode === "forgot" && (
                      <>
                        <label className="block">
                          <span
                            className="
                              mb-1.5
                              block
                              text-sm
                              font-medium
                            "
                          >
                            New password
                          </span>

                          <div className="relative">
                            <input
                              type={
                                showResetPassword
                                  ? "text"
                                  : "password"
                              }
                              value={
                                resetNewPassword
                              }
                              onChange={(e) =>
                                setResetNewPassword(
                                  e.target.value
                                )
                              }
                              placeholder="At least 8 characters"
                              autoComplete="new-password"
                              className="
                                w-full
                                rounded-xl
                                border
                                border-slate-200
                                bg-white
                                py-3
                                pl-3
                                pr-11
                                outline-none
                                transition
                                focus:border-emerald-500
                                focus:ring-4
                                focus:ring-emerald-500/10
                                dark:border-white/10
                                dark:bg-white/5
                              "
                            />

                            <button
                              type="button"
                              onClick={() =>
                                setShowResetPassword(
                                  (value) =>
                                    !value
                                )
                              }
                              className="
                                absolute
                                right-3
                                top-1/2
                                -translate-y-1/2
                                text-slate-400
                              "
                              aria-label={
                                showResetPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                            >
                              {showResetPassword ? (
                                <EyeOff
                                  size={18}
                                />
                              ) : (
                                <Eye
                                  size={18}
                                />
                              )}
                            </button>
                          </div>
                        </label>

                        <label className="block">
                          <span
                            className="
                              mb-1.5
                              block
                              text-sm
                              font-medium
                            "
                          >
                            Confirm new password
                          </span>

                          <input
                            type={
                              showResetPassword
                                ? "text"
                                : "password"
                            }
                            value={
                              resetConfirmPassword
                            }
                            onChange={(e) =>
                              setResetConfirmPassword(
                                e.target.value
                              )
                            }
                            placeholder="Repeat new password"
                            autoComplete="new-password"
                            className="
                              w-full
                              rounded-xl
                              border
                              border-slate-200
                              bg-white
                              px-3
                              py-3
                              outline-none
                              transition
                              focus:border-emerald-500
                              focus:ring-4
                              focus:ring-emerald-500/10
                              dark:border-white/10
                              dark:bg-white/5
                            "
                          />
                        </label>

                        <button
                          type="submit"
                          disabled={
                            loading
                          }
                          className="
                            w-full
                            rounded-xl
                            bg-emerald-600
                            px-4
                            py-3
                            font-semibold
                            text-white
                            transition
                            hover:bg-emerald-700
                            disabled:cursor-not-allowed
                            disabled:opacity-60
                          "
                        >
                          {loading
                            ? "Updating..."
                            : "Reset password"}
                        </button>
                      </>
                    )}


                  {/* =================================================
                      MAIN ACTION
                  ================================================= */}

                  {step === "form" && (
                    <>
                      <button
                        type="submit"
                        disabled={
                          loading
                        }
                        className="
                          flex
                          w-full
                          items-center
                          justify-center
                          gap-2
                          rounded-xl
                          bg-emerald-600
                          px-4
                          py-3.5
                          font-semibold
                          text-white
                          transition
                          hover:bg-emerald-700
                          disabled:cursor-not-allowed
                          disabled:opacity-60
                        "
                      >
                        {loading ? (
                          "Processing..."
                        ) : (
                          <>
                            {mode === "login" &&
                              "Login"}

                            {mode ===
                              "register" &&
                              "Create account"}

                            {mode === "forgot" &&
                              "Send verification code"}

                            <ArrowRight
                              size={17}
                            />
                          </>
                        )}
                      </button>

                      {mode === "login" && (
                        <button
                          type="button"
                          onClick={() => {
                            setMode(
                              "forgot"
                            );

                            setStep(
                              "form"
                            );

                            setError(
                              ""
                            );

                            setMessage(
                              ""
                            );
                          }}
                          className="
                            flex
                            w-full
                            items-center
                            justify-center
                            gap-2
                            text-sm
                            font-medium
                            text-emerald-700
                            hover:underline
                            dark:text-emerald-400
                          "
                        >
                          <KeyRound
                            size={15}
                          />
                          Forgot your password?
                        </button>
                      )}
                    </>
                  )}
                </form>
              </>
            )}


            {/* =================================================
                FEEDBACK
            ================================================= */}

            {error && (
              <div
                className="
                  flex
                  items-start
                  gap-2
                  rounded-xl
                  border
                  border-red-200
                  bg-red-50
                  px-3
                  py-3
                  text-sm
                  text-red-700
                  dark:border-red-900/40
                  dark:bg-red-950/20
                  dark:text-red-300
                "
              >
                <X
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {error}
                </span>
              </div>
            )}


            {message && (
              <div
                className="
                  flex
                  items-start
                  gap-2
                  rounded-xl
                  border
                  border-emerald-200
                  bg-emerald-50
                  px-3
                  py-3
                  text-sm
                  text-emerald-800
                  dark:border-emerald-900/40
                  dark:bg-emerald-950/20
                  dark:text-emerald-300
                "
              >
                <CheckCircle2
                  size={16}
                  className="mt-0.5 shrink-0"
                />

                <span>
                  {message}
                </span>
              </div>
            )}


            {/* =================================================
                SECURITY MESSAGE
            ================================================= */}

            <div
              className="
                flex
                items-center
                gap-2
                rounded-xl
                bg-slate-50
                px-3
                py-2.5
                text-xs
                text-slate-500
                dark:bg-white/5
                dark:text-slate-400
              "
            >
              <ShieldCheck
                size={14}
                className="shrink-0"
              />

              One secure account can power your
              RevelaCode and Jumuiya services.
            </div>


            {/* =================================================
                LEGAL
            ================================================= */}

            <div
              className="
                text-center
                text-xs
                leading-5
                text-slate-400
              "
            >
              By continuing, you agree to our{" "}

              <button
                type="button"
                onClick={() =>
                  setShowLegal(
                    true
                  )
                }
                className="
                  font-medium
                  text-slate-600
                  underline
                  underline-offset-2
                  hover:text-emerald-600
                  dark:text-slate-300
                "
              >
                Terms & Privacy Policy
              </button>
            </div>
          </div>
        </div>
      </div>


      {/* =======================================================
          LEGAL DOCS
      ======================================================= */}

      {showLegal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="
              fixed
              inset-0
              z-[10000]
              flex
              items-center
              justify-center
              bg-slate-950/70
              p-0
              backdrop-blur-md
              sm:p-4
            "
          >
            <div
              className="
                flex
                h-full
                w-full
                flex-col
                overflow-hidden
                bg-slate-50
                shadow-2xl
                dark:bg-slate-950

                sm:h-[92vh]
                sm:max-w-5xl
                sm:rounded-3xl
                sm:border
                sm:border-slate-200
                sm:dark:border-slate-800
              "
            >
              <LegalDocs
                activeTab="privacy"
                onClose={() =>
                  setShowLegal(false)
                }
              />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
