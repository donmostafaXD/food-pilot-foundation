import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Search, ArrowLeft, BookOpen } from "lucide-react";

interface SOPItem {
  id: number;
  sop_name: string;
  process_step: string;
  description: string | null;
  procedure_text: string | null;
  responsible: string | null;
  category: "Food Service" | "Manufacturing";
  process_step_id?: number;
}

const SOPPage = () => {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [sops, setSOPs] = useState<SOPItem[]>([]);
  const [search, setSearch] = useState("");
  const [filterProcess, setFilterProcess] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedSOP, setSelectedSOP] = useState<SOPItem | null>(null);

  useEffect(() => {
    loadSOPs();
  }, []);

  const loadSOPs = async () => {
    setLoading(true);

    const [{ data: foodService }, { data: manufacturing }] = await Promise.all([
      supabase.from("sop_library").select("*"),
      supabase.from("sop_library_manufacturing").select("*"),
    ]);

    const items: SOPItem[] = [];

    (foodService || []).forEach((s) => {
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

    (manufacturing || []).forEach((s) => {
      items.push({
        id: s.id + 10000, // offset to avoid id collision
        sop_name: s.sop_name,
        process_step: `Step #${s.process_step_id}`,
        description: s.description,
        procedure_text: s.description,
        responsible: null,
        category: "Manufacturing",
        process_step_id: s.process_step_id,
      });
    });

    setSOPs(items);
    setLoading(false);
  };

  const processSteps = [...new Set(sops.map((s) => s.process_step))].sort();

  const filtered = sops.filter((s) => {
    if (search && !s.sop_name.toLowerCase().includes(search.toLowerCase()) && !s.process_step.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterProcess !== "all" && s.process_step !== filterProcess) return false;
    if (filterCategory !== "all" && s.category !== filterCategory) return false;
    return true;
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (selectedSOP) {
    const procedures = selectedSOP.procedure_text
      ? selectedSOP.procedure_text.split(/\n|(?:\d+\.\s)/).filter(Boolean).map((s) => s.trim())
      : [];

    return (
      <DashboardLayout>
        <div className="p-6 lg:p-8 max-w-3xl mx-auto">
          <Button variant="ghost" size="sm" className="mb-4 gap-1" onClick={() => setSelectedSOP(null)}>
            <ArrowLeft className="w-4 h-4" /> Back to list
          </Button>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <CardTitle className="text-xl">{selectedSOP.sop_name}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">Related Process: {selectedSOP.process_step}</p>
                </div>
                <Badge variant="outline">{selectedSOP.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Procedure */}
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

              {/* Critical Instructions */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Critical Instructions</h3>
                <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
                  <p className="text-sm text-foreground">
                    Follow all steps in order. Do not skip any procedure. Report deviations immediately to the responsible person.
                  </p>
                </div>
              </div>

              {/* Hygiene / Safety */}
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-2">Hygiene & Safety Notes</h3>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  <li>Wash hands before and after procedure</li>
                  <li>Wear appropriate PPE as required</li>
                  <li>Ensure work area is clean and sanitized</li>
                </ul>
              </div>

              {/* Responsible */}
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
        <h1 className="text-2xl font-bold text-foreground tracking-tight mb-6">SOP Procedures</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
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
            </SelectContent>
          </Select>
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
                    <Badge variant="outline" className="text-[10px] shrink-0">{sop.category}</Badge>
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
      </div>
    </DashboardLayout>
  );
};

export default SOPPage;
