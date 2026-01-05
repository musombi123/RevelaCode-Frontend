import React from 'react';

export function Avatar({ children, className = '', ...props }) {
  return (
    <div
      className={`relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function AvatarImage({ src, alt = 'Avatar', className = '' }) {
  if (!src) return null;
  return (
    <img
      src={src}
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
    />
  );
}

export function AvatarFallback({ children, className = '' }) {
  return (
    <span
      className={`flex h-full w-full items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300 ${className}`}
    >
      {children}
    </span>
  );
}
