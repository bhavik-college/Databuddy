"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { AppleIcon, DiscordIcon, GitHubIcon, GoogleIcon } from "./provider-icons";

const ProviderIcons = {
  apple: AppleIcon,
  discord: DiscordIcon,
  github: GitHubIcon,
  google: GoogleIcon,
} as const;

export interface ProviderButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  providerId: keyof typeof ProviderIcons;
  showIcon?: boolean;
  isLoading?: boolean;
}

export function ProviderButton({
  providerId,
  showIcon = true,
  isLoading = false,
  className,
  children,
  ...props
}: ProviderButtonProps) {
  const Icon = ProviderIcons[providerId];

  return (
    <Button
      variant="outline"
      className={cn(
        "relative w-full bg-background hover:bg-muted/50 hover:text-foreground",
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {showIcon && Icon && (
        <span className="absolute left-4 flex h-4 w-4 items-center justify-center">
          <Icon className="h-4 w-4" />
        </span>
      )}
      {children}
    </Button>
  );
}

export function GoogleButton({ className, ...props }: Omit<ProviderButtonProps, "providerId">) {
  return (
    <ProviderButton providerId="google" className={cn("", className)} {...props}>
      Continue with Google
    </ProviderButton>
  );
}

export function GitHubButton({ className, ...props }: Omit<ProviderButtonProps, "providerId">) {
  return (
    <ProviderButton providerId="github" className={cn("", className)} {...props}>
      Continue with GitHub
    </ProviderButton>
  );
}

export function AppleButton({ className, ...props }: Omit<ProviderButtonProps, "providerId">) {
  return (
    <ProviderButton providerId="apple" className={cn("", className)} {...props}>
      Continue with Apple
    </ProviderButton>
  );
}

export function DiscordButton({ className, ...props }: Omit<ProviderButtonProps, "providerId">) {
  return (
    <ProviderButton providerId="discord" className={cn("", className)} {...props}>
      Continue with Discord
    </ProviderButton>
  );
}