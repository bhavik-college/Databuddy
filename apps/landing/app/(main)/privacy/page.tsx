import Background from "@/app/components/background";
import Navbar from "@/app/components/navbar";
import Footer from "@/app/components/footer";
import FadeIn from "@/app/components/FadeIn";
import { ArrowLeft, Shield, Lock, Eye, Server, FileText, AlertCircle, ToggleLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { TrackingOptOut } from "@/app/components/tracking-opt-out";

export const metadata = {
  title: "Privacy Policy | Databuddy Analytics",
  description: "Learn how Databuddy Analytics collects, uses, and protects your data in compliance with global privacy regulations.",
  openGraph: {
    title: "Privacy Policy | Databuddy Analytics",
    description: "Learn how Databuddy Analytics collects, uses, and protects your data in compliance with global privacy regulations.",
    type: "website",
    url: "https://databuddy.cc/privacy",
  },
  twitter: {
    card: "summary_large_image",
    title: "Privacy Policy | Databuddy Analytics",
    description: "Learn how Databuddy Analytics collects, uses, and protects your data in compliance with global privacy regulations.",
  },
};

export default function PrivacyPolicyPage() {
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
                      Privacy-First Analytics
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-white">Privacy Policy</h1>
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
                      <h3 className="text-lg font-semibold text-white mt-0 mb-2">Our Privacy Commitment</h3>
                      <p className="m-0">
                        At Databuddy Analytics, we believe in privacy by design. Our analytics platform is built from the ground up 
                        to respect user privacy while providing powerful insights. We collect only what&apos;s necessary, 
                        anonymize data by default, and give you complete ownership of your analytics data.
                      </p>
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <TrackingOptOut />
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-sky-400" />
                    Introduction
                  </h2>
                  <p>
                    At Databuddy Analytics (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;), we respect your privacy and are committed to protecting your personal data. This privacy policy explains how we collect, use, and safeguard your information when you visit our website at <a href="https://databuddy.cc" target="_blank" rel="noopener noreferrer">databuddy.cc</a> (the &quot;Website&quot;) or use our analytics services (the &quot;Service&quot;).
                  </p>
                  
                  <h2 className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-sky-400" />
                    What Makes Our Analytics Different
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {[
                      {
                        title: "No Cookies",
                        description: "We don't use cookies or similar tracking technologies to identify users"
                      },
                      {
                        title: "No Personal Data",
                        description: "We don't collect or store personally identifiable information (PII)"
                      },
                      {
                        title: "No Cross-Site Tracking",
                        description: "We don't track users across different websites or services"
                      },
                      {
                        title: "No Data Selling",
                        description: "We don't sell your data to advertisers or third parties"
                      },
                      {
                        title: "Full Data Ownership",
                        description: "You own 100% of your analytics data with complete control"
                      },
                      {
                        title: "Minimal Data Collection",
                        description: "We only collect what's necessary for meaningful analytics"
                      }
                    ].map((item, index) => (
                      <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                        <h4 className="text-sky-400 font-medium text-sm mb-1">{item.title}</h4>
                        <p className="text-slate-300 text-sm m-0">{item.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <ToggleLeft className="h-5 w-5 text-sky-400" />
                    User Control & Transparency
                  </h2>
                  
                  <p>
                    We believe users should have control over their data and how it&apos;s collected. Our approach includes:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {[
                      {
                        title: "Easy Opt-Out",
                        description: "Users can opt out of analytics tracking with a simple toggle (see above)"
                      },
                      {
                        title: "Respects DNT",
                        description: "We honor Do Not Track browser settings automatically"
                      },
                      {
                        title: "No Persistent Identifiers",
                        description: "We use browser fingerprinting only for basic session tracking, not for persistent tracking"
                      },
                      {
                        title: "Anonymized Data",
                        description: "All IP addresses are anonymized before storage"
                      },
                      {
                        title: "Bot Filtering",
                        description: "We filter out bot traffic to ensure accurate analytics"
                      },
                      {
                        title: "Transparent Collection",
                        description: "Clear documentation of what data is collected and why"
                      }
                    ].map((item, index) => (
                      <div key={index} className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-4">
                        <h4 className="text-sky-400 font-medium text-sm mb-1">{item.title}</h4>
                        <p className="text-slate-300 text-sm m-0">{item.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-sky-400" />
                    Information We Collect
                  </h2>
                  
                  <h3>Information You Provide to Us</h3>
                  <p>
                    We collect information that you voluntarily provide to us when you:
                  </p>
                  <ul>
                    <li>Register for an account</li>
                    <li>Fill out a form on our Website</li>
                    <li>Subscribe to our newsletter</li>
                    <li>Contact us via email or our contact form</li>
                    <li>Participate in surveys or feedback requests</li>
                  </ul>
                  <p>
                    This information may include your name, email address, company name, website URL, and any other information you choose to provide.
                  </p>
                  
                  <h3>Information We Collect Automatically</h3>
                  <p>
                    When you visit our Website, our servers automatically record certain information about your visit. This may include:
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    {[
                      "IP address (anonymized)",
                      "Browser type and version",
                      "Operating system",
                      "Device type",
                      "Referrer URL (domain only)",
                      "Pages visited",
                      "Time and date of your visit",
                      "Time spent on pages",
                      "Screen dimensions",
                      "Language preferences",
                      "Interaction events",
                      "Country/region (not precise location)"
                    ].map((item, index) => (
                      <div key={index} className="flex items-center gap-2 bg-slate-800/30 px-3 py-2 rounded-md">
                        <div className="h-2 w-2 rounded-full bg-sky-400"></div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                  
                  <p>
                    We use this information to analyze trends, administer the Website, track users&apos; movements around the Website, and gather demographic information about our user base as a whole. This data is collected in an anonymized form that cannot be used to identify individual users.
                  </p>
                  
                  <div className="flex items-start gap-4 p-4 bg-slate-800/50 border border-slate-700/50 rounded-lg my-8">
                    <div className="mt-1">
                      <AlertCircle className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-white mt-0 mb-1">Important Note About Our Analytics Service</h4>
                      <p className="text-sm m-0">
                        When you implement our analytics service on your website, we process data on your behalf as a data processor. 
                        The data collected through our analytics script is owned by you and stored in your account. We do not use this 
                        data for our own purposes beyond providing the analytics service to you. Our tracking script respects user privacy 
                        by honoring Do Not Track settings, anonymizing IP addresses, and providing an easy opt-out mechanism.
                      </p>
                    </div>
                  </div>
                  
                  <h2 className="flex items-center gap-2">
                    <Server className="h-5 w-5 text-sky-400" />
                    How We Use Your Information
                  </h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {[
                      {
                        title: "Service Provision",
                        description: "To provide, operate, and maintain our Website and Services"
                      },
                      {
                        title: "Improvement",
                        description: "To improve, personalize, and expand our Website and Services"
                      },
                      {
                        title: "Analytics",
                        description: "To understand and analyze how you use our Website and Services"
                      },
                      {
                        title: "Development",
                        description: "To develop new products, services, features, and functionality"
                      },
                      {
                        title: "Communication",
                        description: "To send you service-related emails and updates"
                      },
                      {
                        title: "Support",
                        description: "To provide customer support and respond to your requests"
                      },
                      {
                        title: "Security",
                        description: "To detect, prevent, and address technical issues and security threats"
                      },
                      {
                        title: "Legal Compliance",
                        description: "To comply with legal obligations and enforce our Terms of Service"
                      }
                    ].map((item, index) => (
                      <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                        <h4 className="text-sky-400 font-medium text-sm mb-1">{item.title}</h4>
                        <p className="text-slate-300 text-sm m-0">{item.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  <h2>How We Share Your Information</h2>
                  <p>
                    We do not sell, trade, or otherwise transfer your personal information to outside parties except in the following circumstances:
                  </p>
                  <ul>
                    <li><strong>Service Providers:</strong> We may share your information with third-party service providers who perform services on our behalf, such as payment processing, data analysis, email delivery, hosting services, and customer service.</li>
                    <li><strong>Business Transfers:</strong> If we are involved in a merger, acquisition, or sale of all or a portion of our assets, your information may be transferred as part of that transaction.</li>
                    <li><strong>Legal Requirements:</strong> We may disclose your information if required to do so by law or in response to valid requests by public authorities.</li>
                    <li><strong>With Your Consent:</strong> We may share your information with your consent or as otherwise disclosed at the time of data collection or sharing.</li>
                  </ul>
                  
                  <h2>Data Security</h2>
                  <p>
                    We implement appropriate technical and organizational measures to protect the security of your personal information, including:
                  </p>
                  <ul>
                    <li>Encryption of data in transit and at rest</li>
                    <li>Regular security assessments and penetration testing</li>
                    <li>Access controls and authentication requirements</li>
                    <li>Regular security training for our team</li>
                    <li>Monitoring for suspicious activities</li>
                  </ul>
                  <p>
                    However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure.
                  </p>
                  
                  <h2>Your Data Protection Rights</h2>
                  <p>
                    Depending on your location, you may have the following rights regarding your personal data:
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {[
                      {
                        title: "Right to Access",
                        description: "Request copies of your personal data"
                      },
                      {
                        title: "Right to Rectification",
                        description: "Request correction of inaccurate data"
                      },
                      {
                        title: "Right to Erasure",
                        description: "Request deletion of your personal data"
                      },
                      {
                        title: "Right to Restrict Processing",
                        description: "Request limitation of how we use your data"
                      },
                      {
                        title: "Right to Object",
                        description: "Object to our processing of your data"
                      },
                      {
                        title: "Right to Data Portability",
                        description: "Request transfer of your data"
                      }
                    ].map((item, index) => (
                      <div key={index} className="bg-slate-800/30 rounded-lg p-3">
                        <h4 className="text-white font-medium text-sm mb-1">{item.title}</h4>
                        <p className="text-slate-300 text-sm m-0">{item.description}</p>
                      </div>
                    ))}
                  </div>
                  
                  <p>
                    If you would like to exercise any of these rights, please contact us at <span className="text-sky-400">privacy@databuddy.cc</span>.
                  </p>
                  
                  <h2>Cookies Policy</h2>
                  <p>
                    Our Website uses minimal cookies that are necessary for the Website to function properly. These cookies do not track you for marketing purposes. Our analytics service does not use cookies for tracking website visitors. Instead, we use a privacy-focused approach that relies on anonymous browser fingerprinting only for basic session tracking, not for persistent tracking across sessions or websites.
                  </p>
                  
                  <h2>Children&apos;s Privacy</h2>
                  <p>
                    Our Website and Services are not intended for children under the age of 16. We do not knowingly collect personal information from children under 16. If you are a parent or guardian and believe that your child has provided us with personal information, please contact us.
                  </p>
                  
                  <h2>Changes to This Privacy Policy</h2>
                  <p>
                    We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
                  </p>
                  
                  <h2>Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us at:
                  </p>
                  <p className="text-sky-400">
                    privacy@databuddy.cc
                  </p>
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