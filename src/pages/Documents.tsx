import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileText,
  Search,
  ArrowLeft,
  Printer,
  ShieldCheck,
  Shield,
  FolderOpen,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PrintDialog, { type PrintMode } from "@/components/PrintDialog";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import { openPrintWindow, escapeHtml } from "@/lib/printUtils";

// ── Types ──────────────────────────────────────────
interface DocLibraryItem {
  id: number;
  document_name: string;
  description: string | null;
  responsible: string | null;
}

type DocCategory = "all" | "haccp" | "prp" | "general";

interface EnrichedDocument extends DocLibraryItem {
  category: DocCategory;
  categoryLabel: string;
}

// ── Category classification ─────────────────────────
const HACCP_KEYWORDS = [
  "haccp",
  "hazard",
  "critical control",
  "ccp",
  "flow diagram",
  "product description",
  "verification",
  "corrective action",
];
const PRP_KEYWORDS = ["prerequisite", "prp", "cleaning", "sanitation", "pest", "hygiene", "maintenance"];

function classifyDocument(name: string): { category: DocCategory; categoryLabel: string } {
  const lower = name.toLowerCase();
  if (HACCP_KEYWORDS.some((k) => lower.includes(k)))
    return { category: "haccp", categoryLabel: "HACCP Documents" };
  if (PRP_KEYWORDS.some((k) => lower.includes(k)))
    return { category: "prp", categoryLabel: "PRP Documents" };
  return { category: "general", categoryLabel: "General FSMS" };
}

