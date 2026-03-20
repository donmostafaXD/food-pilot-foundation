import { Clock, Lock, Zap, HeartHandshake, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ScrollReveal from "./ScrollReveal";

const reasons = [
  { icon: Zap, title: "Set Up in Minutes", desc: "Select your activity, and FoodPilot generates your entire HACCP structure automatically. No consultants needed.", num: "01" },
  { icon: Lock, title: "Inspection-Ready Always", desc: "All records, documents, and reports are organized and available at any time. Zero searching when inspectors arrive.", num: "02" },
  { icon: Clock, title: "Save Hours Every Week", desc: "Stop managing food safety on paper. Digital logs take seconds, not hours. Your team stays focused on food.", num: "03" },
  { icon: HeartHandshake, title: "Built for Food Businesses", desc: "Designed specifically for restaurants, bakeries, factories, and food service. Not a generic tool — purpose-built.", num: "04" },
];

export default function WhyChooseUsSection() {
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-5 mb-16">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Why FoodPilot</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            Food Safety Without the Complexity
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            We built FoodPilot so you can focus on your food — not on paperwork, compliance stress, or missing records.
          </p>
        </ScrollReveal>

        <div className="grid sm:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {reasons.map((r, i) => (
            <ScrollReveal key={r.title} delay={i * 90}>
              <div className="group flex gap-5 p-7 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-xl hover:shadow-primary/[0.04] hover:-translate-y-1 transition-all duration-500">
                <div className="shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 group-hover:scale-110 transition-all duration-300">
                    <r.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-base font-bold text-foreground">{r.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{r.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="text-center pt-12">
          <Button variant="outline" size="lg" className="active:scale-[0.97] transition-transform" asChild>
            <a href="#demo-request">
              See It in Action
              <ArrowRight className="w-4 h-4 ml-2" />
            </a>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
