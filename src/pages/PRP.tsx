import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  Shield,
  ArrowLeft,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  ClipboardList,
  ExternalLink,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import PrintDialog, { type PrintMode } from "@/components/PrintDialog";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import { openPrintWindow, blankTable, escapeHtml } from "@/lib/printUtils";

interface PRPProgram {
  id: number;
  program_name: string;
  description: string | null;
  frequency: string | null;
  responsible: string | null;
  activity: string;
}

interface PRPRecord {
  id: string;
  program_name: string;
  date: string;
  status: string;
  notes: string | null;
  recorded_by: string | null;
  created_at: string;
}

type ViewMode = "list" | "detail" | "records";

// Map PRP programs to related log names
const programLogMap: Record<string, string> = {
  "Cleaning and Sanitation": "Cleaning Log",
  "Pest Control": "Pest Control Log",
  "Personal Hygiene": "Personal Hygiene Log",
  "Water Quality": "Water Quality Log",
  "Waste Management": "Waste Management Log",
  "Equipment Maintenance": "Equipment Maintenance Log",
};

const PRP = () => {
  const { profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const printHeader = usePrintHeader("PRP Programs");
  const [printOpen, setPrintOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [programs, setPrograms] = useState<PRPProgram[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<PRPProgram | null>(null);
  const [records, setRecords] = useState<PRPRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [notes, setNotes] = useState("");

  // Filters
  const [filterDate, setFilterDate] = useState("");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (authLoading) return;
    const load = async () => {
      setLoading(true);
      const { data } = await supabase.from("prp_programs").select("*").order("program_name");
      setPrograms(data || []);
      setLoading(false);
    };
    load();
  }, [authLoading]);

  const programNames = useMemo(
    () => [...new Set(programs.map((p) => p.program_name))].sort(),
    [programs]
  );

  const openDetail = (program: PRPProgram) => {
    setSelectedProgram(program);
    setNotes("");
    setViewMode("detail");
  };

  const markCompleted = async (status: "Completed" | "Not Completed") => {
    if (!profile?.organization_id || !profile?.branch_id || !selectedProgram) return;
    setSaving(true);

    const { error } = await supabase.from("prp_records" as any).insert({
      organization_id: profile.organization_id,
      branch_id: profile.branch_id,
      program_name: selectedProgram.program_name,
      date: new Date().toISOString().split("T")[0],
      status,
      notes: notes || null,
      recorded_by: profile.user_id,
    } as any);

    setSaving(false);
    if (error) {
      toast.error("Failed to save record");
      console.error(error);
    } else {
      toast.success(`Marked as ${status}`);
      setViewMode("list");
    }
  };

  const loadRecords = async () => {
    if (!profile?.organization_id) return;
    setRecordsLoading(true);

    let query = supabase
      .from("prp_records" as any)
      .select("*")
      .eq("organization_id", profile.organization_id)
      .eq("branch_id", profile.branch_id!)
      .order("created_at", { ascending: false })
      .limit(200);

    if (filterProgram && filterProgram !== "all") {
      query = query.eq("program_name", filterProgram);
    }
    if (filterStatus && filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    let result = (data || []) as unknown as PRPRecord[];

    if (filterDate) {
      result = result.filter((r) => r.date === filterDate);
    }

    setRecords(result);
    setRecordsLoading(false);
    setViewMode("records");
  };

  const getRelatedLog = (programName: string): string | null => {
    for (const [key, logName] of Object.entries(programLogMap)) {
      if (programName.toLowerCase().includes(key.toLowerCase())) return logName;
    }
    return null;
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-28 rounded-lg" />
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
            <h1 className="text-2xl font-bold text-foreground tracking-tight">PRP Programs</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage prerequisite programs and record daily compliance
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
              <Button variant="outline" size="sm" onClick={loadRecords}>
                <Filter className="w-4 h-4 mr-1" />
                View Records
              </Button>
            )}
          </div>
        </div>

        <PrintDialog
          open={printOpen}
          onClose={() => setPrintOpen(false)}
          onSelect={(mode: PrintMode) => {
            if (mode === "blank") {
              openPrintWindow(printHeader, `<p class="section-title">PRP Compliance Record</p>${blankTable(["Date", "Program", "Status", "Notes", "Recorded By"], 15)}`);
            } else {
              let rows = "";
              if (records.length > 0) {
                records.forEach(r => {
                  rows += `<tr><td>${r.date}</td><td>${escapeHtml(r.program_name)}</td><td><span class="badge ${r.status === "Completed" ? "badge-ok" : "badge-notok"}">${r.status}</span></td><td>${escapeHtml(r.notes || "—")}</td></tr>`;
                });
                openPrintWindow(printHeader, `<table><thead><tr><th>Date</th><th>Program</th><th>Status</th><th>Notes</th></tr></thead><tbody>${rows}</tbody></table>`);
              } else {
                // Print programs list
                programs.forEach(p => {
                  rows += `<tr><td>${escapeHtml(p.program_name)}</td><td>${escapeHtml(p.frequency || "—")}</td><td>${escapeHtml(p.responsible || "—")}</td><td>${escapeHtml(p.description || "—")}</td></tr>`;
                });
                openPrintWindow(printHeader, `<table><thead><tr><th>Program</th><th>Frequency</th><th>Responsible</th><th>Description</th></tr></thead><tbody>${rows}</tbody></table>`);
              }
            }
          }}
          title="Print PRP Programs"
        />

        {/* Program List */}
        {viewMode === "list" && (
          <>
            {programs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center py-16 gap-3">
                  <Shield className="w-8 h-8 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    No PRP programs found. Complete the Setup Wizard first.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {programs.map((program) => {
                  const relatedLog = getRelatedLog(program.program_name);
                  return (
                    <Card
                      key={program.id}
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openDetail(program)}
                    >
                      <CardContent className="pt-5 pb-4 space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Shield className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {program.program_name}
                            </p>
                            {program.frequency && (
                              <Badge variant="secondary" className="text-[10px] mt-1">
                                {program.frequency}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {program.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {program.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between pt-1">
                          {program.responsible && (
                            <span className="text-xs text-muted-foreground">
                              👤 {program.responsible}
                            </span>
                          )}
                          {relatedLog && (
                            <Badge
                              variant="outline"
                              className="text-[10px] cursor-pointer hover:bg-accent"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate("/logs");
                              }}
                            >
                              <ClipboardList className="w-3 h-3 mr-1" />
                              {relatedLog}
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* Program Detail + Checklist */}
        {viewMode === "detail" && selectedProgram && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                {selectedProgram.program_name}
              </CardTitle>
              {selectedProgram.description && (
                <CardDescription>{selectedProgram.description}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Program Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Frequency</Label>
                  <p className="text-sm font-medium text-foreground">
                    {selectedProgram.frequency || "Not specified"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Responsible</Label>
                  <p className="text-sm font-medium text-foreground">
                    {selectedProgram.responsible || "Not assigned"}
                  </p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Activity</Label>
                  <p className="text-sm font-medium text-foreground">{selectedProgram.activity}</p>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <p className="text-sm font-medium text-foreground">
                    {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Related Log Link */}
              {getRelatedLog(selectedProgram.program_name) && (
                <div className="p-3 rounded-lg bg-accent/50 border border-border">
                  <button
                    className="text-sm text-primary flex items-center gap-1.5 hover:underline"
                    onClick={() => navigate("/logs")}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open related log: {getRelatedLog(selectedProgram.program_name)}
                  </button>
                </div>
              )}

              {/* Notes */}
              <div className="space-y-1.5">
                <Label className="text-sm">Notes (optional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any observations or notes..."
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-2">
                <Button
                  onClick={() => markCompleted("Completed")}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  Mark as Completed
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => markCompleted("Not Completed")}
                  disabled={saving}
                  className="gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  Mark as Not Completed
                </Button>
                <Button variant="outline" onClick={() => setViewMode("list")}>
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Records View */}
        {viewMode === "records" && (
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
                    <Label className="text-sm">Program</Label>
                    <Select value={filterProgram} onValueChange={setFilterProgram}>
                      <SelectTrigger>
                        <SelectValue placeholder="All programs" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Programs</SelectItem>
                        {programNames.map((name) => (
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
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Not Completed">Not Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button size="sm" className="mt-3" onClick={loadRecords}>
                  <Filter className="w-4 h-4 mr-1" />
                  Apply Filters
                </Button>
              </CardContent>
            </Card>

            {/* Records Table */}
            <Card>
              <CardContent className="pt-5">
                {recordsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : records.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No records found
                  </p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Program</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {records.map((record) => (
                          <TableRow key={record.id}>
                            <TableCell className="text-sm">{record.date}</TableCell>
                            <TableCell className="text-sm font-medium">
                              {record.program_name}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  record.status === "Completed" ? "default" : "destructive"
                                }
                                className="text-[10px]"
                              >
                                {record.status === "Completed" ? (
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                ) : (
                                  <XCircle className="w-3 h-3 mr-1" />
                                )}
                                {record.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                              {record.notes || "—"}
                            </TableCell>
                          </TableRow>
                        ))}
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

export default PRP;
