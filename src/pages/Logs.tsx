import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityFilter } from "@/hooks/useActivityFilter";
import { useAdminPlanOverride } from "@/contexts/AdminPlanOverrideContext";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/alert-dialog";
import {
  ClipboardList,
  Plus,
  ArrowLeft,
  Filter,
  AlertTriangle,
  Loader2,
  Printer,
  Library,
  PenLine,
  Eye,
  Trash2,
  Download,
  Upload,
  Lock,
} from "lucide-react";
import { toast } from "sonner";
import PrintDialog, { type PrintMode } from "@/components/PrintDialog";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import { openPrintWindow, blankTable, escapeHtml } from "@/lib/printUtils";

interface LogStructure {
  log_name: string;
  related_process_step: string | null;
  fields: string[];
  isCustom?: boolean;
  customId?: string;
}

interface MfgLogStructure {
  log_name: string;
  process_step_id: number;
  parameter: string | null;
  unit: string | null;
  frequency: string | null;
}

interface LogEntry {
  id: string;
  log_name: string;
  process_step: string | null;
  data: Record<string, string>;
  status: string | null;
  recorded_by: string | null;
  created_at: string;
}

interface BranchEquipment {
  id: string;
  equipment_name: string;
  status: string;
}

type ViewMode = "list" | "form" | "entries";

/** Generate a simple CSV template for download */
function generateExcelTemplate(): string {
  const headers = ["Date", "Staff", "Equipment", "Value", "Status", "Notes"];
  const exampleRow = [new Date().toISOString().split("T")[0], "", "", "", "OK", ""];
  return [headers.join(","), exampleRow.join(","), ...Array(14).fill(headers.map(() => "").join(","))].join("\n");
}

/** Parse CSV text into rows of key-value objects */
function parseCsvToEntries(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split("\n").map(l => l.split(",").map(c => c.trim().replace(/^"|"$/g, "")));
  if (lines.length < 2) return [];
  const headers = lines[0];
  return lines.slice(1).filter(row => row.some(c => c.length > 0)).map(row => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => { obj[h] = row[i] || ""; });
    return obj;
  });
}

/** Logs allowed on Basic plan (Food Service only) */
const BASIC_ALLOWED_LOGS = new Set([
  "Receiving Log",
  "Cold Storage Log",
  "Cooking Temperature Log",
  "Hot Holding Log",
  "Cleaning Log",
  "Pest Control Log",
  "Training Log",
]);

/** Logs explicitly hidden from Basic plan */
const BASIC_HIDDEN_LOGS = new Set([
  "Internal Audit Log",
  "Corrective Action Log",
  "CCP Monitoring Log",
]);

/** Logs allowed on HACCP (professional) plan */
const HACCP_ALLOWED_LOGS = new Set([
  "Cooking Temperature Log",
  "Cold Storage Log",
  "Hot Holding Log",
  "Receiving Log",
  "CCP Monitoring Log",
  "Cleaning Log",
  "Corrective Action Log",
]);

