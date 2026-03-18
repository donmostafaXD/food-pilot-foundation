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
      if (!profile?.branch_id) {
        setChecking(false);
        return;
      }

      const { data } = await supabase
        .from("haccp_plans")
        .select("id")
        .eq("branch_id", profile.branch_id)
        .limit(1);

      if (!data || data.length === 0) {
        navigate("/setup", { replace: true });
        return;
      }

      setChecking(false);
    };
    checkPlan();
  }, [profile?.branch_id, navigate]);

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
