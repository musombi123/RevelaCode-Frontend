// src/components/ui/Select.jsx
import React from 'react';

export function Select({ value, onValueChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onValueChange(e.target.value)}
      className="border rounded px-3 py-2 dark:bg-gray-800 dark:text-white"
    >
      {children}
    </select>
  );
}

export function SelectTrigger({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function SelectValue({ placeholder }) {
  return <option disabled>{placeholder}</option>;
}

export function SelectContent({ children }) {
  return <>{children}</>;
}

export function SelectItem({ value, children }) {
  return <option value={value}>{children}</option>;
}
