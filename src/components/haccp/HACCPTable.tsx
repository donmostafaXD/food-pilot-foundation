import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Loader2, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { ProcessStep, PlanStep, HazardRow } from "@/pages/SetupWizard";

interface Props {
  processSteps: ProcessStep[];
  isFoodService: boolean;
  activityName: string;
  planSteps: PlanStep[];
  setPlanSteps: (v: PlanStep[]) => void;
}

const getRiskLabel = (score: number) => {
  if (score >= 12) return { label: "CCP", className: "bg-destructive text-destructive-foreground" };
  if (score >= 8) return { label: "OPRP", className: "bg-warning text-warning-foreground" };
  return { label: "PRP", className: "bg-muted text-muted-foreground" };
};

let idCounter = 0;
const tempId = () => `temp-${++idCounter}`;

const HACCPTable = ({ processSteps, isFoodService, activityName, planSteps, setPlanSteps }: Props) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

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

    // Resolve process_step_id for steps that don't have one (Food Service)
    let processIdLookup: Record<string, number> = {};
    if (isFoodService) {
      const { data: allProcessSteps } = await supabase
        .from("process_steps")
        .select("id, process_name");
      (allProcessSteps || []).forEach((p) => {
        processIdLookup[p.process_name] = p.id;
      });
    }

    for (const ps of processSteps) {
      const hazards: HazardRow[] = [];
      const stepId = ps.process_step_id ?? processIdLookup[ps.process_name] ?? null;

      if (stepId) {
        // Unified path: use process_hazard_map (numeric IDs) + hazard_library + ccp_table
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

        // Get CCP/OPRP defaults from ccp_table
        const { data: ccpData } = await supabase
          .from("ccp_table")
          .select("*")
          .eq("process_id", stepId);

        const ccpByHazard: Record<number, any> = {};
        (ccpData || []).forEach((c) => {
          ccpByHazard[c.hazard_id] = c;
        });

        // Also check ccp_analysis for manufacturing
        if (!isFoodService) {
          const { data: ccpAnalysis } = await supabase
            .from("ccp_analysis")
            .select("*")
            .eq("process_step_id", stepId);
          (ccpAnalysis || []).forEach((c) => {
            if (!ccpByHazard[c.hazard_id]) ccpByHazard[c.hazard_id] = c;
          });
        }

        hazardLibData.forEach((h) => {
          const ccp = ccpByHazard[h.id];
          const severity = ccp?.severity ?? 3;
          const likelihood = ccp?.likelihood ?? 3;
          hazards.push({
            id: tempId(),
            hazard_name: h.hazard_name,
            hazard_type: h.hazard_type,
            severity,
            likelihood,
            risk_score: severity * likelihood,
            control_type: ccp?.default_control_type || ccp?.control_type || null,
            critical_limit: ccp?.critical_limit || null,
            monitoring: ccp?.monitoring || null,
            corrective_action: ccp?.corrective_action || null,
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

    setPlanSteps(steps);
    setLoading(false);
  };

  const updateHazard = (stepIdx: number, hazIdx: number, field: keyof HazardRow, value: any) => {
    const newSteps = [...planSteps];
    const hazard = { ...newSteps[stepIdx].hazards[hazIdx] };

    if (field === "severity" || field === "likelihood") {
      const num = Math.max(1, Math.min(5, parseInt(value) || 1));
      (hazard as any)[field] = num;
      hazard.risk_score = hazard.severity * hazard.likelihood;
    } else {
      (hazard as any)[field] = value;
    }

    newSteps[stepIdx].hazards[hazIdx] = hazard;
    setPlanSteps(newSteps);
  };

  const addHazard = (stepIdx: number) => {
    const newSteps = [...planSteps];
    newSteps[stepIdx].hazards.push({
      id: tempId(),
      hazard_name: "New Hazard",
      hazard_type: null,
      severity: 3,
      likelihood: 3,
      risk_score: 9,
      control_type: null,
      critical_limit: null,
      monitoring: null,
      corrective_action: null,
    });
    setPlanSteps(newSteps);
  };

  const removeHazard = (stepIdx: number, hazIdx: number) => {
    const newSteps = [...planSteps];
    newSteps[stepIdx].hazards = newSteps[stepIdx].hazards.filter((_, i) => i !== hazIdx);
    setPlanSteps(newSteps);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Generating HACCP analysis...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">HACCP Analysis</h2>
        <p className="text-sm text-muted-foreground mt-1">Review and edit hazard analysis. Risk scores update automatically.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 font-medium text-muted-foreground border-b border-border">Process Step</th>
              <th className="text-left p-2 font-medium text-muted-foreground border-b border-border">Hazard</th>
              <th className="text-center p-2 font-medium text-muted-foreground border-b border-border w-16">S</th>
              <th className="text-center p-2 font-medium text-muted-foreground border-b border-border w-16">L</th>
              <th className="text-center p-2 font-medium text-muted-foreground border-b border-border w-20">Risk</th>
              <th className="text-left p-2 font-medium text-muted-foreground border-b border-border">Critical Limit</th>
              <th className="text-left p-2 font-medium text-muted-foreground border-b border-border">Monitoring</th>
              <th className="text-left p-2 font-medium text-muted-foreground border-b border-border">Corrective Action</th>
              <th className="p-2 border-b border-border w-10"></th>
            </tr>
          </thead>
          <tbody>
            {planSteps.map((step, si) => (
              <React.Fragment key={`step-${si}`}>
                {step.hazards.length === 0 ? (
                  <tr key={`step-${si}-empty`} className="border-b border-border">
                     <td className="p-2 font-medium text-foreground">{step.process_name}
                       <Button variant="ghost" size="sm" className="h-5 px-1 ml-1 text-xs text-primary" onClick={() => navigate(`/sop?search=${encodeURIComponent(step.process_name)}`)}>
                         <BookOpen className="w-3 h-3 mr-0.5" /> SOP
                       </Button>
                     </td>
                    <td colSpan={7} className="p-2 text-muted-foreground text-xs italic">
                      No hazards identified
                    </td>
                    <td className="p-2">
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => addHazard(si)}>
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                ) : (
                  step.hazards.map((h, hi) => {
                    const risk = getRiskLabel(h.risk_score);
                    return (
                      <tr key={h.id} className="border-b border-border hover:bg-muted/20">
                         <td className="p-2 font-medium text-foreground align-top">
                           {hi === 0 && (
                             <>
                               {step.process_name}
                               <Button variant="ghost" size="sm" className="h-5 px-1 ml-1 text-xs text-primary" onClick={() => navigate(`/sop?search=${encodeURIComponent(step.process_name)}`)}>
                                 <BookOpen className="w-3 h-3 mr-0.5" /> SOP
                               </Button>
                             </>
                           )}
                           {hi === step.hazards.length - 1 && (
                            <Button variant="ghost" size="sm" className="h-6 px-1 mt-1 text-xs" onClick={() => addHazard(si)}>
                              <Plus className="w-3 h-3 mr-0.5" /> Add
                            </Button>
                          )}
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-7 text-xs"
                            value={h.hazard_name}
                            onChange={(e) => updateHazard(si, hi, "hazard_name", e.target.value)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            className="h-7 w-12 text-xs text-center tabular-nums mx-auto"
                            type="number"
                            min={1}
                            max={5}
                            value={h.severity}
                            onChange={(e) => updateHazard(si, hi, "severity", e.target.value)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Input
                            className="h-7 w-12 text-xs text-center tabular-nums mx-auto"
                            type="number"
                            min={1}
                            max={5}
                            value={h.likelihood}
                            onChange={(e) => updateHazard(si, hi, "likelihood", e.target.value)}
                          />
                        </td>
                        <td className="p-2 text-center">
                          <Badge className={`${risk.className} text-xs tabular-nums`}>
                            {h.risk_score} {h.risk_score >= 12 ? "CCP" : ""}
                          </Badge>
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-7 text-xs"
                            value={h.critical_limit || ""}
                            onChange={(e) => updateHazard(si, hi, "critical_limit", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-7 text-xs"
                            value={h.monitoring || ""}
                            onChange={(e) => updateHazard(si, hi, "monitoring", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            className="h-7 text-xs"
                            value={h.corrective_action || ""}
                            onChange={(e) => updateHazard(si, hi, "corrective_action", e.target.value)}
                          />
                        </td>
                        <td className="p-2">
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeHazard(si, hi)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HACCPTable;
