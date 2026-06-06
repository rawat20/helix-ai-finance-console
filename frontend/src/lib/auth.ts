import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const secret = process.env.NEXTAUTH_SECRET;
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

if (process.env.NODE_ENV !== "production" && secret && secret.length < 32) {
  console.warn(
    "[auth] NEXTAUTH_SECRET looks too short. Run: openssl rand -base64 32 and paste the output in .env.local (quoted)."
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      try {
        if (new URL(url).origin === baseUrl) return url;
      } catch {
        return baseUrl;
      }
      return baseUrl;
    },
    async jwt({ token, account }) {
      if (account?.id_token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ credential: account.id_token }),
          });
          if (res.ok) {
            const data = (await res.json()) as { token?: string };
            if (data.token) {
              token.helixToken = data.token;
            }
          }
        } catch (err) {
          console.error("[auth] Failed to exchange Google token for Helix JWT:", err);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.helixToken) {
        session.helixToken = token.helixToken as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
