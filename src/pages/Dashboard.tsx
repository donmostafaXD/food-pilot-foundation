import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ShieldCheck,
  AlertTriangle,
  Activity,
  Building2,
  GitBranch,
  Loader2,
  ClipboardList,
  ClipboardCheck,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

interface PlanData {
  id: string;
  activity_name: string;
  business_type: string;
  status: string;
  stepCount: number;
  totalHazards: number;
  ccpCount: number;
  oprpCount: number;
  prpCount: number;
}

const Dashboard = () => {
  const { profile, loading: authLoading, user, onboardingError, signOut } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<PlanData | null>(null);
  const [orgName, setOrgName] = useState<string>("");
  const [branchName, setBranchName] = useState<string>("");
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;

    if (!profile?.organization_id || !profile?.branch_id) {
      setDataLoading(false);
      return;
    }

    const load = async () => {
      setDataLoading(true);

      const [orgRes, branchRes, planRes] = await Promise.all([
        supabase
          .from("organizations")
          .select("name")
          .eq("id", profile.organization_id!)
          .maybeSingle(),
        supabase
          .from("branches")
          .select("name")
          .eq("id", profile.branch_id!)
          .maybeSingle(),
        supabase
          .from("haccp_plans")
          .select("*")
          .eq("organization_id", profile.organization_id!)
          .eq("branch_id", profile.branch_id!)
          .order("created_at", { ascending: false })
          .limit(1),
      ]);

      setOrgName(orgRes.data?.name ?? "Unknown");
      setBranchName(branchRes.data?.name ?? "Unknown");

      const plans = planRes.data;
      if (!plans || plans.length === 0) {
        setPlan(null);
        setDataLoading(false);
        return;
      }

      const p = plans[0];

      const { data: steps } = await supabase
        .from("haccp_plan_steps")
        .select("id")
        .eq("haccp_plan_id", p.id);

      const stepIds = (steps || []).map((s) => s.id);
      let ccpCount = 0,
        oprpCount = 0,
        prpCount = 0,
        totalHazards = 0;

      if (stepIds.length > 0) {
        const { data: hazards } = await supabase
          .from("haccp_plan_hazards")
          .select("risk_score")
          .in("haccp_plan_step_id", stepIds);

        (hazards || []).forEach((h) => {
          totalHazards++;
          if (h.risk_score >= 12) ccpCount++;
          else if (h.risk_score >= 8) oprpCount++;
          else prpCount++;
        });
      }

      setPlan({
        id: p.id,
        activity_name: p.activity_name,
        business_type: p.business_type,
        status: p.status,
        stepCount: stepIds.length,
        totalHazards,
        ccpCount,
        oprpCount,
        prpCount,
      });

      setDataLoading(false);
    };

    load();
  }, [authLoading, user, profile]);

  if (authLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (onboardingError) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-full gap-3 p-8">
          <p className="text-sm text-destructive font-medium">Setup failed</p>
          <p className="text-xs text-muted-foreground">{onboardingError}</p>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            Sign Out
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Food safety management overview
          </p>
        </div>

        {/* Org & Branch */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="shadow-industrial-sm">
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Organization</p>
                {dataLoading ? (
                  <Skeleton className="h-5 w-32 mt-0.5" />
                ) : (
                  <p className="text-sm font-semibold text-foreground truncate">{orgName}</p>
                )}
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-industrial-sm">
            <CardContent className="flex items-center gap-3 pt-5 pb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <GitBranch className="w-5 h-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Branch</p>
                {dataLoading ? (
                  <Skeleton className="h-5 w-32 mt-0.5" />
                ) : (
                  <p className="text-sm font-semibold text-foreground truncate">{branchName}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {dataLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-36 rounded-lg" />
            ))}
          </div>
        ) : !plan ? (
          /* Empty state — direct to Settings for setup */
          <Card className="shadow-industrial-md">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="p-4 rounded-full bg-muted">
                <ShieldCheck className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">No HACCP Plan Yet</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                  Go to Settings → HACCP Setup to create your first food safety plan.
                </p>
              </div>
              <Button onClick={() => navigate("/settings")} className="mt-2">
                Go to Settings
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* HACCP Plan overview (read-only summary) */}
            <Card className="shadow-industrial-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-primary" />
                  HACCP Plan
                  <Badge
                    variant={plan.status === "active" ? "default" : "outline"}
                    className="ml-auto text-xs capitalize"
                  >
                    {plan.status}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Activity</p>
                    <p className="text-sm font-medium text-foreground">{plan.activity_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Business Type</p>
                    <p className="text-sm font-medium text-foreground">{plan.business_type}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Process Steps</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">{plan.stepCount}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Hazards</p>
                    <p className="text-sm font-bold tabular-nums text-foreground">{plan.totalHazards}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Risk summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="shadow-industrial-sm border-l-4 border-l-destructive">
                <CardContent className="flex items-center gap-3 pt-5 pb-4">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-destructive">{plan.ccpCount}</p>
                    <p className="text-xs text-muted-foreground">CCPs (High Risk)</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-industrial-sm border-l-4 border-l-warning">
                <CardContent className="flex items-center gap-3 pt-5 pb-4">
                  <div className="p-2 rounded-lg bg-warning/10">
                    <Activity className="w-5 h-5 text-warning" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-warning">{plan.oprpCount}</p>
                    <p className="text-xs text-muted-foreground">OPRPs (Medium Risk)</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-industrial-sm border-l-4 border-l-accent">
                <CardContent className="flex items-center gap-3 pt-5 pb-4">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <ShieldCheck className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold tabular-nums text-accent">{plan.prpCount}</p>
                    <p className="text-xs text-muted-foreground">PRPs (Low Risk)</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions — focused on daily operations */}
            <Card className="shadow-industrial-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => navigate("/logs")}>
                  <ClipboardList className="w-4 h-4 mr-2" />
                  Go to Logs
                </Button>
                <Button variant="outline" onClick={() => navigate("/audit")}>
                  <ClipboardCheck className="w-4 h-4 mr-2" />
                  Audit Ready
                </Button>
                <Button variant="outline" onClick={() => navigate("/haccp")}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  View HACCP Plan
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
