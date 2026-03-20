import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Menu, X } from "lucide-react";

const links = [
  { label: "Home", to: "/" },
  { label: "Features", to: "/#features" },
  { label: "Plans", to: "/#plans" },
  { label: "Demo", to: "/#demo-request" },
  { label: "Pricing", to: "/pricing" },
  { label: "Contact", to: "/contact" },
];

function handleAnchorClick(to: string, setOpen: (v: boolean) => void) {
  setOpen(false);
  if (to.startsWith("/#")) {
    const id = to.slice(2);
    if (window.location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      window.location.href = to;
    }
  }
}

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
            <ShieldCheck className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-foreground">FoodPilot</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {links.map((l) => {
            const isAnchor = l.to.startsWith("/#");
            const isActive = !isAnchor && pathname === l.to;

            return isAnchor ? (
              <a
                key={l.to}
                href={l.to}
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault();
                    handleAnchorClick(l.to, setOpen);
                  }
                }}
                className="px-3.5 py-2 text-sm font-medium rounded-lg transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary/80"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2.5">
          <Button variant="ghost" size="sm" className="font-semibold" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button size="sm" className="shadow-sm shadow-primary/20 font-semibold active:scale-[0.97] transition-transform" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2 rounded-lg hover:bg-secondary transition-colors" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background px-4 pb-5 pt-2 space-y-1">
          {links.map((l) => {
            const isAnchor = l.to.startsWith("/#");
            return isAnchor ? (
              <a
                key={l.to}
                href={l.to}
                onClick={(e) => {
                  if (pathname === "/") {
                    e.preventDefault();
                    handleAnchorClick(l.to, setOpen);
                  } else {
                    setOpen(false);
                  }
                }}
                className="block px-4 py-3 text-sm font-medium rounded-lg text-muted-foreground hover:bg-secondary transition-colors"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`block px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  pathname === l.to ? "text-primary bg-primary/5" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="flex gap-2 pt-3">
            <Button variant="outline" size="sm" className="flex-1 h-11 font-semibold" asChild>
              <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
            </Button>
            <Button size="sm" className="flex-1 h-11 font-semibold shadow-sm shadow-primary/20" asChild>
              <Link to="/register" onClick={() => setOpen(false)}>Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
