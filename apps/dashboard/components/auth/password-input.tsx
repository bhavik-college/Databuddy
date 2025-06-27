"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

export function PasswordInput({ className, containerClassName, ...props }: PasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className={cn("relative", containerClassName)}>
      <Input
        className={cn(
          "border-slate-600 bg-slate-700/50 pr-10 text-white transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10",
          className
        )}
        type={showPassword ? "text" : "password"}
        {...props}
      />
      <Button
        className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent"
        disabled={props.disabled}
        onClick={() => setShowPassword(!showPassword)}
        size="icon"
        type="button"
        variant="ghost"
      >
        {showPassword ? (
          <EyeOff className="h-4 w-4 text-slate-400" />
        ) : (
          <Eye className="h-4 w-4 text-slate-400" />
        )}
        <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
      </Button>
    </div>
  );
}
