export * from './auth';
export * from './types';
export * from './auth-client';
export * from './auth-helpers';

// Re-export specific client utilities for convenience
export { 
  authClient, 
  signIn, 
  signUp, 
  signOut, 
  useSession, 
  getSession, 
  useUser, 
  hasRole, 
  initAuthClient 
} from './auth-client';

// Re-export helper functions for convenience
export {
  loginWithEmail,
  registerWithEmail,
  logout,
  loginWithGoogle,
  loginWithGithub
} from './auth-helpers';
