import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import PublicLayout from "@/components/PublicLayout";
import {
  ShieldCheck,
  ClipboardList,
  BookOpen,
  Shield,
  LayoutDashboard,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  XCircle,
  FileCheck,
  Printer,
  FolderOpen,
  Mail,
  Phone,
  MapPin,
  User,
} from "lucide-react";

const features = [
  { icon: ShieldCheck, title: "HACCP Plan Generator", desc: "Auto-generate your complete hazard analysis and critical control points." },
  { icon: ClipboardList, title: "Digital Food Safety Logs", desc: "Replace paper logs with fast, organized digital records." },
  { icon: BookOpen, title: "SOP & PRP Management", desc: "Manage standard operating procedures and prerequisite programs." },
  { icon: FileCheck, title: "Inspection-Ready Reports", desc: "Print or export compliance reports instantly." },
  { icon: LayoutDashboard, title: "Easy-to-Use Dashboard", desc: "See your food safety status at a glance." },
  { icon: Smartphone, title: "Mobile-Friendly Access", desc: "Record logs and check data from any device." },
];

const problems = [
  "Missing logs",
  "Incomplete records",
  "Disorganized documents",
  "Stress during inspections",
];

const solutions = [
  "Automatically generate your HACCP plan",
  "Record daily logs digitally",
  "Manage SOPs and PRP programs",
  "Keep all documents organized in one place",
  "Be ready for inspection anytime",
];

const targets = [
  "Restaurants",
  "Cafés",
  "Bakeries",
  "Cloud Kitchens",
  "Catering Businesses",
];

const Home = () => {
  return (
    <PublicLayout>
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20 sm:pt-28 sm:pb-28">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
              Turn Your Food Safety From Paperwork Into a{" "}
              <span className="text-primary">Simple Digital System</span>
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Replace paper logs, automate your HACCP plan, and keep your food safety system organized, digital, and ready for inspection at any time.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button size="lg" className="text-base px-8 h-12" asChild>
                <Link to="/register">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                <Link to="/contact">Book a Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TRUST STRIP ─── */}
      <section className="bg-primary text-primary-foreground py-5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-base sm:text-lg font-semibold tracking-wide">
            No more paper logs. No more missing records. No more inspection stress.
          </p>
        </div>
      </section>

      {/* ─── PROBLEM ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Food Safety Should Not Be This Hard
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Most food businesses still rely on paper records, scattered documents, and manual HACCP systems. This leads to:
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
            {problems.map((p) => (
              <div key={p} className="flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                <XCircle className="w-5 h-5 text-destructive shrink-0" />
                <span className="text-sm font-medium text-foreground">{p}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── SOLUTION ─── */}
      <section className="py-16 sm:py-20 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              A Simple Digital Food Safety System
            </h2>
            <p className="text-muted-foreground">Our system helps you:</p>
          </div>
          <div className="space-y-3 max-w-lg mx-auto">
            {solutions.map((s) => (
              <div key={s} className="flex items-center gap-3 p-4 rounded-lg border border-accent/20 bg-accent/5">
                <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                <span className="text-sm font-medium text-foreground">{s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── KEY BENEFIT ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
            <ClipboardList className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
            No More Paperwork
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Replace all your paper logs with a simple digital system. Your team records everything in seconds. Your data is always saved, organized, and ready.
          </p>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section className="py-16 sm:py-20 bg-card border-y border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Everything You Need to Manage Food Safety
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* ─── INSPECTION ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
              Always Ready for Inspection
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              When an inspector visits, you can:
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-2xl mx-auto">
            {[
              { icon: FolderOpen, text: "Show complete HACCP documentation" },
              { icon: FileCheck, text: "Present organized records" },
              { icon: Printer, text: "Print reports instantly" },
            ].map((item) => (
              <div key={item.text} className="text-center p-6 rounded-xl border border-border bg-card space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
                  <item.icon className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-muted-foreground mt-8 font-medium">
            No stress. No searching. No missing data.
          </p>
        </div>
      </section>

      {/* ─── TARGET USERS ─── */}
      <section className="py-16 sm:py-20 bg-card border-y border-border">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8">
            Built for Food Businesses
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {targets.map((t) => (
              <span
                key={t}
                className="px-5 py-2.5 rounded-full border border-border bg-background text-sm font-medium text-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-16 sm:py-20 bg-primary">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight">
            Start Managing Your Food Safety the Smart Way
          </h2>
          <p className="text-primary-foreground/80 text-base sm:text-lg max-w-xl mx-auto">
            Stop managing papers. Start managing your food safety digitally.
          </p>
          <Button size="lg" variant="secondary" className="text-base px-8 h-12 bg-background text-primary hover:bg-background/90" asChild>
            <Link to="/register">
              Get Started
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-center mb-10">
            Get in Touch
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-3xl mx-auto">
            {[
              { icon: User, label: "Name", value: "Amr Fawzi" },
              { icon: Mail, label: "Email", value: "salihamro35@gmail.com", href: "mailto:salihamro35@gmail.com" },
              { icon: Phone, label: "WhatsApp", value: "+601114742053", href: "https://wa.me/601114742053" },
              { icon: MapPin, label: "Location", value: "Kuala Lumpur, Malaysia" },
            ].map((c) => (
              <div key={c.label} className="text-center p-5 rounded-xl border border-border bg-card space-y-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                {c.href ? (
                  <a href={c.href} className="text-sm font-medium text-primary hover:underline break-all" target="_blank" rel="noopener noreferrer">
                    {c.value}
                  </a>
                ) : (
                  <p className="text-sm font-medium text-foreground">{c.value}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};

export default Home;
