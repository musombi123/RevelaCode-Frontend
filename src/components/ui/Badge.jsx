import React from 'react';

export function Badge({ children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 ${className}`}
    >
      {children}
    </span>
  );
}
