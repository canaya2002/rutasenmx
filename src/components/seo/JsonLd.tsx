/**
 * Server component that safely renders JSON-LD structured data into one or
 * more <script> tags for search engine consumption.
 *
 * — Supports either a single object or an array of objects (rendered as one
 *   <script> per object for cleaner SERPs).
 * — Escapes `</` sequences so the payload cannot accidentally break out of
 *   the <script> context (XSS-safe even with untrusted input).
 */
function safeStringify(payload: unknown): string {
  return JSON.stringify(payload).replace(/</g, '\\u003c');
}

export function JsonLd({
  data,
}: {
  data: Record<string, unknown> | Array<Record<string, unknown>>;
}) {
  if (Array.isArray(data)) {
    return (
      <>
        {data.map((entry, i) => (
          <script
            key={i}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: safeStringify(entry) }}
          />
        ))}
      </>
    );
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeStringify(data) }}
    />
  );
}
