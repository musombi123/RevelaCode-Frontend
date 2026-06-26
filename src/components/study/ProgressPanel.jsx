// components/study/ProgressPanel.jsx

"use client";

import React from "react";
import { BookOpen, TrendingUp } from "lucide-react";

import { Card, CardContent } from "@/components/ui/Card";

export default function ProgressPanel() {
  const progress = 35;

  return (
    <Card>
      <CardContent className="p-6">
        <h2 className="mb-5 text-xl font-bold">
          Learning Progress
        </h2>

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              <p>Lessons Completed</p>
            </div>

            <p className="font-semibold">12</p>
          </div>

          <div className="h-3 w-full rounded-full bg-gray-200">
            <div
              className="h-3 rounded-full bg-indigo-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="flex items-center gap-2 text-gray-700">
            <TrendingUp className="h-5 w-5 text-indigo-600" />
            <p>{progress}% complete</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}