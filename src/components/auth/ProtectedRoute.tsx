"use client";

import { SIDEBAR_LEAF_ITEMS } from "@/config/sidebarNavigation";
import { useAuth } from "@/context/AuthContext";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user, sidebarPermissions, permissionsLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const role = Number(user?.role || 3);
  const allowedPathsForRole3 = new Set(
    SIDEBAR_LEAF_ITEMS.filter((item) => sidebarPermissions.includes(item.key)).map((item) => item.path)
  );
  const isAllowedForRole3 = allowedPathsForRole3.has(pathname);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/signin");
      return;
    }

    if (!isLoading && isAuthenticated && role === 3 && !permissionsLoading && !isAllowedForRole3) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, permissionsLoading, role, isAllowedForRole3, router, pathname, sidebarPermissions]);

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

  if (role === 3 && permissionsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading permissions...</p>
        </div>
      </div>
    );
  }

  if (role === 3 && !isAllowedForRole3) {
    return null;
  }

  return <>{children}</>;
}
