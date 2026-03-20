/**
 * Dedicated Super Admin Layout — completely separate from the user DashboardLayout.
 * Has its own sidebar, header, and styling.
 */
import React from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

interface Props {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: Props) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-muted/30">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border bg-background px-4 shrink-0">
            <SidebarTrigger className="mr-3" />
            <span className="text-xs font-medium text-muted-foreground tracking-wide uppercase">
              Super Admin Console
            </span>
          </header>
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
