import React from 'react';
import { cn } from '@/lib/utils'; // optional: if you have className merge util

export default function DashboardCard({ title, Icon, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-4 rounded-xl shadow-sm',
        'bg-white dark:bg-gray-800 hover:shadow-md transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-full flex items-center justify-center text-white mb-2',
          color || 'bg-indigo-600'
        )}
      >
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{title}</p>
    </button>
  );
}
