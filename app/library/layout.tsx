import { LibraryNavigation } from "@/components/library/navigation";
import "./library.css";

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return <div data-library><a className="library-skip" href="#library-content">Skip to content</a><LibraryNavigation /><div id="library-content">{children}</div><footer className="library-footer"><span>Made by <a href="https://samhc.us">Samuel</a>.</span><span>React · Tailwind CSS · Source included</span><a href="/r/registry.json">Registry ↗</a></footer></div>;
}
