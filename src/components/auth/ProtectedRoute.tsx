"use client";

import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const role = Number(user?.role || 3);
  const role3AllowedPrefixes = ["/", "/profile", "/calendar"];
  const isAllowedForRole3 = role3AllowedPrefixes.some((prefix) => {
    if (prefix === "/") return pathname === "/";
    return pathname === prefix || pathname.startsWith(`${prefix}/`);
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }

    if (!isLoading && isAuthenticated && role === 3 && !isAllowedForRole3) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, role, isAllowedForRole3, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (role === 3 && !isAllowedForRole3) {
    return null;
  }

  return <>{children}</>;
}
