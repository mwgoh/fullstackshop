"use client";

import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { orderStatusLabel } from "@/lib/orderStatus";

export default function MyOrdersPage() {
  const { isLoading, isAuthenticated } = useStoreUserEffect();

  if (isLoading) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="p-8 flex flex-col gap-4 items-start">
        <p>주문 내역을 보려면 로그인해 주세요.</p>
        <SignInButton mode="modal">
          <button className="bg-foreground text-background px-4 py-2 rounded-md">
            로그인
          </button>
        </SignInButton>
      </main>
    );
  }

  return <MyOrdersList />;
}

function MyOrdersList() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.orders.listMyOrders,
    {},
    { initialNumItems: 10 },
  );

  return (
    <main className="p-8 flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold">내 주문 내역</h1>

      {status === "LoadingFirstPage" ? (
        <p className="text-slate-500">불러오는 중...</p>
      ) : results.length === 0 ? (
        <p className="text-slate-500">주문 내역이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((order) => (
            <li key={order._id}>
              <Link
                href={`/orders/${order._id}`}
                className="flex items-center justify-between gap-4 border border-slate-200 dark:border-slate-800 rounded-md p-3 hover:opacity-80"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-sm text-slate-500">
                    {new Date(order._creationTime).toLocaleDateString(
                      "ko-KR",
                    )}
                  </span>
                  <span className="text-sm font-medium">
                    {orderStatusLabel[order.status]}
                  </span>
                </div>
                <span className="font-bold">
                  {order.totalAmount.toLocaleString()}원
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {status === "CanLoadMore" && (
        <button
          className="mx-auto bg-foreground text-background text-sm px-4 py-2 rounded-md"
          onClick={() => loadMore(10)}
        >
          더 보기
        </button>
      )}
      {status === "LoadingMore" && (
        <p className="mx-auto text-sm text-slate-500">불러오는 중...</p>
      )}
    </main>
  );
}
