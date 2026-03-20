import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, ArrowLeft, UserPlus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type AppRole = "Owner" | "Manager" | "QA" | "Staff" | "Auditor";

interface OrgUser {
  user_id: string;
  email: string | null;
  full_name: string | null;
  branch_id: string | null;
  roles: AppRole[];
}

interface Branch {
  id: string;
  name: string;
}

const UserManagement = () => {
  const { profile, hasRole } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("Staff");
  const [inviteBranch, setInviteBranch] = useState<string>("");
  const [inviting, setInviting] = useState(false);

  const canManage = hasRole("Owner") || hasRole("Manager");

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile?.organization_id) return;

    // Load branches
    const { data: branchData } = await supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", profile.organization_id);
    setBranches(branchData || []);
    if (branchData?.length && !inviteBranch) {
      setInviteBranch(branchData[0].id);
    }

    // Load profiles in org
    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, branch_id")
      .eq("organization_id", profile.organization_id);

    // Load roles for those users
    const userIds = (profileData || []).map((p) => p.user_id);
    const { data: rolesData } = await supabase
      .from("user_roles")
      .select("user_id, role")
      .in("user_id", userIds);

    const roleMap = new Map<string, AppRole[]>();
    (rolesData || []).forEach((r) => {
      const existing = roleMap.get(r.user_id) || [];
      existing.push(r.role as AppRole);
      roleMap.set(r.user_id, existing);
    });

    setUsers(
      (profileData || []).map((p) => ({
        ...p,
        roles: roleMap.get(p.user_id) || [],
      }))
    );
    setLoadingUsers(false);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManage) return;
    setInviting(true);

    try {
      const { data, error } = await supabase.functions.invoke("manage-users", {
        body: {
          action: "invite",
          email: inviteEmail,
          full_name: inviteFullName,
          role: inviteRole,
          branch_id: inviteBranch,
          organization_id: profile!.organization_id,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "User invited", description: `${inviteEmail} has been added.` });
      setInviteEmail("");
      setInviteFullName("");
      setInviteRole("Staff");
      await loadData();
    } catch (err: any) {
      toast({ title: "Failed to invite user", description: err.message, variant: "destructive" });
    }
    setInviting(false);
  };

  const roleOptions: AppRole[] = ["Owner", "Manager", "QA", "Staff", "Auditor"];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight font-display text-foreground">FoodPilot</h1>
              <p className="text-xs text-muted-foreground">User Management</p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Add User Form */}
        {canManage && (
          <div className="bg-card shadow-md rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-semibold font-display">Add User</span>
            </div>
            <form onSubmit={handleInvite} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} required placeholder="user@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={inviteFullName} onChange={(e) => setInviteFullName(e.target.value)} required placeholder="Jane Doe" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {roleOptions.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={inviteBranch} onValueChange={setInviteBranch}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Button type="submit" disabled={inviting}>
                  <UserPlus className="w-4 h-4 mr-1" />
                  {inviting ? "Adding…" : "Add User"}
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* User list */}
        <div className="bg-card shadow-md rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold font-display">Team Members</span>
          </div>
          {loadingUsers ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : users.length === 0 ? (
            <p className="text-sm text-muted-foreground">No team members yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 text-xs font-medium text-muted-foreground uppercase">Name</th>
                    <th className="py-2 pr-4 text-xs font-medium text-muted-foreground uppercase">Email</th>
                    <th className="py-2 pr-4 text-xs font-medium text-muted-foreground uppercase">Roles</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.user_id} className="border-b border-border last:border-0">
                      <td className="py-3 pr-4 text-foreground">{u.full_name || "—"}</td>
                      <td className="py-3 pr-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 pr-4">
                        <div className="flex gap-1 flex-wrap">
                          {u.roles.map((r) => (
                            <span key={r} className="text-xs px-2 py-0.5 rounded bg-secondary text-secondary-foreground">
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default UserManagement;
