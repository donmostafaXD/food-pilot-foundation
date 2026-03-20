import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Library, Upload, Loader2, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

interface LibraryDoc {
  id: number;
  document_name: string;
  description: string | null;
  responsible: string | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onAdded: () => void;
  /** IDs of documents already shown so we can exclude them from library */
  existingDocIds: Set<number>;
  activityName: string | null;
}

type Mode = null | "library" | "upload";

const AddDocumentModal = ({ open, onClose, onAdded, existingDocIds, activityName }: Props) => {
  const { profile } = useAuth();
  const [mode, setMode] = useState<Mode>(null);

  // Library mode
  const [libraryDocs, setLibraryDocs] = useState<LibraryDoc[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [librarySaving, setLibrarySaving] = useState(false);

  // Upload mode
  const [docName, setDocName] = useState("");
  const [docCategory, setDocCategory] = useState("FSMS");
  const [docResponsible, setDocResponsible] = useState("");
  const [docActivity, setDocActivity] = useState(activityName || "");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Reset state when opening
  useEffect(() => {
    if (open) {
      setMode(null);
      setSelected(new Set());
      setDocName("");
      setDocCategory("FSMS");
      setDocResponsible("");
      setDocActivity(activityName || "");
      setFile(null);
    }
  }, [open, activityName]);

  // Load library docs when switching to library mode
  useEffect(() => {
    if (mode !== "library") return;
    setLibraryLoading(true);
    (async () => {
      const [{ data: fsms }, { data: legacy }] = await Promise.all([
        supabase.from("fsms_documents").select("*").order("id"),
        supabase.from("document_library").select("*").order("id"),
      ]);
      const source = (fsms && fsms.length > 0) ? fsms : legacy || [];
      const available = source.filter((d: any) => !existingDocIds.has(d.id));
      setLibraryDocs(available as LibraryDoc[]);
      setLibraryLoading(false);
    })();
  }, [mode, existingDocIds]);

  const toggleDoc = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addFromLibrary = async () => {
    if (selected.size === 0) return;
    if (!profile?.organization_id || !profile?.branch_id) return;
    setLibrarySaving(true);

    const docsToAdd = libraryDocs.filter((d) => selected.has(d.id));
    const inserts = docsToAdd.map((d) => ({
      organization_id: profile.organization_id!,
      branch_id: profile.branch_id!,
      document_name: d.document_name,
      category: classifyForUpload(d.document_name),
      responsible: d.responsible,
      activity: activityName || null,
    }));

    const { error } = await supabase.from("uploaded_documents").insert(inserts as any);
    setLibrarySaving(false);

    if (error) {
      toast.error("Failed to add documents");
      console.error(error);
    } else {
      toast.success(`${selected.size} document(s) added`);
      onAdded();
      onClose();
    }
  };

  const handleUpload = async () => {
    if (!docName.trim() || !profile?.organization_id || !profile?.branch_id) return;
    setUploading(true);

    let filePath: string | null = null;
    let fileType: string | null = null;

    if (file) {
      const ext = file.name.split(".").pop() || "bin";
      const path = `${profile.organization_id}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(path, file);

      if (uploadError) {
        toast.error("File upload failed");
        console.error(uploadError);
        setUploading(false);
        return;
      }
      filePath = path;
      fileType = ext;
    }

    const { error } = await supabase.from("uploaded_documents").insert({
      organization_id: profile.organization_id,
      branch_id: profile.branch_id,
      document_name: docName.trim(),
      category: docCategory,
      responsible: docResponsible || null,
      activity: docActivity || null,
      file_path: filePath,
      file_type: fileType,
      uploaded_by: profile.user_id,
    } as any);

    setUploading(false);

    if (error) {
      toast.error("Failed to save document");
      console.error(error);
    } else {
      toast.success("Document uploaded successfully");
      onAdded();
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === null && "Add Document"}
            {mode === "library" && "Add from Library"}
            {mode === "upload" && "Upload Document"}
          </DialogTitle>
          <DialogDescription>
            {mode === null && "Choose how you'd like to add a document"}
            {mode === "library" && "Select documents from the system library to add"}
            {mode === "upload" && "Upload a file and provide document details"}
          </DialogDescription>
        </DialogHeader>

        {/* Mode selection */}
        {mode === null && (
          <div className="grid grid-cols-1 gap-3 py-2">
            <button
              onClick={() => setMode("library")}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="p-2.5 rounded-md bg-primary/10">
                <Library className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">From Library</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Add system documents not yet in your list
                </p>
              </div>
            </button>
            <button
              onClick={() => setMode("upload")}
              className="flex items-center gap-4 p-4 rounded-lg border border-border hover:border-primary/40 hover:bg-muted/50 transition-colors text-left"
            >
              <div className="p-2.5 rounded-md bg-primary/10">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-medium text-sm text-foreground">Upload Document</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Upload PDF, DOC, or Excel files
                </p>
              </div>
            </button>
          </div>
        )}

        {/* Library mode */}
        {mode === "library" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-1 -mt-1"
              onClick={() => setMode(null)}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>

            {libraryLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              </div>
            ) : libraryDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                All library documents have already been added.
              </p>
            ) : (
              <div className="space-y-1 max-h-[40vh] overflow-y-auto">
                {libraryDocs.map((doc) => (
                  <label
                    key={doc.id}
                    className="flex items-start gap-3 p-3 rounded-md hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <Checkbox
                      checked={selected.has(doc.id)}
                      onCheckedChange={() => toggleDoc(doc.id)}
                      className="mt-0.5"
                    />
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
                  </label>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={addFromLibrary}
                disabled={selected.size === 0 || librarySaving}
              >
                {librarySaving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                Add {selected.size > 0 ? `(${selected.size})` : ""}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Upload mode */}
        {mode === "upload" && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="w-fit gap-1 -mt-1"
              onClick={() => setMode(null)}
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="doc-name">Document Name *</Label>
                <Input
                  id="doc-name"
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  placeholder="e.g. Supplier Approval Procedure"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-category">Category</Label>
                <Select value={docCategory} onValueChange={setDocCategory}>
                  <SelectTrigger id="doc-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SOP">SOP</SelectItem>
                    <SelectItem value="PRP">PRP</SelectItem>
                    <SelectItem value="FSMS">FSMS</SelectItem>
                    <SelectItem value="HACCP">HACCP</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-responsible">Responsible (optional)</Label>
                <Input
                  id="doc-responsible"
                  value={docResponsible}
                  onChange={(e) => setDocResponsible(e.target.value)}
                  placeholder="e.g. QA Manager"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc-activity">Activity (optional)</Label>
                <Input
                  id="doc-activity"
                  value={docActivity}
                  onChange={(e) => setDocActivity(e.target.value)}
                  placeholder={activityName || "e.g. Restaurant"}
                />
              </div>

              <div className="space-y-2">
                <Label>File (optional)</Label>
                <div className="border border-dashed border-border rounded-lg p-4 text-center">
                  {file ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium">{file.name}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => setFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                      <p className="text-sm text-muted-foreground">
                        Click to select a file
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        PDF, DOC, DOCX, XLS, XLSX (max 10MB)
                      </p>
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!docName.trim() || uploading}
              >
                {uploading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                {file ? "Upload & Save" : "Save Document"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

function classifyForUpload(name: string): string {
  const lower = name.toLowerCase();
  if (["haccp", "hazard", "ccp", "critical control"].some((k) => lower.includes(k))) return "HACCP";
  if (["prp", "prerequisite", "cleaning", "pest", "hygiene"].some((k) => lower.includes(k))) return "PRP";
  if (["sop", "procedure", "standard operating"].some((k) => lower.includes(k))) return "SOP";
  return "FSMS";
}

export default AddDocumentModal;
