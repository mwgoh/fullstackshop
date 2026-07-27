"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AdminGate from "@/components/AdminGate";

const navItems = [
  { label: "대시보드", href: "/admin" },
  { label: "상품 관리", href: "/admin/products" },
  { label: "주문 관리", href: "/admin/orders" },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGate>
      <AdminShell>{children}</AdminShell>
    </AdminGate>
  );
}

function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex flex-1">
      <aside className="w-48 shrink-0 border-r border-slate-200 dark:border-slate-800 p-4">
        <nav className="flex flex-col gap-1 text-sm">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-md px-3 py-2 transition-colors ${
                  active
                    ? "bg-indigo-600 text-white"
                    : "hover:bg-slate-100 dark:hover:bg-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
