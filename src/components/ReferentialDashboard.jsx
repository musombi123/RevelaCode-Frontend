"use client";

import React, { useState } from "react";

import StudyLayout from "@/components/study/StudyLayout";
import StudyFeed from "@/components/study/StudyFeed";
import StudyReader from "@/components/study/StudyReader";

export default function StudyDashboard() {
  const [selectedMaterial, setSelectedMaterial] = useState(null);

  if (selectedMaterial) {
    return (
      <StudyReader
        materialId={selectedMaterial.id}
        onBack={() => setSelectedMaterial(null)}
      />
    );
  }

  return (
    <StudyLayout>
      <StudyFeed
        onOpen={(material) => setSelectedMaterial(material)}
      />
    </StudyLayout>
  );
}