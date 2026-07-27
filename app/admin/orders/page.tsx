"use client";

import { useState } from "react";
import { useMutation, usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/orderStatus";

const STATUS_OPTIONS: Doc<"orders">["status"][] = [
  "pending",
  "paid",
  "preparing",
  "shipping",
  "completed",
  "cancelled",
];

export default function AdminOrdersPage() {
  const { results, status, loadMore } = usePaginatedQuery(
    api.orders.listAllForAdmin,
    {},
    { initialNumItems: 20 },
  );
  const updateStatus = useMutation(api.orders.updateStatus);
  const [error, setError] = useState<string | null>(null);

  async function handleStatusChange(
    orderId: Id<"orders">,
    newStatus: Doc<"orders">["status"],
  ) {
    setError(null);
    try {
      await updateStatus({ orderId, status: newStatus });
    } catch {
      setError("상태 변경에 실패했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <main className="p-8 flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">주문 관리</h1>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {status === "LoadingFirstPage" ? (
        <p className="text-slate-500 text-sm">불러오는 중...</p>
      ) : results.length === 0 ? (
        <p className="text-slate-500 text-sm">주문이 없습니다.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {results.map((order) => (
            <li
              key={order._id}
              className="card flex flex-col sm:flex-row sm:items-center gap-3 p-4"
            >
              <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                <span className="text-xs text-slate-500">
                  {new Date(order._creationTime).toLocaleString("ko-KR")}
                </span>
                <span className="text-sm truncate">
                  {order.shippingAddress.recipientName}
                </span>
              </div>
              <span
                className={`badge w-fit ${orderStatusBadgeClass[order.status]}`}
              >
                {orderStatusLabel[order.status]}
              </span>
              <span className="text-sm font-medium">
                {order.totalAmount.toLocaleString()}원
              </span>
              <select
                value={order.status}
                onChange={(e) =>
                  void handleStatusChange(
                    order._id,
                    e.target.value as Doc<"orders">["status"],
                  )
                }
                className="input w-auto py-1.5"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {orderStatusLabel[s]}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}

      {status === "CanLoadMore" && (
        <button className="btn-secondary btn-sm mx-auto" onClick={() => loadMore(20)}>
          더 보기
        </button>
      )}
    </main>
  );
}
