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
    // Make sure keys match backend / StartModal
    const normalizedUser = {
      id: userData.id ?? userData.contact ?? null,
      contact: userData.contact ?? null,
      fullName: userData.fullName ?? userData.username ?? "User",
      role: userData.role ?? "normal",
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
      contact: "guest",
      fullName: "Guest User",
      role: "guest",
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
