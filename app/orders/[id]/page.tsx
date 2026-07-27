"use client";

import { Suspense, use, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { orderStatusBadgeClass, orderStatusLabel } from "@/lib/orderStatus";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return (
    <Suspense
      fallback={<main className="p-8 text-slate-500">불러오는 중...</main>}
    >
      <OrderDetailContent orderId={id} />
    </Suspense>
  );
}

function OrderDetailContent({ orderId }: { orderId: string }) {
  const searchParams = useSearchParams();
  const order = useQuery(api.orders.getMyOrder, {
    orderId: orderId as Id<"orders">,
  });
  const createCheckoutSession = useAction(api.stripe.createCheckoutSession);
  const syncOrderStatus = useAction(api.stripe.syncOrderStatus);
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const orderStatus = order?.status;
  const stripeSessionId = order?.stripeSessionId;
  useEffect(() => {
    // 웹훅이 아직 반영되지 않았을 수 있으니, 진행 중인 결제가 있으면 Stripe에서
    // 직접 상태를 확인해 보정한다.
    if (orderStatus === "pending" && stripeSessionId) {
      syncOrderStatus({ orderId: orderId as Id<"orders"> }).catch(() => {});
    }
  }, [orderStatus, stripeSessionId, orderId, syncOrderStatus]);

  if (order === undefined) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (order === null) {
    return <main className="p-8 text-slate-500">주문을 찾을 수 없습니다.</main>;
  }

  const success = searchParams.get("success") === "true";
  const canceled = searchParams.get("canceled") === "true";

  async function handlePay() {
    setPaying(true);
    setPayError(null);
    try {
      const { url } = await createCheckoutSession({
        orderId: orderId as Id<"orders">,
        origin: window.location.origin,
      });
      window.location.href = url;
    } catch (err) {
      setPayError(
        err instanceof Error ? err.message : "결제 페이지 이동 중 오류가 발생했습니다.",
      );
      setPaying(false);
    }
  }

  return (
    <main className="section py-12 flex flex-col gap-6 max-w-2xl">
      {success && (
        <p className="badge bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 self-start">
          결제가 완료되었습니다.
        </p>
      )}
      {canceled && (
        <p className="badge bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 self-start">
          결제가 취소되었습니다.
        </p>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-3xl font-bold tracking-tight">주문 상세</h1>
        <span className={`badge ${orderStatusBadgeClass[order.status]}`}>
          {orderStatusLabel[order.status]}
        </span>
      </div>

      {order.status === "pending" && (
        <div className="flex flex-col gap-2 items-start">
          <button onClick={handlePay} disabled={paying} className="btn-primary">
            {paying ? "이동 중..." : "결제하기"}
          </button>
          {payError && <p className="text-sm text-red-500">{payError}</p>}
        </div>
      )}

      <div className="card p-6 flex flex-col gap-4">
        <ul className="flex flex-col gap-2">
          {order.items.map((item) => (
            <li key={item._id} className="flex justify-between gap-2 text-sm">
              <span className="truncate text-slate-600 dark:text-slate-400">
                {item.product?.name ?? "삭제된 상품"} x {item.quantity}
              </span>
              <span className="shrink-0 font-medium">
                {(item.priceAtPurchase * item.quantity).toLocaleString()}원
              </span>
            </li>
          ))}
        </ul>

        <div className="flex justify-between border-t border-slate-200 dark:border-slate-800 pt-4">
          <span className="font-medium">합계</span>
          <span className="text-lg font-bold">
            {order.totalAmount.toLocaleString()}원
          </span>
        </div>

        <div className="text-sm text-slate-500 border-t border-slate-200 dark:border-slate-800 pt-4">
          <p>
            {order.shippingAddress.recipientName} ({order.shippingAddress.phone}
            )
          </p>
          <p>
            [{order.shippingAddress.zipCode}] {order.shippingAddress.address1}{" "}
            {order.shippingAddress.address2 ?? ""}
          </p>
        </div>
      </div>

      <Link href="/products" className="btn-secondary self-start">
        계속 쇼핑하기
      </Link>
    </main>
  );
}
