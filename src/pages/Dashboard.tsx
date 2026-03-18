import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import HACCPSummary from "@/components/haccp/HACCPSummary";

type CheckState = "loading_auth" | "loading_plan" | "ready" | "error";

const Dashboard = () => {
  const { signOut, profile, loading: authLoading, user } = useAuth();
  const navigate = useNavigate();
  const [checkState, setCheckState] = useState<CheckState>("loading_auth");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    // Step 1: Wait for auth to finish loading
    if (authLoading) {
      setCheckState("loading_auth");
      return;
    }

    // Step 2: No user → login (handled by ProtectedRoute, but safety net)
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    // Step 3: Profile not yet available — could be a timing issue
    if (!profile) {
      console.log("[Dashboard] Auth loaded but profile is null — waiting or redirecting to setup");
      // Give a short timeout, then treat as needing setup
      const timeout = setTimeout(() => {
        console.log("[Dashboard] Profile still null after timeout — redirecting to /setup");
        navigate("/setup", { replace: true });
      }, 3000);
      return () => clearTimeout(timeout);
    }

    // Step 4: Profile loaded — check org/branch
    const orgId = profile.organization_id;
    const branchId = profile.branch_id;

    console.log("[Dashboard] Profile loaded:", { orgId, branchId });

    if (!orgId || !branchId) {
      console.log("[Dashboard] No org/branch — redirecting to /setup");
      navigate("/setup", { replace: true });
      return;
    }

    // Step 5: Check HACCP plan
    setCheckState("loading_plan");

    const checkPlan = async () => {
      try {
        const { data, error } = await supabase
          .from("haccp_plans")
          .select("id")
          .eq("organization_id", orgId)
          .eq("branch_id", branchId)
          .limit(1);

        console.log("[Dashboard] HACCP plan query:", { data, error });

        if (error) {
          setErrorMsg(`Failed to check plan: ${error.message}`);
          setCheckState("error");
          return;
        }

        if (!data || data.length === 0) {
          console.log("[Dashboard] No plan found — redirecting to /setup");
          navigate("/setup", { replace: true });
          return;
        }

        console.log("[Dashboard] Plan exists — rendering dashboard");
        setCheckState("ready");
      } catch (err: any) {
        setErrorMsg(err.message || "Unexpected error");
        setCheckState("error");
      }
    };

    checkPlan();
  }, [authLoading, user, profile, navigate]);

  const handleLogout = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (checkState === "loading_auth" || checkState === "loading_plan") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">
          {checkState === "loading_auth" ? "Loading account..." : "Checking HACCP plan..."}
        </p>
      </div>
    );
  }

  if (checkState === "error") {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <p className="text-sm text-destructive font-medium">Something went wrong</p>
        <p className="text-xs text-muted-foreground">{errorMsg}</p>
        <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
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
