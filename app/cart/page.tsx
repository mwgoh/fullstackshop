"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";

export default function CartPage() {
  const { isLoading, isAuthenticated } = useStoreUserEffect();

  if (isLoading) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="p-8 flex flex-col gap-4 items-start">
        <p>장바구니를 보려면 로그인해 주세요.</p>
        <SignInButton mode="modal">
          <button className="btn-primary">로그인</button>
        </SignInButton>
      </main>
    );
  }

  return <CartContent />;
}

function CartContent() {
  const items = useQuery(api.cart.getMyCart, {});
  const updateQuantity = useMutation(api.cart.updateQuantity);
  const removeItem = useMutation(api.cart.removeItem);
  const [error, setError] = useState<string | null>(null);

  async function handleUpdateQuantity(
    cartItemId: Parameters<typeof updateQuantity>[0]["cartItemId"],
    quantity: number,
  ) {
    setError(null);
    try {
      await updateQuantity({ cartItemId, quantity });
    } catch {
      setError("수량 변경에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  async function handleRemove(
    cartItemId: Parameters<typeof removeItem>[0]["cartItemId"],
  ) {
    setError(null);
    try {
      await removeItem({ cartItemId });
    } catch {
      setError("삭제에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  if (items === undefined) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (items.length === 0) {
    return (
      <main className="section py-24 flex flex-col gap-4 items-center text-center">
        <p className="text-slate-500">장바구니가 비어 있습니다.</p>
        <Link href="/products" className="btn-primary">
          상품 보러 가기
        </Link>
      </main>
    );
  }

  const total = items.reduce(
    (sum, item) => sum + (item.product?.price ?? 0) * item.quantity,
    0,
  );

  return (
    <main className="section py-12 flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">장바구니</h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        <ul className="flex-1 w-full flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item._id}
              className="card flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <span className="font-medium truncate">
                  {item.product?.name ?? "삭제된 상품"}
                </span>
                <span className="text-sm text-slate-500">
                  {(item.product?.price ?? 0).toLocaleString()}원
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden">
                  <button
                    type="button"
                    aria-label="수량 감소"
                    onClick={() =>
                      void handleUpdateQuantity(item._id, item.quantity - 1)
                    }
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    −
                  </button>
                  <span className="w-9 text-center text-sm font-medium tabular-nums">
                    {item.quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="수량 증가"
                    onClick={() =>
                      void handleUpdateQuantity(item._id, item.quantity + 1)
                    }
                    className="w-8 h-8 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  className="btn-ghost text-xs px-2 py-1"
                  onClick={() => void handleRemove(item._id)}
                >
                  삭제
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="card w-full lg:w-80 shrink-0 p-6 flex flex-col gap-4 lg:sticky lg:top-24">
          <h2 className="font-semibold">주문 요약</h2>
          <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
            <span className="font-medium">합계</span>
            <span className="text-xl font-bold">
              {total.toLocaleString()}원
            </span>
          </div>
          <Link href="/checkout" className="btn-primary w-full">
            주문하기
          </Link>
          <Link
            href="/products"
            className="text-center text-sm text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            계속 쇼핑하기
          </Link>
        </div>
      </div>
    </main>
  );
}
