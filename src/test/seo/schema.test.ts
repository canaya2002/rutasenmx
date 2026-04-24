import { describe, it, expect } from 'vitest';
import {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBreadcrumbSchema,
  buildPlaceSchema,
  buildMuseumSchema,
  buildArticleSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
} from '@/lib/seo/schema';

const SITE_URL = 'https://rutasenmx.com';

// ---------------------------------------------------------------------------
// Helper: verify common schema fields
// ---------------------------------------------------------------------------

function expectSchemaBase(schema: Record<string, unknown>) {
  expect(schema['@context']).toBe('https://schema.org');
  expect(schema['@type']).toBeTruthy();
}

// ---------------------------------------------------------------------------
// Organization
// ---------------------------------------------------------------------------

describe('buildOrganizationSchema', () => {
  const schema = buildOrganizationSchema();

  it('has @context and @type', () => {
    expectSchemaBase(schema);
    expect(schema['@type']).toBe('Organization');
  });

  it('has required fields', () => {
    expect(schema.name).toBeTruthy();
    expect(schema.url).toBe(SITE_URL);
    expect(schema.logo).toBeTruthy();
  });

  it('has contactPoint', () => {
    expect(schema.contactPoint).toBeDefined();
    const raw = schema.contactPoint;
    const cp = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>;
    expect(cp['@type']).toBe('ContactPoint');
  });
});

// ---------------------------------------------------------------------------
// WebSite
// ---------------------------------------------------------------------------

describe('buildWebSiteSchema', () => {
  const schema = buildWebSiteSchema();

  it('has @context and @type', () => {
    expectSchemaBase(schema);
    expect(schema['@type']).toBe('WebSite');
  });

  it('has required fields', () => {
    expect(schema.name).toBeTruthy();
    expect(schema.url).toBe(SITE_URL);
    // inLanguage may be a single string or an array of BCP-47 tags.
    const lang = schema.inLanguage;
    const langs = Array.isArray(lang) ? (lang as string[]) : [lang as string];
    expect(langs.some((l) => l === 'es' || l.startsWith('es-'))).toBe(true);
  });

  it('includes SearchAction potentialAction', () => {
    expect(schema.potentialAction).toBeDefined();
    const raw = schema.potentialAction;
    const action = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown>;
    expect(action['@type']).toBe('SearchAction');
    expect(action['query-input']).toContain('search_term_string');
  });
});

// ---------------------------------------------------------------------------
// BreadcrumbList
// ---------------------------------------------------------------------------

describe('buildBreadcrumbSchema', () => {
  const items = [
    { label: 'Inicio', href: '/' },
    { label: 'Estados', href: '/estados' },
    { label: 'Oaxaca', href: '/estados/oaxaca' },
  ];
  const schema = buildBreadcrumbSchema(items);

  it('has @context and @type', () => {
    expectSchemaBase(schema);
    expect(schema['@type']).toBe('BreadcrumbList');
  });

  it('has correct structure', () => {
    const elements = schema.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(3);
  });

  it('each item has position, name, and item URL', () => {
    const elements = schema.itemListElement as Array<Record<string, unknown>>;
    elements.forEach((el, i) => {
      expect(el['@type']).toBe('ListItem');
      expect(el.position).toBe(i + 1);
      expect(el.name).toBe(items[i].label);
      expect(el.item).toBe(`${SITE_URL}${items[i].href}`);
    });
  });
});

// ---------------------------------------------------------------------------
// Place
// ---------------------------------------------------------------------------

describe('buildPlaceSchema', () => {
  it('has @context and @type', () => {
    const schema = buildPlaceSchema({
      name: 'Teotihuacan',
      slug: 'teotihuacan',
      description: 'Zona arqueologica',
    });
    expectSchemaBase(schema);
    expect(schema['@type']).toBe('TouristAttraction');
  });

  it('includes geo data when provided', () => {
    const schema = buildPlaceSchema({
      name: 'Teotihuacan',
      slug: 'teotihuacan',
      description: 'Zona arqueologica',
      latitude: 19.6925,
      longitude: -98.8438,
    });
    expect(schema.geo).toBeDefined();
    const geo = schema.geo as Record<string, unknown>;
    expect(geo['@type']).toBe('GeoCoordinates');
    expect(geo.latitude).toBe(19.6925);
    expect(geo.longitude).toBe(-98.8438);
  });

  it('omits geo data when not provided', () => {
    const schema = buildPlaceSchema({
      name: 'Test Place',
      slug: 'test-place',
      description: 'A test place',
    });
    expect(schema.geo).toBeUndefined();
  });

  it('includes address when provided', () => {
    const schema = buildPlaceSchema({
      name: 'Test',
      slug: 'test',
      description: 'Test',
      estado: 'Oaxaca',
      municipio: 'Oaxaca de Juarez',
    });
    const address = schema.address as Record<string, unknown>;
    expect(address['@type']).toBe('PostalAddress');
    expect(address.addressRegion).toBe('Oaxaca');
    expect(address.addressCountry).toBe('MX');
  });

  it('includes aggregate rating when provided', () => {
    const schema = buildPlaceSchema({
      name: 'Test',
      slug: 'test',
      description: 'Test',
      rating: 4.5,
      reviewCount: 120,
    });
    const rating = schema.aggregateRating as Record<string, unknown>;
    expect(rating['@type']).toBe('AggregateRating');
    expect(rating.ratingValue).toBe(4.5);
    expect(rating.reviewCount).toBe(120);
  });

  it('generates correct URL', () => {
    const schema = buildPlaceSchema({
      name: 'Test',
      slug: 'my-place',
      description: 'Test',
    });
    expect(schema.url).toBe(`${SITE_URL}/lugares/my-place`);
  });
});

