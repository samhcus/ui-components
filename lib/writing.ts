/**
 * Writing — the blog. A post is one entry in the `posts` array below.
 * Everything here is free, in full. No gates, no price.
 *
 * Kinds:
 *   • "note"  — text. Plain paragraphs in `body: [...]`, or a rich body
 *               component wired by slug in app/writing/[slug]/page.tsx.
 *   • "photo" — an image with a caption. Set `cover`, caption in `summary`.
 *   • "guide" — a longer read. Same as a note, just labelled as a guide.
 *
 * To post: copy an entry, give it a unique `slug`, done. Newest first.
 */
export type PostKind = "note" | "photo" | "guide";

export type WritingPost = {
  slug: string;
  title: string;
  kind: PostKind;
  /** Feed blurb for a note/guide; the caption for a photo. */
  summary: string;
  /** ISO date (yyyy-mm-dd). Optional — shown when present. */
  date?: string;
  /** Image for a photo post (also used as the feed thumbnail if set). */
  cover?: string;
  /** note body — plain paragraphs. Rich posts render a component by slug instead. */
  body?: string[];
};

export const posts: WritingPost[] = [
  {
    slug: "human-in-the-loop",
    title: "Human in the loop",
    kind: "note",
    date: "2026-07-16",
    summary:
      "Why I still write everything from scratch. I use AI for almost everything, and that is exactly why my writing stays fully human, raw, and true to my voice.",
  },
  {
    slug: "chi-chi-woto-woto",
    title: "Chi-chi & Woto-woto",
    kind: "note",
    date: "2026-07-12",
    summary:
      "A small photo and video diary of Chi-chi and Woto-woto.",
  },
];

export function getPost(slug: string): WritingPost | undefined {
  return posts.find((p) => p.slug === slug);
}

export const KIND_LABEL: Record<PostKind, string> = {
  note: "Note",
  photo: "Photo",
  guide: "Guide",
};

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-07-13" -> "Jul 13, 2026". Parsed by hand from the ISO parts so the day
 * never shifts with the server/build timezone (which `new Date(iso)` would do).
 */
export function formatDate(iso?: string): string | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
