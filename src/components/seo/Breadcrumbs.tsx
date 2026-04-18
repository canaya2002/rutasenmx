import type { BreadcrumbItem } from "@/lib/seo/breadcrumbs";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";
import { JsonLd } from "./JsonLd";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * SEO-only Breadcrumbs: emits BreadcrumbList structured data for search
 * engines but renders no visible UI. Visible "Home / …" breadcrumbs were
 * removed from the product design — schema is preserved so Google can still
 * surface the hierarchy in rich results.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;
  const schema = buildBreadcrumbSchema(items);
  return <JsonLd data={schema} />;
}
