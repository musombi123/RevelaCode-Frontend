// src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

/* =========================================================
   CONTEXT
========================================================= */

const AuthContext =
  createContext(null);

const STORAGE_KEY =
  "revela_auth";

const TOKEN_KEY =
  "revelacode_access_token";

const TOKEN_TYPE_KEY =
  "revelacode_token_type";

/*
 * Compatibility keys used by older
 * RevelaCode frontend code.
 */
const LEGACY_TOKEN_KEY =
  "access_token";

const LEGACY_TOKEN_ALIAS =
  "token";


/* =========================================================
   PROVIDER
========================================================= */

export function AuthProvider({
  children,
}) {
  const [
    user,
    setUser,
  ] = useState(null);

  const [
    isGuest,
    setIsGuest,
  ] = useState(false);

  const [
    hasStarted,
    setHasStarted,
  ] = useState(false);

  const [
    hydrated,
    setHydrated,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);


  const isReady =
    hasStarted &&
    hydrated;


  /* =======================================================
     TOKEN HELPERS
  ======================================================= */

  const readAccessToken =
    useCallback(() => {
      try {
        return (
          localStorage.getItem(
            TOKEN_KEY
          ) ||
          localStorage.getItem(
            LEGACY_TOKEN_KEY
          ) ||
          localStorage.getItem(
            LEGACY_TOKEN_ALIAS
          ) ||
          ""
        );
      } catch {
        return "";
      }
    }, []);


  const readTokenType =
    useCallback(() => {
      try {
        return (
          localStorage.getItem(
            TOKEN_TYPE_KEY
          ) ||
          "Bearer"
        );
      } catch {
        return "Bearer";
      }
    }, []);


  const persistToken =
    useCallback(
      (
        accessToken,
        tokenType = "Bearer"
      ) => {
        if (!accessToken) {
          return false;
        }

        const normalizedTokenType =
          tokenType ||
          "Bearer";

        try {
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
           * Compatibility storage.
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
        } catch (error) {
          console.error(
            "Failed to persist authentication token:",
            error
          );

          return false;
        }
      },
      []
    );


  const clearToken =
    useCallback(() => {
      try {
        localStorage.removeItem(
          TOKEN_KEY
        );

        localStorage.removeItem(
          TOKEN_TYPE_KEY
        );

        localStorage.removeItem(
          LEGACY_TOKEN_KEY
        );

        localStorage.removeItem(
          LEGACY_TOKEN_ALIAS
        );
      } catch (error) {
        console.warn(
          "Failed to clear authentication tokens:",
          error
        );
      }
    }, []);


  /* =======================================================
     LOAD SESSION
  ======================================================= */

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
            JSON.parse(
              stored
            );

          if (
            parsed?.user
          ) {
            setUser(
              parsed.user
            );
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

          setUser(null);
          setIsGuest(false);
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
  }, [
    readAccessToken,
  ]);


  /* =======================================================
     NORMALIZE USER
  ======================================================= */

  const normalizeUser =
    useCallback(
      (u = {}) => {
        /*
         * Resolve all supported naming conventions.
         */

        const id =
          u?.id ||
          u?._id ||
          u?.user_id ||
          u?.userId ||
          "";

        const fullName =
          u?.fullName ||
          u?.full_name ||
          u?.name ||
          u?.displayName ||
          u?.display_name ||
          u?.username ||
          "";

        const contact =
          u?.contact ||
          u?.phone ||
          u?.email ||
          u?.mobile ||
          u?.id ||
          "guest";

        const role =
          u?.role ||
          "user";

        const roles =
          Array.isArray(
            u?.roles
          )
            ? u.roles
            : role
              ? [role]
              : ["user"];

        return {
          /*
           * Preserve the original backend
           * fields as well.
           */
          ...u,

          id,

          _id:
            u?._id ||
            id,

          user_id:
            u?.user_id ||
            id,

          userId:
            u?.userId ||
            id,

          /*
           * Canonical frontend name.
           */
          fullName:
            fullName ||
            "Guest User",

          /*
           * Keep backend-compatible
           * aliases too.
           */
          full_name:
            u?.full_name ||
            fullName ||
            "",

          name:
            u?.name ||
            fullName ||
            "",

          displayName:
            u?.displayName ||
            fullName ||
            "",

          display_name:
            u?.display_name ||
            fullName ||
            "",

          contact,

          role,

          roles,

          verified:
            Boolean(
              u?.verified ??
              u?.is_verified ??
              false
            ),

          apiKey:
            u?.apiKey ||
            u?.api_key ||
            "",

          api_key:
            u?.api_key ||
            u?.apiKey ||
            "",

          history:
            Array.isArray(
              u?.history
            )
              ? u.history
              : [],

          tokenType:
            u?.tokenType ||
            u?.token_type ||
            "Bearer",

          token_type:
            u?.token_type ||
            u?.tokenType ||
            "Bearer",

          expiresIn:
            u?.expiresIn ||
            u?.expires_in ||
            0,

          expires_in:
            u?.expires_in ||
            u?.expiresIn ||
            0,

          accessToken:
            u?.accessToken ||
            u?.access_token ||
            "",

          access_token:
            u?.access_token ||
            u?.accessToken ||
            "",
        };
      },
      []
    );


  /* =======================================================
     RESOLVE USER FROM PAYLOAD
  ======================================================= */

  const resolveUserData =
    useCallback(
      (payload = {}) => {
        const root =
          payload || {};

        const level1 =
          root?.data &&
          typeof root.data ===
            "object"
            ? root.data
            : {};

        const level2 =
          level1?.data &&
          typeof level1.data ===
            "object"
            ? level1.data
            : {};

        /*
         * First preference:
         * Explicit nested user/account.
         */

        const nestedUser =
          root?.user ||
          level1?.user ||
          level2?.user ||
          root?.account ||
          level1?.account ||
          level2?.account;

        if (
          nestedUser &&
          typeof nestedUser ===
            "object"
        ) {
          return nestedUser;
        }

        /*
         * Second preference:
         *
         * The payload itself may already be the
         * normalized user object.
         *
         * This is exactly what the current
         * StartModal sends to login():
         *
         * {
         *   fullName,
         *   contact,
         *   role,
         *   accessToken
         * }
         */

        const hasIdentityFields =
          Boolean(
            root?.fullName ||
            root?.full_name ||
            root?.name ||
            root?.displayName ||
            root?.display_name ||
            root?.contact ||
            root?.email ||
            root?.phone ||
            root?.id ||
            root?._id
          );

        if (
          hasIdentityFields
        ) {
          return root;
        }

        /*
         * Third preference:
         * data itself can be the user object.
         */

        const level1HasIdentity =
          Boolean(
            level1?.fullName ||
            level1?.full_name ||
            level1?.name ||
            level1?.displayName ||
            level1?.display_name ||
            level1?.contact ||
            level1?.email ||
            level1?.phone ||
            level1?.id ||
            level1?._id
          );

        if (
          level1HasIdentity
        ) {
          return level1;
        }

        /*
         * Fourth preference:
         * deeply nested data.
         */

        const level2HasIdentity =
          Boolean(
            level2?.fullName ||
            level2?.full_name ||
            level2?.name ||
            level2?.displayName ||
            level2?.display_name ||
            level2?.contact ||
            level2?.email ||
            level2?.phone ||
            level2?.id ||
            level2?._id
          );

        if (
          level2HasIdentity
        ) {
          return level2;
        }

        return {};
      },
      []
    );


  /* =======================================================
     RESOLVE TOKEN
  ======================================================= */

  const resolveAccessToken =
    useCallback(
      (payload = {}) => {
        const root =
          payload || {};

        const level1 =
          root?.data || {};

        const level2 =
          level1?.data || {};

        const userData =
          resolveUserData(
            payload
          );

        return (
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

          ""
        );
      },
      [
        resolveUserData,
      ]
    );


  /* =======================================================
     RESOLVE TOKEN TYPE
  ======================================================= */

  const resolveTokenType =
    useCallback(
      (payload = {}) => {
        const root =
          payload || {};

        const level1 =
          root?.data || {};

        const level2 =
          level1?.data || {};

        const userData =
          resolveUserData(
            payload
          );

        return (
          root?.tokenType ||
          root?.token_type ||

          level1?.tokenType ||
          level1?.token_type ||

          level2?.tokenType ||
          level2?.token_type ||

          userData?.tokenType ||
          userData?.token_type ||

          "Bearer"
        );
      },
      [
        resolveUserData,
      ]
    );


  /* =======================================================
     LOGIN
  ======================================================= */

  const login =
    useCallback(
      (payload) => {
        if (!payload) {
          throw new Error(
            "Authentication payload is missing."
          );
        }

        /*
         * Resolve the actual user regardless of
         * whether it is nested or already flattened.
         */
        const userData =
          resolveUserData(
            payload
          );

        /*
         * Resolve JWT.
         */
        const accessToken =
          resolveAccessToken(
            payload
          );

        /*
         * Resolve token type.
         */
        const tokenType =
          resolveTokenType(
            payload
          );

        /*
         * Authenticated sessions MUST contain
         * a token.
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

        /*
         * Normalize user identity.
         */
        const normalizedUser =
          normalizeUser(
            userData
          );

        /*
         * Guard against accidentally creating a
         * Guest User for an authenticated payload.
         */
        if (
          normalizedUser.fullName ===
            "Guest User" &&
          !normalizedUser.contact &&
          !normalizedUser.id
        ) {
          console.warn(
            "Authenticated token received but no user identity was found.",
            {
              payload,
              userData,
            }
          );
        }

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
        try {
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              user:
                normalizedUser,
              isGuest: false,
            })
          );
        } catch (error) {
          console.error(
            "Failed to persist user identity:",
            error
          );

          throw new Error(
            "Authentication succeeded, but the user session could not be stored."
          );
        }

        /*
         * Persist JWT.
         */
        const tokenStored =
          persistToken(
            accessToken,
            tokenType
          );

        if (!tokenStored) {
          throw new Error(
            "Access token could not be persisted in localStorage."
          );
        }

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

        /*
         * Helpful development logging.
         */
        console.info(
          "✅ RevelaCode authentication established.",
          {
            authenticated:
              true,

            tokenStored:
              true,

            tokenType,

            userId:
              normalizedUser.id,

            fullName:
              normalizedUser.fullName,

            contact:
              normalizedUser.contact,

            role:
              normalizedUser.role,

            hasToken:
              Boolean(
                storedToken
              ),
          }
        );

        return {
          user:
            normalizedUser,

          accessToken:
            storedToken,

          tokenType:
            localStorage.getItem(
              TOKEN_TYPE_KEY
            ) ||
            "Bearer",
        };
      },
      [
        normalizeUser,
        persistToken,
        resolveAccessToken,
        resolveTokenType,
        resolveUserData,
      ]
    );


  /* =======================================================
     GUEST MODE
  ======================================================= */

  const guestMode =
    useCallback(() => {
      const guestUser = {
        id: "guest",

        fullName:
          "Guest User",

        full_name:
          "Guest User",

        name:
          "Guest User",

        contact:
          "guest",

        role:
          "guest",

        roles: [
          "guest",
        ],

        verified:
          false,

        apiKey:
          "",

        api_key:
          "",

        history:
          [],

        tokenType:
          "",

        token_type:
          "",

        expiresIn:
          0,

        expires_in:
          0,
      };

      setUser(
        guestUser
      );

      setIsGuest(true);
      setHasStarted(true);

      /*
       * Guests must never retain
       * an authenticated JWT.
       */
      clearToken();

      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            user:
              guestUser,

            isGuest:
              true,
          })
        );
      } catch (error) {
        console.error(
          "Failed to persist guest session:",
          error
        );
      }
    }, [
      clearToken,
    ]);


  /* =======================================================
     LOGOUT
  ======================================================= */

  const logout =
    useCallback(() => {
      setUser(null);

      setIsGuest(false);

      setHasStarted(false);

      try {
        localStorage.removeItem(
          STORAGE_KEY
        );
      } catch {
        // Ignore.
      }

      clearToken();
    }, [
      clearToken,
    ]);


  /* =======================================================
     GET ACCESS TOKEN
  ======================================================= */

  const getAccessToken =
    useCallback(() => {
      return readAccessToken();
    }, [
      readAccessToken,
    ]);


  /* =======================================================
     GET TOKEN TYPE
  ======================================================= */

  const getTokenType =
    useCallback(() => {
      return readTokenType();
    }, [
      readTokenType,
    ]);


  /* =======================================================
     AUTHENTICATED REQUEST
  ======================================================= */

  const authFetch =
    useCallback(
      async (
        url,
        options = {}
      ) => {
        const token =
          getAccessToken();

        const tokenType =
          getTokenType();

        /*
         * Headers safely support:
         * - plain objects
         * - Headers instances
         * - different header casing
         */
        const headers =
          new Headers(
            options.headers || {}
          );

        /*
         * Set JSON content type only when appropriate.
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
         * Attach JWT unless the caller explicitly
         * supplied Authorization.
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
         * A real 401 means the backend rejected
         * the current credentials.
         */
        if (
          response.status ===
          401
        ) {
          clearToken();

          /*
           * Remove the stale identity too.
           */
          try {
            localStorage.removeItem(
              STORAGE_KEY
            );
          } catch {
            // Ignore.
          }

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


  /* =======================================================
     AUTHENTICATED SESSION
  ======================================================= */

  const isAuthenticated =
    Boolean(
      user &&
      !isGuest &&
      getAccessToken()
    );


  /* =======================================================
     PROVIDER
  ======================================================= */

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


/* =========================================================
   HOOK
========================================================= */

export const useAuth =
  () =>
    useContext(
      AuthContext
    );
