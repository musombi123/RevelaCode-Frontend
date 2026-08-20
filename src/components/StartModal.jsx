import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  Mail,
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
  } = useAuth();

  const baseUrl =
    import.meta.env.VITE_REVELACODE_URL ||
    import.meta.env.VITE_BACKEND_URL ||
    import.meta.env.VITE_API_URL ||
    "";

  // =======================================================
  // STATE
  // =======================================================

  const [mode, setMode] = useState(null);
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

  const goHomeByRole = (
    role
  ) => {
    if (role === "admin") {
      window.location.href =
        "/admin/dashboard";

      return;
    }

    if (role === "support") {
      window.location.href =
        "/support/dashboard";

      return;
    }

    window.location.href = "/";
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

    const res = await fetch(
      `${baseUrl}${path}`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify(
          payload
        ),
      }
    );

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

  const completeLogin = (
    data
  ) => {
    const authPayload = {
      contact:
        data.contact || "",
      fullName:
        data.full_name || "",
      role:
        data.role || "user",
      apiKey:
        data.api_key || "",
      accessToken:
        data.access_token || "",
      tokenType:
        data.token_type || "Bearer",
      expiresIn:
        data.expires_in || 0,
    };

    /*
     * Give AuthContext the complete authenticated identity.
     *
     * IMPORTANT:
     * AuthContext should persist accessToken.
     */

    login(authPayload);

    /*
     * Fallback persistence.
     *
     * Keep this only if AuthContext does not already
     * manage the token. It is harmless if it does.
     */

    if (data.access_token) {
      localStorage.setItem(
        "revelacode_access_token",
        data.access_token
      );

      localStorage.setItem(
        "revelacode_token_type",
        data.token_type ||
          "Bearer"
      );
    }

    return authPayload;
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

      completeLogin(
        data
      );

      goHomeByRole(
        data.role
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

      completeLogin(
        data
      );

      goHomeByRole(
        data.role
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

          completeLogin(
            data
          );

          goHomeByRole(
            data.role
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
            `🛠 DEV MODE: Verification code = ${data.debug_code}`
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
              `🛠 DEV MODE: Reset code = ${data.debug_code}`
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
          flex items-center justify-center
          bg-slate-950/75
          backdrop-blur-md
          px-4 py-6
        "
      >
        <div
          className="
            relative
            w-full max-w-lg
            max-h-[92vh]
            overflow-y-auto
            rounded-3xl
            border border-white/10
            bg-white
            shadow-2xl
            dark:bg-slate-950
          "
        >
          {/* =================================================
              CLOSE
          ================================================= */}

          <button
            type="button"
            onClick={resetAll}
            className="
              absolute
              right-4 top-4
              z-20
              rounded-full
              p-2
              text-slate-400
              transition
              hover:bg-slate-100
              hover:text-slate-900
              dark:hover:bg-white/10
              dark:hover:text-white
            "
            aria-label="Close"
          >
            <X size={20} />
          </button>


          {/* =================================================
              HEADER
          ================================================= */}

          <div
            className="
              border-b
              border-slate-200
              bg-gradient-to-br
              from-slate-950
              via-slate-900
              to-emerald-950
              px-6
              pb-7
              pt-8
              text-white
              dark:border-white/10
            "
          >
            <div
              className="
                mb-4
                inline-flex
                items-center
                gap-2
                rounded-full
                border border-white/10
                bg-white/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-emerald-100
              "
            >
              <Sparkles
                size={14}
              />

              RevelaCode
              Ecosystem
            </div>

            <h2
              className="
                pr-8
                text-2xl
                font-bold
                tracking-tight
                sm:text-3xl
              "
            >
              Your account.
              <br />
              Your ecosystem.
            </h2>

            <p
              className="
                mt-2
                max-w-md
                text-sm
                leading-6
                text-slate-300
              "
            >
              One RevelaCode identity for
              Bible, study, business,
              farming, education,
              marketplace and community.
            </p>
          </div>


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
                          Email or contact
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

      {showLegal && (
        <LegalDocs
          onClose={() =>
            setShowLegal(
              false
            )
          }
        />
      )}
    </>
  );
}
