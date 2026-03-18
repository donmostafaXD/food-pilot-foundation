import { Navigate } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";

interface Props {
  children: React.ReactNode;
  /** The plan feature key that must be true to access this route */
  feature: "canAccessSOP" | "canAccessPRP" | "canAccessDocuments" | "canAccessEquipment";
}

/**
 * Wraps a route to enforce plan-based access.
 * Redirects to /app/pricing if the user's plan doesn't include the feature.
 */
const PlanGate = ({ children, feature }: Props) => {
  const plan = usePlan();

  if (plan.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!plan[feature]) {
    return <Navigate to="/app/pricing" replace />;
  }

  return <>{children}</>;
};

export default PlanGate;
