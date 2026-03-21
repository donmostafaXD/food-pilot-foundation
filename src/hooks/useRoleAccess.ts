import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import { usePlan, type PlanTier } from "@/hooks/usePlan";
import type { PreviewRole } from "@/contexts/AdminPlanOverrideContext";
import {
  type AppRole,
  type AppModule,
  type PermissionAction,
  resolveEffectiveRole,
  hasPermission,
  canAccessModule,
  getSidebarVisibility,
  type SidebarModuleVisibility,
} from "@/lib/permissions";

/** Plan-based user limits */
const PLAN_USER_LIMITS: Record<PlanTier, number> = {
  basic: 2,
  professional: 3,
  premium: Infinity,
  demo: Infinity,
};

export interface RoleAccess {
  /** The effective role after considering admin preview override */
  effectiveRole: AppRole | null;
  /** The real authenticated role (ignoring preview) */
  realRole: AppRole | null;
  /** True when the admin preview is overriding the real role */
  isPreviewMode: boolean;
  /** True if user is a real super_admin (not preview) */
  isRealSuperAdmin: boolean;
  /** True when super_admin has NO override active — neutral system-wide view */
  isNoOverrideMode: boolean;

  // ── Permission check functions ─────────────────
  /** Check if user has a specific permission on a module */
  can: (module: AppModule, action: PermissionAction) => boolean;
  /** Check if user can view a module */
  canView: (module: AppModule) => boolean;

  // ── Convenience booleans (derived from matrix) ─
  canEditHACCP: boolean;
  canChangeActivity: boolean;
  canManageSubscription: boolean;
  canManageBranches: boolean;
  canManageUsers: boolean;
  canInviteAnyRole: boolean;
  canAccessSettings: boolean;
  canAccessPRPEdit: boolean;
  canAccessSOPEdit: boolean;
  canAccessAudit: boolean;
  canViewAllBranches: boolean;
  canFillLogs: boolean;

  // ── Sidebar visibility ─────────────────────────
  sidebar: SidebarModuleVisibility;

  // ── Plan-based limits ──────────────────────────
  maxUsers: number;
  allowedInviteRoles: AppRole[];
}

export function useRoleAccess(): RoleAccess {
  const { roles } = useAuth();
  const { overrideRole, overridePlan } = useAdminPlanOverride();
  const { plan } = usePlan();

  return useMemo(() => {
    const isSuperAdmin = roles.includes("super_admin" as AppRole);

    // Real role ignoring preview
    const realRole = resolveEffectiveRole(roles as AppRole[]);

    // Effective role considers preview override
    const isPreviewMode = overrideRole !== null;
    const effectiveRole = isPreviewMode
      ? (overrideRole as AppRole)
      : realRole;

    // No Override Mode: super_admin with no plan/role override active
    const isNoOverrideMode = isSuperAdmin && !isPreviewMode && overridePlan === null;

    // Permission check using the centralized matrix
    const can = (module: AppModule, action: PermissionAction): boolean =>
      hasPermission(effectiveRole, module, action);

    const canView = (module: AppModule): boolean =>
      canAccessModule(effectiveRole, module);

    const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";
    const isManagerLevel = isOwnerLevel || effectiveRole === "Manager";

    // Allowed invite roles per plan
    let allowedInviteRoles: AppRole[];
    if (plan === "basic") {
      allowedInviteRoles = ["Staff"];
    } else if (plan === "professional") {
      allowedInviteRoles = isOwnerLevel
        ? ["Manager", "Staff"]
        : ["Staff"];
    } else {
      allowedInviteRoles = isOwnerLevel
        ? ["Manager", "QA", "Staff", "Auditor"]
        : ["Staff"];
    }

    return {
      effectiveRole,
      realRole,
      isPreviewMode,
      isRealSuperAdmin: isSuperAdmin,
      isNoOverrideMode,

      can,
      canView,

      // Convenience booleans derived from matrix
      canEditHACCP: can("haccp_plan", "edit"),
      canChangeActivity: can("activities", "edit"),
      canManageSubscription: can("subscription", "manage_settings"),
      canManageBranches: isOwnerLevel,
      canManageUsers: can("users", "view"),
      canInviteAnyRole: isOwnerLevel,
      canAccessSettings: canView("settings"),
      canAccessPRPEdit: can("prp", "edit"),
      canAccessSOPEdit: can("sop", "edit"),
      canAccessAudit: canView("audit"),
      canViewAllBranches: isOwnerLevel,
      canFillLogs: can("logs", "create"),

      // In no-override mode, show all sidebar items
      sidebar: isNoOverrideMode
        ? { dashboard: true, haccp: true, logs: true, prp: true, sop: true, equipment: true, audit: true, documents: true, settings: true }
        : getSidebarVisibility(effectiveRole, plan),

      maxUsers: isSuperAdmin && !isPreviewMode ? Infinity : PLAN_USER_LIMITS[plan],
      allowedInviteRoles,
    };
  }, [roles, overrideRole, overridePlan, plan]);
}
