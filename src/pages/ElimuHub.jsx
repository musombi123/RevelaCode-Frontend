import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Award,
  BookOpen,
  CheckCircle2,
  ChevronLeft,
  Clock3,
  Download,
  GraduationCap,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/context/AuthContext.jsx";

const API_BASE = String(import.meta.env.VITE_API_URL || "").trim().replace(/\/+$/, "");
const apiUrl = (path) => `${API_BASE}${path}`;

async function readResponse(response) {
  const type = response.headers.get("content-type") || "";
  if (type.includes("json")) return response.json().catch(() => ({}));
  return {};
}

function displayName(value) {
  if (typeof value === "string") return value;
  if (value && typeof value === "object") return value.title || value.name || value.label || "";
  return "";
}

function formatDuration(seconds) {
  const total = Math.max(0, Number(seconds) || 0);
  if (!total) return "Not recorded";
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`;
}

export default function ElimuHub() {
  const { authFetch, getAccessToken, user } = useAuth();
  const [hubs, setHubs] = useState([]);
  const [selectedHubId, setSelectedHubId] = useState("");
  const [hub, setHub] = useState(null);
  const [loadingHubs, setLoadingHubs] = useState(true);
  const [loadingHub, setLoadingHub] = useState(false);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [certificate, setCertificate] = useState(null);

  const selectedHubLabel = useMemo(() => (
    hubs.find((item) => String(item.id) === String(selectedHubId))?.name || hub?.name || "Learning hub"
  ), [hubs, selectedHubId, hub]);

  const loadHubs = useCallback(async () => {
    setLoadingHubs(true);
    setError("");
    try {
      if (!getAccessToken()) throw new Error("Sign in before opening the Elimu learning hub.");
      const response = await authFetch(apiUrl("/api/study/elimu/hubs"), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const payload = await readResponse(response);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.detail?.message || payload?.detail || payload?.error?.message || payload?.message || `Elimu hub list failed (HTTP ${response.status}).`);
      }
      const rows = Array.isArray(payload?.hubs)
        ? payload.hubs
        : Array.isArray(payload?.data?.hubs)
          ? payload.data.hubs
          : Array.isArray(payload?.data)
            ? payload.data
            : [];
      setHubs(rows);
      setSelectedHubId((current) => current && rows.some((item) => String(item.id) === String(current)) ? current : "");
      if (!rows.length) {
        setHub(null);
        setSelectedHubId("");
        setNotice("The API returned no published learning hubs. No sample hubs were inserted by the UI.");
      }
    } catch (requestError) {
      setError(requestError?.message || "Could not load Elimu hubs.");
    } finally {
      setLoadingHubs(false);
    }
  }, [authFetch, getAccessToken]);

  const loadHub = useCallback(async (hubId) => {
    if (!hubId) {
      setHub(null);
      return;
    }
    setLoadingHub(true);
    setError("");
    setNotice("");
    try {
      const response = await authFetch(apiUrl(`/api/study/elimu/hubs/${encodeURIComponent(hubId)}`), {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const payload = await readResponse(response);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.detail?.message || payload?.detail || payload?.error?.message || payload?.message || `Hub details failed (HTTP ${response.status}).`);
      }
      setHub(payload?.hub || payload?.data?.hub || payload?.data || null);
    } catch (requestError) {
      setError(requestError?.message || "Could not load the selected hub.");
    } finally {
      setLoadingHub(false);
    }
  }, [authFetch]);

  useEffect(() => { void loadHubs(); }, [loadHubs]);

  useEffect(() => {
    if (selectedHubId) void loadHub(selectedHubId);
    else setHub(null);
  }, [selectedHubId, loadHub]);

  const submitProgress = async (course, action, lesson) => {
    if (!hub?.id) return;
    const courseId = String(course.id || course.course_id || "");
    const lessonId = lesson ? String(lesson.id || lesson.lesson_id || "") : "";
    const key = `${courseId}:${action}:${lessonId}`;
    setBusy(key);
    setError("");
    setNotice("");
    setCertificate(null);
    try {
      const response = await authFetch(apiUrl("/api/study/elimu/progress"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          hub_id: String(hub.id),
          course_id: courseId,
          action,
          ...(lessonId ? { lesson_id: lessonId } : {}),
          time_spent_seconds: 0,
        }),
      });
      const payload = await readResponse(response);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.detail?.message || payload?.detail || payload?.error?.message || payload?.message || `Progress update failed (HTTP ${response.status}).`);
      }
      setNotice(action === "start"
        ? "Course started and progress saved."
        : action === "complete_lesson"
          ? "Lesson completion recorded."
          : "Course completion recorded.");
      await loadHub(selectedHubId);
      await loadHubs();
    } catch (requestError) {
      setError(requestError?.message || "Could not save learning progress.");
    } finally {
      setBusy("");
    }
  };

  const issueCertificate = async () => {
    if (!hub?.id) return;
    setBusy("certificate");
    setError("");
    setNotice("");
    try {
      const response = await authFetch(apiUrl("/api/study/elimu/certificates/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ hub_id: String(hub.id) }),
      });
      const payload = await readResponse(response);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.detail?.message || payload?.detail || payload?.error?.message || payload?.message || `Certificate generation failed (HTTP ${response.status}).`);
      }
      setCertificate(payload);
      setNotice(payload?.already_issued ? "Your existing certificate was found." : "Certificate signed and issued.");
    } catch (requestError) {
      setError(requestError?.message || "Could not generate the certificate.");
    } finally {
      setBusy("");
    }
  };

  const downloadCertificate = async () => {
    const id = certificate?.certificate_id || certificate?.cert_id;
    if (!id) return;
    setBusy("download");
    setError("");
    try {
      const response = await authFetch(apiUrl(`/api/study/elimu/certificates/${encodeURIComponent(id)}`), {
        method: "GET",
        headers: { Accept: "application/pdf" },
      });
      const type = response.headers.get("content-type") || "";
      if (!response.ok || !type.includes("application/pdf")) {
        const payload = await readResponse(response);
        throw new Error(payload?.detail?.message || payload?.detail || payload?.message || `Certificate PDF download failed (HTTP ${response.status}).`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = `${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (requestError) {
      setError(requestError?.message || "Could not download the certificate.");
    } finally {
      setBusy("");
    }
  };

  const currentCourses = Array.isArray(hub?.courses) ? hub.courses : [];
  const progress = hub?.progress || {};
  const progressPercent = Math.max(0, Math.min(100, Number(progress.progress_percent) || 0));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <header className="overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 via-blue-700 to-emerald-700 p-6 text-white shadow-lg md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-100">RevelaCode • Elimu</p>
            <h1 className="mt-2 text-3xl font-bold md:text-4xl">Learning Hub</h1>
            <p className="mt-3 text-sm leading-6 text-blue-50 md:text-base">
              Explore published learning hubs, work through recorded lessons, track your progress, and request a digitally verifiable completion credential.
            </p>
            <p className="mt-3 text-sm text-blue-100">Signed in as {user?.fullName || user?.full_name || user?.contact || "authenticated learner"}</p>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-4">
            <GraduationCap className="h-8 w-8" />
            <div><p className="text-2xl font-bold">{hubs.length}</p><p className="text-xs text-blue-100">Published hubs</p></div>
          </div>
        </div>
      </header>

      {(error || notice) && (
        <div role={error ? "alert" : "status"} className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${error ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200" : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"}`}>
          {error ? <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />}
          <span>{error || notice}</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <Card className="h-fit rounded-2xl border-slate-200 dark:border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div><h2 className="font-semibold text-slate-900 dark:text-slate-100">Available hubs</h2><p className="mt-1 text-xs text-slate-500">Loaded from the authenticated API</p></div>
            <Button variant="outline" size="sm" disabled={loadingHubs} onClick={() => void loadHubs()} aria-label="Refresh learning hubs"><RefreshCw className={`h-4 w-4 ${loadingHubs ? "animate-spin" : ""}`} /></Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {loadingHubs && <div className="flex items-center gap-2 py-6 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading hubs…</div>}
            {!loadingHubs && hubs.map((item) => (
              <button key={item.id} type="button" onClick={() => { setSelectedHubId(String(item.id)); setCertificate(null); }} className={`w-full rounded-xl border p-3 text-left transition ${String(item.id) === String(selectedHubId) ? "border-blue-500 bg-blue-50 dark:bg-blue-950/50" : "border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500"}`}>
                <span className="flex items-start gap-3"><BookOpen className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" /><span className="min-w-0 flex-1"><span className="block font-medium text-slate-900 dark:text-slate-100">{item.name || "Untitled hub"}</span><span className="mt-1 block line-clamp-2 text-xs text-slate-500">{item.description || "No description supplied."}</span><span className="mt-2 block text-xs text-slate-500">{Number(item.courses_count) || 0} courses</span></span></span>
              </button>
            ))}
            {!loadingHubs && !hubs.length && <p className="rounded-xl border border-dashed border-slate-300 p-4 text-sm text-slate-500 dark:border-slate-700">No published hubs were returned by the backend.</p>}
          </CardContent>
        </Card>

        <section className="min-w-0 space-y-4">
          {!selectedHubId && (
            <Card className="flex min-h-64 items-center justify-center rounded-2xl border-dashed border-slate-300 p-8 text-center dark:border-slate-700">
              <div><GraduationCap className="mx-auto h-10 w-10 text-slate-400" /><h2 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-100">Choose a learning hub</h2><p className="mt-2 max-w-md text-sm text-slate-500">Select a published hub to inspect its courses, start lessons and record your progress.</p></div>
            </Card>
          )}

          {loadingHub && <Card className="rounded-2xl p-8"><div className="flex items-center justify-center gap-3 text-slate-500"><Loader2 className="h-5 w-5 animate-spin" /> Loading {selectedHubLabel}…</div></Card>}

          {hub && !loadingHub && (
            <>
              <Card className="rounded-2xl border-slate-200 dark:border-slate-700">
                <CardContent className="p-5 md:p-6">
                  <button type="button" onClick={() => { setHub(null); setSelectedHubId(""); setCertificate(null); }} className="mb-3 flex items-center gap-1 text-sm text-blue-700 hover:underline dark:text-blue-300"><ChevronLeft className="h-4 w-4" /> All hubs</button>
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1"><h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{hub.name || "Learning hub"}</h2><p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{hub.description || "No description supplied by the source hub record."}</p></div>
                    <div className="min-w-28 rounded-xl bg-slate-50 p-3 text-center dark:bg-slate-900"><p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{progressPercent}%</p><p className="text-xs text-slate-500">Completed</p></div>
                  </div>
                  <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"><div className="h-full rounded-full bg-emerald-600" style={{ width: `${progressPercent}%` }} /></div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500"><span>{Number(progress.completed_lessons) || 0} / {Number(progress.total_lessons) || 0} lessons</span><span>{Number(progress.completed_courses) || 0} / {Number(progress.total_courses) || currentCourses.length} courses</span><span>{formatDuration(hub.time_spent_seconds || progress.time_spent_seconds)}</span></div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                {currentCourses.map((course, courseIndex) => {
                  const courseId = String(course.id || course.course_id || "");
                  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
                  const allCompleted = lessons.length > 0 && lessons.every((lesson) => Boolean(lesson.completed));
                  return (
                    <Card key={courseId || courseIndex} className="rounded-2xl border-slate-200 dark:border-slate-700">
                      <CardContent className="space-y-4 p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div className="min-w-0 flex-1"><h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{course.title || course.name || `Course ${courseIndex + 1}`}</h3><p className="mt-1 text-sm text-slate-500">{course.description || ""}</p></div>
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${course.status === "completed" ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}>{course.status || "not started"}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" disabled={Boolean(busy)} onClick={() => void submitProgress(course, "start")}>
                            {busy === `${courseId}:start:` ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Start course
                          </Button>
                          {allCompleted && course.status !== "completed" && <Button size="sm" disabled={Boolean(busy)} onClick={() => void submitProgress(course, "complete_course")}>Mark course complete</Button>}
                        </div>

                        {lessons.length > 0 ? (
                          <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Lessons</p>
                            {lessons.map((lesson, lessonIndex) => {
                              const lessonId = String(lesson.id || lesson.lesson_id || "");
                              const actionKey = `${courseId}:complete_lesson:${lessonId}`;
                              return (
                                <div key={lessonId || lessonIndex} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-700">
                                  <div className="flex min-w-0 items-start gap-2"><CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${lesson.completed ? "text-emerald-600" : "text-slate-300"}`} /><div><p className="text-sm font-medium text-slate-800 dark:text-slate-100">{displayName(lesson.title || lesson.name) || `Lesson ${lessonIndex + 1}`}</p>{lesson.description && <p className="mt-1 text-xs text-slate-500">{lesson.description}</p>}</div></div>
                                  <Button size="sm" variant={lesson.completed ? "outline" : "default"} disabled={Boolean(busy) || Boolean(lesson.completed) || !lessonId} onClick={() => void submitProgress(course, "complete_lesson", lesson)}>
                                    {busy === actionKey ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : lesson.completed ? <CheckCircle2 className="mr-2 h-4 w-4" /> : <BookOpen className="mr-2 h-4 w-4" />}{lesson.completed ? "Completed" : "Complete lesson"}
                                  </Button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">This course record has no lessons. It cannot be completed or certified until real lesson records are added to the source hub.</p>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}

                {!currentCourses.length && <Card className="rounded-2xl p-6 text-sm text-slate-500">This hub has no courses in the backend record yet.</Card>}
              </div>

              {progress.hub_completed && (
                <Card className="rounded-2xl border-emerald-200 dark:border-emerald-900">
                  <CardContent className="p-5 md:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex gap-3"><Award className="h-7 w-7 shrink-0 text-emerald-600" /><div><h3 className="font-semibold text-slate-900 dark:text-slate-100">Hub requirements completed</h3><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">All lessons recorded for this hub are complete. Certificate signing still depends on the RSA signing key being configured on the API.</p></div></div>
                      {!certificate && <Button disabled={Boolean(busy)} onClick={() => void issueCertificate()}>{busy === "certificate" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />} Generate verified certificate</Button>}
                    </div>

                    {certificate && (
                      <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950">
                        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700 dark:text-emerald-300" /><div className="min-w-0 flex-1"><h4 className="font-semibold text-emerald-900 dark:text-emerald-100">Highly Certified by RevelaCode</h4><p className="mt-1 break-all text-sm text-emerald-800 dark:text-emerald-200">Certificate ID: {certificate.certificate_id || certificate.cert_id}</p><p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">Roles: {(certificate.roles || []).join(", ") || "See the signed certificate record"} </p>{certificate.verification_url && <a className="mt-2 inline-block break-all text-xs underline" href={`/verify/certificate/${encodeURIComponent(certificate.certificate_id || certificate.cert_id)}`}>Open public verification record</a>}</div></div>
                        <Button className="mt-4" disabled={Boolean(busy)} onClick={() => void downloadCertificate()}>{busy === "download" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />} Download certificate PDF</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
