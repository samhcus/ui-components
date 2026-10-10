import type { Metadata } from "next";
import type { CSSProperties } from "react";
import { Inter, Geist_Mono, Nunito, Space_Grotesk, Instrument_Serif, Lora, Fraunces, Bricolage_Grotesque, Space_Mono, Playfair_Display, DM_Sans, Sora, IBM_Plex_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { IgGradientDefs } from "@/components/brand/ig-gradient";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// Chopsticks' rounded, friendly face — used only inside its brand panel
const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  display: "swap",
});

// Extra faces for the font switcher only. preload:false so they cost nothing
// until a visitor actually cycles to them.
const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
  preload: false,
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// A soft, expressive old-style serif.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// A characterful modern grotesque / display sans.
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// A retro fixed-width face — a distinct counterpoint to the clean Geist Mono.
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
  preload: false,
});

// A high-contrast display serif.
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// A clean low-contrast geometric sans.
const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// A modern geometric sans with squared terminals.
const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

// A crisp third monospace, distinct from Geist and Space Mono.
const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  preload: false,
});

// A refined reading serif built for text.
const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ui.samhc.us"),
  title: {
    default: "Samuel’s UI Library",
    template: "%s",
  },
  description:
    "Open-source UI components, interaction patterns, and complete examples by Samuel.",
  openGraph: {
    title: "Samuel’s UI Library",
    description: "Open-source UI components, interaction patterns, and complete examples by Samuel.",
    type: "website",
    siteName: "Samuel’s UI Library",
    url: "https://ui.samhc.us",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} ${nunito.variable} ${spaceGrotesk.variable} ${instrumentSerif.variable} ${lora.variable} ${fraunces.variable} ${bricolage.variable} ${spaceMono.variable} ${playfair.variable} ${dmSans.variable} ${sora.variable} ${ibmPlexMono.variable} ${newsreader.variable} antialiased`}
      // A copy of Inter the font switcher never touches, so .mh-base subtrees
      // (the components panel) stay on Inter no matter the site-wide font.
      style={{ "--font-inter-locked": inter.style.fontFamily } as CSSProperties}
      suppressHydrationWarning
    >
      <body className="min-h-[100dvh] text-foreground">
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <IgGradientDefs />
            <div id="ui-library-root">{children}</div>
            <Toaster position="top-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
