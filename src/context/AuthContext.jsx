import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// =========================================================
// CONTEXT
// =========================================================

const AuthContext = createContext(null);

const STORAGE_KEY = "revela_auth";
const TOKEN_KEY = "revelacode_access_token";
const TOKEN_TYPE_KEY = "revelacode_token_type";

// Compatibility keys used by older frontend code.
const LEGACY_TOKEN_KEY = "access_token";
const LEGACY_TOKEN_ALIAS = "token";


// =========================================================
// PROVIDER
// =========================================================

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [loading, setLoading] = useState(true);


  const isReady =
    hasStarted &&
    hydrated;


  // =======================================================
  // TOKEN HELPERS
  // =======================================================

  const readAccessToken = useCallback(() => {
    return (
      localStorage.getItem(TOKEN_KEY) ||
      localStorage.getItem(LEGACY_TOKEN_KEY) ||
      localStorage.getItem(LEGACY_TOKEN_ALIAS) ||
      ""
    );
  }, []);


  const readTokenType = useCallback(() => {
    return (
      localStorage.getItem(TOKEN_TYPE_KEY) ||
      "Bearer"
    );
  }, []);


  const persistToken = useCallback(
    (accessToken, tokenType = "Bearer") => {
      if (!accessToken) {
        return false;
      }

      const normalizedTokenType =
        tokenType || "Bearer";

      /*
       * Canonical storage.
       */
      localStorage.setItem(
        TOKEN_KEY,
        accessToken
      );

      localStorage.setItem(
        TOKEN_TYPE_KEY,
        normalizedTokenType
      );

      /*
       * Compatibility storage for older
       * RevelaCode frontend code.
       */
      localStorage.setItem(
        LEGACY_TOKEN_KEY,
        accessToken
      );

      localStorage.setItem(
        LEGACY_TOKEN_ALIAS,
        accessToken
      );

      return true;
    },
    []
  );


  const clearToken = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_TYPE_KEY);

    localStorage.removeItem(LEGACY_TOKEN_KEY);
    localStorage.removeItem(LEGACY_TOKEN_ALIAS);
  }, []);


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
        readAccessToken();

      if (stored) {
        try {
          const parsed =
            JSON.parse(stored);

          if (parsed?.user) {
            setUser(parsed.user);
          }

          setIsGuest(
            Boolean(
              parsed?.isGuest
            )
          );
        } catch (error) {
          console.warn(
            "Invalid stored authentication session. Clearing it.",
            error
          );

          localStorage.removeItem(
            STORAGE_KEY
          );
        }
      }

      /*
       * A persisted JWT means the application
       * has an authenticated session available.
       */
      if (storedToken) {
        setHasStarted(true);
      } else {
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
  }, [readAccessToken]);


  // =======================================================
  // NORMALIZE USER
  // =======================================================

  const normalizeUser = useCallback((u) => {
    return {
      id:
        u?.id ||
        u?._id ||
        u?.user_id ||
        "",

      fullName:
        u?.full_name ||
        u?.fullName ||
        u?.name ||
        "Guest User",

      contact:
        u?.contact ||
        u?.phone ||
        u?.email ||
        u?.id ||
        "guest",

      role:
        u?.role ||
        "guest",

      roles:
        Array.isArray(u?.roles)
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

      history:
        u?.history ||
        [],

      tokenType:
        u?.tokenType ||
        u?.token_type ||
        "Bearer",

      expiresIn:
        u?.expiresIn ||
        u?.expires_in ||
        0,
    };
  }, []);


  // =======================================================
  // LOGIN
  // =======================================================

  const login = useCallback(
    (payload) => {
      if (!payload) {
        throw new Error(
          "Authentication payload is missing."
        );
      }

      /*
       * Support all common response shapes.
       *
       * Shape 1:
       * {
       *   user,
       *   accessToken
       * }
       *
       * Shape 2:
       * {
       *   user,
       *   access_token
       * }
       *
       * Shape 3:
       * {
       *   data: {
       *     user,
       *     access_token
       *   }
       * }
       *
       * Shape 4:
       * {
       *   data: {
       *     data: {
       *       user,
       *       access_token
       *     }
       *   }
       * }
       */

      const root =
        payload || {};

      const level1 =
        root?.data || {};

      const level2 =
        level1?.data || {};

      const userData =
        root?.user ||
        level1?.user ||
        level2?.user ||
        root?.account ||
        level1?.account ||
        {};

      const accessToken =
        root?.accessToken ||
        root?.access_token ||
        root?.token ||
        level1?.accessToken ||
        level1?.access_token ||
        level1?.token ||
        level2?.accessToken ||
        level2?.access_token ||
        level2?.token ||
        userData?.accessToken ||
        userData?.access_token ||
        userData?.token ||
        "";

      const tokenType =
        root?.tokenType ||
        root?.token_type ||
        level1?.tokenType ||
        level1?.token_type ||
        level2?.tokenType ||
        level2?.token_type ||
        userData?.tokenType ||
        userData?.token_type ||
        "Bearer";


      /*
       * A normal authenticated session must have
       * an access token.
       */
      if (!accessToken) {
        console.error(
          "Login payload received without access token:",
          payload
        );

        throw new Error(
          "Login succeeded but no access token was returned by the backend."
        );
      }


      const normalizedUser =
        normalizeUser(
          userData
        );


      /*
       * Update React state.
       */
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
       * Persist JWT.
       */
      persistToken(
        accessToken,
        tokenType
      );


      /*
       * Verify persistence immediately.
       */
      const storedToken =
        localStorage.getItem(
          TOKEN_KEY
        );

      if (!storedToken) {
        throw new Error(
          "Access token could not be persisted in localStorage."
        );
      }

      return {
        user: normalizedUser,
        accessToken: storedToken,
        tokenType:
          localStorage.getItem(
            TOKEN_TYPE_KEY
          ) || "Bearer",
      };
    },
    [normalizeUser, persistToken]
  );


  // =======================================================
  // GUEST MODE
  // =======================================================

  const guestMode = useCallback(() => {
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

    setUser(guestUser);
    setIsGuest(true);
    setHasStarted(true);

    /*
     * Guests must never retain
     * an authenticated JWT.
     */
    clearToken();

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        user: guestUser,
        isGuest: true,
      })
    );
  }, [clearToken]);


  // =======================================================
  // LOGOUT
  // =======================================================

  const logout = useCallback(() => {
    setUser(null);
    setIsGuest(false);
    setHasStarted(false);

    localStorage.removeItem(
      STORAGE_KEY
    );

    clearToken();
  }, [clearToken]);


  // =======================================================
  // GET ACCESS TOKEN
  // =======================================================

  const getAccessToken = useCallback(() => {
    return readAccessToken();
  }, [readAccessToken]);


  // =======================================================
  // GET TOKEN TYPE
  // =======================================================

  const getTokenType = useCallback(() => {
    return readTokenType();
  }, [readTokenType]);


  // =======================================================
  // AUTHENTICATED REQUEST
  // =======================================================

  const authFetch = useCallback(
    async (
      url,
      options = {}
    ) => {
      const token =
        getAccessToken();

      const tokenType =
        getTokenType();

      /*
       * Use Headers instead of a plain object.
       * This handles Headers instances and different
       * casing of HTTP header names safely.
       */
      const headers =
        new Headers(
          options.headers || {}
        );


      /*
       * Add JSON content type only when there
       * is a body and it is not FormData.
       */
      if (
        options.body &&
        !(
          options.body instanceof
          FormData
        ) &&
        !headers.has(
          "Content-Type"
        )
      ) {
        headers.set(
          "Content-Type",
          "application/json"
        );
      }


      /*
       * Attach JWT.
       *
       * Do not overwrite an explicitly supplied
       * Authorization header.
       */
      if (
        token &&
        tokenType &&
        !headers.has(
          "Authorization"
        )
      ) {
        headers.set(
          "Authorization",
          `${tokenType} ${token}`
        );
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
       * Only remove authentication credentials
       * when the backend explicitly says the
       * credentials are unauthorized.
       */
      if (
        response.status === 401
      ) {
        clearToken();

        /*
         * Keep identity state consistent with
         * the removed credentials.
         */
        setUser(null);
        setIsGuest(false);
      }

      return response;
    },
    [
      getAccessToken,
      getTokenType,
      clearToken,
    ]
  );


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

export const useAuth = () =>
  useContext(
    AuthContext
  );
