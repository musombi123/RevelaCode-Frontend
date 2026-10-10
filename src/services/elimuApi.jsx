import { useMemo } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

/**
 * RevelaCode / Jumuiya Elimu API client.
 *
 * The methods in this file map to the currently registered Flask routes under
 * /api/jumuiya/elimu. The client does not bypass server-side authorization.
 * VITE_API_BASE_URL / VITE_BACKEND_URL / VITE_API_URL must contain the backend
 * origin only, for example: https://revelacode-backend.onrender.com
 */

const DEFAULT_BACKEND_URL = "https://revelacode-backend.onrender.com";
const API_PREFIX = "/api/jumuiya/elimu";
const ENV = import.meta.env || {};

export function resolveElimuBackendUrl() {
  return normalizeBaseUrl(
    ENV.VITE_API_BASE_URL ||
      ENV.VITE_BACKEND_URL ||
      ENV.VITE_API_URL ||
      DEFAULT_BACKEND_URL,
  );
}

function normalizeBaseUrl(value) {
  const base = String(value || DEFAULT_BACKEND_URL).trim().replace(/\/+$/, "");
  return base || DEFAULT_BACKEND_URL;
}

function tokenFromValue(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object") {
    const candidates = [
      value.accessToken,
      value.access_token,
      value.token,
      value.session?.accessToken,
      value.session?.access_token,
      value.data?.accessToken,
      value.data?.access_token,
      value.data?.session?.access_token,
    ];
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim()) {
        return candidate.trim();
      }
    }
  }
  return null;
}

function getTokenFromAuthContext(auth) {
  return (
    tokenFromValue(auth?.accessToken) ||
    tokenFromValue(auth?.access_token) ||
    tokenFromValue(auth?.token) ||
    tokenFromValue(auth?.user) ||
    tokenFromValue(auth?.session) ||
    tokenFromValue(auth?.data)
  );
}

async function resolveToken(tokenSource) {
  try {
    const value =
      typeof tokenSource === "function" ? await tokenSource() : tokenSource;
    return tokenFromValue(value);
  } catch {
    // A token-provider failure should not hide the real HTTP response.
    return null;
  }
}

function pathSegment(value, label = "identifier") {
  if (value === undefined || value === null || String(value).trim() === "") {
    throw new Error(`A valid ${label} is required.`);
  }
  return encodeURIComponent(String(value).trim());
}

function normalizePath(path) {
  return String(path || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      let decoded = segment;
      try {
        decoded = decodeURIComponent(segment);
      } catch {
        // A malformed escape will be safely encoded below.
      }
      if (decoded === "." || decoded === "..") {
        throw new Error("Invalid API path segment.");
      }
      return encodeURIComponent(decoded);
    })
    .join("/");
}

function buildQuery(params = {}) {
  if (params instanceof URLSearchParams) {
    const query = params.toString();
    return query ? `?${query}` : "";
  }

  const searchParams = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined || item === null || item === "") return;
        searchParams.append(
          key,
          typeof item === "object" ? JSON.stringify(item) : String(item),
        );
      });
      return;
    }

    searchParams.set(
      key,
      typeof value === "object" ? JSON.stringify(value) : String(value),
    );
  });

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

function createApiError(message, status, payload, metadata = {}) {
  const error = new Error(message || "The Elimu API request failed.");
  error.name = "ElimuApiError";
  error.status = status;
  error.payload = payload;
  error.url = metadata.url || null;
  error.method = metadata.method || null;
  error.requestId = metadata.requestId || null;
  return error;
}

function readHeader(headers, name) {
  try {
    return headers?.get?.(name) || "";
  } catch {
    return "";
  }
}

