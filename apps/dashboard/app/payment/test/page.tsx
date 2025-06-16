'use client'

import { useState } from 'react'
import { CreditCard, Loader2, Shield, CheckCircle } from 'lucide-react'
import { TEST_PRODUCTS, type ProductKey } from '@/lib/stripe'

// Simple client ID configuration (same as layout.tsx)
const CLIENT_ID = process.env.NODE_ENV === 'development'
    ? "5ced32e5-0219-4e75-a18a-ad9826f85698"
    : "3ed1fce1-5a56-4cb6-a977-66864f6d18e3"

export default function TestPaymentPage() {
    const [loading, setLoading] = useState<ProductKey | null>(null)

    const handlePayment = async (productKey: ProductKey) => {
        setLoading(productKey)

        try {
            // Get session ID from Databuddy (or generate fallback)
            const sessionId = sessionStorage.getItem('did_session') || `test_${Date.now()}`

            console.log('Creating payment with:', { productKey, clientId: CLIENT_ID, sessionId })

            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    productKey,
                    clientId: CLIENT_ID,
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
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Test Stripe Integration
                    </h1>
                    <p className="text-xl text-gray-600 mb-6">
                        Test our Stripe payment integration with these demo products
                    </p>
                    <div className="inline-flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                        <Shield className="w-4 h-4" />
                        Test Mode - No real charges will be made
                    </div>
                </div>

                {/* Payment Cards */}
                <div className="grid md:grid-cols-2 gap-8 mb-12">
                    {Object.entries(TEST_PRODUCTS).map(([key, product]) => {
                        const productKey = key as ProductKey
                        const isLoading = loading === productKey

                        return (
                            <div
                                key={key}
                                className="bg-white rounded-xl shadow-lg p-8 border border-gray-200 hover:shadow-xl transition-shadow"
                            >
                                <div className="text-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                        {product.name}
                                    </h3>
                                    <p className="text-gray-600 mb-4">
                                        {product.description}
                                    </p>
                                    <div className="text-3xl font-bold text-blue-600">
                                        ${(product.price / 100).toFixed(2)}
                                        <span className="text-lg text-gray-500 font-normal">
                                            /{product.currency.toUpperCase()}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span>Secure payment processing</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span>Analytics tracking included</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-700">
                                        <CheckCircle className="w-5 h-5 text-green-500" />
                                        <span>Webhook integration</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => handlePayment(productKey)}
                                    disabled={isLoading}
                                    className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-5 h-5" />
                                            Pay with Stripe
                                        </>
                                    )}
                                </button>
                            </div>
                        )
                    })}
                </div>

                {/* Test Card Info */}
                <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">
                        Test Card Information
                    </h3>
                    <p className="text-gray-600 mb-4">
                        Use these test card numbers to simulate different payment scenarios:
                    </p>

                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Successful Payment</h4>
                                <p className="font-mono text-sm text-gray-700">4242 4242 4242 4242</p>
                                <p className="text-sm text-gray-600">Any future date, any CVC</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Declined Payment</h4>
                                <p className="font-mono text-sm text-gray-700">4000 0000 0000 0002</p>
                                <p className="text-sm text-gray-600">Any future date, any CVC</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Requires Authentication</h4>
                                <p className="font-mono text-sm text-gray-700">4000 0025 0000 3155</p>
                                <p className="text-sm text-gray-600">Any future date, any CVC</p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h4 className="font-semibold text-gray-900 mb-2">Insufficient Funds</h4>
                                <p className="font-mono text-sm text-gray-700">4000 0000 0000 9995</p>
                                <p className="text-sm text-gray-600">Any future date, any CVC</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Back to Dashboard */}
                <div className="text-center mt-8">
                    <button
                        onClick={() => window.location.href = '/'}
                        className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300 transition-colors"
                    >
                        ← Back to Dashboard
                    </button>
                </div>
            </div>
        </div>
    )
} 