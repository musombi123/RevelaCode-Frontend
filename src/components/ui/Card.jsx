// src/components/ui/Card.jsx
import React from 'react';

export function Card({
  children,
  className = '',
  onClick,
  onKeyDown,
  role,
  tabIndex,
  ...rest
}) {
  const interactive = typeof onClick === 'function';

  const handleKeyDown = (event) => {
    onKeyDown?.(event);
    if (!interactive || event.defaultPrevented) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(event);
    }
  };

  return (
    <div
      {...rest}
      className={`bg-white dark:bg-gray-800 border rounded-xl shadow ${className}`}
      onClick={interactive ? onClick : undefined}
      onKeyDown={interactive ? handleKeyDown : onKeyDown}
      role={role ?? (interactive ? 'button' : undefined)}
      tabIndex={tabIndex ?? (interactive ? 0 : undefined)}
    >
      {children}
    </div>
  );
}

export function CardContent({ children, className = '', ...rest }) {
  return <div {...rest} className={`p-4 ${className}`}>{children}</div>;
}

export function CardHeader({ children, className = '', ...rest }) {
  return (
    <div {...rest} className={`p-4 border-b font-semibold text-lg ${className}`}>
      {children}
    </div>
  );
}
