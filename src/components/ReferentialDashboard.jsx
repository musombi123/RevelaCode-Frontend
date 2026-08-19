// src/components/StudyDashboard.jsx

import React, {
  useCallback,
  useState,
} from "react";

import StudyLayout from "@/components/study/StudyLayout";
import StudyFeed from "@/components/study/StudyFeed";
import StudyReader from "@/components/study/StudyReader";

/* =========================================================
   MATERIAL ID NORMALIZER
========================================================= */

const resolveMaterialId = (material) => {
  if (!material) {
    return null;
  }

  return (
    material.id ??
    material._id ??
    material.material_id ??
    material.materialId ??
    null
  );
};

/* =========================================================
   DASHBOARD
========================================================= */

export default function StudyDashboard() {
  const [
    selectedMaterial,
    setSelectedMaterial,
  ] = useState(null);

  /* =======================================================
     OPEN MATERIAL
  ======================================================= */

  const handleOpenMaterial =
    useCallback((material) => {
      if (!material) {
        return;
      }

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
    }, []);

  /* =======================================================
     CLOSE READER
  ======================================================= */

  const handleBack =
    useCallback(() => {
      setSelectedMaterial(null);
    }, []);

  /* =======================================================
     READER MODE
  ======================================================= */

  if (selectedMaterial?.id) {
    return (
      <div
        className="
          flex
          h-full
          min-h-0
          min-w-0
          flex-col
          overflow-hidden
        "
      >
        <StudyReader
          materialId={
            selectedMaterial.id
          }
          material={
            selectedMaterial
          }
          onBack={handleBack}
        />
      </div>
    );
  }

  /* =======================================================
     FEED MODE
  ======================================================= */

  return (
    <div
      className="
        flex
        h-full
        min-h-0
        min-w-0
        flex-col
        overflow-hidden
      "
    >
      <StudyLayout>
        <StudyFeed
          onOpen={
            handleOpenMaterial
          }
        />
      </StudyLayout>
    </div>
  );
}
