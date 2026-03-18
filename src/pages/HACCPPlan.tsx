import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import HACCPTable from "@/components/haccp/HACCPTable";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import PrintDialog, { type PrintMode } from "@/components/PrintDialog";
import { openPrintWindow, blankTable, escapeHtml, controlBadgeClass } from "@/lib/printUtils";
import type { ProcessStep, PlanStep } from "@/pages/SetupWizard";

const HACCPPlanPage = () => {
  const { profile } = useAuth();
  const { showRiskFields, canEditRiskFields, canExportFullHACCP } = usePlan();
  const navigate = useNavigate();
  const printHeader = usePrintHeader("HACCP Plan");
  const [loading, setLoading] = useState(true);
  const [planExists, setPlanExists] = useState(false);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [isFoodService, setIsFoodService] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [printOpen, setPrintOpen] = useState(false);

  useEffect(() => {
    if (!profile?.branch_id || !profile?.organization_id) return;

    const load = async () => {
      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("*")
        .eq("branch_id", profile.branch_id!)
        .eq("organization_id", profile.organization_id!)
        .order("created_at", { ascending: false })
        .limit(1);

      if (!plans || plans.length === 0) {
        setPlanExists(false);
        setLoading(false);
        return;
      }

      const plan = plans[0];
      setPlanExists(true);
      setActivityName(plan.activity_name);
      setIsFoodService(plan.business_type === "Food Service");

      // Load steps with hazards
      const { data: steps } = await supabase
        .from("haccp_plan_steps")
        .select("*")
        .eq("haccp_plan_id", plan.id)
        .order("step_order");

      const stepsData = steps || [];
      const pSteps: ProcessStep[] = stepsData.map((s) => ({
        process_name: s.process_name,
        process_order: s.step_order,
        process_step_id: s.process_step_id,
      }));
      setProcessSteps(pSteps);

      // Load hazards for each step
      const stepIds = stepsData.map((s) => s.id);
      let allHazards: any[] = [];
      if (stepIds.length > 0) {
        const { data: hazards } = await supabase
          .from("haccp_plan_hazards")
          .select("*")
          .in("haccp_plan_step_id", stepIds);
        allHazards = hazards || [];
      }

      const built: PlanStep[] = stepsData.map((s) => ({
        process_name: s.process_name,
        step_order: s.step_order,
        process_step_id: s.process_step_id,
        hazards: allHazards
          .filter((h) => h.haccp_plan_step_id === s.id)
          .map((h) => ({
            id: h.id,
            hazard_name: h.hazard_name,
            hazard_type: h.hazard_type,
            severity: h.severity,
            likelihood: h.likelihood,
            risk_score: h.risk_score,
            control_type: h.control_type,
            critical_limit: h.critical_limit,
            monitoring: h.monitoring,
            corrective_action: h.corrective_action,
          })),
      }));

      setPlanSteps(built);
      setLoading(false);
    };

    load();
  }, [profile]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (!planExists) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <p className="text-muted-foreground">No HACCP plan found.</p>
          <Button onClick={() => navigate("/setup")}>Create Plan</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">
          HACCP Plan
        </h1>
        <HACCPTable
          processSteps={processSteps}
          isFoodService={isFoodService}
          activityName={activityName}
          planSteps={planSteps}
          setPlanSteps={setPlanSteps}
          showRiskFields={showRiskFields}
          canEditRiskFields={canEditRiskFields}
        />
      </div>
    </DashboardLayout>
  );
};

export default HACCPPlanPage;
