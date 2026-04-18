import Link from "next/link";
import { HeaderActions } from "./HeaderActions";
import { Logo } from "./Logo";
import { getTranslations } from "@/lib/i18n/server";

export async function Header() {
  const t = await getTranslations();

  const navLinks = [
    { href: "/explorar", label: t.common.explore },
    { href: "/rutas", label: t.common.routes },
    { href: "/pueblos-magicos", label: t.common.pueblosMagicos },
    { href: "/guias", label: t.common.guides },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-100 bg-white/80 backdrop-blur-lg supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo height={36} className="transition-opacity hover:opacity-85" />

        {/* Desktop navigation */}
        <nav className="hidden md:flex md:items-center md:gap-1" aria-label="Principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Client-side interactions: search, auth, mobile menu */}
        <HeaderActions />
      </div>
    </header>
  );
}
