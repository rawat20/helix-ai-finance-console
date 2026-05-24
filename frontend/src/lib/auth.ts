import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const secret = process.env.NEXTAUTH_SECRET;
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
  },
  secret: process.env.NEXTAUTH_SECRET,
};
