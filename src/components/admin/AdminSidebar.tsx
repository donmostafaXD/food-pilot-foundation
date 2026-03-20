/**
 * Admin-specific sidebar — completely separate from AppSidebar.
 */
import {
  LayoutDashboard,
  Building2,
  Users,
  Layers,
  Globe,
  Image,
  Settings,
  LogOut,
  Crown,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
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
import { useLocation } from "react-router-dom";

const NAV_ITEMS = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Organizations", url: "/admin/organizations", icon: Building2 },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Plans & Pricing", url: "/admin/plans", icon: Layers },
  { title: "Feature Access", url: "/admin/access", icon: Shield },
  { title: "Website CMS", url: "/admin/cms", icon: Globe },
  { title: "UI & Messages", url: "/admin/ui", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const { signOut, profile } = useAuth();

  const isActive = (path: string) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Brand */}
        <div className="px-4 py-5 border-b border-sidebar-border">
          {!collapsed ? (
            <div>
              <h2 className="text-base font-bold tracking-tight text-sidebar-foreground flex items-center gap-2">
                <Crown className="w-4 h-4 text-primary" />
                FoodPilot Admin
              </h2>
              {profile?.full_name && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{profile.full_name}</p>
              )}
              <Badge variant="destructive" className="mt-1 text-[10px] gap-1 px-1.5 py-0">
                Super Admin
              </Badge>
            </div>
          ) : (
            <div className="flex justify-center">
              <Crown className="w-5 h-5 text-primary" />
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive(item.url)}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
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

      <SidebarFooter className="border-t border-sidebar-border p-3 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-muted-foreground"
          asChild
        >
          <NavLink to="/dashboard">
            <LayoutDashboard className="h-4 w-4 shrink-0" />
            {!collapsed && <span>User Dashboard</span>}
          </NavLink>
        </Button>
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