// ── Dynamic data components ─────────────────────────
function HACCPPlanData({ orgId }: { orgId: string }) {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("id, activity_name, status")
        .eq("organization_id", orgId)
        .limit(1);

      if (plans && plans.length > 0) {
        const { data: stepsData } = await supabase
          .from("haccp_plan_steps")
          .select("*, haccp_plan_hazards(*)")
          .eq("haccp_plan_id", plans[0].id)
          .order("step_order");

        setSteps(stepsData || []);
      }
      setLoading(false);
    })();
  }, [orgId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading HACCP data...</div>;
  if (!steps.length) return <p className="text-sm text-muted-foreground italic py-2">No HACCP plan data available. Complete the Setup Wizard first.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">HACCP Plan Process Steps & Hazards</h3>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 font-medium text-muted-foreground">#</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Process Step</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Hazards</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Control Type</th>
            </tr>
          </thead>
          <tbody>
            {steps.map((step: any) => (
              <tr key={step.id} className="border-t border-border">
                <td className="p-2 text-muted-foreground">{step.step_order}</td>
                <td className="p-2 font-medium">{step.process_name}</td>
                <td className="p-2">
                  {step.haccp_plan_hazards?.length
                    ? step.haccp_plan_hazards.map((h: any) => (
                        <div key={h.id} className="flex items-center gap-1 mb-0.5">
                          <AlertTriangle className="w-3 h-3 text-warning shrink-0" />
                          <span className="text-xs">{h.hazard_name}</span>
                          {h.risk_score >= 9 && (
                            <Badge variant="destructive" className="text-[10px] px-1 py-0 ml-1">CCP</Badge>
                          )}
                        </div>
                      ))
                    : <span className="text-xs text-muted-foreground">—</span>}
                </td>
                <td className="p-2 text-xs text-muted-foreground">
                  {step.haccp_plan_hazards?.[0]?.control_type || "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FlowDiagramData({ orgId }: { orgId: string }) {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("id")
        .eq("organization_id", orgId)
        .limit(1);

      if (plans && plans.length > 0) {
        const { data } = await supabase
          .from("haccp_plan_steps")
          .select("process_name, step_order")
          .eq("haccp_plan_id", plans[0].id)
          .order("step_order");
        setSteps(data || []);
      }
      setLoading(false);
    })();
  }, [orgId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading flow data...</div>;
  if (!steps.length) return <p className="text-sm text-muted-foreground italic py-2">No process flow data available.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Process Flow Diagram</h3>
      <div className="flex flex-col items-center gap-1">
        {steps.map((step: any, i: number) => (
          <div key={step.step_order} className="flex flex-col items-center">
            <div className="border border-border rounded-lg px-6 py-3 bg-card text-sm font-medium min-w-[200px] text-center shadow-sm">
              <span className="text-muted-foreground mr-2">{step.step_order}.</span>
              {step.process_name}
            </div>
            {i < steps.length - 1 && (
              <div className="w-px h-4 bg-border" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function HazardAnalysisData({ orgId }: { orgId: string }) {
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("id")
        .eq("organization_id", orgId)
        .limit(1);

      if (plans && plans.length > 0) {
        const { data: stepsData } = await supabase
          .from("haccp_plan_steps")
          .select("process_name, step_order, haccp_plan_hazards(*)")
          .eq("haccp_plan_id", plans[0].id)
          .order("step_order");

        const all = (stepsData || []).flatMap((s: any) =>
          (s.haccp_plan_hazards || []).map((h: any) => ({ ...h, process_name: s.process_name }))
        );
        setHazards(all);
      }
      setLoading(false);
    })();
  }, [orgId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading hazard data...</div>;
  if (!hazards.length) return <p className="text-sm text-muted-foreground italic py-2">No hazard analysis data available.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Hazard Analysis Summary</h3>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 font-medium text-muted-foreground">Process</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Hazard</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Type</th>
              <th className="text-left p-2 font-medium text-muted-foreground">S×L</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Risk</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Control</th>
            </tr>
          </thead>
          <tbody>
            {hazards.map((h: any) => (
              <tr key={h.id} className="border-t border-border">
                <td className="p-2">{h.process_name}</td>
                <td className="p-2 font-medium">{h.hazard_name}</td>
                <td className="p-2"><Badge variant="outline" className="text-[10px]">{h.hazard_type || "—"}</Badge></td>
                <td className="p-2 text-xs">{h.severity}×{h.likelihood}</td>
                <td className="p-2">
                  <Badge variant={h.risk_score >= 9 ? "destructive" : "secondary"} className="text-[10px]">
                    {h.risk_score}
                  </Badge>
                </td>
                <td className="p-2 text-xs text-muted-foreground">{h.control_type || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────
const Documents = () => {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<EnrichedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState<DocCategory>("all");
  const [selectedDoc, setSelectedDoc] = useState<EnrichedDocument | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const printHeader = usePrintHeader("FSMS Documents");

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("document_library")
        .select("*")
        .order("id");

      if (!error && data) {
        setDocuments(
          data.map((d) => ({
            ...d,
            ...classifyDocument(d.document_name),
          }))
        );
      }
      setLoading(false);
    })();
  }, []);

  const filtered = documents.filter((d) => {
    const matchesSearch =
      !search ||
      d.document_name.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || d.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const grouped: Record<string, EnrichedDocument[]> = {};
  filtered.forEach((d) => {
    if (!grouped[d.categoryLabel]) grouped[d.categoryLabel] = [];
    grouped[d.categoryLabel].push(d);
  });

  const handlePrint = (blank: boolean) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow || !printRef.current) return;

    const content = blank
      ? `<h1 style="font-family:system-ui;margin-bottom:8px;">${selectedDoc?.document_name}</h1>
         <p style="font-family:system-ui;color:#666;margin-bottom:24px;">${selectedDoc?.description || ""}</p>
         <div style="border-top:1px solid #ddd;padding-top:16px;">
           <p style="color:#999;font-style:italic;">This is a blank template. Fill in the required information.</p>
           <div style="margin-top:32px;border:1px solid #ddd;min-height:500px;padding:16px;">
             <p style="color:#ccc;">Content area</p>
           </div>
         </div>`
      : printRef.current.innerHTML;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${selectedDoc?.document_name || "Document"}</title>
          <style>
            @page { size: A4; margin: 20mm; }
            body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 210mm; margin: 0 auto; padding: 20px; }
            h1 { font-size: 20px; margin-bottom: 4px; }
            h2 { font-size: 16px; margin-top: 20px; }
            h3 { font-size: 14px; margin-top: 16px; }
            table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: 600; }
            .badge { display: inline-block; padding: 1px 6px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
            .badge-destructive { background: #fee2e2; color: #991b1b; }
            .badge-secondary { background: #f3f4f6; color: #374151; }
            .badge-outline { border: 1px solid #d1d5db; color: #374151; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>${content}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getCategoryIcon = (cat: DocCategory) => {
    if (cat === "haccp") return <ShieldCheck className="w-4 h-4 text-primary" />;
    if (cat === "prp") return <Shield className="w-4 h-4 text-primary" />;
    return <FolderOpen className="w-4 h-4 text-primary" />;
  };

  const hasDynamicData = (name: string) => {
    const lower = name.toLowerCase();
    return lower.includes("haccp plan") || lower.includes("flow diagram") || lower.includes("hazard analysis");
  };

  const renderDynamicContent = (doc: EnrichedDocument) => {
    if (!profile?.organization_id) return null;
    const lower = doc.document_name.toLowerCase();

    if (lower.includes("haccp plan")) return <HACCPPlanData orgId={profile.organization_id} />;
    if (lower.includes("flow diagram")) return <FlowDiagramData orgId={profile.organization_id} />;
    if (lower.includes("hazard analysis")) return <HazardAnalysisData orgId={profile.organization_id} />;
    return null;
  };

  // ── Detail view ────────────────────────────────────
  if (selectedDoc) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Documents
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => handlePrint(false)}>
                <Printer className="w-4 h-4 mr-1" /> Print
              </Button>
              <Button variant="outline" size="sm" onClick={() => handlePrint(true)}>
                <FileDown className="w-4 h-4 mr-1" /> Print Blank
              </Button>
            </div>
          </div>

          <div ref={printRef}>
            <Card className="shadow-industrial-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">
                    {getCategoryIcon(selectedDoc.category)}
                    <span className="ml-1">{selectedDoc.categoryLabel}</span>
                  </Badge>
                </div>
                <CardTitle className="text-xl">{selectedDoc.document_name}</CardTitle>
                {selectedDoc.responsible && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Responsible: <span className="font-medium">{selectedDoc.responsible}</span>
                  </p>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedDoc.description && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {selectedDoc.description}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Document sections */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Purpose</h3>
                  <p className="text-sm text-muted-foreground">
                    This document defines the requirements and procedures for{" "}
                    {selectedDoc.document_name.toLowerCase()} within the food safety management system.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Scope</h3>
                  <p className="text-sm text-muted-foreground">
                    Applicable to all food handling operations and personnel involved in food safety activities.
                  </p>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Responsibilities</h3>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>{selectedDoc.responsible || "Food Safety Team Leader"} — Oversight and review</li>
                    <li>QA Team — Implementation and monitoring</li>
                    <li>All Staff — Compliance with procedures</li>
                  </ul>
                </div>

                {/* Dynamic data injection */}
                {hasDynamicData(selectedDoc.document_name) && (
                  <>
                    <Separator />
                    <div className="bg-muted/30 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-xs font-medium text-primary">Live Data from Your HACCP Plan</span>
                      </div>
                      {renderDynamicContent(selectedDoc)}
                    </div>
                  </>
                )}

                <Separator />

                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Review & Approval</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                    <div>
                      <p className="text-xs text-muted-foreground">Prepared by:</p>
                      <div className="border-b border-border mt-6 mb-1" />
                      <p className="text-xs">Signature / Date</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Approved by:</p>
                      <div className="border-b border-border mt-6 mb-1" />
                      <p className="text-xs">Signature / Date</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ── List view ──────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">FSMS Documents</h1>
          <Badge variant="secondary" className="text-xs">
            {filtered.length} document{filtered.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as DocCategory)}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="haccp">HACCP Documents</SelectItem>
              <SelectItem value="prp">PRP Documents</SelectItem>
              <SelectItem value="general">General FSMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-industrial-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-full bg-muted">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No documents found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([label, docs]) => (
              <div key={label}>
                <div className="flex items-center gap-2 mb-3">
                  {getCategoryIcon(docs[0].category)}
                  <h2 className="text-sm font-semibold text-foreground">{label}</h2>
                  <Badge variant="secondary" className="text-[10px] ml-1">{docs.length}</Badge>
                </div>
                <div className="grid gap-2">
                  {docs.map((doc) => (
                    <Card
                      key={doc.id}
                      className="shadow-industrial-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-muted shrink-0">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.document_name}
                            </p>
                            {doc.description && (
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {doc.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {hasDynamicData(doc.document_name) && (
                            <Badge variant="default" className="text-[10px]">Live Data</Badge>
                          )}
                          {doc.responsible && (
                            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                              {doc.responsible}
                            </Badge>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Documents;
