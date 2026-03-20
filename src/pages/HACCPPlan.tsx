import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import HACCPTable from "@/components/haccp/HACCPTable";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Printer, Settings, ShieldCheck, ArrowRight, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { usePlan } from "@/hooks/usePlan";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import PrintDialog, { type PrintMode } from "@/components/PrintDialog";
import { openPrintWindow, blankTable, escapeHtml, controlBadgeClass } from "@/lib/printUtils";
import type { ProcessStep, PlanStep } from "@/pages/SetupWizard";

const HACCPPlanPage = () => {
  const { profile } = useAuth();
  const guard = usePermissionGuard("haccp_plan");
  const { plan, planDisplayName, showRiskFields, canEditRiskFields, canExportFullHACCP, loading: planLoading } = usePlan();
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
        <div className="p-6 lg:p-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">HACCP Plan</h1>
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="p-4 rounded-full bg-muted">
                <Inbox className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-foreground">No HACCP plan created yet</p>
                <p className="text-xs text-muted-foreground max-w-sm">
                  Set up your HACCP plan through the Settings page. The system will auto-generate your hazard analysis based on your activity type.
                </p>
              </div>
              <Button onClick={() => navigate("/settings")} className="gap-1.5 mt-2">
                <Settings className="w-4 h-4" />
                Go to Settings
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
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

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">
              HACCP Plan
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {activityName && (
                <Badge variant="secondary" className="text-[10px]">{activityName}</Badge>
              )}
              <Badge variant="outline" className="text-[10px]">{planDisplayName} Plan</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)} disabled={!guard.canExport}>
            <Printer className="w-4 h-4 mr-1" /> Print
          </Button>
        </div>

        {guard.isReadOnly ? (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>You have read-only access to the HACCP plan. Contact your manager for edit access.</span>
          </div>
        ) : guard.canEdit ? (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground flex items-center justify-between">
            <span>To edit your HACCP plan, go to <strong>Settings → HACCP Plan</strong></span>
            <Button variant="outline" size="sm" onClick={() => navigate("/settings")}>
              <Settings className="w-4 h-4 mr-1" /> Go to Settings
            </Button>
          </div>
        ) : null}

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
          setPlanSteps={undefined}
          showRiskFields={showRiskFields}
          canEditRiskFields={false}
        />
      </div>
    </DashboardLayout>
  );
};

export default HACCPPlanPage;
