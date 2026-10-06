const ALIASES = {
  js: "javascript", javascript: "javascript", node: "javascript", mjs: "javascript",
  py: "python", python: "python", python3: "python",
  html: "html", htm: "html",
};

export const normalizeLanguage = (value = "") =>
  ALIASES[String(value).toLowerCase()] || null;

const EXECUTION_TIMEOUT_MS = 10000;

const makeWorker = {
  javascript: () => new Worker(new URL("./jsWorker.js", import.meta.url)),
  python: () => new Worker(new URL("./pythonWorker.js", import.meta.url)),
};

// Python keeps one worker alive so Pyodide only loads once.
const live = { javascript: null, python: null };

export function stopCode(language) {
  live[language]?.terminate();
  live[language] = null;
}

export function runCode(language, code, { onLine, onStatus } = {}) {
  return new Promise((resolve) => {
    if (!makeWorker[language]) {
      resolve({ ok: false, error: "This language can't run in the browser." });
      return;
    }

    // JS gets a fresh worker every run; Python reuses its worker.
    if (language === "javascript") stopCode("javascript");
    const worker = (live[language] ??= makeWorker[language]());

    let timer = null;
    const finish = (result) => {
      clearTimeout(timer);
      worker.onmessage = null;
      worker.onerror = null;
      if (language === "javascript") stopCode("javascript");
      resolve(result);
    };

    worker.onmessage = ({ data }) => {
      switch (data.type) {
        case "status": onStatus?.(data.text); break;
        case "started":
          timer = setTimeout(() => {
            stopCode(language); // kills infinite loops
            resolve({ ok: false, error: `Stopped: ran longer than ${EXECUTION_TIMEOUT_MS / 1000} seconds.` });
          }, EXECUTION_TIMEOUT_MS);
          break;
        case "out":
        case "err": onLine?.(data.type, data.text); break;
        case "done": finish({ ok: true }); break;
        case "error": finish({ ok: false, error: data.text }); break;
        default: break;
      }
    };

    worker.onerror = (event) => {
      stopCode(language);
      resolve({ ok: false, error: event.message || "Worker crashed." });
    };

    worker.postMessage({ code });
  });
}