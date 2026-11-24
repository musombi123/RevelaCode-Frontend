/**
 * Resolve Foundry engine requests to the paired desktop agent.
 *
 * Local Agent credentials must never be attached to arbitrary absolute URLs.
 * Relative Foundry routes and explicitly configured NEXORA API URLs map to
 * the paired agent's /engine mount. Third-party destinations fail closed.
 */
export function resolveLocalEngineUrl(input, apiBase, localAgentBase) {
  const requested = String(input || "").trim();
  const cloudOrigin = String(apiBase || "").replace(/\/$/, "");
  const agentOrigin = String(localAgentBase || "").replace(/\/$/, "");
  if (!agentOrigin) throw new Error("The paired NEXORA Local Agent URL is not configured.");

  let agent;
  try {
    agent = new URL(agentOrigin);
  } catch {
    throw new Error("The paired NEXORA Local Agent URL is invalid.");
  }
  if (!["http:", "https:"].includes(agent.protocol) || !agent.hostname) {
    throw new Error("The paired NEXORA Local Agent URL must use HTTP or HTTPS.");
  }
  const localEngineOrigin = agent.origin + "/engine";

  // Preserve already-resolved engine URLs on this exact Local Agent origin.
  if (/^https?:\/\//i.test(requested)) {
    let parsed;
    try {
      parsed = new URL(requested);
    } catch {
      throw new Error("The local Foundry request URL is invalid.");
    }
    if (parsed.origin === agent.origin) {
      if (parsed.pathname === "/engine" || parsed.pathname.startsWith("/engine/")) {
        return parsed.toString();
      }
      return localEngineOrigin + parsed.pathname + parsed.search + parsed.hash;
    }
    if (cloudOrigin) {
      let cloud;
      try {
        cloud = new URL(cloudOrigin);
      } catch {
        throw new Error("The configured NEXORA API origin is invalid.");
      }
      if (parsed.origin === cloud.origin) {
        return localEngineOrigin + parsed.pathname + parsed.search + parsed.hash;
      }
    }
    throw new Error("Blocked Local Agent request to an untrusted external URL.");
  }

  // URL() also detects protocol-relative URLs such as //attacker.example.
  let resolved;
  try {
    resolved = new URL(requested.startsWith("/") ? requested : "/" + requested, agent.origin);
  } catch {
    throw new Error("The local Foundry request URL is invalid.");
  }
  if (resolved.origin !== agent.origin) {
    throw new Error("Blocked Local Agent request to an untrusted external URL.");
  }
  return localEngineOrigin + resolved.pathname + resolved.search + resolved.hash;
}
