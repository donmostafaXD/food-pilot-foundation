import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
  id: string;
  log_name: string;
  process_step: string | null;
  status: string | null;
  created_at: string;
}

interface Props {
  branchId: string | null;
}

const RecentActivity = ({ branchId }: Props) => {
  const { profile } = useAuth();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.organization_id || !branchId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("log_entries")
        .select("id, log_name, process_step, status, created_at")
        .eq("organization_id", profile.organization_id!)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(8);

      setLogs((data as LogEntry[]) ?? []);
      setLoading(false);
    };

    load();
  }, [profile?.organization_id, branchId]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 rounded" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">No recent activity</p>
        ) : (
          <div className="space-y-1">
            {logs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 py-2 px-2 rounded-md hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <ClipboardList className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{log.log_name}</p>
                    {log.process_step && (
                      <p className="text-xs text-muted-foreground truncate">{log.process_step}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge
                    variant={log.status === "Deviation" ? "destructive" : "secondary"}
                    className="text-[10px]"
                  >
                    {log.status ?? "OK"}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
