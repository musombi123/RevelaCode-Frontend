// src/components/study/StudyDashboard.jsx

import React, {
  useCallback,
  useState,
} from "react";

import StudyLayout from "@/components/study/StudyLayout";
import StudyFeed from "@/components/study/StudyFeed";
import StudyReader from "@/components/study/StudyReader";

const resolveMaterialId = (material) => {
  if (!material) {
    return null;
  }

  const raw =
    material.id ??
    material._id ??
    material.material_id ??
    material.materialId ??
    null;

  return raw == null ? null : String(raw);
};

export default function StudyDashboard({
  user,
}) {
  const [
    selectedMaterial,
    setSelectedMaterial,
  ] = useState(null);

  const userId =
    user?.id ??
    user?._id ??
    user?.user_id ??
    user?.contact ??
    "guest";

  const handleOpen = useCallback(
    (material) => {
      const materialId =
        resolveMaterialId(material);

      if (!materialId) {
        console.error(
          "❌ Study material has no usable ID:",
          material
        );
        return;
      }

      setSelectedMaterial({
        ...material,
        id: materialId,
      });
    },
    []
  );

  const handleBack = useCallback(() => {
    setSelectedMaterial(null);
  }, []);

  if (selectedMaterial?.id) {
    return (
      <div
        className="
          h-full
          min-h-0
          min-w-0
          overflow-hidden
        "
      >
        <StudyReader
          materialId={
            selectedMaterial.id
          }
          userId={userId}
          initialMaterial={
            selectedMaterial
          }
          onBack={handleBack}
        />
      </div>
    );
  }

  return (
    <div
      className="
        h-full
        min-h-0
        min-w-0
        overflow-y-auto
      "
    >
      <StudyLayout>
        <StudyFeed
          userId={userId}
          onOpen={handleOpen}
        />
      </StudyLayout>
    </div>
  );
}
