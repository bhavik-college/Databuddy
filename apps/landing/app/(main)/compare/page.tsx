"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, AlertCircle, Info, Star } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";

// Import Navbar and Footer components
const Navbar = dynamic(() => import("@/app/components/navbar"), { ssr: true });
const Footer = dynamic(() => import("@/app/components/footer"), { ssr: true });

// Define competitor data
const competitors = [
  {
    id: "google-analytics",
    name: "Google Analytics",
    logo: "/images/competitors/google-analytics.svg",
    overview: "The dominant player in web analytics, offering a wide range of features and integrations. It's free for basic usage but requires a paid version (Google Analytics 360) for advanced capabilities.",
    strengths: [
      "Comprehensive Features: Extensive data collection, advanced segmentation, custom reports, integration with other Google products (Ads, Search Console), attribution modeling.",
      "Free (Basic Version): The free version makes it accessible to a wide range of users.",
      "Large Ecosystem: A vast ecosystem of plugins, integrations, and resources."
    ],
    weaknesses: [
      "Privacy Concerns: Data is shared with Google, raising privacy concerns and potentially violating GDPR/CCPA.",
      "Complexity: Can be overwhelming for beginners due to the vast number of features and settings.",
      "Performance Impact: The tracking script can slow down website loading times.",
      "Data Ownership: Google controls the data."
    ],
    ratings: {
      privacy: 1,
      easeOfUse: 3,
      features: 5,
      pricing: 3,
      performance: 1,
      targetAudience: "Wide range, from small businesses to enterprises",
      dataOwnership: "Google",
      customization: 5
    },
    outshine: "Databuddy is focused on SMBs and ease of use. It's cheaper than GA and respects the data it collects, compared to Google."
  },
  {
    id: "fathom",
    name: "Fathom Analytics",
    logo: "/images/competitors/fathom.svg",
    overview: "A simple, privacy-focused analytics tool that is easy to use and doesn't rely on cookies.",
    strengths: [
      "Privacy-Focused: Doesn't use cookies, complies with GDPR/CCPA, anonymizes data.",
      "Ease of Use: Simple and intuitive interface, easy to set up and understand.",
      "Clean Interface: The interface is very simple and can even be loaded very quickly.",
      "Fast Performance: Lightweight tracking script has minimal impact on website speed.",
      "Good support: Responsive and easy-to-contact support"
    ],
    weaknesses: [
      "Limited Features: Fewer features than Google Analytics (e.g., no advanced segmentation, custom reports).",
      "Pricing: Paid tool, which may be a barrier for some users."
    ],
    ratings: {
      privacy: 5,
      easeOfUse: 5,
      features: 2,
      pricing: 2,
      performance: 5,
      targetAudience: "Bloggers, small businesses, and website owners who value privacy and simplicity",
      dataOwnership: "Customer",
      customization: 2
    },
    outshine: "Databuddy uses its AI capabilities to help companies gain a competitive advantage. Even if both use ethical privacy rules and guidelines, Databuddy does that on top of powerful integration tools!"
  },
  {
    id: "plausible",
    name: "Plausible Analytics",
    logo: "/images/competitors/plausible.svg",
    overview: "Another simple, privacy-focused analytics tool that is open-source and lightweight.",
    strengths: [
      "Privacy-Focused: Doesn't use cookies, complies with GDPR/CCPA, anonymizes data.",
      "Open Source: Allows users to self-host the tool and have complete control over their data.",
      "Ease of Use: Simple and intuitive interface.",
      "Lightweight: Minimal impact on website speed."
    ],
    weaknesses: [
      "Limited Features: Fewer features than Google Analytics.",
      "Pricing: Paid for the hosted version, but free for self-hosting (requires technical expertise).",
      "Has little documentation",
      "Has a lot of self-made solutions which will be hard to implement and maintain."
    ],
    ratings: {
      privacy: 5,
      easeOfUse: 4,
      features: 2,
      pricing: 3,
      performance: 5,
      targetAudience: "Developers, bloggers, and website owners who value privacy, simplicity, and open-source software",
      dataOwnership: "Customer (especially with self-hosting)",
      customization: 3
    },
    outshine: "Databuddy is easier to use, with AI integration and a more intuitive layout. It's also a no code solution compared to Plausible."
  },
  {
    id: "matomo",
    name: "Matomo",
    logo: "/images/competitors/matomo.svg",
    overview: "An open-source analytics platform that offers both a hosted and self-hosted option. It's more feature-rich than Fathom and Plausible but also more complex.",
    strengths: [
      "Privacy-Focused: Complies with GDPR/CCPA, allows users to control their data.",
      "Open Source: Allows users to self-host the tool and have complete control over their data.",
      "Feature-Rich: Offers a wide range of features, including custom reports, segmentation, and e-commerce tracking."
    ],
    weaknesses: [
      "Complexity: Can be complex to set up and use, especially for non-technical users.",
      "Performance Impact: The tracking script can slow down website loading times, especially with self-hosting if not correctly optimized.",
      "Pricing: Paid for the hosted version, but free for self-hosting (requires technical expertise)."
    ],
    ratings: {
      privacy: 4,
      easeOfUse: 3,
      features: 4,
      pricing: 3,
      performance: 3,
      targetAudience: "Businesses and organizations that need a feature-rich analytics platform and want to control their data",
      dataOwnership: "Customer (especially with self-hosting)",
      customization: 4
    },
    outshine: "Databuddy uses its AI to help users understand their website in an easier layout than matomo."
  },
  {
    id: "Databuddy",
    name: "Databuddy",
    logo: "/images/logo.svg",
    overview: "A privacy-first analytics platform that combines powerful features with ease of use, optimized performance, and AI-powered insights.",
    strengths: [
      "Privacy-First: Fully compliant with GDPR/CCPA, no cookies required, and complete data anonymization.",
      "AI-Powered Insights: Leverages AI to provide actionable insights and recommendations.",
      "Performance Optimized: 65x faster than Google Analytics with minimal impact on website speed.",
      "User-Friendly: Intuitive dashboards and reports designed for non-technical users.",
      "Comprehensive Features: Offers a wide range of analytics capabilities without compromising on privacy or performance."
    ],
    weaknesses: [
      "Newer Platform: As a newer platform, it has a smaller ecosystem of integrations and resources compared to established players.",
    ],
    ratings: {
      privacy: 5,
      easeOfUse: 5,
      features: 4,
      pricing: 4,
      performance: 5,
      targetAudience: "Businesses of all sizes that value privacy, performance, and actionable insights",
      dataOwnership: "Customer",
      customization: 4
    },
    outshine: "Databuddy combines the best of all worlds: the privacy focus of Fathom and Plausible, the feature richness of Google Analytics and Matomo, and adds AI-powered insights and superior performance."
  }
];

