import Link from "next/link";

export default function AdminDashboardPage() {
  return (
    <main className="p-8 flex flex-col gap-6 max-w-3xl">
      <h1 className="text-3xl font-bold tracking-tight">관리자 대시보드</h1>
      <p className="text-slate-500 text-sm">
        왼쪽 메뉴에서 상품과 주문을 관리할 수 있습니다.
      </p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/admin/products"
          className="card card-hover flex flex-col gap-1 p-5"
        >
          <span className="font-semibold">상품 관리</span>
          <span className="text-sm text-slate-500">
            상품 등록, 가격/재고 수정, 판매 상태 변경
          </span>
        </Link>
        <Link
          href="/admin/orders"
          className="card card-hover flex flex-col gap-1 p-5"
        >
          <span className="font-semibold">주문 관리</span>
          <span className="text-sm text-slate-500">
            전체 주문 목록 확인 및 상태 변경
          </span>
        </Link>
      </div>
    </main>
  );
}
