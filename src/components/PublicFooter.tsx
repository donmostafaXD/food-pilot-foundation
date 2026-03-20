import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";

export default function PublicFooter() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">FoodPilot</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              The all-in-one digital food safety platform. Manage HACCP, logs, SOPs,
              and compliance — always audit-ready.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="/#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
              <li><a href="/#demo-request" className="hover:text-foreground transition-colors">Request Demo</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">About</Link></li>
              <li><Link to="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-3">Account</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Register</Link></li>
              <li><a href="/#plans" className="hover:text-foreground transition-colors">Plans</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} FoodPilot. All rights reserved.</p>
          <p>Food Safety Made Simple. Digital. Ready.</p>
        </div>
      </div>
    </footer>
  );
}
