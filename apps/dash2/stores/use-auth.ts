import { create } from 'zustand';
import { useSession, signOut } from '@databuddy/auth/client';
import { loginWithEmail, loginWithGoogle, loginWithGithub, registerWithEmail } from '@databuddy/auth/client';
import type { AuthUser } from '@databuddy/auth';

interface AuthStore {
  // State
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string, options?: {
    redirectUrl?: string;
    router?: any;
  }) => Promise<any>;
  
  loginWithGoogle: (options?: {
    redirectUrl?: string;
    router?: any;
  }) => Promise<any>;
  
  loginWithGithub: (options?: {
    redirectUrl?: string;
    router?: any;
  }) => Promise<any>;
  
  register: (email: string, password: string, name: string, options?: {
    redirectUrl?: string;
    router?: any;
  }) => Promise<any>;
  
  logout: (options?: {
    redirectUrl?: string;
    router?: any;
  }) => Promise<void>;

  // Sync methods
  setUser: (user: AuthUser | null) => void;
  setLoading: (isLoading: boolean) => void;
  initializeSession: () => Promise<void>;
}

export const useAuth = create<AuthStore>((set, get) => ({
  // Initial state
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // Initialize session
  initializeSession: async () => {
    try {
      const session = await useSession();
      set({
        user: session.data?.user ?? null,
        isAuthenticated: !!session.data?.user,
        isLoading: false
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  // Actions
  login: async (email, password, options) => {
    set({ isLoading: true });
    try {
      const result = await loginWithEmail(email, password, options);
      await get().initializeSession();
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGoogle: async (options) => {
    set({ isLoading: true });
    try {
      const result = await loginWithGoogle(options);
      await get().initializeSession();
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  loginWithGithub: async (options) => {
    set({ isLoading: true });
    try {
      const result = await loginWithGithub(options);
      await get().initializeSession();
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, name, options) => {
    set({ isLoading: true });
    try {
      const result = await registerWithEmail(email, password, name, options);
      await get().initializeSession();
      return result;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async (options) => {
    set({ isLoading: true });
    try {
      await signOut();
      set({ user: null, isAuthenticated: false });
      if (options?.router && options.redirectUrl) {
        options.router.push(options.redirectUrl);
      }
    } finally {
      set({ isLoading: false });
    }
  },

  // Sync methods
  setUser: (user) => set({ 
    user, 
    isAuthenticated: !!user 
  }),
  
  setLoading: (isLoading) => set({ isLoading }),
})); 