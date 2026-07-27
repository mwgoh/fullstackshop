"use client";

import { ReactNode } from "react";
import { useQuery } from "convex/react";
import { SignInButton } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useStoreUserEffect } from "@/hooks/useStoreUserEffect";

// Wraps an /admin page: requires sign-in, then requires users.role === "admin"
// before rendering children. This is a UX convenience only — the real
// authorization boundary is requireAdmin/requireAdminQuery on the server.
export default function AdminGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useStoreUserEffect();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");

  if (isLoading) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (!isAuthenticated) {
    return (
      <main className="p-8 flex flex-col gap-4 items-start">
        <p>관리자 페이지는 로그인이 필요합니다.</p>
        <SignInButton mode="modal">
          <button className="bg-foreground text-background px-4 py-2 rounded-md">
            로그인
          </button>
        </SignInButton>
      </main>
    );
  }

  if (me === undefined) {
    return <main className="p-8 text-slate-500">불러오는 중...</main>;
  }

  if (me === null || me.role !== "admin") {
    return <main className="p-8 text-slate-500">관리자 권한이 없습니다.</main>;
  }

  return <>{children}</>;
}
