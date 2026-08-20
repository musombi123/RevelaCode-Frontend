import React from "react";
import usePreferences from "./hooks/usePreferences.jsx";

export default function Layout({ children }) {
  const { fontSize } = usePreferences();

  const fontSizeClass =
    {
      sm: "text-sm",
      md: "text-base",
      lg: "text-lg",
    }[fontSize] || "text-base";

  return (
    <div
      className={`
        min-h-screen
        w-full
        overflow-x-hidden
        bg-slate-50
        text-slate-900
        transition-colors
        duration-300
        dark:bg-slate-950
        dark:text-slate-100
        ${fontSizeClass}
      `}
    >
      <div
        className="
          min-h-screen
          antialiased
          selection:bg-slate-900
          selection:text-white
          dark:selection:bg-white
          dark:selection:text-slate-900
        "
      >
        {children}
      </div>
    </div>
  );
}
