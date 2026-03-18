import { useState } from "react";
import PublicLayout from "@/components/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    // Simulate sending
    setTimeout(() => {
      setSending(false);
      setSubmitted(true);
      toast.success("Message sent! We'll get back to you soon.");
    }, 800);
  };

  return (
    <PublicLayout>
      <div className="max-w-xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            Contact Us
          </h1>
          <p className="text-muted-foreground">
            Have a question or need help? Send us a message and we'll respond within 24 hours.
          </p>
        </div>

        {submitted ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7 text-accent" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">Message Sent!</h2>
            <p className="text-sm text-muted-foreground">Thanks for reaching out. We'll get back to you shortly.</p>
            <Button variant="outline" onClick={() => setSubmitted(false)}>Send Another</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 sm:p-8 space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" required placeholder="Your full name" maxLength={100} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required placeholder="you@company.com" maxLength={255} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" required placeholder="How can we help?" rows={5} maxLength={1000} />
            </div>
            <Button type="submit" className="w-full" disabled={sending}>
              <Send className="w-4 h-4 mr-2" />
              {sending ? "Sending…" : "Send Message"}
            </Button>
          </form>
        )}
      </div>
    </PublicLayout>
  );
};

export default Contact;