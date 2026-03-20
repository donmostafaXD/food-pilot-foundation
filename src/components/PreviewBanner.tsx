import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import { PLAN_DISPLAY_NAMES } from "@/hooks/usePlan";
import { Eye, EyeOff, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";

export function PreviewBanner() {
  const { overridePlan, overrideRole, isOverrideActive, resetOverride } = useAdminPlanOverride();

  if (!isOverrideActive) return null;

  const planLabel = overridePlan ? PLAN_DISPLAY_NAMES[overridePlan] : null;
  const roleLabel = overrideRole ?? null;

  const handleExit = () => {
    resetOverride();
    toast({
      title: "Preview ended",
      description: "Restored to your real permissions",
      duration: 2000,
    });
  };

  return (
    <div className="bg-warning/10 border-b border-warning/30 px-4 py-2 flex items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Eye className="h-4 w-4 text-warning" />
          <span className="text-xs font-semibold text-warning uppercase tracking-wide">
            Preview Mode
          </span>
        </div>

        <span className="text-xs text-muted-foreground hidden sm:inline">—</span>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs text-muted-foreground hidden sm:inline">Viewing as</span>
          {planLabel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-warning/40 text-warning font-medium">
              {planLabel}
            </Badge>
          )}
          {roleLabel && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-warning/40 text-warning font-medium">
              {roleLabel}
            </Badge>
          )}
        </div>

        <span className="text-[10px] text-muted-foreground hidden md:inline">
          · Simulated view only — real permissions unchanged
        </span>
      </div>

      <Button
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1 border-warning/40 text-warning hover:bg-warning/10 hover:text-warning shrink-0"
        onClick={handleExit}
      >
        <EyeOff className="h-3 w-3" />
        Exit
      </Button>
    </div>
  );
}
