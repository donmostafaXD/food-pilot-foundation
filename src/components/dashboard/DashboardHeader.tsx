import { usePlan } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useActivity } from "@/contexts/ActivityContext";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarDays, MapPin, Utensils } from "lucide-react";
import { format } from "date-fns";

interface Branch {
  id: string;
  name: string;
  activity_type: string | null;
}

interface Props {
  selectedBranchId: string | null;
  onBranchChange: (branchId: string) => void;
  branches: Branch[];
}

const DashboardHeader = ({ selectedBranchId, onBranchChange, branches }: Props) => {
  const { canAccessMultiBranch, planDisplayName } = usePlan();
  const { canViewAllBranches, effectiveRole } = useRoleAccess();
  const { activeActivity } = useActivity();

  const selectedBranch = branches.find((b) => b.id === selectedBranchId);
  const showBranchSelector = canViewAllBranches && canAccessMultiBranch && branches.length > 1;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <Badge variant="outline" className="text-xs font-medium">
            {planDisplayName}
          </Badge>
          {effectiveRole && (
            <Badge variant="secondary" className="text-[10px]">
              {effectiveRole}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
          {activeActivity && (
            <span className="flex items-center gap-1">
              <Utensils className="h-3.5 w-3.5" />
              {activeActivity.activity_name}
            </span>
          )}
          <span className="flex items-center gap-1">
            <CalendarDays className="h-3.5 w-3.5" />
            {format(new Date(), "EEE, MMM d, yyyy")}
          </span>
        </div>
      </div>

      {showBranchSelector ? (
        <Select value={selectedBranchId ?? ""} onValueChange={onBranchChange}>
          <SelectTrigger className="w-[200px]">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Select branch" />
          </SelectTrigger>
          <SelectContent>
            {branches.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : selectedBranch ? (
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          {selectedBranch.name}
        </div>
      ) : null}
    </div>
  );
};

export default DashboardHeader;
