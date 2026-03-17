import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requiredRoles?: Array<"Owner" | "Manager" | "QA" | "Staff" | "Auditor">;
}

const ProtectedRoute = ({ children, requiredRoles }: Props) => {
  const { user, loading, roles } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (requiredRoles && requiredRoles.length > 0) {
    const hasAccess = requiredRoles.some((r) => roles.includes(r));
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-2">
            <h2 className="text-lg font-semibold text-foreground">Access Denied</h2>
            <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
