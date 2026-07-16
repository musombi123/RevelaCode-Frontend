import React, { createContext, useContext, useState } from "react";

const PopoverContext = createContext();

export function Popover({ children }) {
  const [open, setOpen] = useState(false);

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      <div className="relative inline-block">
        {children}
      </div>
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children, asChild = false }) {
  const { open, setOpen } = useContext(PopoverContext);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => setOpen(!open),
    });
  }

  return (
    <button onClick={() => setOpen(!open)}>
      {children}
    </button>
  );
}

export function PopoverContent({
  children,
  className = "",
  align = "start",
}) {
  const { open } = useContext(PopoverContext);

  if (!open) return null;

  const alignment =
    align === "end" ? "right-0" : align === "center" ? "left-1/2 -translate-x-1/2" : "left-0";

  return (
    <div
      className={`absolute mt-2 ${alignment} z-50 rounded-xl border bg-white dark:bg-gray-800 shadow-xl ${className}`}
    >
      {children}
    </div>
  );
}