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
  { icon: ShieldCheck, title: "Digital HACCP Management", desc: "Auto-generate complete HACCP plans with hazard analysis, CCPs, and monitoring procedures." },
  { icon: ClipboardList, title: "Food Safety Records & Logs", desc: "Replace paper logs with digital temperature, cleaning, and receiving records." },
  { icon: BookOpen, title: "PRP & SOP Management", desc: "Organize prerequisite programs and standard operating procedures in one place." },
  { icon: FileCheck, title: "Audit Readiness Tools", desc: "Generate inspection-ready reports and compliance documentation instantly." },
  { icon: Building2, title: "Branch & Activity Management", desc: "Manage multiple locations with activity-specific food safety configurations." },
  { icon: LayoutDashboard, title: "Compliance Dashboard", desc: "Real-time overview of your entire food safety system status." },
];

export default function WhatWeOfferSection() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-card/50 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">What We Offer</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ lineHeight: 1.12 }}
          >
            Everything You Need for
            <br className="hidden sm:block" />
            Food Safety Compliance
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" style={{ textWrap: "pretty" }}>
            From HACCP plan generation to audit-ready reports — manage every
            aspect of food safety digitally.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item, i) => (
            <ScrollReveal key={item.title} delay={i * 80}>
              <div className="group h-full p-6 rounded-xl border border-border bg-background hover:border-primary/25 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <item.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
