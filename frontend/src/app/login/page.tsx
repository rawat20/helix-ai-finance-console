import { LoginPageClient } from "./LoginPageClient";
import { isOAuthEnvConfigured } from "@/lib/auth-env";

export default function LoginPage() {
  const authConfigured = isOAuthEnvConfigured();
  return <LoginPageClient authConfigured={authConfigured} />;
}
