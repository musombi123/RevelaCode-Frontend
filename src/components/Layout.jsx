import React from "react";
import usePreferences from "./hooks/usePreferences.jsx";

export default function Layout({ children }) {
  const { fontSize } = usePreferences();

  const fontSizeClass = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[fontSize] || "text-base";

  return (
    <div className={"min-h-dvh w-full overflow-x-hidden bg-app text-fg transition-colors " + fontSizeClass}>
      <div className="min-h-dvh antialiased">
        {children}
      </div>
    </div>
  );
}
