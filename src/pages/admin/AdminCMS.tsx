/**
 * Admin CMS page — website content editor.
 */
import AdminLayout from "@/components/admin/AdminLayout";
import { Loader2, Globe } from "lucide-react";
import { useAdminCMS } from "@/hooks/useAdminCMS";
import WebsiteContentTab from "@/components/admin/WebsiteContentTab";

export default function AdminCMS() {
  const cms = useAdminCMS();

  if (cms.loading) {
    return <AdminLayout><div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div></AdminLayout>;
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5 text-primary" /> Website CMS
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Edit landing page content, show/hide sections.</p>
        </div>
        <WebsiteContentTab sections={cms.sections} onSave={() => window.location.reload()} />
      </div>
    </AdminLayout>
  );
}
