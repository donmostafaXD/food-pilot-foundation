import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AdminPlanSwitcher } from "@/components/AdminPlanSwitcher";
import { PreviewBanner } from "@/components/PreviewBanner";
import { DemoBanner } from "@/components/DemoBanner";
import { ActivitySwitcher } from "@/components/ActivitySwitcher";

interface Props {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: Props) => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <PreviewBanner />
          <DemoBanner />
          <header className="h-12 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <ActivitySwitcher />
            </div>
            <AdminPlanSwitcher />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
