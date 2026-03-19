import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const Register = () => {
  const [step, setStep] = useState<"credentials" | "organization" | "verify">("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [employeeCount, setEmployeeCount] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signUp, registerOrganization, user, profile } = useAuth();
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
    if (error) {
      setSubmitting(false);
      toast({ title: "Setup failed", description: error.message, variant: "destructive" });
      return;
    }

    // Save additional business profile fields
    try {
      // Re-fetch profile to get org id
      const { data: prof } = await supabase
        .from("profiles")
        .select("organization_id")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (prof?.organization_id) {
        await supabase
          .from("organizations")
          .update({
            country: country || null,
            city: city || null,
            employee_count: employeeCount ? parseInt(employeeCount, 10) : null,
            description: description || null,
          } as any)
          .eq("id", prof.organization_id);
      }
    } catch {
      // Non-critical — user can update later in settings
    }

    setSubmitting(false);
    toast({ title: "Welcome to FoodPilot!", description: "Your organization is ready." });
    navigate("/dashboard", { replace: true });
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
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="e.g. UAE" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City / Location</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g. Dubai" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="employees">Number of Employees</Label>
              <Input id="employees" type="number" min="1" value={employeeCount} onChange={(e) => setEmployeeCount(e.target.value)} placeholder="e.g. 15" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Business Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of your business" rows={2} className="resize-none" />
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
