"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { loadTossPayments, ANONYMOUS } from "@tosspayments/tosspayments-sdk";
import { api } from "@/convex/_generated/api";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";

type PaymentProvider = "stripe" | "toss";

export default function CheckoutPage() {
  const { isLoading, isAuthenticated } = useStoreUserEffect();

  if (isLoading) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="p-8 flex flex-col gap-4 items-start">
        <p>주문하려면 로그인해 주세요.</p>
        <SignInButton mode="modal">
          <button className="bg-foreground text-background px-4 py-2 rounded-md">
            로그인
          </button>
        </SignInButton>
      </main>
    );
  }

  return <CheckoutForm />;
}

function CheckoutForm() {
  const items = useQuery(api.cart.getMyCart, {});
  const createOrder = useMutation(api.orders.createFromCart);
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);

  const [form, setForm] = useState({
    recipientName: "",
    phone: "",
    zipCode: "",
    address1: "",
    address2: "",
  });
  const [provider, setProvider] = useState<PaymentProvider>("stripe");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items === undefined) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (items.length === 0) {
    return (
      <main className="p-8 text-slate-500">장바구니가 비어 있습니다.</main>
    );
  }

  const total = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const orderId = await createOrder({
        shippingAddress: {
          recipientName: form.recipientName,
          phone: form.phone,
          zipCode: form.zipCode,
          address1: form.address1,
          address2: form.address2 || undefined,
        },
      });

      if (provider === "stripe") {
        const { url } = await createCheckoutSession({ orderId });
        window.location.assign(url);
        return;
      }

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("토스페이먼츠 클라이언트 키가 설정되지 않았습니다.");
      }
      const orderName =
        items!.length > 1
          ? `${items![0].product?.name ?? "상품"} 외 ${items!.length - 1}건`
          : (items![0].product?.name ?? "상품");

      const tossPayments = await loadTossPayments(clientKey);
      const payment = tossPayments.payment({ customerKey: ANONYMOUS });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: total },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/orders/${orderId}?tossSuccess=true`,
        failUrl: `${window.location.origin}/orders/${orderId}?tossFail=true`,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "주문 처리 중 오류가 발생했습니다.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="p-8 flex flex-col gap-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold">주문/결제</h1>

      <ul className="flex flex-col gap-1 text-sm">
        {items.map((item) => (
          <li key={item._id} className="flex justify-between gap-2">
            <span className="truncate">
              {item.product?.name ?? "삭제된 상품"} x {item.quantity}
            </span>
            <span className="shrink-0">
              {((item.product?.price ?? 0) * item.quantity).toLocaleString()}
              원
            </span>
          </li>
        ))}
      </ul>
      <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-2">
        <span className="font-medium">합계</span>
        <span className="text-lg font-bold">{total.toLocaleString()}원</span>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          required
          placeholder="받는 분 성함"
          value={form.recipientName}
          onChange={(e) =>
            setForm({ ...form, recipientName: e.target.value })
          }
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="연락처"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="우편번호"
          value={form.zipCode}
          onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
        />
        <input
          required
          placeholder="주소"
          value={form.address1}
          onChange={(e) => setForm({ ...form, address1: e.target.value })}
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
        />
        <input
          placeholder="상세주소 (선택)"
          value={form.address2}
          onChange={(e) => setForm({ ...form, address2: e.target.value })}
          className="border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2 text-sm"
        />

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">결제 수단</span>
          <div className="flex gap-3">
            <label
              className={`flex-1 flex items-center gap-2 border rounded-md px-3 py-2 text-sm cursor-pointer ${
                provider === "stripe"
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="provider"
                checked={provider === "stripe"}
                onChange={() => setProvider("stripe")}
              />
              Stripe (해외 카드)
            </label>
            <label
              className={`flex-1 flex items-center gap-2 border rounded-md px-3 py-2 text-sm cursor-pointer ${
                provider === "toss"
                  ? "border-indigo-500 ring-1 ring-indigo-500"
                  : "border-slate-300 dark:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="provider"
                checked={provider === "toss"}
                onChange={() => setProvider("toss")}
              />
              토스페이먼츠
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-foreground text-background px-4 py-2 rounded-md disabled:opacity-50"
        >
          {submitting ? "처리 중..." : "결제하기"}
        </button>
      </form>
    </main>
  );
}
