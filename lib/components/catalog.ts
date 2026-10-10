export type ComponentCategory =
  | "Buttons"
  | "Toggles"
  | "Inputs"
  | "Cards"
  | "Overlays"
  | "Text"
  | "Icons"
  | "Wordmarks"
  | "Cursors"
  | "Effects"
  | "Media"
  | "Sound";

export interface CatalogItem {
  /** Registry name — also the JSON file at /r/<slug>.json. */
  slug: string;
  name: string;
  tagline: string;
  category: ComponentCategory;
  /** Free-form tags for search + filter chips. Lowercase, singular-ish. */
  tags: string[];
  /** npm dependencies the component pulls in (shown on the card). */
  dependencies: string[];
  /** Marks the flagship component that gets the full-width hero at the top of
   *  the gallery (a larger live stage + install), above the category grid. */
  featured?: boolean;
}

/** Order here is the order shown within each category. */
export const catalog: CatalogItem[] = [
  // ── Buttons ────────────────────────────────────────────────────────────
  {
    slug: "button",
    name: "Button",
    tagline: "Six variants and five sizes.",
    category: "Buttons",
    tags: ["button", "action", "base-ui"],
    dependencies: ["@base-ui/react", "class-variance-authority"],
  },
  {
    slug: "pulsating-button",
    name: "Pulsating Button",
    tagline: "Button with pulse and ripple states.",
    category: "Buttons",
    tags: ["button", "animation", "pulse"],
    dependencies: [],
  },
  {
    slug: "magnetic-button",
    name: "Magnetic Button",
    tagline: "Follows the pointer and springs back on leave.",
    category: "Buttons",
    tags: ["button", "physics", "hover"],
    dependencies: ["motion"],
  },
  {
    slug: "shimmer-button",
    name: "Shimmer Button",
    tagline: "Button with an animated border and hover highlight.",
    category: "Buttons",
    tags: ["button", "animation", "shimmer"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "rage-button",
    name: "Rage Button",
    tagline: "Button that emits particles on press.",
    category: "Buttons",
    tags: ["button", "physics", "particles"],
    dependencies: ["motion"],
  },
  {
    slug: "confetti-button",
    name: "Confetti Button",
    tagline: "Emits a physics-based confetti spray from the click point.",
    category: "Buttons",
    tags: ["button", "confetti", "physics"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "purchase-button",
    name: "Purchase Button",
    tagline: "Purchase action with cart icon and pressed spring.",
    category: "Buttons",
    tags: ["button", "commerce", "cta"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "coffee-button",
    name: "Coffee Button",
    tagline: "Frosted-glass support button for image backgrounds.",
    category: "Buttons",
    tags: ["button", "glass", "overlay"],
    dependencies: ["lucide-react"],
  },
  {
    slug: "read-more-button",
    name: "Read More Button",
    tagline: "Pill link with an opening book icon on hover.",
    category: "Buttons",
    tags: ["button", "link", "icon"],
    dependencies: ["@phosphor-icons/react"],
  },
  {
    slug: "push-button",
    name: "Push Button",
    tagline: "Round button with a pressed depth state.",
    category: "Buttons",
    tags: ["button", "tactile", "press"],
    dependencies: [],
  },
  {
    slug: "social-buttons",
    name: "Social Buttons",
    tagline: "Social buttons that reveal brand colors on hover.",
    category: "Buttons",
    tags: ["button", "social", "icon"],
    dependencies: [],
  },

  // ── Toggles ────────────────────────────────────────────────────────────
  {
    slug: "pill-toggle",
    name: "Pill Toggle",
    tagline: "Two-position light and dark theme toggle.",
    category: "Toggles",
    tags: ["toggle", "theme", "switch"],
    dependencies: ["next-themes", "lucide-react"],
  },
  {
    slug: "ship-toggle",
    name: "Ship Toggle",
    tagline: "Draft-to-shipped switch with a spring transition.",
    category: "Toggles",
    tags: ["toggle", "switch", "animation"],
    dependencies: ["motion"],
  },
  {
    slug: "segmented-control",
    name: "Segmented Control",
    tagline: "Segmented control with a sliding pill thumb.",
    category: "Toggles",
    tags: ["toggle", "segmented", "switch"],
    dependencies: ["motion"],
  },
  {
    slug: "animated-theme-toggler",
    name: "Animated Theme Toggler",
    tagline: "Theme switch with a button-origin wipe.",
    category: "Toggles",
    tags: ["toggle", "theme", "dark-mode"],
    dependencies: ["@phosphor-icons/react"],
  },

  // ── Inputs ─────────────────────────────────────────────────────────────
  {
    slug: "input",
    name: "Input",
    tagline: "Text field with focus and invalid states.",
    category: "Inputs",
    tags: ["input", "form", "field"],
    dependencies: ["@base-ui/react"],
  },
  {
    slug: "slider",
    name: "Slider",
    tagline: "Controlled range slider with square thumb.",
    category: "Inputs",
    tags: ["slider", "range", "input"],
    dependencies: ["@base-ui/react"],
  },
  {
    slug: "hue-slider",
    name: "Hue Slider",
    tagline: "Color slider with a live hue swatch.",
    category: "Inputs",
    tags: ["input", "color", "slider"],
    dependencies: [],
  },

  // ── Cards ──────────────────────────────────────────────────────────────
  {
    slug: "spotlight-card",
    name: "Spotlight Card",
    tagline: "Card with a cursor-tracking highlight.",
    category: "Cards",
    tags: ["card", "spotlight", "hover"],
    dependencies: ["motion"],
  },
  {
    slug: "tilt-card",
    name: "Tilt Card",
    tagline: "3D tilt card with pointer glare.",
    category: "Cards",
    tags: ["card", "3d", "tilt"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "snap-back-card",
    name: "Snap-back Card",
    tagline: "Draggable content that springs back to its start.",
    category: "Cards",
    tags: ["card", "drag", "physics"],
    dependencies: ["motion"],
  },
  {
    slug: "css-box",
    name: "CSS Box",
    tagline: "Draggable 3D cube built with CSS.",
    category: "Cards",
    tags: ["card", "3d", "cube"],
    dependencies: ["motion"],
  },
  {
    slug: "book-cover",
    name: "Book Cover",
    tagline: "Cover that opens into a detail card.",
    category: "Cards",
    tags: ["card", "book", "overlay"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "free-tag",
    name: "Free Tag",
    tagline: "Hang tag that follows the cursor and springs back.",
    category: "Cards",
    tags: ["card", "drag", "physics"],
    dependencies: [],
  },
  {
    slug: "wordmark-panel",
    name: "Wordmark Panel",
    tagline: "Panel with a pixel wordmark heading.",
    category: "Cards",
    tags: ["card", "wordmark", "panel"],
    dependencies: [],
  },

  // ── Overlays ───────────────────────────────────────────────────────────
  {
    slug: "dynamic-toolbar",
    name: "Dynamic Island Toolbar",
    tagline: "Toolbar for drawing, color, effects, and typography.",
    category: "Overlays",
    tags: ["toolbar", "island", "overlay", "motion"],
    dependencies: ["Next.js", "motion", "next-themes", "@phosphor-icons/react", "@base-ui/react", "sonner"],
    featured: true,
  },
  {
    slug: "morphing-dialog",
    name: "Morphing Dialog",
    tagline: "Dialog that expands from its trigger.",
    category: "Overlays",
    tags: ["dialog", "overlay", "morph"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "tooltip",
    name: "Tooltip",
    tagline: "Portalled tooltip that avoids clipping.",
    category: "Overlays",
    tags: ["tooltip", "overlay", "hint"],
    dependencies: ["@base-ui/react"],
  },
  {
    slug: "toaster",
    name: "Toaster",
    tagline: "Status toasts with themed icons.",
    category: "Overlays",
    tags: ["toast", "notification", "sonner"],
    dependencies: ["sonner", "next-themes", "lucide-react"],
  },
  {
    slug: "memoji-widget",
    name: "Memoji Widget",
    tagline: "Draggable avatar that opens an intro panel.",
    category: "Overlays",
    tags: ["widget", "overlay", "avatar"],
    dependencies: ["motion", "@phosphor-icons/react"],
  },
  {
    slug: "samuel-widget",
    name: "Samuel Widget",
    tagline: "Draggable widget with profile, time, weather, globe, and video.",
    category: "Overlays",
    tags: ["widget", "chat", "avatar"],
    dependencies: ["motion", "@phosphor-icons/react"],
  },
  {
    slug: "weather-stack",
    name: "Weather Stack",
    tagline: "Frosted weather and local-time widget with city search.",
    category: "Overlays",
    tags: ["widget", "weather", "overlay"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "weather-scene",
    name: "Weather Scene",
    tagline: "Weather widget over a looping image or GIF.",
    category: "Overlays",
    tags: ["widget", "weather", "image"],
    dependencies: ["motion", "lucide-react"],
  },

  // ── Text ───────────────────────────────────────────────────────────────
  {
    slug: "typewriter",
    name: "Typewriter",
    tagline: "Looping typewriter with configurable strings, speed, and cursor.",
    category: "Text",
    tags: ["text", "typing", "animation"],
    dependencies: ["motion"],
  },
  {
    slug: "animated-counter",
    name: "Animated Counter",
    tagline: "Spring-based rolling counter.",
    category: "Text",
    tags: ["number", "counter", "animation"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "prose-kit",
    name: "Prose Kit",
    tagline: "Rich text and media placeholders for post content.",
    category: "Text",
    tags: ["prose", "text", "inline"],
    dependencies: [],
  },
  {
    slug: "hand-write",
    name: "Handwriting",
    tagline: "Animated handwriting with an erasing pass.",
    category: "Text",
    tags: ["text", "handwriting", "svg"],
    dependencies: ["@phosphor-icons/react"],
  },

  // ── Icons ──────────────────────────────────────────────────────────────
  {
    slug: "wok-logo",
    name: "Wok Logo",
    tagline: "Wok mark with animated steam.",
    category: "Icons",
    tags: ["icon", "logo", "svg"],
    dependencies: [],
  },
  {
    slug: "cat-mark",
    name: "Cat Mark",
    tagline: "Cat silhouette that inherits text color.",
    category: "Icons",
    tags: ["icon", "logo", "svg"],
    dependencies: [],
  },
  {
    slug: "spinning-globe",
    name: "Spinning Globe",
    tagline: "Line globe with scrolling meridians.",
    category: "Icons",
    tags: ["icon", "globe", "animation"],
    dependencies: ["motion"],
  },
  {
    slug: "flags",
    name: "Flags",
    tagline: "Stacked flags that fan out on hover.",
    category: "Icons",
    tags: ["icon", "flag", "svg"],
    dependencies: [],
  },

  // ── Wordmarks ──────────────────────────────────────────────────────────
  {
    slug: "samuel-wordmark",
    name: "Samuel Wordmark",
    tagline: "Editorial serif wordmark.",
    category: "Wordmarks",
    tags: ["wordmark", "type", "serif"],
    dependencies: [],
  },
  {
    slug: "writing-wordmark",
    name: "Writing Wordmark",
    tagline: "Handwritten signature wordmark.",
    category: "Wordmarks",
    tags: ["wordmark", "type", "handwriting"],
    dependencies: [],
  },
  {
    slug: "chopsticks-wordmark",
    name: "Chopsticks Wordmark",
    tagline: "Rounded bot wordmark with badge.",
    category: "Wordmarks",
    tags: ["wordmark", "brand"],
    dependencies: [],
  },
  {
    slug: "sandbox-wordmark",
    name: "Sandbox Wordmark",
    tagline: "Glossy primary-color wordmark with tilt and shadow.",
    category: "Wordmarks",
    tags: ["wordmark", "brand"],
    dependencies: [],
  },
  {
    slug: "components-wordmark",
    name: "Components Wordmark",
    tagline: "Product wordmark with eyebrow and accent token.",
    category: "Wordmarks",
    tags: ["wordmark", "type", "brand"],
    dependencies: [],
  },
  {
    slug: "just-for-fun-wordmark",
    name: "Just For Fun Wordmark",
    tagline: "Friendly wordmark with underline detail.",
    category: "Wordmarks",
    tags: ["wordmark", "brand"],
    dependencies: [],
  },
  {
    slug: "pixel-wordmark",
    name: "Pixel Wordmark",
    tagline: "Pixel wordmark with cycling letter colors.",
    category: "Wordmarks",
    tags: ["wordmark", "pixel", "brand"],
    dependencies: [],
  },
  {
    slug: "samuel-ui-wordmark",
    name: "UI Components Wordmark",
    tagline: "Nunito wordmark with a blue UI chip.",
    category: "Wordmarks",
    tags: ["wordmark", "type", "brand"],
    dependencies: [],
  },
  {
    slug: "design-wordmark",
    name: "Design Wordmark",
    tagline: "Design wordmark with a rainbow underline.",
    category: "Wordmarks",
    tags: ["wordmark", "type", "animation"],
    dependencies: [],
  },
  {
    slug: "ig-gradient",
    name: "Instagram Gradient",
    tagline: "Reusable Instagram gradient SVG definitions.",
    category: "Wordmarks",
    tags: ["gradient", "svg", "brand"],
    dependencies: [],
  },

  // ── Cursors ────────────────────────────────────────────────────────────
  {
    slug: "site-cursor",
    name: "Site Cursor",
    tagline: "Follower cursor that expands a label over interactive elements.",
    category: "Cursors",
    tags: ["cursor", "pointer", "follower"],
    dependencies: ["motion", "lucide-react"],
  },
  {
    slug: "cursor",
    name: "Cursor",
    tagline: "Follower cursor that trails the pointer.",
    category: "Cursors",
    tags: ["cursor", "pointer", "follower"],
    dependencies: ["motion"],
  },
  {
    slug: "cat-cursor",
    name: "Cat Cursor",
    tagline: "Pixel cat cursor that follows the pointer.",
    category: "Cursors",
    tags: ["cursor", "pixel", "cat"],
    dependencies: ["motion"],
  },

  // ── Effects ────────────────────────────────────────────────────────────
  {
    slug: "aurora",
    name: "Aurora",
    tagline: "Slow-moving color ribbons behind content.",
    category: "Effects",
    tags: ["effect", "background", "animation"],
    dependencies: ["motion"],
  },
  {
    slug: "wave-fill",
    name: "Wave Fill",
    tagline: "Animated water fill with two parallax crests.",
    category: "Effects",
    tags: ["effect", "water", "animation"],
    dependencies: ["motion"],
  },
  {
    slug: "bubble-field",
    name: "Bubble Field",
    tagline: "Looping bubbles that rise and wobble.",
    category: "Effects",
    tags: ["effect", "bubbles", "animation"],
    dependencies: ["motion"],
  },
  {
    slug: "background-effects",
    name: "Background Effects",
    tagline: "Canvas background engine with eight effects.",
    category: "Effects",
    tags: ["effect", "canvas", "ambient"],
    dependencies: [],
  },
  {
    slug: "dither-image",
    name: "Dither Image",
    tagline: "Bayer dither effect for images.",
    category: "Effects",
    tags: ["effect", "dither", "canvas"],
    dependencies: [],
  },
  {
    slug: "qp-dither",
    name: "Qp Dither",
    tagline: "Bayer dither animation for a logo mark.",
    category: "Effects",
    tags: ["effect", "dither", "pixel"],
    dependencies: [],
  },
  {
    slug: "canvas-reveal-effect",
    name: "Canvas Reveal Effect",
    tagline: "Dot-matrix reveal on a WebGL canvas.",
    category: "Effects",
    tags: ["effect", "webgl", "shader"],
    dependencies: ["three", "@react-three/fiber"],
  },
  {
    slug: "reveal",
    name: "Reveal",
    tagline: "Scroll and mount fade-up wrapper with staggered delay.",
    category: "Effects",
    tags: ["animation", "scroll", "motion"],
    dependencies: ["motion"],
  },
  {
    slug: "agent-roster",
    name: "Agent Roster",
    tagline: "Marquee of pixel avatars.",
    category: "Effects",
    tags: ["marquee", "avatars", "animation"],
    dependencies: ["motion", "lucide-react"],
  },

  // ── Media ──────────────────────────────────────────────────────────────
  {
    slug: "reading-gif-panel",
    name: "Reading GIF Panel",
    tagline: "Train GIF panel with social buttons and book covers.",
    category: "Media",
    tags: ["reading", "gif", "social", "book", "glass"],
    dependencies: ["motion", "@phosphor-icons/react", "@base-ui/react"],
  },
  {
    slug: "video-player",
    name: "Video Player",
    tagline: "Custom controls over a native video player.",
    category: "Media",
    tags: ["video", "media", "player"],
    dependencies: ["@phosphor-icons/react"],
  },
  {
    slug: "globe-3d",
    name: "3D Globe",
    tagline: "Draggable WebGL globe with location pins.",
    category: "Media",
    tags: ["globe", "webgl", "3d"],
    dependencies: ["three", "@react-three/fiber", "@react-three/drei"],
  },

  // ── Sound ──────────────────────────────────────────────────────────────
  {
    slug: "web-haptics-demo",
    name: "Web Haptics",
    tagline: "Web Audio feedback pack with optional haptic pulses.",
    category: "Sound",
    tags: ["sound", "audio", "haptics"],
    dependencies: [],
  },
];

export const CATEGORY_ORDER: ComponentCategory[] = [
  "Buttons",
  "Toggles",
  "Inputs",
  "Cards",
  "Overlays",
  "Text",
  "Icons",
  "Wordmarks",
  "Cursors",
  "Effects",
  "Media",
  "Sound",
];
