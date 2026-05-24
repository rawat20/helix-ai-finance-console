"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export function LoginPageClient({
  authConfigured,
  authError,
}: {
  authConfigured: boolean;
  authError?: string;
}) {
  const errorMessage = getAuthErrorMessage(authError);
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-slate-950 px-4">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-500 border-t-emerald-400" />
      </div>
    );
  }

  if (session) {
    return null;
  }

  return (
    <div className="min-h-[100dvh] bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center px-4 py-8 sm:px-6">
        {errorMessage ? (
          <div
            className="mb-6 rounded-xl border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-100"
            role="alert"
          >
            <p className="font-semibold text-red-50">Sign-in error</p>
            <p className="mt-2 text-red-100/90">{errorMessage}</p>
            {authError ? (
              <p className="mt-2 font-mono text-xs text-red-200/80">code: {authError}</p>
            ) : null}
          </div>
        ) : null}

        {!authConfigured ? (
          <div
            className="mb-6 rounded-xl border border-amber-500/40 bg-amber-950/40 p-4 text-sm text-amber-100"
            role="alert"
          >
            <p className="font-semibold text-amber-50">Google sign-in is not configured</p>
            <p className="mt-2 text-amber-100/90">
              Create{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">frontend/.env.local</code>{" "}
              (copy from{" "}
              <code className="rounded bg-black/30 px-1 py-0.5 text-xs">.env.example</code>) and
              set{" "}
              <code className="rounded bg-black/30 px-1 text-xs">NEXTAUTH_SECRET</code>,{" "}
              <code className="rounded bg-black/30 px-1 text-xs">NEXTAUTH_URL</code>,{" "}
              <code className="rounded bg-black/30 px-1 text-xs">GOOGLE_CLIENT_ID</code>, and{" "}
              <code className="rounded bg-black/30 px-1 text-xs">GOOGLE_CLIENT_SECRET</code>.
              Use redirect URI{" "}
              <code className="break-all rounded bg-black/30 px-1 text-xs">
                http://localhost:3000/api/auth/callback/google
              </code>{" "}
              in Google Cloud Console. Restart{" "}
              <code className="rounded bg-black/30 px-1 text-xs">npm run dev</code> after saving.
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm sm:p-8 md:p-10">
          <div className="mb-8 text-center">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-emerald-400/90">
              Helix Finance
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              Sign in
            </h1>
            <p className="mt-2 text-sm text-slate-400 sm:text-base">
              Use your Google account to sign in and access the application.
            </p>
          </div>

          <GoogleSignInButton disabled={!authConfigured} />

          <p className="mt-6 text-center text-xs leading-relaxed text-slate-500">
            By continuing, you agree to sign in with Google through this app. Configure
            OAuth credentials in Google Cloud Console to use this app.
          </p>
        </div>

        {/*  */}
      </div>
    </div>
  );
}
