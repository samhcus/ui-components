export type Book = {
  title: string;
  author: string;
  cover: string;
  status: "reading" | "finished";
  /** A few honest sentences on what the book is and why it's worth reading. */
  about: string;
  /** Where the Purchase button points — a real retailer link. */
  buyUrl: string;
};

/**
 * Amazon Associates tag. Empty = plain links (no commission). Drop your tag
 * here (e.g. "samhcus-20") and every Purchase button starts earning.
 */
export const AFFILIATE_TAG = "";

/** Final purchase URL for a book, with the affiliate tag appended when set. */
export function buyLink(book: Book): string {
  if (!AFFILIATE_TAG) return book.buyUrl;
  const sep = book.buyUrl.includes("?") ? "&" : "?";
  return `${book.buyUrl}${sep}tag=${AFFILIATE_TAG}`;
}

export const reading: Book[] = [
  {
    title: "World War Z",
    author: "Max Brooks",
    cover: "/reading/worldwarz-cover.jpg",
    status: "reading",
    about:
      "An oral history of the zombie war, told after the fact through dozens of survivor interviews spanning the globe. Brooks uses the outbreak as a lens on how governments, economies, and ordinary people actually behave under collapse: less a horror novel than a chillingly plausible geopolitical case study.",
    buyUrl: "https://www.amazon.com/s?k=World+War+Z+Max+Brooks",
  },
  {
    title: "AI Snake Oil",
    author: "Arvind Narayanan & Sayash Kapoor",
    cover: "/reading/aisnakeoil.png",
    status: "reading",
    about:
      "Two Princeton researchers separate the AI that works from the AI that doesn't. They're sharpest on predictive AI sold to schools, courts, and employers (where it quietly fails) while giving a clear-eyed account of what generative AI genuinely can and can't do. A practical inoculation against the hype.",
    buyUrl: "https://www.amazon.com/s?k=AI+Snake+Oil+Narayanan+Kapoor",
  },
];
