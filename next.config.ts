import path from "node:path";

import type { NextConfig } from "next";

/**
 * Pins the workspace root to this repository. Without it Next walks up to the
 * user's home directory (which holds an unrelated lockfile) and infers the
 * wrong tracing root.
 */
const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
};

export default nextConfig;
