import { Link } from "react-router-dom";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Phone, Mail, ArrowRight } from "lucide-react";

const plans = [
  {
    key: "basic",
    title: "Basic",
    subtitle: "For Owners & Managers (Food Service)",
    description: "Designed for small food businesses to manage food safety easily.",
    bestFor: [
      "Restaurants",
      "Cafes",
      "Juice Bars",
      "Ice Cream Shops",
      "Bakeries",
      "Cloud Kitchens",
      "Catering services",
    ],
    features: [
      "Food Service activities setup",
      "Simplified HACCP Plan (auto-generated)",
      "CCP / OPRP / PRP identification",
      "Critical limits & monitoring",
      "Basic logs (temperature, cleaning, etc.)",
      "Document generation",
      "Fully customizable system",
    ],
    note: "Create a HACCP plan if you don't have one — or manage your existing system digitally instead of paper.",
    popular: false,
  },
  {
    key: "professional",
    title: "HACCP",
    subtitle: "Full HACCP System for Growing Businesses",
    description: "Complete HACCP solution with full risk analysis and multi-process coverage.",
    bestFor: [
      "Large restaurants & central kitchens",
      "Food factories (Manufacturing)",
      "Expanding food businesses",
    ],
    features: [
      "Food Service + Manufacturing processes",
      "Full risk analysis (Severity × Likelihood)",
      "Dynamic CCP / OPRP decision system",
      "Editable HACCP plan",
      "Complete hazard library",
      "SOP & Logs management",
      "Supports up to 3 branches",
      "Fully customizable system",
    ],
    popular: true,
  },
  {
    key: "premium",
    title: "Compliance",
    subtitle: "Advanced Food Safety & Certification Ready",
    description: "Enterprise-level solution for full compliance, audits, and certifications.",
    bestFor: [
      "Food factories",
      "Multi-branch businesses",
      "Companies preparing for audits (HACCP / ISO)",
    ],
    features: [
      "Everything in HACCP plan",
      "Internal audit tools",
      "Compliance tracking",
      "Full FSMS documentation",
      "PRP programs",
      "SOP management",
      "Multi-branch (unlimited)",
      "Advanced reporting",
      "Fully customizable system",
    ],
    popular: false,
  },
  {
    key: "custom",
    title: "Custom Plan",
    subtitle: "Tailored to Your Business Needs",
    description: "A fully customized system based on your operation.",
    bestFor: [],
    features: [
      "Custom modules & workflows",
      "Custom HACCP setup",
      "Industry-specific configuration",
      "Dedicated support",
      "Flexible number of branches",
    ],
    popular: false,
    isCustom: true,
  },
];

const PricingPublic = () => {
  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Plans Built for Food Safety
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            Whether you run a single café or a multi-branch factory — FoodPilot scales with your
            food safety needs. No hidden fees, no complexity.
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {plans.map((plan) => (
            <Card
              key={plan.key}
              className={`relative flex flex-col transition-all ${
                plan.popular
                  ? "border-primary ring-2 ring-primary/20 scale-[1.01] shadow-lg"
                  : "border-border"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5">
                    <Crown className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3 pt-6 space-y-2">
                <CardTitle className="text-xl font-bold text-foreground">
                  {plan.title}
                </CardTitle>
                <p className="text-xs font-semibold text-primary">{plan.subtitle}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {plan.description}
                </p>
                <div className="pt-2">
                  <span className="text-2xl font-extrabold text-foreground">Contact Us</span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 flex flex-col gap-5">
                {/* Best For */}
                {plan.bestFor.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                      Best for
                    </p>
                    <ul className="space-y-1">
                      {plan.bestFor.map((item) => (
                        <li key={item} className="flex items-center gap-1.5 text-xs text-foreground">
                          <ArrowRight className="w-3 h-3 text-primary shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Features */}
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Includes
                  </p>
                  <ul className="space-y-2 flex-1">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                        <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Note (Basic plan) */}
                {plan.note && (
                  <div className="bg-muted/50 rounded-md p-3 text-xs text-muted-foreground leading-relaxed border border-border">
                    💡 {plan.note}
                  </div>
                )}

                {/* CTAs */}
                <div className="mt-auto space-y-2 pt-2">
                  {(plan as any).isCustom ? (
                    <Button className="w-full" variant="default" asChild>
                      <Link to="/contact">
                        <Mail className="w-4 h-4 mr-2" />
                        Contact Us
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        className="w-full"
                        variant={plan.popular ? "default" : "outline"}
                        asChild
                      >
                        <Link to="/register">Get Started</Link>
                      </Button>
                      <div className="flex gap-2">
                        <Button className="flex-1" variant="ghost" size="sm" asChild>
                          <Link to="/contact">
                            <Phone className="w-3 h-3 mr-1" />
                            Contact Us
                          </Link>
                        </Button>
                        <Button className="flex-1" variant="ghost" size="sm" asChild>
                          <Link to="/contact">Request Demo</Link>
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Global Note */}
        <div className="max-w-3xl mx-auto text-center space-y-6 bg-muted/30 rounded-xl p-8 border border-border">
          <h2 className="text-xl font-bold text-foreground">
            How FoodPilot Works for You
          </h2>
          <div className="grid sm:grid-cols-2 gap-4 text-sm text-foreground">
            <div className="flex items-start gap-3 text-left">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Build your HACCP system</strong> if you don't have one yet
              </span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Digitize & manage</strong> your existing HACCP system
              </span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Fully customizable</strong> & editable based on your operation
              </span>
            </div>
            <div className="flex items-start gap-3 text-left">
              <Check className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <span>
                <strong>Replace paperwork</strong> with a smart digital system
              </span>
            </div>
          </div>
          <div className="pt-4">
            <Button size="lg" asChild>
              <Link to="/contact">
                <Mail className="w-4 h-4 mr-2" />
                Get in Touch
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default PricingPublic;