// Rating component
const RatingBar = ({ rating, label }: { rating: number; label: string }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between mb-1">
        <span className="text-sm text-slate-400">{label}</span>
        <span className="text-sm font-medium text-white">{rating}/5</span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${
            rating <= 2 ? 'bg-red-500' : 
            rating === 3 ? 'bg-yellow-500' : 
            'bg-green-500'
          }`} 
          style={{ width: `${(rating / 5) * 100}%` }}
        ></div>
      </div>
    </div>
  );
};

function ComparisonPage() {
  const searchParams = useSearchParams();
  const [selectedCompetitor, setSelectedCompetitor] = useState("Databuddy");
  
  // Set the selected competitor based on URL query parameter
  useEffect(() => {
    const competitor = searchParams.get('competitor');
    if (competitor && competitors.some(c => c.id === competitor)) {
      setSelectedCompetitor(competitor);
    }
  }, [searchParams]);
  
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16 relative">
        {/* Background decorations */}
        <div className="absolute top-0 left-0 right-0 h-full overflow-hidden pointer-events-none">
          <div className="absolute top-40 left-10 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute top-80 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl opacity-30"></div>
          <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl opacity-30"></div>
        </div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-sky-600">
                Analytics Comparison
              </span>
            </h1>
            <p className="text-slate-400 max-w-2xl mx-auto">
              See how Databuddy stacks up against other analytics platforms. We&apos;ve analyzed the key features, privacy considerations, and performance metrics to help you make an informed decision.
            </p>
          </div>
          
          <Tabs defaultValue="Databuddy" value={selectedCompetitor} onValueChange={setSelectedCompetitor} className="w-full">
            <div className="flex justify-center mb-8">
              <TabsList className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 p-1">
                {competitors.map((competitor) => (
                  <TabsTrigger 
                    key={competitor.id} 
                    value={competitor.id}
                    className="data-[state=active]:bg-sky-500/20 data-[state=active]:text-sky-400 px-4 py-2"
                  >
                    {competitor.name}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
            
            {competitors.map((competitor) => (
              <TabsContent key={competitor.id} value={competitor.id} className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Overview Card */}
                  <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm col-span-1">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center">
                        <span className="mr-2">{competitor.name}</span>
                        {competitor.id === "Databuddy" && (
                          <Badge className="bg-sky-500 text-white">Our Platform</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>Overview</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-slate-300 mb-6">{competitor.overview}</p>
                      
                      <div className="space-y-6">
                        <div>
                          <h3 className="text-white font-medium mb-2 flex items-center">
                            <Check className="w-4 h-4 text-green-500 mr-2" />
                            Strengths
                          </h3>
                          <ul className="space-y-2 text-sm text-slate-300">
                            {competitor.strengths.map((strength, index) => (
                              <li key={index} className="pl-6 relative">
                                <span className="absolute left-0 top-1.5 w-2 h-2 bg-green-500 rounded-full"></span>
                                {strength}
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h3 className="text-white font-medium mb-2 flex items-center">
                            <X className="w-4 h-4 text-red-500 mr-2" />
                            Weaknesses
                          </h3>
                          <ul className="space-y-2 text-sm text-slate-300">
                            {competitor.weaknesses.map((weakness, index) => (
                              <li key={index} className="pl-6 relative">
                                <span className="absolute left-0 top-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
                                {weakness}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Ratings Card */}
                  <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm col-span-1">
                    <CardHeader>
                      <CardTitle className="text-white">Ratings</CardTitle>
                      <CardDescription>Key metrics comparison</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <RatingBar rating={competitor.ratings.privacy} label="Privacy" />
                        <RatingBar rating={competitor.ratings.easeOfUse} label="Ease of Use" />
                        <RatingBar rating={competitor.ratings.features} label="Features" />
                        <RatingBar rating={competitor.ratings.pricing} label="Pricing Value" />
                        <RatingBar rating={competitor.ratings.performance} label="Performance" />
                        <RatingBar rating={competitor.ratings.customization} label="Customization" />
                        
                        <div className="pt-4 border-t border-slate-700/50">
                          <div className="mb-3">
                            <span className="text-sm text-slate-400">Target Audience</span>
                            <p className="text-sm text-white">{competitor.ratings.targetAudience}</p>
                          </div>
                          
                          <div>
                            <span className="text-sm text-slate-400">Data Ownership</span>
                            <p className="text-sm text-white">{competitor.ratings.dataOwnership}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Comparison Card */}
                  <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm col-span-1">
                    <CardHeader>
                      <CardTitle className="text-white">Databuddy Advantage</CardTitle>
                      <CardDescription>Why choose Databuddy over {competitor.id === "Databuddy" ? "others" : competitor.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {competitor.id === "Databuddy" ? (
                        <div className="space-y-4">
                          <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-md">
                            <h3 className="text-white font-medium mb-2 flex items-center">
                              <Star className="w-4 h-4 text-sky-400 mr-2" />
                              Combining Privacy and Power
                            </h3>
                            <p className="text-sm text-slate-300">
                              Databuddy bridges the gap between Google Analytics (powerful features but questionable privacy) and Fathom/Plausible (privacy-focused but limited features). It offers a comprehensive set of analytics capabilities while adhering to strict privacy standards.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-md">
                            <h3 className="text-white font-medium mb-2 flex items-center">
                              <Star className="w-4 h-4 text-purple-400 mr-2" />
                              Ease of Use for Non-Technical Users
                            </h3>
                            <p className="text-sm text-slate-300">
                              Databuddy simplifies data analytics with intuitive dashboards and AI-powered insights, making it accessible to users without extensive technical expertise.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-md">
                            <h3 className="text-white font-medium mb-2 flex items-center">
                              <Star className="w-4 h-4 text-emerald-400 mr-2" />
                              Performance Optimization
                            </h3>
                            <p className="text-sm text-slate-300">
                              Databuddy uses a lightweight tracking script and edge-optimized architecture to minimize the impact on website speed and performance.
                            </p>
                          </div>
                          
                          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-md">
                            <h3 className="text-white font-medium mb-2 flex items-center">
                              <Star className="w-4 h-4 text-amber-400 mr-2" />
                              Ethical and Transparent Data Practices
                            </h3>
                            <p className="text-sm text-slate-300">
                              Databuddy is committed to ethical and transparent data practices, building trust with users and ensuring compliance with privacy regulations.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="p-4 bg-sky-500/10 border border-sky-500/30 rounded-md mb-6">
                            <p className="text-slate-300">{competitor.outshine}</p>
                          </div>
                          
                          <div className="space-y-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-sky-500/20 rounded-full flex items-center justify-center mr-3">
                                <Check className="w-4 h-4 text-sky-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">Superior Privacy</h4>
                                <p className="text-sm text-slate-400">No cookies, full GDPR compliance, and complete data anonymization</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mr-3">
                                <Check className="w-4 h-4 text-purple-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">AI-Powered Insights</h4>
                                <p className="text-sm text-slate-400">Actionable recommendations based on your data</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-emerald-500/20 rounded-full flex items-center justify-center mr-3">
                                <Check className="w-4 h-4 text-emerald-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">Lightning Fast</h4>
                                <p className="text-sm text-slate-400">65x faster than Google Analytics with minimal impact on site speed</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start">
                              <div className="flex-shrink-0 w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center mr-3">
                                <Check className="w-4 h-4 text-amber-400" />
                              </div>
                              <div>
                                <h4 className="text-white font-medium">User-Friendly Interface</h4>
                                <p className="text-sm text-slate-400">Designed for non-technical users with intuitive dashboards</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
                
                {/* Feature Comparison Table */}
                {competitor.id !== "Databuddy" && (
                  <Card className="bg-slate-800/80 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-white">Feature Comparison</CardTitle>
                      <CardDescription>Databuddy vs {competitor.name}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="text-left py-3 text-slate-400 font-medium">Feature</th>
                              <th className="text-center py-3 text-sky-400 font-medium">Databuddy</th>
                              <th className="text-center py-3 text-slate-400 font-medium">{competitor.name}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-slate-700/20">
                              <td className="py-3 text-slate-300">Privacy-First Approach</td>
                              <td className="py-3 text-center">
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              </td>
                              <td className="py-3 text-center">
                                {competitor.ratings.privacy >= 4 ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : competitor.ratings.privacy >= 3 ? (
                                  <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-red-500 mx-auto" />
                                )}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-700/20">
                              <td className="py-3 text-slate-300">No Cookies Required</td>
                              <td className="py-3 text-center">
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              </td>
                              <td className="py-3 text-center">
                                {competitor.id === "google-analytics" ? (
                                  <X className="w-5 h-5 text-red-500 mx-auto" />
                                ) : (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                )}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-700/20">
                              <td className="py-3 text-slate-300">AI-Powered Insights</td>
                              <td className="py-3 text-center">
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              </td>
                              <td className="py-3 text-center">
                                <X className="w-5 h-5 text-red-500 mx-auto" />
                              </td>
                            </tr>
                            <tr className="border-b border-slate-700/20">
                              <td className="py-3 text-slate-300">Fast Performance</td>
                              <td className="py-3 text-center">
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              </td>
                              <td className="py-3 text-center">
                                {competitor.ratings.performance >= 4 ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : competitor.ratings.performance >= 3 ? (
                                  <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-red-500 mx-auto" />
                                )}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-700/20">
                              <td className="py-3 text-slate-300">Advanced Analytics Features</td>
                              <td className="py-3 text-center">
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              </td>
                              <td className="py-3 text-center">
                                {competitor.ratings.features >= 4 ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : competitor.ratings.features >= 3 ? (
                                  <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-red-500 mx-auto" />
                                )}
                              </td>
                            </tr>
                            <tr className="border-b border-slate-700/20">
                              <td className="py-3 text-slate-300">User-Friendly Interface</td>
                              <td className="py-3 text-center">
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              </td>
                              <td className="py-3 text-center">
                                {competitor.ratings.easeOfUse >= 4 ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : competitor.ratings.easeOfUse >= 3 ? (
                                  <AlertCircle className="w-5 h-5 text-yellow-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-red-500 mx-auto" />
                                )}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 text-slate-300">Customer Data Ownership</td>
                              <td className="py-3 text-center">
                                <Check className="w-5 h-5 text-green-500 mx-auto" />
                              </td>
                              <td className="py-3 text-center">
                                {competitor.ratings.dataOwnership.includes("Customer") ? (
                                  <Check className="w-5 h-5 text-green-500 mx-auto" />
                                ) : (
                                  <X className="w-5 h-5 text-red-500 mx-auto" />
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {/* Call to Action */}
                <div className="bg-gradient-to-r from-sky-500/20 to-purple-500/20 border border-sky-500/30 rounded-lg p-8 text-center">
                  <h2 className="text-2xl font-bold text-white mb-4">Ready to experience the Databuddy difference?</h2>
                  <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                    Join thousands of businesses that have switched to Databuddy for privacy-first, powerful analytics that won&apos;t slow down your website.
                  </p>
                  <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <Link 
                      href="/register" 
                      className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
                    >
                      Start Free Trial
                    </Link>
                    <Link 
                      href="/demo" 
                      className="bg-slate-700 hover:bg-slate-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
                    >
                      View Live Demo
                    </Link>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 


export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <ComparisonPage />
        </Suspense>
    )
}