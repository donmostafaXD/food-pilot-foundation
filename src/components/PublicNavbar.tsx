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
    // If already on home page, scroll directly
    if (window.location.pathname === "/") {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    } else {
      // Navigate to home then scroll
      window.location.href = to;
    }
  }
}

export default function PublicNavbar() {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <ShieldCheck className="w-4.5 h-4.5 text-primary-foreground" />
          </div>
          <span className="text-lg font-bold tracking-tight text-foreground">FoodPilot</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
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
                className="px-3 py-2 text-sm font-medium rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-secondary"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? "text-primary bg-primary/5"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Login</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>

        {/* Mobile toggle */}
        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Toggle menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 pb-4 space-y-1">
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
                className="block px-3 py-2.5 text-sm font-medium rounded-md text-muted-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2.5 text-sm font-medium rounded-md ${
                  pathname === l.to ? "text-primary bg-primary/5" : "text-muted-foreground"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <Link to="/login" onClick={() => setOpen(false)}>Login</Link>
            </Button>
            <Button size="sm" className="flex-1" asChild>
              <Link to="/register" onClick={() => setOpen(false)}>Get Started</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
