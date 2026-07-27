import { Doc } from "@/convex/_generated/dataModel";

export const orderStatusLabel: Record<Doc<"orders">["status"], string> = {
  pending: "결제 대기중",
  paid: "결제 완료",
  preparing: "상품 준비중",
  shipping: "배송중",
  completed: "배송완료",
  cancelled: "취소됨",
};

// Tailwind classes for the status pill badge shown on order list/detail pages.
export const orderStatusBadgeClass: Record<Doc<"orders">["status"], string> =
  {
    pending:
      "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
    paid: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
    preparing:
      "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-400",
    shipping:
      "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400",
    completed:
      "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400",
    cancelled: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
  };
