"use client";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { AuthForm } from "./auth-form";
import { cn } from "@/lib/utils";

export type AuthCardProps = {
  view?: "signIn" | "signUp" | "forgotPassword" | "resetPassword" | "verifyEmail" | "verifyPassword";
  redirectTo?: string;
  callbackURL?: string;
  className?: string;
  classNames?: {
    base?: string;
    header?: string;
    title?: string;
    description?: string;
    footer?: string;
    footerLink?: string;
  };
};

export function AuthCard({
  view = "signIn",
  redirectTo,
  callbackURL,
  className,
  classNames,
}: AuthCardProps) {
  return (
    <Card className={cn(
      "bg-slate-800/80 border-slate-700/50 backdrop-blur-sm shadow-xl",
      classNames?.base,
      className
    )}>
      <CardHeader className={cn("space-y-1", classNames?.header)}>
        <CardTitle className={cn("text-2xl font-medium text-white", classNames?.title)}>
          {view === "signIn" && "Welcome back"}
          {view === "signUp" && "Create an account"}
          {view === "forgotPassword" && "Reset your password"}
          {view === "resetPassword" && "Set new password"}
          {view === "verifyEmail" && "Verify your email"}
          {view === "verifyPassword" && "Verify your password"}
        </CardTitle>
        <CardDescription className={cn("text-slate-400", classNames?.description)}>
          {view === "signIn" && "Sign in to your account to continue"}
          {view === "signUp" && "Enter your details to create your account"}
          {view === "forgotPassword" && "Enter your email to reset your password"}
          {view === "resetPassword" && "Enter your new password below"}
          {view === "verifyEmail" && "Enter the code sent to your email"}
          {view === "verifyPassword" && "Enter the code sent to your email"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AuthForm 
          view={view}
          redirectTo={redirectTo}
          callbackURL={callbackURL}
        />
      </CardContent>
      <CardFooter className={cn("border-slate-700/50", classNames?.footer)}>
        <div className="text-center w-full text-sm text-slate-400">
          {view === "signIn" && (
            <>
              Don&apos;t have an account?{" "}
              <a 
                href="/register" 
                className={cn(
                  "text-sky-400 hover:text-sky-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800 rounded",
                  classNames?.footerLink
                )}
              >
                Create one now
              </a>
            </>
          )}
          {view === "signUp" && (
            <>
              Already have an account?{" "}
              <a 
                href="/login" 
                className={cn(
                  "text-sky-400 hover:text-sky-300 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800 rounded",
                  classNames?.footerLink
                )}
              >
                Sign in
              </a>
            </>
          )}
        </div>
      </CardFooter>
    </Card>
  );
} 