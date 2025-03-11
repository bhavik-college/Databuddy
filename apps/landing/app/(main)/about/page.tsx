"use client";

import Background from "../../components/background";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import FadeIn from "../../components/FadeIn";
import Image from "next/image";
import Link from "next/link";
import { Github, Linkedin, Twitter } from "lucide-react";

export default function AboutPage() {
  const teamMembers = [
    {
      name: "Issa Nassar",
      role: "Founder",
      bio: "Full-stack engineer and entrepreneur passionate about building privacy-first tools that empower businesses without compromising user trust.",
      image: "/images/team/issa.jpg",
      github: "https://github.com/izadoesdev",
      twitter: "https://twitter.com/databuddyps",
      linkedin: "https://www.linkedin.com/in/issanassar/",
    },
    {
      name: "Open Position",
      role: "Co-Founder",
      bio: "We're looking for passionate individuals to join our founding team and help shape the future of privacy-first analytics.",
      image: "/images/team/open.jpg",
    },
  ];


  const values = [
    {
      title: "Privacy First",
      description: "We believe user privacy is a fundamental right, not an afterthought. Our solutions are built with privacy at their core.",
      icon: "🔒",
    },
    {
      title: "Data Ownership",
      description: "Your data belongs to you. We provide the tools to collect and analyze it without locking you into proprietary systems.",
      icon: "🗝️",
    },
    {
      title: "Community Driven",
      description: "We're building Databuddy with feedback from our early adopters, valuing their input to create a product that truly meets their needs.",
      icon: "👥",
    },
    {
      title: "Ethical Innovation",
      description: "We push the boundaries of what's possible while maintaining strict ethical standards in all our work.",
      icon: "💡",
    },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        <main className="container mx-auto px-4 py-16 max-w-6xl">
          <FadeIn>
            <div className="text-center mb-16">
              <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-4">
                About Databuddy
              </h1>
              <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                We&apos;re on a mission to transform web analytics by putting privacy first 
                without compromising on powerful insights.
              </p>
            </div>
          </FadeIn>

          <FadeIn delay={100}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-24">
              <div>
                <h2 className="text-3xl font-bold text-white mb-6">Our Vision</h2>
                <div className="space-y-4 text-slate-300">
                  <p>
                    Databuddy Analytics was conceived in early 2025 with a clear vision: to create a web analytics platform that respects user privacy while delivering powerful insights to website owners.
                  </p>
                  <p>
                    As privacy regulations tighten and cookie consent banners become ubiquitous, we saw an opportunity to build something different—analytics that work without cookies, without compromising user privacy, and without sacrificing data quality.
                  </p>
                  <p>
                    Currently in the pre-MVP stage, we&apos;re building Databuddy as a privacy-first analytics solution that aims to democratize access to powerful analytics for everyone from small blogs to enterprise applications.
                  </p>
                </div>
              </div>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
                <div className="aspect-video relative rounded-lg overflow-hidden bg-gradient-to-r from-sky-500/10 to-blue-500/10 flex items-center justify-center">
                  <div className="text-center p-6">
                    <h3 className="text-2xl font-bold text-white mb-3">Building the Future</h3>
                    <p className="text-slate-300 mb-4">
                      We&apos;re developing Databuddy with a focus on privacy, performance, and powerful insights to help businesses understand their users better.
                    </p>
                    <div className="flex justify-center space-x-4">
                      <a 
                        href="https://twitter.com/databuddyps" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Twitter className="mr-2 h-4 w-4" /> Follow Our Journey
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={150}>
            <div className="mb-24">
              <h2 className="text-3xl font-bold text-white mb-10 text-center">Our Values</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {values.map((value, index) => (
                  <div 
                    key={index} 
                    className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-sky-500/50 transition-all duration-300"
                  >
                    <div className="text-4xl mb-4">{value.icon}</div>
                    <h3 className="text-xl font-semibold text-white mb-3">{value.title}</h3>
                    <p className="text-slate-300">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={200}>
            <div className="mb-24">
              <h2 className="text-3xl font-bold text-white mb-10 text-center">Our Mission</h2>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8">
                <div className="max-w-3xl mx-auto space-y-4 text-slate-300">
                  <p>
                    At Databuddy, we&apos;re committed to transforming how organizations view and manage their metrics. Our focus is on delivering privacy-first, high-performance, and efficient analytics solutions that prioritize user trust while helping businesses achieve peak operational efficiency.
                  </p>
                  <p>
                    We believe in sustainability and ethical data practices. We strive to reduce carbon emissions and eliminate the wasted computing power often associated with invasive and deceptive tracking technologies. By doing so, we empower organizations to gain actionable insights without compromising the privacy or integrity of their users.
                  </p>
                  <p>
                    Our goal is to create a more transparent, efficient, and sustainable digital ecosystem where privacy and powerful analytics can coexist harmoniously.
                  </p>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={250}>
            <div className="mb-24">
              <h2 className="text-3xl font-bold text-white mb-10 text-center">The Team</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
                {teamMembers.map((member, index) => (
                  <div 
                    key={index} 
                    className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-sky-500/50 transition-all duration-300"
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                      <p className="text-sky-400 mb-3">{member.role}</p>
                      <p className="text-slate-300 text-sm mb-4">{member.bio}</p>
                      <div className="flex space-x-3">
                        {member.github && (
                          <a 
                            href={member.github} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-sky-400 transition-colors"
                            aria-label={`${member.name}'s GitHub`}
                          >
                            <Github className="h-5 w-5" />
                          </a>
                        )}
                        {member.twitter && (
                          <a 
                            href={member.twitter} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-sky-400 transition-colors"
                            aria-label={`${member.name}'s Twitter`}
                          >
                            <Twitter className="h-5 w-5" />
                          </a>
                        )}
                        {member.linkedin && (
                          <a 
                            href={member.linkedin} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-sky-400 transition-colors"
                            aria-label={`${member.name}'s LinkedIn`}
                          >
                            <Linkedin className="h-5 w-5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-12 max-w-3xl mx-auto">
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-white mb-3">Join Our Team</h3>
                    <p className="text-slate-300 mb-4">
                      We&apos;re looking for passionate individuals to join us and help shape the future of privacy-first analytics. If you&apos;re excited about our mission, we&apos;d love to hear from you.
                    </p>
                    <div className="flex space-x-4">
                      <Link 
                        href="/careers" 
                        className="inline-flex items-center bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        View Opportunities
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </FadeIn>

          <FadeIn delay={300}>
            <div className="bg-gradient-to-r from-sky-500/10 to-blue-500/10 border border-sky-500/20 rounded-xl p-8 text-center">
              <h2 className="text-2xl font-bold text-white mb-4">Join Our Journey</h2>
              <p className="text-slate-300 mb-6 max-w-2xl mx-auto">
                We&apos;re just getting started, and we&apos;d love for you to be part of our story. Whether you&apos;re a developer, designer, marketer, or simply passionate about privacy-first technology, there&apos;s a place for you at Databuddy.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Link 
                  href="/careers" 
                  className="inline-flex items-center bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Explore Opportunities
                </Link>
                <Link 
                  href="/contact" 
                  className="inline-flex items-center bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </FadeIn>
        </main>
        <Footer />
      </div>
    </div>
  );
} 