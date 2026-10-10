import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

const DEFAULT_BACKEND_URL =
  "https://revelacode-backend.onrender.com";

const API_PREFIX = "/api/jumuiya/elimu";

function normalizeBaseUrl(value) {
  return String(value || DEFAULT_BACKEND_URL).replace(/\/+$/, "");
}

function getToken(auth) {
  const candidates = [
    auth?.accessToken,
    auth?.access_token,
    auth?.token,
    auth?.user?.accessToken,
    auth?.user?.access_token,
    auth?.user?.token,
    auth?.session?.access_token,
    auth?.session?.accessToken,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }

  return null;
}

function buildQuery(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    if (typeof value === "object") {
      searchParams.set(key, JSON.stringify(value));
      return;
    }

    searchParams.set(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function normalizePath(path) {
  return String(path || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(decodeURIComponent(segment)))
    .join("/");
}

function createApiError(message, status, payload) {
  const error = new Error(message || "The Elimu API request failed.");
  error.status = status;
  error.payload = payload;
  return error;
}

export function createElimuApiClient({
  baseUrl = DEFAULT_BACKEND_URL,
  token = null,
  fetchImpl = globalThis.fetch,
} = {}) {
  const origin = normalizeBaseUrl(baseUrl);

  if (typeof fetchImpl !== "function") {
    throw new Error("Fetch is unavailable in this environment.");
  }

  async function request(path, options = {}) {
    const {
      method = "GET",
      params,
      body,
      headers: customHeaders = {},
      signal,
    } = options;

    const normalizedPath = normalizePath(path);
    const url = `${origin}${API_PREFIX}/${normalizedPath}${buildQuery(params)}`;

    const headers = {
      Accept: "application/json",
      ...customHeaders,
    };

    if (token) {
      headers.Authorization = /^Bearer\s/i.test(token)
        ? token
        : `Bearer ${token}`;
    }

    const requestOptions = {
      method,
      headers,
      credentials: "include",
      signal,
    };

    if (body !== undefined) {
      headers["Content-Type"] = "application/json";
      requestOptions.body = JSON.stringify(body);
    }

    let response;

    try {
      response = await fetchImpl(url, requestOptions);
    } catch (error) {
      if (error?.name === "AbortError") throw error;

      throw createApiError(
        "Unable to reach the Elimu service. Check your connection and try again.",
        0,
        null
      );
    }

    const contentType = response.headers?.get?.("content-type") || "";
    let payload = null;

    if (response.status !== 204) {
      if (contentType.includes("application/json")) {
        try {
          payload = await response.json();
        } catch {
          payload = null;
        }
      } else {
        try {
          const text = await response.text();
          payload = text ? { message: text } : null;
        } catch {
          payload = null;
        }
      }
    }

    if (!response.ok) {
      const message =
        payload?.message ||
        payload?.error ||
        payload?.detail ||
        `Elimu request failed with HTTP ${response.status}.`;

      throw createApiError(message, response.status, payload);
    }

    return payload;
  }

  const get = (path, params, options = {}) =>
    request(path, { ...options, method: "GET", params });

  const post = (path, body, options = {}) =>
    request(path, { ...options, method: "POST", body });

  const put = (path, body, options = {}) =>
    request(path, { ...options, method: "PUT", body });

  const patch = (path, body, options = {}) =>
    request(path, { ...options, method: "PATCH", body });

  const del = (path, options = {}) =>
    request(path, { ...options, method: "DELETE" });

  return {
    request,

    getAccess: (options) => get("access", undefined, options),
    getBootstrap: (options) => get("bootstrap", undefined, options),
    getDashboard: (options) => get("dashboard", undefined, options),
    getHealth: (options) => get("health", undefined, options),

    getSchool: (options) => get("school", undefined, options),
    saveSchool: (data, options) => post("school", data, options),

    getProfile: (options) => get("profile", undefined, options),
    saveProfile: (data, options) => post("profile", data, options),

    getClasses: (params, options) => get("classes", params, options),
    createClass: (data, options) => post("classes", data, options),

    getStudents: (params, options) => get("students", params, options),
    createStudent: (data, options) => post("students", data, options),
    getStudent: (studentId, options) =>
      get(`students/${studentId}`, undefined, options),
    updateStudent: (studentId, data, options) =>
      put(`students/${studentId}`, data, options),

    getLessons: (params, options) => get("lessons", params, options),
    createLesson: (data, options) => post("lessons", data, options),

    getAssignments: (params, options) => get("assignments", params, options),
    createAssignment: (data, options) => post("assignments", data, options),

    getAssessments: (params, options) => get("assessments", params, options),
    createAssessment: (data, options) => post("assessments", data, options),

    getAttendance: (params, options) => get("attendance", params, options),
    recordAttendance: (data, options) => post("attendance", data, options),

    getFees: (params, options) => get("fees", params, options),
    createFeeRecord: (data, options) => post("fees", data, options),

    getEvents: (params, options) => get("events", params, options),
    createEvent: (data, options) => post("events", data, options),
    updateEvent: (eventId, data, options) =>
      put(`events/${eventId}`, data, options),
    deleteEvent: (eventId, options) => del(`events/${eventId}`, options),

    getCalendar: (params, options) => get("calendar", params, options),

    getCBCProjects: (params, options) => get("cbc/projects", params, options),
    createCBCProject: (data, options) =>
      post("cbc/projects", data, options),

    getStaff: (params, options) => get("staff", params, options),
    getStaffMember: (userId, options) =>
      get(`staff/${userId}`, undefined, options),
    updateStaffMember: (userId, data, options) =>
      put(`staff/${userId}`, data, options),
    deleteStaffMember: (userId, options) => del(`staff/${userId}`, options),
    getCurrentStaffMember: (options) => get("staff/me", undefined, options),
    getTeachers: (params, options) => get("staff/teachers", params, options),
    inviteStaff: (data, options) => post("staff/invite", data, options),
    acceptStaffInvitation: (data, options) =>
      post("staff/invitations/accept", data, options),
    assignStaff: (data, options) =>
      post("staff/assignments", data, options),
    removeStaffAssignment: (data, options) =>
      del("staff/assignments", { ...options, body: data }),
    getStaffAssignments: (params, options) =>
      get("staff/assignments/list", params, options),

    getAttendanceReport: (params, options) =>
      get("reports/attendance", params, options),
    getCurriculaReports: (params, options) =>
      get("reports/curricula", params, options),
    createCurriculaReport: (data, options) =>
      post("reports/curricula", data, options),
    getCurriculaReport: (reportId, options) =>
      get(`reports/curricula/${reportId}`, undefined, options),
    getReportsDashboard: (params, options) =>
      get("reports/dashboard", params, options),
    getExamReports: (params, options) =>
      get("reports/exam-reports", params, options),
    getExamReport: (reportId, options) =>
      get(`reports/exam-reports/${reportId}`, undefined, options),
    publishExamReport: (reportId, options) =>
      post(`reports/exam-reports/${reportId}/publish`, {}, options),
    createClassExamReport: (data, options) =>
      post("reports/exam-reports/class", data, options),
    createStudentExamReport: (data, options) =>
      post("reports/exam-reports/student", data, options),
    getFeesReport: (params, options) =>
      get("reports/fees", params, options),
    getReportsOverview: (params, options) =>
      get("reports/overview", params, options),
    getProgrammes: (params, options) =>
      get("reports/programmes", params, options),
    createProgramme: (data, options) =>
      post("reports/programmes", data, options),
    getProgramme: (programmeId, options) =>
      get(`reports/programmes/${programmeId}`, undefined, options),
    publishProgramme: (programmeId, options) =>
      post(`reports/programmes/${programmeId}/publish`, {}, options),
    getTimetableReport: (params, options) =>
      get("reports/timetable", params, options),

    getTimetable: (params, options) => get("timetable", params, options),
    createTimetable: (data, options) => post("timetable", data, options),
    getTimetableById: (timetableId, options) =>
      get(`timetable/${timetableId}`, undefined, options),
    generateTimetable: (timetableId, data = {}, options) =>
      post(`timetable/${timetableId}/generate`, data, options),
    optimizeTimetable: (timetableId, data = {}, options) =>
      post(`timetable/${timetableId}/optimize`, data, options),
    publishTimetable: (timetableId, data = {}, options) =>
      post(`timetable/${timetableId}/publish`, data, options),
    getClassTimetable: (classId, params, options) =>
      get(`timetable/class/${classId}`, params, options),
    updateTimetableEntry: (entryId, data, options) =>
      patch(`timetable/entries/${entryId}`, data, options),
    getMyTeacherTimetable: (params, options) =>
      get("timetable/teacher/me", params, options),

    getSyncStatus: (params, options) => get("sync/status", params, options),
    getSyncConnections: (params, options) =>
      get("sync/connections", params, options),
    createSyncConnection: (data, options) =>
      post("sync/connections", data, options),
    getSyncConnection: (connectionId, options) =>
      get(`sync/connections/${connectionId}`, undefined, options),
    activateSyncConnection: (connectionId, data = {}, options) =>
      post(`sync/connections/${connectionId}/activate`, data, options),
    heartbeatSyncConnection: (connectionId, data = {}, options) =>
      post(`sync/connections/${connectionId}/heartbeat`, data, options),
    pauseSyncConnection: (connectionId, data = {}, options) =>
      post(`sync/connections/${connectionId}/pause`, data, options),
    revokeSyncConnection: (connectionId, data = {}, options) =>
      post(`sync/connections/${connectionId}/revoke`, data, options),
    getSyncDevices: (params, options) => get("sync/devices", params, options),
    createSyncDevice: (data, options) => post("sync/devices", data, options),
    exportSyncEntity: (entityType, params, options) =>
      get(`sync/export/${entityType}`, params, options),
    ingestSyncRecords: (data, options) => post("sync/ingest", data, options),
    getSyncJobs: (params, options) => get("sync/jobs", params, options),
    getSyncJob: (jobId, options) =>
      get(`sync/jobs/${jobId}`, undefined, options),
    cancelSyncJob: (jobId, data = {}, options) =>
      post(`sync/jobs/${jobId}/cancel`, data, options),
    pauseSyncJob: (jobId, data = {}, options) =>
      post(`sync/jobs/${jobId}/pause`, data, options),
    resumeSyncJob: (jobId, data = {}, options) =>
      post(`sync/jobs/${jobId}/resume`, data, options),
    retrySyncJob: (jobId, data = {}, options) =>
      post(`sync/jobs/${jobId}/retry`, data, options),
    recoverSyncJobs: (data = {}, options) =>
      post("sync/jobs/recover", data, options),
    getSyncConflicts: (params, options) =>
      get("sync/conflicts", params, options),
    resolveSyncConflict: (conflictId, data, options) =>
      post(`sync/conflicts/${conflictId}/resolve`, data, options),

    getAutomationStatus: (params, options) =>
      get("automation/status", params, options),
    getAutomationActions: (params, options) =>
      get("automation/actions", params, options),
    getAutomationJobs: (params, options) =>
      get("automation/jobs", params, options),
    getAutomationJob: (jobId, options) =>
      get(`automation/jobs/${jobId}`, undefined, options),
    cancelAutomationJob: (jobId, data = {}, options) =>
      post(`automation/jobs/${jobId}/cancel`, data, options),
    retryAutomationJob: (jobId, data = {}, options) =>
      post(`automation/jobs/${jobId}/retry`, data, options),
    recoverAutomationJobs: (data = {}, options) =>
      post("automation/jobs/recover", data, options),
    getAutomationLogs: (params, options) =>
      get("automation/logs", params, options),
    getAutomationRules: (params, options) =>
      get("automation/rules", params, options),
    createAutomationRule: (data, options) =>
      post("automation/rules", data, options),
    getAutomationRule: (ruleId, options) =>
      get(`automation/rules/${ruleId}`, undefined, options),
    updateAutomationRule: (ruleId, data, options) =>
      patch(`automation/rules/${ruleId}`, data, options),
    deleteAutomationRule: (ruleId, options) =>
      del(`automation/rules/${ruleId}`, options),
    enableAutomationRule: (ruleId, data = {}, options) =>
      post(`automation/rules/${ruleId}/enable`, data, options),
    disableAutomationRule: (ruleId, data = {}, options) =>
      post(`automation/rules/${ruleId}/disable`, data, options),
    runAutomationRule: (ruleId, data = {}, options) =>
      post(`automation/rules/${ruleId}/run`, data, options),
    runAutomation: (data = {}, options) =>
      post("automation/run", data, options),
  };
}

export function useElimuApi() {
  const auth = useAuth();

  const baseUrl =
    import.meta.env?.VITE_BACKEND_URL ||
    import.meta.env?.VITE_API_BASE_URL ||
    DEFAULT_BACKEND_URL;

  const token = getToken(auth);

  return useMemo(
    () =>
      createElimuApiClient({
        baseUrl,
        token,
      }),
    [baseUrl, token]
  );
}

export default useElimuApi;