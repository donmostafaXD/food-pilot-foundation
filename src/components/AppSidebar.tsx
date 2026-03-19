import {
  LayoutDashboard,
  ShieldCheck,
  Settings,
  LogOut,
  ClipboardList,
  Shield,
  BookOpen,
  Wrench,
  FileText,
  Crown,
  ClipboardCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  visible?: boolean;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, profile, roles } = useAuth();
  const { overrideRole } = useAdminPlanOverride();
  const isSuperAdmin = roles.includes("super_admin" as any);
  const {
    canAccessSOP,
    canAccessPRP,
    canAccessDocuments,
    canAccessEquipment,
    loading: planLoading,
  } = usePlan();
  const {
    canAccessSettings,
    canAccessAudit,
    canAccessPRPEdit,
    canAccessSOPEdit,
    effectiveRole,
  } = useRoleAccess();

  const isActive = (path: string) => location.pathname === path;

  // Staff restriction: real Staff role OR preview Staff
  const isStaffRestricted = effectiveRole === "Staff";

  const { plan } = usePlan();
  const showDocuments = !isStaffRestricted && !planLoading && canAccessDocuments && plan === "premium";
  const showEquipment = !isStaffRestricted; // Equipment visible for ALL plans

  const mainItems: NavItem[] = [
    { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
    { title: "HACCP Plan", url: "/haccp", icon: ShieldCheck },
    { title: "Logs", url: "/logs", icon: ClipboardList },
    { title: "PRP Programs", url: "/prp", icon: Shield, visible: !isStaffRestricted && !planLoading && canAccessPRP },
    { title: "SOP Procedures", url: "/sop", icon: BookOpen, visible: !isStaffRestricted && !planLoading && canAccessSOP },
    { title: "Equipment", url: "/equipment", icon: Wrench, visible: showEquipment },
    { title: "Documents", url: "/documents", icon: FileText, visible: showDocuments },
    { title: "Audit Ready", url: "/audit", icon: ClipboardCheck, visible: effectiveRole === "Owner" || effectiveRole === "super_admin" },
    { title: "Settings", url: "/settings", icon: Settings, visible: canAccessSettings },
  ];

  const visibleItems = mainItems.filter((item) => item.visible === undefined || item.visible);

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          {!collapsed ? (
            <div>
              <h2 className="text-base font-bold tracking-tight text-sidebar-foreground">
                FoodPilot
              </h2>
              {profile?.full_name && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {profile.full_name}
                </p>
              )}
              {isSuperAdmin && !overrideRole && (
                <Badge variant="destructive" className="mt-1 text-[10px] gap-1 px-1.5 py-0">
                  <Crown className="h-3 w-3" /> Super Admin
                </Badge>
              )}
              {overrideRole && (
                <Badge variant="secondary" className="mt-1 text-[10px] gap-1 px-1.5 py-0">
                  Preview: {overrideRole}
                </Badge>
              )}
              {!isSuperAdmin && !overrideRole && effectiveRole && (
                <Badge variant="outline" className="mt-1 text-[10px] gap-1 px-1.5 py-0">
                  {effectiveRole}
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex justify-center">
              <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                  >
                    <NavLink
                      to={item.url}
                      end
                      className="flex items-center gap-2"
                      activeClassName="bg-sidebar-accent text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-3">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
