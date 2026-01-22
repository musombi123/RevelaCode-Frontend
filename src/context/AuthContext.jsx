import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const STORAGE_KEY = "revela_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [isGuest, setIsGuest] = useState(false);

  /* ------------------ LOAD SESSION ------------------ */
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed.user);
      setIsGuest(parsed.isGuest);
      setHasStarted(true);
    }
  }, []);

  /* ------------------ LOGIN ------------------ */
  const login = (userData) => {
    const normalizedUser = {
      id: userData.id ?? null,
      username: userData.username ?? userData.email ?? "User",
      role: userData.role ?? "user",
    };

    setUser(normalizedUser);
    setIsGuest(false);
    setHasStarted(true);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: normalizedUser, isGuest: false })
    );
  };

  /* ------------------ GUEST ------------------ */
  const continueAsGuest = () => {
    const guestUser = {
      id: "guest",
      username: "Guest",
      role: "guest",
      isGuest: true,
    };

    setUser(guestUser);
    setIsGuest(true);
    setHasStarted(true);

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ user: guestUser, isGuest: true })
    );
  };

  /* ------------------ LOGOUT ------------------ */
  const logout = () => {
    setUser(null);
    setIsGuest(false);
    setHasStarted(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isGuest,
        hasStarted,
        login,
        continueAsGuest,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
