import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [hasStarted, setHasStarted] = useState(false);

  const login = (data) => {
    setUser(data.user);
    setHasStarted(true);
  };

  const continueAsGuest = () => {
    setUser({ role: "guest" });
    setHasStarted(true);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hasStarted,
        login,
        continueAsGuest,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
