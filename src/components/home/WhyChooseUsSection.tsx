import { Clock, Lock, Zap, HeartHandshake } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

const reasons = [
  { icon: Zap, title: "Set Up in Minutes", desc: "Select your activity, and FoodPilot generates your entire HACCP structure automatically." },
  { icon: Lock, title: "Inspection-Ready Always", desc: "All your records, documents, and reports are organized and available at any time." },
  { icon: Clock, title: "Save Hours Every Week", desc: "Stop managing food safety on paper. Digital logs take seconds, not hours." },
  { icon: HeartHandshake, title: "Built for Food Businesses", desc: "Designed specifically for restaurants, bakeries, factories, and food service operations." },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-24 sm:py-32 bg-card/50 border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-4 mb-16">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Why FoodPilot</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ lineHeight: 1.12 }}
          >
            Food Safety Without the Complexity
          </h2>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
          {reasons.map((r, i) => (
            <ScrollReveal key={r.title} delay={i * 90}>
              <div className="flex gap-4 p-6 rounded-xl border border-border bg-background hover:border-primary/25 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <r.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-sm font-semibold text-foreground">{r.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{r.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
