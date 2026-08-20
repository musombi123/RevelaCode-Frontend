import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";


// =========================================================
// CONTEXT
// =========================================================

const AuthContext = createContext();

const STORAGE_KEY = "revela_auth";
const TOKEN_KEY = "revelacode_access_token";
const TOKEN_TYPE_KEY = "revelacode_token_type";


// =========================================================
// PROVIDER
// =========================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const [isGuest, setIsGuest] =
    useState(false);

  const [hasStarted, setHasStarted] =
    useState(false);

  const [hydrated, setHydrated] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const isReady =
    hasStarted &&
    hydrated;


  // =======================================================
  // LOAD SESSION
  // =======================================================

  useEffect(() => {
    try {
      const stored =
        localStorage.getItem(
          STORAGE_KEY
        );

      const storedToken =
        localStorage.getItem(
          TOKEN_KEY
        );

      const storedTokenType =
        localStorage.getItem(
          TOKEN_TYPE_KEY
        ) || "Bearer";

      if (stored) {
        try {
          const parsed =
            JSON.parse(stored);

          if (parsed?.user) {
            setUser(
              parsed.user
            );
          }

          setIsGuest(
            Boolean(
              parsed?.isGuest
            )
          );
        } catch {
          localStorage.removeItem(
            STORAGE_KEY
          );
        }
      }

      /*
       * If a JWT exists, keep it available.
       *
       * The token itself is not placed inside the
       * user object to keep identity data separate
       * from credentials.
       */
      if (storedToken) {
        setHasStarted(true);
      }
    } catch (error) {
      console.error(
        "Failed to restore authentication session:",
        error
      );
    } finally {
      setLoading(false);
      setHasStarted(true);
      setHydrated(true);
    }
  }, []);


  // =======================================================
  // NORMALIZE USER
  // =======================================================

  const normalizeUser = (
    u
  ) => ({
    id:
      u?.id ||
      u?._id ||
      u?.user_id ||
      "",

    fullName:
      u?.full_name ||
      u?.fullName ||
      "Guest User",

    contact:
      u?.contact ||
      u?.phone ||
      u?.id ||
      "guest",

    role:
      u?.role ||
      "guest",

    roles:
      Array.isArray(
        u?.roles
      )
        ? u.roles
        : u?.role
          ? [u.role]
          : ["guest"],

    verified:
      Boolean(
        u?.verified
      ),

    apiKey:
      u?.apiKey ||
      u?.api_key ||
      "",

    /*
     * Existing RevelaCode-specific data.
     */
    history:
      u?.history ||
      [],

    /*
     * Useful authentication metadata.
     */
    tokenType:
      u?.tokenType ||
      u?.token_type ||
      "Bearer",

    expiresIn:
      u?.expiresIn ||
      u?.expires_in ||
      0,
  });


  // =======================================================
  // LOGIN
  // =======================================================

  const login = (
    userData
  ) => {
    if (!userData) {
      return;
    }

    const normalizedUser =
      normalizeUser(
        userData
      );

    const accessToken =
      userData?.accessToken ||
      userData?.access_token ||
      "";

    const tokenType =
      userData?.tokenType ||
      userData?.token_type ||
      "Bearer";

    setUser(
      normalizedUser
    );

    setIsGuest(false);

    setHasStarted(true);

    /*
     * Persist identity.
     */
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: normalizedUser,
        isGuest: false,
      })
    );

    /*
     * Persist JWT separately.
     */
    if (accessToken) {
      localStorage.setItem(
        TOKEN_KEY,
        accessToken
      );

      localStorage.setItem(
        TOKEN_TYPE_KEY,
        tokenType
      );
    }
  };


  // =======================================================
  // GUEST MODE
  // =======================================================

  const guestMode = () => {
    const guestUser = {
      id: "guest",
      fullName: "Guest User",
      contact: "guest",
      role: "guest",
      roles: ["guest"],
      verified: false,
      apiKey: "",
      history: [],
      tokenType: "",
      expiresIn: 0,
    };

    setUser(
      guestUser
    );

    setIsGuest(true);

    setHasStarted(true);

    /*
     * A guest must never retain an old JWT.
     */
    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      TOKEN_TYPE_KEY
    );

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: guestUser,
        isGuest: true,
      })
    );
  };


  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = () => {
    setUser(null);

    setIsGuest(false);

    setHasStarted(false);

    /*
     * Remove both session identity
     * and authentication credentials.
     */
    localStorage.removeItem(
      STORAGE_KEY
    );

    localStorage.removeItem(
      TOKEN_KEY
    );

    localStorage.removeItem(
      TOKEN_TYPE_KEY
    );
  };


  // =======================================================
  // GET ACCESS TOKEN
  // =======================================================

  const getAccessToken = () => {
    return (
      localStorage.getItem(
        TOKEN_KEY
      ) || ""
    );
  };


  // =======================================================
  // GET TOKEN TYPE
  // =======================================================

  const getTokenType = () => {
    return (
      localStorage.getItem(
        TOKEN_TYPE_KEY
      ) || "Bearer"
    );
  };


  // =======================================================
  // AUTHENTICATED REQUEST
  // =======================================================

  const authFetch = async (
    url,
    options = {}
  ) => {
    const token =
      getAccessToken();

    const tokenType =
      getTokenType();

    const headers = {
      ...(options.headers || {}),
    };

    /*
     * Attach JSON content type only when
     * the request has a body that is not FormData.
     */
    if (
      options.body &&
      !(options.body instanceof FormData) &&
      !headers["Content-Type"]
    ) {
      headers["Content-Type"] =
        "application/json";
    }

    /*
     * Add JWT when authenticated.
     */
    if (
      token &&
      tokenType
    ) {
      headers.Authorization =
        `${tokenType} ${token}`;
    }

    const response =
      await fetch(
        url,
        {
          ...options,
          headers,
        }
      );

    /*
     * Automatic auth cleanup on explicit
     * unauthorized responses.
     */
    if (
      response.status === 401
    ) {
      localStorage.removeItem(
        TOKEN_KEY
      );

      localStorage.removeItem(
        TOKEN_TYPE_KEY
      );
    }

    return response;
  };


  // =======================================================
  // HAS AUTHENTICATED SESSION
  // =======================================================

  const isAuthenticated =
    Boolean(
      user &&
      !isGuest &&
      getAccessToken()
    );


  // =======================================================
  // PROVIDER
  // =======================================================

  return (
    <AuthContext.Provider
      value={{
        user,

        loading,

        isGuest,

        hasStarted,

        hydrated,

        isReady,

        isAuthenticated,

        login,

        guestMode,

        logout,

        getAccessToken,

        getTokenType,

        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}


// =========================================================
// HOOK
// =========================================================

export const useAuth =
  () => useContext(
    AuthContext
  );
