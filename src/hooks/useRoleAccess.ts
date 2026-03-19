import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import { usePlan, type PlanTier } from "@/hooks/usePlan";

type AppRole = "Owner" | "Manager" | "QA" | "Staff" | "Auditor" | "super_admin";

export interface RoleAccess {
  /** The effective role after considering admin preview override */
  effectiveRole: AppRole | null;
  /** True when the admin preview is overriding the real role */
  isPreviewMode: boolean;

  // ── Permissions ──────────────────────────────
  /** Can edit HACCP plan (Owner, Manager, super_admin) */
  canEditHACCP: boolean;
  /** Can change activity / run setup wizard (Owner, super_admin only) */
  canChangeActivity: boolean;
  /** Can manage subscription settings (Owner, super_admin only) */
  canManageSubscription: boolean;
  /** Can manage branches (Owner, super_admin only) */
  canManageBranches: boolean;
  /** Can manage users – add/remove (Owner + Manager for adding Staff) */
  canManageUsers: boolean;
  /** Can invite any role (Owner, super_admin) vs only Staff (Manager) */
  canInviteAnyRole: boolean;
  /** Can access Settings page at all */
  canAccessSettings: boolean;
  /** Can access PRP editing (not Staff) */
  canAccessPRPEdit: boolean;
  /** Can access SOP editing (not Staff) */
  canAccessSOPEdit: boolean;
  /** Can access Audit Ready page (not Staff) */
  canAccessAudit: boolean;
  /** Can view all branches (Owner, super_admin) */
  canViewAllBranches: boolean;
  /** Can fill/submit logs (everyone) */
  canFillLogs: boolean;

  // ── Plan-based user limits ──────────────────
  maxUsers: number;
  /** Roles allowed for invite on current plan */
  allowedInviteRoles: AppRole[];
}

/** Plan-based user limits */
const PLAN_USER_LIMITS: Record<PlanTier, number> = {
  basic: 2,
  professional: 3,
  premium: Infinity,
};

export function useRoleAccess(): RoleAccess {
  const { roles } = useAuth();
  const { overrideRole } = useAdminPlanOverride();
  const { plan } = usePlan();

  return useMemo(() => {
    const isSuperAdmin = roles.includes("super_admin" as AppRole);
    const isPreviewMode = overrideRole !== null;

    // Resolve effective role: preview override takes priority, then highest real role
    let effectiveRole: AppRole | null = null;
    if (isPreviewMode) {
      effectiveRole = overrideRole as AppRole;
    } else if (isSuperAdmin) {
      effectiveRole = "super_admin";
    } else if (roles.includes("Owner")) {
      effectiveRole = "Owner";
    } else if (roles.includes("Manager")) {
      effectiveRole = "Manager";
    } else if (roles.includes("QA")) {
      effectiveRole = "QA";
    } else if (roles.includes("Staff")) {
      effectiveRole = "Staff";
    } else if (roles.includes("Auditor")) {
      effectiveRole = "Auditor";
    }

    const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";
    const isManagerLevel = isOwnerLevel || effectiveRole === "Manager";
    const isStaff = effectiveRole === "Staff";
    const isAuditor = effectiveRole === "Auditor";

    // Allowed invite roles per plan
    let allowedInviteRoles: AppRole[];
    if (plan === "basic") {
      allowedInviteRoles = ["Staff"];
    } else if (plan === "professional") {
      allowedInviteRoles = isOwnerLevel
        ? ["Manager", "Staff"]
        : ["Staff"]; // Manager can only add Staff
    } else {
      allowedInviteRoles = isOwnerLevel
        ? ["Manager", "QA", "Staff", "Auditor"]
        : ["Staff"];
    }

    return {
      effectiveRole,
      isPreviewMode,

      canEditHACCP: isManagerLevel,
      canChangeActivity: isOwnerLevel,
      canManageSubscription: isOwnerLevel,
      canManageBranches: isOwnerLevel,
      canManageUsers: isManagerLevel,
      canInviteAnyRole: isOwnerLevel,
      canAccessSettings: !isStaff,
      canAccessPRPEdit: !isStaff && !isAuditor,
      canAccessSOPEdit: !isStaff && !isAuditor,
      canAccessAudit: !isStaff,
      canViewAllBranches: isOwnerLevel,
      canFillLogs: true,

      maxUsers: isSuperAdmin && !isPreviewMode ? Infinity : PLAN_USER_LIMITS[plan],
      allowedInviteRoles,
    };
  }, [roles, overrideRole, plan]);
}
