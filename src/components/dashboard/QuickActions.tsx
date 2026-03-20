import { useNavigate } from "react-router-dom";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { usePlan } from "@/hooks/usePlan";
import { isModuleLocked } from "@/lib/plan-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ClipboardList,
  Plus,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  Settings,
  BookOpen,
  Lock,
  Users,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

const QuickActions = () => {
  const navigate = useNavigate();
  const { can, canView, effectiveRole } = useRoleAccess();
  const { plan, canAccessSOP, canAccessDocuments, showComplianceTools } = usePlan();

  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const isManagerLevel = isOwnerLevel || effectiveRole === "Manager";
  const isStaff = effectiveRole === "Staff";

  const actions: {
    label: string;
    description: string;
    icon: React.ElementType;
    onClick: () => void;
    visible: boolean;
    locked?: boolean;
    lockReason?: string;
  }[] = [];

  if (isStaff) {
    // Staff: task-focused minimal actions
    actions.push(
      { label: "Fill Log", description: "Record today's entries", icon: ClipboardList, onClick: () => navigate("/logs"), visible: can("logs", "create") },
      { label: "View HACCP", description: "Check your HACCP plan", icon: ShieldCheck, onClick: () => navigate("/haccp"), visible: canView("haccp_plan") },
    );
  } else if (isManagerLevel && !isOwnerLevel) {
    // Manager: operational actions
    actions.push(
      { label: "Add Logs", description: "Record new log entries", icon: ClipboardList, onClick: () => navigate("/logs"), visible: can("logs", "create") },
      { label: "Review HACCP", description: "Edit and manage HACCP plan", icon: ShieldCheck, onClick: () => navigate("/haccp"), visible: canView("haccp_plan") },
      { label: "Corrective Action", description: "Log a corrective action", icon: AlertTriangle, onClick: () => navigate("/logs"), visible: can("logs", "edit") },
      {
        label: "SOP Procedures",
        description: "Manage standard procedures",
        icon: BookOpen,
        onClick: () => navigate("/sop"),
        visible: canView("sop") || isModuleLocked(plan, "sop"),
        locked: isModuleLocked(plan, "sop"),
        lockReason: "Available in HACCP plan",
      },
    );
  } else if (isOwnerLevel) {
    // Owner: strategic + business control
    actions.push(
      { label: "Manage HACCP", description: "Full HACCP plan control", icon: ShieldCheck, onClick: () => navigate("/haccp"), visible: canView("haccp_plan") },
      {
        label: "Audit Ready",
        description: "Review audit readiness",
        icon: ClipboardCheck,
        onClick: () => navigate("/audit"),
        visible: (canView("audit") && showComplianceTools) || isModuleLocked(plan, "audit"),
        locked: isModuleLocked(plan, "audit"),
        lockReason: "Available in Compliance plan",
      },
      {
        label: "Documents",
        description: "Manage compliance docs",
        icon: FileText,
        onClick: () => navigate("/documents"),
        visible: (canView("documents") && canAccessDocuments) || isModuleLocked(plan, "documents"),
        locked: isModuleLocked(plan, "documents"),
        lockReason: "Available in Compliance plan",
      },
      { label: "Manage Team", description: "Users and roles", icon: Users, onClick: () => navigate("/settings"), visible: canView("settings") },
      { label: "Settings", description: "System configuration", icon: Settings, onClick: () => navigate("/settings"), visible: canView("settings") },
    );
  }

  const visibleActions = actions.filter((a) => a.visible);

  const handleClick = (action: typeof actions[0]) => {
    if (action.locked) {
      toast.info(action.lockReason || "This feature requires a plan upgrade", {
        action: {
          label: "Upgrade",
          onClick: () => navigate("/settings"),
        },
      });
      return;
    }
    action.onClick();
  };

  if (visibleActions.length === 0) return null;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Zap className="h-4 w-4 text-primary" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {visibleActions.map((action) => (
            <Button
              key={action.label}
              variant={action.locked ? "ghost" : "outline"}
              size="sm"
              onClick={() => handleClick(action)}
              className={`h-auto py-2.5 px-3 justify-start gap-2.5 ${action.locked ? "opacity-50" : ""}`}
            >
              <action.icon className="h-4 w-4 shrink-0" />
              <div className="text-left min-w-0">
                <div className="text-xs font-medium flex items-center gap-1">
                  {action.label}
                  {action.locked && <Lock className="h-3 w-3" />}
                </div>
                <div className="text-[10px] text-muted-foreground font-normal truncate">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActions;
