import { useAuth } from "@/contexts/AuthContext";
import { useAdminPlanOverride, type PreviewRole } from "@/contexts/AdminPlanOverrideContext";
import { PlanTier, PLAN_DISPLAY_NAMES } from "@/hooks/usePlan";
import { Crown, RotateCcw, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const PLANS: PlanTier[] = ["basic", "professional", "premium"];

const ROLE_OPTIONS: Record<PlanTier, { value: PreviewRole; label: string }[]> = {
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
  const roleOptions = ROLE_OPTIONS[activePlan];

  const handlePlanChange = (v: string) => {
    const newPlan = v === "original" ? null : (v as PlanTier);
    setOverridePlan(newPlan);
    // Reset role if current role isn't available for new plan
    if (overrideRole) {
      const plan = newPlan ?? "basic";
      const available = ROLE_OPTIONS[plan].map((r) => r.value);
      if (!available.includes(overrideRole)) {
        setOverrideRole(null);
      }
    }
  };

  const handleRoleChange = (v: string) => {
    setOverrideRole(v === "original" ? null : (v as PreviewRole));
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {isOverrideActive && (
        <Badge variant="outline" className="border-accent text-accent-foreground bg-accent/20 gap-1 text-xs">
          <Eye className="h-3 w-3" />
          Preview Mode
        </Badge>
      )}

      <div className="flex items-center gap-1.5">
        <Crown className="h-4 w-4 text-primary" />
        <Select value={overridePlan ?? "original"} onValueChange={handlePlanChange}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">Original Plan</SelectItem>
            {PLANS.map((p) => (
              <SelectItem key={p} value={p}>
                {PLAN_DISPLAY_NAMES[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-1.5">
        <Select value={overrideRole ?? "original"} onValueChange={handleRoleChange}>
          <SelectTrigger className="h-8 w-[140px] text-xs">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="original">Original Role</SelectItem>
            {roleOptions.map((r) => (
              <SelectItem key={r.value} value={r.value!}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isOverrideActive && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetOverride} title="Reset Preview">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
