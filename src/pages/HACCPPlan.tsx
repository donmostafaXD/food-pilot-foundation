import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import HACCPTable from "@/components/haccp/HACCPTable";
import { Loader2, Printer, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import PrintDialog, { type PrintMode } from "@/components/PrintDialog";
import { openPrintWindow, blankTable, escapeHtml, controlBadgeClass } from "@/lib/printUtils";
import type { ProcessStep, PlanStep } from "@/pages/SetupWizard";

const HACCPPlanPage = () => {
  const { profile } = useAuth();
  const { plan, showRiskFields, canEditRiskFields, canExportFullHACCP, loading: planLoading } = usePlan();
  const navigate = useNavigate();
  const printHeader = usePrintHeader("HACCP Plan");
  const [loading, setLoading] = useState(true);
  const [planExists, setPlanExists] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
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

      const p = plans[0];
      setPlanExists(true);
      setPlanId(p.id);
      setActivityName(p.activity_name);
      setIsFoodService(p.business_type === "Food Service");

      const { data: steps } = await supabase
        .from("haccp_plan_steps")
        .select("*")
        .eq("haccp_plan_id", p.id)
        .order("step_order");

      const stepsData = steps || [];
      const pSteps: ProcessStep[] = stepsData.map((s) => ({
        process_name: s.process_name,
        process_order: s.step_order,
        process_step_id: s.process_step_id,
      }));
      setProcessSteps(pSteps);

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

    void load();
  }, [profile]);

  if (loading || planLoading) {
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
          <Button onClick={() => navigate("/settings")}>Go to Settings → HACCP Setup</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handlePrint = (mode: PrintMode) => {
    if (mode === "blank") {
      const cols = showRiskFields
        ? ["Process Step", "Hazard", "S", "L", "Risk", "Control", "Critical Limit", "Monitoring", "Corrective Action"]
        : ["Process Step", "Hazard", "Control Type", "Critical Limit", "Monitoring", "Corrective Action"];
      openPrintWindow(printHeader, `<p class="section-title">${showRiskFields ? "Hazard Analysis Table" : "Food Safety Plan"}</p>${blankTable(cols)}`);
      return;
    }
    let rows = "";
    planSteps.forEach(step => {
      step.hazards.forEach((h, i) => {
        rows += `<tr>
          <td>${i === 0 ? escapeHtml(step.process_name) : ""}</td>
          <td>${escapeHtml(h.hazard_name)}</td>
          ${showRiskFields ? `<td>${h.severity}</td><td>${h.likelihood}</td><td>${h.risk_score}</td>` : ""}
          <td><span class="${controlBadgeClass(h.control_type)}">${escapeHtml(h.control_type || "—")}</span></td>
          <td>${escapeHtml(h.critical_limit || "—")}</td>
          <td>${escapeHtml(h.monitoring || "—")}</td>
          <td>${escapeHtml(h.corrective_action || "—")}</td>
        </tr>`;
      });
    });
    const thRisk = showRiskFields ? "<th>S</th><th>L</th><th>Risk</th>" : "";
    const html = `<p class="section-title">${showRiskFields ? "Hazard Analysis Table" : "Food Safety Plan"}</p>
      <table><thead><tr><th>Process Step</th><th>Hazard</th>${thRisk}<th>Control</th><th>Critical Limit</th><th>Monitoring</th><th>Corrective Action</th></tr></thead><tbody>${rows}</tbody></table>`;
    openPrintWindow(printHeader, html);
  };

  const handleSave = async () => {
    if (!planId) return;
    setSaving(true);
    try {
      // Delete existing steps & hazards, then re-insert
      const { data: existingSteps } = await supabase
        .from("haccp_plan_steps")
        .select("id")
        .eq("haccp_plan_id", planId);
      const existingStepIds = (existingSteps || []).map(s => s.id);
      if (existingStepIds.length > 0) {
        await supabase.from("haccp_plan_hazards").delete().in("haccp_plan_step_id", existingStepIds);
      }
      await supabase.from("haccp_plan_steps").delete().eq("haccp_plan_id", planId);

      // Insert new steps and hazards
      for (const step of planSteps) {
        const { data: insertedStep } = await supabase
          .from("haccp_plan_steps")
          .insert({
            haccp_plan_id: planId,
            process_name: step.process_name,
            step_order: step.step_order,
            process_step_id: step.process_step_id,
          })
          .select("id")
          .single();

        if (insertedStep && step.hazards.length > 0) {
          await supabase.from("haccp_plan_hazards").insert(
            step.hazards.map(h => ({
              haccp_plan_step_id: insertedStep.id,
              hazard_name: h.hazard_name,
              hazard_type: h.hazard_type,
              severity: h.severity,
              likelihood: h.likelihood,
              risk_score: h.risk_score,
              control_type: h.control_type,
              critical_limit: h.critical_limit,
              monitoring: h.monitoring,
              corrective_action: h.corrective_action,
            }))
          );
        }
      }

      await supabase.from("haccp_plans").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", planId);
      toast.success("HACCP Plan saved successfully");
    } catch (err: any) {
      toast.error("Failed to save", { description: err.message });
    }
    setSaving(false);
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            HACCP Plan
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
              Save Changes
            </Button>
          </div>
        </div>

        <PrintDialog
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          onSelect={handlePrint}
          title="Print HACCP Plan"
        />
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