async function readErrorPayload(response) {
  if (response.status === 204) return null;

  const contentType = readHeader(response.headers, "content-type").toLowerCase();
  if (contentType.includes("json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  } catch {
    return null;
  }
}

function getErrorMessage(payload, status) {
  if (typeof payload === "string" && payload.trim()) return payload.trim();
  return (
    payload?.message ||
    payload?.error ||
    payload?.detail ||
    payload?.description ||
    `Elimu request failed with HTTP ${status}.`
  );
}

function isFormDataBody(body) {
  return typeof FormData !== "undefined" && body instanceof FormData;
}

function isBlobBody(body) {
  return typeof Blob !== "undefined" && body instanceof Blob;
}

function isUrlSearchParamsBody(body) {
  return (
    typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams
  );
}

function isArrayBufferBody(body) {
  return (
    typeof ArrayBuffer !== "undefined" &&
    (body instanceof ArrayBuffer || ArrayBuffer.isView(body))
  );
}

function isNativeBody(body) {
  return (
    typeof body === "string" ||
    isFormDataBody(body) ||
    isBlobBody(body) ||
    isUrlSearchParamsBody(body) ||
    isArrayBufferBody(body)
  );
}

/** Create a standalone Elimu API client. Useful for tests and non-hook code. */
export function createElimuApiClient({
  baseUrl = resolveElimuBackendUrl(),
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
      credentials = "include",
      includeAuth = true,
      responseType = "json",
    } = options;

    const verb = String(method || "GET").toUpperCase();
    const normalizedPath = normalizePath(path);
    const url =
      `${origin}${API_PREFIX}` +
      (normalizedPath ? `/${normalizedPath}` : "") +
      buildQuery(params);

    const headers = new Headers({
      Accept: responseType === "json" ? "application/json" : "*/*",
    });

    if (customHeaders instanceof Headers) {
      customHeaders.forEach((value, key) => headers.set(key, value));
    } else {
      Object.entries(customHeaders || {}).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          headers.set(key, String(value));
        }
      });
    }

    if (includeAuth) {
      const accessToken = await resolveToken(token);
      if (accessToken) {
        headers.set(
          "Authorization",
          /^Bearer\s/i.test(accessToken) ? accessToken : `Bearer ${accessToken}`,
        );
      }
    }

    const requestOptions = {
      method: verb,
      headers,
      credentials,
      signal,
    };

    if (body !== undefined) {
      if (isNativeBody(body)) {
        requestOptions.body = body;
        // Never set multipart Content-Type manually: fetch supplies its boundary.
        if (isUrlSearchParamsBody(body) && !headers.has("Content-Type")) {
          headers.set(
            "Content-Type",
            "application/x-www-form-urlencoded;charset=UTF-8",
          );
        }
      } else {
        if (!headers.has("Content-Type")) {
          headers.set("Content-Type", "application/json");
        }
        requestOptions.body = JSON.stringify(body);
      }
    }

    let response;
    try {
      response = await fetchImpl(url, requestOptions);
    } catch (error) {
      if (error?.name === "AbortError") throw error;
      throw createApiError(
        "Unable to reach the Elimu service. Check your connection and try again.",
        0,
        null,
        { url, method: verb },
      );
    }

    const requestId =
      readHeader(response.headers, "x-request-id") ||
      readHeader(response.headers, "request-id") ||
      null;

    if (!response.ok) {
      const payload = await readErrorPayload(response);
      throw createApiError(getErrorMessage(payload, response.status), response.status, payload, {
        url,
        method: verb,
        requestId,
      });
    }

    if (response.status === 204) return null;
    if (responseType === "response") return response;
    if (responseType === "blob") return response.blob();
    if (responseType === "arrayBuffer") return response.arrayBuffer();
    if (responseType === "text") return response.text();

    const contentType = readHeader(response.headers, "content-type").toLowerCase();
    if (contentType.includes("json")) {
      try {
        return await response.json();
      } catch {
        throw createApiError(
          "The Elimu service returned invalid JSON.",
          response.status,
          null,
          { url, method: verb, requestId },
        );
      }
    }

    const text = await response.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { message: text };
    }
  }

  const get = (path, params, options = {}) =>
    request(path, { ...options, method: "GET", params });
  const post = (path, body, options = {}) =>
    request(path, { ...options, method: "POST", body });
  const put = (path, body, options = {}) =>
    request(path, { ...options, method: "PUT", body });
  const patch = (path, body, options = {}) =>
    request(path, { ...options, method: "PATCH", body });
  const del = (path, options = {}) => request(path, { ...options, method: "DELETE" });

  // Public GETs intentionally omit credentials and the bearer token. The Flask
  // handlers must still filter out unpublished or private records.
  const publicGet = (path, params, options = {}) =>
    get(path, params, { ...options, credentials: "omit", includeAuth: false });

  // -------------------------------------------------------------------------
  // Core routes: /access, /bootstrap, /dashboard, /health, /school, /profile,
  // /classes, /students, /lessons, /assignments, /attendance, /assessments,
  // /fees, /events, /calendar and /cbc/projects.
  // -------------------------------------------------------------------------
  const core = {
    request,
    getAccess: (options) => get("access", undefined, options),
    getBootstrap: (options) => get("bootstrap", undefined, options),
    getDashboard: (options) => get("dashboard", undefined, options),
    getHealth: (options) => get("health", undefined, options),

    getSchool: (options) => get("school", undefined, options),
    saveSchool: (data, options) => post("school", data, options),
    createDemoSchool: (data, options) => post("school/demo", data, options),
    updateSchoolPublicationSettings: (data, options) =>
      patch("school/publication", data, options),

    getProfile: (options) => get("profile", undefined, options),
    saveProfile: (data, options) => post("profile", data, options),

    getClasses: (params, options) => get("classes", params, options),
    createClass: (data, options) => post("classes", data, options),

    getStudents: (params, options) => get("students", params, options),
    createStudent: (data, options) => post("students", data, options),
    getStudent: (studentId, options) =>
      get(`students/${pathSegment(studentId, "student ID")}`, undefined, options),
    updateStudent: (studentId, data, options) =>
      put(`students/${pathSegment(studentId, "student ID")}`, data, options),

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
      put(`events/${pathSegment(eventId, "event ID")}`, data, options),
    deleteEvent: (eventId, options) =>
      del(`events/${pathSegment(eventId, "event ID")}`, options),
    getCalendar: (params, options) => get("calendar", params, options),

    getCBCProjects: (params, options) => get("cbc/projects", params, options),
    createCBCProject: (data, options) => post("cbc/projects", data, options),
    updateCBCProjectPublication: (projectId, data, options) =>
      patch(
        `cbc/projects/${pathSegment(projectId, "project ID")}/publication`,
        data,
        options,
      ),
  };

  // -------------------------------------------------------------------------
  // Staff routes.
  // -------------------------------------------------------------------------
  const staff = {
    getStaff: (params, options) => get("staff", params, options),
    getStaffMember: (userId, options) =>
      get(`staff/${pathSegment(userId, "user ID")}`, undefined, options),
    updateStaffMember: (userId, data, options) =>
      put(`staff/${pathSegment(userId, "user ID")}`, data, options),
    deleteStaffMember: (userId, options) =>
      del(`staff/${pathSegment(userId, "user ID")}`, options),
    getCurrentStaffMember: (options) => get("staff/me", undefined, options),
    getTeachers: (params, options) => get("staff/teachers", params, options),
    inviteStaff: (data, options) => post("staff/invite", data, options),
    acceptStaffInvitation: (data, options) =>
      post("staff/invitations/accept", data, options),
    assignStaff: (data, options) => post("staff/assignments", data, options),
    removeStaffAssignment: (data, options = {}) =>
      del("staff/assignments", { ...options, body: data }),
    getStaffAssignments: (params, options) =>
      get("staff/assignments/list", params, options),
    rebuildTeacherScopes: (data = {}, options) =>
      post("staff/maintenance/rebuild-teacher-scopes", data, options),
  };

  // -------------------------------------------------------------------------
  // Reports routes.
  // -------------------------------------------------------------------------
  const reports = {
    getAttendanceReport: (params, options) =>
      get("reports/attendance", params, options),
    getCurriculaReports: (params, options) =>
      get("reports/curricula", params, options),
    createCurriculaReport: (data, options) =>
      post("reports/curricula", data, options),
    getCurriculaReport: (curriculumId, options) =>
      get(`reports/curricula/${pathSegment(curriculumId, "curriculum ID")}`, undefined, options),
    getReportsDashboard: (params, options) =>
      get("reports/dashboard", params, options),
    getExamReports: (params, options) =>
      get("reports/exam-reports", params, options),
    getExamReport: (reportId, options) =>
      get(`reports/exam-reports/${pathSegment(reportId, "report ID")}`, undefined, options),
    publishExamReport: (reportId, options) =>
      post(`reports/exam-reports/${pathSegment(reportId, "report ID")}/publish`, {}, options),
    createClassExamReport: (data, options) =>
      post("reports/exam-reports/class", data, options),
    createStudentExamReport: (data, options) =>
      post("reports/exam-reports/student", data, options),
    getFeesReport: (params, options) => get("reports/fees", params, options),
    getReportsOverview: (params, options) => get("reports/overview", params, options),
    getProgrammes: (params, options) => get("reports/programmes", params, options),
    createProgramme: (data, options) => post("reports/programmes", data, options),
    getProgramme: (programmeId, options) =>
      get(`reports/programmes/${pathSegment(programmeId, "programme ID")}`, undefined, options),
    publishProgramme: (programmeId, options) =>
      post(`reports/programmes/${pathSegment(programmeId, "programme ID")}/publish`, {}, options),
    getTimetableReport: (params, options) => get("reports/timetable", params, options),
  };

  // -------------------------------------------------------------------------
  // Timetable routes.
  // -------------------------------------------------------------------------
  const timetable = {
    getTimetable: (params, options) => get("timetable", params, options),
    createTimetable: (data, options) => post("timetable", data, options),
    getTimetableById: (timetableId, options) =>
      get(`timetable/${pathSegment(timetableId, "timetable ID")}`, undefined, options),
    generateTimetable: (timetableId, data = {}, options) =>
      post(`timetable/${pathSegment(timetableId, "timetable ID")}/generate`, data, options),
    optimizeTimetable: (timetableId, data = {}, options) =>
      post(`timetable/${pathSegment(timetableId, "timetable ID")}/optimize`, data, options),
    publishTimetable: (timetableId, data = {}, options) =>
      post(`timetable/${pathSegment(timetableId, "timetable ID")}/publish`, data, options),
    getClassTimetable: (classId, params, options) =>
      get(`timetable/class/${pathSegment(classId, "class ID")}`, params, options),
    updateTimetableEntry: (entryId, data, options) =>
      patch(`timetable/entries/${pathSegment(entryId, "entry ID")}`, data, options),
    getMyTeacherTimetable: (params, options) =>
      get("timetable/teacher/me", params, options),
  };

  // -------------------------------------------------------------------------
  // Sync routes.
  // -------------------------------------------------------------------------
  const sync = {
    getSyncStatus: (params, options) => get("sync/status", params, options),
    getSyncConnections: (params, options) => get("sync/connections", params, options),
    createSyncConnection: (data, options) => post("sync/connections", data, options),
    getSyncConnection: (connectionId, options) =>
      get(`sync/connections/${pathSegment(connectionId, "connection ID")}`, undefined, options),
    activateSyncConnection: (connectionId, data = {}, options) =>
      post(`sync/connections/${pathSegment(connectionId, "connection ID")}/activate`, data, options),
    heartbeatSyncConnection: (connectionId, data = {}, options) =>
      post(`sync/connections/${pathSegment(connectionId, "connection ID")}/heartbeat`, data, options),
    pauseSyncConnection: (connectionId, data = {}, options) =>
      post(`sync/connections/${pathSegment(connectionId, "connection ID")}/pause`, data, options),
    revokeSyncConnection: (connectionId, data = {}, options) =>
      post(`sync/connections/${pathSegment(connectionId, "connection ID")}/revoke`, data, options),
    getSyncDevices: (params, options) => get("sync/devices", params, options),
    createSyncDevice: (data, options) => post("sync/devices", data, options),
    exportSyncEntity: (entityType, params, options) =>
      get(`sync/export/${pathSegment(entityType, "entity type")}`, params, options),
    ingestSyncRecords: (data, options) => post("sync/ingest", data, options),
    getSyncJobs: (params, options) => get("sync/jobs", params, options),
    getSyncJob: (jobId, options) =>
      get(`sync/jobs/${pathSegment(jobId, "job ID")}`, undefined, options),
    cancelSyncJob: (jobId, data = {}, options) =>
      post(`sync/jobs/${pathSegment(jobId, "job ID")}/cancel`, data, options),
    pauseSyncJob: (jobId, data = {}, options) =>
      post(`sync/jobs/${pathSegment(jobId, "job ID")}/pause`, data, options),
    resumeSyncJob: (jobId, data = {}, options) =>
      post(`sync/jobs/${pathSegment(jobId, "job ID")}/resume`, data, options),
    retrySyncJob: (jobId, data = {}, options) =>
      post(`sync/jobs/${pathSegment(jobId, "job ID")}/retry`, data, options),
    recoverSyncJobs: (data = {}, options) => post("sync/jobs/recover", data, options),
    getSyncConflicts: (params, options) => get("sync/conflicts", params, options),
    resolveSyncConflict: (conflictId, data, options) =>
      post(`sync/conflicts/${pathSegment(conflictId, "conflict ID")}/resolve`, data, options),
  };

  // -------------------------------------------------------------------------
  // Automation routes.
  // -------------------------------------------------------------------------
  const automation = {
    getAutomationStatus: (params, options) => get("automation/status", params, options),
    getAutomationActions: (params, options) => get("automation/actions", params, options),
    getAutomationJobs: (params, options) => get("automation/jobs", params, options),
    getAutomationJob: (jobId, options) =>
      get(`automation/jobs/${pathSegment(jobId, "automation job ID")}`, undefined, options),
    cancelAutomationJob: (jobId, data = {}, options) =>
      post(`automation/jobs/${pathSegment(jobId, "automation job ID")}/cancel`, data, options),
    retryAutomationJob: (jobId, data = {}, options) =>
      post(`automation/jobs/${pathSegment(jobId, "automation job ID")}/retry`, data, options),
    recoverAutomationJobs: (data = {}, options) => post("automation/jobs/recover", data, options),
    getAutomationLogs: (params, options) => get("automation/logs", params, options),
    getAutomationRules: (params, options) => get("automation/rules", params, options),
    createAutomationRule: (data, options) => post("automation/rules", data, options),
    getAutomationRule: (ruleId, options) =>
      get(`automation/rules/${pathSegment(ruleId, "automation rule ID")}`, undefined, options),
    updateAutomationRule: (ruleId, data, options) =>
      patch(`automation/rules/${pathSegment(ruleId, "automation rule ID")}`, data, options),
    deleteAutomationRule: (ruleId, options) =>
      del(`automation/rules/${pathSegment(ruleId, "automation rule ID")}`, options),
    enableAutomationRule: (ruleId, data = {}, options) =>
      post(`automation/rules/${pathSegment(ruleId, "automation rule ID")}/enable`, data, options),
    disableAutomationRule: (ruleId, data = {}, options) =>
      post(`automation/rules/${pathSegment(ruleId, "automation rule ID")}/disable`, data, options),
    runAutomationRule: (ruleId, data = {}, options) =>
      post(`automation/rules/${pathSegment(ruleId, "automation rule ID")}/run`, data, options),
    runAutomation: (data = {}, options) => post("automation/run", data, options),
  };

  // -------------------------------------------------------------------------
  // Public routes: these are present in the user's registered route list.
  // The server still controls which school information is publishable.
  // -------------------------------------------------------------------------
  const publicApi = {
    getPublicSchool: (params, options) => publicGet("public/school", params, options),
    getPublicSchools: (params, options) => publicGet("public/schools", params, options),
    getPublicEvents: (params, options) => publicGet("public/events", params, options),
    getPublicCalendar: (params, options) => publicGet("public/calendar", params, options),
    getPublicCBCProjects: (params, options) =>
      publicGet("public/cbc/projects", params, options),
    getPublicStatus: (params, options) => publicGet("public/status", params, options),
    getPublicDocuments: (params, options) => publicGet("public/documents", params, options),
    downloadPublicDocument: (documentId, options = {}) =>
      request(`public/documents/${pathSegment(documentId, "document ID")}/download`, {
        ...options,
        method: "GET",
        credentials: "omit",
        includeAuth: false,
        responseType: "blob",
      }),
  };

  // -------------------------------------------------------------------------
  // Document-management routes: GET/POST/PATCH/DELETE /documents/manage.
  // -------------------------------------------------------------------------
  const documents = {
    getManagedDocuments: (params, options) => get("documents/manage", params, options),
    createManagedDocument: (data, options) => post("documents/manage", data, options),
    updateManagedDocument: (documentId, data, options) =>
      patch(`documents/manage/${pathSegment(documentId, "document ID")}`, data, options),
    deleteManagedDocument: (documentId, options) =>
      del(`documents/manage/${pathSegment(documentId, "document ID")}`, options),
  };

  // -------------------------------------------------------------------------
  // School verification routes.
  // -------------------------------------------------------------------------
  const verification = {
    getSchoolApplications: (params, options) =>
      get("verification/applications", params, options),
    reviewSchoolApplication: (applicationId, data, options) =>
      post(
        `verification/applications/${pathSegment(applicationId, "application ID")}/review`,
        data,
        options,
      ),
  };

  return {
    ...core,
    ...staff,
    ...reports,
    ...timetable,
    ...sync,
    ...automation,
    ...documents,
    ...verification,
    public: publicApi,

    // Flat public API names support simple useElimuApi() call sites.
    getPublicSchool: publicApi.getPublicSchool,
    getPublicSchools: publicApi.getPublicSchools,
    getPublicEvents: publicApi.getPublicEvents,
    getPublicCalendar: publicApi.getPublicCalendar,
    getPublicCBCProjects: publicApi.getPublicCBCProjects,
    getPublicStatus: publicApi.getPublicStatus,
    getPublicDocuments: publicApi.getPublicDocuments,
    downloadPublicDocument: publicApi.downloadPublicDocument,
  };
}

/** React hook used by Elimu dashboards and forms. */
export function useElimuApi() {
  const auth = useAuth();
  const baseUrl = resolveElimuBackendUrl();

  // Depend on the actual auth values rather than the whole context object,
  // because some providers create a new wrapper object on every render.
  const accessToken = auth?.accessToken;
  const access_token = auth?.access_token;
  const tokenValue = auth?.token;
  const user = auth?.user;
  const session = auth?.session;
  const authData = auth?.data;
  const getAccessToken = auth?.getAccessToken;

  const tokenProvider = useMemo(
    () => async () => {
      const contextToken = getTokenFromAuthContext({
        accessToken,
        access_token,
        token: tokenValue,
        user,
        session,
        data: authData,
      });
      if (contextToken) return contextToken;

      // Some AuthContext implementations expose the token via an async getter.
      if (typeof getAccessToken === "function") {
        try {
          return tokenFromValue(await getAccessToken());
        } catch {
          return null;
        }
      }

      return null;
    },
    [accessToken, access_token, tokenValue, user, session, authData, getAccessToken],
  );

  return useMemo(
    () => createElimuApiClient({ baseUrl, token: tokenProvider }),
    [baseUrl, tokenProvider],
  );
}

export default useElimuApi;
