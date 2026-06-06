import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    helixToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    helixToken?: string;
  }
}
