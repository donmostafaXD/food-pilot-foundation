import { useEffect, useState, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useActivityFilter } from "@/hooks/useActivityFilter";
import { usePlan } from "@/hooks/usePlan";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { Loader2, Search, ArrowLeft, BookOpen, Printer, Plus, Library, PenLine, Eye, Trash2 } from "lucide-react";
import { toast } from "sonner";
import PrintDialog, { type PrintMode } from "@/components/PrintDialog";
import { usePrintHeader } from "@/hooks/usePrintHeader";
import { openPrintWindow, blankTable, escapeHtml } from "@/lib/printUtils";

interface SOPItem {
  id: number | string;
  sop_name: string;
  process_step: string;
  description: string | null;
  procedure_text: string | null;
  responsible: string | null;
  category: "Food Service" | "Manufacturing" | "Custom";
  process_step_id?: number;
  isCustom?: boolean;
  customId?: string;
  _purpose?: string;
  _scope?: string;
  _frequency?: string;
  _related_prp?: string;
}

interface FoodSafetySetupItem {
  category: string;
  item_name: string;
  item_value: string | null;
}

const SOPPage = () => {
  const { profile, roles } = useAuth();
  const { plan } = usePlan();
  const isSuperAdmin = roles.includes("super_admin" as any);
  const { activityName, activityProcesses, planProcessNames, businessType: activityBusinessType, planJustUpdated, loading: activityLoading } = useActivityFilter();
  const [loading, setLoading] = useState(true);
  const [sops, setSOPs] = useState<SOPItem[]>([]);
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [filterProcess, setFilterProcess] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedSOP, setSelectedSOP] = useState<SOPItem | null>(null);
  const [printOpen, setPrintOpen] = useState(false);
  const [showAllLibrary, setShowAllLibrary] = useState(false);
  const printHeader = usePrintHeader("SOP Procedures");

  // Add Item dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addMode, setAddMode] = useState<"library" | "custom" | null>(null);
  const [customName, setCustomName] = useState("");
  const [customProcess, setCustomProcess] = useState("");
  const [customProcedure, setCustomProcedure] = useState("");
  const [customResponsible, setCustomResponsible] = useState("");
  const [addSaving, setAddSaving] = useState(false);

  // Delete dialog
  const [deleteTarget, setDeleteTarget] = useState<SOPItem | null>(null);

  useEffect(() => {
    if (activityLoading) return;
    loadSOPs();
  }, [activityLoading]);

  // Show sync notification when plan was just updated
  useEffect(() => {
    if (planJustUpdated) {
      toast.info("Your HACCP plan has changed. System updated related SOP procedures.", { duration: 5000 });
    }
  }, [planJustUpdated]);

  const loadSOPs = async () => {
    setLoading(true);

    // Load from new sop_master table (primary), plus legacy tables as fallback
    const [{ data: masterData }, { data: foodService }, { data: manufacturing }] = await Promise.all([
      supabase.from("sop_master" as any).select("*"),
      supabase.from("sop_library").select("*"),
      supabase.from("sop_library_manufacturing").select("*"),
    ]);

    let customData: any[] = [];
    if (profile?.organization_id && profile?.branch_id) {
      const { data } = await supabase
        .from("custom_sop_items" as any)
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("branch_id", profile.branch_id);
      customData = (data || []) as any[];
    }

    const items: SOPItem[] = [];
    const addedNames = new Set<string>();

    // Prefer sop_master (richer data with Purpose, Scope, Related_PRP)
    if (masterData && (masterData as any[]).length > 0) {
      (masterData as any[]).forEach((s: any) => {
        addedNames.add(s.sop_name.toLowerCase());
        items.push({
          id: s.id,
          sop_name: s.sop_name,
          process_step: s.process_step,
          description: s.purpose || s.procedure_text,
          procedure_text: s.procedure_text,
          responsible: s.responsible,
          category: "Food Service",
          _purpose: s.purpose,
          _scope: s.scope,
          _frequency: s.frequency,
          _related_prp: s.related_prp,
        } as any);
      });
    }

    // Add legacy Food Service SOPs not already in master
    (foodService || []).forEach((s: any) => {
      if (addedNames.has(s.sop_title.toLowerCase())) return;
      items.push({
        id: s.id,
        sop_name: s.sop_title,
        process_step: s.process_step,
        description: s.procedure_text,
        procedure_text: s.procedure_text,
        responsible: s.responsible,
        category: "Food Service",
      });
    });

    (manufacturing || []).forEach((s: any) => {
      items.push({
        id: s.id + 10000,
        sop_name: s.sop_name,
        process_step: `Step #${s.process_step_id}`,
        description: s.description,
        procedure_text: s.description,
        responsible: null,
        category: "Manufacturing",
        process_step_id: s.process_step_id,
      });
    });

    (customData as any[]).forEach((s: any) => {
      items.push({
        id: s.id,
        sop_name: s.sop_name,
        process_step: s.process_step,
        description: s.procedure_text,
        procedure_text: s.procedure_text,
        responsible: s.responsible,
        category: "Custom",
        isCustom: true,
        customId: s.id,
      });
    });

    setSOPs(items);
    setLoading(false);
  };

  // Dynamic filtering: driven entirely by HACCP plan process steps and sop_master data
  const activityFiltered = useMemo(() => {
    let base = sops;

    // Basic plan: exclude Manufacturing category SOPs
    if (plan === "basic") {
      base = base.filter((s) => {
        if (s.isCustom) return true;
        return s.category !== "Manufacturing";
      });
    }

    // For all plans: filter by HACCP plan process steps (database-driven)
    if (showAllLibrary || !activityName) return base;
    const processNames = planProcessNames.length > 0 ? planProcessNames : activityProcesses;
    if (processNames.length === 0) return base;

    return base.filter((s) => {
      if (s.isCustom) return true;
      // Match SOP process_step against HACCP plan process names
      return processNames.some((p) =>
        s.process_step.toLowerCase().includes(p.toLowerCase())
      );
    });
  }, [sops, showAllLibrary, activityName, activityProcesses, planProcessNames, plan]);

  const processSteps = [...new Set(activityFiltered.map((s) => s.process_step))].sort();

  const filtered = activityFiltered.filter((s) => {
    if (search && !s.sop_name.toLowerCase().includes(search.toLowerCase()) && !s.process_step.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProcess !== "all" && s.process_step !== filterProcess) return false;
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    return true;
  });

  // Library SOPs not currently shown (for add from library)
  const libraryHidden = useMemo(() => {
    if (!activityName) return [];
    const shownNames = new Set(activityFiltered.map((s) => `${s.category}-${s.id}`));
    return sops.filter((s) => !s.isCustom && !shownNames.has(`${s.category}-${s.id}`));
  }, [sops, activityFiltered, activityName]);

  const openAddDialog = () => {
    setAddMode(null);
    setCustomName("");
    setCustomProcess("");
    setCustomProcedure("");
    setCustomResponsible("");
    setAddDialogOpen(true);
  };

  const addFromLibrary = () => {
    setShowAllLibrary(true);
    setAddDialogOpen(false);
    toast.success("All library SOPs are now visible");
  };

  const addCustomSOP = async () => {
    if (!customName.trim() || !customProcess.trim() || !profile?.organization_id || !profile?.branch_id) return;
    setAddSaving(true);

    const { data: inserted, error } = await supabase.from("custom_sop_items" as any).insert({
      organization_id: profile.organization_id,
      branch_id: profile.branch_id,
      sop_name: customName.trim(),
      process_step: customProcess.trim(),
      procedure_text: customProcedure || null,
      responsible: customResponsible || null,
    } as any).select("id").single();

    setAddSaving(false);

    if (error) {
      toast.error("Failed to create custom SOP");
      console.error(error);
    } else {
      toast.success("Custom SOP created");
      const newId = (inserted as any)?.id || crypto.randomUUID();
      setSOPs((prev) => [
        ...prev,
        {
          id: newId,
          sop_name: customName.trim(),
          process_step: customProcess.trim(),
          description: customProcedure || null,
          procedure_text: customProcedure || null,
          responsible: customResponsible || null,
          category: "Custom",
          isCustom: true,
          customId: newId,
        },
      ]);
      setAddDialogOpen(false);
    }
  };

  // Delete custom SOP
  const handleDeleteCustomSOP = async () => {
    if (!deleteTarget?.customId) return;
    const { error } = await supabase
      .from("custom_sop_items" as any)
      .delete()
      .eq("id", deleteTarget.customId);

    if (error) {
      toast.error("Failed to delete custom SOP");
      console.error(error);
    } else {
      toast.success(`"${deleteTarget.sop_name}" deleted`);
      setSOPs((prev) => prev.filter((s) => !(s.isCustom && s.customId === deleteTarget.customId)));
    }
    setDeleteTarget(null);
  };

  if (loading || activityLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  const handlePrint = (mode: PrintMode) => {
    if (selectedSOP) {
      const header = { ...printHeader, documentTitle: selectedSOP.sop_name };
      if (mode === "blank") {
        openPrintWindow(header, `<p class="section-title">Procedure</p>${blankTable(["Step #", "Action", "Notes"], 12)}<p class="section-title">Sign-off</p>${blankTable(["Name", "Signature", "Date"], 3)}`);
      } else {
        const procedures = selectedSOP.procedure_text?.split(/\n|(?:\d+\.\s)/).filter(Boolean).map(s => s.trim()) || [];
        const procHtml = procedures.length > 0
          ? `<ol>${procedures.map(s => `<li style="margin:4px 0">${escapeHtml(s)}</li>`).join("")}</ol>`
          : `<p style="color:#999;font-style:italic">No procedure details available.</p>`;
        openPrintWindow(header, `<p class="section-title">Procedure</p>${procHtml}<p class="section-title">Related Process</p><p>${escapeHtml(selectedSOP.process_step)}</p>${selectedSOP.responsible ? `<p class="section-title">Responsible</p><p>${escapeHtml(selectedSOP.responsible)}</p>` : ""}`);
      }
      return;
    }
    if (mode === "blank") {
      openPrintWindow(printHeader, blankTable(["SOP Title", "Process Step", "Category", "Responsible"], 20));
    } else {
      let rows = "";
      filtered.forEach(s => {
        rows += `<tr><td>${escapeHtml(s.sop_name)}</td><td>${escapeHtml(s.process_step)}</td><td>${escapeHtml(s.category)}</td><td>${escapeHtml(s.responsible || "—")}</td></tr>`;
      });
      openPrintWindow(printHeader, `<table><thead><tr><th>SOP Title</th><th>Process Step</th><th>Category</th><th>Responsible</th></tr></thead><tbody>${rows}</tbody></table>`);
    }
  };

  if (selectedSOP) {
    const procedures = selectedSOP.procedure_text
      ? selectedSOP.procedure_text.split(/\n|(?:\d+\.\s)/).filter(Boolean).map((s) => s.trim())
      : [];

    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="sm" className="gap-1" onClick={() => setSelectedSOP(null)}>
              <ArrowLeft className="w-4 h-4" /> Back to list
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
          </div>
          <PrintDialog open={printOpen} onClose={() => setPrintOpen(false)} onSelect={handlePrint} title={`Print: ${selectedSOP.sop_name}`} />

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{selectedSOP.sop_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Related Process: {selectedSOP.process_step}</p>
                </div>
                <div className="flex gap-1">
                  <Badge variant={selectedSOP.isCustom ? "outline" : "secondary"}>
                    {selectedSOP.isCustom ? "Custom" : "System"}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Procedure</h3>
                {procedures.length > 0 ? (
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    {procedures.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-sm text-muted-foreground italic">No procedure details available.</p>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Critical Instructions</h3>
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <p className="text-sm text-foreground">
                    Follow all steps in order. Do not skip any procedure. Report deviations immediately to the responsible person.
                  </p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Hygiene & Safety Notes</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Wash hands before and after procedure</li>
                  <li>Wear appropriate PPE as required</li>
                  <li>Ensure work area is clean and sanitized</li>
                </ul>
              </div>

              {selectedSOP.responsible && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">Responsible</h3>
                  <p className="text-sm text-muted-foreground">{selectedSOP.responsible}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">SOP Procedures</h1>
            {activityName && (
              <p className="text-sm text-muted-foreground mt-1">
                Showing procedures for
                <Badge variant="secondary" className="ml-2 text-[10px]">
                  {activityName}
                </Badge>
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPrintOpen(true)}>
              <Printer className="w-4 h-4 mr-1" /> Print
            </Button>
            {plan !== "basic" && (
              <Button size="sm" onClick={openAddDialog} className="gap-1.5">
                <Plus className="w-4 h-4" />
                Add Item
              </Button>
            )}
          </div>
        </div>
        <PrintDialog open={printOpen} onClose={() => setPrintOpen(false)} onSelect={handlePrint} title="Print SOP Procedures" />

        {/* Activity toggle + Filters */}
        <div className="flex flex-col gap-4 mb-6">
          {activityName && plan !== "basic" && (
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-muted-foreground" />
              <Label htmlFor="show-all-sop" className="text-sm text-muted-foreground cursor-pointer">
                Show All Library
              </Label>
              <Switch
                id="show-all-sop"
                checked={showAllLibrary}
                onCheckedChange={setShowAllLibrary}
              />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search SOPs..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={filterProcess} onValueChange={setFilterProcess}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Process Step" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Processes</SelectItem>
                {processSteps.map((p) => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Food Service">Food Service</SelectItem>
                <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* SOP Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No SOPs found matching your filters.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((sop) => (
              <Card
                key={`${sop.category}-${sop.id}`}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setSelectedSOP(sop)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-foreground leading-tight">{sop.sop_name}</h3>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant={sop.isCustom ? "outline" : "secondary"} className="text-[10px]">
                        {sop.isCustom ? "Custom" : "System"}
                      </Badge>
                      {sop.isCustom && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTarget(sop);
                          }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{sop.process_step}</p>
                  {sop.responsible && (
                    <p className="text-xs text-muted-foreground mt-1">Responsible: {sop.responsible}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add Item Dialog */}
        <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Add SOP</DialogTitle>
              <DialogDescription>Select from the library or create a custom procedure.</DialogDescription>
            </DialogHeader>

            {!addMode && (
              <div className="grid grid-cols-2 gap-3 py-4">
                <Card
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setAddMode("library")}
                >
                  <CardContent className="flex flex-col items-center gap-2 py-6">
                    <Library className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium">From Library</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Select from system SOPs
                    </span>
                  </CardContent>
                </Card>
                <Card
                  className="cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => setAddMode("custom")}
                >
                  <CardContent className="flex flex-col items-center gap-2 py-6">
                    <PenLine className="w-6 h-6 text-primary" />
                    <span className="text-sm font-medium">Create Custom</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Write your own SOP
                    </span>
                  </CardContent>
                </Card>
              </div>
            )}

            {addMode === "library" && (
              <div className="space-y-2 max-h-60 overflow-y-auto py-2">
                {libraryHidden.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    All library SOPs are already visible.
                  </p>
                ) : (
                  <>
                    {libraryHidden.slice(0, 20).map((s) => (
                      <button
                        key={`${s.category}-${s.id}`}
                        className="w-full text-left px-3 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                        onClick={() => addFromLibrary()}
                      >
                        {s.sop_name}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({s.process_step})
                        </span>
                      </button>
                    ))}
                    {libraryHidden.length > 20 && (
                      <p className="text-xs text-muted-foreground text-center">
                        +{libraryHidden.length - 20} more — use "Show All Library" toggle
                      </p>
                    )}
                  </>
                )}
                <Button variant="ghost" size="sm" className="mt-2" onClick={() => setAddMode(null)}>
                  <ArrowLeft className="w-3 h-3 mr-1" /> Back
                </Button>
              </div>
            )}

            {addMode === "custom" && (
              <div className="space-y-4 py-2">
                <div className="space-y-1.5">
                  <Label className="text-sm">SOP Name</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Deep Fryer Oil Change"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Related Process Step</Label>
                  {planProcessNames.length > 0 ? (
                    <Select value={customProcess} onValueChange={setCustomProcess}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select process..." />
                      </SelectTrigger>
                      <SelectContent>
                        {planProcessNames.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      value={customProcess}
                      onChange={(e) => setCustomProcess(e.target.value)}
                      placeholder="e.g. Cooking"
                    />
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Procedure</Label>
                  <Textarea
                    value={customProcedure}
                    onChange={(e) => setCustomProcedure(e.target.value)}
                    placeholder="Step-by-step instructions..."
                    rows={4}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Responsible</Label>
                  <Input
                    value={customResponsible}
                    onChange={(e) => setCustomResponsible(e.target.value)}
                    placeholder="e.g. Kitchen Staff"
                  />
                </div>
                <DialogFooter className="gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setAddMode(null)}>
                    <ArrowLeft className="w-3 h-3 mr-1" /> Back
                  </Button>
                  <Button onClick={addCustomSOP} disabled={!customName.trim() || !customProcess.trim() || addSaving}>
                    {addSaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    Create SOP
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
              <AlertDialogTitle>Delete Custom SOP</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{deleteTarget?.sop_name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteCustomSOP} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
};

export default SOPPage;
