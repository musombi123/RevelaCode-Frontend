// src/components/ui/Popover.jsx
import React, { useState } from 'react';

export function Popover({ children, trigger }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <div onClick={() => setOpen(!open)}>
        {trigger}
      </div>
      {open && (
        <div className="absolute z-10 mt-2 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2">
          {children}
        </div>
      )}
    </div>
  );
}

export const PopoverTrigger = ({ children, onClick }) => (
  <div onClick={onClick}>{children}</div>
);

export const PopoverContent = ({ children }) => (
  <div>{children}</div>
);
