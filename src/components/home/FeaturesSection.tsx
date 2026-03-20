import ScrollReveal from "./ScrollReveal";
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
  { icon: ShieldCheck, title: "HACCP Plan Management", desc: "Auto-generate plans with hazard analysis and CCP identification." },
  { icon: ClipboardList, title: "Dynamic Logs", desc: "Digital temperature, cleaning, receiving and custom log templates." },
  { icon: Shield, title: "PRP Programs", desc: "Prerequisite programs with tracking and compliance verification." },
  { icon: BookOpen, title: "SOP Procedures", desc: "Standard operating procedures organized by process step." },
  { icon: Wrench, title: "Equipment Tracking", desc: "Equipment status, maintenance schedules, and calibration." },
  { icon: FileCheck, title: "Audit Ready", desc: "One-click inspection-ready reports with full traceability." },
  { icon: FolderOpen, title: "Document Control", desc: "Centralized food safety document management." },
  { icon: Building2, title: "Multi-Branch", desc: "Manage food safety across multiple locations." },
];

export default function FeaturesSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Platform Features</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ lineHeight: 1.12 }}
          >
            Built for Real Food Safety Work
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" style={{ textWrap: "pretty" }}>
            Every tool your food business needs to stay compliant, organized, and always ready for inspection.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 70}>
              <div className="group h-full text-center p-5 sm:p-6 rounded-xl border border-border bg-card hover:border-primary/25 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 space-y-3">
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
