import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [step, setStep] = useState<"credentials" | "organization" | "verify">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp, registerOrganization, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: "Password too short", description: "Minimum 6 characters", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    const { error, needsVerification } = await signUp(email, password);
    setSubmitting(false);
    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
    } else if (needsVerification) {
      setStep("verify");
    } else {
      setStep("organization");
    }
  };

  const handleOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await registerOrganization(businessName, fullName);
    setSubmitting(false);
    if (error) {
      toast({ title: "Setup failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Welcome to FoodPilot!", description: "Your organization is ready." });
      navigate("/dashboard", { replace: true });
    }
  };

  // If user is logged in and has no org yet, show org step
  useEffect(() => {
    if (user && step === "credentials") {
      setStep("organization");
    }
  }, [user, step]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-semibold font-display text-foreground">FoodPilot</h1>
          <p className="text-sm text-muted-foreground">
            {step === "verify" ? "Check your email" : step === "organization" ? "Set up your organization" : "Create your account"}
          </p>
        </div>

        {step === "credentials" && (
          <form onSubmit={handleCredentials} className="bg-card shadow-industrial-md rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@company.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Min 6 characters" />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              {submitting ? "Creating account…" : "Create Account"}
            </Button>
          </form>
        )}

        {step === "verify" && (
          <div className="bg-card shadow-industrial-md rounded-lg p-6 space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              We sent a verification link to <strong className="text-foreground">{email}</strong>.
              Please check your inbox and click the link to continue.
            </p>
            <p className="text-xs text-muted-foreground">
              After verifying, return here and{" "}
              <Link to="/login" className="text-primary hover:underline">sign in</Link>.
            </p>
          </div>
        )}

        {step === "organization" && (
          <form onSubmit={handleOrganization} className="bg-card shadow-industrial-md rounded-lg p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Your Full Name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="John Smith" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} required placeholder="Acme Foods Ltd." />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Setting up…" : "Complete Setup"}
            </Button>
          </form>
        )}

        {step === "credentials" && (
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link to="/login" className="text-primary hover:underline font-medium">Sign In</Link>
          </p>
        )}
      </div>
    </div>
  );
};

export default Register;
