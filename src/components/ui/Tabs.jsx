// src/components/ui/Tabs.jsx
import React, { useState } from 'react';

/** Root Tabs container */
export function Tabs({ defaultValue, children, className = '' }) {
  const [activeTab, setActiveTab] = useState(defaultValue);

  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (
          React.isValidElement(child) &&
          ['TabsList', 'TabsContent'].includes(child.type.displayName)
        ) {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
}

/** Tab button list */
export function TabsList({ children, activeTab, setActiveTab, className = '' }) {
  return (
    <div className={`flex gap-2 mb-4 flex-wrap ${className}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child) && child.type.displayName === 'TabsTrigger') {
          return React.cloneElement(child, { activeTab, setActiveTab });
        }
        return child;
      })}
    </div>
  );
}
TabsList.displayName = 'TabsList';

/** Individual tab trigger button */
export function TabsTrigger({ value, activeTab, setActiveTab, children }) {
  const isActive = value === activeTab;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`px-4 py-2 rounded font-medium transition-colors ${
        isActive
          ? 'bg-blue-600 text-white shadow'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
      }`}
      aria-pressed={isActive}
      aria-selected={isActive}
      role="tab"
    >
      {children}
    </button>
  );
}
TabsTrigger.displayName = 'TabsTrigger';

/** Tab panel content */
export function TabsContent({ value, activeTab, children, className = '' }) {
  if (value !== activeTab) return null;

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}
TabsContent.displayName = 'TabsContent';
