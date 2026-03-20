import DatabaseStatus from "@/components/DatabaseStatus";
import { Shield, Database, GitBranch } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-4.5 h-4.5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-semibold tracking-tight font-display text-foreground">
                FoodPilot
              </h1>
              <p className="text-xs text-muted-foreground">Dynamic HACCP Orchestration</p>
            </div>
          </div>
          <span className="text-xs text-muted-foreground font-mono px-2 py-1 bg-secondary rounded">
            v0.1 — Foundation
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="space-y-2">
          <h2 className="text-xl font-semibold tracking-tight font-display text-foreground">
            Data Foundation
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            All 18 Excel sheets have been mapped to database tables. The multi-tenant architecture
            supports organizations, branches, and role-based users. All relationships are keyed on{" "}
            <code className="font-mono text-primary text-xs bg-secondary px-1.5 py-0.5 rounded">
              Process_Step_ID
            </code>.
          </p>
        </div>

        {/* Architecture cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card rounded-lg shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <Database className="w-4 h-4" />
              <span className="text-sm font-semibold font-display">HACCP Data Model</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              {[
                "Templates & Activity Types",
                "Process Steps (105 steps)",
                "Hazard Library (103 hazards)",
                "CCP Tables (Service + Manufacturing)",
                "SOP Libraries (Service + Manufacturing)",
                "Equipment, Logs, PRP Programs",
                "Decision Tree Questions",
                "Document Library",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-success mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-lg shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <GitBranch className="w-4 h-4" />
              <span className="text-sm font-semibold font-display">Multi-Tenant Architecture</span>
            </div>
            <ul className="text-xs text-muted-foreground space-y-1.5">
              {[
                "Organizations with subscription plans",
                "Auto-created 'Main Branch' on org creation",
                "User profiles linked to auth.users",
                "Role-based access (Owner, Manager, QA, Staff, Auditor)",
                "Row-Level Security on all tables",
                "Security-definer role check function",
                "Auto profile creation on signup",
                "Activity Type filtering (Service vs Manufacturing)",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span className="text-success mt-0.5">•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Database status */}
        <DatabaseStatus />
      </main>
    </div>
  );
};

export default Index;