const Logs = () => {
  const navigate = useNavigate();
  const { profile, loading: authLoading } = useAuth();
  const { overrideRole } = useAdminPlanOverride();
  const isStaffPreview = overrideRole === "Staff";
  const { activityName, activityProcesses, planProcessNames, businessType: activityBusinessType, planJustUpdated, loading: activityLoading } = useActivityFilter();
  const { plan, loading: planLoading } = usePlan();
  const isBasicPlan = plan === "basic";
  const printHeader = usePrintHeader("Monitoring Logs");
  const [printOpen, setPrintOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [logStructures, setLogStructures] = useState<LogStructure[]>([]);
  const [mfgLogs, setMfgLogs] = useState<MfgLogStructure[]>([]);
  const [selectedLog, setSelectedLog] = useState<string>("");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [formStatus, setFormStatus] = useState("OK");
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [showAllLibrary, setShowAllLibrary] = useState(false);

  // Add Item dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<"library" | "custom" | null>(null);
  const [libraryLogs, setLibraryLogs] = useState<LogStructure[]>([]);
  const [customLogName, setCustomLogName] = useState("");
  const [customLogFields, setCustomLogFields] = useState("");
  const [customLogProcess, setCustomLogProcess] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<LogStructure | null>(null);

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterLogType, setFilterLogType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Equipment for dropdowns
  const [branchEquipment, setBranchEquipment] = useState<BranchEquipment[]>([]);

  // Excel upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingExcel, setUploadingExcel] = useState(false);

  // Detect business type from HACCP plan
  const [businessType, setBusinessType] = useState<string>("");

  // CCP-related log names for highlighting
  const ccpLogNames = useMemo(
    () => ["CCP Monitoring Log", "Corrective Action Log", "Cooking Temperature Log"],
    []
  );

  useEffect(() => {
    if (authLoading || activityLoading || !profile?.organization_id) return;

    const load = async () => {
      setLoading(true);

      const bType = activityBusinessType;
      setBusinessType(bType);

      if (bType === "Manufacturing") {
        const { data } = await supabase
          .from("logs_structure_manufacturing")
          .select("*");
        setMfgLogs(data || []);
      } else {
        const { data } = await supabase.from("logs_structure").select("*");
        if (data) {
          const grouped: Record<string, LogStructure> = {};
          data.forEach((row) => {
            if (!grouped[row.log_name]) {
              grouped[row.log_name] = {
                log_name: row.log_name,
                related_process_step: row.related_process_step,
                fields: [],
              };
            }
            grouped[row.log_name].fields.push(row.field_name);
          });
          setLogStructures(Object.values(grouped));
        }
      }

      // Load custom log structures
      const { data: customLogs } = await supabase
        .from("custom_log_structures" as any)
        .select("*")
        .eq("organization_id", profile.organization_id!)
        .eq("branch_id", profile.branch_id!);

      if (customLogs && customLogs.length > 0) {
        const customStructures: LogStructure[] = (customLogs as any[]).map((cl: any) => ({
          log_name: cl.log_name,
          related_process_step: cl.related_process_step,
          fields: Array.isArray(cl.fields) ? cl.fields : [],
          isCustom: true,
          customId: cl.id,
        }));
        setLogStructures((prev) => [...prev, ...customStructures]);
      }

      // Load branch equipment for dropdowns
      const { data: eqData } = await supabase
        .from("equipment" as any)
        .select("id, equipment_name, status")
        .eq("organization_id", profile.organization_id!)
        .eq("branch_id", profile.branch_id!)
        .eq("status", "Active");
      setBranchEquipment((eqData || []) as unknown as BranchEquipment[]);

      setLoading(false);
    };

    load();
  }, [authLoading, activityLoading, profile, activityBusinessType]);

  // Show sync notification when plan was just updated
  useEffect(() => {
    if (planJustUpdated) {
      toast.info("Your HACCP plan has changed. System updated related logs and procedures.", { duration: 5000 });
    }
  }, [planJustUpdated]);

  // Filter logs by activity and plan
  const filteredLogStructures = useMemo(() => {
    let base = logStructures;

    if (isBasicPlan) {
      base = base.filter((log) => {
        if (log.isCustom) return true;
        return BASIC_ALLOWED_LOGS.has(log.log_name) && !BASIC_HIDDEN_LOGS.has(log.log_name);
      });
    } else if (isHACCPPlan) {
      base = base.filter((log) => {
        if (log.isCustom) return true;
        return HACCP_ALLOWED_LOGS.has(log.log_name);
      });
    }

    if (showAllLibrary || !activityName) {
      return base;
    }
    const processNames = planProcessNames.length > 0 ? planProcessNames : activityProcesses;
    if (processNames.length === 0) return base;

    return base.filter((log) => {
      if (log.isCustom) return true;
      if (!log.related_process_step) return true;
      return processNames.some((p) =>
        log.related_process_step?.toLowerCase().includes(p.toLowerCase())
      );
    });
  }, [logStructures, showAllLibrary, activityName, activityProcesses, planProcessNames, isBasicPlan, isHACCPPlan]);

  const logNames = useMemo(() => {
    if (businessType === "Manufacturing") {
      return [...new Set(mfgLogs.map((l) => l.log_name))].sort();
    }
    return filteredLogStructures.map((l) => l.log_name).sort();
  }, [businessType, filteredLogStructures, mfgLogs]);

  const allLogNames = useMemo(() => {
    if (businessType === "Manufacturing") {
      return [...new Set(mfgLogs.map((l) => l.log_name))].sort();
    }
    let base = logStructures;
    if (isBasicPlan) {
      base = base.filter((l) => l.isCustom || (BASIC_ALLOWED_LOGS.has(l.log_name) && !BASIC_HIDDEN_LOGS.has(l.log_name)));
    } else if (isHACCPPlan) {
      base = base.filter((l) => l.isCustom || HACCP_ALLOWED_LOGS.has(l.log_name));
    }
    return base.map((l) => l.log_name).sort();
  }, [businessType, logStructures, mfgLogs, isBasicPlan]);

  const selectedFields = useMemo(() => {
    if (!selectedLog) return [];
    if (businessType === "Manufacturing") {
      const log = mfgLogs.find((l) => l.log_name === selectedLog);
      if (!log) return [];
      return ["Date", "Time", log.parameter || "Measurement", log.unit ? `Value (${log.unit})` : "Value", "Staff", "Notes"];
    }
    const log = logStructures.find((l) => l.log_name === selectedLog);
    return log?.fields || [];
  }, [selectedLog, businessType, logStructures, mfgLogs]);

  const selectedProcessStep = useMemo(() => {
    if (!selectedLog) return null;
    if (businessType === "Manufacturing") {
      return mfgLogs.find((l) => l.log_name === selectedLog)?.process_step_id?.toString() || null;
    }
    return logStructures.find((l) => l.log_name === selectedLog)?.related_process_step || null;
  }, [selectedLog, businessType, logStructures, mfgLogs]);

  const isCCPLog = useMemo(
    () =>
      ccpLogNames.some((n) => selectedLog.toLowerCase().includes(n.toLowerCase())) ||
      selectedLog.toLowerCase().includes("ccp"),
    [selectedLog, ccpLogNames]
  );

  const openForm = (logName: string) => {
    if (isBasicPlan && !BASIC_ALLOWED_LOGS.has(logName) && !logStructures.find(l => l.log_name === logName && l.isCustom)) {
      toast.error("This log is not available on your current plan");
      return;
    }
    setSelectedLog(logName);
    const today = new Date().toISOString().split("T")[0];
    const now = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
    setFormData({ Date: today, Time: now });
    setFormStatus("OK");
    setViewMode("form");
  };

  const handleSave = async () => {
    if (!profile?.organization_id || !profile?.branch_id) return;
    setSaving(true);

    const { error } = await supabase.from("log_entries" as any).insert({
      organization_id: profile.organization_id,
      branch_id: profile.branch_id,
      log_name: selectedLog,
      process_step: selectedProcessStep,
      data: formData,
      status: formStatus,
      recorded_by: profile.user_id,
    } as any);

    setSaving(false);

    if (error) {
      toast.error("Failed to save log entry");
      console.error(error);
    } else {
      toast.success("Log entry saved");
      setViewMode("list");
    }
  };

  const loadEntries = async () => {
    if (!profile?.organization_id) return;
    setEntriesLoading(true);

    let query = supabase
      .from("log_entries" as any)
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("branch_id", profile.branch_id!)
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterLogType && filterLogType !== "all") {
      query = query.eq("log_name", filterLogType);
    }
    if (filterStatus && filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    let result = (data || []) as unknown as LogEntry[];

    if (filterDate) {
      result = result.filter((e) => e.created_at.startsWith(filterDate));
    }

    setEntries(result);
    setEntriesLoading(false);
    setViewMode("entries");
  };

  const handleDeleteCustomLog = async () => {
    if (!deleteTarget?.customId) return;
    const { error } = await supabase
      .from("custom_log_structures" as any)
      .delete()
      .eq("id", deleteTarget.customId);

    if (error) {
      toast.error("Failed to delete custom log");
      console.error(error);
    } else {
      toast.success(`"${deleteTarget.log_name}" deleted`);
      setLogStructures((prev) => prev.filter((l) => !(l.isCustom && l.customId === deleteTarget.customId)));
    }
    setDeleteTarget(null);
  };

  const openAddDialog = () => {
    setAddMode(null);
    setCustomLogName("");
    setCustomLogFields("");
    setCustomLogProcess("");
    const currentNames = new Set(logNames);
    let available = logStructures.filter((l) => !currentNames.has(l.log_name));
    if (isBasicPlan) {
      available = available.filter((l) => BASIC_ALLOWED_LOGS.has(l.log_name) && !BASIC_HIDDEN_LOGS.has(l.log_name));
    }
    setLibraryLogs(available);
    setAddDialogOpen(true);
  };

  const addFromLibrary = (log: LogStructure) => {
    setShowAllLibrary(true);
    setAddDialogOpen(false);
    toast.success(`"${log.log_name}" is now visible`);
  };

  const addCustomLog = async () => {
    if (!customLogName.trim() || !profile?.organization_id || !profile?.branch_id) return;
    setAddSaving(true);

    const fields = customLogFields
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);
    if (fields.length === 0) fields.push("Date", "Time", "Value", "Notes");

    const { data: inserted, error } = await supabase.from("custom_log_structures" as any).insert({
      organization_id: profile.organization_id,
      branch_id: profile.branch_id,
      log_name: customLogName.trim(),
      fields,
      related_process_step: customLogProcess || null,
    } as any).select("id").single();

    setAddSaving(false);

    if (error) {
      toast.error("Failed to create custom log");
      console.error(error);
    } else {
      toast.success("Custom log created");
      setLogStructures((prev) => [
        ...prev,
        {
          log_name: customLogName.trim(),
          related_process_step: customLogProcess || null,
          fields,
          isCustom: true,
          customId: (inserted as any)?.id,
        },
      ]);
      setAddDialogOpen(false);
    }
  };

  if (authLoading || loading || activityLoading || planLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Monitoring Logs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Record and view daily food safety logs
              {activityName && (
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {activityName}
                </Badge>
              )}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            {viewMode !== "list" && (
              <Button variant="outline" size="sm" onClick={() => setViewMode("list")}>
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            {viewMode === "list" && (
              <Button variant="outline" size="sm" onClick={loadEntries}>
                <Filter className="w-4 h-4 mr-1" />
                View Entries
              </Button>
            )}
          </div>
        </div>

        <PrintDialog
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          onSelect={(mode: PrintMode) => {
            const targetLogs = selectedLog ? [selectedLog] : logNames;

            const getFieldsForLog = (name: string) => {
              if (businessType === "Manufacturing") {
                const log = mfgLogs.find(l => l.log_name === name);
                return log ? ["Date", "Time", log.parameter || "Measurement", log.unit ? `Value (${log.unit})` : "Value", "Staff", "Status", "Notes"] : ["Date", "Time", "Value", "Status", "Notes"];
              }
              const log = logStructures.find(l => l.log_name === name);
              return [...(log?.fields || []), "Status"];
            };

            if (mode === "blank") {
              let html = "";
              targetLogs.forEach(name => {
                html += `<p class="section-title">${escapeHtml(name)}</p>${blankTable(getFieldsForLog(name), 10)}`;
              });
              openPrintWindow(printHeader, html);
            } else {
              const printEntries = async () => {
                let query = supabase
                  .from("log_entries" as any)
                  .select("*")
                  .eq("organization_id", profile!.organization_id!)
                  .eq("branch_id", profile!.branch_id!)
                  .order("created_at", { ascending: false })
                  .limit(100);

                if (selectedLog) {
                  query = query.eq("log_name", selectedLog);
                }

                const { data } = await query;
                const result = (data || []) as unknown as LogEntry[];

                if (result.length === 0) {
                  toast.info("No entries found to print");
                  return;
                }

                let rows = "";
                result.forEach(e => {
                  const details = Object.entries(e.data || {}).filter(([k]) => k !== "Date" && k !== "Time").map(([k, v]) => `${k}: ${v}`).join(", ");
                  rows += `<tr><td>${new Date(e.created_at).toLocaleDateString()}</td><td>${escapeHtml(e.log_name)}</td><td>${escapeHtml(e.process_step || "—")}</td><td><span class="badge ${e.status === "Not OK" ? "badge-notok" : "badge-ok"}">${e.status || "OK"}</span></td><td>${escapeHtml(details || "—")}</td></tr>`;
                });
                openPrintWindow(printHeader, `<table><thead><tr><th>Date</th><th>Log</th><th>Process</th><th>Status</th><th>Details</th></tr></thead><tbody>${rows}</tbody></table>`);
              };
              printEntries();
            }
          }}
          title="Print Monitoring Logs"
        />

        {/* Log Selection */}
        {viewMode === "list" && (
          <>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                {activityName && (
                  <div className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-muted-foreground" />
                    <Label htmlFor="show-all-logs" className="text-sm text-muted-foreground cursor-pointer">
                      Show All Library
                    </Label>
                    <Switch
                      id="show-all-logs"
                      checked={showAllLibrary}
                      onCheckedChange={setShowAllLibrary}
                    />
                  </div>
                )}
              </div>
              {!isStaffPreview && (
                <Button size="sm" onClick={openAddDialog} className="gap-1.5">
                  <Plus className="w-4 h-4" />
                  Add Item
                </Button>
              )}
            </div>

            {logNames.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-16 gap-3">
                  <ClipboardList className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No log structures found. Complete the Setup Wizard first.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {logNames.map((name) => {
                  const isCCP = ccpLogNames.some((n) =>
                    name.toLowerCase().includes(n.toLowerCase())
                  ) || name.toLowerCase().includes("ccp");
                  const logStruct = logStructures.find((l) => l.log_name === name);
                  const isCustom = logStruct?.isCustom;
                  return (
                    <Card
                      key={name}
                      className={`cursor-pointer hover:shadow-md transition-shadow ${
                        isCCP ? "border-l-4 border-l-destructive" : ""
                      }`}
                      onClick={() => openForm(name)}
                    >
                      <CardContent className="flex items-center gap-3 pt-5 pb-4">
                        <div className={`p-2 rounded-lg ${isCCP ? "bg-destructive/10" : "bg-primary/10"}`}>
                          {isCCP ? (
                            <AlertTriangle className="w-5 h-5 text-destructive" />
                          ) : (
                            <ClipboardList className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">{name}</p>
                          <div className="flex gap-1 mt-1">
                            {isCCP && (
                              <Badge variant="destructive" className="text-[10px]">
                                CCP Related
                              </Badge>
                            )}
                            <Badge variant={isCustom ? "outline" : "secondary"} className="text-[10px]">
                              {isCustom ? "Custom" : "System"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {isCustom && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeleteTarget(logStruct!);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Plus className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Log Entry Form */}
        {viewMode === "form" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-primary" />
                {selectedLog}
                {isCCPLog && (
                  <Badge variant="destructive" className="text-[10px]">CCP</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedFields.map((field) => (
                  <div key={field} className="space-y-1.5">
                    <Label className="text-sm">{field}</Label>
                    {field === "Notes" || field === "Findings" || field.includes("Action") ? (
                      <Textarea
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                        placeholder={`Enter ${field.toLowerCase()}`}
                        rows={2}
                      />
                    ) : field === "Date" ? (
                      <Input
                        type="date"
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                      />
                    ) : field === "Time" ? (
                      <Input
                        type="time"
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                      />
                    ) : (field.toLowerCase().includes("equipment") || field.toLowerCase().includes("unit name") || field.toLowerCase().includes("fridge") || field.toLowerCase().includes("freezer")) && branchEquipment.length > 0 ? (
                      <Select
                        value={formData[field] || ""}
                        onValueChange={(val) =>
                          setFormData((prev) => ({ ...prev, [field]: val }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select equipment..." />
                        </SelectTrigger>
                        <SelectContent>
                          {branchEquipment.map((eq) => (
                            <SelectItem key={eq.id} value={eq.equipment_name}>
                              {eq.equipment_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={formData[field] || ""}
                        onChange={(e) =>
                          setFormData((prev) => ({ ...prev, [field]: e.target.value }))
                        }
                        placeholder={`Enter ${field.toLowerCase()}`}
                      />
                    )}
                  </div>
                ))}

                {/* Status field */}
                <div className="space-y-1.5">
                  <Label className="text-sm">Status</Label>
                  <Select value={formStatus} onValueChange={setFormStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OK">OK</SelectItem>
                      <SelectItem value="Not OK">Not OK</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formStatus === "Not OK" && isCCPLog && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="text-sm font-medium text-destructive flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    CCP Deviation Detected — Corrective action required
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save Entry
                </Button>
                <Button variant="outline" onClick={() => setViewMode("list")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* View Entries */}
        {viewMode === "entries" && (
          <>
            <Card>
              <CardContent className="pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-sm">Date</Label>
                    <Input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Log Type</Label>
                    <Select value={filterLogType} onValueChange={setFilterLogType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All logs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Logs</SelectItem>
                        {allLogNames.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-sm">Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder="All statuses" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="OK">OK</SelectItem>
                        <SelectItem value="Not OK">Not OK</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="mt-3" onClick={loadEntries}>
                  <Filter className="w-4 h-4 mr-1" />
                  Apply Filters
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                {entriesLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : entries.length === 0 ? (
                  <div className="flex flex-col items-center py-12 gap-2">
                    <ClipboardList className="w-8 h-8 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No entries found</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Log</TableHead>
                          <TableHead>Process</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Details</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entries.map((entry) => {
                          const isCCP =
                            ccpLogNames.some((n) =>
                              entry.log_name.toLowerCase().includes(n.toLowerCase())
                            ) || entry.log_name.toLowerCase().includes("ccp");
                          const isDeviation = entry.status === "Not OK";
                          return (
                            <TableRow
                              key={entry.id}
                              className={isDeviation && isCCP ? "bg-destructive/5" : ""}
                            >
                              <TableCell className="text-sm whitespace-nowrap">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-sm">{entry.log_name}</span>
                                  {isCCP && (
                                    <Badge variant="destructive" className="text-[10px]">
                                      CCP
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {entry.process_step || "—"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={isDeviation ? "destructive" : "outline"}
                                  className="text-xs"
                                >
                                  {entry.status || "OK"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">
                                {Object.entries(entry.data || {})
                                  .filter(([k]) => k !== "Date" && k !== "Time")
                                  .map(([k, v]) => `${k}: ${v}`)
                                  .join(", ") || "—"}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}

        {/* Hidden file input for Excel upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.txt"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file || !profile?.organization_id || !profile?.branch_id) return;
            setUploadingExcel(true);
            try {
              const text = await file.text();
              const rows = parseCsvToEntries(text);
              if (rows.length === 0) {
                toast.error("No valid data found in the file");
                setUploadingExcel(false);
                return;
              }
              const logName = file.name.replace(/\.(csv|txt)$/i, "").replace(/[_-]/g, " ").trim() || "Uploaded Log";
              const fields = Object.keys(rows[0]);
              const { data: inserted, error: structError } = await supabase.from("custom_log_structures" as any).insert({
                organization_id: profile.organization_id,
                branch_id: profile.branch_id,
                log_name: logName,
                fields,
                related_process_step: null,
              } as any).select("id").single();

              if (structError) throw structError;

              const entriesToInsert = rows.map(row => ({
                organization_id: profile.organization_id!,
                branch_id: profile.branch_id!,
                log_name: logName,
                data: row,
                status: row["Status"] || "OK",
                recorded_by: profile.user_id,
              }));
              const { error: entryError } = await supabase.from("log_entries" as any).insert(entriesToInsert as any);
              if (entryError) throw entryError;

              setLogStructures((prev) => [
                ...prev,
                { log_name: logName, related_process_step: null, fields, isCustom: true, customId: (inserted as any)?.id },
              ]);
              toast.success(`Imported "${logName}" with ${rows.length} entries`);
              setAddDialogOpen(false);
            } catch (err: any) {
              toast.error("Upload failed: " + (err.message || "Unknown error"));
            }
            setUploadingExcel(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        />

        {/* Add Item Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add Log</DialogTitle>
              <DialogDescription>
                {isBasicPlan
                  ? "Create a custom log or upload from Excel."
                  : "Select from the library or create a custom log."}
              </DialogDescription>
            </DialogHeader>

            {!addMode && (
              <div className={`grid ${isBasicPlan ? "grid-cols-1 gap-2" : "grid-cols-2 gap-3"} py-4`}>
                {/* Library option — blocked for Basic */}
                {isBasicPlan ? (
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors border-dashed opacity-70"
                    onClick={() => navigate("/app/pricing")}
                  >
                    <CardContent className="flex items-center gap-3 py-4 px-4">
                      <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">From Library</span>
                        <p className="text-xs text-muted-foreground">
                          Upgrade to HACCP Plan to access pre-built food safety logs
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setAddMode("library")}
                  >
                    <CardContent className="flex flex-col items-center gap-2 py-6">
                      <Library className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">From Library</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Select from system logs
                      </span>
                    </CardContent>
                  </Card>
                )}
                {!isBasicPlan && (
                  <Card
                    className="cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => setAddMode("custom")}
                  >
                    <CardContent className="flex flex-col items-center gap-2 py-6">
                      <PenLine className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Create Custom</span>
                      <span className="text-xs text-muted-foreground text-center">
                        Build your own log
                      </span>
                    </CardContent>
                  </Card>
                )}
                {/* Basic Plan: Direct Excel upload options */}
                {isBasicPlan && (
                  <div className="col-span-full space-y-3">
                    <Card
                      className="cursor-pointer hover:border-primary/50 transition-colors border-primary/30"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <CardContent className="flex items-center gap-3 py-5 px-4">
                        {uploadingExcel ? (
                          <Loader2 className="w-6 h-6 text-primary shrink-0 animate-spin" />
                        ) : (
                          <Upload className="w-6 h-6 text-primary shrink-0" />
                        )}
                        <div>
                          <span className="text-sm font-semibold">Upload Excel / CSV File</span>
                          <p className="text-xs text-muted-foreground">
                            Upload your file — a new log will be created instantly
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                    <p className="text-xs text-muted-foreground text-center">
                      Use our template if your file format is not supported.{" "}
                      <button
                        type="button"
                        className="text-primary underline underline-offset-2 hover:text-primary/80 font-medium"
                        onClick={() => {
                          const csv = generateExcelTemplate();
                          const blob = new Blob([csv], { type: "text/csv" });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "log_template.csv";
                          a.click();
                          URL.revokeObjectURL(url);
                          toast.success("Template downloaded");
                        }}
                      >
                        Download Template
                      </button>
                    </p>
                  </div>
                )}
              </div>
            )}

            {addMode === "library" && (
              <div className="space-y-2 max-h-60 overflow-y-auto py-2">
                {libraryLogs.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All library logs are already visible.
                  </p>
                ) : (
                  libraryLogs.map((log) => (
                    <button
                      key={log.log_name}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                      onClick={() => addFromLibrary(log)}
                    >
                      {log.log_name}
                      {log.related_process_step && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({log.related_process_step})
                        </span>
                      )}
                    </button>
                  ))
                )}
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAddMode(null)}>
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back
                </Button>
              </div>
            )}

            {addMode === "custom" && !isBasicPlan && (
              <div className="space-y-4 py-2">
                {/* Excel download/upload options */}
                <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Or use Excel</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        const csv = generateExcelTemplate();
                        const blob = new Blob([csv], { type: "text/csv" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = "log_template.csv";
                        a.click();
                        URL.revokeObjectURL(url);
                        toast.success("Template downloaded");
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Template
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      disabled={uploadingExcel}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingExcel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      Upload CSV
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Fill the template then upload. Columns: Date, Staff, Equipment, Value, Status, Notes
                  </p>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                  <div className="relative flex justify-center text-xs"><span className="bg-background px-2 text-muted-foreground">or create manually</span></div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-sm">Log Name</Label>
                  <Input
                    value={customLogName}
                    onChange={(e) => setCustomLogName(e.target.value)}
                    placeholder="e.g. Oil Quality Log"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Fields (comma-separated)</Label>
                  <Input
                    value={customLogFields}
                    onChange={(e) => setCustomLogFields(e.target.value)}
                    placeholder="Date, Time, Temperature, Notes"
                  />
                  <p className="text-xs text-muted-foreground">
                    Leave empty for default fields (Date, Time, Value, Notes)
                  </p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Related Process (optional)</Label>
                  {planProcessNames.length > 0 ? (
                    <Select value={customLogProcess} onValueChange={setCustomLogProcess}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select process..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {planProcessNames.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={customLogProcess}
                      onChange={(e) => setCustomLogProcess(e.target.value)}
                      placeholder="e.g. Cooking"
                    />
                  )}
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setAddMode(null)}>
                    <ArrowLeft className="w-3 h-3 mr-1" /> Back
                  </Button>
                  <Button onClick={addCustomLog} disabled={!customLogName.trim() || addSaving}>
                    {addSaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    Create Log
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Custom Log</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTarget?.log_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCustomLog} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default Logs;
