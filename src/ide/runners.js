const ALIASES = {
  js: "javascript", javascript: "javascript", node: "javascript", mjs: "javascript", cjs: "javascript",
  py: "python", python: "python", python3: "python",
  html: "html", htm: "html",
};

export const normalizeLanguage = (value = "") =>
  ALIASES[String(value).toLowerCase()] || null;

const STARTUP_TIMEOUT_MS = 45000;
const EXECUTION_TIMEOUT_MS = 10000;

const makeWorker = {
  javascript: () => new Worker(new URL("./jsWorker.js", import.meta.url)),
  python: () => new Worker(new URL("./pythonWorker.js", import.meta.url)),
};

// Python retains its worker after successful runs so Pyodide is loaded once.
// A timed-out or manually stopped worker is always terminated.
const live = { javascript: null, python: null };
const activeRuns = { javascript: null, python: null };

function terminateWorker(language) {
  const worker = live[language];
  if (worker) worker.terminate();
  live[language] = null;
  activeRuns[language] = null;
}

export function stopCode(language) {
  const active = activeRuns[language];
  if (active?.finish) {
    active.finish({ ok: false, error: "Execution stopped by the user." }, true);
    return;
  }
  terminateWorker(language);
}

export function runCode(language, code, { onLine, onStatus } = {}) {
  return new Promise((resolve) => {
    if (!makeWorker[language]) {
      resolve({ ok: false, error: "This language can't run in the browser." });
      return;
    }

    // JavaScript gets a fresh worker per run; Python may reuse its warmed runtime.
    if (language === "javascript") terminateWorker("javascript");

    let worker;
    try {
      worker = (live[language] ??= makeWorker[language]());
    } catch (error) {
      resolve({ ok: false, error: error?.message || "The browser worker could not be started." });
      return;
    }

    let startupTimer = null;
    let executionTimer = null;
    let finished = false;

    const finish = (result, shouldTerminate = false) => {
      if (finished) return;
      finished = true;
      clearTimeout(startupTimer);
      clearTimeout(executionTimer);
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      if (activeRuns[language]?.worker === worker) activeRuns[language] = null;
      if (shouldTerminate || language === "javascript") {
        worker.terminate();
        if (live[language] === worker) live[language] = null;
      }
      resolve(result);
    };

    activeRuns[language] = { worker, finish };
    startupTimer = setTimeout(() => {
      finish({
        ok: false,
        error: "The " + language + " worker did not finish starting within " + STARTUP_TIMEOUT_MS / 1000 + " seconds.",
      }, true);
    }, STARTUP_TIMEOUT_MS);

    worker.onmessage = ({ data }) => {
      switch (data?.type) {
        case "status":
          onStatus?.(data.text);
          break;
        case "started":
          clearTimeout(startupTimer);
          executionTimer = setTimeout(() => {
            finish({
              ok: false,
              error: "Stopped: execution exceeded the " + EXECUTION_TIMEOUT_MS / 1000 + " second limit.",
            }, true);
          }, EXECUTION_TIMEOUT_MS);
          break;
        case "out":
        case "err":
        case "warn":
          onLine?.(data.type, data.text);
          break;
        case "done":
          finish({ ok: true });
          break;
        case "error":
          finish({ ok: false, error: String(data.text || "The program failed.") });
          break;
        default:
          break;
      }
    };

    worker.onerror = (event) => {
      finish({ ok: false, error: event.message || "The execution worker crashed." }, true);
    };
    worker.onmessageerror = () => {
      finish({ ok: false, error: "The execution worker returned an unreadable result." }, true);
    };

    try {
      worker.postMessage({ code: String(code ?? "") });
    } catch (error) {
      finish({ ok: false, error: error?.message || "The source could not be sent to the execution worker." }, true);
    }
  });
}
