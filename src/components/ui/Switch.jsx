// src/components/ui/Switch.jsx
import React from 'react';

export function Switch({ checked, onCheckedChange }) {
  return (
    <label className="inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange(e.target.checked)}
        className="sr-only"
      />
      <span className="w-10 h-5 bg-gray-300 rounded-full shadow-inner flex items-center transition dark:bg-gray-600">
        <span
          className={`w-5 h-5 bg-white rounded-full shadow transform transition ${checked ? 'translate-x-5' : ''}`}
        />
      </span>
    </label>
  );
}
