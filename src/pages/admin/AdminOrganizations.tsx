/**
 * Admin Organization Management — view/edit all orgs, change plans, delete.
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, Search, Building2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Org {
  id: string;
  name: string;
  subscription_plan: string | null;
  owner_id: string | null;
  country: string | null;
  city: string | null;
  employee_count: number | null;
  created_at: string;
  userCount?: number;
}

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [filtered, setFiltered] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    const [orgsRes, profilesRes] = await Promise.all([
      supabase.from("organizations").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("organization_id"),
    ]);

    const orgData = (orgsRes.data || []) as Org[];
    const profiles = profilesRes.data || [];

    // Count users per org
    const userCounts: Record<string, number> = {};
    for (const p of profiles) {
      if (p.organization_id) {
        userCounts[p.organization_id] = (userCounts[p.organization_id] || 0) + 1;
      }
    }

    const list = orgData.map((o) => ({ ...o, userCount: userCounts[o.id] || 0 }));
    setOrgs(list);
    setFiltered(list);
    setLoading(false);
  };

  useEffect(() => { void fetchOrgs(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(orgs); return; }
    const q = search.toLowerCase();
    setFiltered(orgs.filter((o) => o.name.toLowerCase().includes(q) || o.country?.toLowerCase().includes(q)));
  }, [search, orgs]);

  const changePlan = async (orgId: string, newPlan: string) => {
    setSavingId(orgId);
    const { error } = await supabase
      .from("organizations")
      .update({ subscription_plan: newPlan })
      .eq("id", orgId);

    if (error) toast.error("Failed to update plan");
    else {
      toast.success("Plan updated");
      setOrgs((prev) => prev.map((o) => o.id === orgId ? { ...o, subscription_plan: newPlan } : o));
      setFiltered((prev) => prev.map((o) => o.id === orgId ? { ...o, subscription_plan: newPlan } : o));
    }
    setSavingId(null);
  };

  const handleDeleteOrg = async (orgId: string, orgName: string) => {
    setDeletingId(orgId);
    try {
      const res = await supabase.functions.invoke("manage-users", {
        body: {
          action: "delete_organization",
          target_org_id: orgId,
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to delete organization");
      }

      toast.success(`Organization "${orgName}" deleted`);
      await fetchOrgs();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete organization");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Organizations
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{orgs.length} total organizations</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or country..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
            />
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Organization</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-xs">Users</TableHead>
                  <TableHead className="text-xs">Plan</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                  <TableHead className="text-xs w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No organizations found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium text-sm">{org.name}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {[org.city, org.country].filter(Boolean).join(", ") || "—"}
                      </TableCell>
                      <TableCell className="text-xs tabular-nums">{org.userCount}</TableCell>
                      <TableCell>
                        <Select
                          value={org.subscription_plan || "basic"}
                          onValueChange={(v) => changePlan(org.id, v)}
                          disabled={savingId === org.id}
                        >
                          <SelectTrigger className="h-7 w-[120px] text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="basic" className="text-xs">Basic</SelectItem>
                            <SelectItem value="professional" className="text-xs">Professional</SelectItem>
                            <SelectItem value="premium" className="text-xs">Premium</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              disabled={deletingId === org.id}
                            >
                              {deletingId === org.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete <strong>{org.name}</strong>?
                                This will delete all users ({org.userCount}) and data associated with this organization.
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={() => handleDeleteOrg(org.id, org.name)}
                              >
                                Delete Organization
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
