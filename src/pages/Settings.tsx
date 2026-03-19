import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Wand2,
  CreditCard,
  Users,
  UserPlus,
  Check,
  Crown,
  Phone,
  Loader2,
  Settings as SettingsIcon,
  FileEdit,
  AlertTriangle,
  Building2,
  ArrowUpRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan, PLAN_CONFIG, PLAN_DISPLAY_NAMES, type PlanTier } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast as sonnerToast } from "sonner";
import { Link } from "react-router-dom";

// ── HACCP Plan Edit Section ──────────────────────────────────────────
const HACCPPlanSection = () => {
  const navigate = useNavigate();
  const { plan } = usePlan();
  const isBasic = plan === "basic";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">HACCP Plan</h2>
        <p className="text-sm text-muted-foreground mt-1">
          View and edit your current HACCP plan directly.
        </p>
      </div>

      <Card className="shadow-industrial-sm">
        <CardContent className="pt-6 pb-5 space-y-4">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-full bg-primary/10">
              <FileEdit className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Open HACCP Plan Editor</p>
              <p className="text-xs text-muted-foreground mt-1">
                View your full HACCP plan and make edits. Changes save immediately.
              </p>
            </div>
            <Button onClick={() => navigate("/haccp")} className="mt-2">
              <FileEdit className="w-4 h-4 mr-2" />
              Open HACCP Plan
            </Button>
          </div>

          {isBasic && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                Upgrade to unlock detailed risk analysis (Severity, Likelihood, Risk Score)
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// ── Change Activity Section ──────────────────────────────────────────
const ChangeActivitySection = () => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleStart = () => {
    if (showConfirm) {
      navigate("/setup");
    } else {
      setShowConfirm(true);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Change Activity</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start fresh — select a new activity type, answer setup questions, and generate a new HACCP plan.
        </p>
      </div>

      <Card className="shadow-industrial-sm">
        <CardContent className="pt-6 pb-5 space-y-4">
          <div className="flex flex-col items-center text-center gap-3">
            <div className="p-3 rounded-full bg-destructive/10">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Start New HACCP Setup</p>
              <p className="text-xs text-muted-foreground mt-1">
                This will run the full setup wizard from the beginning and generate a new HACCP plan.
              </p>
            </div>

            {showConfirm && (
              <div className="w-full p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium flex items-center justify-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  This will overwrite your current HACCP plan
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  All existing plan data, hazards, and edits will be replaced.
                </p>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <Button variant="destructive" onClick={handleStart}>
                <Wand2 className="w-4 h-4 mr-2" />
                {showConfirm ? "Confirm & Start Setup" : "Change Activity"}
              </Button>
              {showConfirm && (
                <Button variant="outline" onClick={() => setShowConfirm(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Business Profile Section ─────────────────────────────────────────
const BusinessProfileSection = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!profile?.organization_id) return;
    const load = async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", profile.organization_id!)
        .maybeSingle();
      if (data) {
        setOrgName(data.name || "");
        setCountry((data as any).country || "");
        setCity((data as any).city || "");
        setEmployeeCount((data as any).employee_count?.toString() || "");
        setDescription((data as any).description || "");
      }
      setLoading(false);
    };
    load();
  }, [profile?.organization_id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile?.organization_id) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: orgName,
        country,
        city,
        employee_count: employeeCount ? parseInt(employeeCount, 10) : null,
        description: description || null,
      } as any)
      .eq("id", profile.organization_id);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to save", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Business profile updated" });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Business Profile</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your business details used in reports, audit documents, and printed headers.
        </p>
      </div>

      <Card className="shadow-industrial-sm">
        <CardContent className="pt-5 pb-4">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label>Business Name</Label>
              <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. UAE" />
              </div>
              <div className="space-y-2">
                <Label>City / Location</Label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Dubai" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Number of Employees</Label>
              <Input type="number" min="1" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} placeholder="e.g. 15" />
            </div>
            <div className="space-y-2">
              <Label>Business Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your business" rows={3} className="resize-none" />
            </div>
            <Button type="submit" disabled={saving} size="sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              Save Changes
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

// ── Subscription Section ─────────────────────────────────────────────
const planTiers: { tier: PlanTier; features: string[] }[] = [
  {
    tier: "basic",
    features: [
      "Food Service activities",
      "Simplified HACCP view",
      "CCP / OPRP / PRP labels",
      "Critical limits & monitoring",
      "Basic logs (7 essential)",
      "1 branch, 1 activity",
    ],
  },
  {
    tier: "professional",
    features: [
      "Food Service + Manufacturing",
      "Full risk analysis (S × L)",
      "Dynamic CCP / OPRP logic",
      "Complete hazard library",
      "SOP & log management",
      "Up to 3 branches",
    ],
  },
  {
    tier: "premium",
    features: [
      "Everything in HACCP",
      "Internal audit tools",
      "Compliance tracking",
      "Full FSMS documentation",
      "PRP & SOP management",
      "Unlimited branches",
    ],
  },
];

const SubscriptionSection = () => {
  const { plan: currentPlan, loading, updatePlan } = usePlan();
  const [updating, setUpdating] = useState<PlanTier | null>(null);

  const handleSelect = async (tier: PlanTier) => {
    if (tier === currentPlan) return;
    setUpdating(tier);
    const { error } = await updatePlan(tier);
    setUpdating(null);
    if (error) {
      sonnerToast.error("Failed to update plan", { description: error.message });
    } else {
      sonnerToast.success(`Switched to ${PLAN_DISPLAY_NAMES[tier]} plan`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Subscription</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Your current plan and available upgrades.
        </p>
      </div>

      <Card className="shadow-industrial-sm border-primary/30 bg-primary/5">
        <CardContent className="flex items-center gap-3 pt-5 pb-4">
          <div className="p-2 rounded-lg bg-primary/10">
            <Crown className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Current Plan</p>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary mt-1" />
            ) : (
              <p className="text-sm font-semibold text-foreground">
                {PLAN_DISPLAY_NAMES[currentPlan]}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {planTiers.map((p) => {
            const isCurrent = p.tier === currentPlan;
            return (
              <Card key={p.tier} className={`flex flex-col shadow-industrial-sm ${isCurrent ? "ring-2 ring-primary/20 bg-primary/5" : ""}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{PLAN_DISPLAY_NAMES[p.tier]}</CardTitle>
                  <p className="text-xs text-muted-foreground">{PLAN_CONFIG[p.tier].description}</p>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col gap-4">
                  <ul className="space-y-1.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-xs text-foreground">
                        <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="space-y-2 mt-auto">
                    <Button
                      className="w-full"
                      size="sm"
                      variant={isCurrent ? "outline" : "default"}
                      disabled={isCurrent || updating !== null}
                      onClick={() => handleSelect(p.tier)}
                    >
                      {updating === p.tier && <Loader2 className="w-4 h-4 animate-spin mr-1" />}
                      {isCurrent ? "Current Plan" : `Select ${PLAN_DISPLAY_NAMES[p.tier]}`}
                    </Button>
                    {!isCurrent && (
                      <Button className="w-full" variant="ghost" size="sm" asChild>
                        <Link to="/contact">
                          <Phone className="w-3 h-3 mr-1" /> Contact Us
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Users Section ────────────────────────────────────────────────────
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

const UsersSection = () => {
  const { profile, hasRole } = useAuth();
  const { plan } = usePlan();
  const { toast } = useToast();

  const [users, setUsers] = useState<OrgUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loaded, setLoaded] = useState(false);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFullName, setInviteFullName] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("Staff");
  const [inviteBranch, setInviteBranch] = useState<string>("");
  const [inviting, setInviting] = useState(false);

  const canManage = hasRole("Owner") || hasRole("Manager");
  const isBasicPlan = plan === "basic";

  const roleOptions: AppRole[] = isBasicPlan
    ? ["Staff"]
    : ["Owner", "Manager", "QA", "Staff", "Auditor"];

  const loadData = async () => {
    if (!profile?.organization_id) return;

    const { data: branchData } = await supabase
      .from("branches")
      .select("id, name")
      .eq("organization_id", profile.organization_id);
    setBranches(branchData || []);
    if (branchData?.length && !inviteBranch) {
      setInviteBranch(branchData[0].id);
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("user_id, email, full_name, branch_id")
      .eq("organization_id", profile.organization_id);

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

  if (!loaded) {
    setLoaded(true);
    loadData();
  }

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
          role: isBasicPlan ? "Staff" : inviteRole,
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Users</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Add staff members and manage access to your organization.
        </p>
        {isBasicPlan && (
          <p className="text-xs text-muted-foreground mt-1 italic">
            On Basic plan, all staff are added with the Staff role. Owner has full management permissions.
          </p>
        )}
      </div>

      {canManage && (
        <Card className="shadow-industrial-sm">
          <CardContent className="pt-5 pb-4 space-y-4">
            <div className="flex items-center gap-2 text-primary">
              <UserPlus className="w-4 h-4" />
              <span className="text-sm font-semibold">Add Staff User</span>
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
              {!isBasicPlan && (
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
              )}
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
                <Button type="submit" disabled={inviting} size="sm">
                  <UserPlus className="w-4 h-4 mr-1" />
                  {inviting ? "Adding…" : "Add User"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-industrial-sm">
        <CardContent className="pt-5 pb-4 space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Users className="w-4 h-4" />
            <span className="text-sm font-semibold">Team Members</span>
          </div>
          {loadingUsers ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
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
        </CardContent>
      </Card>
    </div>
  );
};

// ── Main Settings Page ───────────────────────────────────────────────
const SettingsPage = () => {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <SettingsIcon className="w-5 h-5 text-muted-foreground" />
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Settings</h1>
        </div>

        <Tabs defaultValue="haccp-plan" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="haccp-plan" className="gap-1.5 text-xs sm:text-sm">
              <FileEdit className="w-4 h-4" />
              <span className="hidden sm:inline">HACCP Plan</span>
              <span className="sm:hidden">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="haccp-setup" className="gap-1.5 text-xs sm:text-sm">
              <Wand2 className="w-4 h-4" />
              <span className="hidden sm:inline">HACCP Setup</span>
              <span className="sm:hidden">Setup</span>
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-1.5 text-xs sm:text-sm">
              <Building2 className="w-4 h-4" />
              <span className="hidden sm:inline">Business</span>
              <span className="sm:hidden">Biz</span>
            </TabsTrigger>
            <TabsTrigger value="subscription" className="gap-1.5 text-xs sm:text-sm">
              <CreditCard className="w-4 h-4" />
              <span className="hidden sm:inline">Subscription</span>
              <span className="sm:hidden">Plan</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5 text-xs sm:text-sm">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Users</span>
              <span className="sm:hidden">Users</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="haccp-plan">
            <HACCPPlanSection />
          </TabsContent>

          <TabsContent value="haccp-setup">
            <HACCPSetupSection />
          </TabsContent>

          <TabsContent value="business">
            <BusinessProfileSection />
          </TabsContent>

          <TabsContent value="subscription">
            <SubscriptionSection />
          </TabsContent>

          <TabsContent value="users">
            <UsersSection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
