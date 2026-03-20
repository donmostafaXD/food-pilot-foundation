/**
 * usePermissionGuard — Action-level permission checks for use inside pages.
 *
 * Provides permission-aware wrappers so components can conditionally render
 * or disable actions (buttons, forms, delete icons, etc.) based on the
 * centralized permission matrix.
 *
 * Usage:
 *   const guard = usePermissionGuard("haccp_plan");
 *   if (guard.canEdit) { ... }
 *   <Button disabled={!guard.canCreate}>Add Hazard</Button>
 */
import { useMemo } from "react";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import type { AppModule, PermissionAction } from "@/lib/permissions";

export interface ModuleGuard {
  /** Can view the module at all */
  canView: boolean;
  /** Can create new items */
  canCreate: boolean;
  /** Can edit existing items */
  canEdit: boolean;
  /** Can delete items */
  canDelete: boolean;
  /** Can approve items */
  canApprove: boolean;
  /** Can export data */
  canExport: boolean;
  /** Can manage module-level settings */
  canManageSettings: boolean;
  /** Can assign roles/items to others */
  canAssign: boolean;
  /** Generic check for any action */
  check: (action: PermissionAction) => boolean;
  /** True = read-only (can view but not edit/create/delete) */
  isReadOnly: boolean;
}

export function usePermissionGuard(module: AppModule): ModuleGuard {
  const { can } = useRoleAccess();

  return useMemo(() => {
    const canView = can(module, "view");
    const canCreate = can(module, "create");
    const canEdit = can(module, "edit");
    const canDelete = can(module, "delete");
    const canApprove = can(module, "approve");
    const canExport = can(module, "export");
    const canManageSettings = can(module, "manage_settings");
    const canAssign = can(module, "assign");

    return {
      canView,
      canCreate,
      canEdit,
      canDelete,
      canApprove,
      canExport,
      canManageSettings,
      canAssign,
      check: (action: PermissionAction) => can(module, action),
      isReadOnly: canView && !canEdit && !canCreate && !canDelete,
    };
  }, [can, module]);
}
