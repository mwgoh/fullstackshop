"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const product = useQuery(api.products.get, {
    productId: id as Id<"products">,
  });
  const { isAuthenticated } = useStoreUserEffect();
  const addItem = useMutation(api.cart.addItem);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (product === undefined) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (product === null) {
    return <main className="p-8 text-slate-500">상품을 찾을 수 없습니다.</main>;
  }

  const thumbnail = product.images[0];
  const soldOut = product.stock === 0;

  async function handleAdd() {
    setError(null);
    setAdded(false);
    try {
      await addItem({ productId: product!._id, quantity });
      setAdded(true);
    } catch {
      setError("장바구니 담기에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <main className="section py-12 flex flex-col md:flex-row gap-12">
      <div className="w-full md:w-1/2 aspect-square rounded-3xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center overflow-hidden shadow-sm">
        {thumbnail ? (
          // eslint-disable-next-line @next/next/no-img-element -- product images come from arbitrary admin-provided URLs
          <img
            src={thumbnail}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm text-slate-400">이미지 없음</span>
        )}
      </div>

      <div className="w-full md:w-1/2 flex flex-col gap-5">
        <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
        <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
          {product.price.toLocaleString()}원
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line leading-relaxed">
          {product.description}
        </p>
        <p className="text-sm">
          {soldOut ? (
            <span className="badge bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400">
              품절
            </span>
          ) : (
            <span className="text-slate-500">재고 {product.stock}개</span>
          )}
        </p>

        <div className="flex items-center gap-3 pt-2">
          <div className="flex items-center rounded-full border border-slate-200 dark:border-slate-800 overflow-hidden">
            <button
              type="button"
              aria-label="수량 감소"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              −
            </button>
            <span className="w-10 text-center text-sm font-medium tabular-nums">
              {quantity}
            </span>
            <button
              type="button"
              aria-label="수량 증가"
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 flex items-center justify-center text-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
            >
              +
            </button>
          </div>

          {isAuthenticated ? (
            <button
              className="btn-primary disabled:hover:bg-indigo-600"
              disabled={soldOut}
              onClick={() => void handleAdd()}
            >
              장바구니 담기
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="btn-primary">로그인 후 담기</button>
            </SignInButton>
          )}
        </div>

        {added && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            장바구니에 담았습니다.
          </p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}

        <Link href="/products" className="btn-secondary self-start mt-2">
          계속 쇼핑하기
        </Link>
      </div>
    </main>
  );
}
