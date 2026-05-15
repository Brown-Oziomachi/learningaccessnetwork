"use client";

import { useSessionTimeout } from "@/lib/useSessionTimeout";


export function SessionTimeoutProvider({
  isAuthenticated,
  timeoutMs = 1_800_000,
  redirectPath = "/auth/signin",
  onTimeout,
  showToast,
  children,
}) {
  useSessionTimeout({ isAuthenticated, timeoutMs, redirectPath, onTimeout, showToast });
  return <>{children}</>;
}