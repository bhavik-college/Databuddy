"use client"

import type React from "react"

import { ArrowRight, Check, BarChart2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useState, useRef, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import FadeIn from "./FadeIn"
import { toast } from "sonner"
import Link from "next/link"

export default function CTA() {
  const [wishlistEmail, setWishlistEmail] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [alreadySubscribed, setAlreadySubscribed] = useState(false)
  const [userCount, setUserCount] = useState(0)
  const [submitted, setSubmitted] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Fetch user count on mount
    fetch("/api/wishlist")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && typeof data.data?.count === "number") {
          setUserCount(data.data.count)
        }
      })
  }, [])

  const handleWishlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(wishlistEmail)) {
      setSubmitError("Please enter a valid email address");
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: wishlistEmail }),
      });

      const data = await response.json();

      if (data.success) {
        const isAlreadySubscribed = data.message?.includes("already");
        setAlreadySubscribed(isAlreadySubscribed);

        if (!isAlreadySubscribed) {
          setUserCount((prev) => prev + 1);
        }

        setSubmitted(true);
        setWishlistEmail("");
      } else {
        setSubmitError(data.error || "Failed to join wishlist. Please try again.");
      }
    } catch (error) {
      setSubmitError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <div className="mb-4 text-sky-400 font-semibold text-base">
            {userCount} already joined
          </div>
          <div>
            {submitted ? (
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 mb-8">
                <h3 className="text-xl font-semibold text-green-400 mb-2">
                  {alreadySubscribed ? "You're already on our wishlist!" : "Thank you for joining our wishlist!"}
                </h3>
                <p className="text-slate-300 mb-4">
                  {alreadySubscribed
                    ? "You have already joined our wishlist. We'll keep you updated!"
                    : "You're on the list! We'll keep you updated as we launch."}
                </p>
              </div>
            ) : (
              <form onSubmit={handleWishlistSubmit} className="flex flex-col sm:flex-row gap-4 justify-center mb-8" ref={formRef}>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={wishlistEmail}
                  onChange={(e) => setWishlistEmail(e.target.value)}
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
            {submitError && (
              <div className="text-red-400 mb-6 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                {submitError}
              </div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400">
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

