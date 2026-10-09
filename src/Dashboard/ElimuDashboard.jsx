
import React, { useCallback, useEffect, useState } from "react";

import { LoaderCircle } from "lucide-react";

import { useAuth } from "@/context/AuthContext.jsx";
import { useJumuiyaApi } from "@/services/jumuiyaApi.jsx";
import JumuiyaDashboardShell from "@/Dashboard/JumuiyaDashboardShell.jsx";
import ElimuSchoolAccess from "@/Dashboard/ElimuSchoolAccess.jsx";
import ElimuDashboardWorkspace from "@/Dashboard/ElimuDashboardWorkspace.jsx";

export default function ElimuDashboard({ onNavigate }) {
  const { user } = useAuth();

  const {
    getElimuAccess,
    getSchool,
    saveSchool,
    createElimuDemoSchool,
  } = useJumuiyaApi();

  const [access, setAccess] = useState(null);
  const [school, setSchool] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const loadAccess = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const accessResult = await getElimuAccess();

      let schoolResult = null;

      try {
        schoolResult = await getSchool();
      } catch {
        // Access is authoritative. The school response may be unavailable
        // for a new account; the access endpoint can still provide its state.
      }

      if (!accessResult || typeof accessResult.allowed !== "boolean") {
        throw new Error(
          "The Elimu access endpoint returned an unexpected response.",
        );
      }

      setAccess(accessResult);
      setSchool(schoolResult || accessResult.school || null);
    } catch (err) {
      setAccess(null);
      setSchool(null);
      setError(
        err?.message || "Unable to check your Elimu account.",
      );
    } finally {
      setLoading(false);
    }
  }, [getElimuAccess, getSchool]);

  useEffect(() => {
    loadAccess();
  }, [loadAccess]);

  const submitApplication = useCallback(
    async (payload) => {
      setSaving(true);
      setActionError("");
      setSuccessMessage("");

      try {
        await saveSchool(payload);

        setSuccessMessage(
          "Your school application was submitted. Its features remain locked until verification is complete.",
        );

        await loadAccess();
      } catch (err) {
        setActionError(
          err?.message || "The school application could not be submitted.",
        );
      } finally {
        setSaving(false);
      }
    },
    [saveSchool, loadAccess],
  );

  const createDemo = useCallback(
    async (payload) => {
      setSaving(true);
      setActionError("");
      setSuccessMessage("");

      try {
        await createElimuDemoSchool(payload);

        setSuccessMessage(
          "Development demo created. This workspace is not a verified school.",
        );

        await loadAccess();
      } catch (err) {
        setActionError(
          err?.message || "The demo school could not be created.",
        );
      } finally {
        setSaving(false);
      }
    },
    [createElimuDemoSchool, loadAccess],
  );

  if (access?.allowed === true) {
    return (
      <ElimuDashboardWorkspace
        onNavigate={onNavigate}
        accountAccess={access}
        accountSchool={school || access.school || null}
      />
    );
  }

  return (
    <ElimuSchoolAccess
      user={user}
      access={access}
      school={school || access?.school || null}
      loading={loading}
      error={error}
      actionError={actionError}
      successMessage={successMessage}
      saving={saving}
      onRetry={loadAccess}
      onSubmitApplication={submitApplication}
      onCreateDemo={createDemo}
      allowDemo={
        import.meta.env.DEV ||
        import.meta.env.VITE_ELIMU_ENABLE_DEMO === "true"
      }
      onNavigate={onNavigate}
    />
  );
}