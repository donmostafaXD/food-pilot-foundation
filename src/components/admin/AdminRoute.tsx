/**
 * Route guard for admin pages. Redirects non-super_admin users.
 */
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: Props) {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!roles.includes("super_admin" as any)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
