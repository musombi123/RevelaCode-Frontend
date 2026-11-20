import { registerPlugin } from "@capacitor/core";

// Capacitor keeps a process-wide registry for native plugin proxies. A few
// older utility modules registered the same bridge independently, which made
// Capacitor warn that RevelaDownload had already been registered. Cache plugin
// proxies on globalThis as well so code-split chunks share one registration.
const REGISTRY_KEY = Symbol.for("revelacode.capacitor.plugins.v1");
const registry = (() => {
  const root = globalThis;
  if (!root[REGISTRY_KEY]) {
    Object.defineProperty(root, REGISTRY_KEY, {
      value: Object.create(null),
      configurable: false,
      enumerable: false,
      writable: false,
    });
  }
  return root[REGISTRY_KEY];
})();

export function getRevelaCapacitorPlugin(name) {
  const pluginName = String(name || "").trim();
  if (!pluginName) throw new TypeError("A Capacitor plugin name is required.");
  if (!Object.prototype.hasOwnProperty.call(registry, pluginName)) {
    registry[pluginName] = registerPlugin(pluginName);
  }
  return registry[pluginName];
}

export const NativeDownloads = getRevelaCapacitorPlugin("RevelaDownload");
