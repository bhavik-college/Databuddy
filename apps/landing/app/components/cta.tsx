"use client"

import type React from "react"

import { ArrowRight, Check, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import FadeIn from "./FadeIn"
import { subscribeToEarlyAccess } from "@/app/lib/api"
import { toast } from "sonner"
import Link from "next/link"


export default function CTA() {
  const [email, setEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMessage("")
    
    try {
      const result = await subscribeToEarlyAccess(email)

      if (result.success) {
        setIsSuccess(true)
        toast.success("You've been added to the early access list!")
        setIsSubmitting(false)
        setEmail("")
        
        // Open the survey in a new tab after 3 seconds of successful submission
        setTimeout(() => {
          window.open("https://form.typeform.com/to/yXiXwsDD", "_blank")
        }, 3000)
      } else {
        setErrorMessage(result.error || "Failed to join waitlist. Please try again.")
        toast.error(result.error)
        setIsSubmitting(false)
      }
    } catch (error) {
      setErrorMessage("An unexpected error occurred. Please try again.")
      toast.error("An unexpected error occurred")
      setIsSubmitting(false)
    }
  }

  // Focus the input when the component mounts or when URL has #cta-form
  useEffect(() => {
    if (window.location.hash === "#cta-form" && inputRef.current) {
      inputRef.current.focus()
    }
  }, [])

  return (
    <section id="cta-form" className="py-24 overflow-hidden scroll-mt-20">
      <div className="container px-4 mx-auto">
        <FadeIn className="relative max-w-3xl mx-auto text-center">
          <div className="absolute inset-0 scale-[2] blur-3xl bg-gradient-to-r from-sky-500/20 to-sky-500/40 -z-10" />
          <Badge variant="outline" className="mb-4 border-sky-500/20 text-sky-400">
            Early Access Program
          </Badge>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Ready to take control of your data?</h2>
          <p className="text-slate-400 mb-8">
            Join privacy-conscious companies using advanced analytics. Sign up for early access today.
          </p>

          <div>
            {isSuccess ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-green-400 mb-2">Thank you for joining our waitlist!</h3>
                <p className="text-slate-300 mb-4">We&apos;ve opened our survey in a new tab. If it didn&apos;t open, please click the button below.</p>
                <Button 
                  onClick={() => window.open("https://form.typeform.com/to/yXiXwsDD", "_blank")}
                  className="bg-green-500 hover:bg-green-600"
                >
                  Take Our Quick Survey
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-4 justify-center mb-8" ref={formRef}>
                <Input
                  type="email"
                  placeholder="Enter your work email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="max-w-sm bg-black/50 border-slate-800 placeholder:text-slate-500"
                  disabled={isSubmitting}
                  required
                  ref={inputRef}
                  aria-label="Email address"
                />
                <Button type="submit" className="bg-sky-500 hover:bg-sky-600" disabled={isSubmitting}>
                  {isSubmitting ? (
                    "Processing..."
                  ) : (
                    <>
                      Join Waitlist
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}
            
            {errorMessage && (
              <div className="text-red-400 mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                {errorMessage}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              Priority access when we launch
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-400" />
              Help shape the product
            </div>
          </div>
          
          <div className="mt-8">
            <Link 
              href="/demo" 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
            >
              <BarChart2 className="h-4 w-4" />
              <span>See the live analytics demo</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </section>
  )
}

