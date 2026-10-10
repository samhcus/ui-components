export type Agent = {
  name: string;
  gif: string;
  /** Roster color, from the github.com/samhcus profile README badges. */
  color: string;
  /** Readable text color on top of `color`. */
  fg: string;
  /** Transparent pixels below the character's feet in the 92px source frame.
   *  Used to sit every pal's FEET on the conveyor belt (heads stay uneven). */
  foot: number;
  /** Transparent pixels above the character's head in the 92px source frame.
   *  Used to float each name tag just above its own head. */
  head: number;
  /** Per-sprite scale tweak (1 = default). */
  scale?: number;
};

export const agents: Agent[] = [
  { name: "Hank", gif: "/agents/hank.gif", color: "#FFD700", fg: "#111111", foot: 13, head: 12 },
  { name: "Nqita", gif: "/agents/nqita.gif", color: "#FF69B4", fg: "#111111", foot: 9, head: 13 },
  { name: "Cypork", gif: "/agents/cypork.gif", color: "#FFC0CB", fg: "#111111", foot: 14, head: 13 },
  { name: "Dublo", gif: "/agents/dublo.gif", color: "#808080", fg: "#FFFFFF", foot: 13, head: 16 },
  { name: "Knut", gif: "/agents/knut.gif", color: "#5B8DB8", fg: "#FFFFFF", foot: 5, head: 16 },
  { name: "Justin", gif: "/agents/justin.gif", color: "#E63946", fg: "#FFFFFF", foot: 1, head: 11, scale: 0.85 },
  { name: "Yahm", gif: "/agents/yahm.gif", color: "#2D2D2D", fg: "#FFFFFF", foot: 20, head: 9 },
];
