"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { SignInButton, UserButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";
import {
  ProductCategory,
  productCategories,
  productCategoryLabel,
} from "@/lib/productCategory";

const categoryNavLinks: { label: string; category?: ProductCategory }[] = [
  { label: "전체 상품" },
  ...productCategories.map((category) => ({
    label: productCategoryLabel[category],
    category,
  })),
];

function BoxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M20 20l-3.5-3.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CartIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 4h2l2.4 12.2a2 2 0 002 1.8h7.2a2 2 0 002-1.6L19 8H6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="20" r="1.3" fill="currentColor" />
      <circle cx="17" cy="20" r="1.3" fill="currentColor" />
    </svg>
  );
}

function HeaderShell({
  logo,
  children,
}: {
  logo: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-10 bg-background border-b border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-4 p-4 flex-wrap max-w-6xl mx-auto">
        {logo}
        {children}
      </div>
    </header>
  );
}

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-bold shrink-0">
      <BoxIcon className="h-6 w-6 text-indigo-600" />
      FullStackShop
    </Link>
  );
}

export default function SiteHeader() {
  return (
    <Suspense fallback={<HeaderShell logo={<Logo />} />}>
      <SiteHeaderContent />
    </Suspense>
  );
}

function SiteHeaderContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeCategory = searchParams.get("category");
  const [search, setSearch] = useState("");
  const { isLoading, isAuthenticated } = useStoreUserEffect();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");
  const cart = useQuery(api.cart.getMyCart, isAuthenticated ? {} : "skip");
  const isAdmin = me?.role === "admin";
  const cartCount = cart?.reduce((sum, item) => sum + item.quantity, 0) ?? 0;

  function handleSearchSubmit(e: FormEvent) {
    e.preventDefault();
    const q = search.trim();
    router.push(q ? `/products?q=${encodeURIComponent(q)}` : "/products");
  }

  return (
    <HeaderShell logo={<Logo />}>
      <nav className="flex items-center gap-1 flex-wrap text-sm">
        {categoryNavLinks.map((link) => {
          const href = link.category
            ? `/products?category=${link.category}`
            : "/products";
          const active =
            pathname === "/products" &&
            (link.category
              ? activeCategory === link.category
              : activeCategory === null);
          return (
            <Link
              key={link.label}
              href={href}
              className={`rounded-md px-2 py-1 transition-colors ${
                active
                  ? "bg-indigo-50 text-indigo-600 font-semibold dark:bg-indigo-950"
                  : "hover:text-indigo-600"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {isAuthenticated && (
          <Link
            href="/my/orders"
            className="rounded-md px-2 py-1 hover:text-indigo-600 transition-colors"
          >
            주문내역
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-md px-2 py-1 hover:text-indigo-600 transition-colors"
          >
            관리자
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3 ml-auto">
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
          <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상품 검색..."
            className="w-48 rounded-md border border-slate-200 dark:border-slate-800 bg-transparent pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </form>

        <Link href="/cart" className="relative" aria-label="장바구니">
          <CartIcon className="h-6 w-6" />
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
              {cartCount}
            </span>
          )}
        </Link>

        {!isLoading && (
          <>
            {isAuthenticated ? (
              <UserButton />
            ) : (
              <SignInButton mode="modal">
                <button className="bg-foreground text-background text-sm px-3 py-1.5 rounded-md">
                  로그인
                </button>
              </SignInButton>
            )}
          </>
        )}
      </div>
    </HeaderShell>
  );
}
