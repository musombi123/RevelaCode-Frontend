import React from 'react';

function DashboardCard({ onClick, title, Icon, color }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 rounded-lg text-white hover:scale-105 transform transition ${color} shadow-md dark:shadow dark:shadow-black/40`}
    >
      <Icon className="w-8 h-8 mb-1" />
      <span className="font-semibold text-base">{title}</span>
    </button>
  );
}

export default DashboardCard;
