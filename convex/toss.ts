import { v } from "convex/values";
import { action } from "./_generated/server";
import { api, internal } from "./_generated/api";

function getTossAuthHeader() {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new Error("TOSS_SECRET_KEY is not configured");
  }
  // Toss Payments confirm API uses HTTP Basic Auth with the secret key as
  // the username and an empty password.
  return `Basic ${btoa(`${secretKey}:`)}`;
}

// Called from the order detail page right after the Toss payment window
// redirects back with paymentKey/orderId/amount in the success URL. This is
// the step that actually finalizes (captures) the payment - see
// https://docs.tosspayments.com/reference#결제-승인.
export const confirmPayment = action({
  args: {
    orderId: v.id("orders"),
    paymentKey: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args): Promise<{ status: string }> => {
    const order = await ctx.runQuery(api.orders.getMyOrder, {
      orderId: args.orderId,
    });
    if (order === null) {
      throw new Error("주문을 찾을 수 없습니다");
    }
    if (order.status !== "pending") {
      return { status: order.status };
    }
    if (order.totalAmount !== args.amount) {
      throw new Error("결제 금액이 주문 금액과 일치하지 않습니다");
    }

    const response = await fetch(
      "https://api.tosspayments.com/v1/payments/confirm",
      {
        method: "POST",
        headers: {
          Authorization: getTossAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentKey: args.paymentKey,
          orderId: args.orderId,
          amount: args.amount,
        }),
      },
    );

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new Error(
        errorBody?.message ?? "토스페이먼츠 결제 승인에 실패했습니다",
      );
    }

    const payment = (await response.json()) as { paymentKey: string };
    await ctx.runMutation(internal.orders.markOrderPaidByToss, {
      orderId: args.orderId,
      tossPaymentKey: payment.paymentKey,
    });

    return { status: "paid" };
  },
});
