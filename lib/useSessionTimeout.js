"use client";

import { useEffect, useRef, useCallback } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";   
import { auth } from "@/lib/firebaseConfig";    
export function useSessionTimeout({
  isAuthenticated,
  timeoutMs = 1_800_000,
  redirectPath = "/signin",   
  onTimeout,
  showToast,
} = {}) {
  const router   = useRouter();    
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

      router.replace(redirectPath);   
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