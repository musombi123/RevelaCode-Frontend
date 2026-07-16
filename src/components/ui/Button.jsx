// src/components/ui/Button.jsx
import React from 'react';

export function Button({ children, className = '', ...props }) {
  return (
    <button
      className={`w-full sm:w-auto px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
