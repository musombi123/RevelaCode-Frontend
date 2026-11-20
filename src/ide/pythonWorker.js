// Python in the browser via Pyodide. Loaded once, then reused.
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodideReady = null;

async function init() {
  const pyodide = await loadPyodide();
  pyodide.setStdout({ batched: (text) => postMessage({ type: "out", text }) });
  pyodide.setStderr({ batched: (text) => postMessage({ type: "err", text }) });
  return pyodide;
}

self.onmessage = async (event) => {
  const { code } = event.data;
  try {
    postMessage({ type: "status", text: "Loading Python runtime…" });
    pyodideReady ??= init();
    const pyodide = await pyodideReady;

    postMessage({ type: "status", text: "Loading required Python packages…" });
    await pyodide.loadPackagesFromImports(code);

    // Resolve package imports first; user code itself has no browser network APIs.
    const denyNetwork = () => {
      throw new Error("Network access is disabled in the RevelaAI Python runner. Use local fixtures or mocked responses.");
    };
    try { self.fetch = denyNetwork; } catch { /* A browser may expose fetch readonly. */ }
    try { self.XMLHttpRequest = denyNetwork; } catch { /* A browser may expose XHR readonly. */ }
    try { self.WebSocket = denyNetwork; } catch { /* A browser may expose WebSocket readonly. */ }
    try { self.EventSource = denyNetwork; } catch { /* A browser may expose EventSource readonly. */ }

    postMessage({ type: "status", text: "" });
    postMessage({ type: "started" });
    const result = await pyodide.runPythonAsync(code);
    if (result !== undefined) postMessage({ type: "out", text: "→ " + String(result) });
    postMessage({ type: "done" });
  } catch (error) {
    postMessage({ type: "error", text: String(error?.stack || error?.message || error) });
  }
};
