import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUp, ArrowDown, Trash2, Plus, Loader2 } from "lucide-react";
import type { ProcessStep } from "@/pages/SetupWizard";

interface Props {
  activityName: string;
  excludedProcesses: string[];
  processSteps: ProcessStep[];
  setProcessSteps: (v: ProcessStep[]) => void;
  isFoodService: boolean;
}

const Step4ProcessFlowBuilder = ({
  activityName,
  excludedProcesses,
  processSteps,
  setProcessSteps,
  isFoodService,
}: Props) => {
  const [loading, setLoading] = useState(true);
  const [newStepName, setNewStepName] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      // Load process flow from activity_process_map
      const { data: flowData } = await supabase
        .from("activity_process_map")
        .select("*")
        .eq("activity", activityName)
        .order("process_order");

      let steps: ProcessStep[] = (flowData || [])
        .filter((f) => !excludedProcesses.includes(f.process))
        .map((f) => ({
          process_name: f.process,
          process_order: f.process_order,
          process_step_id: null,
        }));

      // For manufacturing, resolve process_step_id
      if (!isFoodService && steps.length > 0) {
        const processNames = steps.map((s) => s.process_name);

        // Get all process_steps matching these names
        const { data: psData } = await supabase
          .from("process_steps")
          .select("id, process_name")
          .in("process_name", processNames);

        if (psData && psData.length > 0) {
          const psIds = psData.map((ps) => ps.id);

          // Filter to only IDs that exist in ccp_analysis
          const { data: ccpData } = await supabase
            .from("ccp_analysis")
            .select("process_step_id")
            .in("process_step_id", psIds);

          const validIds = new Set((ccpData || []).map((c) => c.process_step_id));

          // Build name → id map (prefer IDs in ccp_analysis)
          const nameToId: Record<string, number> = {};
          psData.forEach((ps) => {
            if (validIds.has(ps.id)) {
              nameToId[ps.process_name] = ps.id;
            }
          });
          // Fallback for names not in ccp_analysis
          psData.forEach((ps) => {
            if (!nameToId[ps.process_name]) {
              nameToId[ps.process_name] = ps.id;
            }
          });

          steps = steps.map((s) => ({
            ...s,
            process_step_id: nameToId[s.process_name] ?? null,
          }));
        }
      }

      setProcessSteps(steps);
      setLoading(false);
    };
    load();
  }, [activityName, excludedProcesses, isFoodService]);

  const moveUp = (index: number) => {
    if (index === 0) return;
    const arr = [...processSteps];
    [arr[index - 1], arr[index]] = [arr[index], arr[index - 1]];
    reorder(arr);
  };

  const moveDown = (index: number) => {
    if (index === processSteps.length - 1) return;
    const arr = [...processSteps];
    [arr[index], arr[index + 1]] = [arr[index + 1], arr[index]];
    reorder(arr);
  };

  const remove = (index: number) => {
    const arr = processSteps.filter((_, i) => i !== index);
    reorder(arr);
  };

  const addStep = () => {
    if (!newStepName.trim()) return;
    const arr = [
      ...processSteps,
      { process_name: newStepName.trim(), process_order: processSteps.length + 1, process_step_id: null },
    ];
    reorder(arr);
    setNewStepName("");
  };

  const reorder = (arr: ProcessStep[]) => {
    setProcessSteps(arr.map((s, i) => ({ ...s, process_order: i + 1 })));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Process Flow</h2>
        <p className="text-sm text-muted-foreground mt-1">Review and customize your process steps</p>
      </div>

      <div className="space-y-2">
        {processSteps.map((step, i) => (
          <div
            key={`${step.process_name}-${i}`}
            className="flex items-center gap-2 p-3 bg-card border border-border rounded-lg"
          >
            <span className="w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-medium flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 text-sm font-medium text-foreground">{step.process_name}</span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveUp(i)} disabled={i === 0}>
                <ArrowUp className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => moveDown(i)} disabled={i === processSteps.length - 1}>
                <ArrowDown className="w-3.5 h-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => remove(i)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          value={newStepName}
          onChange={(e) => setNewStepName(e.target.value)}
          placeholder="Add custom step..."
          onKeyDown={(e) => e.key === "Enter" && addStep()}
        />
        <Button variant="outline" onClick={addStep} disabled={!newStepName.trim()}>
          <Plus className="w-4 h-4 mr-1" /> Add
        </Button>
      </div>
    </div>
  );
};

export default Step4ProcessFlowBuilder;
