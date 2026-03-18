import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/PublicLayout";
import {
  ShieldCheck,
  ClipboardList,
  BookOpen,
  Shield,
  Wrench,
  FileCheck,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "HACCP Plan Generator", desc: "Auto-generate hazard analysis and critical control points from your activity type." },
  { icon: ClipboardList, title: "Monitoring Logs", desc: "Track temperatures, cleaning schedules, and corrective actions digitally." },
  { icon: BookOpen, title: "SOP Library", desc: "Access standard operating procedures linked to every process step." },
  { icon: Shield, title: "PRP Programs", desc: "Manage prerequisite programs with status tracking and compliance records." },
  { icon: Wrench, title: "Equipment Tracking", desc: "Maintain your equipment inventory and link it to monitoring logs." },
  { icon: FileCheck, title: "Audit & Compliance Ready", desc: "Print-ready documents and organized records for inspections and audits." },
];

const steps = [
  { num: "01", title: "Select Your Activity", desc: "Choose from food service, bakery, manufacturing, and more." },
  { num: "02", title: "Generate Your HACCP Plan", desc: "We auto-build process steps, hazards, and control measures." },
  { num: "03", title: "Start Monitoring", desc: "Log data, follow SOPs, and stay compliant every day." },
];

const Home = () => {
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
              <ShieldCheck className="w-4 h-4" />
              Food Safety Management System
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">
              Manage Your Food Safety System{" "}
              <span className="text-primary">Digitally</span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Generate HACCP plans, track logs, and stay audit-ready — all in one platform built for food businesses.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" className="text-base px-8 h-12" asChild>
                <Link to="/register">
                  Get Started Free
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                <Link to="/pricing">View Pricing</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 sm:py-24 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              Everything You Need for Food Safety
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              From HACCP plans to daily logs — one platform to manage it all.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div
                key={f.title}
                className="group p-6 rounded-xl border border-border bg-background hover:border-primary/30 hover:shadow-industrial-md transition-all"
              >
                <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
              Get started in minutes with three simple steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.num} className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {s.num}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-24 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold text-primary-foreground tracking-tight">
            Ready to Go Digital?
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
            Join food businesses that trust FoodPilot for compliance, monitoring, and audit readiness.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button size="lg" variant="secondary" className="text-base px-8 h-12 bg-white text-primary hover:bg-white/90" asChild>
              <Link to="/register">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-4 text-primary-foreground/70 text-sm">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> No credit card required</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Free plan available</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Cancel anytime</span>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;