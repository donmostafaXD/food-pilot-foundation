/**
 * Centralized RBAC Permission Matrix
 * ===================================
 * Single source of truth for all role-based access control in the application.
 *
 * ROLE HIERARCHY (descending authority):
 *   1. super_admin — Platform-level control. Full system access. Can manage any organization.
 *   2. Owner       — Organization-level control. Business decisions, billing, team management.
 *   3. Manager     — Operational control. Day-to-day HACCP/logs/PRP/SOP management for assigned branch.
 *   4. Staff       — Task-level access. Log entry, read-only views for assigned branch.
 *
 * NOTE: QA and Auditor exist in the DB enum but are treated as specialized read-only roles.
 */

export type AppRole = "Owner" | "Manager" | "QA" | "Staff" | "Auditor" | "super_admin";

// ── Actions ──────────────────────────────────────────────────────────
export type PermissionAction =
  | "view"
  | "create"
  | "edit"
  | "delete"
  | "approve"
  | "export"
  | "manage_settings"
  | "assign";

// ── Modules ──────────────────────────────────────────────────────────
export type AppModule =
  | "dashboard"
  | "haccp_plan"
  | "logs"
  | "prp"
  | "sop"
  | "equipment"
  | "audit"
  | "documents"
  | "settings"
  | "subscription"
  | "users"
  | "business_profile"
  | "activities"
  | "food_safety_setup";

// ── Permission Matrix ────────────────────────────────────────────────
// true = allowed, false/undefined = denied
type PermissionMap = Partial<Record<PermissionAction, boolean>>;
type RolePermissions = Record<AppModule, PermissionMap>;

const PERMISSION_MATRIX: Record<AppRole, RolePermissions> = {
  super_admin: buildFullAccess(),

  Owner: {
    dashboard:         { view: true, export: true },
    haccp_plan:        { view: true, create: true, edit: true, delete: true, approve: true, export: true },
    logs:              { view: true, create: true, edit: true, delete: true, export: true },
    prp:               { view: true, create: true, edit: true, delete: true, export: true },
    sop:               { view: true, create: true, edit: true, delete: true, export: true },
    equipment:         { view: true, create: true, edit: true, delete: true },
    audit:             { view: true, create: true, edit: true, approve: true, export: true },
    documents:         { view: true, create: true, edit: true, delete: true, export: true },
    settings:          { view: true, manage_settings: true },
    subscription:      { view: true, manage_settings: true },
    users:             { view: true, create: true, edit: true, delete: true, assign: true },
    business_profile:  { view: true, edit: true },
    activities:        { view: true, create: true, edit: true, delete: true },
    food_safety_setup: { view: true, edit: true },
  },

  Manager: {
    dashboard:         { view: true, export: true },
    haccp_plan:        { view: true, edit: true, export: true },
    logs:              { view: true, create: true, edit: true, export: true },
    prp:               { view: true, create: true, edit: true, export: true },
    sop:               { view: true, create: true, edit: true, export: true },
    equipment:         { view: true, create: true, edit: true },
    audit:             {},                                      // Owner-only module
    documents:         { view: true },
    settings:          { view: true },
    subscription:      {},                                      // No access
    users:             { view: true, create: true },            // Can invite Staff only
    business_profile:  { view: true },
    activities:        { view: true },
    food_safety_setup: { view: true, edit: true },
  },

  QA: {
    dashboard:         { view: true },
    haccp_plan:        { view: true, export: true },
    logs:              { view: true, create: true, edit: true },
    prp:               { view: true },
    sop:               { view: true },
    equipment:         { view: true },
    audit:             { view: true, export: true },
    documents:         { view: true },
    settings:          { view: true },
    subscription:      {},
    users:             {},
    business_profile:  { view: true },
    activities:        { view: true },
    food_safety_setup: { view: true },
  },

  Staff: {
    dashboard:         { view: true },
    haccp_plan:        { view: true },                          // Read-only
    logs:              { view: true, create: true },            // Can submit logs
    prp:               {},                                      // No access
    sop:               {},                                      // No access
    equipment:         { view: true },                          // Read-only
    audit:             {},                                      // No access
    documents:         {},                                      // No access
    settings:          {},                                      // No access
    subscription:      {},                                      // No access
    users:             {},                                      // No access
    business_profile:  {},                                      // No access
    activities:        {},                                      // No access
    food_safety_setup: {},                                      // No access
  },

  Auditor: {
    dashboard:         { view: true },
    haccp_plan:        { view: true, export: true },
    logs:              { view: true },
    prp:               { view: true },
    sop:               { view: true },
    equipment:         { view: true },
    audit:             { view: true, export: true },
    documents:         { view: true },
    settings:          {},
    subscription:      {},
    users:             {},
    business_profile:  { view: true },
    activities:        { view: true },
    food_safety_setup: { view: true },
  },
};

