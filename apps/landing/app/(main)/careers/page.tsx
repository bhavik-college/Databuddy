"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import Background from "../../components/background";
import Navbar from "../../components/navbar";
import Footer from "../../components/footer";
import FadeIn from "../../components/FadeIn";
import { ArrowRight, Briefcase, Building, Clock, Globe, Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const formSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Please enter a valid phone number.",
  }),
  role: z.string().min(1, {
    message: "Please select a role you're interested in.",
  }),
  experience: z.string().min(1, {
    message: "Please select your experience level.",
  }),
  resumeUrl: z.string().url({
    message: "Please enter a valid URL to your resume.",
  }),
  portfolio: z.string().url({
    message: "Please enter a valid URL to your portfolio.",
  }).optional().or(z.literal("")),
  linkedin: z.string().url({
    message: "Please enter a valid LinkedIn URL.",
  }).optional().or(z.literal("")),
  github: z.string().url({
    message: "Please enter a valid GitHub URL.",
  }).optional().or(z.literal("")),
  coverLetter: z.string().min(100, {
    message: "Cover letter must be at least 100 characters.",
  }),
  volunteerAcknowledgment: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge this is a volunteer/intern position" }),
  }),
  website: z.string().optional(), // Honeypot field
});

export default function CareersPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      role: "",
      experience: "",
      resumeUrl: "",
      portfolio: "",
      linkedin: "",
      github: "",
      coverLetter: "",
      volunteerAcknowledgment: undefined,
      website: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    
    try {
      // If honeypot field is filled, silently reject but show success
      if (values.website) {
        setIsSuccess(true);
        return;
      }
      
      // Clean up empty optional fields
      const formData = {
        ...values,
        portfolio: values.portfolio || null,
        linkedin: values.linkedin || null,
        github: values.github || null,
        website: undefined, // Remove honeypot field before sending
      };
      
      const response = await fetch("/api/careers/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      // Check if the response is valid JSON
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Error parsing response:", error);
        throw new Error("Server returned an invalid response. Please try again later.");
      }
      
      if (!response.ok) {
        throw new Error(data?.error || "Failed to submit application");
      }
      
      toast.success(data?.message || "Application submitted successfully!");
      setIsSuccess(true);
      form.reset();
      
    } catch (error) {
      console.error("Application submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit application");
    } finally {
      setIsSubmitting(false);
    }
  }

  const availableRoles = [
    "Software Engineer",
    "Frontend Developer",
    "Backend Developer",
    "Full Stack Developer",
    "DevOps Engineer",
    "Data Scientist",
    "Product Manager",
    "UX/UI Designer",
    "QA Engineer",
    "Other",
  ];

  const experienceLevels = [
    "Entry Level (0-2 years)",
    "Mid Level (3-5 years)",
    "Senior (6-9 years)",
    "Lead/Principal (10+ years)",
  ];

  const benefits = [
    {
      title: "Remote-First Culture",
      description: "Work from anywhere in the world with our distributed team.",
      icon: <Globe className="h-6 w-6 text-sky-400" />,
    },
    {
      title: "Flexible Hours",
      description: "Set your own schedule and work when you're most productive.",
      icon: <Clock className="h-6 w-6 text-sky-400" />,
    },
    {
      title: "High Potential",
      description: "In a massive market, we're building a high potential company.",
      icon: <Building className="h-6 w-6 text-sky-400" />,
    },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden">
      <Background />
      <div className="relative z-10 h-full overflow-auto scrollbar-hide">
        <Navbar />
        <main>
          <div className="container mx-auto px-4 py-16 max-w-6xl">
            <FadeIn>
              <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 mb-4">
                  Join Our Team
                </h1>
                <p className="text-lg text-slate-300 max-w-2xl mx-auto">
                  We&apos;re building the future of privacy-first analytics and we need talented individuals like you to help us make it happen.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={100}>
              <div className="mb-16">
                <h2 className="text-2xl font-bold text-white mb-8 text-center">Why Work With Us</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {benefits.map((benefit, index) => (
                    <div 
                      key={index} 
                      className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:border-sky-500/50 transition-all duration-300"
                    >
                      <div className="flex items-center mb-4">
                        <div className="h-12 w-12 rounded-full bg-sky-500/20 flex items-center justify-center mr-4">
                          {benefit.icon}
                        </div>
                        <h3 className="text-xl font-semibold text-white">{benefit.title}</h3>
                      </div>
                      <p className="text-slate-300">{benefit.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </FadeIn>

            <FadeIn delay={150}>
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 mb-16">
                {isSuccess ? (
                  <div className="text-center py-12">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                      <Briefcase className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-2xl font-semibold text-white mb-2">Application Submitted!</h3>
                    <p className="text-slate-300 max-w-md mx-auto mb-6">
                      Thank you for your interest in joining Databuddy. We&apos;ll review your application and get back to you soon.
                    </p>
                    <Button 
                      onClick={() => setIsSuccess(false)} 
                      variant="outline"
                      className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                    >
                      Submit Another Application
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold text-white mb-2">Apply Now</h2>
                      <p className="text-slate-300 max-w-2xl mx-auto">
                        Fill out the form below to apply for a position with Databuddy. We&apos;ll review your application and get in touch if there&apos;s a good fit.
                      </p>
                    </div>

                    <div className="max-w-3xl mx-auto">
                      <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField
                              control={form.control}
                              name="name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Full Name</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="John Doe" 
                                      {...field} 
                                      className="bg-slate-800 border-slate-700 text-white focus-visible:ring-sky-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="email"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Email</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="john.doe@example.com" 
                                      {...field} 
                                      className="bg-slate-800 border-slate-700 text-white focus-visible:ring-sky-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="phone"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Phone Number</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="+1 (555) 123-4567" 
                                      {...field} 
                                      className="bg-slate-800 border-slate-700 text-white focus-visible:ring-sky-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="role"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Role</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white focus:ring-sky-500">
                                        <SelectValue placeholder="Select a role" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                      {availableRoles.map((role) => (
                                        <SelectItem key={role} value={role}>
                                          {role}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="experience"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Experience Level</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger className="bg-slate-800 border-slate-700 text-white focus:ring-sky-500">
                                        <SelectValue placeholder="Select experience level" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="bg-slate-800 border-slate-700 text-white">
                                      {experienceLevels.map((level) => (
                                        <SelectItem key={level} value={level}>
                                          {level}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="resumeUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Resume URL</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://drive.google.com/your-resume" 
                                      {...field} 
                                      className="bg-slate-800 border-slate-700 text-white focus-visible:ring-sky-500"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-slate-400">
                                    Link to your resume (Google Drive, Dropbox, etc.)
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="portfolio"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">Portfolio URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://yourportfolio.com" 
                                      {...field} 
                                      className="bg-slate-800 border-slate-700 text-white focus-visible:ring-sky-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="linkedin"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">LinkedIn URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://linkedin.com/in/johndoe" 
                                      {...field} 
                                      className="bg-slate-800 border-slate-700 text-white focus-visible:ring-sky-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            
                            <FormField
                              control={form.control}
                              name="github"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-white">GitHub URL (Optional)</FormLabel>
                                  <FormControl>
                                    <Input 
                                      placeholder="https://github.com/johndoe" 
                                      {...field} 
                                      className="bg-slate-800 border-slate-700 text-white focus-visible:ring-sky-500"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          
                          <FormField
                            control={form.control}
                            name="coverLetter"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-white">Cover Letter</FormLabel>
                                <FormControl>
                                  <Textarea 
                                    placeholder="Tell us why you're interested in joining Databuddy and what you can bring to the team..." 
                                    className="min-h-[200px] bg-slate-800 border-slate-700 text-white focus-visible:ring-sky-500"
                                    {...field} 
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          <FormField
                            control={form.control}
                            name="volunteerAcknowledgment"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border border-slate-700 p-4 bg-slate-800/50">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value}
                                    onCheckedChange={field.onChange}
                                    className="data-[state=checked]:bg-sky-500 data-[state=checked]:border-sky-500"
                                  />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                  <FormLabel className="text-white">
                                    I understand this is a volunteer/intern position with potential for full-time employment and equity bonus based on performance.
                                  </FormLabel>
                                  <FormDescription className="text-slate-400">
                                    Initial positions are unpaid but offer valuable experience and the opportunity to join our team permanently.
                                  </FormDescription>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          
                          {/* Honeypot field - invisible to humans but bots will fill it */}
                          <FormField
                            control={form.control}
                            name="website"
                            render={({ field }) => (
                              <FormItem style={{ display: 'none', position: 'absolute', left: '-9999px' }}>
                                <FormLabel>Website</FormLabel>
                                <FormControl>
                                  <Input {...field} tabIndex={-1} autoComplete="off" />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          
                          <div className="text-center">
                            <Button 
                              type="submit" 
                              size="lg" 
                              disabled={isSubmitting}
                              className="bg-sky-500 hover:bg-sky-600 text-white px-8"
                            >
                              {isSubmitting ? (
                                <>
                                  <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Submitting...
                                </>
                              ) : (
                                <>
                                  Submit Application <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </div>
                  </>
                )}
              </div>
            </FadeIn>
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
} 