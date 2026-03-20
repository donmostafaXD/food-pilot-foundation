/**
 * Admin tab for viewing the RBAC permission matrix.
 * Read-only display — permissions are defined in code (lib/permissions.ts).
 * Admin can see exactly what each role can do.
 */
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, Shield } from "lucide-react";
import type { AppRole, AppModule, PermissionAction } from "@/lib/permissions";
import { hasPermission } from "@/lib/permissions";

const ROLES: AppRole[] = ["Owner", "Manager", "QA", "Staff", "Auditor"];
const MODULES: { key: AppModule; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "haccp_plan", label: "HACCP Plan" },
  { key: "logs", label: "Logs" },
  { key: "prp", label: "PRP Programs" },
  { key: "sop", label: "SOP Procedures" },
  { key: "equipment", label: "Equipment" },
  { key: "audit", label: "Audit Ready" },
  { key: "documents", label: "Documents" },
  { key: "settings", label: "Settings" },
  { key: "users", label: "User Management" },
];
const ACTIONS: PermissionAction[] = ["view", "create", "edit", "delete", "export"];

export default function RolesPermissionsTab() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-muted-foreground">
          Permission matrix showing what each role can do across modules. Permissions are enforced system-wide.
        </p>
      </div>

      {ROLES.map((role) => (
        <Card key={role} className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              {role}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left p-2 font-medium text-muted-foreground w-[140px]">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a} className="text-center p-2 font-medium text-muted-foreground capitalize w-[70px]">{a}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((mod) => (
                    <tr key={mod.key} className="border-b last:border-0">
                      <td className="p-2 font-medium">{mod.label}</td>
                      {ACTIONS.map((action) => {
                        const allowed = hasPermission(role, mod.key, action);
                        return (
                          <td key={action} className="p-2 text-center">
                            {allowed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mx-auto" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-muted-foreground/30 mx-auto" />
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
