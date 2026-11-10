import { normalizeText } from "@/domain/lib/text";

/**
 * Builds a URL/file-safe slug: "Piura / Norte" -> "piura-norte".
 */
export function slugify(value: string): string {
  return normalizeText(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
