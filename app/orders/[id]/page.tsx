"use client";

import { Suspense, use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAction, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { orderStatusLabel } from "@/lib/orderStatus";

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
    <main className="p-8 flex flex-col gap-6 max-w-2xl mx-auto">
      {success && (
        <p className="text-green-600 font-medium">결제가 완료되었습니다.</p>
      )}
      {canceled && (
        <p className="text-amber-600 font-medium">결제가 취소되었습니다.</p>
      )}
      <h1 className="text-2xl font-bold">주문 상세</h1>
      <p className="text-sm text-slate-500">
        상태: {orderStatusLabel[order.status]}
      </p>

      {order.status === "pending" && (
        <div className="flex flex-col gap-2 items-start">
          <button
            onClick={handlePay}
            disabled={paying}
            className="bg-foreground text-background px-4 py-2 rounded-md disabled:opacity-50"
          >
            {paying ? "이동 중..." : "결제하기"}
          </button>
          {payError && <p className="text-sm text-red-500">{payError}</p>}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {order.items.map((item) => (
          <li key={item._id} className="flex justify-between gap-2 text-sm">
            <span className="truncate">
              {item.product?.name ?? "삭제된 상품"} x {item.quantity}
            </span>
            <span className="shrink-0">
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

      <div className="text-sm text-slate-500">
        <p>
          {order.shippingAddress.recipientName} ({order.shippingAddress.phone}
          )
        </p>
        <p>
          [{order.shippingAddress.zipCode}] {order.shippingAddress.address1}{" "}
          {order.shippingAddress.address2 ?? ""}
        </p>
      </div>
    </main>
  );
}
