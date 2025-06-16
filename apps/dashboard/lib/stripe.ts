import Stripe from 'stripe'

// Initialize Stripe with test mode configuration
import dotenv from "dotenv";

dotenv.config();

const secretKey = process.env.STRIPE_SECRET_KEY;

export const stripe = secretKey
  ? new Stripe(secretKey, {
      typescript: true, // Enable TypeScript support
    })
  : null;


// Stripe configuration
export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  isTestMode: !process.env.STRIPE_SECRET_KEY?.startsWith('sk_live_'),
}

// Test product configuration
export const TEST_PRODUCTS = {
  basic: {
    name: 'Basic Plan',
    description: 'Basic analytics plan',
    price: 999, // $9.99 in cents
    currency: 'usd',
  },
  pro: {
    name: 'Pro Plan', 
    description: 'Professional analytics plan',
    price: 2999, // $29.99 in cents
    currency: 'usd',
  },
} as const

export type ProductKey = keyof typeof TEST_PRODUCTS 