"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { Toaster, toast } from "react-hot-toast";
import { SessionTimeoutProvider } from "./SessionTimeoutProvider";
import { auth } from "@/lib/firebaseConfig";

export default function ClientProviders({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setReady(true);
    });
    return () => unsub();
  }, []);

  // Don't render children until Firebase has resolved auth state
  if (!ready) return null;

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          error: {
            duration: 6000,
            style: {
              background: "#0d2244",
              color: "#fff",
              border: "1px solid rgba(184,150,62,0.4)",
              fontFamily: "'Lato', sans-serif",
              fontSize: "13px",
            },
          },
        }}
      />

      <SessionTimeoutProvider
        isAuthenticated={!!currentUser}
        redirectPath="/auth/signin"
        timeoutMs={1_800_000}
        showToast={(msg) => toast.error(msg)}
      >
        {children}
      </SessionTimeoutProvider>
    </>
  );
}