/**
 * Helper untuk menyingkat nama tamu:
 * 1. Awalan Muhammad / Mohammad otomatis disingkat menjadi "M."
 *    (misal: "Muhammad Dzikri Fauzan" -> "M. Dzikri Fauzan")
 * 2. Jika nama memiliki lebih dari 2 kata, kata ke-3 dan seterusnya
 *    otomatis disingkat (misal: "Breza Artha Medico" -> "Breza Artha M.")
 */
export const formatGuestName = (rawName) => {
  if (!rawName) return "Tamu Undangan";
  const trimmed = rawName.trim();
  if (!trimmed) return "Tamu Undangan";

  const words = trimmed.split(/\s+/);
  if (words.length === 0) return "Tamu Undangan";

  // Cek apakah kata pertama adalah variasi dari Muhammad / Mohammad
  const muhammadRegex = /^(muhammad|mohammad|muhamad|mohamad|mochammad|mochamad|muh\.?|moh\.?)$/i;
  const startsWithMuhammad = muhammadRegex.test(words[0]);

  if (startsWithMuhammad && words.length > 1) {
    const remainingWords = words.slice(1);
    if (remainingWords.length <= 2) {
      return `M. ${remainingWords.join(" ")}`.trim();
    }
    const firstTwo = remainingWords.slice(0, 2).join(" ");
    const abbreviated = remainingWords
      .slice(2)
      .map((w) => {
        const clean = w.replace(/[^a-zA-Z0-9]/g, "");
        return clean ? `${clean.charAt(0).toUpperCase()}.` : "";
      })
      .filter(Boolean)
      .join(" ");
    return `M. ${firstTwo} ${abbreviated}`.trim();
  }

  // Aturan standar: jika lebih dari 2 kata, kata ke-3 dan seterusnya disingkat
  if (words.length <= 2) return trimmed;

  const firstTwo = words.slice(0, 2).join(" ");
  const abbreviated = words
    .slice(2)
    .map((w) => {
      const clean = w.replace(/[^a-zA-Z0-9]/g, "");
      return clean ? `${clean.charAt(0).toUpperCase()}.` : "";
    })
    .filter(Boolean)
    .join(" ");

  return `${firstTwo} ${abbreviated}`.trim();
};
