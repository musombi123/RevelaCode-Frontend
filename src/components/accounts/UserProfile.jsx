import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  User,
  Mail,
  Phone,
  Shield,
  Download,
  FileJson,
  FileText,
  GraduationCap,
  Clock3,
  CalendarDays,
  Award,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");

function firstValue(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "") ?? "";
}

function dateLabel(value) {
  if (!value) return "Not provided by account service";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function filenamePart(value) {
  return String(value || "user")
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "user";
}

function roleList(profile) {
  const roles = profile?.roles;
  if (Array.isArray(roles) && roles.length) return roles.map(String);
  const role = profile?.role;
  return role ? [String(role)] : [];
}

function HubCard({ hub }) {
  const progress = Math.max(0, Math.min(100, Number(hub.progress_percent ?? hub.progress ?? 0) || 0));
  const completedLessons = Number(hub.completed_lessons ?? hub.lessons_completed ?? 0) || 0;
  const timeSpent = firstValue(hub.time_spent_label, hub.time_spent, hub.duration, "Not recorded");
  const skills = Array.isArray(hub.skills) ? hub.skills : [];
  const instructors = Array.isArray(hub.instructors)
    ? hub.instructors.map((entry) => typeof entry === "string" ? entry : entry?.name).filter(Boolean)
    : [];

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-slate-900 dark:text-slate-100">
            {firstValue(hub.name, hub.title, hub.hub_name, "Unnamed hub")}
          </h4>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {firstValue(hub.description, hub.institution ? `Institution: ${hub.institution}` : "", "No description was returned for this hub.")}
          </p>
          {hub.role && <p className="mt-2 text-xs font-medium text-indigo-700 dark:text-indigo-300">Recorded hub role: {hub.role}</p>}
          {hub.joined_at && <p className="mt-1 text-xs text-slate-500">Affiliation recorded: {dateLabel(hub.joined_at)}</p>}
          {hub.id || hub.hub_id ? (
            <p className="mt-2 break-all text-xs text-slate-500">Hub ID: {hub.id || hub.hub_id}</p>
          ) : null}
        </div>
        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950 dark:text-indigo-200">
          {progress}% complete
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div className="h-full rounded-full bg-indigo-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm md:grid-cols-3">
        <div>
          <p className="text-xs text-slate-500">Lessons completed</p>
          <p className="font-medium text-slate-800 dark:text-slate-200">{completedLessons}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Time spent</p>
          <p className="font-medium text-slate-800 dark:text-slate-200">{String(timeSpent)}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Last accessed</p>
          <p className="font-medium text-slate-800 dark:text-slate-200">{dateLabel(firstValue(hub.last_accessed, hub.lastAccessed))}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Certificate</p>
          <p className="font-medium text-slate-800 dark:text-slate-200">{firstValue(hub.certificate_status, hub.certificate?.status, hub.certificate_status_label, "Not earned")}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Completed on</p>
          <p className="font-medium text-slate-800 dark:text-slate-200">{dateLabel(firstValue(hub.completed_at, hub.completion_date))}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Instructors</p>
          <p className="font-medium text-slate-800 dark:text-slate-200">{instructors.length ? instructors.join(", ") : "Not listed"}</p>
        </div>
      </div>

      {skills.length > 0 && (
        <div className="mt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Skills</p>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span key={typeof skill === "string" ? skill : skill?.id || index} className="rounded-full border border-slate-200 px-2.5 py-1 text-xs text-slate-700 dark:border-slate-700 dark:text-slate-200">
                {typeof skill === "string" ? skill : skill?.name || skill?.title || "Skill"}
              </span>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function UserProfile() {
  const { user, authFetch, getAccessToken } = useAuth();
  const [remoteProfile, setRemoteProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [downloadState, setDownloadState] = useState("");
  const [certificateState, setCertificateState] = useState("");
  const [certificateMessage, setCertificateMessage] = useState("");
  const [refreshSequence, setRefreshSequence] = useState(0);

  const isGuest = user?.role === "guest";
  const fullName = remoteProfile
    ? firstValue(remoteProfile.full_name, remoteProfile.fullName, remoteProfile.name, "Name not returned by account service")
    : firstValue(user?.fullName, user?.full_name, "Signed-in user");
  const contact = remoteProfile
    ? firstValue(remoteProfile.email, remoteProfile.contact, remoteProfile.phone, "Contact not returned by account service")
    : firstValue(user?.email, user?.contact, "");
  const roles = useMemo(() => (remoteProfile ? roleList(remoteProfile) : []), [remoteProfile]);
  const avatar = firstValue(remoteProfile?.avatar, remoteProfile?.avatar_url, remoteProfile?.avatarUrl, user?.avatar, user?.avatarUrl, "");
  const joined = firstValue(remoteProfile?.joined_at, remoteProfile?.joinedAt, remoteProfile?.created_at, remoteProfile?.createdAt);
  const hubs = Array.isArray(remoteProfile?.hubs)
    ? remoteProfile.hubs
    : Array.isArray(remoteProfile?.current_hubs)
      ? remoteProfile.current_hubs
      : Array.isArray(remoteProfile?.hub_usage)
        ? remoteProfile.hub_usage
        : [];

  const loadProfile = useCallback(async () => {
    if (!user || isGuest) {
      setRemoteProfile(null);
      setLoadingProfile(false);
      return;
    }

    setLoadingProfile(true);
    setProfileError("");
    try {
      const response = await authFetch(
        `${API_BASE}/api/accounts/profile/download?format=json`,
        { method: "GET", headers: { Accept: "application/json" } },
      );
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = payload?.detail || payload?.error?.message || payload?.message || `Profile API returned HTTP ${response.status}.`;
        throw new Error(message);
      }
      const candidate = payload?.profile || payload?.data?.profile || payload?.data || payload;
      if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
        throw new Error("The profile service returned an unexpected response.");
      }
      const sourceUser = candidate.user || candidate;
      const certificates = candidate.certificates || payload?.certificates || payload?.data?.certificates || [];
      setRemoteProfile({
        ...candidate,
        ...sourceUser,
        hubs: candidate.hubs || payload?.hubs || payload?.data?.hubs || [],
        certificates,
        certificates_count: candidate.certificates_count ?? payload?.certificates_count ?? certificates.length,
      });
    } catch (error) {
      // Keep the authenticated identity visible; show the API failure clearly.
      setProfileError(error?.message || "Could not load the full account profile.");
    } finally {
      setLoadingProfile(false);
    }
  }, [authFetch, isGuest, user, refreshSequence]);

  useEffect(() => {
    void loadProfile();
  }, [loadProfile]);

  const downloadProfile = async (format) => {
    setDownloadState(format);
    setProfileError("");
    try {
      if (!getAccessToken()) {
        throw new Error("Sign in again to download your account profile.");
      }
      const response = await authFetch(
        `${API_BASE}/api/accounts/profile/download?format=${encodeURIComponent(format)}`,
        { method: "GET", headers: { Accept: format === "pdf" ? "application/pdf" : "application/json" } },
      );
      const type = response.headers.get("content-type") || "";
      if (!response.ok || (format === "pdf" && !type.includes("application/pdf"))) {
        const payload = type.includes("json") ? await response.json().catch(() => ({})) : {};
        throw new Error(payload?.detail || payload?.error?.message || payload?.message || `Profile download failed (HTTP ${response.status}).`);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const name = filenamePart(fullName || user?.id);
      const date = new Date().toISOString().slice(0, 10);
      link.href = objectUrl;
      link.download = `revelacode-profile-${name}-${date}.${format === "pdf" ? "pdf" : "json"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      setProfileError(error?.message || "Profile download failed.");
    } finally {
      setDownloadState("");
    }
  };

  const issueAndDownloadCertificate = async () => {
    setCertificateState("issuing");
    setCertificateMessage("");
    setProfileError("");
    try {
      const response = await authFetch(`${API_BASE}/api/accounts/certificates`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({}),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.certificate_id) {
        throw new Error(payload?.error?.message || payload?.message || `Certificate issuance failed (HTTP ${response.status}).`);
      }
      const verifyResponse = await authFetch(
        `${API_BASE}/api/verify/certificate/${encodeURIComponent(payload.certificate_id)}`,
        { method: "GET", headers: { Accept: "application/json" } },
      );
      const verification = await verifyResponse.json().catch(() => ({}));
      if (!verifyResponse.ok || verification?.valid !== true) {
        throw new Error(
          verification?.message ||
          verification?.detail ||
          "The account service returned a certificate ID, but the public verifier did not confirm it as valid. The file was not presented as verified.",
        );
      }

      const downloadResponse = await authFetch(`${API_BASE}${payload.download_url || `/api/accounts/certificates/${encodeURIComponent(payload.certificate_id)}/download`}`, {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });
      const contentType = downloadResponse.headers.get("content-type") || "";
      if (!downloadResponse.ok || !contentType.includes("application/pdf")) {
        const errorPayload = contentType.includes("json") ? await downloadResponse.json().catch(() => ({})) : {};
        throw new Error(errorPayload?.error?.message || errorPayload?.message || `Certificate download failed (HTTP ${downloadResponse.status}).`);
      }
      const objectUrl = URL.createObjectURL(await downloadResponse.blob());
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${payload.certificate_id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
      setCertificateMessage(
        payload.already_issued
          ? "The existing account certificate passed public verification and is ready to download."
          : "The account identity and participation certificate passed public verification and is ready to download.",
      );
      setRefreshSequence((value) => value + 1);
    } catch (error) {
      setProfileError(error?.message || "Unable to issue or download the account certificate.");
      setCertificateMessage("");
    } finally {
      setCertificateState("");
    }
  };

  if (!user) {
    return (
      <div className="m-4 flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-5 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
        <AlertCircle className="h-5 w-5 shrink-0" />
        No authenticated account profile is available.
      </div>
    );
  }

  const initials = fullName.split(/\s+/).filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "U";

  return (
    <div className="space-y-5 p-4">
      <Card className="overflow-hidden rounded-2xl border-slate-200 shadow-sm dark:border-slate-700">
        <CardHeader className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-950">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl bg-indigo-600 text-xl font-bold text-white">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials || <User className="h-7 w-7" />}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{fullName}</h2>
              <p className="mt-1 break-all text-sm text-slate-600 dark:text-slate-300">{contact || "No email/contact on record"}</p>
              <p className="mt-1 text-xs text-slate-500">
                {remoteProfile
                  ? "Identity details received from the authenticated account service."
                  : profileError
                    ? "Showing cached session details only; authoritative profile data could not be confirmed."
                    : "Loading authoritative account details…"}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {roles.length ? roles.map((role) => (
                  <span key={role} className="rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold capitalize text-indigo-800 dark:border-indigo-800 dark:bg-indigo-950 dark:text-indigo-200">{role.replaceAll("_", " ")}</span>
                )) : <span className="text-xs text-slate-500">Roles not returned</span>}
              </div>
            </div>
            {loadingProfile && <RefreshCw className="h-5 w-5 animate-spin text-slate-500" aria-label="Loading profile" />}
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex gap-3">
            <Shield className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div><p className="text-xs text-slate-500">Account roles</p><p className="font-medium text-slate-800 dark:text-slate-100">{roles.length ? roles.join(", ") : "Not supplied"}</p></div>
          </div>
          <div className="flex gap-3">
            {contact.includes("@") ? <Mail className="mt-0.5 h-5 w-5 text-indigo-600" /> : <Phone className="mt-0.5 h-5 w-5 text-indigo-600" />}
            <div><p className="text-xs text-slate-500">Primary contact</p><p className="break-all font-medium text-slate-800 dark:text-slate-100">{contact || "Not supplied"}</p></div>
          </div>
          <div className="flex gap-3">
            <CalendarDays className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div><p className="text-xs text-slate-500">Joined</p><p className="font-medium text-slate-800 dark:text-slate-100">{dateLabel(joined)}</p></div>
          </div>
          <div className="flex gap-3">
            <GraduationCap className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div><p className="text-xs text-slate-500">Recorded hubs</p><p className="font-medium text-slate-800 dark:text-slate-100">{remoteProfile ? hubs.length : "Not yet verified"}</p></div>
          </div>
          <div className="flex gap-3">
            <Award className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div><p className="text-xs text-slate-500">Certificates</p><p className="font-medium text-slate-800 dark:text-slate-100">{remoteProfile ? firstValue(remoteProfile.certificates_count, remoteProfile.certificate_count, remoteProfile.certificates?.length, "Not reported") : "Not yet verified"}</p></div>
          </div>
          <div className="flex gap-3">
            <Clock3 className="mt-0.5 h-5 w-5 text-indigo-600" />
            <div><p className="text-xs text-slate-500">Last profile refresh</p><p className="font-medium text-slate-800 dark:text-slate-100">{loadingProfile ? "Refreshing…" : "Current page session"}</p></div>
          </div>
        </CardContent>
      </Card>

      {!isGuest && (
        <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-col gap-3 border-b border-slate-200 dark:border-slate-700 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Learning hub activity</h3>
              <p className="text-sm text-slate-500">Progress, completed lessons, time spent, instructors, skills and certificate status returned by the authenticated account API.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={loadingProfile} onClick={() => setRefreshSequence((value) => value + 1)}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button disabled={downloadState !== ""} onClick={() => void downloadProfile("pdf")}>
                <Download className="mr-2 h-4 w-4" /> {downloadState === "pdf" ? "Preparing PDF…" : "Download PDF"}
              </Button>
              <Button variant="outline" disabled={downloadState !== ""} onClick={() => void downloadProfile("json")}>
                <FileJson className="mr-2 h-4 w-4" /> {downloadState === "json" ? "Preparing JSON…" : "Download JSON"}
              </Button>
              <Button variant="outline" disabled={Boolean(certificateState)} onClick={() => void issueAndDownloadCertificate()}>
                <Award className="mr-2 h-4 w-4" /> {certificateState === "issuing" ? "Issuing certificate…" : "Issue / Download Account Certificate"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 p-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              <strong>Account Identity &amp; Participation Certificate.</strong> This document records verified RevelaCode account identity and supported role or hub-participation records. It is not an academic qualification, professional licence, government accreditation, or third-party credential.
            </div>
            {certificateMessage && (
              <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
                {certificateMessage}
              </div>
            )}
            {profileError && (
              <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}
            {!profileError && hubs.length === 0 && !loadingProfile && (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center dark:border-slate-700">
                <GraduationCap className="mx-auto h-8 w-8 text-slate-400" />
                <p className="mt-2 font-medium text-slate-800 dark:text-slate-100">No learning-hub records returned</p>
                <p className="mt-1 text-sm text-slate-500">The account service must return the user's actual hub usage. No progress or certificate data is inferred on this page.</p>
              </div>
            )}
            {hubs.map((hub, index) => <HubCard key={hub.id || hub.hub_id || index} hub={hub} />)}
            {remoteProfile && !profileError && (
              <p className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 className="h-4 w-4" /> Profile details loaded from the authenticated account API.
              </p>
            )}
          </CardContent>
        </Card>
      )}
      {isGuest && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Guest sessions do not have a downloadable account profile or personal learning history.
        </div>
      )}
    </div>
  );
}
