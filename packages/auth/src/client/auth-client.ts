import { createAuthClient } from "better-auth/react"
import { customSessionClient, twoFactorClient, organizationClient, emailOTPClient } from "better-auth/client/plugins";
import { type auth } from "../auth";
import { AuthUser } from "../types";
import { jwt, multiSession } from "better-auth/plugins";

// Define a type for the auth client configuration
export type AuthClientConfig = {
  baseURL?: string;
  debug?: boolean;
};

// Default configuration that can be overridden
const defaultConfig: AuthClientConfig = {
  baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL as string,
  debug: process.env.NODE_ENV !== "production",
};

// Create a singleton instance with the default configuration
let _authClient = createAuthClient({
  baseURL: defaultConfig.baseURL,
  plugins: [
    customSessionClient<typeof auth>(),
    twoFactorClient(),
    multiSession(),
    jwt(),
    // emailOTPClient(),
    organizationClient({
      teams: {
        enabled: true
      }
    })
  ],
});

// Function to initialize or reconfigure the auth client
export function initAuthClient(config: AuthClientConfig = {}) {
  const mergedConfig = { ...defaultConfig, ...config };
  
  _authClient = createAuthClient({
    baseURL: mergedConfig.baseURL,
    plugins: [
      customSessionClient<typeof auth>(),
      twoFactorClient(),
      multiSession(),
      jwt(),
      emailOTPClient(),
      organizationClient({
        teams: {
          enabled: true
        }
      })
    ],
  });
  
  return _authClient;
}

// Export the auth client instance
export const authClient = _authClient;

// Export individual functions directly from the client
// These are properly typed and will be available for import
export const signIn = _authClient.signIn;
export const signUp = _authClient.signUp;
export const signOut = _authClient.signOut;
export const useSession = _authClient.useSession;
export const getSession = _authClient.getSession;

// Export a hook to get the current user with proper typing
export function useUser() {
  const { data, isPending, error } = useSession();
  
  return {
    user: data?.user as AuthUser | undefined,
    isLoading: isPending,
    error,
  };
}

// Export a helper to check if the user has a specific role
export function hasRole(user: AuthUser | null | undefined, role: string | string[]) {
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
}