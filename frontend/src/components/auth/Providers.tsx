"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";

function HelixTokenSync() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "authenticated" && session?.helixToken) {
      localStorage.setItem("helix_token", session.helixToken);
    } else if (status === "unauthenticated") {
      localStorage.removeItem("helix_token");
    }
  }, [session?.helixToken, status]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <HelixTokenSync />
      {children}
    </SessionProvider>
  );
}
