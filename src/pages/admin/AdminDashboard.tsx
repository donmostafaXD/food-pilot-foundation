/**
 * Super Admin Dashboard — global platform overview.
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, CreditCard, Activity, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Stats {
  totalOrgs: number;
  totalUsers: number;
  planBreakdown: Record<string, number>;
  recentOrgs: { id: string; name: string; plan: string; created_at: string }[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [orgsRes, profilesRes] = await Promise.all([
          supabase.from("organizations").select("id, name, subscription_plan, created_at").order("created_at", { ascending: false }),
          supabase.from("profiles").select("id"),
        ]);

        const orgs = orgsRes.data || [];
        const profiles = profilesRes.data || [];

        const planBreakdown: Record<string, number> = {};
        for (const org of orgs) {
          const plan = org.subscription_plan || "basic";
          planBreakdown[plan] = (planBreakdown[plan] || 0) + 1;
        }

        setStats({
          totalOrgs: orgs.length,
          totalUsers: profiles.length,
          planBreakdown,
          recentOrgs: orgs.slice(0, 5).map((o) => ({
            id: o.id,
            name: o.name,
            plan: o.subscription_plan || "basic",
            created_at: o.created_at,
          })),
        });
      } catch (err) {
        console.error("[AdminDash]", err);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  const planColors: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    basic: "outline",
    professional: "secondary",
    premium: "default",
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-xl font-bold text-foreground">Platform Overview</h1>
          <p className="text-sm text-muted-foreground mt-1">Global system statistics and activity.</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.totalOrgs || 0}</p>
                  <p className="text-xs text-muted-foreground">Organizations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground tabular-nums">{stats?.totalUsers || 0}</p>
                  <p className="text-xs text-muted-foreground">Total Users</p>
                </div>
              </div>
            </CardContent>
          </Card>
          {Object.entries(stats?.planBreakdown || {}).map(([plan, count]) => (
            <Card key={plan} className="shadow-sm">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground tabular-nums">{count}</p>
                    <p className="text-xs text-muted-foreground capitalize">{plan} Plan</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Recent Organizations */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Recent Organizations</CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.recentOrgs.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center">No organizations yet.</p>
            ) : (
              <div className="space-y-2">
                {stats?.recentOrgs.map((org) => (
                  <div key={org.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{org.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant={planColors[org.plan] || "outline"} className="text-[10px] capitalize shrink-0">
                      {org.plan}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
