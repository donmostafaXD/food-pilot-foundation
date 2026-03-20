import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const steps = [
  { num: "01", title: "Choose Your Activity", desc: "Select your food business type — restaurant, bakery, factory, or custom. The system adapts instantly." },
  { num: "02", title: "Generate HACCP Plan", desc: "FoodPilot auto-generates a complete HACCP structure with hazard analysis and monitoring." },
  { num: "03", title: "Manage Daily Operations", desc: "Record logs, manage SOPs, PRP programs, equipment, and all documentation digitally." },
  { num: "04", title: "Stay Audit-Ready", desc: "Generate inspection-ready reports at any time. Complete traceability, zero stress." },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-5 mb-16">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">How It Works</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            Up and Running in 4 Steps
          </h2>
        </ScrollReveal>

        <div className="space-y-0">
          {steps.map((s, i) => (
            <ScrollReveal key={s.num} delay={i * 100}>
              <div className={`flex items-start gap-6 sm:gap-8 py-8 ${i < steps.length - 1 ? "border-b border-border" : ""}`}>
                {/* Number */}
                <div className="shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-extrabold text-primary font-mono">{s.num}</span>
                </div>
                {/* Content */}
                <div className="space-y-2 pt-1">
                  <h3 className="text-lg font-bold text-foreground">{s.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">{s.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="text-center pt-10">
          <Button size="lg" className="shadow-md shadow-primary/20 active:scale-[0.97] transition-transform" asChild>
            <Link to="/register">
              Start Your Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
