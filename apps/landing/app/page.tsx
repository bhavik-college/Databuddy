import Background from "./components/background";
import Navbar from "./components/navbar";
import FadeIn from "./components/FadeIn";
import SidebarNavigation from "./components/sidebar-navigation";
import Hero from "./components/hero";
import Features from "./components/features";

import dynamic from "next/dynamic"; 

const CTA = dynamic(() => import("./components/cta"), { ssr: true });
const Privacy = dynamic(() => import("./components/privacy"), { ssr: true });
const FAQ = dynamic(() => import("./components/faq"), { ssr: true });
const Comparison = dynamic(() => import("./components/comparison"), { ssr: true });
const Pricing = dynamic(() => import("./components/pricing"), { ssr: true });
const Performance = dynamic(() => import("./components/performance"), { ssr: true });
const Mission = dynamic(() => import("./components/mission"), { ssr: true });
const Roadmap = dynamic(() => import("./components/roadmap"), { ssr: true });
const Testimonials = dynamic(() => import("./components/testimonials"), { ssr: true });
const Contact = dynamic(() => import("./components/contact"), { ssr: true });
const SocialProof = dynamic(() => import("./components/social-proof"), { ssr: true });
const Footer = dynamic(() => import("./components/footer"), { ssr: true });
const EarlyAccessPopup = dynamic(() => import("./components/EarlyAccessPopup"), { ssr: true });

export default function Home() {
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scroll-smooth">
        <Navbar />
        <SidebarNavigation />
        <FadeIn>
          <Hero />
        </FadeIn>
        <FadeIn delay={100}>
          <div id="features">
            <Features />
          </div>
        </FadeIn>
        {/* <FadeIn delay={100}>
          <SocialProof />
        </FadeIn> */}
        <FadeIn delay={100}>
          <div id="privacy">
            <Privacy />
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div id="mission">
            <Mission />
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div id="compare">
            <Comparison />
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div id="performance">
            <Performance />
          </div>
        </FadeIn>
        {/* <FadeIn delay={100}>
          <Testimonials />
        </FadeIn> */}
        {/* <FadeIn delay={100}>
          <Roadmap />
        </FadeIn> */}
        <FadeIn delay={100}>
          <div id="pricing">
            <Pricing />
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div id="faq">
            <FAQ />
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div id="contact">
            <Contact />
          </div>
        </FadeIn>
        <FadeIn delay={100}>
          <div id="cta-form">
            <CTA />
          </div>
        </FadeIn>
        <Footer />
        
        {/* Early Access Popup with Typeform link */}
        <EarlyAccessPopup typeformUrl="https://form.typeform.com/to/yXiXwsDD" />
      </div>
    </div>
  );
}
