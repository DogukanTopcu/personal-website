const TURKISH: Record<string, string> = {
  ğ: "g",
  Ğ: "g",
  ü: "u",
  Ü: "u",
  ş: "s",
  Ş: "s",
  ı: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ç: "c",
  Ç: "c",
};

const TURKISH_PATTERN = /[ğĞüÜşŞıİöÖçÇ]/g;

/** "Doğukan'ın İlk Yazısı" becomes "dogukanin-ilk-yazisi". Output is a-z, 0-9 and hyphens. */
export function slugify(input: string): string {
  return input
    .replace(TURKISH_PATTERN, (char) => TURKISH[char] ?? char)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96)
    .replace(/-+$/g, "");
}

/** What the user may type into a slug field, before the final trim on save. */
export function sanitizeSlugInput(input: string): string {
  return input
    .replace(TURKISH_PATTERN, (char) => TURKISH[char] ?? char)
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "");
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
