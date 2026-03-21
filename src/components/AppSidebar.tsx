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
  Layers,
  Briefcase,
  ShieldAlert,
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
  visible: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, profile } = useAuth();
  const { overrideRole } = useAdminPlanOverride();
  const { plan } = usePlan();
  const { effectiveRole, isRealSuperAdmin, isPreviewMode, sidebar, isNoOverrideMode } = useRoleAccess();

  const isActive = (path: string) => location.pathname === path;

  // Grouped navigation — no plan-based locking
  const groups: NavGroup[] = [
    {
      label: "Core",
      icon: Layers,
      items: [
        { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard, visible: sidebar.dashboard },
        { title: "HACCP Plan", url: "/haccp", icon: ShieldCheck, visible: sidebar.haccp },
        { title: "Logs", url: "/logs", icon: ClipboardList, visible: sidebar.logs },
      ],
    },
    {
      label: "Operations",
      icon: Briefcase,
      items: [
        { title: "PRP Programs", url: "/prp", icon: Shield, visible: sidebar.prp },
        { title: "SOP Procedures", url: "/sop", icon: BookOpen, visible: sidebar.sop },
        { title: "Equipment", url: "/equipment", icon: Wrench, visible: sidebar.equipment },
      ],
    },
    {
      label: "Compliance",
      icon: ShieldAlert,
      items: [
        { title: "Audit Ready", url: "/audit", icon: ClipboardCheck, visible: sidebar.audit },
        { title: "Documents", url: "/documents", icon: FileText, visible: sidebar.documents },
      ],
    },
    {
      label: "Admin",
      icon: Settings,
      items: [
        { title: "Settings", url: "/settings", icon: Settings, visible: sidebar.settings },
        { title: "Control Panel", url: "/admin", icon: Crown, visible: isRealSuperAdmin },
      ],
    },
  ];

  const renderItem = (item: NavItem) => (
    <SidebarMenuItem key={item.title}>
      <SidebarMenuButton asChild isActive={isActive(item.url)}>
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
  );

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          {!collapsed ? (
            <div>
              <a href="/" className="text-base font-bold tracking-tight text-sidebar-foreground hover:text-primary transition-colors">
                FoodPilot
              </a>
              {profile?.full_name && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">
                  {profile.full_name}
                </p>
              )}
              {isRealSuperAdmin && !isPreviewMode && (
                <Badge variant="destructive" className="mt-1 text-[10px] gap-1 px-1.5 py-0">
                  <Crown className="h-3 w-3" /> Super Admin
                </Badge>
              )}
              {isPreviewMode && (
                <Badge variant="secondary" className="mt-1 text-[10px] gap-1 px-1.5 py-0 border-warning/40 text-warning bg-warning/10">
                  Preview: {overrideRole}
                </Badge>
              )}
              {!isRealSuperAdmin && !isPreviewMode && effectiveRole && (
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

        {/* Grouped Navigation */}
        {groups.map((group) => {
          const visibleItems = group.items.filter((i) => i.visible);
          if (visibleItems.length === 0) return null;

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {visibleItems.map(renderItem)}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
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
