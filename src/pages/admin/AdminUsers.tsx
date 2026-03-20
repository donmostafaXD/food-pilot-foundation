/**
 * Admin Global User Management — view all users, change roles, etc.
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
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
import { Loader2, Search, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  organization_id: string | null;
  org_name?: string;
  roles: string[];
}

const ROLE_OPTIONS = ["Owner", "Manager", "QA", "Staff", "Auditor", "super_admin"];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, orgsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, organization_id"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("organizations").select("id, name"),
    ]);

    const profiles = profilesRes.data || [];
    const allRoles = rolesRes.data || [];
    const orgs = orgsRes.data || [];
    const orgMap = Object.fromEntries(orgs.map((o) => [o.id, o.name]));
    const roleMap: Record<string, string[]> = {};
    for (const r of allRoles) {
      if (!roleMap[r.user_id]) roleMap[r.user_id] = [];
      roleMap[r.user_id].push(r.role);
    }

    const list: UserRow[] = profiles.map((p) => ({
      user_id: p.user_id,
      full_name: p.full_name,
      email: p.email,
      organization_id: p.organization_id,
      org_name: p.organization_id ? orgMap[p.organization_id] : undefined,
      roles: roleMap[p.user_id] || [],
    }));

    setUsers(list);
    setFiltered(list);
    setLoading(false);
  };

  useEffect(() => { void fetchUsers(); }, []);

  useEffect(() => {
    if (!search.trim()) { setFiltered(users); return; }
    const q = search.toLowerCase();
    setFiltered(users.filter((u) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.org_name?.toLowerCase().includes(q)
    ));
  }, [search, users]);

  const changeRole = async (userId: string, currentRoles: string[], newRole: string) => {
    // Remove all non-super_admin roles, add new one
    const nonSuperRoles = currentRoles.filter((r) => r !== "super_admin");
    for (const r of nonSuperRoles) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", r as any);
    }
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role: newRole as any });
    if (error) {
      toast.error("Failed to change role");
    } else {
      toast.success("Role updated");
      await fetchUsers();
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
              <Users className="w-5 h-5 text-primary" />
              All Users
            </h1>
            <p className="text-sm text-muted-foreground mt-1">{users.length} total users</p>
          </div>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or org..."
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
                  <TableHead className="text-xs">User</TableHead>
                  <TableHead className="text-xs">Email</TableHead>
                  <TableHead className="text-xs">Organization</TableHead>
                  <TableHead className="text-xs">Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-sm text-muted-foreground py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u) => {
                    const primaryRole = u.roles.find((r) => r !== "super_admin") || "—";
                    const isSuperAdmin = u.roles.includes("super_admin");
                    return (
                      <TableRow key={u.user_id}>
                        <TableCell className="font-medium text-sm">
                          {u.full_name || "Unnamed"}
                          {isSuperAdmin && (
                            <Badge variant="destructive" className="ml-2 text-[9px] py-0">SA</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{u.email || "—"}</TableCell>
                        <TableCell className="text-xs">{u.org_name || "—"}</TableCell>
                        <TableCell>
                          <Select
                            value={primaryRole}
                            onValueChange={(v) => changeRole(u.user_id, u.roles, v)}
                          >
                            <SelectTrigger className="h-7 w-[110px] text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_OPTIONS.filter((r) => r !== "super_admin").map((r) => (
                                <SelectItem key={r} value={r} className="text-xs">{r}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
