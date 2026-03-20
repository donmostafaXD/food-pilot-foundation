import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useActivity } from "@/contexts/ActivityContext";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import { openPrintWindow, escapeHtml } from "@/lib/printUtils";

import {
  ShieldCheck,
  ClipboardList,
  BookOpen,
  Shield,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Printer,
  Download,
  Eye,
  ArrowRight,
  BarChart3,
  AlertCircle,
} from "lucide-react";

interface ModuleStatus {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  status: "complete" | "partial" | "missing";
  count: number;
  detail: string;
}

/** Logs allowed on Basic plan */
const BASIC_ALLOWED_LOGS = new Set([
  "Receiving Log",
  "Cold Storage Log",
  "Cooking Temperature Log",
  "Hot Holding Log",
  "Cleaning Log",
  "Pest Control Log",
  "Training Log",
]);

const AuditReady = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { plan, showRiskFields, showComplianceTools, canAccessSOP, canAccessPRP, loading: planLoading } = usePlan();
  const { effectiveRole } = useRoleAccess();
  const { activeActivityId, activeActivity } = useActivity();
  const printHeader = usePrintHeader("Audit Ready Report");
  const isBasicPlan = plan === "basic";
  const isOwner = effectiveRole === "Owner" || effectiveRole === "super_admin";

  const [modules, setModules] = useState<ModuleStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [missingItems, setMissingItems] = useState<string[]>([]);

  // Track log names for the report
  const [availableLogNames, setAvailableLogNames] = useState<string[]>([]);

  useEffect(() => {
    if (planLoading || !profile?.organization_id || !profile?.branch_id) return;
    if (!isOwner) return;
    fetchAuditData();
  }, [planLoading, profile?.organization_id, profile?.branch_id, activeActivityId]);

  const fetchAuditData = async () => {
    setLoading(true);
    const orgId = profile!.organization_id!;
    const branchId = profile!.branch_id!;
    const missing: string[] = [];
    const statuses: ModuleStatus[] = [];

    // 1. HACCP Plan
    const { data: haccpPlans } = await supabase
      .from("haccp_plans")
      .select("id, status")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId);

    const haccpCount = haccpPlans?.length ?? 0;
    const haccpComplete = haccpPlans?.some((p) => p.status === "active") ?? false;
    statuses.push({
      name: "HACCP Plan",
      icon: ShieldCheck,
      status: haccpComplete ? "complete" : haccpCount > 0 ? "partial" : "missing",
      count: haccpCount,
      detail: haccpComplete ? "Active plan found" : haccpCount > 0 ? "Plan in draft" : "No plan created",
    });
    if (!haccpComplete) missing.push("HACCP Plan not active or missing");

    // 2. Hazard Analysis
    if (showRiskFields) {
      const { data: hazards } = await supabase
        .from("haccp_plan_hazards")
        .select("id, haccp_plan_step_id")
        .limit(500);
      const hazardCount = hazards?.length ?? 0;
      statuses.push({
        name: "Hazard Analysis",
        icon: AlertTriangle,
        status: hazardCount > 0 ? "complete" : "missing",
        count: hazardCount,
        detail: hazardCount > 0 ? `${hazardCount} hazards documented` : "No hazards documented",
      });
      if (hazardCount === 0) missing.push("Hazard analysis not completed");
    }

    // 3. Monitoring Logs — include custom logs
    // Get available log names (system + custom)
    const logNamesSet = new Set<string>();

    // System logs
    const { data: sysLogs } = await supabase.from("logs_structure").select("log_name");
    if (sysLogs) {
      sysLogs.forEach(l => {
        if (isBasicPlan) {
          if (BASIC_ALLOWED_LOGS.has(l.log_name)) logNamesSet.add(l.log_name);
        } else {
          logNamesSet.add(l.log_name);
        }
      });
    }

    // Custom logs
    const { data: customLogs } = await supabase
      .from("custom_log_structures" as any)
      .select("log_name")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId);
    if (customLogs) {
      (customLogs as any[]).forEach(l => logNamesSet.add(l.log_name));
    }

    const logNamesList = [...logNamesSet].sort();
    setAvailableLogNames(logNamesList);

    const { data: logEntries } = await supabase
      .from("log_entries")
      .select("id")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId)
      .limit(500);
    const logCount = logEntries?.length ?? 0;
    statuses.push({
      name: "Monitoring Logs",
      icon: ClipboardList,
      status: logCount >= 10 ? "complete" : logCount > 0 ? "partial" : "missing",
      count: logCount,
      detail: logCount > 0 ? `${logCount} log entries recorded (${logNamesList.length} log types)` : "No logs recorded",
    });
    if (logCount === 0) missing.push("Temperature / monitoring logs missing");

    // 4. PRP Programs
    if (canAccessPRP) {
      const { data: prpRecords } = await supabase
        .from("prp_records")
        .select("id")
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .limit(500);
      const prpCount = prpRecords?.length ?? 0;
      statuses.push({
        name: "PRP Programs",
        icon: Shield,
        status: prpCount >= 5 ? "complete" : prpCount > 0 ? "partial" : "missing",
        count: prpCount,
        detail: prpCount > 0 ? `${prpCount} PRP records` : "No PRP records",
      });
      if (prpCount === 0) missing.push("PRP program records not completed");
    }

    // 5. SOP Procedures
    if (canAccessSOP) {
      const { data: customSops } = await supabase
        .from("custom_sop_items")
        .select("id")
        .eq("organization_id", orgId)
        .eq("branch_id", branchId)
        .limit(500);
      const sopCount = customSops?.length ?? 0;
      statuses.push({
        name: "SOP Procedures",
        icon: BookOpen,
        status: sopCount >= 3 ? "complete" : sopCount > 0 ? "partial" : "missing",
        count: sopCount,
        detail: sopCount > 0 ? `${sopCount} custom SOPs` : "No custom SOPs created",
      });
      if (sopCount === 0) missing.push("SOP procedures not documented");
    }

    // 6. Equipment
    const { data: equipment } = await supabase
      .from("equipment")
      .select("id")
      .eq("organization_id", orgId)
      .eq("branch_id", branchId)
      .limit(500);
    const eqCount = equipment?.length ?? 0;
    statuses.push({
      name: "Equipment Registry",
      icon: BarChart3,
      status: eqCount >= 3 ? "complete" : eqCount > 0 ? "partial" : "missing",
      count: eqCount,
      detail: eqCount > 0 ? `${eqCount} items registered` : "No equipment registered",
    });
    if (eqCount === 0) missing.push("Equipment registry is empty");

    setModules(statuses);
    setMissingItems(missing);
    setLoading(false);
  };

  const auditScore = modules.length > 0
    ? Math.round((modules.filter((m) => m.status === "complete").length / modules.length) * 100)
    : 0;

  const getStatusBadge = (status: ModuleStatus["status"]) => {
    switch (status) {
      case "complete":
        return <Badge className="bg-success text-success-foreground gap-1"><CheckCircle2 className="h-3 w-3" /> Complete</Badge>;
      case "partial":
        return <Badge variant="outline" className="text-warning border-warning gap-1"><AlertCircle className="h-3 w-3" /> Partial</Badge>;
      case "missing":
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Missing</Badge>;
    }
  };

  const documents = [
    { name: "HACCP Plan", route: "/haccp", available: true },
    { name: "CCP / Hazard Table", route: "/haccp", available: showRiskFields },
    { name: "Monitoring Logs", route: "/logs", available: true },
    { name: "PRP Programs", route: "/prp", available: canAccessPRP },
    { name: "SOP Procedures", route: "/sop", available: canAccessSOP },
    { name: "FSMS Documents", route: "/documents", available: showComplianceTools },
  ];

  /** Print a clean A4 formatted audit report */
  const handlePrintReport = async () => {
    const orgId = profile!.organization_id!;
    const branchId = profile!.branch_id!;

    // Build module status table
    let moduleRows = "";
    modules.forEach(m => {
      const statusLabel = m.status === "complete" ? "✓ Complete" : m.status === "partial" ? "⚠ Partial" : "✗ Missing";
      const badgeClass = m.status === "complete" ? "badge-ok" : m.status === "missing" ? "badge-notok" : "badge-oprp";
      moduleRows += `<tr><td>${escapeHtml(m.name)}</td><td>${m.count}</td><td><span class="badge ${badgeClass}">${statusLabel}</span></td><td>${escapeHtml(m.detail)}</td></tr>`;
    });

    let html = `
      <p class="section-title">Audit Readiness Score: ${auditScore}%</p>
      <table>
        <thead><tr><th>Module</th><th>Count</th><th>Status</th><th>Detail</th></tr></thead>
        <tbody>${moduleRows}</tbody>
      </table>
    `;

    // Missing items
    if (missingItems.length > 0) {
      html += `<p class="section-title">Missing Requirements</p><ul>`;
      missingItems.forEach(item => {
        html += `<li style="margin:4px 0;font-size:11px;">✗ ${escapeHtml(item)}</li>`;
      });
      html += `</ul>`;
    }

    // Available documents
    const availDocs = documents.filter(d => d.available);
    html += `<p class="section-title">Available Documents</p><table><thead><tr><th>#</th><th>Document</th><th>Status</th></tr></thead><tbody>`;
    availDocs.forEach((doc, i) => {
      html += `<tr><td>${i + 1}</td><td>${escapeHtml(doc.name)}</td><td>Available</td></tr>`;
    });
    html += `</tbody></table>`;

    // Available log types
    if (availableLogNames.length > 0) {
      html += `<p class="section-title">Available Log Types (${availableLogNames.length})</p><table><thead><tr><th>#</th><th>Log Name</th></tr></thead><tbody>`;
      availableLogNames.forEach((name, i) => {
        html += `<tr><td>${i + 1}</td><td>${escapeHtml(name)}</td></tr>`;
      });
      html += `</tbody></table>`;
    }

    // Signature section
    html += `
      <div style="margin-top:40px;">
        <p class="section-title">Signatures</p>
        <table>
          <thead><tr><th>Role</th><th>Name</th><th>Signature</th><th>Date</th></tr></thead>
          <tbody>
            <tr><td>Prepared By</td><td class="blank-line"></td><td class="blank-line"></td><td class="blank-line"></td></tr>
            <tr><td>Reviewed By</td><td class="blank-line"></td><td class="blank-line"></td><td class="blank-line"></td></tr>
            <tr><td>Approved By</td><td class="blank-line"></td><td class="blank-line"></td><td class="blank-line"></td></tr>
          </tbody>
        </table>
      </div>
    `;

    openPrintWindow(printHeader, html);
  };

  // Only Owner can access Audit Ready
  if (!planLoading && !isOwner) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3 max-w-sm px-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-muted-foreground" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Owner Access Required</h2>
            <p className="text-sm text-muted-foreground">
              The Audit Ready dashboard is available to organization Owners only. Contact your Owner for audit preparation.
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (loading || planLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Audit Ready</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Prepare all food safety documents for inspection automatically.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrintReport}>
              <Printer className="h-4 w-4 mr-1.5" /> Print Report
            </Button>
            <Button size="sm" onClick={handlePrintReport}>
              <Download className="h-4 w-4 mr-1.5" /> Download Audit Package
            </Button>
          </div>
        </div>

        {/* A. Status Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Audit Readiness Score</CardTitle>
            <CardDescription>Overall completion status of your food safety system</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-4xl font-bold text-primary">{auditScore}%</div>
              <div className="flex-1">
                <Progress value={auditScore} className="h-3" />
              </div>
            </div>
            <Separator />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {modules.map((mod) => (
                <div
                  key={mod.name}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                >
                  <mod.icon className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{mod.name}</p>
                    <p className="text-xs text-muted-foreground">{mod.detail}</p>
                  </div>
                  {getStatusBadge(mod.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* B. Document Center */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Document Center</CardTitle>
            <CardDescription>All food safety documents ready for inspection</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {documents.filter((d) => d.available).map((doc) => (
                <div
                  key={doc.name}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{doc.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(doc.route)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(doc.route)}
                    >
                      <Printer className="h-4 w-4 mr-1" /> Print
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* C. Missing Requirements */}
        {missingItems.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Missing Requirements
              </CardTitle>
              <CardDescription>
                Items that need attention before your next inspection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {missingItems.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                    <XCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* D. Action Buttons */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Address missing items and complete your audit preparation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={() => navigate("/logs")}>
                <ClipboardList className="h-4 w-4 mr-1.5" /> Add Missing Logs
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              <Button variant="outline" onClick={() => navigate("/haccp")}>
                <ShieldCheck className="h-4 w-4 mr-1.5" /> Review HACCP Plan
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
              {canAccessPRP && (
                <Button variant="outline" onClick={() => navigate("/prp")}>
                  <Shield className="h-4 w-4 mr-1.5" /> Complete PRP Records
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {canAccessSOP && (
                <Button variant="outline" onClick={() => navigate("/sop")}>
                  <BookOpen className="h-4 w-4 mr-1.5" /> Update SOPs
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
              {showComplianceTools && (
                <Button variant="outline" onClick={() => navigate("/documents")}>
                  <FileText className="h-4 w-4 mr-1.5" /> Run Internal Audit
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Plan notice for Basic */}
        {plan === "basic" && (
          <Card className="border-info/30 bg-info/5">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Upgrade for full audit readiness
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your Basic plan includes Logs and PRP overview. Upgrade to HACCP or Compliance plan
                    to access full hazard analysis, SOP management, and complete audit documentation.
                  </p>
                  <Button size="sm" className="mt-3" onClick={() => navigate("/app/pricing")}>
                    View Plans
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AuditReady;
