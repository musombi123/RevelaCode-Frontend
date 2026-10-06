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
    postMessage({ type: "status", text: "Loading Python…" });
    pyodideReady ??= init();
    const pyodide = await pyodideReady;

    // Auto-installs supported packages the code imports (numpy, pandas, …)
    await pyodide.loadPackagesFromImports(code);

    postMessage({ type: "status", text: "" });
    postMessage({ type: "started" });

    const result = await pyodide.runPythonAsync(code);
    if (result !== undefined) postMessage({ type: "out", text: `→ ${String(result)}` });

    postMessage({ type: "done" });
  } catch (error) {
    postMessage({ type: "error", text: String(error?.message || error) });
  }
};