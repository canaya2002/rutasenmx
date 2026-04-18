import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Logo } from "./Logo";
import { getLocale, getTranslations } from "@/lib/i18n/server";

export async function Footer() {
  const currentYear = new Date().getFullYear();
  const locale = await getLocale();
  const t = await getTranslations();
  const isEn = locale === 'en';

  const brandDescription = isEn
    ? 'Discover authentic Mexico. Plan routes, explore Pueblos Magicos and live unique experiences in every corner of the country.'
    : 'Descubre Mexico autentico. Planea rutas, explora Pueblos Magicos y vive experiencias unicas en cada rincon del pais.';

  const footerSections = [
    {
      title: t.footer.discover,
      links: [
        { label: t.common.pueblosMagicos, href: "/pueblos-magicos" },
        { label: t.common.museums, href: "/museos" },
        { label: t.common.archaeologicalZones, href: "/zonas-arqueologicas" },
        { label: t.common.routes, href: "/rutas" },
        { label: t.common.states, href: "/estados" },
      ],
    },
    {
      title: t.footer.plan,
      links: [
        { label: isEn ? 'Plan route' : 'Planear ruta', href: "/planear" },
        { label: "Autopilot IA", href: "/autopilot" },
        { label: isEn ? 'Explore map' : 'Explorar mapa', href: "/explorar" },
        { label: t.common.myTrips, href: "/mis-viajes" },
        { label: t.common.pricing, href: "/precios" },
      ],
    },
    {
      title: t.footer.company,
      links: [
        { label: t.common.about, href: "/acerca-de" },
        { label: isEn ? 'Data sources' : 'Fuentes de datos', href: "/fuentes-de-datos" },
        { label: isEn ? 'Methodology' : 'Metodologia', href: "/metodologia" },
        { label: t.common.contact, href: "/contacto" },
        { label: t.common.guides, href: "/guias" },
        { label: t.common.collections, href: "/colecciones" },
      ],
    },
    {
      title: t.footer.legal,
      links: [
        { label: t.common.privacy, href: "/privacidad" },
        { label: t.common.terms, href: "/terminos" },
        { label: isEn ? 'Editorial policy' : 'Politica editorial', href: "/politica-editorial" },
        { label: isEn ? 'Corrections' : 'Correcciones', href: "/correcciones" },
      ],
    },
  ];

  return (
    <footer className="border-t border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Top section: logo + columns */}
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2">
            <Logo height={48} />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              {brandDescription}
            </p>

            {/* Social links placeholder */}
            <div className="mt-4 flex items-center gap-3">
              {["Twitter", "Instagram", "Facebook", "YouTube"].map((name) => (
                <a
                  key={name}
                  href="#"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-terracotta/10 hover:text-terracotta"
                  aria-label={name}
                >
                  <span className="text-xs font-bold">
                    {name.charAt(0)}
                  </span>
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-foreground">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-terracotta"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <Separator className="my-8" />

        {/* Bottom bar */}
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            &copy; {currentYear} Rutas en MX. {t.footer.allRights}
          </p>
          <p className="text-xs text-muted-foreground">
            {t.footer.madeWith}
          </p>
        </div>
      </div>
    </footer>
  );
}
