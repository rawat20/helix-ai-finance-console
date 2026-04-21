import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const monorepoRoot = path.join(frontendDir, "..");

const nextConfig: NextConfig = {
  /** Stabilize tracing + silence “multiple lockfiles” when repo root has another package-lock. */
  outputFileTracingRoot: monorepoRoot,
};

export default nextConfig;
