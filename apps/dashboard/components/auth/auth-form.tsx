'use client';

import {
  loginWithEmail,
  loginWithGithub,
  loginWithGoogle,
  registerWithEmail,
} from '@databuddy/auth/client';
import { Github, Loader2, Mail } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export type AuthFormProps = {
  view:
    | 'signIn'
    | 'signUp'
    | 'forgotPassword'
    | 'resetPassword'
    | 'verifyEmail'
    | 'verifyPassword';
  redirectTo?: string;
  callbackURL?: string;
  className?: string;
};

export function AuthForm({
  view,
  redirectTo,
  callbackURL,
  className,
}: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    code: '',
    name: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (view === 'signIn') {
        const result = await loginWithEmail(formData.email, formData.password, {
          redirectUrl: redirectTo,
          router,
          onError: (error) => {
            toast.error('Invalid credentials');
          },
        });

        if (!result.error) {
          toast.success('Logged in successfully');
        }
      } else if (view === 'signUp') {
        if (formData.password !== formData.confirmPassword) {
          toast.error('Passwords do not match');
          return;
        }

        const result = await registerWithEmail(
          formData.email,
          formData.password,
          formData.name,
          {
            redirectUrl: redirectTo,
            router,
            onError: (error) => {
              toast.error('Failed to create account');
            },
          }
        );

        if (!result.error) {
          toast.success('Account created successfully');
        }
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: 'github' | 'google') => {
    setIsLoading(true);
    try {
      const result =
        provider === 'github'
          ? await loginWithGithub({ redirectUrl: redirectTo, router })
          : await loginWithGoogle({ redirectUrl: redirectTo, router });

      if (result.error) {
        toast.error(`Failed to sign in with ${provider}`);
      }
    } catch (error) {
      toast.error('Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {(view === 'signIn' || view === 'signUp') && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Button
              aria-label="Sign in with Github"
              className="group relative cursor-pointer border-slate-600 bg-slate-700/50 text-slate-100 transition-colors duration-200 hover:bg-slate-700/80 hover:text-white"
              disabled={isLoading}
              onClick={() => handleSocialSignIn('github')}
              variant="outline"
            >
              <Github className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Github
            </Button>
            <Button
              aria-label="Sign in with Google"
              className="group relative cursor-pointer border-slate-600 bg-slate-700/50 text-slate-100 transition-colors duration-200 hover:bg-slate-700/80 hover:text-white"
              disabled={isLoading}
              onClick={() => handleSocialSignIn('google')}
              variant="outline"
            >
              <Mail className="mr-2 h-4 w-4 transition-transform group-hover:scale-110" />
              Google
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-800 px-2 text-slate-400">
                Or continue with email
              </span>
            </div>
          </div>
        </>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        {view === 'signUp' && (
          <div className="space-y-2">
            <Label className="text-white" htmlFor="name">
              Full name
            </Label>
            <Input
              aria-label="Full name"
              autoComplete="name"
              className="border-slate-600 bg-slate-700/50 text-white transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10"
              disabled={isLoading}
              id="name"
              name="name"
              onChange={handleChange}
              placeholder="John Doe"
              required
              type="text"
              value={formData.name}
            />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-white" htmlFor="email">
            Email address
          </Label>
          <Input
            aria-label="Email address"
            autoComplete="email"
            className="border-slate-600 bg-slate-700/50 text-white transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10"
            disabled={isLoading}
            id="email"
            name="email"
            onChange={handleChange}
            placeholder="name@example.com"
            required
            type="email"
            value={formData.email}
          />
        </div>

        {(view === 'signIn' ||
          view === 'signUp' ||
          view === 'resetPassword') && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-white" htmlFor="password">
                Password
              </Label>
              {view === 'signIn' && (
                <a
                  className="rounded text-sky-400 text-xs transition-colors duration-200 hover:text-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800"
                  href="/forgot-password"
                >
                  Forgot password?
                </a>
              )}
            </div>
            <Input
              aria-label="Password"
              autoComplete={
                view === 'signIn' ? 'current-password' : 'new-password'
              }
              className="border-slate-600 bg-slate-700/50 text-white transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10"
              disabled={isLoading}
              id="password"
              name="password"
              onChange={handleChange}
              required
              type="password"
              value={formData.password}
            />
          </div>
        )}

        {view === 'signUp' && (
          <div className="space-y-2">
            <Label className="text-white" htmlFor="confirmPassword">
              Confirm password
            </Label>
            <Input
              aria-label="Confirm password"
              autoComplete="new-password"
              className="border-slate-600 bg-slate-700/50 text-white transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10"
              disabled={isLoading}
              id="confirmPassword"
              name="confirmPassword"
              onChange={handleChange}
              required
              type="password"
              value={formData.confirmPassword}
            />
          </div>
        )}

        {(view === 'verifyEmail' || view === 'verifyPassword') && (
          <div className="space-y-2">
            <Label className="text-white" htmlFor="code">
              Verification code
            </Label>
            <Input
              aria-label="Verification code"
              autoComplete="one-time-code"
              className="border-slate-600 bg-slate-700/50 text-white transition-colors duration-200 placeholder:text-slate-400 focus:border-sky-400 focus:ring-sky-400/10"
              disabled={isLoading}
              id="code"
              name="code"
              onChange={handleChange}
              required
              type="text"
              value={formData.code}
            />
          </div>
        )}

        <Button
          aria-label={
            isLoading
              ? 'Processing...'
              : view === 'signIn'
                ? 'Sign in'
                : 'Sign up'
          }
          className="w-full bg-sky-500 text-white transition-colors duration-200 hover:bg-sky-600 focus:ring-2 focus:ring-sky-400/20 focus:ring-offset-2 focus:ring-offset-slate-800"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : view === 'signIn' ? (
            'Sign in'
          ) : (
            'Sign up'
          )}
        </Button>
      </form>
    </div>
  );
}
