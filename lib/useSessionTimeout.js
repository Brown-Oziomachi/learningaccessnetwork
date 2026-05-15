"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";   // ← Next.js, NOT react-router-dom
import { auth } from "@/lib/firebaseConfig";    // ← your existing firebase file

export function useSessionTimeout({
  isAuthenticated,
  timeoutMs = 1_800_000,
  redirectPath = "/auth/signin",   // ← matches YOUR sign-in route
  onTimeout,
  showToast,
} = {}) {
  const router   = useRouter();    // ← Next.js router
  const timerRef = useRef(null);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      localStorage.clear();
      sessionStorage.clear();

      if (typeof onTimeout === "function") onTimeout();

      const message =
        "Session expired due to inactivity. Please log in again to secure your account.";

      if (typeof showToast === "function") {
        showToast(message);
      } else {
        console.warn("[SessionTimeout]", message);
      }

      router.replace(redirectPath);   // ← Next.js uses router.replace(), not navigate()

    } catch (err) {
      console.error("[SessionTimeout] Error during logout:", err);
    }
  }, [router, redirectPath, onTimeout, showToast]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, timeoutMs);
  }, [logout, timeoutMs]);

  useEffect(() => {
    if (!isAuthenticated) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const EVENTS = ["mousemove", "click", "keypress", "scroll"];
    const opts   = { passive: true };

    resetTimer();
    EVENTS.forEach(e => window.addEventListener(e, resetTimer, opts));

    return () => {
      EVENTS.forEach(e => window.removeEventListener(e, resetTimer, opts));
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isAuthenticated, resetTimer]);
}