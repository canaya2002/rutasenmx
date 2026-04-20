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
    { href: "/conectar", label: t.common.conectar, highlight: true },
  ];

  return (
    <header className="pointer-events-none sticky top-0 z-40 w-full">
      <div className="pointer-events-auto mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo height={36} className="drop-shadow-lg transition-opacity hover:opacity-85" />

        {/* Desktop navigation — dark glassmorphic pills */}
        <nav className="hidden md:flex md:items-center md:gap-2" aria-label="Principal">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                link.highlight
                  ? "inline-flex items-center gap-1 rounded-full border border-emerald-400/60 bg-emerald-500/90 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-emerald-500/30 backdrop-blur-xl transition-all hover:bg-emerald-400 hover:shadow-emerald-400/40"
                  : "rounded-full border border-white/15 bg-black/50 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-black/20 backdrop-blur-xl transition-all hover:border-[#06C167]/60 hover:bg-[#06C167]/30 hover:shadow-[#06C167]/15"
              }
            >
              {link.highlight && <span aria-hidden>♥</span>}
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