// ---------------------------------------------------------------------------
// Museum
// ---------------------------------------------------------------------------

describe('buildMuseumSchema', () => {
  it('extends Place with Museum type', () => {
    const schema = buildMuseumSchema({
      name: 'Museo Nacional',
      slug: 'museo-nacional',
      description: 'Gran museo',
    });
    expectSchemaBase(schema);
    expect(schema['@type']).toBe('Museum');
  });

  it('includes opening hours when provided', () => {
    const schema = buildMuseumSchema({
      name: 'Museo Nacional',
      slug: 'museo-nacional',
      description: 'Gran museo',
      openingHours: 'Mo-Su 09:00-17:00',
    });
    expect(schema.openingHours).toBe('Mo-Su 09:00-17:00');
  });

  it('includes telephone when provided', () => {
    const schema = buildMuseumSchema({
      name: 'Museo Nacional',
      slug: 'museo-nacional',
      description: 'Gran museo',
      telephone: '+52 55 5553 6266',
    });
    expect(schema.telephone).toBe('+52 55 5553 6266');
  });

  it('retains geo data from base Place', () => {
    const schema = buildMuseumSchema({
      name: 'Museo',
      slug: 'museo',
      description: 'Test',
      latitude: 19.4260,
      longitude: -99.1861,
    });
    expect(schema.geo).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Article
// ---------------------------------------------------------------------------

describe('buildArticleSchema', () => {
  const schema = buildArticleSchema({
    title: 'Guia de viaje a Yucatan',
    slug: 'yucatan',
    description: 'Todo sobre Yucatan',
    datePublished: '2025-01-15',
  });

  it('has @context and @type', () => {
    expectSchemaBase(schema);
    expect(schema['@type']).toBe('Article');
  });

  it('has required fields', () => {
    expect(schema.headline).toBe('Guia de viaje a Yucatan');
    expect(schema.description).toBe('Todo sobre Yucatan');
    expect(schema.datePublished).toBe('2025-01-15');
    expect(schema.url).toBe(`${SITE_URL}/guias/yucatan`);
  });

  it('has author and publisher', () => {
    expect(schema.author).toBeDefined();
    expect(schema.publisher).toBeDefined();
    const publisher = schema.publisher as Record<string, unknown>;
    // Publisher may be a full Organization node or an @id reference to one.
    const hasType = publisher['@type'] === 'Organization';
    const hasRef =
      typeof publisher['@id'] === 'string' &&
      (publisher['@id'] as string).includes('#organization');
    expect(hasType || hasRef).toBe(true);
  });

  it('uses datePublished as dateModified fallback', () => {
    expect(schema.dateModified).toBe('2025-01-15');
  });

  it('uses provided dateModified when given', () => {
    const s = buildArticleSchema({
      title: 'Test',
      slug: 'test',
      description: 'Test',
      datePublished: '2025-01-15',
      dateModified: '2025-06-01',
    });
    expect(s.dateModified).toBe('2025-06-01');
  });

  it('has language set to a Spanish BCP-47 tag', () => {
    const lang = schema.inLanguage as string;
    expect(typeof lang).toBe('string');
    expect(lang === 'es' || lang.startsWith('es-')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// CollectionPage
// ---------------------------------------------------------------------------

describe('buildCollectionPageSchema', () => {
  const items = [
    { name: 'Item 1', url: `${SITE_URL}/lugares/item-1` },
    { name: 'Item 2', url: `${SITE_URL}/lugares/item-2` },
  ];
  const schema = buildCollectionPageSchema('My Collection', 'A collection', items);

  it('has @context and @type', () => {
    expectSchemaBase(schema);
    expect(schema['@type']).toBe('CollectionPage');
  });

  it('is valid structure', () => {
    expect(schema.name).toBe('My Collection');
    expect(schema.description).toBe('A collection');
    const mainEntity = schema.mainEntity as Record<string, unknown>;
    expect(mainEntity['@type']).toBe('ItemList');
    expect(mainEntity.numberOfItems).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// ItemList
// ---------------------------------------------------------------------------

describe('buildItemListSchema', () => {
  const items = [
    { name: 'Place A', url: `${SITE_URL}/lugares/a` },
    { name: 'Place B', url: `${SITE_URL}/lugares/b` },
    { name: 'Place C', url: `${SITE_URL}/lugares/c` },
  ];
  const schema = buildItemListSchema(items);

  it('has @context and @type', () => {
    expectSchemaBase(schema);
    expect(schema['@type']).toBe('ItemList');
  });

  it('has correct structure', () => {
    expect(schema.numberOfItems).toBe(3);
    const elements = schema.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(3);
    expect(elements[0].position).toBe(1);
    expect(elements[0].name).toBe('Place A');
  });
});

// ---------------------------------------------------------------------------
// Cross-schema: all have @context and @type
// ---------------------------------------------------------------------------

describe('all schemas have @context and @type', () => {
  const schemas = [
    buildOrganizationSchema(),
    buildWebSiteSchema(),
    buildBreadcrumbSchema([{ label: 'Home', href: '/' }]),
    buildPlaceSchema({ name: 'X', slug: 'x', description: 'X' }),
    buildMuseumSchema({ name: 'X', slug: 'x', description: 'X' }),
    buildArticleSchema({ title: 'X', slug: 'x', description: 'X', datePublished: '2025-01-01' }),
    buildCollectionPageSchema('X', 'X', []),
    buildItemListSchema([]),
  ];

  schemas.forEach((schema, i) => {
    it(`schema ${i} has @context`, () => {
      expect(schema['@context']).toBe('https://schema.org');
    });

    it(`schema ${i} has @type`, () => {
      expect(schema['@type']).toBeTruthy();
    });
  });
});
