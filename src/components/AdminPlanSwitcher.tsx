import { useAuth } from "@/contexts/AuthContext";
import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import { PlanTier, PLAN_DISPLAY_NAMES } from "@/hooks/usePlan";
import { Crown, RotateCcw, FlaskConical } from "lucide-react";
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

export function AdminPlanSwitcher() {
  const { roles } = useAuth();
  const { overridePlan, setOverridePlan, isOverrideActive, resetOverride } = useAdminPlanOverride();

  const isSuperAdmin = roles.includes("super_admin" as any);
  if (!isSuperAdmin) return null;

  return (
    <div className="flex items-center gap-2">
      {isOverrideActive && (
        <Badge variant="outline" className="border-accent text-accent-foreground bg-accent/20 gap-1 text-xs">
          <FlaskConical className="h-3 w-3" />
          Admin Testing Mode
        </Badge>
      )}
      <div className="flex items-center gap-1.5">
        <Crown className="h-4 w-4 text-primary" />
        <Select
          value={overridePlan ?? "original"}
          onValueChange={(v) => setOverridePlan(v === "original" ? null : (v as PlanTier))}
        >
          <SelectTrigger className="h-8 w-[160px] text-xs">
            <SelectValue placeholder="Switch Plan" />
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
      {isOverrideActive && (
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={resetOverride} title="Reset to Original Plan">
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
