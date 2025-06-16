"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Home, ArrowLeft, BarChart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [mounted, setMounted] = useState(false);
  const [randomDigit, setRandomDigit] = useState("4");
  
  // Generate glitch effect
  useEffect(() => { 
    setMounted(true);
    
    // Simple glitch effect - change middle digit randomly
    const interval = setInterval(() => {
      const digits = ["0", "1", "4", "5", "?", "!", "x"];
      const randomIndex = Math.floor(Math.random() * digits.length);
      setRandomDigit(digits[randomIndex]);
    }, 800);
    
    return () => clearInterval(interval);
  }, []);
  
  if (!mounted) return null;

  return (
    <div className="h-screen flex flex-col items-center justify-center p-4 bg-background">
      {/* Logo/Branding */}
      <div className="absolute top-8 left-0 right-0 flex justify-center">
        <div className="flex items-center gap-2">
          <BarChart className="h-8 w-8 text-primary" />
          <span className="text-2xl font-bold tracking-tight">Databuddy</span>
        </div>
      </div>
      
      {/* Main content with better hierarchy */}
      <div className="flex flex-col items-center max-w-md w-full">
        {/* 404 Display */}
        <div className="flex font-mono mb-4 items-baseline">
          <span className="text-8xl md:text-9xl font-bold text-primary">4</span>
          <div className="relative mx-2">
            <span className="text-8xl md:text-9xl font-bold text-primary animate-pulse">{randomDigit}</span>
            <div className="absolute inset-0 bg-primary/10 blur-xl -z-10 rounded-full"/>
          </div>
          <span className="text-8xl md:text-9xl font-bold text-primary">4</span>
        </div>
        
        {/* Horizontal line */}
        <div className="w-16 h-px bg-border mb-4"/>
        
        {/* Simple mascot */}
        <div className="mb-6 text-4xl">
          <span className="inline-block transform -rotate-90 text-5xl" role="img" aria-label="sad face">
            :(
          </span>
        </div>
        
        <h1 className="text-2xl md:text-3xl font-bold mb-2 text-center">
          Page Not Found
        </h1>
        
        <p className="text-muted-foreground text-center mb-8">
          We&apos;ve lost this page in the data stream.
        </p>
        
        {/* Action buttons with brand colors */}
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-xs">
          <Button asChild variant="default" className="flex-1 bg-primary hover:bg-primary/90">
            <Link href="/websites">
              <Home className="h-4 w-4 mr-2" />
              Home
            </Link>
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 border-primary/20 hover:bg-primary/5"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
      
      {/* Error code */}
      <div className="absolute bottom-8 font-mono text-xs text-muted-foreground bg-accent/50 px-4 py-2 rounded-md border border-accent">
        <code>ERR_PAGE_NOT_FOUND @ {window.location.pathname}</code>
      </div>
      
      {/* Subtle brand pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-5">
        <div className="absolute -right-24 -top-24 w-96 h-96 rounded-full border-8 border-dashed border-primary"/>
        <div className="absolute -left-24 -bottom-24 w-96 h-96 rounded-full border-8 border-dashed border-primary"/>
      </div>
    </div>
  );
} 