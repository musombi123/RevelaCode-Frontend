export const PLATFORM_ADMIN_ROLES = Object.freeze([
  "admin",
  "platform_admin",
  "super_admin",
  "revelacode_admin",
]);

export const SUPPORT_WORKSPACE_ROLES = Object.freeze([
  "support",
  "support_agent",
  "support_admin",
]);

export function collectWorkspaceRoles(...sources) {
  const roles = new Set();

  const add = (value) => {
    if (Array.isArray(value) || value instanceof Set) {
      for (const item of value) add(item);
      return;
    }

    if (typeof value === "string") {
      const normalized = value.trim().toLowerCase();
      if (normalized) roles.add(normalized);
      return;
    }

    if (value && typeof value === "object") {
      add(value.roles);
      add(value.role);
      add(value.user);
      add(value.account);
      add(value.data);
    }
  };

  sources.forEach(add);
  return [...roles];
}

export function hasPlatformAdminRole(...sources) {
  const roles = new Set(collectWorkspaceRoles(...sources));
  return PLATFORM_ADMIN_ROLES.some((role) => roles.has(role));
}

export function hasSupportWorkspaceRole(...sources) {
  const roles = new Set(collectWorkspaceRoles(...sources));
  return SUPPORT_WORKSPACE_ROLES.some((role) => roles.has(role));
}

export function hasSupportAdminRole(...sources) {
  const roles = new Set(collectWorkspaceRoles(...sources));
  return roles.has("support_admin") || roles.has("super_admin");
}

export function resolveWorkspaceRole(...sources) {
  const roles = new Set(collectWorkspaceRoles(...sources));
  const priority = [
    "super_admin",
    "platform_admin",
    "revelacode_admin",
    "admin",
    "support_admin",
    "support_agent",
    "support",
    "user",
  ];
  return priority.find((role) => roles.has(role)) || "";
}
