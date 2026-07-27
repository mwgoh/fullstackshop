import { v } from "convex/values";
import Stripe from "stripe";
import { action, httpAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

// Uses the fetch-based HTTP client so this works in Convex's default
// (non-Node) runtime, same as the rest of this app's functions.
function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  return new Stripe(key, { httpClient: Stripe.createFetchHttpClient() });
}

// Creates a Stripe Checkout Session for an already-created pending order and
// returns the URL to redirect the browser to.
export const createCheckoutSession = action({
  args: { orderId: v.id("orders"), origin: v.string() },
  handler: async (ctx, args): Promise<{ url: string }> => {
    const order = await ctx.runQuery(api.orders.getMyOrder, {
      orderId: args.orderId,
    });
    if (order === null) {
      throw new Error("주문을 찾을 수 없습니다");
    }

    const stripe = getStripeClient();
    // 로컬 개발(localhost)과 Vercel 배포가 같은 Convex 배포를 공유할 수 있어,
    // 고정된 환경변수 대신 결제를 시작한 브라우저의 실제 origin을 그대로
    // 사용해 success/cancel URL을 만든다.
    const siteUrl = args.origin.replace(/\/+$/, "");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: order.items.map((item) => ({
        price_data: {
          currency: "krw",
          product_data: { name: item.product?.name ?? "상품" },
          // KRW is a Stripe zero-decimal currency: unit_amount is the won
          // amount as-is, not multiplied by 100.
          unit_amount: item.priceAtPurchase,
        },
        quantity: item.quantity,
      })),
      success_url: `${siteUrl}/orders/${args.orderId}?success=true`,
      cancel_url: `${siteUrl}/orders/${args.orderId}?canceled=true`,
      metadata: { orderId: args.orderId },
    });

    if (!session.url) {
      throw new Error("Stripe 세션 생성에 실패했습니다");
    }

    await ctx.runMutation(internal.orders.setStripeSessionId, {
      orderId: args.orderId,
      stripeSessionId: session.id,
    });

    return { url: session.url };
  },
});

// Fallback for when the webhook hasn't (yet) landed: called from the order
// success page right after returning from Stripe Checkout. Looks the
// session up directly with Stripe and reconciles the order if it's paid.
export const syncOrderStatus = action({
  args: { orderId: v.id("orders") },
  handler: async (ctx, args): Promise<{ status: string }> => {
    const order = await ctx.runQuery(api.orders.getMyOrder, {
      orderId: args.orderId,
    });
    if (order === null) {
      throw new Error("주문을 찾을 수 없습니다");
    }
    if (order.status !== "pending" || !order.stripeSessionId) {
      return { status: order.status };
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(
      order.stripeSessionId,
    );
    if (session.payment_status === "paid") {
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      await ctx.runMutation(internal.orders.markOrderPaidBySessionId, {
        stripeSessionId: order.stripeSessionId,
        stripePaymentIntentId: paymentIntentId,
      });
      return { status: "paid" };
    }
    return { status: order.status };
  },
});

// Registered at /stripe-webhook in convex/http.ts. Verifies the Stripe
// signature using the Web Crypto provider (no Node runtime required), then
// marks the matching order as paid on checkout.session.completed.
export const webhook = httpAction(async (ctx, request) => {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", {
      status: 400,
    });
  }

  const body = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret,
      undefined,
      Stripe.createSubtleCryptoProvider(),
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error);
    return new Response("Invalid webhook signature", { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
    await ctx.runMutation(internal.orders.markOrderPaidBySessionId, {
      stripeSessionId: session.id,
      stripePaymentIntentId: paymentIntentId,
    });
  }

  return new Response(null, { status: 200 });
});
