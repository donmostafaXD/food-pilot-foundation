import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Step1BusinessInfo from "@/components/setup/Step1BusinessInfo";
import Step2ActivitySelection from "@/components/setup/Step2ActivitySelection";
import Step3SmartQuestions from "@/components/setup/Step3SmartQuestions";
import Step4ProcessFlowBuilder from "@/components/setup/Step4ProcessFlowBuilder";
import HACCPTable from "@/components/haccp/HACCPTable";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Save, Loader2 } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";

export interface ProcessStep {
  process_name: string;
  process_order: number;
  process_step_id?: number | null;
}

export interface HazardRow {
  id: string; // local temp id
  hazard_name: string;
  hazard_type: string | null;
  severity: number;
  likelihood: number;
  risk_score: number;
  control_type: string | null;
  critical_limit: string | null;
  monitoring: string | null;
  corrective_action: string | null;
  /** Original default from CCP_Table — used for safety safeguard logic */
  default_control_type?: string | null;
  /** True when safeguard forced CCP override */
  safeguard_applied?: boolean;
}

export interface PlanStep {
  process_name: string;
  step_order: number;
  process_step_id: number | null;
  hazards: HazardRow[];
}

const STEPS = ["Business Info", "Activity", "Questions", "Process Flow", "HACCP Plan"];

const SetupWizard = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { canAccessManufacturing, showRiskFields, canEditRiskFields, plan: subscriptionPlan } = usePlan();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Wizard state
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<"Food Service" | "Manufacturing" | "">("");
  const [selectedActivity, setSelectedActivity] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [excludedProcesses, setExcludedProcesses] = useState<string[]>([]);
  const [smartAnswers, setSmartAnswers] = useState<Record<number, boolean>>({});
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);

  const isFoodService = businessType === "Food Service";

  const canNext = () => {
    switch (currentStep) {
      case 0: return businessType !== "";
      case 1: return selectedActivity !== "";
      case 2: return true;
      case 3: return processSteps.length > 0;
      case 4: return planSteps.length > 0;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((s) => s + 1);
  };
  const handleBack = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !profile?.branch_id) {
      toast.error("Organization or branch not found. Please complete registration first.");
      return;
    }

    setSaving(true);
    try {
      // 1. Create haccp_plan
      const { data: plan, error: planError } = await supabase
        .from("haccp_plans")
        .insert({
          organization_id: profile.organization_id,
          branch_id: profile.branch_id,
          business_type: businessType,
          activity_name: selectedActivity,
          status: "active",
        })
        .select("id")
        .single();

      if (planError) throw planError;

      // 2. Insert steps
      for (const step of planSteps) {
        const { data: stepData, error: stepError } = await supabase
          .from("haccp_plan_steps")
          .insert({
            haccp_plan_id: plan.id,
            process_name: step.process_name,
            step_order: step.step_order,
            process_step_id: step.process_step_id,
          })
          .select("id")
          .single();

        if (stepError) throw stepError;

        // 3. Insert hazards for this step
        if (step.hazards.length > 0) {
          const hazardInserts = step.hazards.map((h) => ({
            haccp_plan_step_id: stepData.id,
            hazard_name: h.hazard_name,
            hazard_type: h.hazard_type,
            severity: h.severity,
            likelihood: h.likelihood,
            risk_score: h.risk_score,
            control_type: h.control_type,
            critical_limit: h.critical_limit,
            monitoring: h.monitoring,
            corrective_action: h.corrective_action,
          }));

          const { error: hazError } = await supabase
            .from("haccp_plan_hazards")
            .insert(hazardInserts);

          if (hazError) throw hazError;
        }
      }

      localStorage.setItem("haccp_plan_updated", "true");
      toast.success("HACCP Plan saved successfully!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Save error:", err);
      toast.error(err.message || "Failed to save HACCP plan");
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">HACCP Setup Wizard</h1>
        <p className="text-sm text-muted-foreground mt-1 mb-6">Set up your food safety management system</p>
        <div className="flex items-center gap-1 mb-8">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium shrink-0 ${
                    i <= currentStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i + 1}
                </div>
                <span className={`text-xs truncate hidden sm:block ${i <= currentStep ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`h-px flex-1 mx-2 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <div className="bg-card rounded-lg shadow-industrial-sm p-6 min-h-[400px]">
          {currentStep === 0 && (
            <Step1BusinessInfo
              businessName={businessName}
              setBusinessName={setBusinessName}
              businessType={businessType}
              setBusinessType={setBusinessType}
              orgName={profile?.full_name || ""}
              canAccessManufacturing={canAccessManufacturing}
            />
          )}
          {currentStep === 1 && (
            <Step2ActivitySelection
              businessType={businessType}
              selectedActivity={selectedActivity}
              setSelectedActivity={setSelectedActivity}
              setSelectedTemplate={setSelectedTemplate}
            />
          )}
          {currentStep === 2 && (
            <Step3SmartQuestions
              activityName={selectedActivity}
              excludedProcesses={excludedProcesses}
              setExcludedProcesses={setExcludedProcesses}
              answers={smartAnswers}
              setAnswers={setSmartAnswers}
            />
          )}
          {currentStep === 3 && (
            <Step4ProcessFlowBuilder
              activityName={selectedActivity}
              excludedProcesses={excludedProcesses}
              processSteps={processSteps}
              setProcessSteps={setProcessSteps}
              isFoodService={isFoodService}
            />
          )}
          {currentStep === 4 && (
            <HACCPTable
              processSteps={processSteps}
              isFoodService={isFoodService}
              activityName={selectedActivity}
              planSteps={planSteps}
              setPlanSteps={setPlanSteps}
              showRiskFields={showRiskFields}
              canEditRiskFields={canEditRiskFields}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={handleBack} disabled={currentStep === 0}>
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>

          {currentStep < STEPS.length - 1 ? (
            <Button onClick={handleNext} disabled={!canNext()}>
              Next <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSave} disabled={saving || planSteps.length === 0}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Save HACCP Plan
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SetupWizard;
