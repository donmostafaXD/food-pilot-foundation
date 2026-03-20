import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Play,
  ShieldCheck,
  ClipboardList,
  FileCheck,
  BookOpen,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

const capabilities = [
  { icon: ShieldCheck, label: "HACCP Plans", desc: "Auto-generated hazard analysis & CCP identification", stat: "100%" },
  { icon: ClipboardList, label: "Digital Logs", desc: "Temperature, cleaning, receiving & custom records", stat: "Real-time" },
  { icon: BookOpen, label: "SOP & PRP", desc: "Procedures & prerequisite programs in one place", stat: "Organized" },
  { icon: FileCheck, label: "Audit Ready", desc: "Inspection reports generated in seconds", stat: "Instant" },
];

const stats = [
  { value: "100%", label: "Digital Records" },
  { value: "<5 min", label: "Setup Time" },
  { value: "24/7", label: "Audit Ready" },
  { value: "Zero", label: "Paperwork" },
];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-foreground">
      {/* Grid texture */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--primary)/0.03)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--primary)/0.03)_1px,transparent_1px)] bg-[size:3rem_3rem]" />
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/4 w-[800px] h-[600px] rounded-full bg-primary/[0.08] blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-accent/[0.06] blur-[80px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:pt-28 lg:pb-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Copy ── */}
          <div className="space-y-8 max-w-xl reveal">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/20 bg-primary/[0.08] text-xs font-semibold text-primary">
              <Sparkles className="w-3.5 h-3.5" />
              Food Safety Platform — Trusted Worldwide
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-[3.5rem] font-extrabold tracking-tight text-background"
              style={{ lineHeight: 1.06, letterSpacing: "-0.025em" }}
            >
              Your Complete{" "}
              <span className="text-primary">Food Safety</span>{" "}
              Command Center
            </h1>

            <p className="text-base sm:text-lg text-background/60 leading-relaxed max-w-md">
              Manage HACCP plans, digital logs, PRP programs, SOPs, and audit
              documentation — all from one platform. Replace paperwork with a
              system that's always inspection-ready.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="text-base h-13 px-8 shadow-lg shadow-primary/30 active:scale-[0.97] transition-transform"
                asChild
              >
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base h-13 px-8 border-background/20 text-background hover:bg-background/10 active:scale-[0.97] transition-transform"
                asChild
              >
                <a href="#demo-request">
                  <Play className="w-4 h-4 mr-2" />
                  Request a Demo
                </a>
              </Button>
            </div>

            {/* Trust line */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {["HACCP Compliant", "Audit-Ready", "Built for Food Businesses"].map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-background/50 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Visual — capability cards ── */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {capabilities.map((c, i) => (
              <div
                key={c.label}
                className={`reveal reveal-d${i + 1} group rounded-2xl border border-background/[0.08] bg-background/[0.04] backdrop-blur-sm p-6 space-y-4 hover:bg-background/[0.08] hover:border-primary/20 hover:-translate-y-1 transition-all duration-500`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center group-hover:bg-primary/25 transition-colors">
                    <c.icon className="w-5 h-5 text-primary" />
                  </div>
                  <span className="text-xs font-bold text-primary/80 font-mono">{c.stat}</span>
                </div>
                <div>
                  <p className="font-semibold text-sm text-background">{c.label}</p>
                  <p className="text-xs text-background/50 leading-relaxed mt-1">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="relative border-t border-background/[0.08]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center reveal">
              <p className="text-2xl sm:text-3xl font-extrabold text-background tracking-tight font-mono">{s.value}</p>
              <p className="text-xs text-background/40 font-medium mt-1 uppercase tracking-wider">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
