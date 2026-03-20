import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Shield, LogIn, Play, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const DEMO_ACCOUNTS = [
  { label: "Basic", email: "demo_basic@foodpilot.com", plan: "basic", color: "bg-muted text-muted-foreground" },
  { label: "HACCP", email: "demo_haccp@foodpilot.com", plan: "professional", color: "bg-primary/10 text-primary" },
  { label: "Compliance", email: "demo_compliance@foodpilot.com", plan: "premium", color: "bg-accent/10 text-accent-foreground" },
  { label: "Full Demo", email: "demo_full@foodpilot.com", plan: "demo", color: "bg-destructive/10 text-destructive" },
];

const DEMO_PASSWORD = "123456";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const { signIn, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await signIn(email, password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Login failed", description: error.message, variant: "destructive" });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setDemoLoading(demoEmail);
    const { error } = await signIn(demoEmail, DEMO_PASSWORD);
    setDemoLoading(null);
    if (error) {
      toast({
        title: "Demo login failed",
        description: "Demo accounts may not be set up yet. Ask an admin to seed them.",
        variant: "destructive",
      });
    } else {
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold font-display text-foreground">FoodPilot</h1>
          <p className="text-sm text-muted-foreground">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-card shadow-md rounded-lg p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" disabled={submitting}>
            <LogIn className="w-4 h-4 mr-2" />
            {submitting ? "Signing in…" : "Sign In"}
          </Button>
        </form>

        {/* Demo Quick Switch */}
        <div className="bg-card shadow-sm rounded-lg p-4 space-y-3 border border-border">
          <div className="flex items-center gap-2">
            <Play className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick Demo Access</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((demo) => (
              <Button
                key={demo.email}
                variant="outline"
                size="sm"
                className="h-9 text-xs gap-1.5 justify-start"
                disabled={demoLoading !== null}
                onClick={() => handleDemoLogin(demo.email)}
              >
                {demoLoading === demo.email ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Badge variant="secondary" className={`text-[9px] px-1 py-0 ${demo.color}`}>
                    {demo.label}
                  </Badge>
                )}
                {demoLoading !== demo.email && <span className="truncate">{demo.label}</span>}
              </Button>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground text-center">
            Demo data may be reset periodically
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary hover:underline font-medium">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
