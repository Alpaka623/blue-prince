import type { Finding } from "@/lib/types";

export function parseTagInput(value: string) {
  return Array.from(
    new Set(
      value
        .split(/[,;\n]/)
        .map((tag) => tag.trim())
        .filter(Boolean)
    )
  );
}

export function getExistingCategories(findings: Finding[]) {
  return Array.from(
    new Set(findings.map((finding) => finding.category).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b, "de"));
}

export function getExistingTags(findings: Finding[]) {
  return Array.from(
    new Set(
      findings.flatMap((finding) =>
        Array.isArray(finding.tags) ? finding.tags : []
      )
    )
  ).sort((a, b) => a.localeCompare(b, "de"));
}
