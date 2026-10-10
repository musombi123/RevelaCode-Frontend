// src/services/elimuApi.jsx

import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext.jsx";

// =========================================================
// ELIMU API CONFIGURATION
// =========================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_REVELACODE_URL ||
  import.meta.env.VITE_BACKEND_URL ||
  "";

function normalizeApiBase(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/jumuiya\/elimu$/i, "")
    .replace(/\/api\/jumuiya$/i, "")
    .replace(/\/api$/i, "")
    .replace(/\/+$/, "");
}

const API_BASE = normalizeApiBase(API_URL);

export const ELIMU_API_ROOT =
  `${API_BASE}/api/jumuiya/elimu`;

function buildUrl(path) {
  const normalizedPath = String(path || "").startsWith("/")
    ? String(path)
    : `/${path}`;

  return `${ELIMU_API_ROOT}${normalizedPath}`;
}

// =========================================================
// HELPERS
// =========================================================

function encodeId(value, label = "ID") {
  if (
    value === undefined ||
    value === null ||
    String(value).trim() === ""
  ) {
    throw new Error(`${label} is required.`);
  }

  return encodeURIComponent(String(value));
}

function withQuery(path, values = {}) {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(values)) {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      continue;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          params.append(key, String(item));
        }
      });

      continue;
    }

    params.set(key, String(value));
  }

  const query = params.toString();

  return query ? `${path}?${query}` : path;
}

function extractData(payload) {
  if (
    payload &&
    typeof payload === "object" &&
    Object.prototype.hasOwnProperty.call(payload, "data")
  ) {
    return payload.data;
  }

  return payload;
}

function isFormData(value) {
  return (
    typeof FormData !== "undefined" &&
    value instanceof FormData
  );
}

async function readResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType =
    response.headers.get("content-type") || "";

  if (contentType.toLowerCase().includes("json")) {
    return response.json().catch(() => null);
  }

  const text = await response.text().catch(() => "");

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text.slice(0, 2000) };
  }
}

function getErrorMessage(payload, status) {
  return (
    payload?.error?.message ||
    payload?.message ||
    payload?.detail ||
    `Elimu request failed with HTTP ${status}.`
  );
}

// =========================================================
// ELIMU API HOOK
// =========================================================

