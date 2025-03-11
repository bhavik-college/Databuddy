"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Mail, 
  MessageSquare, 
  Phone, 
  Building2, 
  Users, 
  ArrowRight,
  CheckCircle2
} from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { submitContactForm } from "@/lib/api"
import { toast } from "sonner"

export default function Contact() {
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    company: "",
    website: "",
    monthlyVisitors: "",
    message: "",
    source: "website"
  })
  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrors({})
    
    try {
      const response = await submitContactForm(formState)
      
      if (response.success) {
        toast.success(response.message)
        setIsSubmitted(true)
        // Reset form
        setFormState({
          name: "",
          email: "",
          company: "",
          website: "",
          monthlyVisitors: "",
          message: "",
          source: "website"
        })
      } else {
        // Handle validation errors
        if (response.details) {
          const fieldErrors: Record<string, string> = {}
          
          Object.entries(response.details).forEach(([field, error]) => {
            if (field !== '_errors' && Array.isArray(error._errors) && error._errors.length > 0) {
              fieldErrors[field] = error._errors[0]
            }
          })
          
          setErrors(fieldErrors)
          
          if (Object.keys(fieldErrors).length > 0) {
            toast.error("Please fix the errors in the form")
          } else {
            toast.error(response.message || "Failed to submit form")
          }
        } else {
          toast.error(response.message || "Failed to submit form")
        }
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.")
      console.error("Contact form error:", error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target
    setFormState(prev => ({ ...prev, [id]: value }))
    
    // Clear error for this field when user starts typing
    if (errors[id]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[id]
        return newErrors
      })
    }
  }
  
  const handleSelectChange = (value: string, field: string) => {
    setFormState(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field when user makes a selection
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }
  
  return (
    <section id="contact" className="py-16 sm:py-24 relative">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950 to-slate-900 pointer-events-none"></div>
      <div className="absolute -top-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      <div className="absolute -bottom-px left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent"></div>
      
      <div className="container px-4 mx-auto relative z-10">
        <div className="text-center mb-10 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 tracking-tight">
            Ready to <span className="text-sky-400">get started</span>?
          </h2>
          <p className="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed">
            Have questions about Databuddy Analytics? Our team is ready to help you implement the right analytics solution for your business.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
          <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-800 md:col-span-2 overflow-hidden">
            <CardContent className="p-6 sm:p-8">
              {isSubmitted ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-16 h-16 bg-sky-500/10 rounded-full flex items-center justify-center mb-6">
                    <CheckCircle2 className="h-8 w-8 text-sky-400" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Message Received!</h3>
                  <p className="text-slate-300 mb-6 max-w-md">
                    Thank you for reaching out. One of our analytics experts will get back to you within 24 hours.
                  </p>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSubmitted(false)}
                    className="border-slate-700 hover:border-sky-500 text-white"
                  >
                    Send another message
                  </Button>
                </div>
              ) : (
                <form className="space-y-5 sm:space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2 text-white">
                      <Label htmlFor="name" className="text-sm font-medium text-slate-200">Full Name</Label>
                      <Input
                        id="name"
                        value={formState.name}
                        onChange={handleChange}
                        placeholder="Your name"
                        className={`bg-slate-800/50 border-slate-700 focus:border-sky-500 text-sm ${errors.name ? 'border-red-500' : ''}`}
                        required
                      />
                      {errors.name && (
                        <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                      )}
                    </div>
                    <div className="space-y-2 text-white">
                      <Label htmlFor="email" className="text-sm font-medium text-slate-200">Work Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formState.email}
                        onChange={handleChange}
                        placeholder="you@company.com"
                        className={`bg-slate-800/50 border-slate-700 focus:border-sky-500 text-sm ${errors.email ? 'border-red-500' : ''}`}
                        required
                      />
                      {errors.email && (
                        <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2 text-white">
                      <Label htmlFor="company" className="text-sm font-medium text-slate-200">Company Name</Label>
                      <Input
                        id="company"
                        value={formState.company}
                        onChange={handleChange}
                        placeholder="Your company"
                        className={`bg-slate-800/50 border-slate-700 focus:border-sky-500 text-sm ${errors.company ? 'border-red-500' : ''}`}
                      />
                      {errors.company && (
                        <p className="text-red-500 text-xs mt-1">{errors.company}</p>
                      )}
                    </div>
                    <div className="space-y-2 text-white">
                      <Label htmlFor="website" className="text-sm font-medium text-slate-200">Website URL</Label>
                      <Input
                        id="website"
                        value={formState.website}
                        onChange={handleChange}
                        placeholder="https://yourcompany.com"
                        className={`bg-slate-800/50 border-slate-700 focus:border-sky-500 text-sm ${errors.website ? 'border-red-500' : ''}`}
                      />
                      {errors.website && (
                        <p className="text-red-500 text-xs mt-1">{errors.website}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-white">
                    <Label htmlFor="monthlyVisitors" className="text-sm font-medium text-slate-200">Monthly Website Visitors</Label>
                    <Select onValueChange={(value) => handleSelectChange(value, "monthlyVisitors")}>
                      <SelectTrigger className={`bg-slate-800/50 border-slate-700 focus:border-sky-500 text-sm ${errors.monthlyVisitors ? 'border-red-500' : ''}`}>
                        <SelectValue placeholder="Select a range" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 border-slate-700 cursor-pointer group">
                        <SelectItem className="cursor-pointer group hover:bg-sky-500/10" value="less-10k">Less than 10,000</SelectItem>
                        <SelectItem className="cursor-pointer group hover:bg-sky-500/10" value="10k-50k">10,000 - 50,000</SelectItem>
                        <SelectItem className="cursor-pointer group hover:bg-sky-500/10" value="50k-100k">50,000 - 100,000</SelectItem>
                        <SelectItem className="cursor-pointer group hover:bg-sky-500/10" value="100k-500k">100,000 - 500,000</SelectItem>
                        <SelectItem className="cursor-pointer group hover:bg-sky-500/10" value="500k-1m">500,000 - 1 million</SelectItem>
                        <SelectItem className="cursor-pointer group hover:bg-sky-500/10" value="more-1m">More than 1 million</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.monthlyVisitors && (
                      <p className="text-red-500 text-xs mt-1">{errors.monthlyVisitors}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-white">
                    <Label htmlFor="message" className="text-sm font-medium text-slate-200">How can we help?</Label>
                    <Textarea
                      id="message"
                      value={formState.message}
                      onChange={handleChange}
                      placeholder="Tell us about your analytics needs or questions"
                      className={`min-h-[120px] bg-slate-800/50 border-slate-700 focus:border-sky-500 text-sm ${errors.message ? 'border-red-500' : ''}`}
                      required
                    />
                    {errors.message && (
                      <p className="text-red-500 text-xs mt-1">{errors.message}</p>
                    )}
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-sky-500 hover:bg-sky-600 text-white group h-11"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Sending..." : (
                      <>
                        Get in Touch
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                  
                  <p className="text-xs text-slate-400 text-center">
                    We respect your privacy. We&apos;ll never share your information.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
          
          <div className="space-y-4 sm:space-y-6">
            <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-800 text-white hover:border-slate-700 transition-colors">
              <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-base">Email Us</h3>
                  <p className="text-sm text-slate-300 mb-2">For general inquiries and support</p>
                  <a href="mailto:hello@Databuddy.cc" className="text-sky-400 hover:text-sky-300 text-sm font-medium inline-flex items-center group">
                    hello@Databuddy.cc
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-800 text-white hover:border-slate-700 transition-colors">
              <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-base">Enterprise Sales</h3>
                  <p className="text-sm text-slate-300 mb-2">For custom solutions and pricing</p>
                  <a href="mailto:enterprise@Databuddy.cc" className="text-sky-400 hover:text-sky-300 text-sm font-medium inline-flex items-center group">
                    enterprise@Databuddy.cc
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </CardContent>
            </Card>
            
            {/* <Card className="bg-slate-900/60 backdrop-blur-sm border-slate-800 text-white hover:border-slate-700 transition-colors">
              <CardContent className="p-5 sm:p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-sky-500/10 flex items-center justify-center flex-shrink-0">
                  <Users className="h-5 w-5 text-sky-400" />
                </div>
                <div>
                  <h3 className="font-medium mb-1 text-base">Join Our Community</h3>
                  <p className="text-sm text-slate-300 mb-2">Connect with other Databuddy users</p>
                  <a href="#" className="text-sky-400 hover:text-sky-300 text-sm font-medium inline-flex items-center group">
                    Join Slack Channel
                    <ArrowRight className="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </CardContent>
            </Card> */}
          </div>
        </div>
      </div>
    </section>
  )
} 