import { isOAuthEnvConfigured } from "./auth-env";

describe("isOAuthEnvConfigured", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NEXTAUTH_SECRET;
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("returns false when required env vars are missing", () => {
    expect(isOAuthEnvConfigured()).toBe(false);
  });

  it("returns true when required env vars are present", () => {
    process.env.NEXTAUTH_SECRET = "test-secret";
    process.env.GOOGLE_CLIENT_ID = "test-client";
    process.env.GOOGLE_CLIENT_SECRET = "test-secret-client";

    expect(isOAuthEnvConfigured()).toBe(true);
  });
});
