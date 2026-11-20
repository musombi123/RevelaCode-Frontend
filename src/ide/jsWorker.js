// JavaScript runs in a dedicated worker without DOM or persistent browser storage.
const show = (value) => {
  if (typeof value === "string") return value;
  try { return JSON.stringify(value, null, 2) ?? String(value); }
  catch { return String(value); }
};

const send = (type) => (...args) =>
  postMessage({ type, text: args.map(show).join(" ") });

function disableNetworkAccess() {
  const denied = () => {
    throw new Error("Network access is disabled in the RevelaAI code runner. Use local fixtures or mocked responses.");
  };
  for (const name of ["fetch", "XMLHttpRequest", "WebSocket", "EventSource", "importScripts", "Worker", "SharedWorker"]) {
    try {
      Object.defineProperty(self, name, {
        configurable: false,
        writable: false,
        value: denied,
      });
    } catch {
      try { self[name] = denied; } catch { /* Browser may expose a readonly global. */ }
    }
  }
}

self.onmessage = async (event) => {
  const fakeConsole = {
    log: send("out"),
    info: send("out"),
    debug: send("out"),
    warn: send("warn"),
    error: send("err"),
  };

  try {
    disableNetworkAccess();
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const run = new AsyncFunction("console", event.data.code);

    postMessage({ type: "started" });
    const result = await run(fakeConsole);
    if (result !== undefined) postMessage({ type: "out", text: "→ " + show(result) });
    postMessage({ type: "done" });
  } catch (error) {
    postMessage({ type: "error", text: String(error?.stack || error) });
  }
};
