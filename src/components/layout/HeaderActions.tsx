"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./MobileNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { GlobalSearchOverlay } from "./GlobalSearchOverlay";
import { useTranslation } from "@/components/providers/LocaleProvider";

export function HeaderActions() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const t = useTranslation();

  // Global keyboard shortcut: ⌘K / Ctrl+K opens the search overlay.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex items-center gap-2">
      {/* Search button — opens the global search overlay */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-black/50 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-black/60 hover:text-white"
        aria-label={t.common.search}
        onClick={() => setSearchOpen(true)}
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Language switcher */}
      <LanguageSwitcher />

      {/* Auth buttons (desktop) */}
      <div className="hidden md:flex md:items-center md:gap-2">
        <Button variant="ghost" size="sm" className="rounded-full bg-black/50 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-black/60 hover:text-white" asChild>
          <Link href="/iniciar-sesion">{t.common.login}</Link>
        </Button>
        <Button size="sm" className="rounded-full bg-[#06C167] text-white shadow-lg shadow-black/20 hover:bg-[#05a558]" asChild>
          <Link href="/registrarse">{t.common.register}</Link>
        </Button>
      </div>

      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="rounded-full bg-black/50 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-black/60 hover:text-white md:hidden"
        aria-label={t.common.search}
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile navigation drawer */}
      <MobileNav open={mobileOpen} onOpenChange={setMobileOpen} />

      {/* Global search overlay */}
      <GlobalSearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
