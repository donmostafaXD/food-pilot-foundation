import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { usePlan } from "@/hooks/usePlan";
import { useActivityFilter } from "@/hooks/useActivityFilter";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { useActivity } from "@/contexts/ActivityContext";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Edit2,
  Save,
  X,
  Plus,
  Eye,
  Upload,
  Trash2,
  BookOpen,
  ClipboardList,
  Lock,
  Unlock,
  History,
  FileDown,
  RotateCcw,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PrintDialog, { type PrintMode } from "@/components/PrintDialog";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import { openPrintWindow, escapeHtml } from "@/lib/printUtils";
import { toast } from "sonner";
import AddDocumentModal from "@/components/documents/AddDocumentModal";

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
  isUploaded?: boolean;
  uploadedId?: string;
  filePath?: string | null;
  uploadCategory?: string;
}

// ── Category classification ─────────────────────────
const HACCP_KEYWORDS = [
  "haccp", "hazard", "critical control", "ccp", "flow diagram",
  "product description", "verification", "corrective action",
  "food safety manual",
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
function HACCPPlanData({ orgId, planId }: { orgId: string; planId: string | null }) {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!planId) { setLoading(false); return; }
      const { data: stepsData } = await supabase
        .from("haccp_plan_steps")
        .select("*, haccp_plan_hazards(*)")
        .eq("haccp_plan_id", planId)
        .order("step_order");
      setSteps(stepsData || []);
      setLoading(false);
    })();
  }, [orgId, planId]);

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

function FlowDiagramData({ orgId, planId }: { orgId: string; planId: string | null }) {
  const [steps, setSteps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!planId) { setLoading(false); return; }
      const { data } = await supabase
        .from("haccp_plan_steps")
        .select("process_name, step_order")
        .eq("haccp_plan_id", planId)
        .order("step_order");
      setSteps(data || []);
      setLoading(false);
    })();
  }, [orgId, planId]);

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
            {i < steps.length - 1 && <div className="w-px h-4 bg-border" />}
          </div>
        ))}
      </div>
    </div>
  );
}

function HazardAnalysisData({ orgId, planId }: { orgId: string; planId: string | null }) {
  const [hazards, setHazards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!planId) { setLoading(false); return; }
      const { data: stepsData } = await supabase
        .from("haccp_plan_steps")
        .select("process_name, step_order, haccp_plan_hazards(*)")
        .eq("haccp_plan_id", planId)
        .order("step_order");

      const all = (stepsData || []).flatMap((s: any) =>
        (s.haccp_plan_hazards || []).map((h: any) => ({ ...h, process_name: s.process_name }))
      );
      setHazards(all);
      setLoading(false);
    })();
  }, [orgId, planId]);

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

