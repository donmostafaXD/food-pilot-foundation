import { useAuth } from "@/contexts/AuthContext";
import { useAdminPlanOverride, type PreviewRole } from "@/contexts/AdminPlanOverrideContext";
import { PlanTier, PLAN_DISPLAY_NAMES } from "@/hooks/usePlan";
import { Crown, Eye, EyeOff, ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

const PLANS: PlanTier[] = ["basic", "professional", "premium"];

const ROLE_OPTIONS: Partial<Record<PlanTier, { value: PreviewRole; label: string }[]>> & Record<"basic" | "professional" | "premium", { value: PreviewRole; label: string }[]> = {
  basic: [
    { value: "Owner", label: "Owner / Manager" },
    { value: "Staff", label: "Staff" },
  ],
  professional: [
    { value: "Owner", label: "Owner" },
    { value: "Manager", label: "Manager" },
    { value: "Staff", label: "Staff" },
  ],
  premium: [
    { value: "Owner", label: "Owner" },
    { value: "Manager", label: "Manager" },
    { value: "Staff", label: "Staff" },
  ],
};

export function AdminPlanSwitcher() {
  const { roles } = useAuth();
  const {
    overridePlan,
    setOverridePlan,
    overrideRole,
    setOverrideRole,
    isOverrideActive,
    resetOverride,
  } = useAdminPlanOverride();

  const isSuperAdmin = roles.includes("super_admin" as any);
  if (!isSuperAdmin) return null;

  const activePlan = overridePlan ?? "basic";
  const roleOptions = ROLE_OPTIONS[activePlan] || ROLE_OPTIONS.premium;

  const handlePlanChange = (v: string) => {
    const newPlan = v === "none" ? null : (v as PlanTier);
    setOverridePlan(newPlan);
    if (overrideRole) {
      const plan = newPlan ?? "basic";
      const available = (ROLE_OPTIONS[plan] || ROLE_OPTIONS.premium).map((r) => r.value);
      if (!available.includes(overrideRole)) {
        setOverrideRole(null);
      }
    }
    if (newPlan) {
      const roleName = overrideRole ?? "default";
      toast({
        title: "Preview updated",
        description: `Viewing as ${PLAN_DISPLAY_NAMES[newPlan]} plan · ${roleName} role`,
        duration: 2000,
      });
    }
  };

  const handleRoleChange = (v: string) => {
    const newRole = v === "none" ? null : (v as PreviewRole);
    setOverrideRole(newRole);
    if (newRole) {
      const planName = overridePlan ? PLAN_DISPLAY_NAMES[overridePlan] : "Current";
      toast({
        title: "Preview updated",
        description: `Viewing as ${planName} plan · ${newRole} role`,
        duration: 2000,
      });
    }
  };

  const handleExit = () => {
    resetOverride();
    toast({
      title: "Preview ended",
      description: "Restored to your real permissions",
      duration: 2000,
    });
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Crown className="h-4 w-4 text-primary shrink-0" />

      <Select value={overridePlan ?? "none"} onValueChange={handlePlanChange}>
        <SelectTrigger className="h-8 w-[130px] text-xs border-dashed">
          <SelectValue placeholder="Preview Plan" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">No override</span>
          </SelectItem>
          {PLANS.map((p) => (
            <SelectItem key={p} value={p}>
              {PLAN_DISPLAY_NAMES[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={overrideRole ?? "none"} onValueChange={handleRoleChange}>
        <SelectTrigger className="h-8 w-[130px] text-xs border-dashed">
          <SelectValue placeholder="Preview Role" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">
            <span className="text-muted-foreground">No override</span>
          </SelectItem>
          {roleOptions.map((r) => (
            <SelectItem key={r.value} value={r.value!}>
              {r.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {isOverrideActive && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs gap-1.5 border-warning/50 text-warning hover:bg-warning/10 hover:text-warning"
          onClick={handleExit}
        >
          <EyeOff className="h-3.5 w-3.5" />
          Exit Preview
        </Button>
      )}
    </div>
  );
}
