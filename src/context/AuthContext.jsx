import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();
const STORAGE_KEY = "revela_auth";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

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
      contact: userData.contact ?? userData.id ?? "guest",
      fullName: userData.fullName ?? userData.username ?? "Guest User",
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

  /* ------------------ GUEST MODE ------------------ */
  const guestMode = () => {
    const guestUser = {
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
        guestMode,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
