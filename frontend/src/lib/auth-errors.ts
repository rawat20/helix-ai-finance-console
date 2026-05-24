/** User-facing messages for NextAuth `?error=` query values. */
export function getAuthErrorMessage(error: string | undefined): string | null {
  if (!error) return null;
  const messages: Record<string, string> = {
    google:
      "Google sign-in failed. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local, restart the dev server, and confirm the redirect URI in Google Cloud Console.",
    OAuthSignin:
      "Could not start sign-in. Verify OAuth credentials and NEXTAUTH_URL=http://localhost:3000.",
    OAuthCallback:
      "Google returned an error. Confirm the redirect URI matches http://localhost:3000/api/auth/callback/google exactly.",
    OAuthCreateAccount: "Could not create your account.",
    EmailCreateAccount: "Could not create your account.",
    Callback: "Sign-in callback failed. Check NEXTAUTH_SECRET is a real generated value (quoted in .env.local).",
    OAuthAccountNotLinked:
      "This email is already linked to another sign-in method.",
    SessionRequired: "Please sign in to continue.",
    Default: "Sign-in failed. Try again or check the server terminal for errors.",
  };
  return messages[error] ?? messages.Default;
}
