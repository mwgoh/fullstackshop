"use client";

import Link from "next/link";
import { usePaginatedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProductCard from "@/components/ProductCard";
import { ProductCategory, productCategoryLabel } from "@/lib/productCategory";

const categories: { category: ProductCategory; description: string }[] = [
  { category: "home_living", description: "인테리어와 생활용품" },
  { category: "books", description: "책과 문구" },
  { category: "fashion", description: "의류와 잡화" },
  { category: "electronics", description: "가전과 디지털 기기" },
];

function CategoryIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
      <path
        d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M4 7.5L12 12l8-4.5M12 12v9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const { results: featuredProducts, status } = usePaginatedQuery(
    api.products.list,
    {},
    { initialNumItems: 3 },
  );

  return (
    <main className="flex flex-col">
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-700 text-white text-center py-28 px-6">
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-violet-400/20 blur-3xl" />
        <div className="relative flex flex-col items-center gap-6">
          <span className="badge bg-white/15 text-white backdrop-blur-sm">
            NEW SEASON
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-2xl text-balance">
            FullStackShop에 오신 것을 환영합니다
          </h1>
          <p className="text-indigo-100 text-lg max-w-md text-balance">
            합리적인 가격으로 다양한 상품을 만나보세요
          </p>
          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/products"
              className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all duration-200 bg-white text-indigo-600 px-7 py-3.5 hover:bg-indigo-50 active:scale-[0.98]"
            >
              쇼핑하러 가기 →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 max-w-6xl mx-auto w-full">
        <h2 className="text-3xl font-bold text-center mb-12 tracking-tight">
          카테고리별 쇼핑
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map(({ category, description }) => (
            <Link
              key={category}
              href={`/products?category=${category}`}
              className="card card-hover flex flex-col items-center gap-3 p-8 text-center"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-600/30">
                <CategoryIcon />
              </span>
              <span className="font-semibold">
                {productCategoryLabel[category]}
              </span>
              <span className="text-xs text-slate-500">{description}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-slate-50 dark:bg-slate-950/50 py-20 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <h2 className="text-3xl font-bold text-center mb-2 tracking-tight">
            인기 상품
          </h2>
          <p className="text-center text-slate-500 mb-12">
            지금 가장 많이 찾는 상품을 확인해보세요
          </p>

          {status === "LoadingFirstPage" ? (
            <p className="text-center text-slate-500">불러오는 중...</p>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-slate-500">
              등록된 상품이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
              {featuredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
