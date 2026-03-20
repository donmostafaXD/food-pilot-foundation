/**
 * Admin Global User Management — view all users, add, change roles, delete.
 */
import { useState, useEffect } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { Loader2, Search, Users, Plus, Trash2, Copy } from "lucide-react";
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

interface OrgOption {
  id: string;
  name: string;
}

const ROLE_OPTIONS = ["Owner", "Manager", "QA", "Staff", "Auditor", "super_admin"];

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [filtered, setFiltered] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [orgs, setOrgs] = useState<OrgOption[]>([]);

  // Add user form
  const [addOpen, setAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addRole, setAddRole] = useState("Staff");
  const [addOrgId, setAddOrgId] = useState("");
  const [adding, setAdding] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    const [profilesRes, rolesRes, orgsRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, email, organization_id"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("organizations").select("id, name"),
    ]);

    const profiles = profilesRes.data || [];
    const allRoles = rolesRes.data || [];
    const orgsList = (orgsRes.data || []) as OrgOption[];
    setOrgs(orgsList);

    const orgMap = Object.fromEntries(orgsList.map((o) => [o.id, o.name]));
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

  const handleAddUser = async () => {
    if (!addEmail.trim()) { toast.error("Email is required"); return; }
    setAdding(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke("manage-users", {
        body: {
          action: "invite",
          email: addEmail.trim(),
          full_name: addName.trim() || null,
          role: addRole,
          organization_id: addOrgId || null,
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to add user");
      }

      setTempPassword(res.data.temp_password);
      toast.success("User created successfully");
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to add user");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    try {
      const res = await supabase.functions.invoke("manage-users", {
        body: {
          action: "remove",
          user_id: userId,
          organization_id: "admin", // super admin bypass
        },
      });

      if (res.error || res.data?.error) {
        throw new Error(res.data?.error || res.error?.message || "Failed to delete user");
      }

      toast.success(`User "${userName}" deleted`);
      await fetchUsers();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete user");
    }
  };

  const resetAddForm = () => {
    setAddEmail("");
    setAddName("");
    setAddRole("Staff");
    setAddOrgId("");
    setTempPassword(null);
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
          <div className="flex items-center gap-3">
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or org..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            {/* Add User Dialog */}
            <Dialog open={addOpen} onOpenChange={(open) => { setAddOpen(open); if (!open) resetAddForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1.5">
                  <Plus className="w-4 h-4" /> Add User
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New User</DialogTitle>
                  <DialogDescription>Create a new user account. A temporary password will be generated.</DialogDescription>
                </DialogHeader>

                {tempPassword ? (
                  <div className="space-y-4 py-2">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-2">
                      <p className="text-sm font-medium text-foreground">✅ User created successfully!</p>
                      <div>
                        <Label className="text-xs text-muted-foreground">Temporary Password</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <code className="flex-1 p-2 rounded bg-muted text-sm font-mono select-all">{tempPassword}</code>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => { navigator.clipboard.writeText(tempPassword); toast.success("Password copied"); }}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Share this password with the user. They should change it after first login.</p>
                    </div>
                    <DialogFooter>
                      <Button onClick={() => { setAddOpen(false); resetAddForm(); }}>Done</Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <div className="space-y-4 py-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Email *</Label>
                      <Input value={addEmail} onChange={(e) => setAddEmail(e.target.value)} placeholder="user@example.com" className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Full Name</Label>
                      <Input value={addName} onChange={(e) => setAddName(e.target.value)} placeholder="John Doe" className="h-9" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Role</Label>
                        <Select value={addRole} onValueChange={setAddRole}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((r) => (
                              <SelectItem key={r} value={r} className="text-sm">{r}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Organization</Label>
                        <Select value={addOrgId} onValueChange={setAddOrgId}>
                          <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select org..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none" className="text-sm text-muted-foreground">No organization</SelectItem>
                            {orgs.map((o) => (
                              <SelectItem key={o.id} value={o.id} className="text-sm">{o.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => { setAddOpen(false); resetAddForm(); }}>Cancel</Button>
                      <Button onClick={handleAddUser} disabled={adding}>
                        {adding && <Loader2 className="w-4 h-4 animate-spin mr-1.5" />}
                        Create User
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
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
                  <TableHead className="text-xs w-[60px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
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
                        <TableCell>
                          {!isSuperAdmin && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete <strong>{u.full_name || u.email}</strong>? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleDeleteUser(u.user_id, u.full_name || u.email || "User")}
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
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
