import { LoginPageClient } from "./LoginPageClient";
import { isOAuthEnvConfigured } from "@/lib/auth-env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const authConfigured = isOAuthEnvConfigured();
  const { error } = await searchParams;
  return <LoginPageClient authConfigured={authConfigured} authError={error} />;
}
