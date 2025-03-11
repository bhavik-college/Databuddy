"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import confetti from "canvas-confetti";

interface EarlyAccessPopupProps {
  typeformUrl: string;
}

export default function EarlyAccessPopup({ typeformUrl }: EarlyAccessPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasShown, setHasShown] = useState(false);

  useEffect(() => {
    const hasShownPopup = localStorage.getItem("earlyAccessPopupShown");
    
    if (!hasShownPopup && !hasShown) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        setHasShown(true);
        localStorage.setItem("earlyAccessPopupShown", "true");
        
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        });
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [hasShown]);

  const handleAccept = () => {
    window.open(typeformUrl, "_blank");
    setIsOpen(false);
    
    // Redirect to the CTA form after closing the popup
    setTimeout(() => {
      window.location.href = "/#cta-form";
    }, 500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Join Our Early Access Program! 🚀
          </DialogTitle>
          <DialogDescription className="text-center pt-2">
            Help shape the future of privacy-first analytics
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center space-y-2 py-4">
          <p>
            We&apos;re looking for early adopters to test our platform and provide valuable feedback.
          </p>
          <p className="font-medium">
            Would you like to take a quick 2-minute survey to help us improve?
          </p>
        </div>
        
        <DialogFooter className="flex sm:justify-between gap-4 pt-4">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            className="flex-1"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleAccept}
            className="flex-1 bg-sky-500 hover:bg-sky-600"
          >
            Yes, I&apos;ll Help!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 