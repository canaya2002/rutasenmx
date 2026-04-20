"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNav } from "./MobileNav";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useTranslation } from "@/components/providers/LocaleProvider";

export function HeaderActions() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const t = useTranslation();

  return (
    <div className="flex items-center gap-2">
      {/* Search button — scrolls to hero search */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden rounded-full bg-black/50 text-white shadow-lg shadow-black/20 backdrop-blur-xl hover:bg-black/60 hover:text-white sm:inline-flex"
        aria-label={t.common.search}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
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
    </div>
  );
}
