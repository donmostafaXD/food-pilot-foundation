import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
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
  ClipboardList,
  Plus,
  ArrowLeft,
  Filter,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface LogStructure {
  log_name: string;
  related_process_step: string | null;
  fields: string[];
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

const Logs = () => {
  const { profile, loading: authLoading } = useAuth();
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

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterLogType, setFilterLogType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Equipment for dropdowns
  const [branchEquipment, setBranchEquipment] = useState<BranchEquipment[]>([]);

  // Detect business type from HACCP plan
  const [businessType, setBusinessType] = useState<string>("");

  // CCP-related log names for highlighting
  const ccpLogNames = useMemo(
    () => ["CCP Monitoring Log", "Corrective Action Log", "Cooking Temperature Log"],
    []
  );

  useEffect(() => {
    if (authLoading || !profile?.organization_id) return;

    const load = async () => {
      setLoading(true);

      // Get business type from latest HACCP plan
      const { data: plans } = await supabase
        .from("haccp_plans")
        .select("business_type")
        .eq("organization_id", profile.organization_id!)
        .eq("branch_id", profile.branch_id!)
        .order("created_at", { ascending: false })
        .limit(1);

      const bType = plans?.[0]?.business_type || "Food Service";
      setBusinessType(bType);

      if (bType === "Manufacturing") {
        const { data } = await supabase
          .from("logs_structure_manufacturing")
          .select("*");
        setMfgLogs(data || []);
      } else {
        const { data } = await supabase.from("logs_structure").select("*");
        if (data) {
          // Group by log_name
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
  }, [authLoading, profile]);

  // Available log names
  const logNames = useMemo(() => {
    if (businessType === "Manufacturing") {
      return [...new Set(mfgLogs.map((l) => l.log_name))].sort();
    }
    return logStructures.map((l) => l.log_name).sort();
  }, [businessType, logStructures, mfgLogs]);

  // Get fields for selected log
  const selectedFields = useMemo(() => {
    if (!selectedLog) return [];
    if (businessType === "Manufacturing") {
      const log = mfgLogs.find((l) => l.log_name === selectedLog);
      if (!log) return [];
      return [
        "Date",
        "Time",
        log.parameter || "Measurement",
        log.unit ? `Value (${log.unit})` : "Value",
        "Staff",
        "Notes",
      ];
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

  if (authLoading || loading) {
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
            </p>
          </div>
          <div className="flex gap-2">
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

        {/* Log Selection */}
        {viewMode === "list" && (
          <>
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
                          {isCCP && (
                            <Badge variant="destructive" className="text-[10px] mt-1">
                              CCP Related
                            </Badge>
                          )}
                        </div>
                        <Plus className="w-4 h-4 text-muted-foreground shrink-0" />
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
            {/* Filters */}
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
                        {logNames.map((name) => (
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

            {/* Entries Table */}
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
      </div>
    </DashboardLayout>
  );
};

export default Logs;
