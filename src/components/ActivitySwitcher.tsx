import { useActivity } from "@/contexts/ActivityContext";
import { usePlan } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Utensils } from "lucide-react";

/**
 * Activity switcher shown in the top header bar.
 * Only visible when the user has more than one activity.
 */
export function ActivitySwitcher() {
  const { activities, activeActivityId, switchActivity, loading } = useActivity();
  const { canChangeActivity } = useRoleAccess();
  const { maxActivities } = usePlan();

  if (loading || activities.length === 0) return null;

  // Single activity — just show badge, no dropdown
  if (activities.length <= 1) {
    const act = activities[0];
    if (!act) return null;
    return (
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Utensils className="h-3.5 w-3.5" />
        <span className="truncate max-w-[160px]">{act.activity_name}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Select
        value={activeActivityId ?? ""}
        onValueChange={switchActivity}
        disabled={!canChangeActivity && activities.length <= 1}
      >
        <SelectTrigger className="h-8 w-[180px] text-xs">
          <Utensils className="h-3.5 w-3.5 mr-1.5 text-muted-foreground shrink-0" />
          <SelectValue placeholder="Select activity" />
        </SelectTrigger>
        <SelectContent>
          {activities.map((a) => (
            <SelectItem key={a.id} value={a.id} className="text-xs">
              {a.activity_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {maxActivities !== Infinity && (
        <Badge variant="outline" className="text-[9px] shrink-0">
          {activities.length}/{maxActivities}
        </Badge>
      )}
    </div>
  );
}
