import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Check, Crown, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    title: "Basic",
    subtitle: "Small food businesses",
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
    <section id="plans" className="py-20 sm:py-28">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center space-y-4 mb-14">
          <p className="text-sm font-semibold text-primary uppercase tracking-wider">Plans & Pricing</p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight" style={{ lineHeight: 1.15 }}>
            A Plan for Every Food Business
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto leading-relaxed" style={{ textWrap: "pretty" }}>
            Start small or go enterprise — scale your food safety system as your business grows.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {plans.map((p) => (
            <div
              key={p.title}
              className={`relative flex flex-col rounded-xl border p-6 transition-all ${
                p.popular
                  ? "border-primary ring-2 ring-primary/20 shadow-lg bg-card"
                  : "border-border bg-card hover:border-primary/20 hover:shadow-md"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground text-xs px-3 py-0.5">
                    <Crown className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}

              <div className="space-y-2 mb-6 pt-2">
                <h3 className="text-xl font-bold text-foreground">{p.title}</h3>
                <p className="text-sm text-muted-foreground">{p.subtitle}</p>
                <p className="text-2xl font-extrabold text-foreground">Contact Us</p>
              </div>

              <ul className="space-y-2.5 flex-1 mb-6">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2">
                <Button className="w-full" variant={p.popular ? "default" : "outline"} asChild>
                  <Link to="/register">Get Started</Link>
                </Button>
                <Button className="w-full" variant="ghost" size="sm" asChild>
                  <a href="#demo-request">Request Demo</a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="link" asChild>
            <Link to="/pricing" className="text-sm">
              View full plan comparison
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
