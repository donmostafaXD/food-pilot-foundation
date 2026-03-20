import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2 } from "lucide-react";
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
    <section id="demo-request" className="py-24 sm:py-32">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Copy */}
          <ScrollReveal>
            <div className="space-y-6">
              <p className="text-sm font-semibold text-primary uppercase tracking-wider">Request a Demo</p>
              <h2
                className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight"
                style={{ lineHeight: 1.12 }}
              >
                See FoodPilot in Action
              </h2>
              <p className="text-muted-foreground leading-relaxed max-w-md" style={{ textWrap: "pretty" }}>
                Get a personalized walkthrough of the platform. We'll show you how
                FoodPilot fits your specific food business operation.
              </p>
              <ul className="space-y-3.5 text-sm text-foreground">
                {[
                  "Personalized to your business type",
                  "See HACCP plan generation live",
                  "Understand the full feature set",
                  "No commitment required",
                ].map((t) => (
                  <li key={t} className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </ScrollReveal>

          {/* Form */}
          <ScrollReveal delay={120}>
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-lg shadow-black/[0.03]">
              {submitted ? (
                <div className="text-center space-y-4 py-8">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-7 h-7 text-accent" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">Request Received!</h3>
                  <p className="text-sm text-muted-foreground">We'll get back to you within 24 hours.</p>
                  <Button variant="outline" size="sm" onClick={() => setSubmitted(false)}>
                    Submit Another
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="demo-name" className="text-xs">Full Name</Label>
                      <Input id="demo-name" required placeholder="Your name" maxLength={100} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="demo-company" className="text-xs">Company Name</Label>
                      <Input id="demo-company" required placeholder="Your company" maxLength={100} />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="demo-email" className="text-xs">Email</Label>
                      <Input id="demo-email" type="email" required placeholder="you@company.com" maxLength={255} />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="demo-phone" className="text-xs">Phone (optional)</Label>
                      <Input id="demo-phone" type="tel" placeholder="+60 12 345 6789" maxLength={20} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="demo-type" className="text-xs">Business Type</Label>
                    <Input id="demo-type" placeholder="e.g. Restaurant, Bakery, Food Factory" maxLength={100} />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="demo-message" className="text-xs">Message (optional)</Label>
                    <Textarea id="demo-message" placeholder="Tell us about your needs…" rows={3} maxLength={500} />
                  </div>
                  <Button
                    type="submit"
                    className="w-full shadow-md shadow-primary/20 active:scale-[0.97] transition-transform"
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
