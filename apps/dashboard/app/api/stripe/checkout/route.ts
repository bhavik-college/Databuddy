import { type NextRequest, NextResponse } from "next/server";
import { type ProductKey, stripe, TEST_PRODUCTS } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    if (!stripe) {
      return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
    }

    const { productKey, clientId, sessionId } = await request.json();

    if (!(productKey && TEST_PRODUCTS[productKey as ProductKey])) {
      return NextResponse.json({ error: "Invalid product key" }, { status: 400 });
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "client_id is required for analytics tracking" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "sessionId is required for analytics tracking" },
        { status: 400 }
      );
    }

    const product = TEST_PRODUCTS[productKey as ProductKey];

    console.log("🔵 Creating checkout session with Databuddy metadata:", {
      sessionId,
      clientId,
      productKey,
      timestamp: new Date().toISOString(),
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: product.currency,
            product_data: {
              name: product.name,
              description: product.description,
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      success_url: `${request.nextUrl.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/payment/cancel`,
      // IMPORTANT: These fields are required for analytics tracking (as per stripe.ts)
      client_reference_id: sessionId, // Analytics session ID from Databuddy
      metadata: {
        client_id: clientId, // Databuddy client identifier
        product_key: productKey,
        session_id: sessionId,
      },
      // CRITICAL: Set metadata on payment intent so it propagates to charges
      payment_intent_data: {
        metadata: {
          client_id: clientId, // Required for webhook processing
          session_id: sessionId, // Required for analytics tracking
          product_key: productKey,
        },
      },
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      analyticsSessionId: sessionId,
      clientId,
    });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
