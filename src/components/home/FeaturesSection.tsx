import {
  ShieldCheck,
  ClipboardList,
  BookOpen,
  Shield,
  Wrench,
  FileCheck,
  FolderOpen,
  Building2,
} from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "HACCP Plan Management", desc: "Generate and manage complete HACCP plans with automated hazard analysis and CCP identification." },
  { icon: ClipboardList, title: "Dynamic Logs", desc: "Digital temperature monitoring, cleaning logs, receiving records, and custom log templates." },
  { icon: Shield, title: "PRP Programs", desc: "Pre-requisite programs management with tracking, scheduling, and compliance verification." },
  { icon: BookOpen, title: "SOP Procedures", desc: "Standard operating procedures organized by process step with responsible party assignments." },
  { icon: Wrench, title: "Equipment Tracking", desc: "Track equipment status, maintenance schedules, and calibration records across locations." },
  { icon: FileCheck, title: "Audit Ready", desc: "One-click generation of inspection-ready reports with complete traceability documentation." },
  { icon: FolderOpen, title: "Document Control", desc: "Centralized food safety document management with version control and access tracking." },
  { icon: Building2, title: "Multi-Branch Support", desc: "Manage food safety systems across multiple locations with centralized oversight." },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Platform Features</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight" style={{ lineHeight: 1.15 }}>
            Built for Real Food Safety Work
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" style={{ textWrap: "pretty" }}>
            Every tool your food business needs to stay compliant, organized, and always ready for inspection.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group text-center p-6 rounded-xl border border-border bg-card hover:border-primary/30 hover:shadow-md transition-all duration-300 space-y-3"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 group-hover:bg-primary/15 transition-colors">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
