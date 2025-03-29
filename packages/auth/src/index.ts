export * from './auth';
export * from './auth-client';
export * from './auth-helpers';
export * from './auth-org';
export * from './types';

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
  loginWithGithub,
  enableTwoFactor,
  verifyTwoFactorCode,
  verifyBackupCode,
  sendOTP,
  verifyOTP,
  generateBackupCodes
} from './auth-helpers';

// Default export for convenience
// export { auth } from './auth';
