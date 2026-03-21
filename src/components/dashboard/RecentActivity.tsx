import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useRoleAccess } from "@/hooks/useRoleAccess";
import { useActivity } from "@/contexts/ActivityContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardList, Clock, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface LogEntry {
  id: string;
  log_name: string;
  process_step: string | null;
  data: Record<string, string> | null;
  status: string | null;
  created_at: string;
}

interface Props {
  branchId: string | null;
}

const RecentActivity = ({ branchId }: Props) => {
  const { profile } = useAuth();
  const { effectiveRole } = useRoleAccess();
  const { activeActivity } = useActivity();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const isStaff = effectiveRole === "Staff";
  const activityName = activeActivity?.activity_name ?? null;

  useEffect(() => {
    if (!profile?.organization_id || !branchId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);

      let processSteps: string[] = [];
      if (activityName) {
        const { data: mapping } = await supabase
          .from("activity_process_map")
          .select("process")
          .eq("activity", activityName);
        processSteps = (mapping || []).map((m) => m.process);
      }

      let query = supabase
        .from("log_entries")
        .select("id, log_name, process_step, data, status, created_at")
        .eq("organization_id", profile.organization_id!)
        .eq("branch_id", branchId)
        .order("created_at", { ascending: false })
        .limit(isStaff ? 5 : 10);

      if (processSteps.length > 0) {
        query = query.in("process_step", processSteps);
      }

      const { data } = await query;
      setLogs((data as LogEntry[]) ?? []);
      setLoading(false);
    };

    load();
  }, [profile?.organization_id, branchId, isStaff, activityName]);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          {isStaff ? "My Recent Logs" : "Recent Activity"}
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
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="p-3 rounded-full bg-muted mb-3">
              <Inbox className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No logs recorded for this activity
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {isStaff
                ? "Start by filling in your first log entry"
                : "Activity will appear here once logs are recorded"}
            </p>
          </div>
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
                    <p className="text-sm font-medium text-foreground truncate">
                      {log.log_name}
                      {(log.data as Record<string, string>)?.Equipment && (
                        <span className="text-muted-foreground font-normal"> — {(log.data as Record<string, string>).Equipment}</span>
                      )}
                    </p>
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
