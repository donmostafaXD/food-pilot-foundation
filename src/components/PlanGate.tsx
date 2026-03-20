import { Navigate } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { ShieldX, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: React.ReactNode;
  /** The plan feature key that must be true to access this route */
  feature: "canAccessSOP" | "canAccessPRP" | "canAccessDocuments" | "canAccessEquipment";
}

const FEATURE_LABELS: Record<string, { name: string; requiredPlan: string }> = {
  canAccessSOP: { name: "SOP Procedures", requiredPlan: "HACCP" },
  canAccessPRP: { name: "PRP Programs", requiredPlan: "HACCP" },
  canAccessDocuments: { name: "Documents", requiredPlan: "Compliance" },
  canAccessEquipment: { name: "Equipment", requiredPlan: "HACCP" },
};

/**
 * Wraps a route to enforce plan-based access.
 * Shows an upgrade message if the user's plan doesn't include the feature.
 */
const PlanGate = ({ children, feature }: Props) => {
  const plan = usePlan();
  const { effectiveRole } = useRoleAccess();

  if (plan.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!plan[feature]) {
    const info = FEATURE_LABELS[feature] || { name: "this feature", requiredPlan: "a higher" };
    const canUpgrade = effectiveRole === "Owner" || effectiveRole === "super_admin";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md px-6">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <ShieldX className="w-6 h-6 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Feature Not Available</h2>
            <p className="text-sm text-muted-foreground">
              <strong>{info.name}</strong> requires the <strong>{info.requiredPlan}</strong> plan or higher.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Current plan: <span className="font-medium text-foreground">{plan.planDisplayName}</span>
          </p>
          <div className="flex gap-2 justify-center">
            <Button variant="outline" size="sm" asChild>
              <a href="/dashboard">Back to Dashboard</a>
            </Button>
            {canUpgrade && (
              <Button size="sm" asChild>
                <a href="/settings">
                  <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                  Upgrade Plan
                </a>
              </Button>
            )}
            {!canUpgrade && (
              <p className="text-xs text-muted-foreground mt-2">
                Ask your organization owner to upgrade the plan.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default PlanGate;
