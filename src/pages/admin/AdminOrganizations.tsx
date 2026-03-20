/**
 * Admin Organization Management — view/edit all orgs, change plans, etc.
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Search, Save, Building2 } from "lucide-react";
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
}

export default function AdminOrganizations() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [filtered, setFiltered] = useState<Org[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchOrgs = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("organizations")
      .select("*")
      .order("created_at", { ascending: false });
    const list = (data || []) as Org[];
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
    }
    setSavingId(null);
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
                  <TableHead className="text-xs">Employees</TableHead>
                  <TableHead className="text-xs">Plan</TableHead>
                  <TableHead className="text-xs">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
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
                      <TableCell className="text-xs tabular-nums">{org.employee_count || "—"}</TableCell>
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
