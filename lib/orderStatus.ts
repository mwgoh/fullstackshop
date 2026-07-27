import { Doc } from "@/convex/_generated/dataModel";

export const orderStatusLabel: Record<Doc<"orders">["status"], string> = {
  pending: "결제 대기중",
  paid: "결제 완료",
  preparing: "상품 준비중",
  shipping: "배송중",
  completed: "배송완료",
  cancelled: "취소됨",
};
