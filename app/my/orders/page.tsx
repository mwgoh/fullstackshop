"use client";

import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/orderStatus";

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
          <button className="btn-primary">로그인</button>
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
    <main className="section py-12 flex flex-col gap-6 max-w-2xl">
      <h1 className="text-3xl font-bold tracking-tight">내 주문 내역</h1>

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
                className="card card-hover flex items-center justify-between gap-4 p-4"
              >
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm text-slate-500">
                    {new Date(order._creationTime).toLocaleDateString(
                      "ko-KR",
                    )}
                  </span>
                  <span
                    className={`badge w-fit ${orderStatusBadgeClass[order.status]}`}
                  >
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
        <button className="btn-secondary mx-auto" onClick={() => loadMore(10)}>
          더 보기
        </button>
      )}
      {status === "LoadingMore" && (
        <p className="mx-auto text-sm text-slate-500">불러오는 중...</p>
      )}
    </main>
  );
}
