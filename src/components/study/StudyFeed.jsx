// components/study/StudyFeed.jsx

"use client";

import React from "react";

import ProgressPanel from "./ProgressPanel";
import RecommendationsPanel from "./RecommendationsPanel";
import BookmarksPanel from "./BookmarksPanel";

export default function StudyFeed({ onOpen }) {
  return (
    <div className="space-y-8">
      <ProgressPanel />

      <RecommendationsPanel onOpen={onOpen} />

      <BookmarksPanel onOpen={onOpen} />
    </div>
  );
}