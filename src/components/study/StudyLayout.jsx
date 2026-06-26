// components/study/StudyLayout.jsx

"use client";

import React from "react";

export default function StudyLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {children}
      </div>
    </div>
  );
}