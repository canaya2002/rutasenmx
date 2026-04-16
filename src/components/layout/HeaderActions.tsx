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
      {/* Search placeholder button (desktop) */}
      <Button
        variant="ghost"
        size="icon"
        className="hidden sm:inline-flex"
        aria-label={t.common.search}
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Language switcher */}
      <LanguageSwitcher />

      {/* Auth buttons (desktop) */}
      <div className="hidden md:flex md:items-center md:gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/iniciar-sesion">{t.common.login}</Link>
        </Button>
        <Button size="sm" asChild>
          <Link href="/registrarse">{t.common.register}</Link>
        </Button>
      </div>

      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
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
