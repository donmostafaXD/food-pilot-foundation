import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import HACCPSummary from "@/components/haccp/HACCPSummary";

const Dashboard = () => {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkPlan = async () => {
      if (!profile) return; // wait for profile to load

      const orgId = profile.organization_id;
      const branchId = profile.branch_id;

      console.log("[Dashboard] Checking HACCP plan for:", { orgId, branchId });

      // If user has no org or branch yet, send to setup
      if (!orgId || !branchId) {
        console.log("[Dashboard] No org/branch — redirecting to /setup");
        navigate("/setup", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("haccp_plans")
        .select("id")
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .limit(1);

      console.log("[Dashboard] HACCP plan query result:", { data, error });

      if (!data || data.length === 0) {
        console.log("[Dashboard] No plan found — redirecting to /setup");
        navigate("/setup", { replace: true });
        return;
      }

      console.log("[Dashboard] Plan exists — staying on dashboard");
      setChecking(false);
    };
    checkPlan();
  }, [profile, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">FoodPilot Dashboard</h1>
            <p className="text-sm text-muted-foreground">Food safety management overview</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>Logout</Button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <HACCPSummary />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
