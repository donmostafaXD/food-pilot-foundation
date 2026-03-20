import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, ShieldCheck, ClipboardList, FileCheck, BookOpen } from "lucide-react";

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <div className="space-y-8 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card text-xs font-medium text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
              Trusted by food businesses worldwide
            </div>

            <h1
              className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground"
              style={{ lineHeight: 1.1 }}
            >
              Your Complete
              <br />
              <span className="text-primary">Food Safety</span>
              <br />
              Command Center
            </h1>

            <p className="text-lg text-muted-foreground leading-relaxed max-w-md" style={{ textWrap: "pretty" }}>
              Manage HACCP plans, digital logs, PRP programs, SOPs, and audit
              documentation — all from one platform. Replace paperwork with a
              system that's always inspection-ready.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button size="lg" className="text-base h-12 px-8" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base h-12 px-8" asChild>
                <a href="#demo-request">
                  <Play className="w-4 h-4 mr-2" />
                  Request a Demo
                </a>
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              No credit card required · Set up in under 5 minutes
            </p>
          </div>

          {/* Visual — capability cards */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {[
              { icon: ShieldCheck, label: "HACCP Plans", desc: "Auto-generated hazard analysis" },
              { icon: ClipboardList, label: "Digital Logs", desc: "Temperature, cleaning & more" },
              { icon: BookOpen, label: "SOP & PRP", desc: "Procedures & prerequisite programs" },
              { icon: FileCheck, label: "Audit Ready", desc: "Inspection reports in one click" },
            ].map((c, i) => (
              <div
                key={c.label}
                className="group rounded-xl border border-border bg-card p-5 space-y-3 shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300"
                style={{ animationDelay: `${i * 120}ms` }}
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="font-semibold text-sm text-foreground">{c.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
