// Python in the browser via Pyodide. Loaded once, then reused.
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

let pyodideReady = null;

async function init() {
  const pyodide = await loadPyodide();
  pyodide.setStdout({ batched: (text) => postMessage({ type: "out", text }) });
  pyodide.setStderr({ batched: (text) => postMessage({ type: "err", text }) });
  return pyodide;
}

const nativeNetworkApis = {
  fetch: self.fetch,
  XMLHttpRequest: self.XMLHttpRequest,
  WebSocket: self.WebSocket,
  EventSource: self.EventSource,
};

function disableNetworkAccess() {
  const denied = () => {
    throw new Error("Network access is disabled in the RevelaAI Python runner. Use local fixtures or mocked responses.");
  };
  for (const name of Object.keys(nativeNetworkApis)) {
    try { self[name] = denied; } catch { /* A browser may expose this API readonly. */ }
  }
}

function restoreNetworkAccess() {
  for (const [name, value] of Object.entries(nativeNetworkApis)) {
    try { self[name] = value; } catch { /* A browser may expose this API readonly. */ }
  }
}

self.onmessage = async (event) => {
  const { code } = event.data;
  let networkDisabled = false;
  try {
    postMessage({ type: "status", text: "Loading Python runtime…" });
    pyodideReady ??= init();
    const pyodide = await pyodideReady;

    postMessage({ type: "status", text: "Loading required Python packages…" });
    // Resolve imports before disabling network access. Package installation is
    // limited to Pyodide's configured package index, never arbitrary user URLs.
    await pyodide.loadPackagesFromImports(code);

    disableNetworkAccess();
    networkDisabled = true;
    postMessage({ type: "status", text: "" });
    postMessage({ type: "started" });
    try {
      const result = await pyodide.runPythonAsync(code);
      if (result !== undefined) postMessage({ type: "out", text: "→ " + String(result) });
      postMessage({ type: "done" });
    } finally {
      restoreNetworkAccess();
      networkDisabled = false;
    }
  } catch (error) {
    if (networkDisabled) restoreNetworkAccess();
    postMessage({ type: "error", text: String(error?.stack || error?.message || error) });
  }
};
