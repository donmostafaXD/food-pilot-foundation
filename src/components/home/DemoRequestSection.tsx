import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import ScrollReveal from "./ScrollReveal";

export default function DemoRequestSection() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      toast.success("Demo request sent! We'll contact you shortly.");
    }, 800);
  };

  return (
    <section id="demo-request" className="py-24 sm:py-32 bg-card/50 border-y border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <ScrollReveal>
            <div className="space-y-8">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-4">Request a Demo</p>
                <h2
                  className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
                  style={{ lineHeight: 1.1 }}
                >
                  See FoodPilot
                  <br />
                  in Action
                </h2>
              </div>
              <p className="text-muted-foreground leading-relaxed max-w-sm">
                Get a personalized walkthrough of the platform. We'll show you how
                FoodPilot fits your specific food business operation.
              </p>
              <ul className="space-y-4">
                {[
                  "Personalized to your business type",
                  "See HACCP plan generation live",
                  "Understand the full feature set",
                  "No commitment required",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-sm text-foreground font-medium">
                    <div className="w-5 h-5 rounded-full bg-accent/15 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-accent" />
                    </div>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal delay={120}>
            <div className="bg-card border border-border rounded-2xl p-7 sm:p-8 shadow-xl shadow-black/[0.04]">
              {submitted ? (
                <div className="text-center space-y-5 py-10">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">Request Received!</h3>
                    <p className="text-sm text-muted-foreground mt-2">We'll get back to you within 24 hours.</p>
                  </div>
                  <Button variant="outline" onClick={() => setSubmitted(false)}>
                    Submit Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="demo-name" className="text-xs font-semibold">Full Name</Label>
                      <Input id="demo-name" required placeholder="Your name" maxLength={100} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="demo-company" className="text-xs font-semibold">Company Name</Label>
                      <Input id="demo-company" required placeholder="Your company" maxLength={100} className="h-11" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="demo-email" className="text-xs font-semibold">Email</Label>
                      <Input id="demo-email" type="email" required placeholder="you@company.com" maxLength={255} className="h-11" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="demo-phone" className="text-xs font-semibold">Phone (optional)</Label>
                      <Input id="demo-phone" type="tel" placeholder="+60 12 345 6789" maxLength={20} className="h-11" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-type" className="text-xs font-semibold">Business Type</Label>
                    <Input id="demo-type" placeholder="e.g. Restaurant, Bakery, Food Factory" maxLength={100} className="h-11" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="demo-message" className="text-xs font-semibold">Message (optional)</Label>
                    <Textarea id="demo-message" placeholder="Tell us about your needs…" rows={3} maxLength={500} />
                  </div>
                  <Button
                    type="submit"
                    className="w-full h-12 text-base shadow-lg shadow-primary/20 active:scale-[0.97] transition-transform"
                    disabled={sending}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {sending ? "Sending…" : "Request Demo"}
                  </Button>
                </form>
              )}
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
