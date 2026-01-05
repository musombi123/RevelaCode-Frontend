import React from 'react';

function BackButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition"
    >
      ← <span className="ml-1">Back</span>
    </button>
  );
}

export default BackButton;
