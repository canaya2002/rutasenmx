import Link from "next/link";
import type { BreadcrumbItem } from "@/lib/seo/breadcrumbs";
import { buildBreadcrumbSchema } from "@/lib/seo/schema";
import { JsonLd } from "./JsonLd";

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/**
 * Server component that renders an accessible breadcrumb navigation
 * with JSON-LD structured data for search engines.
 */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  const schema = buildBreadcrumbSchema(items);

  return (
    <>
      <JsonLd data={schema} />
      <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
        <ol className="flex flex-wrap items-center gap-1">
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return (
              <li key={item.href} className="flex items-center gap-1">
                {index > 0 && (
                  <span aria-hidden="true" className="text-gray-400">
                    /
                  </span>
                )}
                {isLast ? (
                  <span aria-current="page" className="text-gray-900 font-medium">
                    {item.label}
                  </span>
                ) : (
                  <Link
                    href={item.href}
                    className="hover:text-gray-900 hover:underline transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
