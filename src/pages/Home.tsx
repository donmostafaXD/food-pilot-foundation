import PublicLayout from "@/components/PublicLayout";
import HeroSection from "@/components/home/HeroSection";
import WhatWeOfferSection from "@/components/home/WhatWeOfferSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import PricingSection from "@/components/home/PricingSection";
import WhyChooseUsSection from "@/components/home/WhyChooseUsSection";
import DemoRequestSection from "@/components/home/DemoRequestSection";
import CTASection from "@/components/home/CTASection";

const Home = () => {
  return (
    <PublicLayout>
      <HeroSection />
      <WhatWeOfferSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <WhyChooseUsSection />
      <DemoRequestSection />
      <CTASection />
    </PublicLayout>
  );
};

export default Home;
