import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import ScrollReveal from "./ScrollReveal";

const plans = [
  {
    title: "Basic",
    subtitle: "Small food businesses",
    price: "Starter",
    features: [
      "1 activity & 1 branch",
      "Simplified HACCP plan",
      "Basic food safety logs",
      "Document generation",
      "Customizable system",
    ],
    popular: false,
  },
  {
    title: "HACCP",
    subtitle: "Growing operations",
    price: "Professional",
    features: [
      "Up to 3 activities & branches",
      "Full risk analysis",
      "Dynamic CCP/OPRP system",
      "SOP & PRP management",
      "Complete hazard library",
      "Editable HACCP plan",
    ],
    popular: true,
  },
  {
    title: "Compliance",
    subtitle: "Enterprise & certification",
    price: "Enterprise",
    features: [
      "Unlimited activities & branches",
      "Everything in HACCP",
      "Internal audit tools",
      "Full FSMS documentation",
      "Advanced reporting",
      "Compliance tracking",
    ],
    popular: false,
  },
];

export default function PricingSection() {
  return (
    <section id="plans" className="py-24 sm:py-32 bg-card/50 border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <ScrollReveal className="max-w-2xl mx-auto text-center space-y-5 mb-16">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em]">Plans & Pricing</p>
          <h2
            className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
            style={{ lineHeight: 1.1 }}
          >
            A Plan for Every Food Business
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Start small or go enterprise — scale your food safety system as your business grows.
          </p>
        </ScrollReveal>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((p, i) => (
            <ScrollReveal key={p.title} delay={i * 100}>
              <div
                className={`relative flex flex-col h-full rounded-2xl border transition-all duration-500 ${
                  p.popular
                    ? "border-primary shadow-2xl shadow-primary/[0.08] bg-card -translate-y-2"
                    : "border-border bg-card hover:border-primary/20 hover:shadow-xl hover:-translate-y-1"
                }`}
              >
                {p.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground text-xs px-4 py-1 shadow-lg shadow-primary/20 font-semibold">
                      <Crown className="w-3 h-3 mr-1.5" />
                      Recommended
                    </Badge>
                  </div>
                )}

                {/* Header */}
                <div className={`p-7 pb-0 ${p.popular ? "pt-9" : ""}`}>
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">{p.price}</p>
                  <h3 className="text-2xl font-extrabold text-foreground mt-1">{p.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{p.subtitle}</p>
                  <div className="mt-4 pb-6 border-b border-border">
                    <span className="text-lg font-bold text-foreground">Contact Us</span>
                  </div>
                </div>

                {/* Features */}
                <div className="p-7 flex-1">
                  <ul className="space-y-3">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-foreground">
                        <Check className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="p-7 pt-0 space-y-2.5">
                  <Button
                    className={`w-full h-11 active:scale-[0.97] transition-transform ${
                      p.popular ? "shadow-md shadow-primary/20" : ""
                    }`}
                    variant={p.popular ? "default" : "outline"}
                    asChild
                  >
                    <Link to="/register">
                      Get Started
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                  <Button className="w-full active:scale-[0.97] transition-transform" variant="ghost" size="sm" asChild>
                    <a href="#demo-request">Request Demo</a>
                  </Button>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        <ScrollReveal className="text-center mt-10">
          <Button variant="link" className="text-sm" asChild>
            <Link to="/pricing">
              View full plan comparison
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </ScrollReveal>
      </div>
    </section>
  );
}
