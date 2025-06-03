import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useEffect, useState, useRef } from "react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const switchTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const handleToggle = async () => {
    // Check if View Transitions API is supported
    if (!document.startViewTransition) {
      switchTheme();
      return;
    }

    // Get the button position for the animation origin
    const rect = buttonRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : 0;
    const y = rect ? rect.top + rect.height / 2 : 0;

    // Calculate the maximum distance to cover the entire screen
    const maxDistance = Math.sqrt(
      Math.max(x, window.innerWidth - x) ** 2 +
      Math.max(y, window.innerHeight - y) ** 2
    );

    // Set CSS custom properties for the animation
    document.documentElement.style.setProperty('--x', `${x}px`);
    document.documentElement.style.setProperty('--y', `${y}px`);
    document.documentElement.style.setProperty('--d', `${maxDistance}px`);

    // Start the view transition
    const transition = document.startViewTransition(() => {
      switchTheme();
    });

    try {
      await transition.finished;
    } catch (error) {
      // Transition was skipped or interrupted
      console.log('Theme transition was interrupted');
    }
  };

  if (!mounted) return null;

  return (
    <Button 
      ref={buttonRef}
      variant="ghost" 
      size="icon" 
      className="hidden md:flex h-8 w-8 relative overflow-hidden transition-all duration-200 hover:bg-accent hover:scale-105 active:scale-95"
      onClick={handleToggle}
      data-theme-toggle
    >
      {theme === "dark" ? (
        <Moon className="h-4 w-4 transition-transform duration-300" />
      ) : (
        <Sun className="h-4 w-4 transition-transform duration-300" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
} 