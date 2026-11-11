/**
 * Controls visibility of local demo shortcuts, QA injection bars, and role switchers.
 * Explicit `NEXT_PUBLIC_ENABLE_DEMO_TOOLS` ("true" | "false") takes precedence;
 * otherwise enabled in development/test and hidden in production builds.
 */
export function isDemoToolsEnabled(): boolean {
  const explicit = process.env.NEXT_PUBLIC_ENABLE_DEMO_TOOLS;
  if (explicit === "true") {
    return true;
  }
  if (explicit === "false") {
    return false;
  }
  return process.env.NODE_ENV !== "production";
}
