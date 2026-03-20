import ScrollReveal from "./ScrollReveal";

const steps = [
  { num: "01", title: "Choose Your Activity", desc: "Select your food business type — restaurant, bakery, factory, or custom." },
  { num: "02", title: "Generate HACCP Plan", desc: "FoodPilot auto-generates a complete HACCP structure with hazard analysis." },
  { num: "03", title: "Manage Daily Operations", desc: "Record logs, manage SOPs, PRP programs, equipment, and documents." },
  { num: "04", title: "Stay Audit-Ready", desc: "Generate inspection-ready reports at any time with full traceability." },
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 sm:py-32 bg-card/50 border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">How It Works</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ lineHeight: 1.12 }}
          >
            Up and Running in 4 Steps
          </h2>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((s, i) => (
            <ScrollReveal key={s.num} delay={i * 100}>
              <div className="relative text-center space-y-4">
                {/* Number badge */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 shadow-sm">
                  <span className="text-lg font-bold text-primary font-mono">{s.num}</span>
                </div>

                {/* Connector — desktop only, between cards */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+36px)] w-[calc(100%-72px)] border-t border-dashed border-border" />
                )}

                <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
