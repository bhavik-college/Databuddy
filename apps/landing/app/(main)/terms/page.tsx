import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import FadeIn from "@/app/components/FadeIn";
import { ArrowLeft, FileText, Shield, Scale, AlertTriangle, Clock, Users, CreditCard, HelpCircle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata = {
  title: "Terms of Service | Databuddy Analytics",
  description: "The terms and conditions governing the use of Databuddy Analytics services and website.",
  openGraph: {
    title: "Terms of Service | Databuddy Analytics",
    description: "The terms and conditions governing the use of Databuddy Analytics services and website.",
    type: "website",
    url: "https://databuddy.cc/terms",
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms of Service | Databuddy Analytics",
    description: "The terms and conditions governing the use of Databuddy Analytics services and website.",
  },
};

export default function TermsOfServicePage() {
  const lastUpdated = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  
  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        <main className="py-16">
          <FadeIn>
            <div className="container mx-auto px-4 max-w-4xl">
              <Link 
                href="/" 
                className="inline-flex items-center text-sky-400 hover:text-sky-300 mb-8 transition-colors"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
              
              <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 sm:p-8 mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                  <div>
                    <Badge variant="outline" className="mb-3 border-sky-500/20 bg-sky-500/10 text-sky-400">
                      Legal Document
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Terms of Service</h1>
                  </div>
                  <div className="text-sm text-slate-400 bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700/50">
                    Last Updated: {lastUpdated}
                  </div>
                </div>
                
                <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-slate-300 prose-a:text-sky-400 prose-a:no-underline hover:prose-a:text-sky-300 prose-li:text-slate-300">
                  <div className="flex items-start gap-4 p-4 bg-sky-500/10 border border-sky-500/20 rounded-lg mb-8">
                    <div className="mt-1">
                      <Shield className="h-6 w-6 text-sky-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white mt-0 mb-2">Our Commitment</h3>
                      <p className="m-0">
                        At Databuddy Analytics, we&apos;re committed to transparency and fairness. These Terms of Service are designed 
                        to clearly outline the rules and guidelines for using our services. We&apos;ve made every effort to use plain 
                        language and avoid confusing legal jargon wherever possible.
                      </p>
                    </div>
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-sky-400" />
                    1. Introduction
                  </h2>
                  <p>
                    Welcome to Databuddy Analytics (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). These Terms of Service (&quot;Terms&quot;) govern your access to and use of the Databuddy Analytics website at <a href="https://databuddy.cc" target="_blank" rel="noopener noreferrer">databuddy.cc</a> (the &quot;Website&quot;) and our analytics services (the &quot;Service&quot;).
                  </p>
                  <p>
                    By accessing or using our Website or Services, you agree to be bound by these Terms. If you do not agree to these Terms, please do not access or use our Website or Services.
                  </p>
                  
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4 my-6">
                    <h3 className="text-lg font-semibold mb-2">Quick Summary</h3>
                    <p className="text-sm mb-3">These Terms of Service cover:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        "How you can use our service",
                        "Your account responsibilities",
                        "Privacy and data protection",
                        "Billing and subscription details",
                        "Intellectual property rights",
                        "Limitations of liability",
                        "How we handle disputes"
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-md">
                          <div className="h-2 w-2 rounded-full bg-sky-400"></div>
                          <span className="text-sm">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-sky-400" />
                    2. Definitions
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-3 mb-6">
                    {[
                      {
                        term: "Account",
                        definition: "A unique account created for you to access our Service."
                      },
                      {
                        term: "User",
                        definition: "The individual accessing or using the Service, or the company or other legal entity on behalf of which such individual is accessing or using the Service, as applicable."
                      },
                      {
                        term: "Website",
                        definition: "Databuddy Analytics, accessible from databuddy.cc."
                      },
                      {
                        term: "Service",
                        definition: "The analytics platform provided by Databuddy Analytics."
                      }
                    ].map((item, index) => (
                      <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                        <h4 className="text-sky-400 font-medium text-sm mb-1">{item.term}</h4>
                        <p className="text-slate-300 text-sm m-0">{item.definition}</p>
                      </div>
                    ))}
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-sky-400" />
                    3. Account Registration
                  </h2>
                  <p>
                    To use certain features of the Service, you may be required to register for an Account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
                  </p>
                  <p>
                    You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password. You agree not to disclose your password to any third party. You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your Account.
                  </p>
                  
                  <h2 className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-sky-400" />
                    4. Use of the Service
                  </h2>
                  
                  <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">4.1 Service License</h3>
                    <p className="mb-0">
                      Subject to these Terms, we grant you a limited, non-exclusive, non-transferable, and revocable license to use the Service for your personal or business purposes.
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">4.2 Restrictions</h3>
                    <p className="mb-3">
                      You agree not to, and will not permit others to:
                    </p>
                    <ul className="space-y-2 mb-0">
                      <li>License, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose, or otherwise commercially exploit the Service.</li>
                      <li>Modify, make derivative works of, disassemble, decrypt, reverse compile, or reverse engineer any part of the Service.</li>
                      <li>Remove, alter, or obscure any proprietary notice (including any notice of copyright or trademark) of Databuddy Analytics or its affiliates, partners, suppliers, or licensors.</li>
                      <li>Use the Service in any way that violates any applicable local, state, national, or international law or regulation.</li>
                      <li>Use the Service for any purpose that is harmful, fraudulent, deceptive, threatening, harassing, defamatory, obscene, or otherwise objectionable.</li>
                      <li>Engage in any activity that interferes with or disrupts the Service (or the servers and networks connected to the Service).</li>
                      <li>Attempt to bypass any measures we may use to prevent or restrict access to the Service.</li>
                    </ul>
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-sky-400" />
                    5. Privacy Policy
                  </h2>
                  <p>
                    Our Privacy Policy describes how we handle the information you provide to us when you use our Service. You understand that by using the Service, you consent to the collection and use of this information as set forth in the <Link href="/privacy" className="text-sky-400 hover:text-sky-300">Privacy Policy</Link>.
                  </p>
                  
                  <div className="flex items-start gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg my-6">
                    <div className="mt-1">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white mt-0 mb-1">Privacy-First Approach</h4>
                      <p className="text-sm m-0">
                        Our analytics service is designed with privacy at its core. We do not use cookies for tracking, 
                        do not collect personally identifiable information, and do not track users across different websites. 
                        For more details, please review our <Link href="/privacy" className="text-sky-400 hover:text-sky-300">Privacy Policy</Link>.
                      </p>
                    </div>
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-sky-400" />
                    6. Intellectual Property
                  </h2>
                  
                  <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">6.1 Our Intellectual Property</h3>
                    <p className="mb-0">
                      The Service and its original content, features, and functionality are and will remain the exclusive property of Databuddy Analytics and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of Databuddy Analytics.
                    </p>
                  </div>
                  
                  <div className="bg-slate-800/30 rounded-lg p-4 mb-4">
                    <h3 className="text-lg font-semibold mb-2">6.2 Your Data</h3>
                    <p className="mb-0">
                      You retain all rights to your data that you upload, submit, or otherwise make available through the Service. By providing any data to us, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such data in connection with providing the Service to you.
                    </p>
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5 text-sky-400" />
                    7. Subscription and Billing
                  </h2>
                  
                  <div className="grid grid-cols-1 gap-4 mb-6">
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2">7.1 Subscription Plans</h3>
                      <p className="mb-0">
                        Some parts of the Service are billed on a subscription basis. You will be billed in advance on a recurring and periodic basis, depending on the type of subscription plan you select.
                      </p>
                    </div>
                    
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2">7.2 Free Trial</h3>
                      <p className="mb-0">
                        We may, at our sole discretion, offer a subscription with a free trial for a limited period of time. You may be required to enter your billing information to sign up for the free trial. If you do enter your billing information when signing up for a free trial, you will not be charged until the free trial has expired.
                      </p>
                    </div>
                    
                    <div className="bg-slate-800/30 rounded-lg p-4">
                      <h3 className="text-lg font-semibold mb-2">7.3 Changes to Fees</h3>
                      <p className="mb-0">
                        We reserve the right to change our subscription fees at any time. If we change our fees, we will provide notice of the change on the Website or by email, at our option, at least 30 days before the change is to take effect. Your continued use of the Service after the fee change becomes effective constitutes your agreement to pay the changed amount.
                      </p>
                    </div>
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-sky-400" />
                    8. Termination
                  </h2>
                  <p>
                    We may terminate or suspend your Account and access to the Service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach these Terms.
                  </p>
                  <p>
                    Upon termination, your right to use the Service will immediately cease. If you wish to terminate your Account, you may simply discontinue using the Service or contact us to request Account deletion.
                  </p>
                  
                  <h2 className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-sky-400" />
                    9. Limitation of Liability
                  </h2>
                  <p>
                    In no event shall Databuddy Analytics, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from:
                  </p>
                  <ul className="space-y-2">
                    <li>Your access to or use of or inability to access or use the Service.</li>
                    <li>Any conduct or content of any third party on the Service.</li>
                    <li>Any content obtained from the Service.</li>
                    <li>Unauthorized access, use, or alteration of your transmissions or content.</li>
                  </ul>
                  
                  <div className="flex items-start gap-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg my-6">
                    <div className="mt-1">
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white mt-0 mb-1">Important Notice</h4>
                      <p className="text-sm m-0">
                        Some jurisdictions do not allow the exclusion of certain warranties or the limitation or exclusion of liability for certain types of damages. 
                        Therefore, some of the above limitations in this section may not apply to you.
                      </p>
                    </div>
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-sky-400" />
                    10. Disclaimer
                  </h2>
                  <p>
                    Your use of the Service is at your sole risk. The Service is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis. The Service is provided without warranties of any kind, whether express or implied, including, but not limited to, implied warranties of merchantability, fitness for a particular purpose, non-infringement, or course of performance.
                  </p>
                  
                  <h2 className="flex items-center gap-2">
                    <Scale className="h-5 w-5 text-sky-400" />
                    11. Governing Law
                  </h2>
                  <p>
                    These Terms shall be governed and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
                  </p>
                  <p>
                    Our failure to enforce any right or provision of these Terms will not be considered a waiver of those rights. If any provision of these Terms is held to be invalid or unenforceable by a court, the remaining provisions of these Terms will remain in effect.
                  </p>
                  
                  <h2 className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-sky-400" />
                    12. Changes to Terms
                  </h2>
                  <p>
                    We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days&apos; notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
                  </p>
                  <p>
                    By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms. If you do not agree to the new terms, you are no longer authorized to use the Service.
                  </p>
                  
                  <h2 className="flex items-center gap-2">
                    <HelpCircle className="h-5 w-5 text-sky-400" />
                    13. Contact Us
                  </h2>
                  
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-5 mt-6">
                    <h3 className="text-lg font-semibold mb-3">Have questions about our Terms?</h3>
                    <p className="mb-4">
                      If you have any questions about these Terms of Service, please don&apos;t hesitate to reach out to us.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 bg-slate-900/70 p-4 rounded-lg">
                        <h4 className="text-sky-400 font-medium mb-2">Email Us</h4>
                        <p className="text-white text-sm mb-1">Legal Team:</p>
                        <a href="mailto:legal@databuddy.cc" className="text-sky-400 hover:text-sky-300 transition-colors">
                          legal@databuddy.cc
                        </a>
                      </div>
                      <div className="flex-1 bg-slate-900/70 p-4 rounded-lg">
                        <h4 className="text-sky-400 font-medium mb-2">Business Hours</h4>
                        <p className="text-white text-sm mb-1">We typically respond within 24-48 hours:</p>
                        <p className="text-slate-400 text-sm">Monday - Friday, 9am - 5pm EST</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>
        </main>
        <Footer />
      </div>
    </div>
  );
} 