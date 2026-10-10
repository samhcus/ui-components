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
      "An oral history of the zombie war, told after the fact through dozens of survivor interviews spanning the globe. Brooks uses the outbreak as a lens on how governments, economies, and ordinary people actually behave under collapse: less a horror novel than a chillingly plausible geopolitical case study. Politics in the zombie apocalypse. Love it.",
    buyUrl: "https://www.amazon.com/s?k=World+War+Z+Max+Brooks",
  },
];
