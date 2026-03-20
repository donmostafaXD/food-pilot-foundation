import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "./ScrollReveal";

export default function CTASection() {
  return (
    <section className="relative py-24 sm:py-32 bg-primary overflow-hidden">
      {/* Ambient light */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-primary-foreground/[0.06] blur-3xl pointer-events-none" />

      <ScrollReveal className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <h2
          className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-primary-foreground tracking-tight"
          style={{ lineHeight: 1.12 }}
        >
          Ready to Digitize Your
          <br className="hidden sm:block" />
          Food Safety System?
        </h2>
        <p className="text-primary-foreground/75 text-base sm:text-lg max-w-xl mx-auto" style={{ textWrap: "pretty" }}>
          Join food businesses that have switched from paperwork to a smart,
          digital food safety platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            size="lg"
            variant="secondary"
            className="text-base px-8 h-12 bg-background text-primary hover:bg-background/90 shadow-lg shadow-black/10 active:scale-[0.97] transition-transform"
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
            className="text-base px-8 h-12 border-primary-foreground/25 text-primary-foreground hover:bg-primary-foreground/10 active:scale-[0.97] transition-transform"
            asChild
          >
            <Link to="/login">Login to Dashboard</Link>
          </Button>
        </div>
      </ScrollReveal>
    </section>
  );
}
