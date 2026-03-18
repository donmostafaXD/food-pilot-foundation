import PublicLayout from "@/components/PublicLayout";
import { ShieldCheck, AlertTriangle, Target } from "lucide-react";

const About = () => {
  return (
    <PublicLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
            About FoodPilot
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            We help food businesses manage safety, compliance, and quality — digitally.
          </p>
        </div>

        {/* Sections */}
        <div className="grid gap-12">
          {/* What is Food Safety */}
          <div className="flex gap-5">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">What is Food Safety?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Food safety is the practice of handling, preparing, and storing food in ways that prevent foodborne illness. 
                It encompasses hygiene, temperature control, allergen management, and traceability — all critical for 
                protecting consumers and meeting regulatory requirements.
              </p>
            </div>
          </div>

          {/* Why HACCP Matters */}
          <div className="flex gap-5">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">Why HACCP Matters</h2>
              <p className="text-muted-foreground leading-relaxed">
                HACCP (Hazard Analysis and Critical Control Points) is a systematic, science-based approach to identifying 
                and controlling food safety hazards. It is internationally recognized and legally required in most countries. 
                Without a proper HACCP plan, businesses risk foodborne outbreaks, regulatory penalties, and loss of consumer trust.
              </p>
            </div>
          </div>

          {/* What FoodPilot Does */}
          <div className="flex gap-5">
            <div className="shrink-0 w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-2">What FoodPilot Does</h2>
              <p className="text-muted-foreground leading-relaxed">
                FoodPilot automates the creation and management of your entire Food Safety Management System (FSMS). 
                Select your business activity, and we generate tailored HACCP plans, SOPs, PRP programs, monitoring logs, 
                and audit-ready documents. Everything is digital, searchable, and always up-to-date — so you can focus on 
                running your business, not paperwork.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
};

export default About;