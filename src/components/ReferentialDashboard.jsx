import React, {
  useCallback,
  useState,
} from "react";

import {
  BookOpen,
  ArrowLeft,
} from "lucide-react";

import StudyLayout from "@/components/study/StudyLayout";
import StudyFeed from "@/components/study/StudyFeed";
import StudyReader from "@/components/study/StudyReader";

/* =========================================================
   MATERIAL ID
========================================================= */

const resolveMaterialId = (material) => {
  if (!material) return null;

  const raw =
    material.id ??
    material._id ??
    material.material_id ??
    material.materialId ??
    null;

  return raw == null ? null : String(raw);
};

/* =========================================================
   DASHBOARD
========================================================= */

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

  /* =======================================================
     OPEN MATERIAL
  ======================================================= */

  const handleOpen = useCallback(
    (material) => {
      const materialId =
        resolveMaterialId(material);

      if (!materialId) {
        console.error(
          "Study material has no usable ID:",
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

  /* =======================================================
     BACK TO FEED
  ======================================================= */

  const handleBack = useCallback(() => {
    setSelectedMaterial(null);
  }, []);

  /* =======================================================
     READER
  ======================================================= */

  if (selectedMaterial?.id) {
    return (
      <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
        {/* Reader header */}
        <div className="flex-shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
          <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
            <button
              type="button"
              onClick={handleBack}
              className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              aria-label="Back to study materials"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
                <BookOpen className="h-4 w-4 text-blue-500" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                  Study
                </p>

                <h2 className="truncate text-sm font-bold text-slate-900 dark:text-white sm:text-base">
                  {selectedMaterial.title ||
                    "Study Material"}
                </h2>
              </div>
            </div>
          </div>
        </div>

        {/* Reader */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <StudyReader
            materialId={selectedMaterial.id}
            userId={userId}
            initialMaterial={selectedMaterial}
            onBack={handleBack}
          />
        </div>
      </section>
    );
  }

  /* =======================================================
     STUDY FEED
  ======================================================= */

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-slate-50 dark:bg-slate-950">
      {/* Study header */}
      <div className="flex-shrink-0 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/30">
            <BookOpen className="h-5 w-5 text-blue-500" />
          </div>

          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
              RevelaCode
            </p>

            <h1 className="truncate text-lg font-black tracking-tight text-slate-900 dark:text-white sm:text-xl">
              Study Workspace
            </h1>

            <p className="hidden text-xs text-slate-400 sm:block">
              Learn, organize, and explore your study materials.
            </p>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        <StudyLayout>
          <StudyFeed
            userId={userId}
            onOpen={handleOpen}
          />
        </StudyLayout>
      </div>
    </section>
  );
}
