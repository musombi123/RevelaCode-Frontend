/**
 * Resolve Foundry engine requests to the paired desktop agent.
 *
 * The hosted API origin is retained for account, plan and payment requests.
 * Workspace and production routes use the Local Agent's mounted Foundry app.
 */
export function resolveLocalEngineUrl(input, apiBase, localAgentBase) {
  const requested = String(input || "");
  const cloudOrigin = String(apiBase || "").replace(/\/$/, "");
  const agentOrigin = String(localAgentBase || "").replace(/\/$/, "");
  const localEngineOrigin = agentOrigin + "/engine";

  if (cloudOrigin && requested.startsWith(cloudOrigin + "/")) {
    return localEngineOrigin + requested.slice(cloudOrigin.length);
  }
  if (/^https?:\/\//i.test(requested)) return requested;

  return localEngineOrigin + (requested.startsWith("/") ? requested : "/" + requested);
}
