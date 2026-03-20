import ScrollReveal from "./ScrollReveal";
import {
  ShieldCheck,
  ClipboardList,
  BookOpen,
  FileCheck,
  Building2,
  LayoutDashboard,
} from "lucide-react";

const items = [
  { icon: ShieldCheck, title: "Digital HACCP Management", desc: "Auto-generate complete HACCP plans with hazard analysis, CCPs, and monitoring procedures.", color: "bg-primary/10 text-primary" },
  { icon: ClipboardList, title: "Food Safety Records & Logs", desc: "Replace paper logs with digital temperature, cleaning, and receiving records.", color: "bg-accent/10 text-accent" },
  { icon: BookOpen, title: "PRP & SOP Management", desc: "Organize prerequisite programs and standard operating procedures in one place.", color: "bg-warning/10 text-warning" },
  { icon: FileCheck, title: "Audit Readiness Tools", desc: "Generate inspection-ready reports and compliance documentation instantly.", color: "bg-primary/10 text-primary" },
  { icon: Building2, title: "Branch & Activity Management", desc: "Manage multiple locations with activity-specific food safety configurations.", color: "bg-accent/10 text-accent" },
  { icon: LayoutDashboard, title: "Compliance Dashboard", desc: "Real-time overview of your entire food safety system status.", color: "bg-warning/10 text-warning" },
];

export default function WhatWeOfferSection() {
  return (
    <section id="features" className="py-24 sm:py-32">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-5 mb-16">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">What We Offer</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            Everything You Need for
            <br className="hidden sm:block" />
            Food Safety Compliance
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            From HACCP plan generation to audit-ready reports — manage every
            aspect of food safety digitally.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 80}>
              <div className="group h-full p-7 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.04] hover:-translate-y-1 transition-all duration-500">
                <div className={`w-12 h-12 rounded-xl ${item.color.split(" ")[0]} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                  <item.icon className={`w-6 h-6 ${item.color.split(" ")[1]}`} />
                </div>
                <h3 className="text-base font-bold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
