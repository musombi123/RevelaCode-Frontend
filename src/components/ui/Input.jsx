// src/components/ui/Input.jsx
import React from 'react';

export function Input({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:border-blue-500 dark:bg-gray-800 dark:text-white ${className}`}
      {...props}
    />
  );
}
