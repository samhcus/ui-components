"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Moon, Sun, ArrowUpRight } from "lucide-react";

export function LibraryNavigation() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  return <header className="library-header">
    <Link href="/" className="library-logo" aria-label="Samuel’s UI Library home">Samuel’s <span>ui</span></Link>
    <nav aria-label="Library navigation">
      {[{ href: "/", name: "Components", active: pathname === "/" || pathname === "/library" }, { href: "/assets", name: "Assets", active: pathname === "/assets" || pathname === "/library/assets" }, { href: "/notes", name: "UX", active: pathname === "/notes" || pathname === "/library/notes" }].map(link => <Link key={link.name} href={link.href} aria-current={link.active ? "page" : undefined}>{link.name}</Link>)}
    </nav>
    <div className="library-header-actions"><a href="https://samhc.us">Samuel <ArrowUpRight size={13} /></a><button type="button" aria-label="Toggle library theme" onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}><Sun size={16} className="dark:hidden" /><Moon size={16} className="hidden dark:block" /></button></div>
  </header>;
}