export function useElimuApi() {
  const { authFetch } = useAuth();

  // -------------------------------------------------------
  // REQUEST ENGINE
  // -------------------------------------------------------

  const request = useCallback(
    async (path, options = {}) => {
      const url = buildUrl(path);

      const {
        method = "GET",
        body,
        headers = {},
        ...rest
      } = options;

      const requestHeaders = new Headers(headers);

      if (!requestHeaders.has("Accept")) {
        requestHeaders.set("Accept", "application/json");
      }

      let requestBody = body;

      if (
        body !== undefined &&
        body !== null &&
        !isFormData(body) &&
        typeof body !== "string" &&
        !(body instanceof URLSearchParams)
      ) {
        requestBody = JSON.stringify(body);

        if (!requestHeaders.has("Content-Type")) {
          requestHeaders.set(
            "Content-Type",
            "application/json",
          );
        }
      }

      let response;

      try {
        response = await authFetch(url, {
          ...rest,
          method,
          headers: requestHeaders,
          body: requestBody,
        });
      } catch (error) {
        const detail =
          error?.message || "Unknown network error.";

        throw new Error(
          `Unable to reach the Elimu backend at ${url}. ${detail}`,
        );
      }

      const payload = await readResponse(response);

      if (!response.ok) {
        const error = new Error(
          getErrorMessage(payload, response.status),
        );

        error.status = response.status;
        error.code =
          payload?.error?.code ||
          payload?.code ||
          `http_${response.status}`;

        error.details =
          payload?.error?.details ||
          payload?.details ||
          null;

        throw error;
      }

      if (payload?.success === false) {
        const error = new Error(
          getErrorMessage(payload, response.status),
        );

        error.status = response.status;
        error.code =
          payload?.error?.code || "request_failed";

        error.details =
          payload?.error?.details || null;

        throw error;
      }

      return payload;
    },
    [authFetch],
  );

  const get = useCallback(
    (path, options = {}) =>
      request(path, {
        ...options,
        method: "GET",
      }),
    [request],
  );

  const post = useCallback(
    (path, body = {}) =>
      request(path, {
        method: "POST",
        body,
      }),
    [request],
  );

  const put = useCallback(
    (path, body = {}) =>
      request(path, {
        method: "PUT",
        body,
      }),
    [request],
  );

  const patch = useCallback(
    (path, body = {}) =>
      request(path, {
        method: "PATCH",
        body,
      }),
    [request],
  );

  const del = useCallback(
    (path, body) =>
      request(path, {
        method: "DELETE",
        ...(body === undefined ? {} : { body }),
      }),
    [request],
  );

  const getData = useCallback(
    async (path, options) =>
      extractData(await get(path, options)),
    [get],
  );

  const postData = useCallback(
    async (path, body = {}) =>
      extractData(await post(path, body)),
    [post],
  );

  const putData = useCallback(
    async (path, body = {}) =>
      extractData(await put(path, body)),
    [put],
  );

  const patchData = useCallback(
    async (path, body = {}) =>
      extractData(await patch(path, body)),
    [patch],
  );

  const deleteData = useCallback(
    async (path, body) =>
      extractData(await del(path, body)),
    [del],
  );

  // -------------------------------------------------------
  // HEALTH, ACCESS AND SCHOOL SETUP
  // -------------------------------------------------------

  const api = useMemo(
    () => ({
      getElimuHealth: () =>
        getData("/health"),

      getElimuAccess: () =>
        getData("/access"),

      getElimuBootstrap: () =>
        getData("/bootstrap"),

      getEducationProfile: () =>
        getData("/profile"),

      saveEducationProfile: (data) =>
        postData("/profile", data),

      getSchool: () =>
        getData("/school"),

      saveSchool: (data) =>
        postData("/school", data),

      createElimuDemoSchool: (data) =>
        postData("/school/demo", data),

      getElimuDashboard: () =>
        getData("/dashboard"),

      // ---------------------------------------------------
      // CLASSES
      // ---------------------------------------------------

      getClasses: () =>
        getData("/classes"),

      createClass: (data) =>
        postData("/classes", data),

      // ---------------------------------------------------
      // STUDENTS
      // ---------------------------------------------------

      getStudents: ({ className = "" } = {}) =>
        getData(
          withQuery("/students", {
            class_name: className,
          }),
        ),

      createStudent: (data) =>
        postData("/students", data),

      getStudent: (studentId) =>
        getData(
          `/students/${encodeId(studentId, "Student ID")}`,
        ),

      updateStudent: (studentId, data) =>
        putData(
          `/students/${encodeId(studentId, "Student ID")}`,
          data,
        ),

      // ---------------------------------------------------
      // LESSONS
      // ---------------------------------------------------

      getLessons: ({ subject = "" } = {}) =>
        getData(
          withQuery("/lessons", { subject }),
        ),

      createLesson: (data) =>
        postData("/lessons", data),

      // ---------------------------------------------------
      // ASSIGNMENTS
      // ---------------------------------------------------

      getAssignments: ({ className = "" } = {}) =>
        getData(
          withQuery("/assignments", {
            class_name: className,
          }),
        ),

      createAssignment: (data) =>
        postData("/assignments", data),

      // ---------------------------------------------------
      // ATTENDANCE
      // ---------------------------------------------------

      getAttendance: ({
        studentId = "",
        className = "",
        startDate = "",
        endDate = "",
      } = {}) =>
        getData(
          withQuery("/attendance", {
            student_id: studentId,
            class_name: className,
            start_date: startDate,
            end_date: endDate,
          }),
        ),

      createAttendance: (data) =>
        postData("/attendance", data),

      // ---------------------------------------------------
      // ASSESSMENTS
      // ---------------------------------------------------

      getAssessments: ({
        studentId = "",
        className = "",
        subject = "",
        academicYear = "",
        term = "",
      } = {}) =>
        getData(
          withQuery("/assessments", {
            student_id: studentId,
            class_name: className,
            subject,
            academic_year: academicYear,
            term,
          }),
        ),

      createAssessment: (data) =>
        postData("/assessments", data),

      // ---------------------------------------------------
      // FEES
      // ---------------------------------------------------

      getFees: ({ status = "" } = {}) =>
        getData(
          withQuery("/fees", { status }),
        ),

      createFee: (data) =>
        postData("/fees", data),

      // ---------------------------------------------------
      // CBC PROJECTS
      // ---------------------------------------------------

      getCBCProjects: () =>
        getData("/cbc/projects"),

      createCBCProject: (data) =>
        postData("/cbc/projects", data),

      // ---------------------------------------------------
      // EVENTS AND CALENDAR
      // ---------------------------------------------------

      getEvents: ({
        year = "",
        eventType = "",
      } = {}) =>
        getData(
          withQuery("/events", {
            year,
            event_type: eventType,
          }),
        ),

      createEvent: (data) =>
        postData("/events", data),

      updateEvent: (eventId, data) =>
        putData(
          `/events/${encodeId(eventId, "Event ID")}`,
          data,
        ),

      deleteEvent: (eventId) =>
        deleteData(
          `/events/${encodeId(eventId, "Event ID")}`,
        ),

      getCalendar: ({ year = "" } = {}) =>
        getData(
          withQuery("/calendar", { year }),
        ),

      // ---------------------------------------------------
      // STAFF AND SCHOOL MEMBERS
      // ---------------------------------------------------

      getStaff: () =>
        getData("/staff"),

      getStaffMember: (userId) =>
        getData(
          `/staff/${encodeId(userId, "User ID")}`,
        ),

      updateStaffMember: (userId, data) =>
        putData(
          `/staff/${encodeId(userId, "User ID")}`,
          data,
        ),

      removeStaffMember: (userId) =>
        deleteData(
          `/staff/${encodeId(userId, "User ID")}`,
        ),

      getMyStaffProfile: () =>
        getData("/staff/me"),

      getTeachers: () =>
        getData("/staff/teachers"),

      inviteStaff: (data) =>
        postData("/staff/invite", data),

      acceptStaffInvitation: (data) =>
        postData("/staff/invitations/accept", data),

      getStaffAssignments: ({
        teacherUserId = "",
      } = {}) =>
        getData(
          withQuery("/staff/assignments/list", {
            teacher_user_id: teacherUserId,
          }),
        ),

      assignTeacher: (data) =>
        postData("/staff/assignments", data),

      deactivateTeacherAssignment: (data) =>
        deleteData("/staff/assignments", data),

      rebuildTeacherScopes: () =>
        postData("/staff/maintenance/rebuild-teacher-scopes", {}),

      // ---------------------------------------------------
      // TIMETABLE
      // ---------------------------------------------------

      getTimetables: () =>
        getData("/timetable"),

      createTimetable: (data) =>
        postData("/timetable", data),

      getTimetable: (timetableId) =>
        getData(
          `/timetable/${encodeId(timetableId, "Timetable ID")}`,
        ),

      generateTimetable: (timetableId, data = {}) =>
        postData(
          `/timetable/${encodeId(timetableId, "Timetable ID")}/generate`,
          data,
        ),

      optimizeTimetable: (timetableId, data = {}) =>
        postData(
          `/timetable/${encodeId(timetableId, "Timetable ID")}/optimize`,
          data,
        ),

      publishTimetable: (timetableId, data = {}) =>
        postData(
          `/timetable/${encodeId(timetableId, "Timetable ID")}/publish`,
          data,
        ),

      getClassTimetable: (classId) =>
        getData(
          `/timetable/class/${encodeId(classId, "Class ID")}`,
        ),

      updateTimetableEntry: (entryId, data) =>
        patchData(
          `/timetable/entries/${encodeId(entryId, "Entry ID")}`,
          data,
        ),

      getMyTeacherTimetable: () =>
        getData("/timetable/teacher/me"),

      // ---------------------------------------------------
      // REPORTS AND CURRICULA
      // ---------------------------------------------------

      getReportsDashboard: () =>
        getData("/reports/dashboard"),

      getReportsOverview: () =>
        getData("/reports/overview"),

      getAttendanceReport: (filters = {}) =>
        getData(
          withQuery("/reports/attendance", filters),
        ),

      getFeesReport: (filters = {}) =>
        getData(
          withQuery("/reports/fees", filters),
        ),

      getTimetableReport: (filters = {}) =>
        getData(
          withQuery("/reports/timetable", filters),
        ),

      getCurricula: (filters = {}) =>
        getData(
          withQuery("/reports/curricula", filters),
        ),

      saveCurriculum: (data) =>
        postData("/reports/curricula", data),

      getCurriculum: (curriculumId) =>
        getData(
          `/reports/curricula/${encodeId(curriculumId, "Curriculum ID")}`,
        ),

      getExamReports: (filters = {}) =>
        getData(
          withQuery("/reports/exam-reports", filters),
        ),

      getExamReport: (reportId) =>
        getData(
          `/reports/exam-reports/${encodeId(reportId, "Report ID")}`,
        ),

      publishExamReport: (reportId, data = {}) =>
        postData(
          `/reports/exam-reports/${encodeId(reportId, "Report ID")}/publish`,
          data,
        ),

      generateClassExamReports: (data) =>
        postData("/reports/exam-reports/class", data),

      generateStudentExamReport: (data) =>
        postData("/reports/exam-reports/student", data),

      getProgrammes: (filters = {}) =>
        getData(
          withQuery("/reports/programmes", filters),
        ),

      generateProgramme: (data) =>
        postData("/reports/programmes", data),

      getProgramme: (programmeId) =>
        getData(
          `/reports/programmes/${encodeId(programmeId, "Programme ID")}`,
        ),

      publishProgramme: (programmeId, data = {}) =>
        postData(
          `/reports/programmes/${encodeId(programmeId, "Programme ID")}/publish`,
          data,
        ),

      // ---------------------------------------------------
      // SYNC: CONNECTIONS, DEVICES, JOBS AND CONFLICTS
      // ---------------------------------------------------

      getSyncStatus: () =>
        getData("/sync/status"),

      getSyncConnections: () =>
        getData("/sync/connections"),

      createSyncConnection: (data) =>
        postData("/sync/connections", data),

      getSyncConnection: (connectionId) =>
        getData(
          `/sync/connections/${encodeId(connectionId, "Connection ID")}`,
        ),

      activateSyncConnection: (connectionId, data = {}) =>
        postData(
          `/sync/connections/${encodeId(connectionId, "Connection ID")}/activate`,
          data,
        ),

      heartbeatSyncConnection: (connectionId, data = {}) =>
        postData(
          `/sync/connections/${encodeId(connectionId, "Connection ID")}/heartbeat`,
          data,
        ),

      pauseSyncConnection: (connectionId, data = {}) =>
        postData(
          `/sync/connections/${encodeId(connectionId, "Connection ID")}/pause`,
          data,
        ),

      revokeSyncConnection: (connectionId, data = {}) =>
        postData(
          `/sync/connections/${encodeId(connectionId, "Connection ID")}/revoke`,
          data,
        ),

      getSyncDevices: () =>
        getData("/sync/devices"),

      registerSyncDevice: (data) =>
        postData("/sync/devices", data),

      exportSyncEntity: (entityType, filters = {}) =>
        getData(
          withQuery(
            `/sync/export/${encodeId(entityType, "Entity type")}`,
            filters,
          ),
        ),

      ingestSyncRecords: (data) =>
        postData("/sync/ingest", data),

      getSyncJobs: (filters = {}) =>
        getData(
          withQuery("/sync/jobs", filters),
        ),

      getSyncJob: (jobId) =>
        getData(
          `/sync/jobs/${encodeId(jobId, "Job ID")}`,
        ),

      cancelSyncJob: (jobId, data = {}) =>
        postData(
          `/sync/jobs/${encodeId(jobId, "Job ID")}/cancel`,
          data,
        ),

      pauseSyncJob: (jobId, data = {}) =>
        postData(
          `/sync/jobs/${encodeId(jobId, "Job ID")}/pause`,
          data,
        ),

      resumeSyncJob: (jobId, data = {}) =>
        postData(
          `/sync/jobs/${encodeId(jobId, "Job ID")}/resume`,
          data,
        ),

      retrySyncJob: (jobId, data = {}) =>
        postData(
          `/sync/jobs/${encodeId(jobId, "Job ID")}/retry`,
          data,
        ),

      recoverSyncJobs: (data = {}) =>
        postData("/sync/jobs/recover", data),

      getSyncConflicts: (filters = {}) =>
        getData(
          withQuery("/sync/conflicts", filters),
        ),

      resolveSyncConflict: (conflictId, data) =>
        postData(
          `/sync/conflicts/${encodeId(conflictId, "Conflict ID")}/resolve`,
          data,
        ),

      // ---------------------------------------------------
      // AUTOMATION
      // ---------------------------------------------------

      getAutomationStatus: () =>
        getData("/automation/status"),

      getAutomationActions: () =>
        getData("/automation/actions"),

      runAutomation: (data) =>
        postData("/automation/run", data),

      getAutomationJobs: (filters = {}) =>
        getData(
          withQuery("/automation/jobs", filters),
        ),

      getAutomationJob: (jobId) =>
        getData(
          `/automation/jobs/${encodeId(jobId, "Job ID")}`,
        ),

      cancelAutomationJob: (jobId, data = {}) =>
        postData(
          `/automation/jobs/${encodeId(jobId, "Job ID")}/cancel`,
          data,
        ),

      retryAutomationJob: (jobId, data = {}) =>
        postData(
          `/automation/jobs/${encodeId(jobId, "Job ID")}/retry`,
          data,
        ),

      recoverAutomationJobs: (data = {}) =>
        postData("/automation/jobs/recover", data),

      getAutomationLogs: (filters = {}) =>
        getData(
          withQuery("/automation/logs", filters),
        ),

      getAutomationRules: (filters = {}) =>
        getData(
          withQuery("/automation/rules", filters),
        ),

      createAutomationRule: (data) =>
        postData("/automation/rules", data),

      getAutomationRule: (ruleId) =>
        getData(
          `/automation/rules/${encodeId(ruleId, "Rule ID")}`,
        ),

      updateAutomationRule: (ruleId, data) =>
        patchData(
          `/automation/rules/${encodeId(ruleId, "Rule ID")}`,
          data,
        ),

      deleteAutomationRule: (ruleId) =>
        deleteData(
          `/automation/rules/${encodeId(ruleId, "Rule ID")}`,
        ),

      disableAutomationRule: (ruleId, data = {}) =>
        postData(
          `/automation/rules/${encodeId(ruleId, "Rule ID")}/disable`,
          data,
        ),

      enableAutomationRule: (ruleId, data = {}) =>
        postData(
          `/automation/rules/${encodeId(ruleId, "Rule ID")}/enable`,
          data,
        ),

      runAutomationRule: (ruleId, data = {}) =>
        postData(
          `/automation/rules/${encodeId(ruleId, "Rule ID")}/run`,
          data,
        ),

      // ---------------------------------------------------
      // PLATFORM SCHOOL VERIFICATION
      // ---------------------------------------------------

      getSchoolApplications: (filters = {}) =>
        getData(
          withQuery("/verification/applications", filters),
        ),

      reviewSchoolApplication: (applicationId, data) =>
        postData(
          `/verification/applications/${encodeId(applicationId, "Application ID")}/review`,
          data,
        ),
    }),
    [
      getData,
      postData,
      putData,
      patchData,
      deleteData,
    ],
  );

  return api;
}

export default useElimuApi;