function buildFullAccess(): RolePermissions {
  const allActions: PermissionMap = {
    view: true, create: true, edit: true, delete: true,
    approve: true, export: true, manage_settings: true, assign: true,
  };
  const modules: AppModule[] = [
    "dashboard", "haccp_plan", "logs", "prp", "sop", "equipment",
    "audit", "documents", "settings", "subscription", "users",
    "business_profile", "activities", "food_safety_setup",
  ];
  return Object.fromEntries(modules.map(m => [m, { ...allActions }])) as RolePermissions;
}

// ── Public API ───────────────────────────────────────────────────────

/**
 * Check if a role has a specific permission on a module.
 */
export function hasPermission(
  role: AppRole | null,
  module: AppModule,
  action: PermissionAction,
): boolean {
  if (!role) return false;
  return PERMISSION_MATRIX[role]?.[module]?.[action] === true;
}

/**
 * Check if a role can view a module at all.
 */
export function canAccessModule(role: AppRole | null, module: AppModule): boolean {
  return hasPermission(role, module, "view");
}

/**
 * Get all permissions for a role on a module.
 */
export function getModulePermissions(role: AppRole | null, module: AppModule): PermissionMap {
  if (!role) return {};
  return PERMISSION_MATRIX[role]?.[module] ?? {};
}

/**
 * Get the highest-priority role from a list of roles.
 */
export function resolveEffectiveRole(roles: AppRole[]): AppRole | null {
  const priority: AppRole[] = ["super_admin", "Owner", "Manager", "QA", "Auditor", "Staff"];
  for (const r of priority) {
    if (roles.includes(r)) return r;
  }
  return null;
}

// ── Route → Module mapping ───────────────────────────────────────────
export const ROUTE_MODULE_MAP: Record<string, AppModule> = {
  "/dashboard": "dashboard",
  "/haccp": "haccp_plan",
  "/logs": "logs",
  "/prp": "prp",
  "/sop": "sop",
  "/equipment": "equipment",
  "/audit": "audit",
  "/documents": "documents",
  "/settings": "settings",
  "/setup": "activities",
};

// ── Permission denied messages ───────────────────────────────────────
const MODULE_LABELS: Record<AppModule, string> = {
  dashboard: "Dashboard",
  haccp_plan: "HACCP Plan",
  logs: "Logs",
  prp: "PRP Programs",
  sop: "SOP Procedures",
  equipment: "Equipment",
  audit: "Audit Ready",
  documents: "Documents",
  settings: "Settings",
  subscription: "Subscription",
  users: "User Management",
  business_profile: "Business Profile",
  activities: "Activity Management",
  food_safety_setup: "Food Safety Setup",
};

export function getModuleLabel(module: AppModule): string {
  return MODULE_LABELS[module] ?? module;
}

export function getAccessDeniedMessage(module: AppModule, role: AppRole | null): string {
  const label = getModuleLabel(module);
  if (!role) return "You must be signed in to access this section.";
  if (role === "Staff") {
    return `The ${label} section is not available for your role. Contact your manager for access.`;
  }
  return `You do not have permission to access ${label}. This section requires a higher access level.`;
}

// ── Sidebar visibility helpers ───────────────────────────────────────
export interface SidebarModuleVisibility {
  dashboard: boolean;
  haccp: boolean;
  logs: boolean;
  prp: boolean;
  sop: boolean;
  equipment: boolean;
  audit: boolean;
  documents: boolean;
  settings: boolean;
}

export function getSidebarVisibility(role: AppRole | null): SidebarModuleVisibility {
  return {
    dashboard: canAccessModule(role, "dashboard"),
    haccp: canAccessModule(role, "haccp_plan"),
    logs: canAccessModule(role, "logs"),
    prp: canAccessModule(role, "prp"),
    sop: canAccessModule(role, "sop"),
    equipment: canAccessModule(role, "equipment"),
    audit: canAccessModule(role, "audit"),
    documents: canAccessModule(role, "documents"),
    settings: canAccessModule(role, "settings"),
  };
}
