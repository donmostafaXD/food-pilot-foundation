import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 bg-foreground overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] rounded-full bg-primary/[0.1] blur-[100px] pointer-events-none" />

      <ScrollReveal className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 mb-2">
          <ShieldCheck className="w-7 h-7 text-primary" />
        </div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-background tracking-tight"
          style={{ lineHeight: 1.08 }}
        >
          Ready to Digitize Your
          <br className="hidden sm:block" />
          Food Safety System?
        </h2>
        <p className="text-background/50 text-base sm:text-lg max-w-xl mx-auto">
          Join food businesses that have switched from paperwork to a smart,
          digital food safety platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            variant="secondary"
            className="text-base px-10 h-13 bg-background text-foreground hover:bg-background/90 shadow-xl shadow-black/20 active:scale-[0.97] transition-transform"
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
            className="text-base px-10 h-13 border-background/15 text-background hover:bg-background/10 active:scale-[0.97] transition-transform"
            asChild
          >
            <Link to="/login">Login to Dashboard</Link>
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
