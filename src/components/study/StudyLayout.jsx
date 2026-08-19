// src/components/study/StudyLayout.jsx

import React from "react";

export default function StudyLayout({
  children,
}) {
  return (
    <div
      className="
        mx-auto
        w-full
        max-w-7xl
        px-3
        py-4
        sm:px-5
        sm:py-6
        lg:px-8
        lg:py-8
      "
    >
      {children}
    </div>
  );
}
