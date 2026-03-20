/**
 * Demo mode banner — shown when logged in with a demo account.
 */
import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { Badge } from "@/components/ui/badge";
import { FlaskConical } from "lucide-react";

const DEMO_EMAILS = [
  "demo_basic@foodpilot.com",
  "demo_haccp@foodpilot.com",
  "demo_compliance@foodpilot.com",
  "demo_full@foodpilot.com",
];

export function DemoBanner() {
  const { profile } = useAuth();
  const { planDisplayName } = usePlan();

  const isDemoUser = profile?.email && DEMO_EMAILS.includes(profile.email);
  if (!isDemoUser) return null;

  return (
    <div className="bg-primary/5 border-b border-primary/20 px-4 py-1.5 flex items-center justify-center gap-2 shrink-0">
      <FlaskConical className="h-3.5 w-3.5 text-primary" />
      <span className="text-xs font-medium text-primary">Demo Mode</span>
      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 border-primary/30 text-primary">
        {planDisplayName}
      </Badge>
      <span className="text-[10px] text-muted-foreground hidden sm:inline">
        — You are using a demo account. Data may be reset.
      </span>
    </div>
  );
}
