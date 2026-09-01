"use client";

import {
  useEffect,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  useAuth,
} from "@/lib/auth/AuthProvider";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({
  children,
}: AdminLayoutProps) {
  const router =
    useRouter();

  const {
    user,
    profile,
    loading,
    profileLoading,
  } = useAuth();

  const checking =
    loading ||
    profileLoading;

  useEffect(() => {
    if (checking) {
      return;
    }

    if (!user) {
      router.replace("/");
      return;
    }

    if (profile?.role !== "admin") {
      router.replace("/");
    }
  }, [
    checking,
    user,
    profile,
    router,
  ]);

  if (checking) {
    return (
      <main className="min-h-screen w-full bg-[#0b1016] text-white">
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="text-center">
            <div className="text-sm font-medium text-white/80">
              Проверяем доступ...
            </div>

            <div className="mt-2 text-xs text-white/35">
              Загрузка административной панели
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (
    !user ||
    profile?.role !== "admin"
  ) {
    return null;
  }

  return (
    <main className="min-h-screen w-full bg-[#0b1016] text-white">
      {children}
    </main>
  );
}
