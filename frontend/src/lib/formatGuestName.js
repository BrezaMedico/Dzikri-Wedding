/**
 * Helper pemformat nama tamu undangan:
 * 1. Nama TIDAK disingkat sama sekali meskipun terdiri dari lebih dari 3 kata
 *    (contoh: "Breza Artha Medico" tetap "Breza Artha Medico").
 * 2. Hanya kata yang mengandung variasi "Muhammad" yang disingkat menjadi "M."
 *    (contoh: "Muhammad Dzikri Fauzan" -> "M. Dzikri Fauzan",
 *             "Rizky Mohammad Pratama" -> "Rizky M. Pratama").
 */
export const formatGuestName = (rawName) => {
  if (!rawName) return "Tamu Undangan";
  const trimmed = rawName.trim();
  if (!trimmed) return "Tamu Undangan";

  const words = trimmed.split(/\s+/);
  if (words.length === 0) return "Tamu Undangan";

  // Regex mendeteksi variasi kata Muhammad/Mohammad/Mochammad/dsb
  const muhammadRegex = /^(muhammad|mohammad|muhamad|mohamad|mochammad|mochamad|muh\.?|moh\.?|moch\.?)$/i;

  const formattedWords = words.map((word) => {
    // Pisahkan kata dari tanda baca trailing seperti koma (contoh: "Muhammad," -> "M.,")
    const match = word.match(/^([a-zA-Z.]+)(.*)$/);
    if (match) {
      const cleanWord = match[1];
      const punctuation = match[2];
      if (muhammadRegex.test(cleanWord)) {
        return `M.${punctuation}`;
      }
    } else if (muhammadRegex.test(word)) {
      return "M.";
    }
    return word;
  });

  return formattedWords.join(" ").trim();
};
