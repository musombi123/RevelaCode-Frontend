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
      try {
        const parsed = JSON.parse(stored);
        setUser(parsed.user);
        setIsGuest(parsed.isGuest);
        setHasStarted(true);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  /* ------------------ NORMALIZE USER ------------------ */
  const normalizeUser = (u) => ({
    fullName: u?.full_name || u?.fullName || "Guest User",
    contact: u?.contact || u?.id || "guest",
    role: u?.role || "guest",
    history: u?.history || [],
  });

  /* ------------------ LOGIN ------------------ */
  const login = (userData) => {
    const normalizedUser = normalizeUser(userData);
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
      fullName: "Guest User",
      contact: "guest",
      role: "guest",
      history: [],
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

/* ------------------ USE AUTH HOOK ------------------ */
export const useAuth = () => useContext(AuthContext);
