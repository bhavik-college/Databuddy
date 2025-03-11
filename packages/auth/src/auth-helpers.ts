"use client"

import { signIn, signOut, signUp } from './auth-client';

/**
 * Helper function to sign in with email and password with simplified redirect handling
 */
export async function loginWithEmail(
  email: string, 
  password: string, 
  options?: { 
    redirectUrl?: string;
    router?: any; // Next.js router
    onError?: (error: any) => void;
  }
) {
  try {
    const result = await signIn.email({
      email,
      password,
      fetchOptions: {
        onSuccess: () => {
          if (options?.router && options.redirectUrl) {
            options.router.push(options.redirectUrl);
            options.router.refresh();
          }
        }
      }
    });
    
    return { success: !result?.error, data: result };
  } catch (error) {
    if (options?.onError) {
      options.onError(error);
    }
    return { success: false, error };
  }
}

/**
 * Helper function to sign up with email and password with simplified redirect handling
 */
export async function registerWithEmail(
  email: string,
  password: string,
  name?: string,
  options?: {
    redirectUrl?: string;
    router?: any; // Next.js router
    onError?: (error: any) => void;
  }
) {
  try {
    const result = await signUp.email({
      email,
      password,
      name,
      fetchOptions: {
        onSuccess: () => {
          if (options?.router && options.redirectUrl) {
            options.router.push(options.redirectUrl);
            options.router.refresh();
          }
        }
      }
    });
    
    return { success: !result?.error, data: result };
  } catch (error) {
    if (options?.onError) {
      options.onError(error);
    }
    return { success: false, error };
  }
}

/**
 * Helper function to sign out with simplified redirect handling
 */
export async function logout(
  options?: {
    redirectUrl?: string;
    router?: any; // Next.js router
    onError?: (error: any) => void;
  }
) {
  try {
    await signOut();
    
    if (options?.router && options.redirectUrl) {
      options.router.push(options.redirectUrl);
    }
    
    return { success: true };
  } catch (error) {
    if (options?.onError) {
      options.onError(error);
    }
    return { success: false, error };
  }
}

/**
 * Helper function to sign in with Google with simplified redirect handling
 */
export function loginWithGoogle(
  options?: {
    redirectUrl?: string;
    router?: any; // Next.js router
    onError?: (error: any) => void;
  }
) {
  try {
    return signIn.social({
      provider: "google",
      fetchOptions: {
        onSuccess: () => {
          if (options?.router && options.redirectUrl) {
            options.router.push(options.redirectUrl);
            options.router.refresh();
          }
        }
      }
    });
  } catch (error) {
    if (options?.onError) {
      options.onError(error);
    }
    return { success: false, error };
  }
}

/**
 * Helper function to sign in with GitHub with simplified redirect handling
 */
export function loginWithGithub(
  options?: {
    redirectUrl?: string;
    router?: any; // Next.js router
    onError?: (error: any) => void;
  }
) {
  try {
    return signIn.social({
      provider: "github",
      fetchOptions: {
        onSuccess: () => {
          if (options?.router && options.redirectUrl) {
            options.router.push(options.redirectUrl);
            options.router.refresh();
          }
        }
      }
    });
  } catch (error) {
    if (options?.onError) {
      options.onError(error);
    }
    return { success: false, error };
  }
} 