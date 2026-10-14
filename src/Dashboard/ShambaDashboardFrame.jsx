import React from "react";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";

/**
 * Keeps dashboard pages compatible with direct/standalone rendering while
 * allowing ShambaHub to provide the single shared workspace shell.
 */
export default function ShambaDashboardFrame({
  embedded = false,
  children,
  ...shellProps
}) {
  if (embedded) {
    return <>{children}</>;
  }

  return (
    <JumuiyaDashboardShell {...shellProps}>
      {children}
    </JumuiyaDashboardShell>
  );
}