/** Dynamic PRP Programs data rendered from prp_mapping + prp_master */
function PRPProgramsData({ activityName }: { activityName: string | null }) {
  const [programs, setPrograms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!activityName) { setLoading(false); return; }

      // Get mapped program names for activity
      const { data: mapping } = await supabase
        .from("prp_mapping")
        .select("program_name")
        .eq("activity", activityName);

      const names = (mapping || []).map((m) => m.program_name);

      if (names.length === 0) {
        setPrograms([]);
        setLoading(false);
        return;
      }

      // Get program details from prp_master
      const { data: masterData } = await supabase
        .from("prp_master")
        .select("*")
        .in("program_name", names)
        .order("id");

      setPrograms(masterData || []);
      setLoading(false);
    })();
  }, [activityName]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading PRP data...</div>;
  if (!programs.length) return <p className="text-sm text-muted-foreground italic py-2">No PRP programs mapped for this activity.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <Shield className="w-4 h-4 text-primary" />
        Prerequisite Programs
      </h3>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 font-medium text-muted-foreground">Program</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Category</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Frequency</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Responsible</th>
            </tr>
          </thead>
          <tbody>
            {programs.map((p: any) => (
              <tr key={p.id} className="border-t border-border">
                <td className="p-2 font-medium">{p.program_name}</td>
                <td className="p-2">
                  <Badge variant="outline" className="text-[10px]">{p.category || "Core"}</Badge>
                </td>
                <td className="p-2 text-xs text-muted-foreground">{p.frequency || "—"}</td>
                <td className="p-2 text-xs text-muted-foreground">{p.responsible || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{programs.length} program{programs.length !== 1 ? "s" : ""} applicable to current activity</p>
    </div>
  );
}

/** Dynamic SOP Procedures data rendered from sop_library filtered by plan process steps */
function SOPProceduresData({ planId }: { planId: string | null }) {
  const [sops, setSOPs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!planId) { setLoading(false); return; }

      // Get plan process steps
      const { data: stepsData } = await supabase
        .from("haccp_plan_steps")
        .select("process_name")
        .eq("haccp_plan_id", planId);

      const processNames = (stepsData || []).map((s) => s.process_name);
      if (processNames.length === 0) {
        setSOPs([]);
        setLoading(false);
        return;
      }

      // Get SOPs matching process steps
      const { data: sopData } = await supabase
        .from("sop_library")
        .select("*")
        .in("process_step", processNames)
        .order("id");

      setSOPs(sopData || []);
      setLoading(false);
    })();
  }, [planId]);

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading SOP data...</div>;
  if (!sops.length) return <p className="text-sm text-muted-foreground italic py-2">No SOP procedures mapped for this activity.</p>;

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <BookOpen className="w-4 h-4 text-primary" />
        Standard Operating Procedures
      </h3>
      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2 font-medium text-muted-foreground">SOP Title</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Process Step</th>
              <th className="text-left p-2 font-medium text-muted-foreground">Responsible</th>
            </tr>
          </thead>
          <tbody>
            {sops.map((s: any) => (
              <tr key={s.id} className="border-t border-border">
                <td className="p-2 font-medium">{s.sop_title}</td>
                <td className="p-2 text-xs text-muted-foreground">{s.process_step}</td>
                <td className="p-2 text-xs text-muted-foreground">{s.responsible || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">{sops.length} procedure{sops.length !== 1 ? "s" : ""} linked to current plan</p>
    </div>
  );
}

/** Food Safety Manual — aggregates HACCP, PRP, and SOP data */
function FoodSafetyManualData({
  orgId, planId, activityName,
}: { orgId: string; planId: string | null; activityName: string | null }) {
  return (
    <div className="space-y-6">
      <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
        <h3 className="text-sm font-semibold text-foreground mb-1">Food Safety Management System Manual</h3>
        <p className="text-xs text-muted-foreground">
          This document aggregates all components of your Food Safety Management System including HACCP Plan, 
          Prerequisite Programs, and Standard Operating Procedures for the current activity.
        </p>
      </div>

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section 1: Process Flow</h4>
        <FlowDiagramData orgId={orgId} planId={planId} />
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section 2: Hazard Analysis & Critical Control Points</h4>
        <HACCPPlanData orgId={orgId} planId={planId} />
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section 3: Prerequisite Programs</h4>
        <PRPProgramsData activityName={activityName} />
      </div>

      <Separator />

      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Section 4: Standard Operating Procedures</h4>
        <SOPProceduresData planId={planId} />
      </div>
    </div>
  );
}

// ── Editable section keys ──────────────────────────
const SECTION_KEYS = ["purpose", "scope", "responsibilities", "procedures", "notes"] as const;
type SectionKey = typeof SECTION_KEYS[number];

const SECTION_LABELS: Record<SectionKey, string> = {
  purpose: "Purpose",
  scope: "Scope",
  responsibilities: "Responsibilities",
  procedures: "Procedures & Requirements",
  notes: "Additional Notes",
};

const DEFAULT_SECTIONS: Record<SectionKey, (doc: EnrichedDocument) => string> = {
  purpose: (doc) =>
    `This document defines the requirements and procedures for ${doc.document_name.toLowerCase()} within the food safety management system.`,
  scope: () =>
    `Applicable to all food handling operations and personnel involved in food safety activities.`,
  responsibilities: (doc) =>
    `• ${doc.responsible || "Food Safety Team Leader"} — Oversight and review\n• QA Team — Implementation and monitoring\n• All Staff — Compliance with procedures`,
  procedures: (doc) => {
    const lower = doc.document_name.toLowerCase();
    if (lower.includes("haccp"))
      return `1. Conduct hazard analysis for all process steps\n2. Determine Critical Control Points (CCPs)\n3. Establish critical limits for each CCP\n4. Establish monitoring procedures\n5. Establish corrective actions\n6. Establish verification procedures\n7. Establish record keeping`;
    if (lower.includes("prp") || lower.includes("prerequisite"))
      return `1. Implement all prerequisite programs as defined\n2. Conduct regular inspections per program frequency\n3. Document all findings and corrective actions\n4. Review program effectiveness periodically`;
    if (lower.includes("sop"))
      return `1. Follow standard operating procedures for each process step\n2. Train all staff on relevant SOPs\n3. Review and update SOPs when processes change\n4. Document deviations and corrective actions`;
    if (lower.includes("manual"))
      return `This manual encompasses all elements of the Food Safety Management System including HACCP principles, prerequisite programs, standard operating procedures, and monitoring protocols.`;
    return `Refer to the relevant system data sections below for detailed procedures.`;
  },
  notes: () => "",
};

// ── Main component ──────────────────────────────────
const Documents = () => {
  const { profile, user } = useAuth();
  const { plan } = usePlan();
  const { activityName, planId: activePlanId, loading: activityLoading } = useActivityFilter();
  const guard = usePermissionGuard("documents");
  const { effectiveRole, isNoOverrideMode } = useRoleAccess();
  const isOwner = effectiveRole === "Owner" || effectiveRole === "super_admin";
  const [searchParams] = useSearchParams();
  const [documents, setDocuments] = useState<EnrichedDocument[]>([]);
  const [uploadedDocs, setUploadedDocs] = useState<EnrichedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState<DocCategory>("all");
  const [selectedDoc, setSelectedDoc] = useState<EnrichedDocument | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [showAllLibrary, setShowAllLibrary] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  const printHeader = usePrintHeader("FSMS Documents");

  // ── Lock state ──
  const [docLocked, setDocLocked] = useState(false);
  const [lockLoading, setLockLoading] = useState(false);
  const [lockReason, setLockReason] = useState("");
  const [lockDialogOpen, setLockDialogOpen] = useState(false);
  const [lockReasonInput, setLockReasonInput] = useState("");

  // ── Version state ──
  const [versions, setVersions] = useState<any[]>([]);
  const [versionsOpen, setVersionsOpen] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [lockedDocIds, setLockedDocIds] = useState<Set<number>>(new Set());
  const [versionLabel, setVersionLabel] = useState("");
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [currentVersionNum, setCurrentVersionNum] = useState(0);

  // Load system documents
  const loadDocuments = useCallback(async () => {
    setLoading(true);
    const [{ data: fsmsData }, { data: legacyData }] = await Promise.all([
      supabase.from("fsms_documents").select("*").order("id"),
      supabase.from("document_library").select("*").order("id"),
    ]);

    const source = (fsmsData && fsmsData.length > 0) ? fsmsData : legacyData || [];
    setDocuments(
      source.map((d: any) => ({
        id: d.id,
        document_name: d.document_name,
        description: d.description,
        responsible: d.responsible,
        ...classifyDocument(d.document_name),
      }))
    );

    // Load uploaded docs
    if (profile?.organization_id && profile?.branch_id) {
      const { data: uploaded } = await supabase
        .from("uploaded_documents")
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("branch_id", profile.branch_id)
        .order("created_at", { ascending: false });

      setUploadedDocs(
        (uploaded || []).map((d: any) => ({
          id: d.id,
          document_name: d.document_name,
          description: null,
          responsible: d.responsible,
          ...classifyDocument(d.document_name),
          isUploaded: true,
          uploadedId: d.id,
          filePath: d.file_path,
          uploadCategory: d.category,
        }))
      );

      // Load lock statuses
      const { data: locks } = await supabase
        .from("document_lock_status")
        .select("document_id, is_locked")
        .eq("organization_id", profile.organization_id)
        .eq("is_locked", true);
      setLockedDocIds(new Set((locks as any[] || []).map((l: any) => l.document_id)));
    }

    setLoading(false);
  }, [profile?.organization_id, profile?.branch_id]);

  useEffect(() => {
    if (activityLoading) return;
    loadDocuments();
  }, [activityLoading, loadDocuments]);

  // Documents allowed for HACCP plan
  const HACCP_ALLOWED_DOC_KEYWORDS = useMemo(() => [
    "flow diagram", "haccp verification", "record keeping", "corrective action",
    "supplier approval", "approved supplier", "raw material", "allergen",
    "calibration", "equipment", "cleaning", "sanitation", "pest control",
    "training", "non-conformance", "hold & release", "document control",
    "record control", "risk assessment", "hazard evaluation", "haccp plan",
    "hazard analysis",
  ], []);

  const BASIC_ALLOWED_DOC_CATEGORIES: DocCategory[] = ["haccp", "prp"];

  // Merge system + uploaded, apply activity filter
  const allDocs = useMemo(() => {
    let systemDocs = documents;

    if (!showAllLibrary && activityName) {
      systemDocs = systemDocs.filter((d) => {
        if (d.category === "haccp" || d.category === "prp") return true;
        return true;
      });
    }

    let filteredUploaded = uploadedDocs;
    if (!showAllLibrary && activityName) {
      filteredUploaded = uploadedDocs.filter((d) => {
        const docActivity = (d as any).activity;
        if (!docActivity) return true;
        return docActivity.toLowerCase() === activityName.toLowerCase();
      });
    }

    return [...systemDocs, ...filteredUploaded];
  }, [documents, uploadedDocs, showAllLibrary, activityName]);

  const filtered = allDocs.filter((d) => {
    const matchesSearch =
      !search ||
      d.document_name.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === "all" || d.category === categoryFilter;

    if (plan === "basic") {
      if (!d.isUploaded && !BASIC_ALLOWED_DOC_CATEGORIES.includes(d.category)) return false;
    }

    if (plan === "professional") {
      if (!d.isUploaded) {
        const lower = d.document_name.toLowerCase();
        if (d.category === "general") return false;
        if (!HACCP_ALLOWED_DOC_KEYWORDS.some((kw) => lower.includes(kw))) return false;
      }
    }

    return matchesSearch && matchesCategory;
  });

  const systemFiltered = filtered.filter((d) => !d.isUploaded);
  const uploadFiltered = filtered.filter((d) => d.isUploaded);

  const grouped: Record<string, EnrichedDocument[]> = {};
  systemFiltered.forEach((d) => {
    if (!grouped[d.categoryLabel]) grouped[d.categoryLabel] = [];
    grouped[d.categoryLabel].push(d);
  });

  const existingDocIds = useMemo(
    () => new Set(documents.map((d) => d.id)),
    [documents]
  );

  const handleDeleteUploaded = async (doc: EnrichedDocument) => {
    if (!doc.uploadedId) return;
    if (doc.filePath) {
      await supabase.storage.from("documents").remove([doc.filePath]);
    }
    const { error } = await supabase
      .from("uploaded_documents")
      .delete()
      .eq("id", doc.uploadedId);

    if (error) {
      toast.error("Failed to delete document");
    } else {
      toast.success("Document removed");
      setUploadedDocs((prev) => prev.filter((d) => d.uploadedId !== doc.uploadedId));
    }
  };

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
      <!DOCTYPE html><html><head><title>${selectedDoc?.document_name || "Document"}</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 210mm; margin: 0 auto; padding: 20px; }
        h1 { font-size: 20px; margin-bottom: 4px; } h2 { font-size: 16px; margin-top: 20px; } h3 { font-size: 14px; margin-top: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        @media print { body { padding: 0; } }
      </style></head><body>${content}</body></html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const getCategoryIcon = (cat: DocCategory) => {
    if (cat === "haccp") return <ShieldCheck className="w-4 h-4 text-primary" />;
    if (cat === "prp") return <Shield className="w-4 h-4 text-primary" />;
    return <FolderOpen className="w-4 h-4 text-primary" />;
  };

  /** Check if a document has dynamic live data to render */
  const hasDynamicData = (name: string) => {
    const lower = name.toLowerCase();
    return (
      lower.includes("haccp plan") ||
      lower.includes("flow diagram") ||
      lower.includes("hazard analysis") ||
      lower.includes("prp program") ||
      lower.includes("prerequisite program") ||
      lower.includes("sop procedure") ||
      lower.includes("food safety manual")
    );
  };

  /** Render the appropriate dynamic data component(s) for a document */
  const renderDynamicContent = (doc: EnrichedDocument) => {
    if (!profile?.organization_id) return null;
    const lower = doc.document_name.toLowerCase();

    // Food Safety Manual → full aggregate
    if (lower.includes("food safety manual")) {
      return (
        <FoodSafetyManualData
          orgId={profile.organization_id}
          planId={activePlanId}
          activityName={activityName}
        />
      );
    }

    // Individual document types
    const sections: React.ReactNode[] = [];

    if (lower.includes("haccp plan")) {
      sections.push(<HACCPPlanData key="haccp" orgId={profile.organization_id} planId={activePlanId} />);
    }
    if (lower.includes("flow diagram")) {
      sections.push(<FlowDiagramData key="flow" orgId={profile.organization_id} planId={activePlanId} />);
    }
    if (lower.includes("hazard analysis")) {
      sections.push(<HazardAnalysisData key="hazard" orgId={profile.organization_id} planId={activePlanId} />);
    }
    if (lower.includes("prp program") || lower.includes("prerequisite program")) {
      sections.push(<PRPProgramsData key="prp" activityName={activityName} />);
    }
    if (lower.includes("sop procedure")) {
      sections.push(<SOPProceduresData key="sop" planId={activePlanId} />);
    }

    return sections.length > 0 ? <div className="space-y-6">{sections}</div> : null;
  };

  // ── Editable document sections ──────────────────────
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState<Record<string, string>>({});
  const [savedContent, setSavedContent] = useState<Record<string, string>>({});
  const [savingDoc, setSavingDoc] = useState(false);
  const [loadingContent, setLoadingContent] = useState(false);

  // Load saved content AND lock status when document selected
  useEffect(() => {
    if (!selectedDoc || !profile?.organization_id || selectedDoc.isUploaded) return;
    setEditing(false);
    setLoadingContent(true);
    setDocLocked(false);
    setLockReason("");
    setCurrentVersionNum(0);
    (async () => {
      const [{ data }, { data: lockData }, { data: latestV }] = await Promise.all([
        supabase
          .from("document_custom_content")
          .select("section_key, content")
          .eq("organization_id", profile.organization_id!)
          .eq("document_id", selectedDoc.id),
        supabase
          .from("document_lock_status")
          .select("is_locked, lock_reason")
          .eq("organization_id", profile.organization_id!)
          .eq("document_id", selectedDoc.id)
          .maybeSingle(),
        supabase
          .from("document_versions")
          .select("version_number")
          .eq("organization_id", profile.organization_id!)
          .eq("document_id", selectedDoc.id)
          .order("version_number", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const contentMap: Record<string, string> = {};
      (data as any[] || []).forEach((row: any) => {
        contentMap[row.section_key] = row.content || "";
      });
      setSavedContent(contentMap);
      setEditContent({});
      if (lockData) {
        setDocLocked(!!(lockData as any).is_locked);
        setLockReason((lockData as any).lock_reason || "");
      }
      setCurrentVersionNum((latestV as any)?.version_number || 0);
      setLoadingContent(false);
    })();
  }, [selectedDoc?.id, profile?.organization_id]);

  const getSectionContent = useCallback(
    (key: SectionKey) => {
      if (editing && editContent[key] !== undefined) return editContent[key];
      if (savedContent[key] !== undefined) return savedContent[key];
      return selectedDoc ? DEFAULT_SECTIONS[key]?.(selectedDoc) || "" : "";
    },
    [editing, editContent, savedContent, selectedDoc]
  );

  const startEditing = () => {
    if (!selectedDoc) return;
    const current: Record<string, string> = {};
    SECTION_KEYS.forEach((key) => {
      current[key] = getSectionContent(key);
    });
    setEditContent(current);
    setEditing(true);
  };

  const handleSaveContent = async () => {
    if (!selectedDoc || !profile?.organization_id) return;
    setSavingDoc(true);
    try {
      for (const key of SECTION_KEYS) {
        const content = editContent[key] ?? getSectionContent(key);
        if (key === "notes" && !content.trim()) continue;
        await supabase.from("document_custom_content").upsert(
          {
            organization_id: profile.organization_id,
            document_id: selectedDoc.id,
            section_key: key,
            content,
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "organization_id,document_id,section_key" }
        );
      }

      // Save version snapshot with label
      const versionContent: Record<string, string> = {};
      SECTION_KEYS.forEach((k) => {
        versionContent[k] = editContent[k] ?? getSectionContent(k);
      });
      const nextVersion = currentVersionNum + 1;
      await supabase.from("document_versions").insert({
        organization_id: profile.organization_id,
        document_id: selectedDoc.id,
        version_number: nextVersion,
        content: versionContent,
        created_by: user?.id || null,
        note: versionLabel.trim() || null,
      } as any);

      setCurrentVersionNum(nextVersion);
      setSavedContent({ ...editContent });
      setEditing(false);
      setSaveDialogOpen(false);
      setVersionLabel("");
      toast.success(`Document saved (v${nextVersion})`);
    } catch (err: any) {
      toast.error("Failed to save", { description: err.message });
    }
    setSavingDoc(false);
  };

  // ── Lock/Unlock ──
  const handleToggleLock = async (reason?: string) => {
    if (!selectedDoc || !profile?.organization_id || !isOwner) return;
    setLockLoading(true);
    const newLocked = !docLocked;
    await supabase.from("document_lock_status").upsert(
      {
        organization_id: profile.organization_id,
        document_id: selectedDoc.id,
        is_locked: newLocked,
        locked_by: newLocked ? user?.id : null,
        locked_at: newLocked ? new Date().toISOString() : null,
        lock_reason: newLocked ? (reason || null) : null,
      } as any,
      { onConflict: "organization_id,document_id" }
    );
    setDocLocked(newLocked);
    setLockReason(newLocked ? (reason || "") : "");
    setLockLoading(false);
    setLockDialogOpen(false);
    setLockReasonInput("");
    if (newLocked) {
      setLockedDocIds((prev) => new Set([...prev, selectedDoc.id]));
    } else {
      setLockedDocIds((prev) => { const s = new Set(prev); s.delete(selectedDoc.id); return s; });
    }
    toast.success(newLocked ? "Document locked" : "Document unlocked");
  };

  // ── Version history ──
  const loadVersions = async () => {
    if (!selectedDoc || !profile?.organization_id) return;
    setVersionsLoading(true);
    const { data } = await supabase
      .from("document_versions")
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("document_id", selectedDoc.id)
      .order("version_number", { ascending: false });
    setVersions((data as any[]) || []);
    setVersionsLoading(false);
    setVersionsOpen(true);
  };

  const restoreVersion = async (version: any) => {
    if (!selectedDoc || !profile?.organization_id) return;
    const content = version.content as Record<string, string>;
    setSavingDoc(true);
    try {
      for (const key of SECTION_KEYS) {
        if (content[key] === undefined) continue;
        await supabase.from("document_custom_content").upsert(
          {
            organization_id: profile.organization_id,
            document_id: selectedDoc.id,
            section_key: key,
            content: content[key],
            updated_at: new Date().toISOString(),
          } as any,
          { onConflict: "organization_id,document_id,section_key" }
        );
      }
      setSavedContent(content);
      setEditing(false);
      setVersionsOpen(false);
      toast.success(`Restored to v${version.version_number}`);
    } catch {
      toast.error("Failed to restore version");
    }
    setSavingDoc(false);
  };

  // ── PDF Export ──
  const handlePdfExport = () => {
    if (!selectedDoc || !printRef.current) return;
    const content = printRef.current.innerHTML;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const orgName = printHeader.organizationName || "Organization";
    const versionStr = currentVersionNum > 0 ? `Version ${currentVersionNum}` : "Draft";
    const exportDate = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>${selectedDoc.document_name} — PDF Export</title>
      <style>
        @page { size: A4; margin: 20mm; }
        body { font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; max-width: 210mm; margin: 0 auto; padding: 20px; }
        h1 { font-size: 20px; margin-bottom: 4px; } h2 { font-size: 16px; margin-top: 20px; } h3 { font-size: 14px; margin-top: 16px; }
        table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 12px; }
        th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        .badge { display: inline-block; padding: 1px 6px; border-radius: 9999px; font-size: 10px; font-weight: 600; }
        .doc-header-bar { border-bottom: 2px solid #1a1a1a; padding-bottom: 14px; margin-bottom: 24px; }
        .doc-header-bar .org-name { font-size: 16px; font-weight: 700; margin: 0; }
        .doc-header-bar .doc-title { font-size: 14px; color: #374151; margin: 2px 0 0; }
        .doc-header-bar .meta-row { display: flex; justify-content: space-between; margin-top: 6px; font-size: 10px; color: #6b7280; }
        .doc-footer { margin-top: 40px; padding-top: 12px; border-top: 1px solid #ddd; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
        @media print { body { padding: 0; } }
      </style></head><body>
        <div class="doc-header-bar">
          <p class="org-name">${escapeHtml(orgName)}</p>
          <p class="doc-title">${escapeHtml(selectedDoc.document_name)}</p>
          <div class="meta-row">
            <span>${escapeHtml(versionStr)}${docLocked ? " • LOCKED" : ""}</span>
            <span>Export Date: ${escapeHtml(exportDate)}</span>
          </div>
        </div>
        ${content}
        <div class="doc-footer">
          <span>${escapeHtml(orgName)} — ${escapeHtml(selectedDoc.document_name)}</span>
          <span>${escapeHtml(versionStr)} • ${escapeHtml(exportDate)}</span>
        </div>
      </body></html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 400);
  };

  const canEdit = guard.canEdit && !docLocked && !selectedDoc?.isUploaded;

  // ── Detail view ────────────────────────────────────
  if (selectedDoc) {
    const dynamicContent = renderDynamicContent(selectedDoc);
    const hasLiveData = hasDynamicData(selectedDoc.document_name);

    return (
      <DashboardLayout>
        <div className="p-4 lg:p-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
            <Button variant="ghost" size="sm" onClick={() => setSelectedDoc(null)}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Documents
            </Button>
            <div className="flex gap-2 flex-wrap">
              {/* Lock/Unlock — Owner only */}
              {!selectedDoc.isUploaded && isOwner && !editing && (
                <Button
                  variant={docLocked ? "destructive" : "outline"}
                  size="sm"
                  onClick={() => docLocked ? handleToggleLock() : setLockDialogOpen(true)}
                  disabled={lockLoading}
                >
                  {lockLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : docLocked ? <Unlock className="w-4 h-4 mr-1" /> : <Lock className="w-4 h-4 mr-1" />}
                  {docLocked ? "Unlock" : "Lock"}
                </Button>
              )}
              {/* Version History */}
              {!selectedDoc.isUploaded && !editing && (
                <Button variant="outline" size="sm" onClick={loadVersions}>
                  <History className="w-4 h-4 mr-1" /> Versions
                </Button>
              )}
              {/* Edit — only if not locked */}
              {!editing && canEdit && (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit2 className="w-4 h-4 mr-1" /> Edit
                </Button>
              )}
              {editing && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </Button>
                  <Button size="sm" onClick={() => setSaveDialogOpen(true)} disabled={savingDoc}>
                    {savingDoc ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                    Save
                  </Button>
                </>
              )}
              {!editing && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
                    <Printer className="w-4 h-4 mr-1" /> Print
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePdfExport}>
                    <FileDown className="w-4 h-4 mr-1" /> PDF
                  </Button>
                </>
              )}
            </div>
          </div>

          <PrintDialog
            open={printOpen}
            onClose={() => setPrintOpen(false)}
            onSelect={(mode: PrintMode) => handlePrint(mode === "blank")}
            title={`Print: ${selectedDoc?.document_name}`}
          />

          <div ref={printRef}>
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-[10px]">
                    {getCategoryIcon(selectedDoc.category)}
                    <span className="ml-1">{selectedDoc.isUploaded ? (selectedDoc.uploadCategory || "Uploaded") : selectedDoc.categoryLabel}</span>
                  </Badge>
                  {selectedDoc.isUploaded && (
                    <Badge variant="secondary" className="text-[10px]">
                      <Upload className="w-3 h-3 mr-1" /> Uploaded
                    </Badge>
                  )}
                  {hasLiveData && (
                    <Badge variant="default" className="text-[10px]">
                      <CheckCircle2 className="w-3 h-3 mr-1" /> Live Data
                    </Badge>
                  )}
                  {activityName && (
                    <Badge variant="secondary" className="text-[10px]">
                      {activityName}
                    </Badge>
                  )}
                  {docLocked && (
                    <Badge variant="destructive" className="text-[10px]">
                      <Lock className="w-3 h-3 mr-1" /> Locked
                    </Badge>
                  )}
                  {currentVersionNum > 0 && (
                    <Badge variant="outline" className="text-[10px]">
                      v{currentVersionNum}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl">{selectedDoc.document_name}</CardTitle>
                {selectedDoc.responsible && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Responsible: <span className="font-medium">{selectedDoc.responsible}</span>
                  </p>
                )}
                {docLocked && lockReason && (
                  <div className="mt-2 flex items-start gap-2 bg-destructive/10 rounded-md px-3 py-2">
                    <Lock className="w-3.5 h-3.5 text-destructive shrink-0 mt-0.5" />
                    <p className="text-xs text-destructive">
                      <span className="font-medium">Lock reason:</span> {lockReason}
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedDoc.isUploaded && selectedDoc.filePath && (
                  <div className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">Attached file</span>
                      <Badge variant="outline" className="text-[10px] ml-auto">
                        {selectedDoc.filePath.split(".").pop()?.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                )}

                {!selectedDoc.isUploaded && (
                  <>
                    {selectedDoc.description && (
                      <div>
                        <h3 className="text-sm font-semibold text-foreground mb-2">Description</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {selectedDoc.description}
                        </p>
                      </div>
                    )}

                    <Separator />

                    {loadingContent ? (
                      <div className="flex items-center gap-2 py-4 text-muted-foreground">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading content...
                      </div>
                    ) : (
                      <div className="space-y-5">
                        {SECTION_KEYS.map((key) => {
                          const content = getSectionContent(key);
                          // Hide empty notes section in view mode
                          if (key === "notes" && !editing && !content.trim()) return null;

                          return (
                            <div key={key}>
                              <h3 className="text-sm font-semibold text-foreground mb-2">
                                {SECTION_LABELS[key]}
                              </h3>
                              {editing ? (
                                <Textarea
                                  value={editContent[key] ?? ""}
                                  onChange={(e) => setEditContent((prev) => ({ ...prev, [key]: e.target.value }))}
                                  rows={key === "procedures" ? 6 : key === "notes" ? 4 : 3}
                                  className="resize-none text-sm"
                                  placeholder={key === "notes" ? "Add any additional notes here..." : undefined}
                                />
                              ) : (
                                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                                  {content}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Dynamic live data */}
                    {dynamicContent && (
                      <>
                        <Separator />
                        <div className="bg-muted/30 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-4">
                            <CheckCircle2 className="w-4 h-4 text-primary" />
                            <span className="text-xs font-medium text-primary">
                              Live Data — {activityName || "Current Activity"}
                            </span>
                          </div>
                          {dynamicContent}
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
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Version History Dialog */}
        <Dialog open={versionsOpen} onOpenChange={setVersionsOpen}>
          <DialogContent className="sm:max-w-md max-h-[70vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <History className="w-4 h-4" /> Version History
              </DialogTitle>
            </DialogHeader>
            {versionsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : versions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No versions saved yet. Edit and save the document to create a version.</p>
            ) : (
              <div className="space-y-2">
                {versions.map((v: any) => (
                  <div key={v.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">Version {v.version_number}</p>
                        {v.note && (
                          <Badge variant="secondary" className="text-[10px]">{v.note}</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(v.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    {!docLocked && guard.canEdit && (
                      <Button variant="outline" size="sm" onClick={() => restoreVersion(v)} disabled={savingDoc}>
                        <RotateCcw className="w-3.5 h-3.5 mr-1" /> Restore
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Save Version Dialog */}
        <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base">Save Document Version</DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="version-label" className="text-sm">Version Label (optional)</Label>
                <Input
                  id="version-label"
                  placeholder='e.g. "Audit Ready", "Updated SOP"'
                  value={versionLabel}
                  onChange={(e) => setVersionLabel(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleSaveContent} disabled={savingDoc}>
                  {savingDoc ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                  Save as v{currentVersionNum + 1}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Lock Reason Dialog */}
        <Dialog open={lockDialogOpen} onOpenChange={setLockDialogOpen}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle className="text-base flex items-center gap-2">
                <Lock className="w-4 h-4" /> Lock Document
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3 pt-2">
              <div>
                <Label htmlFor="lock-reason" className="text-sm">Reason for locking (optional)</Label>
                <Input
                  id="lock-reason"
                  placeholder='e.g. "Approved for audit", "Under review"'
                  value={lockReasonInput}
                  onChange={(e) => setLockReasonInput(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setLockDialogOpen(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" onClick={() => handleToggleLock(lockReasonInput)} disabled={lockLoading}>
                  {lockLoading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Lock className="w-4 h-4 mr-1" />}
                  Lock Document
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  // ── List view ──────────────────────────────────────
  return (
    <DashboardLayout>
      <div className="p-4 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">FSMS Documents</h1>
            {activityName && (
              <p className="text-sm text-muted-foreground mt-1">
                Filtered for
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {activityName}
                </Badge>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </Badge>
            {guard.canCreate && (
              <Button size="sm" onClick={() => setAddModalOpen(true)} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Add Document
              </Button>
            )}
          </div>
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
          {activityName && (
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="show-all-docs" className="text-sm text-muted-foreground cursor-pointer whitespace-nowrap">
                Show All
              </Label>
              <Switch
                id="show-all-docs"
                checked={showAllLibrary}
                onCheckedChange={setShowAllLibrary}
              />
            </div>
          )}
        </div>

        {/* Loading */}
        {loading || activityLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="p-4 rounded-full bg-muted">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No documents found.</p>
              <Button variant="outline" size="sm" onClick={() => setAddModalOpen(true)}>
                <Plus className="w-4 h-4 mr-1" /> Add Document
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* System documents grouped by category */}
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
                      key={`sys-${doc.id}`}
                      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
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
                          {lockedDocIds.has(doc.id) && (
                            <Badge variant="destructive" className="text-[10px]">
                              <Lock className="w-3 h-3 mr-1" /> Locked
                            </Badge>
                          )}
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

            {/* Uploaded documents section */}
            {uploadFiltered.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Upload className="w-4 h-4 text-primary" />
                  <h2 className="text-sm font-semibold text-foreground">Your Documents</h2>
                  <Badge variant="secondary" className="text-[10px] ml-1">{uploadFiltered.length}</Badge>
                </div>
                <div className="grid gap-2">
                  {uploadFiltered.map((doc) => (
                    <Card
                      key={`up-${doc.uploadedId}`}
                      className="shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                      onClick={() => setSelectedDoc(doc)}
                    >
                      <CardContent className="flex items-center justify-between p-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-primary/10 shrink-0">
                            <Upload className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {doc.document_name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[10px]">
                                {doc.uploadCategory || "FSMS"}
                              </Badge>
                              {doc.filePath && (
                                <span className="text-[10px] text-muted-foreground">
                                  {doc.filePath.split(".").pop()?.toUpperCase()} file attached
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {doc.responsible && (
                            <Badge variant="outline" className="text-[10px] hidden sm:inline-flex">
                              {doc.responsible}
                            </Badge>
                          )}
                          {guard.canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteUploaded(doc);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </Button>
                          )}
                          <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <AddDocumentModal
          open={addModalOpen}
          onClose={() => setAddModalOpen(false)}
          onAdded={loadDocuments}
          existingDocIds={existingDocIds}
          activityName={activityName}
        />
      </div>
    </DashboardLayout>
  );
};

export default Documents;
