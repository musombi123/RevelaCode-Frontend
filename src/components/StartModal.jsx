import React, {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { createPortal } from "react-dom";
import "./StartModal.css";
import { useLocation, useNavigate } from "react-router-dom";
import DemoLauncher from "@/demo/DemoLauncher.jsx";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Fingerprint,
  KeyRound,
  LockKeyhole,
  Mail,
  Moon,
  Sun,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { resolveBackendBaseUrl } from "@/auth/backendUrl.mjs";
import { registerPlugin } from "@capacitor/core";

const NativeBrowser = registerPlugin("Browser");
const LegalDocs = React.lazy(() => import("./LegalDocs.jsx"));

function decodeBase64Url(value) {
  const normalized = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = window.atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function encodeBase64Url(buffer) {
  if (!buffer) return null;
  const bytes = buffer instanceof ArrayBuffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 1) binary += String.fromCharCode(bytes[index]);
  return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function toBrowserPublicKeyOptions(source = {}) {
  const options = { ...source, challenge: decodeBase64Url(source.challenge) };
  if (source.user?.id) options.user = { ...source.user, id: decodeBase64Url(source.user.id) };
  for (const key of ["allowCredentials", "excludeCredentials"]) {
    if (Array.isArray(source[key])) {
      options[key] = source[key].map((entry) => ({ ...entry, id: decodeBase64Url(entry.id) }));
    }
  }
  return options;
}

function serialisePublicKeyCredential(credential, ceremony) {
  const response = credential.response || {};
  const body = {
    id: credential.id,
    rawId: encodeBase64Url(credential.rawId),
    type: credential.type,
    authenticatorAttachment: credential.authenticatorAttachment || null,
    clientExtensionResults: credential.getClientExtensionResults?.() || {},
    response: { clientDataJSON: encodeBase64Url(response.clientDataJSON) },
  };
  if (ceremony === "registration") {
    body.response.attestationObject = encodeBase64Url(response.attestationObject);
    body.response.transports = response.getTransports?.() || [];
  } else {
    body.response.authenticatorData = encodeBase64Url(response.authenticatorData);
    body.response.signature = encodeBase64Url(response.signature);
    body.response.userHandle = encodeBase64Url(response.userHandle);
  }
  return body;
}


export default function StartModal({ onComplete }) {
  const {
    login,
    guestMode,
    authFetch,
    getAccessToken,
  } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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

  // Use the same backend-origin resolver as the rest of the application.
  // This honours all supported Vite API aliases and the production fallback.
  const baseUrl = resolveBackendBaseUrl(import.meta.env || {});

  useEffect(() => {
    let active = true;
    if (!baseUrl) return undefined;
    fetch(String(baseUrl).replace(/\/+$/, "") + "/api/identity/providers", {
      headers: { Accept: "application/json" },
    })
      .then((response) => response.json())
      .then((payload) => {
        if (active && payload?.success && payload.providers) setIdentityProviders(payload.providers);
      })
      .catch(() => {
        if (active) setIdentityProviders({});
      });
    return () => { active = false; };
  }, [baseUrl]);

  // =======================================================
  // STATE
  // =======================================================

  const [mode, setMode] = useState(null);
  // null opens the entry choice (sign in, create an account, or explore as guest)

  const [step, setStep] = useState("form");
  const [identityProviders, setIdentityProviders] = useState({});
  const [phoneChallengeId, setPhoneChallengeId] = useState("");
  const [phoneCode, setPhoneCode] = useState("");

  useLayoutEffect(() => {
    if (new URLSearchParams(location.search).get("mode") === "register") {
      setMode("register");
      setStep("form");
    }
  }, [location.search]);
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
    username,
    setUsername,
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

  const [mfaChallengeToken, setMfaChallengeToken] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaSetupData, setMfaSetupData] = useState(null);
  const [mfaRecoveryCodes, setMfaRecoveryCodes] = useState([]);

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
    setUsername("");
    setContact("");

    setPassword("");
    setConfirmPassword("");

    setVerificationCode("");
    setPhoneChallengeId("");
    setPhoneCode("");
    setMfaChallengeToken("");
    setMfaCode("");
    setMfaSetupData(null);
    setMfaRecoveryCodes([]);

    setResetNewPassword("");
    setResetConfirmPassword("");

    setShowPassword(false);
    setShowResetPassword(false);

    autoSubmittedRef.current = false;
  };

  const handleClose = () => {
    resetAll();
    if (typeof onComplete === "function") {
      onComplete();
      return;
    }
    navigate("/", { replace: true });
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

      case "support_agent":
      case "support":
      case "support_admin":
        window.location.replace(
          "/support/dashboard"
        );
        return;

      case "guest":
        window.location.replace("/app");
        return;

      default:
        window.location.replace("/app");
    }
  };

  const completeWorkspaceAccess = (role) => {
    // Notify the shell that authentication is complete before applying the
    // role-aware destination. The parent owns StartModal visibility.
    if (typeof onComplete === "function") onComplete();
    goHomeByRole(role);
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
      credentials: "include",
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
      const requestError = new Error(
        data.message ||
          data.error?.message ||
          "Request failed."
      );
      requestError.code = data.code || data.error?.code || "";
      requestError.status = res.status;
      throw requestError;
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
        username: username.trim().toLowerCase(),
        contact,
        password,
        confirm_password:
          confirmPassword,
      }
    );


  const handleProviderSignIn = async (provider) => {
    if (!baseUrl) {
      setError("The backend URL is not configured.");
      return;
    }
    if (!["google", "microsoft", "github"].includes(provider)) return;
    const isNativeAndroid = Boolean(window.Capacitor?.isNativePlatform?.());
    const authorizationUrl = new URL(
      String(baseUrl).replace(/\/+$/, "") + "/api/oauth/" + provider + "/start"
    );
    authorizationUrl.searchParams.set("mode", "login");
    authorizationUrl.searchParams.set("client", isNativeAndroid ? "android" : "web");
    if (isNativeAndroid) {
      try {
        await NativeBrowser.open({ url: authorizationUrl.toString(), toolbarColor: "#08111F" });
      } catch (error) {
        console.error("Could not open the Android system browser for " + provider + " sign-in.", error);
        setError(error?.message || "The system browser could not open. Please try again.");
      }
      return;
    }
    window.location.assign(authorizationUrl.toString());
  };

  const handleGoogleSignIn = () => handleProviderSignIn("google");

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

    username:
      data?.username || level1?.username || level2?.username || user?.username || "",

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
    username: authUser.username,
    tokenType,
  };
};


  // =======================================================
  // SECOND-FACTOR SIGN-IN
  // =======================================================

  const processLoginResponse = async (data = {}) => {
    if (data?.mfa_required) {
      if (!data.challenge_token) {
        throw new Error("The backend did not provide an MFA challenge.");
      }
      setMfaChallengeToken(data.challenge_token);
      setMfaCode("");
      setMfaSetupData(null);
      setStep("mfa");
      setMessage("Enter the current code from your authenticator app. Recovery codes also work here.");
      return null;
    }

    if (data?.mfa_setup_required) {
      if (!data.challenge_token) {
        throw new Error("The backend did not provide an enrollment challenge.");
      }
      setMfaChallengeToken(data.challenge_token);
      setMfaCode("");
      const setup = await apiPost("/api/auth/mfa/setup", {
        challenge_token: data.challenge_token,
      });
      setMfaSetupData(setup);
      setStep("mfa-setup");
      setMessage("Complete authenticator enrollment to finish this sign-in.");
      return null;
    }

    const authResult = completeLogin(data);
    completeWorkspaceAccess(authResult.role);
    return authResult;
  };


  const handlePasskeySignIn = async () => {
    setError("");
    setMessage("");
    if (!window.PublicKeyCredential || !navigator.credentials?.get) {
      setError("Passkeys are not available in this browser. Use a supported browser on HTTPS or choose another sign-in method.");
      return;
    }
    try {
      setLoading(true);
      const options = await apiPost("/api/identity/passkeys/authentication/options", {});
      const credential = await navigator.credentials.get({
        publicKey: toBrowserPublicKeyOptions(options.publicKey || {}),
      });
      if (!credential) throw new Error("Passkey sign-in was cancelled.");
      const payload = await apiPost("/api/identity/passkeys/authentication/verify", {
        challenge_id: options.challenge_id,
        credential: serialisePublicKeyCredential(credential, "authentication"),
      });
      await processLoginResponse(payload);
    } catch (error) {
      setError(error?.message || "Passkey sign-in failed.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLoginRequest = async (event) => {
    event?.preventDefault?.();
    setError("");
    setMessage("");
    if (!contact.trim()) {
      setError("Enter the phone number linked to your RevelaCode account.");
      return;
    }
    try {
      setLoading(true);
      const data = await apiPost("/api/identity/phone/login/request", { phone: contact.trim() });
      setPhoneChallengeId(data.challenge_id || "");
      setPhoneCode("");
      setStep("phone-verify");
      setMessage(data.message || "If this number belongs to a verified RevelaCode account, a sign-in code has been sent.");
    } catch (error) {
      setError(error?.message || "Could not request a phone sign-in code.");
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLoginVerify = async (event) => {
    event?.preventDefault?.();
    setError("");
    setMessage("");
    const cleanCode = String(phoneCode || "").replace(/\D/g, "").slice(0, 6);
    if (!phoneChallengeId || cleanCode.length !== 6) {
      setError("Enter the six-digit code sent to your phone.");
      return;
    }
    try {
      setLoading(true);
      const payload = await apiPost("/api/identity/phone/login/verify", {
        challenge_id: phoneChallengeId,
        phone: contact.trim(),
        code: cleanCode,
      });
      setPhoneChallengeId("");
      await processLoginResponse(payload);
    } catch (error) {
      setError(error?.message || "Phone sign-in verification failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleMfaVerification = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    const code = String(mfaCode || "").trim();
    if (!mfaChallengeToken || !code) {
      setError("Enter your authenticator or recovery code.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiPost("/api/auth/mfa/login-verify", {
        challenge_token: mfaChallengeToken,
        code,
      });
      setMfaChallengeToken("");
      setMfaCode("");
      const authResult = completeLogin(data);
      completeWorkspaceAccess(authResult.role);
    } catch (err) {
      setError(err?.message || "Authenticator verification failed.");
    } finally {
      setLoading(false);
    }
  };


  const handleMfaEnrollment = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!/^\d{6}$/.test(String(mfaCode || "").trim())) {
      setError("Enter the current 6-digit code from your authenticator app.");
      return;
    }

    try {
      setLoading(true);
      const data = await apiPost("/api/auth/mfa/enable", {
        challenge_token: mfaChallengeToken,
        code: String(mfaCode).trim(),
      });
      setMfaRecoveryCodes(Array.isArray(data.recovery_codes) ? data.recovery_codes : []);
      setMfaChallengeToken("");
      setMfaCode("");
      setMfaSetupData(null);
      setStep("mfa-recovery");
      setMessage(data.message || "Authenticator verification enabled.");
    } catch (err) {
      setError(err?.message || "Could not enable authenticator verification.");
    } finally {
      setLoading(false);
    }
  };


  const finishMfaEnrollment = () => {
    setStep("form");
    setPassword("");
    setMfaChallengeToken("");
    setMfaCode("");
    setMfaSetupData(null);
    setMfaRecoveryCodes([]);
    setMessage("Authenticator verification is enabled. Sign in again with your password and current authenticator code.");
    setError("");
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

      await processLoginResponse(data);
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

      await processLoginResponse(data);

    };


  // =======================================================
  // GUEST
  // =======================================================

  const handleGuestLogin =
    () => {
      guestMode();

      completeWorkspaceAccess("guest");
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

        if (!/^[a-z][a-z0-9._]{2,19}$/.test(username.trim().toLowerCase())) {
          setError("Username must be 3–20 characters, start with a letter, and contain only letters, numbers, dots or underscores.");
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
          let data;
          try {
            data = await loginUser(contact, password);
          } catch (loginError) {
            if (loginError?.code === "account_not_verified" || /account not verified/i.test(loginError?.message || "")) {
              setStep("verify");
              setVerificationCode("");
              setMessage("This account is not verified yet. Request a fresh email verification code below, then enter it here.");
              setError("");
              return;
            }
            throw loginError;
          }

          await processLoginResponse(data);
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
          mode === "login"
        ) {
          // The login-unverified flow keeps the entered password in state.
          // Verify the email code first, then resume the normal MFA-aware login.
          await verifyCode(cleanCode);
          setVerificationCode("");
          const loginData = await loginUser(contact, password);
          await processLoginResponse(loginData);
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
      <div className="rc-gateway-backdrop">
        <div className="rc-gateway-backdrop-glow rc-gateway-backdrop-glow-one" aria-hidden="true" />
        <div className="rc-gateway-backdrop-glow rc-gateway-backdrop-glow-two" aria-hidden="true" />
        <div className="rc-gateway-dialog" role="dialog" aria-modal="true" aria-labelledby="rc-identity-heading" data-demo="welcome-entry" aria-label="RevelaCode account access">
          <aside className="rc-gateway-brand" aria-label="RevelaCode ecosystem">
            <div className="rc-gateway-brand-grid" aria-hidden="true" />
            <div className="rc-gateway-brand-inner">
              <div className="rc-gateway-brand-top">
                <div className="rc-gateway-brand-mark"><img src="/Logo.png" alt="RevelaCode logo" /><span>RevelaCode</span></div>
                <div className="rc-gateway-brand-actions">
                  <button type="button" onClick={toggleModalTheme} aria-label={modalDark ? "Switch to light theme" : "Switch to dark theme"} title={modalDark ? "Light theme" : "Dark theme"} className="rc-gateway-icon-button">{modalDark ? <Sun size={17} /> : <Moon size={17} />}</button>
                  <button type="button" onClick={handleClose} className="rc-gateway-icon-button" aria-label="Close account access" title="Close"><X size={18} /></button>
                </div>
              </div>
              <div className="rc-gateway-brand-copy">
                <div className="rc-gateway-eyebrow"><span className="rc-gateway-eyebrow-dot" />ONE IDENTITY. MANY POSSIBILITIES.</div>
                <h1 id="rc-identity-heading">Your account.<span>Your ecosystem.</span></h1>
                <p>One secure identity for learning, faith, business, farming and community. Move across the RevelaCode ecosystem without starting over.</p>
              </div>
              <div className="rc-gateway-services" aria-label="Connected RevelaCode services">
                <div className="rc-gateway-service"><span>BI</span><strong>Biashara</strong></div>
                <div className="rc-gateway-service"><span>SH</span><strong>Shamba</strong></div>
                <div className="rc-gateway-service"><span>EL</span><strong>Elimu</strong></div>
                <div className="rc-gateway-service"><span>JU</span><strong>Jumuiya</strong></div>
                <div className="rc-gateway-service"><span>FA</span><strong>Faith</strong></div>
                <div className="rc-gateway-service"><span>ST</span><strong>Study</strong></div>
              </div>
              <div className="rc-gateway-orbit" aria-hidden="true">
                <svg viewBox="0 0 420 174" role="presentation">
                  <ellipse cx="210" cy="87" rx="174" ry="58" /><ellipse cx="210" cy="87" rx="118" ry="76" transform="rotate(-24 210 87)" />
                  <path d="M42 88 C104 18 313 18 378 88" /><path d="M42 88 C104 156 313 156 378 88" /><path d="M94 42 L326 132 M92 132 L328 42" />
                  <circle cx="210" cy="87" r="36" className="rc-gateway-orbit-core" /><circle cx="40" cy="88" r="5" /><circle cx="378" cy="88" r="5" /><circle cx="112" cy="25" r="4" /><circle cx="308" cy="149" r="4" /><circle cx="326" cy="42" r="4" /><circle cx="94" cy="132" r="4" />
                </svg>
                <div className="rc-gateway-orbit-center"><Sparkles size={20} /></div>
                <span className="rc-gateway-orbit-label rc-gateway-orbit-label-one">LEARN</span><span className="rc-gateway-orbit-label rc-gateway-orbit-label-two">BUILD</span><span className="rc-gateway-orbit-label rc-gateway-orbit-label-three">CONNECT</span>
              </div>
              <div className="rc-gateway-demo">
                <div className="rc-gateway-demo-copy"><strong>New to RevelaCode?</strong><span>Take a guided tour of the ecosystem.</span></div>
                <div className="rc-gateway-demo-action"><DemoLauncher compact /></div>
              </div>
              <div className="rc-gateway-brand-footer"><ShieldCheck size={15} /><span>One trusted identity across your connected services</span></div>
            </div>
          </aside>
          <section className="rc-gateway-auth-panel" aria-label="Account access workspace">
            <div className="rc-gateway-auth-topbar">
              <div><span className="rc-gateway-auth-kicker">REVELACODE IDENTITY</span><p>Secure access to your connected workspace</p></div>
              <div className="rc-gateway-secure-chip"><ShieldCheck size={15} /><span>Secure access</span></div>
            </div>
            <div className="rc-gateway-auth-scroll"><div className="rc-gateway-auth-content">
          {/* =================================================
              CONTENT
          ================================================= */}



            {/* =================================================
                START SCREEN
            ================================================= */}

            {!mode && (
              <div className="rc-gateway-entry">
                <div className="rc-gateway-entry-heading"><span className="rc-gateway-section-label">GET STARTED</span><h2>Welcome to RevelaCode</h2><p>Choose how you would like to continue.</p></div>
                <div className="rc-gateway-entry-actions" role="group" aria-label="Choose an account action">
                  <button type="button" onClick={() => setMode("login")} className="rc-gateway-entry-action"><span className="rc-gateway-entry-icon"><LockKeyhole size={18} /></span><span className="rc-gateway-entry-copy"><strong>Sign in</strong><small>Access your existing account</small></span><ArrowRight size={17} /></button>
                  <button type="button" onClick={() => setMode("register")} className="rc-gateway-entry-action"><span className="rc-gateway-entry-icon"><UserPlus size={18} /></span><span className="rc-gateway-entry-copy"><strong>Create account</strong><small>Join the RevelaCode ecosystem</small></span><ArrowRight size={17} /></button>
                  <button type="button" onClick={() => setMode("forgot")} className="rc-gateway-entry-action"><span className="rc-gateway-entry-icon"><KeyRound size={18} /></span><span className="rc-gateway-entry-copy"><strong>Recover access</strong><small>Reset your password securely</small></span><ArrowRight size={17} /></button>
                </div>
                <button type="button" onClick={handleGuestLogin} data-demo="welcome-guest" className="rc-gateway-guest-action"><span className="rc-gateway-guest-copy"><Users size={18} /><span><strong>Continue as guest</strong><small>Explore available services without an account</small></span></span><ArrowRight size={17} /></button>
              </div>
            )}

            {mode && step === "form" && (
              <div className="rc-gateway-tabs" role="tablist" aria-label="Account access options">
                <button type="button" role="tab" aria-selected={mode === "login"} onClick={() => { setMode("login"); setStep("form"); setError(""); setMessage(""); }} className={`rc-gateway-tab ${mode === "login" ? "is-active" : ""}`}><LockKeyhole size={15} /><span>Sign in</span></button>
                <button type="button" role="tab" aria-selected={mode === "register"} onClick={() => { setMode("register"); setStep("form"); setError(""); setMessage(""); }} className={`rc-gateway-tab ${mode === "register" ? "is-active" : ""}`}><UserPlus size={15} /><span>Join</span></button>
                <button type="button" role="tab" aria-selected={mode === "forgot"} onClick={() => { setMode("forgot"); setStep("form"); setError(""); setMessage(""); }} className={`rc-gateway-tab ${mode === "forgot" ? "is-active" : ""}`}><KeyRound size={15} /><span>Recover</span></button>
              </div>
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
                        (step === "mfa" ? "Confirm it's you" : step === "mfa-setup" ? "Add an authenticator app" : step === "mfa-recovery" ? "Finish securing your account" : "Sign in to continue")}

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

                  {mode === "forgot" && (
                    <button
                      type="button"
                      onClick={backToStart}
                      className="text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-400"
                    >
                      Back
                    </button>
                  )}
                </div>


                <form
                  onSubmit={
                    step === "verify"
                      ? handleVerify
                      : step === "phone"
                        ? handlePhoneLoginRequest
                        : step === "phone-verify"
                          ? handlePhoneLoginVerify
                          : step === "mfa"
                            ? handleMfaVerification
                        : step === "mfa-setup"
                          ? handleMfaEnrollment
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
                              bg-[#f4f8f6]
                              py-4
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
                      USERNAME
                  ================================================= */}

                  {step === "form" && mode === "register" && (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-medium">Username</span>
                      <div className="relative">
                        <UserPlus size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input
                          value={username}
                          onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, "").slice(0, 20))}
                          placeholder="Choose a unique username"
                          autoComplete="username"
                          minLength={3}
                          maxLength={20}
                          required
                          className="w-full rounded-xl border border-slate-200 bg-[#f4f8f6] py-4 pl-10 pr-3 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
                        />
                      </div>
                      <span className="mt-1 block text-xs text-slate-500">3–20 characters · letters, numbers, dots and underscores.</span>
                    </label>
                  )}

                  {/* =================================================
                      CONTACT
                  ================================================= */}

                  {(step === "form" || step === "verify" || step === "phone") &&
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
                          {step === "phone" ? "Phone number" : mode === "register" ? "Email address" : "Username, email or phone"}
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
                            placeholder={step === "phone" ? "+2547XXXXXXXX" : mode === "login" ? "Username, email or phone" : "Email address"}
                            type={step === "phone" ? "tel" : "text"}
                            inputMode={step === "phone" ? "tel" : "text"}
                            autoComplete={step === "phone" ? "tel" : "username"}
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

                  {step === "phone" && (
                    <section className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">Enter the mobile number already verified on your RevelaCode account. We will send a short-lived sign-in code by SMS.</p>
                      <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white disabled:opacity-60">
                        {loading ? "Sending code…" : "Send sign-in code"}
                      </button>
                      <button type="button" onClick={() => { setStep("form"); setError(""); setMessage(""); }} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-white/10">Back to password sign-in</button>
                    </section>
                  )}

                  {step === "phone-verify" && (
                    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">Verify {contact}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">Enter the six-digit code sent by SMS. The code expires after five minutes.</p>
                      </div>
                      <input
                        value={phoneCode}
                        onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        autoComplete="one-time-code"
                        inputMode="numeric"
                        maxLength={6}
                        placeholder="000000"
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-center font-mono text-2xl tracking-[0.35em] outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-white/5"
                      />
                      <button type="submit" disabled={loading || phoneCode.length !== 6} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white disabled:opacity-60">
                        {loading ? "Verifying…" : "Verify and sign in"}
                      </button>
                      <button type="button" onClick={() => { setStep("phone"); setPhoneChallengeId(""); setPhoneCode(""); setError(""); setMessage(""); }} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold dark:border-white/10">Change phone number</button>
                    </section>
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
                          <LockKeyhole
                            size={17}
                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                          />
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
                              rounded-2xl
                              border
                              border-slate-200
                              bg-[#f4f8f6]
                              py-4
                              pl-10
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
                            rounded-2xl
                            border
                            border-slate-200
                            bg-[#f4f8f6]
                            px-3
                            py-4
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
                          onChange={(e) => {
                            const nextCode = e.target.value.replace(/\D/g, "").slice(0, 6);
                            if (nextCode !== verificationCode) {
                              // A failed six-digit auto-submit must not loop.
                              // A genuinely edited code is eligible for one new attempt.
                              autoSubmittedRef.current = false;
                            }
                            setVerificationCode(nextCode);
                          }}
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

                      {(mode === "register" || mode === "login") && (
                        <button
                          type="button"
                          disabled={loading}
                          onClick={async () => {
                            setLoading(true);
                            setError("");
                            try {
                              const data = await requestVerificationCode();
                              setVerificationCode("");
                              autoSubmittedRef.current = false;
                              setMessage(data.message || "A new verification code has been sent. Check your inbox and spam folder.");
                            } catch (requestError) {
                              setError(requestError?.message || "We could not send a new verification code. Please try again.");
                            } finally {
                              setLoading(false);
                            }
                          }}
                          className="w-full rounded-xl border border-emerald-300 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                        >
                          {loading ? "Sending code..." : "Resend verification code"}
                        </button>
                      )}

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
                      AUTHENTICATOR VERIFICATION
                  ================================================= */}

                  {step === "mfa" && mode === "login" && (
                    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                          <ShieldCheck size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-slate-900 dark:text-white">Two-step verification</h3>
                          <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">Open your authenticator app, or use one unused recovery code.</p>
                        </div>
                      </div>
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium">Authenticator or recovery code</span>
                        <input
                          value={mfaCode}
                          onChange={(event) => setMfaCode(event.target.value)}
                          autoComplete="one-time-code"
                          autoFocus
                          inputMode="text"
                          maxLength={32}
                          placeholder="6-digit code or recovery code"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 font-mono text-lg tracking-[0.12em] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
                        />
                      </label>
                      <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {loading ? "Verifying..." : "Verify and sign in"}
                      </button>
                      <button type="button" disabled={loading} onClick={() => { setStep("form"); setMfaChallengeToken(""); setMfaCode(""); setMessage(""); setError(""); }} className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-white dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/5">
                        Cancel sign-in
                      </button>
                    </section>
                  )}

                  {/* =================================================
                      PRIVILEGED ACCOUNT MFA ENROLLMENT
                  ================================================= */}

                  {step === "mfa-setup" && mode === "login" && (
                    <section className="space-y-4 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4 dark:border-emerald-900/50 dark:bg-emerald-950/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white">
                          <ShieldCheck size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">Protect your administrator account</h3>
                          <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">Scan the QR code with a free authenticator app, then enter its 6-digit code.</p>
                        </div>
                      </div>
                      {mfaSetupData?.qr_code_data_url && (
                        <div className="flex justify-center rounded-xl bg-white p-3">
                          <img src={mfaSetupData.qr_code_data_url} alt="Authenticator setup QR code" className="h-44 w-44 max-w-full object-contain" />
                        </div>
                      )}
                      {mfaSetupData?.secret && (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-black/20">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Manual setup key</p>
                          <p className="mt-1 break-all font-mono text-sm font-bold tracking-wider text-slate-900 dark:text-white">{mfaSetupData.secret}</p>
                          <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">Keep this key private. Anyone who has it can generate your sign-in codes.</p>
                        </div>
                      )}
                      <label className="block">
                        <span className="mb-1.5 block text-sm font-medium">6-digit authenticator code</span>
                        <input
                          value={mfaCode}
                          onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                          autoComplete="one-time-code"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-4 text-center font-mono text-2xl tracking-[0.35em] outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 dark:border-white/10 dark:bg-white/5"
                        />
                      </label>
                      <button type="submit" disabled={loading} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60">
                        {loading ? "Enabling protection..." : "Enable and continue"}
                      </button>
                    </section>
                  )}

                  {/* =================================================
                      ONE-TIME RECOVERY CODES
                  ================================================= */}

                  {step === "mfa-recovery" && mode === "login" && (
                    <section className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white">
                          <KeyRound size={20} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-white">Save your recovery codes</h3>
                          <p className="mt-0.5 text-xs leading-5 text-slate-600 dark:text-slate-300">Each code works once if you lose access to your authenticator. This list is shown only now.</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        {mfaRecoveryCodes.map((code) => (
                          <code key={code} className="rounded-lg border border-amber-200 bg-white px-2 py-2 text-center font-mono text-xs font-semibold tracking-wider text-slate-900 dark:border-amber-900/60 dark:bg-black/20 dark:text-amber-100">{code}</code>
                        ))}
                      </div>
                      <button type="button" onClick={finishMfaEnrollment} className="w-full rounded-xl bg-emerald-600 px-4 py-3.5 font-semibold text-white transition hover:bg-emerald-700">I have saved these codes — return to sign in</button>
                    </section>
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
                          relative flex
                          min-h-[56px] w-full items-center justify-center
                          gap-2 overflow-hidden rounded-2xl
                          bg-gradient-to-r from-emerald-500 via-emerald-600 to-emerald-700
                          px-4 py-4 font-bold text-white
                          shadow-[0_14px_30px_-10px_rgba(5,150,105,0.65)]
                          transition active:scale-[0.98]
                          hover:brightness-105
                          disabled:cursor-not-allowed disabled:opacity-60
                        "
                      >
                        {loading ? (
                          "Processing..."
                        ) : (
                          <>
                            {mode === "login" &&
                              "Sign in"}

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

                      {(mode === "login" || mode === "register") && (
                        <>
                          <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
                            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                            <span>or continue with</span>
                            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                          </div>
                          {identityProviders.google?.enabled && (
                            <button type="button" onClick={handleGoogleSignIn} disabled={loading} className="flex min-h-[49px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-sm font-black text-blue-600">G</span>
                              Continue with Google
                            </button>
                          )}
                          {mode === "login" && identityProviders.microsoft?.enabled && (
                            <button type="button" onClick={() => handleProviderSignIn("microsoft")} disabled={loading} className="flex min-h-[49px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-md border border-slate-200 text-sm font-black text-sky-600">M</span>
                              Continue with Microsoft
                            </button>
                          )}
                          {mode === "login" && identityProviders.github?.enabled && (
                            <button type="button" onClick={() => handleProviderSignIn("github")} disabled={loading} className="flex min-h-[49px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                              <span aria-hidden="true" className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 text-sm font-black text-slate-800 dark:text-white">GH</span>
                              Continue with GitHub
                            </button>
                          )}
                        </>
                      )}
                      {mode === "login" && identityProviders.passkeys?.enabled && typeof window !== "undefined" && Boolean(window.PublicKeyCredential) && (
                        <button type="button" onClick={handlePasskeySignIn} disabled={loading} className="flex min-h-[49px] w-full items-center justify-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-100">
                          <span className="text-emerald-700 dark:text-emerald-300"><Fingerprint size={19} /></span>
                          {loading ? "Waiting for passkey…" : "Use a passkey"}
                        </button>
                      )}
                      {mode === "login" && identityProviders.phone?.enabled && (
                        <button type="button" onClick={() => { setContact(""); setMode("login"); setStep("phone"); setError(""); setMessage(""); }} disabled={loading} className="flex min-h-[49px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800">
                          <span className="text-emerald-700 dark:text-emerald-300"><Smartphone size={18} /></span>
                          Continue with phone
                        </button>
                      )}

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

                      {mode === "login" && (
                        <>
                          <div className="flex items-center gap-3 py-1 text-xs text-slate-400">
                            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                            <span>or</span>
                            <span className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
                          </div>
                          <button
                            type="button"
                            onClick={handleGuestLogin}
                            disabled={loading}
                            className="flex min-h-[52px] w-full items-center justify-center gap-2.5 rounded-2xl border border-slate-200 bg-transparent px-4 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:text-slate-100 dark:hover:bg-white/[0.04]"
                          >
                            <Users size={17} className="text-emerald-600 dark:text-emerald-400" />
                            Continue as guest
                          </button>
                        </>
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
                role="alert"
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
                role="status"
                aria-live="polite"
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
            </section>
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
              <React.Suspense fallback={<div className="flex min-h-[50vh] items-center justify-center p-6 text-sm text-slate-500 dark:text-slate-400" role="status">Loading legal documents…</div>}>
                <LegalDocs
                  activeTab="privacy"
                  onClose={() =>
                    setShowLegal(false)
                  }
                />
              </React.Suspense>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
