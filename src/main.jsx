import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { ThemeProvider } from "./components/hooks/useTheme.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { HistoryProvider } from "./context/HistoryContext.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <HistoryProvider>
          <App />
        </HistoryProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
