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
  Lock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NavLink } from "@/components/NavLink";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import { isModuleLocked, type PlanModule } from "@/lib/plan-features";
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
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "sonner";

interface NavItem {
  title: string;
  url: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Role-based visibility */
  visible: boolean;
  /** Plan-based lock (shown but disabled) */
  locked: boolean;
  /** Tooltip when locked */
  lockReason?: string;
  /** Plan module key for gating */
  planModule?: PlanModule;
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile } = useAuth();
  const { overrideRole } = useAdminPlanOverride();
  const {
    plan,
    loading: planLoading,
  } = usePlan();
  const {
    effectiveRole,
    isRealSuperAdmin,
    isPreviewMode,
    sidebar,
  } = useRoleAccess();

  const isActive = (path: string) => location.pathname === path;

  // Determine if module is locked by plan
  const planLocked = (mod: PlanModule) => {
    if (isRealSuperAdmin && !isPreviewMode) return false;
    if (planLoading) return false;
    return isModuleLocked(plan, mod);
  };

  // Sidebar items — role controls visibility, plan controls lock state
  const mainItems: NavItem[] = [
    { title: "Dashboard",      url: "/dashboard",  icon: LayoutDashboard, visible: sidebar.dashboard, locked: false },
    { title: "HACCP Plan",     url: "/haccp",       icon: ShieldCheck,     visible: sidebar.haccp,     locked: false },
    { title: "Logs",           url: "/logs",        icon: ClipboardList,   visible: sidebar.logs,      locked: false },
    { title: "PRP Programs",   url: "/prp",         icon: Shield,          visible: sidebar.prp || planLocked("prp"),   locked: planLocked("prp"),   lockReason: "Available in HACCP plan", planModule: "prp" },
    { title: "SOP Procedures", url: "/sop",         icon: BookOpen,        visible: sidebar.sop || planLocked("sop"),   locked: planLocked("sop"),   lockReason: "Available in HACCP plan", planModule: "sop" },
    { title: "Equipment",      url: "/equipment",   icon: Wrench,          visible: sidebar.equipment || planLocked("equipment"), locked: planLocked("equipment"), lockReason: "Available in HACCP plan", planModule: "equipment" },
    { title: "Audit Ready",    url: "/audit",       icon: ClipboardCheck,  visible: sidebar.audit || planLocked("audit"),     locked: planLocked("audit"),     lockReason: "Available in Compliance plan", planModule: "audit" },
    { title: "Documents",      url: "/documents",   icon: FileText,        visible: sidebar.documents || planLocked("documents"), locked: planLocked("documents"), lockReason: "Available in Compliance plan", planModule: "documents" },
    { title: "Settings",       url: "/settings",    icon: Settings,        visible: sidebar.settings, locked: false },
  ];

  const visibleItems = mainItems.filter((item) => item.visible);

  const handleLockedClick = (item: NavItem) => {
    toast.info(item.lockReason || "This feature requires a plan upgrade", {
      action: {
        label: "Upgrade",
        onClick: () => navigate("/settings"),
      },
    });
  };

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
              {isRealSuperAdmin && !isPreviewMode && (
                <Badge variant="destructive" className="mt-1 text-[10px] gap-1 px-1.5 py-0">
                  <Crown className="h-3 w-3" /> Super Admin
                </Badge>
              )}
              {isPreviewMode && (
                <Badge variant="secondary" className="mt-1 text-[10px] gap-1 px-1.5 py-0">
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

        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visibleItems.map((item) => {
                if (item.locked) {
                  // Locked item — show with lock icon, tooltip, click shows upgrade toast
                  const content = (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        onClick={() => handleLockedClick(item)}
                        className="opacity-50 cursor-not-allowed"
                      >
                        <div className="flex items-center gap-2 w-full">
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && (
                            <>
                              <span className="flex-1">{item.title}</span>
                              <Lock className="h-3 w-3 text-muted-foreground shrink-0" />
                            </>
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );

                  if (collapsed) {
                    return (
                      <Tooltip key={item.title}>
                        <TooltipTrigger asChild>{content}</TooltipTrigger>
                        <TooltipContent side="right">
                          <p className="text-xs">{item.lockReason}</p>
                        </TooltipContent>
                      </Tooltip>
                    );
                  }

                  return content;
                }

                // Normal unlocked item
                return (
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
                );
              })}
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
