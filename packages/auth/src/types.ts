// User types
export interface AuthUser {
  id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  role: string;
}

// Session types
export interface AuthSession {
  id: string;
  role: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
}

// Combined session data type
export interface SessionData {
  user: AuthUser;
  session: AuthSession;
}

// Auth error types
export interface AuthError {
  message: string;
  code?: string;
  status?: number;
}

// Provider types
export type Provider = 
  | "email" 
  | "google" 
  | "github" 
  | "credentials";

// Sign in options
export interface SignInOptions {
  redirect?: boolean;
  redirectUrl?: string;
  provider?: Provider;
}

// Sign up options
export interface SignUpOptions {
  redirect?: boolean;
  redirectUrl?: string;
}
