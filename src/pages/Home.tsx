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
  Loader2,
} from "lucide-react";
import { useAdminCMS } from "@/hooks/useAdminCMS";

const FEATURE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "HACCP Plan Generator": ShieldCheck,
  "Digital Food Safety Logs": ClipboardList,
  "SOP & PRP Management": BookOpen,
  "Inspection-Ready Reports": FileCheck,
  "Easy-to-Use Dashboard": LayoutDashboard,
  "Mobile-Friendly Access": Smartphone,
};

const CONTACT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Name: User,
  Email: Mail,
  WhatsApp: Phone,
  Location: MapPin,
};

const Home = () => {
  const cms = useAdminCMS();

  // Fallback content for when CMS hasn't loaded yet
  const hero = cms.getContent<any>("hero") || {
    title: "Turn Your Food Safety From Paperwork Into a",
    highlight: "Simple Digital System",
    subtitle: "Replace paper logs, automate your HACCP plan, and keep your food safety system organized, digital, and ready for inspection at any time.",
    cta_primary: "Get Started",
    cta_secondary: "Book a Demo",
  };
  const trustStrip = cms.getContent<any>("trust_strip") || { text: "No more paper logs. No more missing records. No more inspection stress." };
  const problem = cms.getContent<any>("problem") || { title: "Food Safety Should Not Be This Hard", subtitle: "", items: [] };
  const solution = cms.getContent<any>("solution") || { title: "A Simple Digital Food Safety System", subtitle: "", items: [] };
  const features = cms.getContent<any>("features") || { title: "Everything You Need to Manage Food Safety", items: [] };
  const cta = cms.getContent<any>("cta") || { title: "Start Managing Your Food Safety the Smart Way", subtitle: "", button: "Get Started" };
  const contact = cms.getContent<any>("contact") || { title: "Get in Touch", items: [] };
  const targets = cms.getContent<any>("targets") || { title: "Built for Food Businesses", items: [] };

  return (
    <PublicLayout>
      {/* ─── HERO ─── */}
      {cms.isVisible("hero") && (
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-20 pb-20 sm:pt-28 sm:pb-28">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground leading-[1.15]">
                {hero.title}{" "}
                <span className="text-primary">{hero.highlight}</span>
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                {hero.subtitle}
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Button size="lg" className="text-base px-8 h-12" asChild>
                  <Link to="/register">
                    {hero.cta_primary}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="text-base px-8 h-12" asChild>
                  <Link to="/contact">{hero.cta_secondary}</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ─── TRUST STRIP ─── */}
      {cms.isVisible("trust_strip") && (
        <section className="bg-primary text-primary-foreground py-5">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
            <p className="text-base sm:text-lg font-semibold tracking-wide">{trustStrip.text}</p>
          </div>
        </section>
      )}

      {/* ─── PROBLEM ─── */}
      {cms.isVisible("problem") && problem.items?.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{problem.title}</h2>
              {problem.subtitle && <p className="text-muted-foreground leading-relaxed">{problem.subtitle}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto">
              {problem.items.map((p: string) => (
                <div key={p} className="flex items-center gap-3 p-4 rounded-lg border border-destructive/20 bg-destructive/5">
                  <XCircle className="w-5 h-5 text-destructive shrink-0" />
                  <span className="text-sm font-medium text-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── SOLUTION ─── */}
      {cms.isVisible("solution") && solution.items?.length > 0 && (
        <section className="py-16 sm:py-20 bg-card border-y border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{solution.title}</h2>
              {solution.subtitle && <p className="text-muted-foreground">{solution.subtitle}</p>}
            </div>
            <div className="space-y-3 max-w-lg mx-auto">
              {solution.items.map((s: string) => (
                <div key={s} className="flex items-center gap-3 p-4 rounded-lg border border-accent/20 bg-accent/5">
                  <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  <span className="text-sm font-medium text-foreground">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── KEY BENEFIT ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-5">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mb-2">
            <ClipboardList className="w-7 h-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">No More Paperwork</h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Replace all your paper logs with a simple digital system. Your team records everything in seconds. Your data is always saved, organized, and ready.
          </p>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      {cms.isVisible("features") && features.items?.length > 0 && (
        <section className="py-16 sm:py-20 bg-card border-y border-border">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">{features.title}</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.items.map((f: any) => {
                const Icon = FEATURE_ICONS[f.title] || ShieldCheck;
                return (
                  <div key={f.title} className="group p-6 rounded-xl border border-border bg-background hover:border-primary/30 hover:shadow-md transition-all">
                    <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <h3 className="text-base font-semibold text-foreground mb-1.5">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── INSPECTION ─── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mx-auto text-center space-y-4 mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">Always Ready for Inspection</h2>
            <p className="text-muted-foreground leading-relaxed">When an inspector visits, you can:</p>
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
      {cms.isVisible("targets") && targets.items?.length > 0 && (
        <section className="py-16 sm:py-20 bg-card border-y border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight mb-8">{targets.title}</h2>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {targets.items.map((t: string) => (
                <span key={t} className="px-5 py-2.5 rounded-full border border-border bg-background text-sm font-medium text-foreground">{t}</span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── CTA ─── */}
      {cms.isVisible("cta") && (
        <section className="py-16 sm:py-20 bg-primary">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-primary-foreground tracking-tight">{cta.title}</h2>
            {cta.subtitle && <p className="text-primary-foreground/80 text-base sm:text-lg max-w-xl mx-auto">{cta.subtitle}</p>}
            <Button size="lg" variant="secondary" className="text-base px-8 h-12 bg-background text-primary hover:bg-background/90" asChild>
              <Link to="/register">
                {cta.button}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* ─── CONTACT ─── */}
      {cms.isVisible("contact") && contact.items?.length > 0 && (
        <section className="py-16 sm:py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight text-center mb-10">{contact.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-3xl mx-auto">
              {contact.items.map((c: any) => {
                const Icon = CONTACT_ICONS[c.label] || User;
                return (
                  <div key={c.label} className="text-center p-5 rounded-xl border border-border bg-card space-y-2">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                      <Icon className="w-5 h-5 text-primary" />
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
                );
              })}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
};

export default Home;
