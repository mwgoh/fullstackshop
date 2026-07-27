"use client";

import { FormEvent, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";

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
          <button className="btn-primary">로그인</button>
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (items === undefined) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  // `submitting`이 true인 동안은 카트가 이미 비워졌더라도(createFromCart가
  // 주문 생성과 동시에 카트를 비움) 결제 진행 화면을 계속 보여준다. 그렇지
  // 않으면 Stripe로 리다이렉트되기 직전 반응형 쿼리가 먼저 갱신되면서 이
  // 화면이 "장바구니가 비어 있습니다"로 바뀌어 결제 실패 메시지도 가려진다.
  if (items.length === 0 && !submitting) {
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

      const { url } = await createCheckoutSession({
        orderId,
        origin: window.location.origin,
      });
      window.location.assign(url);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "주문 처리 중 오류가 발생했습니다.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="section py-12 flex flex-col lg:flex-row gap-10 items-start">
      <form
        onSubmit={handleSubmit}
        className="flex-1 w-full flex flex-col gap-4"
      >
        <h1 className="text-3xl font-bold tracking-tight mb-2">주문/결제</h1>
        <h2 className="text-sm font-semibold text-slate-500">배송 정보</h2>
        <input
          required
          placeholder="받는 분 성함"
          value={form.recipientName}
          onChange={(e) =>
            setForm({ ...form, recipientName: e.target.value })
          }
          className="input"
        />
        <input
          required
          placeholder="연락처"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="input"
        />
        <input
          required
          placeholder="우편번호"
          value={form.zipCode}
          onChange={(e) => setForm({ ...form, zipCode: e.target.value })}
          className="input"
        />
        <input
          required
          placeholder="주소"
          value={form.address1}
          onChange={(e) => setForm({ ...form, address1: e.target.value })}
          className="input"
        />
        <input
          placeholder="상세주소 (선택)"
          value={form.address2}
          onChange={(e) => setForm({ ...form, address2: e.target.value })}
          className="input"
        />

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button type="submit" disabled={submitting} className="btn-primary mt-2">
          {submitting ? "처리 중..." : "결제하기"}
        </button>
      </form>

      <div className="card w-full lg:w-80 shrink-0 p-6 flex flex-col gap-3 lg:sticky lg:top-24">
        <h2 className="font-semibold">주문 요약</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {items.map((item) => (
            <li key={item._id} className="flex justify-between gap-2">
              <span className="truncate text-slate-600 dark:text-slate-400">
                {item.product?.name ?? "삭제된 상품"} x {item.quantity}
              </span>
              <span className="shrink-0 font-medium">
                {((item.product?.price ?? 0) * item.quantity).toLocaleString()}
                원
              </span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between items-center border-t border-slate-200 dark:border-slate-800 pt-4">
          <span className="font-medium">합계</span>
          <span className="text-xl font-bold">{total.toLocaleString()}원</span>
        </div>
      </div>
    </main>
  );
}
