"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PlusCircle } from "lucide-react";
import { toast } from "sonner";

interface AddWebsiteDialogProps {
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function AddWebsiteDialog({ 
  variant = "default", 
  size = "default" 
}: AddWebsiteDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Validate URL format
      if (!formData.url.startsWith('http://') && !formData.url.startsWith('https://')) {
        formData.url = `https://${formData.url}`;
      }

      const response = await fetch('/api/websites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add website');
      }
      
      // Close the dialog and reset form
      setOpen(false);
      setFormData({ name: "", url: "" });
      
      // Show success toast
      toast.success('Website added successfully');
      
      // Refresh the dashboard
      router.refresh();
    } catch (error) {
      console.error("Error adding website:", error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
      toast.error(error instanceof Error ? error.message : 'Failed to add website');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant={variant} 
          size={size}
          className={variant === "outline" ? "border-sky-500/30 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10" : ""}
        >
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Website
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Add a New Website</DialogTitle>
          <DialogDescription className="text-slate-400">
            Enter the details of the website you want to track with Databuddy.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-slate-300">Website Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="My Awesome Website"
                value={formData.name}
                onChange={handleChange}
                required
                className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url" className="text-slate-300">Website URL</Label>
              <Input
                id="url"
                name="url"
                placeholder="https://example.com"
                value={formData.url}
                onChange={handleChange}
                required
                className="bg-slate-800 border-slate-700 text-white focus:border-sky-500/50 focus:ring-sky-500/20"
              />
              <p className="text-xs text-slate-400">
                Enter the full URL including https://
              </p>
            </div>
            {error && (
              <div className="text-sm text-rose-500 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                {error}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-sky-600 hover:bg-sky-700 text-white"
            >
              {isSubmitting ? "Adding..." : "Add Website"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 