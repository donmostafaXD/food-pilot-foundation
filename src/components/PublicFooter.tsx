import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, ArrowRight } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/20">
                <ShieldCheck className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-extrabold text-foreground">FoodPilot</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The all-in-one digital food safety platform. Manage HACCP, logs, SOPs,
              and compliance — always audit-ready.
            </p>
            <Button size="sm" className="shadow-sm shadow-primary/20 active:scale-[0.97] transition-transform" asChild>
              <Link to="/register">
                Get Started
                <ArrowRight className="w-3 h-3 ml-1.5" />
              </Link>
            </Button>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider">Product</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><a href="/#demo-request" className="hover:text-foreground transition-colors">Request Demo</a></li>
              <li><a href="/#plans" className="hover:text-foreground transition-colors">Plans</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-xs font-bold text-foreground mb-4 uppercase tracking-wider">Account</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Register</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} FoodPilot. All rights reserved.</p>
          <p className="font-medium">Food Safety Made Simple. Digital. Ready.</p>
        </div>
      </div>
    </footer>
  );
}
