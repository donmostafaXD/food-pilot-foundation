/**
 * Admin UI & Messages page — upgrade messages and UI config.
 */
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, Settings } from "lucide-react";
import { useAdminUIConfig } from "@/hooks/useAdminUIConfig";
import UIControlTab from "@/components/admin/UIControlTab";
import RolesPermissionsTab from "@/components/admin/RolesPermissionsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, MessageSquare } from "lucide-react";

export default function AdminUI() {
  const uiConfig = useAdminUIConfig();

  if (uiConfig.loading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" /> UI & System Control
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Manage upgrade messages, role permissions view, and UI behavior.</p>
        </div>

        <Tabs defaultValue="messages" className="space-y-4">
          <TabsList>
            <TabsTrigger value="messages" className="text-xs gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" /> Upgrade Messages
            </TabsTrigger>
            <TabsTrigger value="roles" className="text-xs gap-1.5">
              <Shield className="w-3.5 h-3.5" /> Roles & Permissions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="messages">
            <UIControlTab configs={uiConfig.configs} onSave={uiConfig.refetch} />
          </TabsContent>

          <TabsContent value="roles">
            <RolesPermissionsTab />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
