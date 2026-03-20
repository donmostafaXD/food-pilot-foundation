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
    <section className="py-24 sm:py-32 bg-foreground relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-primary/[0.06] blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-5 mb-16">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Platform Features</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-background tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            Built for Real Food Safety Work
          </h2>
          <p className="text-background/50 max-w-lg mx-auto leading-relaxed">
            Every tool your food business needs to stay compliant, organized, and always ready for inspection.
          </p>
        </ScrollReveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <ScrollReveal key={f.title} delay={i * 60}>
              <div className="group h-full text-center p-6 rounded-2xl border border-background/[0.06] bg-background/[0.03] hover:bg-background/[0.07] hover:border-primary/20 hover:-translate-y-1 transition-all duration-500 space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/15 group-hover:bg-primary/25 group-hover:scale-110 transition-all duration-300">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-background">{f.title}</h3>
                <p className="text-xs text-background/45 leading-relaxed">{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
