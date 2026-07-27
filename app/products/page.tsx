"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProductCard from "@/components/ProductCard";
import { ProductCategory, productCategoryLabel } from "@/lib/productCategory";

function isProductCategory(value: string): value is ProductCategory {
  return value in productCategoryLabel;
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={<main className="p-8 text-slate-500">불러오는 중...</main>}
    >
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const categoryParam = searchParams.get("category");
  const category =
    categoryParam && isProductCategory(categoryParam) ? categoryParam : undefined;

  const { results, status, loadMore } = usePaginatedQuery(
    api.products.list,
    category ? { category } : {},
    { initialNumItems: 12 },
  );

  const filtered = q
    ? results.filter((product) =>
        product.name.toLowerCase().includes(q.toLowerCase()),
      )
    : results;

  const heading = q
    ? `"${q}" 검색 결과`
    : category
      ? productCategoryLabel[category]
      : "전체 상품";

  return (
    <main className="section py-12 flex flex-col gap-8">
      <h1 className="text-3xl font-bold tracking-tight">{heading}</h1>

      {status === "LoadingFirstPage" ? (
        <p className="text-slate-500">불러오는 중...</p>
      ) : filtered.length === 0 ? (
        <p className="text-slate-500">
          {q ? "검색 결과가 없습니다." : "등록된 상품이 없습니다."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {filtered.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      )}

      {!q && status === "CanLoadMore" && (
        <button className="btn-secondary mx-auto" onClick={() => loadMore(12)}>
          더 보기
        </button>
      )}
      {status === "LoadingMore" && (
        <p className="mx-auto text-sm text-slate-500">불러오는 중...</p>
      )}
    </main>
  );
}
