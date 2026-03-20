import { usePlan, type PlanTier } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import DashboardLayout from "@/components/DashboardLayout";

interface Props {
  children: React.ReactNode;
  /** The plan feature key that must be true to access this route */
  feature: "canAccessSOP" | "canAccessPRP" | "canAccessDocuments" | "canAccessEquipment";
}

const FEATURE_CONFIG: Record<string, { name: string; requiredPlan: PlanTier; description: string }> = {
  canAccessSOP:       { name: "SOP Procedures",  requiredPlan: "professional", description: "Standard Operating Procedures help ensure consistent food safety practices across your team." },
  canAccessPRP:       { name: "PRP Programs",    requiredPlan: "professional", description: "Prerequisite Programs track essential compliance activities like cleaning, pest control, and hygiene." },
  canAccessDocuments: { name: "Documents",       requiredPlan: "premium",      description: "Full FSMS document management for audit preparation, policies, and regulatory compliance." },
  canAccessEquipment: { name: "Equipment",       requiredPlan: "professional", description: "Equipment registry helps you track, maintain, and calibrate food safety equipment." },
};

/**
 * Wraps a route to enforce plan-based access.
 * Shows a professional upgrade prompt if the user's plan doesn't include the feature.
 */
const PlanGate = ({ children, feature }: Props) => {
  const plan = usePlan();
  const { isRealSuperAdmin, isPreviewMode } = useRoleAccess();

  if (plan.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Real super admin bypasses plan gates (unless previewing)
  if (isRealSuperAdmin && !isPreviewMode) {
    return <>{children}</>;
  }

  if (!plan[feature]) {
    const config = FEATURE_CONFIG[feature] || { name: "this feature", requiredPlan: "professional" as PlanTier, description: "" };

    return (
      <DashboardLayout>
        <UpgradePrompt
          featureName={config.name}
          requiredPlan={config.requiredPlan}
          description={config.description}
          variant="page"
        />
      </DashboardLayout>
    );
  }

  return <>{children}</>;
};

export default PlanGate;
