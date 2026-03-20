import { CheckCircle2 } from "lucide-react";

const steps = [
  { num: "01", title: "Choose Your Activity", desc: "Select your food business type — restaurant, bakery, factory, or custom. The system adapts to your operation." },
  { num: "02", title: "Generate Your HACCP Plan", desc: "FoodPilot auto-generates a complete HACCP structure with hazard analysis, CCPs, and monitoring requirements." },
  { num: "03", title: "Manage Daily Operations", desc: "Record logs, manage SOPs and PRP programs, track equipment, and handle documentation digitally." },
  { num: "04", title: "Stay Audit-Ready", desc: "Generate inspection-ready reports at any time. All records are organized, searchable, and always available." },
];

export default function HowItWorksSection() {
  return (
    <section className="py-20 sm:py-28 bg-card border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight" style={{ lineHeight: 1.15 }}>
            Up and Running in 4 Steps
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((s, i) => (
            <div key={s.num} className="relative space-y-4">
              {/* Connector line (hidden on last) */}
              {i < steps.length - 1 && (
                <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] h-px bg-border" />
              )}
              <div className="flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center relative z-10">
                  <span className="text-lg font-bold text-primary">{s.num}</span>
                </div>
              </div>
              <div className="text-center space-y-2">
                <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
