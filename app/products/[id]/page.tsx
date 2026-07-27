"use client";

import { use, useState } from "react";
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
    <main className="p-8 flex flex-col md:flex-row gap-8 max-w-4xl mx-auto">
      <div className="w-full md:w-1/2 aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center rounded-md overflow-hidden">
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

      <div className="w-full md:w-1/2 flex flex-col gap-4">
        <h1 className="text-2xl font-bold">{product.name}</h1>
        <p className="text-xl">{product.price.toLocaleString()}원</p>
        <p className="text-sm text-slate-600 dark:text-slate-400 whitespace-pre-line">
          {product.description}
        </p>
        <p className="text-sm">
          {product.stock > 0 ? `재고 ${product.stock}개` : "품절"}
        </p>

        <div className="flex items-center gap-3">
          <input
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => {
              const next = Number(e.target.value);
              if (Number.isFinite(next) && next >= 1) {
                setQuantity(next);
              }
            }}
            className="w-16 border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-sm"
          />

          {isAuthenticated ? (
            <button
              className="bg-foreground text-background px-4 py-2 rounded-md disabled:opacity-50"
              disabled={product.stock === 0}
              onClick={() => void handleAdd()}
            >
              장바구니 담기
            </button>
          ) : (
            <SignInButton mode="modal">
              <button className="bg-foreground text-background px-4 py-2 rounded-md">
                로그인 후 담기
              </button>
            </SignInButton>
          )}
        </div>

        {added && (
          <p className="text-sm text-green-600">장바구니에 담았습니다.</p>
        )}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </main>
  );
}
