import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-20 sm:py-28 bg-primary">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center space-y-6">
        <h2
          className="text-2xl sm:text-3xl font-extrabold text-primary-foreground tracking-tight"
          style={{ lineHeight: 1.15 }}
        >
          Ready to Digitize Your Food Safety System?
        </h2>
        <p className="text-primary-foreground/80 text-base sm:text-lg max-w-xl mx-auto" style={{ textWrap: "pretty" }}>
          Join food businesses that have switched from paperwork to a smart,
          digital food safety platform.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            size="lg"
            variant="secondary"
            className="text-base px-8 h-12 bg-background text-primary hover:bg-background/90"
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
            className="text-base px-8 h-12 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
            asChild
          >
            <Link to="/login">Login to Dashboard</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
