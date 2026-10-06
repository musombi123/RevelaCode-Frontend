// Runs user JavaScript off the main thread, with no DOM and no localStorage.

const show = (value) => {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2) ?? String(value);
  } catch {
    return String(value);
  }
};

const send = (type) => (...args) =>
  postMessage({ type, text: args.map(show).join(" ") });

self.onmessage = async (event) => {
  const fakeConsole = {
    log: send("out"),
    info: send("out"),
    warn: send("err"),
    error: send("err"),
  };

  try {
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    const run = new AsyncFunction("console", event.data.code);

    postMessage({ type: "started" });
    const result = await run(fakeConsole);

    if (result !== undefined) postMessage({ type: "out", text: `→ ${show(result)}` });
    postMessage({ type: "done" });
  } catch (error) {
    postMessage({ type: "error", text: String(error?.stack || error) });
  }
};