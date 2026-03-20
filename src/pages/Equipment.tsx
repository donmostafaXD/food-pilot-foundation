import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissionGuard } from "@/hooks/usePermissionGuard";
import { useActivity } from "@/contexts/ActivityContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
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
} from "@/components/ui/dialog";
import {
  Wrench,
  Plus,
  Search,
  Edit2,
  Power,
  Loader2,
  PackagePlus,
} from "lucide-react";
import { toast } from "sonner";

interface LibraryItem {
  id: number;
  equipment_name: string;
  activity_type: string | null;
  related_process: string | null;
}

interface Equipment {
  id: string;
  equipment_name: string;
  type: string | null;
  location: string | null;
  status: string;
  created_at: string;
}

const Equipment = () => {
  const { profile, loading: authLoading } = useAuth();
  const guard = usePermissionGuard("equipment");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Add dialog
  const [showAdd, setShowAdd] = useState(false);
  const [addMode, setAddMode] = useState<"library" | "custom">("library");
  const [selectedLibrary, setSelectedLibrary] = useState("");
  const [customName, setCustomName] = useState("");
  const [addType, setAddType] = useState("");
  const [addLocation, setAddLocation] = useState("");
  const [saving, setSaving] = useState(false);

  // Edit dialog
  const [editItem, setEditItem] = useState<Equipment | null>(null);
  const [editName, setEditName] = useState("");
  const [editType, setEditType] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editStatus, setEditStatus] = useState("Active");

  const loadData = async () => {
    if (!profile?.organization_id) return;
    setLoading(true);

    const [eqRes, libRes] = await Promise.all([
      supabase
        .from("equipment" as any)
        .select("*")
        .eq("organization_id", profile.organization_id)
        .eq("branch_id", profile.branch_id!)
        .order("created_at", { ascending: false }),
      supabase.from("equipment_library").select("*"),
    ]);

    setEquipment((eqRes.data || []) as unknown as Equipment[]);
    setLibrary(libRes.data || []);
    setLoading(false);
  };

  useEffect(() => {
    if (!authLoading && profile?.organization_id) loadData();
  }, [authLoading, profile]);

  const filtered = useMemo(() => {
    if (!search) return equipment;
    const q = search.toLowerCase();
    return equipment.filter(
      (e) =>
        e.equipment_name.toLowerCase().includes(q) ||
        e.type?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q)
    );
  }, [equipment, search]);

  // Exclude already-added library items
  const availableLibrary = useMemo(() => {
    const existingNames = new Set(equipment.map((e) => e.equipment_name.toLowerCase()));
    return library.filter((l) => !existingNames.has(l.equipment_name.toLowerCase()));
  }, [library, equipment]);

  const handleAdd = async () => {
    if (!profile?.organization_id || !profile?.branch_id) return;
    const name = addMode === "library" ? selectedLibrary : customName.trim();
    if (!name) {
      toast.error("Please provide an equipment name");
      return;
    }

    setSaving(true);
    const libItem = library.find((l) => l.equipment_name === name);

    const { error } = await supabase.from("equipment" as any).insert({
      organization_id: profile.organization_id,
      branch_id: profile.branch_id,
      equipment_name: name,
      type: addType || libItem?.activity_type || null,
      location: addLocation || null,
      status: "Active",
    } as any);

    setSaving(false);
    if (error) {
      toast.error("Failed to add equipment");
      console.error(error);
    } else {
      toast.success("Equipment added");
      setShowAdd(false);
      resetAddForm();
      loadData();
    }
  };

  const resetAddForm = () => {
    setSelectedLibrary("");
    setCustomName("");
    setAddType("");
    setAddLocation("");
    setAddMode("library");
  };

  const handleEdit = async () => {
    if (!editItem) return;
    setSaving(true);

    const { error } = await supabase
      .from("equipment" as any)
      .update({
        equipment_name: editName,
        type: editType || null,
        location: editLocation || null,
        status: editStatus,
      } as any)
      .eq("id", editItem.id);

    setSaving(false);
    if (error) {
      toast.error("Failed to update equipment");
    } else {
      toast.success("Equipment updated");
      setEditItem(null);
      loadData();
    }
  };

  const toggleStatus = async (item: Equipment) => {
    const newStatus = item.status === "Active" ? "Out of Service" : "Active";
    const { error } = await supabase
      .from("equipment" as any)
      .update({ status: newStatus } as any)
      .eq("id", item.id);

    if (error) {
      toast.error("Failed to update status");
    } else {
      toast.success(`Equipment marked as ${newStatus}`);
      loadData();
    }
  };

  const openEdit = (item: Equipment) => {
    setEditItem(item);
    setEditName(item.equipment_name);
    setEditType(item.type || "");
    setEditLocation(item.location || "");
    setEditStatus(item.status);
  };

  if (authLoading || loading) {
    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 rounded-lg" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Equipment</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your branch equipment inventory
            </p>
          </div>
          {guard.canCreate && (
            <Button size="sm" onClick={() => setShowAdd(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Add Equipment
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search equipment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Equipment Table */}
        <Card className="shadow-sm">
          <CardContent className="pt-5">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="p-4 rounded-full bg-muted">
                  <Wrench className="w-8 h-8 text-muted-foreground" />
                </div>
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    {equipment.length === 0 ? "No equipment added yet" : "No results found"}
                  </p>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    {equipment.length === 0
                      ? "Start by adding equipment from the library or create a custom entry to track your branch inventory."
                      : "Try adjusting your search query."}
                  </p>
                </div>
                {equipment.length === 0 && guard.canCreate && (
                  <Button size="sm" onClick={() => setShowAdd(true)} className="mt-2 gap-1.5">
                    <Plus className="w-4 h-4" /> Add First Equipment
                  </Button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      {guard.canEdit && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium text-sm">
                          {item.equipment_name}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.type || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {item.location || "—"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${
                              item.status === "Active" ? "bg-accent" : "bg-destructive"
                            }`} />
                            <span className={`text-xs font-medium ${
                              item.status === "Active" ? "text-accent" : "text-destructive"
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        </TableCell>
                        {guard.canEdit && (
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEdit(item)}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => toggleStatus(item)}
                                title={item.status === "Active" ? "Deactivate" : "Activate"}
                              >
                                <Power
                                  className={`w-3.5 h-3.5 ${
                                    item.status === "Active"
                                      ? "text-muted-foreground"
                                      : "text-primary"
                                  }`}
                                />
                              </Button>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <div className="flex items-center justify-between pt-3 border-t border-border mt-2">
                  <span className="text-xs text-muted-foreground">
                    {filtered.length} item{filtered.length !== 1 ? "s" : ""}
                    {filtered.length !== equipment.length && ` (filtered from ${equipment.length})`}
                  </span>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-accent" /> {equipment.filter(e => e.status === "Active").length} Active</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-destructive" /> {equipment.filter(e => e.status !== "Active").length} Inactive</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add Dialog */}
        <Dialog open={showAdd} onOpenChange={setShowAdd}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-primary" />
                Add Equipment
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <Button
                  variant={addMode === "library" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAddMode("library")}
                >
                  From Library
                </Button>
                <Button
                  variant={addMode === "custom" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setAddMode("custom")}
                >
                  Custom
                </Button>
              </div>

              {addMode === "library" ? (
                <div className="space-y-1.5">
                  <Label>Select Equipment</Label>
                  <Select value={selectedLibrary} onValueChange={setSelectedLibrary}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose from library..." />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLibrary.map((item) => (
                        <SelectItem key={item.id} value={item.equipment_name}>
                          {item.equipment_name}
                          {item.related_process && ` (${item.related_process})`}
                        </SelectItem>
                      ))}
                      {availableLibrary.length === 0 && (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                          All library items already added
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label>Equipment Name</Label>
                  <Input
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="e.g. Walk-in Freezer #2"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Input
                    value={addType}
                    onChange={(e) => setAddType(e.target.value)}
                    placeholder="e.g. Refrigeration"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input
                    value={addLocation}
                    onChange={(e) => setAddLocation(e.target.value)}
                    placeholder="e.g. Kitchen Area"
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAdd(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editItem} onOpenChange={(open) => !open && setEditItem(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-primary" />
                Edit Equipment
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Type</Label>
                  <Input value={editType} onChange={(e) => setEditType(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Location</Label>
                  <Input value={editLocation} onChange={(e) => setEditLocation(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Out of Service">Out of Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleEdit} disabled={saving}>
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Equipment;
