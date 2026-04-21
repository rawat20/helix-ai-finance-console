/**
 * Server-only: whether NextAuth + Google OAuth env is present (no secrets exposed to client).
 */
export function isOAuthEnvConfigured(): boolean {
  return Boolean(
    process.env.NEXTAUTH_SECRET &&
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET
  );
}
