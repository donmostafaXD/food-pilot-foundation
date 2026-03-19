import { useNavigate } from "react-router-dom";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { usePlan } from "@/hooks/usePlan";
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
} from "lucide-react";

const QuickActions = () => {
  const navigate = useNavigate();
  const { effectiveRole, canAccessSettings, canAccessAudit } = useRoleAccess();
  const { canAccessSOP, canAccessDocuments, showComplianceTools } = usePlan();

  const isStaff = effectiveRole === "Staff";
  const isOwnerLevel = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const isManagerLevel = isOwnerLevel || effectiveRole === "Manager";

  const actions: { label: string; icon: React.ElementType; onClick: () => void; visible: boolean }[] = [
    { label: "Fill Logs", icon: ClipboardList, onClick: () => navigate("/logs"), visible: true },
    { label: "View HACCP", icon: ShieldCheck, onClick: () => navigate("/haccp"), visible: !isStaff },
    { label: "Add Corrective Action", icon: Plus, onClick: () => navigate("/logs"), visible: isManagerLevel },
    { label: "SOP Procedures", icon: BookOpen, onClick: () => navigate("/sop"), visible: isManagerLevel && canAccessSOP },
    { label: "Audit Ready", icon: ClipboardCheck, onClick: () => navigate("/audit"), visible: isOwnerLevel && showComplianceTools && canAccessAudit },
    { label: "Documents", icon: FileText, onClick: () => navigate("/documents"), visible: isOwnerLevel && canAccessDocuments },
    { label: "Settings", icon: Settings, onClick: () => navigate("/settings"), visible: canAccessSettings },
  ];

  const visibleActions = actions.filter((a) => a.visible);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {visibleActions.map((action) => (
          <Button
            key={action.label}
            variant="outline"
            size="sm"
            onClick={action.onClick}
            className="gap-1.5"
          >
            <action.icon className="h-3.5 w-3.5" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default QuickActions;
