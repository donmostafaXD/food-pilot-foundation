import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Wand2,
  CreditCard,
  Users,
  UserPlus,
  Check,
  Crown,
  Phone,
  Loader2,
  Settings as SettingsIcon,
  FileEdit,
  AlertTriangle,
  Building2,
  ArrowUpRight,
  Save,
  Lock,
  ShieldCheck,
  PlusCircle,
  Info,
  Eye,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan, PLAN_CONFIG, PLAN_DISPLAY_NAMES, type PlanTier } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Link } from "react-router-dom";
import HACCPTable from "@/components/haccp/HACCPTable";
import FoodSafetySetupSection from "@/components/settings/FoodSafetySetupSection";
import type { ProcessStep, PlanStep } from "@/pages/SetupWizard";
import { PLAN_COMPARISON, PLAN_TIER_LABELS } from "@/lib/plan-features";

// ── Locked Section Wrapper ───────────────────────────────────────────
const LockedSection = ({ title, description, requiredRole = "Owner" }: { title: string; description: string; requiredRole?: string }) => (
  <div className="space-y-4">
    <div>
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{description}</p>
    </div>
    <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/20">
      <CardContent className="flex items-center gap-4 py-8 justify-center">
        <div className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
            <Lock className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">Restricted Access</p>
            <p className="text-xs text-muted-foreground">
              Only <strong>{requiredRole}s</strong> can modify this setting.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// ── Tooltip Helper ───────────────────────────────────────────────────
const HelpTip = ({ text }: { text: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <Info className="w-3.5 h-3.5 text-muted-foreground cursor-help inline-block ml-1" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[240px] text-xs">
        {text}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

// ── HACCP Plan Edit Section ──────────────────────────────────────────
const HACCPPlanSection = () => {
  const { profile } = useAuth();
  const { plan, showRiskFields, canEditRiskFields } = usePlan();
  const { canEditHACCP } = useRoleAccess();
  const isBasic = plan === "basic";

  const [loading, setLoading] = useState(true);
  const [planExists, setPlanExists] = useState(false);
  const [planId, setPlanId] = useState<string | null>(null);
  const [processSteps, setProcessSteps] = useState<ProcessStep[]>([]);
  const [planSteps, setPlanSteps] = useState<PlanStep[]>([]);
  const [isFoodService, setIsFoodService] = useState(false);
  const [activityName, setActivityName] = useState("");
  const [saving, setSaving] = useState(false);

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

  const handleSave = async () => {
    if (!planId) return;
    setSaving(true);
    try {
      const { data: existingSteps } = await supabase
        .from("haccp_plan_steps")
        .select("id")
        .eq("haccp_plan_id", planId);
      const existingStepIds = (existingSteps || []).map(s => s.id);
      if (existingStepIds.length > 0) {
        await supabase.from("haccp_plan_hazards").delete().in("haccp_plan_step_id", existingStepIds);
      }
      await supabase.from("haccp_plan_steps").delete().eq("haccp_plan_id", planId);

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
      sonnerToast.success("HACCP Plan saved successfully");
    } catch (err: any) {
      sonnerToast.error("Failed to save", { description: err.message });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!planExists) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">HACCP Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">No HACCP plan found. Use "Manage Activities" to create one.</p>
        </div>
      </div>
    );
  }

  if (!canEditHACCP) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">HACCP Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">View your current HACCP plan configuration.</p>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Eye className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            <strong>Read-only access</strong> — Only Owners and Managers can edit the HACCP plan.
          </p>
        </div>
        <HACCPTable
          processSteps={processSteps}
          isFoodService={isFoodService}
          activityName={activityName}
          planSteps={planSteps}
          setPlanSteps={setPlanSteps}
          showRiskFields={showRiskFields}
          canEditRiskFields={false}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">HACCP Plan</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Edit your current HACCP plan. Click "Save Changes" when done.
          </p>
        </div>
        <Button size="sm" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
          Save Changes
        </Button>
      </div>

      {isBasic && (
        <div className="p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <ArrowUpRight className="w-3 h-3 shrink-0" />
            Upgrade to unlock detailed risk analysis (Severity, Likelihood, Risk Score)
          </p>
        </div>
      )}

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
  );
};

// ── Manage Activities Section ─────────────────────────────────────────
const ManageActivitiesSection = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { plan, maxActivities } = usePlan();
  const { canChangeActivity } = useRoleAccess();
  const [showConfirm, setShowConfirm] = useState(false);
  const [activityCount, setActivityCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  const isBasic = plan === "basic";
  const canAddActivity = activityCount < maxActivities;

  useEffect(() => {
    if (!profile?.organization_id) return;
    const load = async () => {
      const { data } = await supabase
        .from("haccp_plans")
        .select("id")
        .eq("organization_id", profile.organization_id!);
      setActivityCount(data?.length || 0);
      setLoadingCount(false);
    };
    load();
  }, [profile?.organization_id]);

  const handleStart = () => {
    if (showConfirm) {
      navigate("/setup");
    } else {
      setShowConfirm(true);
    }
  };

  if (!canChangeActivity) {
    return (
      <LockedSection
        title="Manage Activities"
        description="Activity management controls which food safety workflows are active."
        requiredRole="Owner"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Manage Activities</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your food safety activities. Each activity has its own HACCP plan, logs, PRP, and SOP.
        </p>
      </div>

      <Card className="shadow-sm">
        <CardContent className="pt-6 pb-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">Current Activities</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {loadingCount ? "Loading..." : `${activityCount} active ${activityCount === 1 ? "activity" : "activities"}`}
              </p>
            </div>
            {maxActivities !== Infinity && !loadingCount && (
              <Badge variant={activityCount >= maxActivities ? "destructive" : "secondary"} className="text-[10px]">
                {activityCount} / {maxActivities} {maxActivities === 1 ? "activity" : "activities"}
              </Badge>
            )}
          </div>

          {isBasic && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                To add more activities, upgrade your plan.
                <HelpTip text="Basic plan supports 1 activity. Upgrade to HACCP for up to 3, or Compliance for unlimited." />
              </p>
            </div>
          )}

          {!isBasic && canAddActivity && canChangeActivity && (
            <Button variant="outline" size="sm" onClick={() => navigate("/setup?mode=add")}>
              <PlusCircle className="w-4 h-4 mr-1" /> Add Activity
            </Button>
          )}

          {!isBasic && !canAddActivity && !loadingCount && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
              <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
              <p className="text-xs text-muted-foreground">
                Activity limit reached. Upgrade to Compliance for unlimited activities.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {canChangeActivity && (
        <Card className="shadow-sm">
          <CardContent className="pt-6 pb-5 space-y-4">
            <div className="flex flex-col items-center text-center gap-3">
              <div className="p-3 rounded-full bg-destructive/10">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Restart HACCP Setup</p>
                <p className="text-xs text-muted-foreground mt-1">
                  This will run the full setup wizard from the beginning and generate a new HACCP plan.
                </p>
              </div>

              {showConfirm && (
                <div className="w-full p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm text-destructive font-medium flex items-center justify-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    This will overwrite your current HACCP plan
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    All existing plan data, hazards, and edits will be replaced.
                  </p>
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <Button variant="destructive" onClick={handleStart}>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {showConfirm ? "Confirm & Start Setup" : "Change Activity"}
                </Button>
                {showConfirm && (
                  <Button variant="outline" onClick={() => setShowConfirm(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ── Business Profile Section ─────────────────────────────────────────
const BusinessProfileSection = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const { can } = useRoleAccess();
  const canEdit = can("business_profile", "edit");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!profile?.organization_id) return;
    const load = async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id!)
        .maybeSingle();
      if (data) {
        setOrgName(data.name || "");
        setCountry((data as any).country || "");
        setCity((data as any).city || "");
        setEmployeeCount((data as any).employee_count?.toString() || "");
        setDescription((data as any).description || "");
      }
      setLoading(false);
    };
    load();
  }, [profile?.organization_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: orgName,
        country,
        city,
        employee_count: employeeCount ? parseInt(employeeCount, 10) : null,
        description: description || null,
      } as any)
      .eq("id", profile.organization_id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Business profile updated" });
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  const hasData = orgName.trim().length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Business Profile
            <HelpTip text="Your business details appear in reports, audit documents, and printed headers." />
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Organization details used across the system.
          </p>
        </div>
        {!editing && hasData && canEdit && (
          <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
            <FileEdit className="w-4 h-4 mr-1" />
            Edit
          </Button>
        )}
      </div>

      {!canEdit && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Only <strong>Owners</strong> can modify the business profile.
          </p>
        </div>
      )}

      <Card className="shadow-sm">
        <CardContent className="pt-5 pb-4">
          {!editing || !canEdit ? (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Business Name</p>
                <p className="text-sm text-foreground">{orgName || "—"}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Country</p>
                  <p className="text-sm text-foreground">{country || "—"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">City / Location</p>
                  <p className="text-sm text-foreground">{city || "—"}</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Number of Employees</p>
                <p className="text-sm text-foreground">{employeeCount || "—"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Business Description</p>
                <p className="text-sm text-foreground">{description || "—"}</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Country</Label>
                  <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. UAE" />
                </div>
                <div className="space-y-2">
                  <Label>City / Location</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Dubai" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Number of Employees</Label>
                <Input type="number" min="1" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} placeholder="e.g. 15" />
              </div>
              <div className="space-y-2">
                <Label>Business Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your business" rows={3} className="resize-none" />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={saving} size="sm">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}
                  Save Changes
                </Button>
                {editing && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Subscription Section ─────────────────────────────────────────────
const SubscriptionSection = () => {
  const { plan: currentPlan, loading, updatePlan, planDisplayName } = usePlan();
  const { effectiveRole } = useRoleAccess();
  const canUpgrade = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const [updating, setUpdating] = useState<PlanTier | null>(null);

  const handleSelect = async (tier: PlanTier) => {
    if (tier === currentPlan || !canUpgrade) return;
    setUpdating(tier);
    const { error } = await updatePlan(tier);
    setUpdating(null);
    if (error) {
      sonnerToast.error("Failed to update plan", { description: error.message });
    } else {
      sonnerToast.success(`Switched to ${PLAN_DISPLAY_NAMES[tier]} plan`);
    }
  };

  const planTiers: { tier: PlanTier; features: string[] }[] = [
    {
      tier: "basic",
      features: [
        "Food Service activities",
        "Simplified HACCP view",
        "CCP / OPRP / PRP labels",
        "Critical limits & monitoring",
        "Basic logs (7 essential)",
        "1 branch, 1 activity",
      ],
    },
    {
      tier: "professional",
      features: [
        "Food Service + Manufacturing",
        "Full risk analysis (S × L)",
        "Dynamic CCP / OPRP logic",
        "Complete hazard library",
        "SOP & PRP management",
        "Equipment registry",
        "Up to 3 branches & activities",
      ],
    },
    {
      tier: "premium",
      features: [
        "Everything in HACCP",
        "Internal audit tools",
        "Compliance tracking",
        "Full FSMS documentation",
        "Advanced analytics",
        "Unlimited branches & activities",
        "Unlimited users",
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Subscription & Billing</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your current plan and available upgrades.
          {!canUpgrade && (
            <span className="block mt-1 italic text-xs">Only the organization Owner can change the subscription plan.</span>
          )}
        </p>
      </div>

      {/* Current plan card */}
      <Card className="shadow-sm border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 pt-5 pb-4">
          <div className="p-2.5 rounded-lg bg-primary/10">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Current Plan</p>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary mt-1" />
            ) : (
              <p className="text-base font-bold text-foreground">{planDisplayName}</p>
            )}
          </div>
          {!loading && currentPlan !== "premium" && (
            <Badge variant="secondary" className="text-[10px]">
              {currentPlan === "basic" ? "2 upgrades available" : "1 upgrade available"}
            </Badge>
          )}
          {!loading && currentPlan === "premium" && (
            <Badge className="text-[10px] bg-accent/10 text-accent border-0">
              <Check className="w-3 h-3 mr-0.5" /> Full access
            </Badge>
          )}
        </CardContent>
      </Card>

      {/* Plan cards */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planTiers.map((p) => {
            const isCurrent = p.tier === currentPlan;
            const isUpgrade = (p.tier === "professional" && currentPlan === "basic") ||
                              (p.tier === "premium" && currentPlan !== "premium");
            return (
              <Card key={p.tier} className={`flex flex-col shadow-sm transition-all ${isCurrent ? "ring-2 ring-primary/30 bg-primary/5" : isUpgrade ? "hover:border-primary/30" : "opacity-60"}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{PLAN_DISPLAY_NAMES[p.tier]}</CardTitle>
                    {isCurrent && (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-0">Current</Badge>
                    )}
                    {isUpgrade && !isCurrent && (
                      <Badge variant="outline" className="text-[10px] text-primary border-primary/30">
                        <ArrowUpRight className="w-3 h-3 mr-0.5" /> Upgrade
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{PLAN_CONFIG[p.tier].description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <ul className="space-y-1.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2 mt-auto">
                    {canUpgrade ? (
                      <>
                        <Button
                          className="w-full"
                          size="sm"
                          variant={isCurrent ? "outline" : "default"}
                          disabled={isCurrent || updating !== null}
                          onClick={() => handleSelect(p.tier)}
                        >
                          {updating === p.tier && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                          {isCurrent ? "Current Plan" : `Upgrade to ${PLAN_DISPLAY_NAMES[p.tier]}`}
                        </Button>
                        {isUpgrade && !isCurrent && (
                          <Button className="w-full" variant="ghost" size="sm" asChild>
                            <Link to="/contact">
                              <Phone className="w-3 h-3 mr-1" /> Contact Us
                            </Link>
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button className="w-full" size="sm" variant="outline" disabled>
                        {isCurrent ? "Current Plan" : (
                          <span className="flex items-center gap-1">
                            <Lock className="w-3 h-3" /> Owner only
                          </span>
                        )}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Feature comparison */}
      {!loading && (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold">Feature Comparison</CardTitle>
            <p className="text-xs text-muted-foreground">See what each plan includes across all modules.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 pr-4 text-muted-foreground font-medium">Feature</th>
                    <th className={`text-center py-2 px-3 font-medium ${currentPlan === "basic" ? "text-primary" : "text-muted-foreground"}`}>Basic</th>
                    <th className={`text-center py-2 px-3 font-medium ${currentPlan === "professional" ? "text-primary" : "text-muted-foreground"}`}>HACCP</th>
                    <th className={`text-center py-2 px-3 font-medium ${currentPlan === "premium" ? "text-primary" : "text-muted-foreground"}`}>Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {PLAN_COMPARISON.map((row) => (
                    <tr key={row.module} className="border-b border-border last:border-0">
                      <td className="py-2 pr-4 text-foreground font-medium">{row.module}</td>
                      <td className={`py-2 px-3 text-center ${currentPlan === "basic" ? "text-foreground font-medium" : "text-muted-foreground"}`}>{row.basic}</td>
                      <td className={`py-2 px-3 text-center ${currentPlan === "professional" ? "text-foreground font-medium" : "text-muted-foreground"}`}>{row.haccp}</td>
                      <td className={`py-2 px-3 text-center ${currentPlan === "premium" ? "text-foreground font-medium" : "text-muted-foreground"}`}>{row.compliance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ── Users Section ────────────────────────────────────────────────────
type AppRole = "Owner" | "Manager" | "QA" | "Staff" | "Auditor";

interface OrgUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  branch_id: string | null;
  roles: AppRole[];
}

interface Branch {
  id: string;
  name: string;
}

const UsersSection = () => {
  const { profile, hasRole } = useAuth();
  const { plan } = usePlan();
  const { maxUsers, allowedInviteRoles, canManageUsers, canInviteAnyRole, effectiveRole } = useRoleAccess();
  const { toast } = useToast();

  const isOwner = effectiveRole === "Owner" || effectiveRole === "super_admin";

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>((allowedInviteRoles[0] as AppRole) || "Staff");
  const [inviteBranch, setInviteBranch] = useState<string>("");
  const [inviting, setInviting] = useState(false);

  const isBasicPlan = plan === "basic";
  const userLimitReached = users.length >= maxUsers;

  const loadData = async () => {
    if (!profile?.organization_id) return;

    const { data: branchData } = await supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", profile.organization_id);
    setBranches(branchData || []);
    if (branchData?.length && !inviteBranch) {
      setInviteBranch(branchData[0].id);
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, branch_id")
      .eq("organization_id", profile.organization_id);

    const userIds = (profileData || []).map((p) => p.user_id);
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const roleMap = new Map<string, AppRole[]>();
    (rolesData || []).forEach((r) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role as AppRole);
      roleMap.set(r.user_id, existing);
    });

    setUsers(
      (profileData || []).map((p) => ({
        ...p,
        roles: roleMap.get(p.user_id) || [],
      }))
    );
    setLoadingUsers(false);
  };

  if (!loaded) {
    setLoaded(true);
    loadData();
  }

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageUsers) return;
    if (userLimitReached) {
      toast({ title: "User limit reached", description: `Your plan allows a maximum of ${maxUsers} users.`, variant: "destructive" });
      return;
    }
    setInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "invite",
          email: inviteEmail,
          full_name: inviteFullName,
          role: isBasicPlan ? "Staff" : inviteRole,
          branch_id: inviteBranch,
          organization_id: profile!.organization_id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "User invited", description: `${inviteEmail} has been added.` });
      sonnerToast.success(`${inviteFullName || inviteEmail} added as ${isBasicPlan ? "Staff" : inviteRole}`);
      setInviteEmail("");
      setInviteFullName("");
      setInviteRole("Staff");
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to invite user", description: err.message, variant: "destructive" });
    }
    setInviting(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Team Management</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {isOwner
            ? "Add, manage, and assign roles to your team members."
            : "View your team members. Only Owners can manage users."
          }
        </p>
        {isBasicPlan && (
          <p className="text-xs text-muted-foreground mt-1 italic flex items-center gap-1">
            <Info className="w-3 h-3" />
            Basic plan: all staff are added with the Staff role.
          </p>
        )}
      </div>

      {/* Access control banner for non-owners */}
      {!isOwner && canManageUsers && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
          <Info className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            As a <strong>Manager</strong>, you can invite Staff members. Role assignment and user removal require <strong>Owner</strong> access.
          </p>
        </div>
      )}

      {canManageUsers && (
        <Card className="shadow-sm">
          <CardContent className="pt-5 pb-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-primary">
                <UserPlus className="w-4 h-4" />
                <span className="text-sm font-semibold">Add User</span>
              </div>
              {maxUsers !== Infinity && (
                <Badge variant={userLimitReached ? "destructive" : "secondary"} className="text-[10px]">
                  {users.length} / {maxUsers} users
                </Badge>
              )}
            </div>
            {userLimitReached ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <Lock className="w-4 h-4 text-destructive shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-destructive font-medium">User limit reached</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Upgrade your plan to add more users.
                    {isOwner && (
                      <a href="/settings?tab=subscription" className="text-primary hover:underline ml-1">
                        View plans <ArrowUpRight className="w-3 h-3 inline" />
                      </a>
                    )}
                  </p>
                </div>
              </div>
            ) : (
            <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="user@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} required placeholder="Jane Doe" />
              </div>
              {allowedInviteRoles.length > 1 && (
                <div className="space-y-2">
                  <Label>
                    Role
                    <HelpTip text="Staff can fill logs. Managers can manage operations. Owners have full control." />
                  </Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allowedInviteRoles.map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={inviteBranch} onValueChange={setInviteBranch}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={inviting} size="sm">
                  <UserPlus className="w-4 h-4 mr-1" />
                  {inviting ? "Adding…" : "Add User"}
                </Button>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
      )}

      <Card className="shadow-sm">
        <CardContent className="pt-5 pb-4 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">Team Members</span>
          </div>
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Users className="w-8 h-8 text-muted-foreground/40 mx-auto" />
              <p className="text-sm text-muted-foreground">No team members yet.</p>
              <p className="text-xs text-muted-foreground">Use the form above to invite your first team member.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="py-2 pr-4 text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="py-2 pr-4 text-xs font-medium text-muted-foreground uppercase">Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 text-foreground">{u.full_name || "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.map((r) => (
                            <Badge key={r} variant="secondary" className="text-[10px]">
                              {r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Food Safety Setup Wrapper ────────────────────────────────────────
const FoodSafetySetupWrapper = () => {
  const { profile } = useAuth();
  const [activityName, setActivityName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.branch_id || !profile?.organization_id) return;
    const load = async () => {
      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("activity_name")
        .eq("branch_id", profile.branch_id!)
        .eq("organization_id", profile.organization_id!)
        .order("created_at", { ascending: false })
        .limit(1);
      setActivityName(plans?.[0]?.activity_name || null);
      setLoading(false);
    };
    load();
  }, [profile?.branch_id, profile?.organization_id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (!activityName) {
    return (
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Food Safety Setup</h2>
        <p className="text-sm text-muted-foreground">
          No HACCP plan found. Create a plan first using "Manage Activities" to configure food safety setup.
        </p>
      </div>
    );
  }

  return <FoodSafetySetupSection activityName={activityName} />;
};

// ── Section Group Component ──────────────────────────────────────────
interface SettingsGroup {
  label: string;
  description: string;
  tabs: {
    value: string;
    label: string;
    shortLabel: string;
    icon: React.ComponentType<{ className?: string }>;
    visible: boolean;
    locked?: boolean;
    lockMessage?: string;
  }[];
}

// ── Main Settings Page ───────────────────────────────────────────────
const SettingsPage = () => {
  const { can, canView, effectiveRole } = useRoleAccess();
  const { plan } = usePlan();

  const canChangeActivity = can("activities", "edit");
  const canManageSubscription = can("subscription", "manage_settings");
  const canManageUsers = canView("users");
  const canEditBusiness = can("business_profile", "edit");
  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";

  // Build tab list dynamically based on role permissions
  const tabs = [
    // HACCP Configuration group
    { value: "haccp-plan", label: "HACCP Plan", shortLabel: "Plan", icon: FileEdit, visible: can("haccp_plan", "view"), group: "config" },
    { value: "food-safety", label: "Food Safety Setup", shortLabel: "Safety", icon: ShieldCheck, visible: can("food_safety_setup", "view"), group: "config" },
    { value: "manage-activities", label: "Activities", shortLabel: "Activities", icon: Wand2, visible: canChangeActivity, group: "config" },
    // Organization group
    { value: "business", label: "Business Profile", shortLabel: "Business", icon: Building2, visible: can("business_profile", "view"), group: "org" },
    { value: "users", label: "Team", shortLabel: "Team", icon: Users, visible: canManageUsers, group: "org" },
    // Billing group
    { value: "subscription", label: "Subscription", shortLabel: "Plan", icon: CreditCard, visible: canManageSubscription, group: "billing" },
  ].filter((t) => t.visible);

  const gridCols =
    tabs.length <= 3 ? "grid-cols-3" :
    tabs.length === 4 ? "grid-cols-4" :
    tabs.length === 5 ? "grid-cols-5" :
    "grid-cols-6";

  // Role context banner
  const getRoleBanner = () => {
    if (effectiveRole === "Staff") return null; // Staff shouldn't reach here
    if (effectiveRole === "Manager") {
      return (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border mb-4">
          <Info className="w-4 h-4 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            You have <strong>operational access</strong> to settings. Billing, team management, and activity changes require <strong>Owner</strong> permissions.
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px]">
              <Crown className="w-3 h-3 mr-0.5" /> {PLAN_DISPLAY_NAMES[plan]}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">{effectiveRole}</Badge>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Manage your organization, HACCP configuration, team, and subscription.
        </p>

        {getRoleBanner()}

        <Tabs defaultValue={tabs[0]?.value || "haccp-plan"} className="space-y-6">
          <TabsList className={`grid w-full ${gridCols}`}>
            {tabs.map((t) => (
              <TabsTrigger key={t.value} value={t.value} className="gap-1.5 text-xs sm:text-sm">
                <t.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{t.label}</span>
                <span className="sm:hidden">{t.shortLabel}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="haccp-plan">
            <HACCPPlanSection />
          </TabsContent>

          <TabsContent value="food-safety">
            <FoodSafetySetupWrapper />
          </TabsContent>

          {canChangeActivity && (
            <TabsContent value="manage-activities">
              <ManageActivitiesSection />
            </TabsContent>
          )}

          {can("business_profile", "view") && (
            <TabsContent value="business">
              <BusinessProfileSection />
            </TabsContent>
          )}

          {canManageSubscription && (
            <TabsContent value="subscription">
              <SubscriptionSection />
            </TabsContent>
          )}

          {canManageUsers && (
            <TabsContent value="users">
              <UsersSection />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
