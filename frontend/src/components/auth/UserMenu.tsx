"use client";

import { signOut, useSession } from "next-auth/react";

export function UserMenu() {
  const { data } = useSession();

  async function handleSignOut() {
    await signOut({ redirect: false });
    // Full navigation clears React state and reduces bfcache showing a stale dashboard after logout.
    window.location.replace("/login");
  }

  return (
    <div className="flex w-full min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
      {data?.user?.email ? (
        <span
          className="max-w-[min(100%,14rem)] truncate text-xs text-slate-400 sm:max-w-[16rem]"
          title={data.user.email}
        >
          {data.user.email}
        </span>
      ) : null}
      <button
        type="button"
        onClick={() => void handleSignOut()}
        className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-xs text-slate-300 transition hover:border-white/30 hover:text-white"
      >
        Sign out
      </button>
    </div>
  );
}
