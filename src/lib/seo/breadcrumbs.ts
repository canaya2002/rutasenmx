/**
 * A single breadcrumb item with a label and an href.
 */
export interface BreadcrumbItem {
  label: string;
  href: string;
}

const HOME_ITEM: BreadcrumbItem = { label: "Inicio", href: "/" };

/**
 * Builds a breadcrumb trail from an array of items, ensuring
 * the trail always starts with the Home item.
 */
export function buildBreadcrumbs(items: BreadcrumbItem[]): BreadcrumbItem[] {
  if (items.length === 0) {
    return [HOME_ITEM];
  }

  // If the first item is already Home, use items as-is
  if (items[0].href === "/") {
    return items;
  }

  return [HOME_ITEM, ...items];
}

/**
 * Breadcrumbs for a state (estado) page.
 * Inicio > Estados > {estadoName}
 */
export function estadoBreadcrumbs(
  estadoName: string,
  estadoSlug: string
): BreadcrumbItem[] {
  return buildBreadcrumbs([
    { label: "Estados", href: "/estados" },
    { label: estadoName, href: `/estados/${estadoSlug}` },
  ]);
}

/**
 * Breadcrumbs for a place (lugar) page.
 * Inicio > {categoryName} > {estadoName} > {lugarName}
 */
export function lugarBreadcrumbs(
  lugarName: string,
  lugarSlug: string,
  categoryName: string,
  categorySlug: string,
  estadoName: string,
  estadoSlug: string
): BreadcrumbItem[] {
  return buildBreadcrumbs([
    { label: categoryName, href: `/${categorySlug}` },
    {
      label: estadoName,
      href: `/estados/${estadoSlug}/${categorySlug}`,
    },
    { label: lugarName, href: `/lugares/${lugarSlug}` },
  ]);
}

/**
 * Breadcrumbs for a route (ruta) page.
 * Inicio > Rutas > {rutaName}
 */
export function rutaBreadcrumbs(
  rutaName: string,
  rutaSlug: string
): BreadcrumbItem[] {
  return buildBreadcrumbs([
    { label: "Rutas", href: "/rutas" },
    { label: rutaName, href: `/rutas/${rutaSlug}` },
  ]);
}

/**
 * Breadcrumbs for a category page, optionally scoped to a state.
 * Inicio > {categoryName}
 * Inicio > {estadoName} > {categoryName}
 */
export function categoriaBreadcrumbs(
  categoryName: string,
  categorySlug: string,
  estadoName?: string,
  estadoSlug?: string
): BreadcrumbItem[] {
  if (estadoName && estadoSlug) {
    return buildBreadcrumbs([
      { label: "Estados", href: "/estados" },
      { label: estadoName, href: `/estados/${estadoSlug}` },
      {
        label: categoryName,
        href: `/estados/${estadoSlug}/${categorySlug}`,
      },
    ]);
  }

  return buildBreadcrumbs([
    { label: categoryName, href: `/${categorySlug}` },
  ]);
}
