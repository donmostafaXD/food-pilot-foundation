import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { usePlan } from "@/hooks/usePlan";
import { Navigate } from "react-router-dom";
import {
  type AppModule,
  canAccessModule,
  getAccessDeniedMessage,
  getModuleLabel,
} from "@/lib/permissions";
import { isModuleHidden, getUpgradeMessage } from "@/lib/plan-features";
import type { PlanModule } from "@/lib/plan-features";
import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  /** Optional: explicitly declare which module this route protects */
  module?: AppModule;
  /** Legacy: still supported but prefer `module` */
  requiredRoles?: Array<"Owner" | "Manager" | "QA" | "Staff" | "Auditor" | "super_admin">;
}

const ProtectedRoute = ({ children, module, requiredRoles }: Props) => {
  const { user, loading } = useAuth();
  const { effectiveRole, isRealSuperAdmin, isPreviewMode } = useRoleAccess();
  const { plan } = usePlan();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  // Real super_admin bypasses all checks (unless in preview mode)
  if (isRealSuperAdmin && !isPreviewMode) {
    return <>{children}</>;
  }

  // Module-based access check (primary method)
  if (module) {
    // Plan-based: if module is hidden for this plan, redirect to dashboard
    if (isModuleHidden(plan, module as PlanModule)) {
      return <Navigate to="/dashboard" replace />;
    }

    // Role-based: check if role can view module
    const allowed = canAccessModule(effectiveRole, module);
    if (!allowed) {
      return <AccessDenied module={module} />;
    }
    return <>{children}</>;
  }

  // Legacy requiredRoles check
  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some((r) => r === effectiveRole);
    if (!hasAccess) {
      return <AccessDenied />;
    }
  }

  return <>{children}</>;
};

// ── Access Denied Component ──────────────────────────────────────────
function AccessDenied({ module }: { module?: AppModule }) {
  const { effectiveRole } = useRoleAccess();
  const message = module
    ? getAccessDeniedMessage(module, effectiveRole)
    : "You do not have permission to access this page.";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-md px-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldX className="w-6 h-6 text-destructive" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        {effectiveRole && (
          <p className="text-xs text-muted-foreground">
            Your current role: <span className="font-medium text-foreground">{effectiveRole}</span>
          </p>
        )}
        <Button variant="outline" size="sm" asChild>
          <a href="/dashboard">Back to Dashboard</a>
        </Button>
      </div>
    </div>
  );
}

export default ProtectedRoute;
