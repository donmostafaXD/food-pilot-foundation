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
} from "lucide-react";

const capabilities = [
  { icon: ShieldCheck, label: "HACCP Plans", desc: "Auto-generated hazard analysis & CCP identification" },
  { icon: ClipboardList, label: "Digital Logs", desc: "Temperature, cleaning, receiving & custom records" },
  { icon: BookOpen, label: "SOP & PRP", desc: "Procedures & prerequisite programs in one place" },
  { icon: FileCheck, label: "Audit Ready", desc: "Inspection reports generated in seconds" },
];

const trustItems = ["HACCP Compliant", "Audit-Ready System", "Built for Food Businesses"];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Ambient gradient orb - top-left warm, bottom-right cool */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/[0.04] blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-[400px] h-[400px] rounded-full bg-accent/[0.04] blur-3xl pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-24 lg:pb-32">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* ── Copy Column ── */}
          <div className="space-y-8 max-w-xl reveal">
            {/* Trust pill */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/60 backdrop-blur text-xs font-medium text-muted-foreground shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
              </span>
              Trusted by food businesses worldwide
            </div>

            <h1
              className="text-4xl sm:text-5xl lg:text-[3.4rem] font-extrabold tracking-tight text-foreground"
              style={{ lineHeight: 1.08 }}
            >
              Your Complete{" "}
              <span className="text-primary">Food Safety</span>{" "}
              Command Center
            </h1>

            <p
              className="text-base sm:text-lg text-muted-foreground leading-relaxed max-w-md"
              style={{ textWrap: "pretty" }}
            >
              Manage HACCP plans, digital logs, PRP programs, SOPs, and audit
              documentation — all from one platform. Replace paperwork with a
              system that's always inspection-ready.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="text-base h-12 px-8 shadow-md shadow-primary/20 active:scale-[0.97] transition-transform"
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
                className="text-base h-12 px-8 active:scale-[0.97] transition-transform"
                asChild
              >
                <a href="#demo-request">
                  <Play className="w-4 h-4 mr-2" />
                  Request a Demo
                </a>
              </Button>
            </div>

            {/* Trust strip */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 pt-1">
              {trustItems.map((t) => (
                <span key={t} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* ── Visual Column — capability cards ── */}
          <div className="hidden lg:grid grid-cols-2 gap-4">
            {capabilities.map((c, i) => (
              <div
                key={c.label}
                className={`reveal reveal-d${i + 1} group rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 space-y-3 shadow-sm hover:shadow-lg hover:border-primary/25 hover:-translate-y-0.5 transition-all duration-300`}
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

      {/* Bottom edge — social proof bar */}
      <div className="border-y border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-10 text-xs font-medium text-muted-foreground">
          <span>No credit card required</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>Set up in under 5 minutes</span>
          <span className="hidden sm:inline text-border">|</span>
          <span>Cancel anytime</span>
        </div>
      </div>
    </section>
  );
}
