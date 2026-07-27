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
      <section className="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-center py-20 px-6">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          FullStackShop에 오신 것을 환영합니다
        </h1>
        <p className="text-indigo-100 mb-8">
          합리적인 가격으로 다양한 상품을 만나보세요
        </p>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 bg-white text-indigo-600 font-semibold px-6 py-3 rounded-md hover:bg-indigo-50 transition-colors"
        >
          쇼핑하러 가기 →
        </Link>
      </section>

      <section className="py-16 px-6 max-w-6xl mx-auto w-full">
        <h2 className="text-2xl font-bold text-center mb-10">카테고리별 쇼핑</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {categories.map(({ category, description }) => (
            <Link
              key={category}
              href={`/products?category=${category}`}
              className="flex flex-col items-center gap-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-6 text-center hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-950">
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

      <section className="bg-slate-50 dark:bg-slate-950 py-16 px-6">
        <div className="max-w-6xl mx-auto w-full">
          <h2 className="text-2xl font-bold text-center mb-2">인기 상품</h2>
          <p className="text-center text-slate-500 mb-10">
            지금 가장 많이 찾는 상품을 확인해보세요
          </p>

          {status === "LoadingFirstPage" ? (
            <p className="text-center text-slate-500">불러오는 중...</p>
          ) : featuredProducts.length === 0 ? (
            <p className="text-center text-slate-500">
              등록된 상품이 없습니다.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
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
