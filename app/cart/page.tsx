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
          <button className="bg-foreground text-background px-4 py-2 rounded-md">
            로그인
          </button>
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
      <main className="p-8 flex flex-col gap-4 items-start">
        <p className="text-slate-500">장바구니가 비어 있습니다.</p>
        <Link href="/products" className="underline hover:no-underline">
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
    <main className="p-8 flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">장바구니</h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item._id}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200 dark:border-slate-800 rounded-md p-3"
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
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) => {
                  const quantity = Number(e.target.value);
                  if (Number.isFinite(quantity)) {
                    void handleUpdateQuantity(item._id, quantity);
                  }
                }}
                className="w-16 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-sm"
              />
              <button
                className="text-xs underline hover:no-underline"
                onClick={() => void handleRemove(item._id)}
              >
                삭제
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
        <span className="font-medium">합계</span>
        <span className="text-lg font-bold">{total.toLocaleString()}원</span>
      </div>

      <Link
        href="/checkout"
        className="bg-foreground text-background px-4 py-2 rounded-md text-center"
      >
        주문하기
      </Link>
    </main>
  );
}
