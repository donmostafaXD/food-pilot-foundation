import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, Loader2, BookOpen, ShieldAlert, ShieldCheck, AlertTriangle, Info } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { ProcessStep, PlanStep, HazardRow } from "@/pages/SetupWizard";
import {
  calculateRiskScore,
  getRiskDisplay,
  resolveControlType,
} from "@/lib/haccp-engine";

interface Props {
  processSteps: ProcessStep[];
  isFoodService: boolean;
  activityName: string;
  planSteps: PlanStep[];
  setPlanSteps?: (v: PlanStep[]) => void;
  showRiskFields?: boolean;
  canEditRiskFields?: boolean;
}

let idCounter = 0;
const tempId = () => `temp-${++idCounter}`;

const HACCPTable = ({ processSteps, isFoodService, activityName, planSteps, setPlanSteps, showRiskFields = true, canEditRiskFields = true }: Props) => {
  const navigate = useNavigate();
  const isReadOnly = !setPlanSteps;
  const [loading, setLoading] = useState(true);

  const emptyColSpan = showRiskFields ? 7 : 4;

  useEffect(() => {
    if (planSteps.length > 0) {
      setLoading(false);
      return;
    }
    generateHACCPData();
  }, []);

  const generateHACCPData = async () => {
    setLoading(true);
    const steps: PlanStep[] = [];

    const { data: allProcessSteps } = await supabase
      .from("process_steps")
      .select("id, process_name");

    const processIdLookup: Record<string, number> = {};
    (allProcessSteps || []).forEach((p) => {
      processIdLookup[p.process_name] = p.id;
    });

    for (const ps of processSteps) {
      const hazards: HazardRow[] = [];
      const stepId = ps.process_step_id ?? processIdLookup[ps.process_name] ?? null;

      if (stepId) {
        const { data: hazMapData } = await supabase
          .from("process_hazard_map")
          .select("hazard_id")
          .eq("process_id", stepId);

        const hazardIds = (hazMapData || []).map((h) => h.hazard_id);

        let hazardLibData: any[] = [];
        if (hazardIds.length > 0) {
          const { data } = await supabase
            .from("hazard_library")
            .select("*")
            .in("id", hazardIds);
          hazardLibData = data || [];
        }

        const { data: ccpData } = await supabase
          .from("ccp_table")
          .select("*")
          .eq("process_id", stepId);

        const ccpByHazard: Record<number, any> = {};
        (ccpData || []).forEach((c) => {
          ccpByHazard[c.hazard_id] = c;
        });

        hazardLibData.forEach((h) => {
          const defaults = ccpByHazard[h.id];
          const severity = defaults?.severity ?? 3;
          const likelihood = defaults?.likelihood ?? 3;
          const riskScore = calculateRiskScore(severity, likelihood);
          const defaultCT = defaults?.default_control_type || null;
          const resolved = resolveControlType(riskScore, defaultCT);

          hazards.push({
            id: tempId(),
            hazard_name: h.hazard_name,
            hazard_type: h.hazard_type,
            severity,
            likelihood,
            risk_score: riskScore,
            control_type: resolved.controlType,
            default_control_type: defaultCT,
            safeguard_applied: resolved.safeguardApplied,
            critical_limit: defaults?.critical_limit || null,
            monitoring: defaults?.monitoring || null,
            corrective_action: defaults?.corrective_action || null,
          });
        });
      }

      steps.push({
        process_name: ps.process_name,
        step_order: ps.process_order,
        process_step_id: stepId,
        hazards,
      });
    }

    setPlanSteps?.(steps);
    setLoading(false);
  };

  const updateHazard = (stepIdx: number, hazIdx: number, field: keyof HazardRow, value: any) => {
    if (isReadOnly) return;
    const newSteps = [...planSteps];
    const hazard = { ...newSteps[stepIdx].hazards[hazIdx] };

    if (field === "severity" || field === "likelihood") {
      const num = Math.max(1, Math.min(5, parseInt(value) || 1));
      (hazard as any)[field] = num;
      hazard.risk_score = calculateRiskScore(hazard.severity, hazard.likelihood);
      const resolved = resolveControlType(hazard.risk_score, hazard.default_control_type);
      hazard.control_type = resolved.controlType;
      hazard.safeguard_applied = resolved.safeguardApplied;
    } else {
      (hazard as any)[field] = value;
    }

    newSteps[stepIdx].hazards[hazIdx] = hazard;
    setPlanSteps?.(newSteps);
  };

  const addHazard = (stepIdx: number) => {
    if (isReadOnly) return;
    const newSteps = [...planSteps];
    const severity = 3;
    const likelihood = 3;
    const riskScore = calculateRiskScore(severity, likelihood);
    const resolved = resolveControlType(riskScore);
    newSteps[stepIdx].hazards.push({
      id: tempId(),
      hazard_name: "New Hazard",
      hazard_type: null,
      severity,
      likelihood,
      risk_score: riskScore,
      control_type: resolved.controlType,
      default_control_type: null,
      safeguard_applied: false,
      critical_limit: null,
      monitoring: null,
      corrective_action: null,
    });
    setPlanSteps?.(newSteps);
  };

  const removeHazard = (stepIdx: number, hazIdx: number) => {
    if (isReadOnly) return;
    const newSteps = [...planSteps];
    newSteps[stepIdx].hazards = newSteps[stepIdx].hazards.filter((_, i) => i !== hazIdx);
    setPlanSteps?.(newSteps);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Generating HACCP analysis...</span>
      </div>
    );
  }

  // Summary stats
  const totalHazards = planSteps.reduce((acc, s) => acc + s.hazards.length, 0);
  const ccpCount = planSteps.reduce((acc, s) => acc + s.hazards.filter(h => h.control_type === "CCP").length, 0);
  const oprpCount = planSteps.reduce((acc, s) => acc + s.hazards.filter(h => h.control_type === "OPRP").length, 0);
  const prpCount = totalHazards - ccpCount - oprpCount;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          {showRiskFields ? "HACCP Analysis" : "Food Safety Plan"}
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {showRiskFields
            ? "Review and edit hazard analysis. Risk scores update automatically."
            : "Review your food safety controls. Upgrade to HACCP plan for full risk analysis."}
        </p>
      </div>

      {/* Summary Bar */}
      <div className="flex items-center gap-3 flex-wrap">
        <Badge variant="outline" className="text-xs gap-1.5 py-1">
          <ShieldCheck className="h-3 w-3" />
          {planSteps.length} Steps
        </Badge>
        <Badge variant="outline" className="text-xs gap-1.5 py-1">
          <AlertTriangle className="h-3 w-3" />
          {totalHazards} Hazards
        </Badge>
        {ccpCount > 0 && (
          <Badge variant="destructive" className="text-xs gap-1.5 py-1">
            {ccpCount} CCP
          </Badge>
        )}
        {oprpCount > 0 && (
          <Badge className="text-xs gap-1.5 py-1 bg-warning text-warning-foreground">
            {oprpCount} OPRP
          </Badge>
        )}
        {prpCount > 0 && (
          <Badge variant="secondary" className="text-xs gap-1.5 py-1">
            {prpCount} PRP
          </Badge>
        )}
      </div>

      <Card className="shadow-sm">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground border-b border-border min-w-[160px]">Process Step</th>
                  <th className="text-left p-3 font-medium text-muted-foreground border-b border-border min-w-[140px]">Hazard</th>
                  {showRiskFields && (
                    <>
                      <th className="text-center p-3 font-medium text-muted-foreground border-b border-border w-14">S</th>
                      <th className="text-center p-3 font-medium text-muted-foreground border-b border-border w-14">L</th>
                      <th className="text-center p-3 font-medium text-muted-foreground border-b border-border w-24">Risk</th>
                    </>
                  )}
                  {!showRiskFields && (
                    <th className="text-center p-3 font-medium text-muted-foreground border-b border-border w-20">Type</th>
                  )}
                  <th className="text-left p-3 font-medium text-muted-foreground border-b border-border min-w-[120px]">Critical Limit</th>
                  <th className="text-left p-3 font-medium text-muted-foreground border-b border-border min-w-[120px]">Monitoring</th>
                  <th className="text-left p-3 font-medium text-muted-foreground border-b border-border min-w-[120px]">Corrective Action</th>
                  {!isReadOnly && <th className="p-3 border-b border-border w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {planSteps.map((step, si) => (
                  <React.Fragment key={`step-${si}`}>
                    {step.hazards.length === 0 ? (
                      <tr key={`step-${si}-empty`} className="border-b border-border">
                        <td className="p-3 font-medium text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-muted-foreground font-normal">{si + 1}.</span>
                            {step.process_name}
                          </div>
                          <Button variant="ghost" size="sm" className="h-5 px-1 mt-0.5 text-xs text-primary" onClick={() => navigate(`/sop?search=${encodeURIComponent(step.process_name)}`)}>
                            <BookOpen className="w-3 h-3 mr-0.5" /> SOP
                          </Button>
                        </td>
                        <td colSpan={emptyColSpan} className="p-3 text-muted-foreground text-xs">
                          <span className="flex items-center gap-1.5">
                            <Info className="h-3 w-3" />
                            No hazards identified for this step
                          </span>
                        </td>
                        {!isReadOnly && (
                          <td className="p-3">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addHazard(si)}>
                              <Plus className="w-3.5 h-3.5" />
                            </Button>
                          </td>
                        )}
                      </tr>
                    ) : (
                      step.hazards.map((h, hi) => {
                        const risk = getRiskDisplay(h.risk_score, h.control_type);
                        const isCCP = h.control_type === "CCP";
                        const isOPRP = h.control_type === "OPRP";
                        const rowHighlight = isCCP
                          ? "bg-destructive/5 hover:bg-destructive/10"
                          : isOPRP
                            ? "bg-warning/5 hover:bg-warning/10"
                            : "hover:bg-muted/30";

                        return (
                          <tr key={h.id} className={`border-b border-border transition-colors ${rowHighlight}`}>
                            <td className="p-3 font-medium text-foreground align-top">
                              {hi === 0 && (
                                <>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs text-muted-foreground font-normal">{si + 1}.</span>
                                    {step.process_name}
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-5 px-1 mt-0.5 text-xs text-primary" onClick={() => navigate(`/sop?search=${encodeURIComponent(step.process_name)}`)}>
                                    <BookOpen className="w-3 h-3 mr-0.5" /> SOP
                                  </Button>
                                </>
                              )}
                              {hi === step.hazards.length - 1 && !isReadOnly && (
                                <Button variant="ghost" size="sm" className="h-6 px-1 mt-1 text-xs" onClick={() => addHazard(si)}>
                                  <Plus className="w-3 h-3 mr-0.5" /> Add
                                </Button>
                              )}
                            </td>
                            <td className="p-3">
                              <div className="space-y-1">
                                <Input
                                  className="h-7 text-xs"
                                  value={h.hazard_name}
                                  onChange={(e) => updateHazard(si, hi, "hazard_name", e.target.value)}
                                  readOnly={isReadOnly}
                                />
                                {h.hazard_type && (
                                  <span className="text-[10px] text-muted-foreground">{h.hazard_type}</span>
                                )}
                              </div>
                            </td>

                            {showRiskFields && (
                              <>
                                <td className="p-3 text-center">
                                  <Input
                                    className="h-7 w-12 text-xs text-center tabular-nums mx-auto"
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={h.severity}
                                    onChange={(e) => updateHazard(si, hi, "severity", e.target.value)}
                                    disabled={!canEditRiskFields || isReadOnly}
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <Input
                                    className="h-7 w-12 text-xs text-center tabular-nums mx-auto"
                                    type="number"
                                    min={1}
                                    max={5}
                                    value={h.likelihood}
                                    onChange={(e) => updateHazard(si, hi, "likelihood", e.target.value)}
                                    disabled={!canEditRiskFields || isReadOnly}
                                  />
                                </td>
                                <td className="p-3 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Badge className={`${risk.className} text-xs tabular-nums`}>
                                      {h.risk_score} {risk.label}
                                    </Badge>
                                    {h.safeguard_applied && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[220px] text-xs">
                                          Safety safeguard active. This step is typically a CCP and cannot be downgraded by score alone.
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </div>
                                </td>
                              </>
                            )}

                            {!showRiskFields && (
                              <td className="p-3 text-center">
                                <Badge className={`${risk.className} text-xs`}>
                                  {risk.label}
                                </Badge>
                              </td>
                            )}

                            <td className="p-3">
                              <Input
                                className="h-7 text-xs"
                                value={h.critical_limit || ""}
                                onChange={(e) => updateHazard(si, hi, "critical_limit", e.target.value)}
                                readOnly={isReadOnly}
                                placeholder={isReadOnly ? "—" : "Enter limit"}
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                className="h-7 text-xs"
                                value={h.monitoring || ""}
                                onChange={(e) => updateHazard(si, hi, "monitoring", e.target.value)}
                                readOnly={isReadOnly}
                                placeholder={isReadOnly ? "—" : "Enter method"}
                              />
                            </td>
                            <td className="p-3">
                              <Input
                                className="h-7 text-xs"
                                value={h.corrective_action || ""}
                                onChange={(e) => updateHazard(si, hi, "corrective_action", e.target.value)}
                                readOnly={isReadOnly}
                                placeholder={isReadOnly ? "—" : "Enter action"}
                              />
                            </td>
                            {!isReadOnly && (
                              <td className="p-3">
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeHazard(si, hi)}>
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-destructive/10 border border-destructive/30" /> CCP — Critical Control Point
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-warning/10 border border-warning/30" /> OPRP — Operational Prerequisite
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-muted border border-border" /> PRP — Prerequisite Program
        </span>
      </div>
    </div>
  );
};

export default HACCPTable;
