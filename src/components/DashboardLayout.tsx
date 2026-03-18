import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AdminPlanSwitcher } from "@/components/AdminPlanSwitcher";
import { AdminPlanOverrideProvider } from "@/contexts/AdminPlanOverrideContext";

interface Props {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: Props) => {
  return (
    <AdminPlanOverrideProvider>
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
          <AppSidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <header className="h-12 flex items-center justify-between border-b border-border bg-card px-4 shrink-0">
              <SidebarTrigger />
              <AdminPlanSwitcher />
            </header>
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </SidebarProvider>
    </AdminPlanOverrideProvider>
  );
};

export default DashboardLayout;
