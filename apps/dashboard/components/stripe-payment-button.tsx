'use client'

import { useState } from 'react'
import { CreditCard, Loader2 } from 'lucide-react'
import { type ProductKey } from '@/lib/stripe'

// Simple client ID configuration (same as layout.tsx)
const CLIENT_ID = process.env.NODE_ENV === 'development'
    ? "5ced32e5-0219-4e75-a18a-ad9826f85698"
    : "3ed1fce1-5a56-4cb6-a977-66864f6d18e3"

interface StripePaymentButtonProps {
    productKey: ProductKey
    clientId?: string
    className?: string
    children?: React.ReactNode
    variant?: 'primary' | 'secondary' | 'outline'
    size?: 'sm' | 'md' | 'lg'
}

export function StripePaymentButton({
    productKey,
    clientId,
    className = '',
    children,
    variant = 'primary',
    size = 'md',
}: StripePaymentButtonProps) {
    const [loading, setLoading] = useState(false)

    const handlePayment = async () => {
        setLoading(true)

        try {
            // Get session ID from Databuddy (or generate fallback)
            const sessionId = sessionStorage.getItem('did_session') || `test_${Date.now()}`
            const actualClientId = clientId || CLIENT_ID

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productKey,
                    clientId: actualClientId,
                    sessionId,
                }),
            })

            const data = await response.json()

            if (data.url) {
                // Redirect to Stripe Checkout
                window.location.href = data.url
            } else {
                throw new Error(data.error || 'Failed to create checkout session')
            }
        } catch (error) {
            console.error('Payment error:', error)
            alert('Failed to initiate payment. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    // Base styles
    const baseStyles = 'inline-flex items-center justify-center gap-2 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'

    // Size variants
    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg',
    }

    // Color variants
    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-600 hover:text-white',
    }

    const buttonStyles = `${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`

    return (
        <button
            onClick={handlePayment}
            disabled={loading}
            className={buttonStyles}
        >
            {loading ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                </>
            ) : (
                <>
                    <CreditCard className="w-4 h-4" />
                    {children || 'Pay with Stripe'}
                </>
            )}
        </button>
    )
} 