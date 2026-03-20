import { useNavigate } from "react-router-dom";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { usePlan } from "@/hooks/usePlan";
import { isModuleLocked, type PlanModule } from "@/lib/plan-features";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardList,
  Plus,
  ShieldCheck,
  ClipboardCheck,
  FileText,
  Settings,
  BookOpen,
  Lock,
} from "lucide-react";
import { toast } from "sonner";

const QuickActions = () => {
  const navigate = useNavigate();
  const { can, canView, effectiveRole } = useRoleAccess();
  const { plan, canAccessSOP, canAccessDocuments, showComplianceTools } = usePlan();

  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const isManagerLevel = isOwnerLevel || effectiveRole === "Manager";

  const actions: {
    label: string;
    icon: React.ElementType;
    onClick: () => void;
    visible: boolean;
    locked?: boolean;
    lockReason?: string;
  }[] = [
    { label: "Fill Logs",             icon: ClipboardList, onClick: () => navigate("/logs"),      visible: can("logs", "create") },
    { label: "View HACCP",            icon: ShieldCheck,   onClick: () => navigate("/haccp"),     visible: canView("haccp_plan") && isManagerLevel },
    { label: "Add Corrective Action", icon: Plus,          onClick: () => navigate("/logs"),      visible: can("logs", "edit") && isManagerLevel },
    {
      label: "SOP Procedures",
      icon: BookOpen,
      onClick: () => navigate("/sop"),
      visible: canView("sop") || isModuleLocked(plan, "sop"),
      locked: isModuleLocked(plan, "sop"),
      lockReason: "Available in HACCP plan",
    },
    {
      label: "Audit Ready",
      icon: ClipboardCheck,
      onClick: () => navigate("/audit"),
      visible: (canView("audit") && showComplianceTools) || (isOwnerLevel && isModuleLocked(plan, "audit")),
      locked: isModuleLocked(plan, "audit"),
      lockReason: "Available in Compliance plan",
    },
    {
      label: "Documents",
      icon: FileText,
      onClick: () => navigate("/documents"),
      visible: (canView("documents") && canAccessDocuments) || (isOwnerLevel && isModuleLocked(plan, "documents")),
      locked: isModuleLocked(plan, "documents"),
      lockReason: "Available in Compliance plan",
    },
    { label: "Settings", icon: Settings, onClick: () => navigate("/settings"), visible: canView("settings") },
  ];

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

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {visibleActions.map((action) => (
          <Button
            key={action.label}
            variant={action.locked ? "ghost" : "outline"}
            size="sm"
            onClick={() => handleClick(action)}
            className={`gap-1.5 ${action.locked ? "opacity-50" : ""}`}
          >
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
            {action.locked && <Lock className="h-3 w-3 ml-0.5" />}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
