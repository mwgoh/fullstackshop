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
    <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b border-slate-200/70 dark:border-slate-800/70">
      <div className="flex items-center gap-4 p-4 flex-wrap max-w-6xl mx-auto">
        {logo}
        {children}
      </div>
    </header>
  );
}

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-bold text-lg tracking-tight shrink-0"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-600/30">
        <BoxIcon className="h-4 w-4" />
      </span>
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
              className={`rounded-full px-3 py-1.5 font-medium transition-colors ${
                active
                  ? "bg-indigo-600 text-white shadow-sm shadow-indigo-600/30"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          );
        })}
        {isAuthenticated && (
          <Link
            href="/my/orders"
            className="rounded-full px-3 py-1.5 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-foreground transition-colors"
          >
            주문내역
          </Link>
        )}
        {isAdmin && (
          <Link
            href="/admin"
            className="rounded-full px-3 py-1.5 font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-foreground transition-colors"
          >
            관리자
          </Link>
        )}
      </nav>

      <div className="flex items-center gap-3 ml-auto">
        <form onSubmit={handleSearchSubmit} className="relative hidden sm:block">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="상품 검색..."
            className="w-48 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 pl-9 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-colors"
          />
        </form>

        <Link
          href="/cart"
          className="relative rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          aria-label="장바구니"
        >
          <CartIcon className="h-5 w-5" />
          {cartCount > 0 && (
            <span className="absolute top-0 right-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 px-1 text-[10px] font-bold text-white">
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
                <button className="btn-primary btn-sm">로그인</button>
              </SignInButton>
            )}
          </>
        )}
      </div>
    </HeaderShell>
  );
}
