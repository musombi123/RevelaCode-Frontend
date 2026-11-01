const API_BASE = String(
  import.meta.env.VITE_REVELAAI_API_URL || "https://revelaai.onrender.com"
).trim().replace(/\/+$/, "");

async function readResponse(response) {
  let payload = {};
  try {
    payload = await response.json();
  } catch {
    // The API error below is stable even when an upstream sends non-JSON text.
  }
  if (!response.ok) {
    const message =
      payload?.error?.message ||
      payload?.message ||
      payload?.detail ||
      `Security Academy request failed (HTTP ${response.status}).`;
    throw new Error(String(message));
  }
  return payload?.data ?? payload;
}

async function request(authFetch, path, options = {}) {
  if (typeof authFetch !== "function") {
    throw new Error("Authenticated RevelaCode session is required.");
  }
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const response = await authFetch(`${API_BASE}/api/security-academy${path}`, {
    ...options,
    headers,
  });
  return readResponse(response);
}

export function listSecurityCourses(authFetch) {
  return request(authFetch, "/courses", { method: "GET" });
}

export function getSecurityCourse(authFetch, courseId) {
  return request(authFetch, `/courses/${encodeURIComponent(courseId)}`, { method: "GET" });
}

export function completeSecurityLesson(authFetch, courseId, lessonId) {
  return request(
    authFetch,
    `/courses/${encodeURIComponent(courseId)}/lessons/${encodeURIComponent(lessonId)}/complete`,
    { method: "POST", body: JSON.stringify({}) }
  );
}

export function submitSecurityQuiz(authFetch, courseId, answers) {
  return request(
    authFetch,
    `/courses/${encodeURIComponent(courseId)}/quiz`,
    { method: "POST", body: JSON.stringify({ answers }) }
  );
}
