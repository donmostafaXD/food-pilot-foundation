import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Shield, LogOut, Users, Building2, GitBranch } from "lucide-react";
import DatabaseStatus from "@/components/DatabaseStatus";

const Dashboard = () => {
  const { user, profile, roles, signOut, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user just logged in but has no org, redirect to register to complete setup
    if (!loading && user && profile && !profile.organization_id) {
      navigate("/register", { replace: true });
    }
  }, [loading, user, profile, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-industrial-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight font-display text-foreground">FoodPilot</h1>
              <p className="text-xs text-muted-foreground">Dynamic HACCP Orchestration</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(roles.includes("Owner") || roles.includes("Manager")) && (
              <Button variant="outline" size="sm" onClick={() => navigate("/users")}>
                <Users className="w-4 h-4 mr-1" /> Manage Users
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Sign Out
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Context bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card shadow-industrial-sm rounded-lg p-4 flex items-center gap-3">
            <Building2 className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Organization</p>
              <p className="text-sm font-medium text-foreground">{profile?.organization_id ? "Loaded" : "—"}</p>
            </div>
          </div>
          <div className="bg-card shadow-industrial-sm rounded-lg p-4 flex items-center gap-3">
            <GitBranch className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Branch</p>
              <p className="text-sm font-medium text-foreground">{profile?.branch_id ? "Main Branch" : "—"}</p>
            </div>
          </div>
          <div className="bg-card shadow-industrial-sm rounded-lg p-4 flex items-center gap-3">
            <Users className="w-5 h-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Roles</p>
              <p className="text-sm font-medium text-foreground">{roles.length ? roles.join(", ") : "—"}</p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold font-display text-foreground">Welcome, {profile?.full_name || user?.email}</h2>
          <p className="text-sm text-muted-foreground">Your organization data is secured with row-level policies. Below is a health check of the data foundation.</p>
        </div>

        <DatabaseStatus />
      </main>
    </div>
  );
};

export default Dashboard;
