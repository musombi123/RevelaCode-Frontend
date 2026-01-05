// src/components/ui/Card.jsx
import React from 'react';

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white dark:bg-gray-800 border rounded-xl shadow ${className}`}>
      {children}
    </div>
  );
}

export function CardContent({ children, className = '' }) {
  return <div className={`p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`p-4 border-b font-semibold text-lg ${className}`}>
      {children}
    </div>
  );
}
