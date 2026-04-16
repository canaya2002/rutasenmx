export {
  getBaseMetadata,
  buildPageMetadata,
  type PageMetadataOptions,
} from "./metadata";

export {
  getCanonicalUrl,
  cleanUrl,
  normalizeSlug,
  isCanonicalPath,
  TRACKING_PARAMS,
} from "./canonical";

export {
  getIndexationPolicy,
  getRobotsDirective,
  type IndexationPolicy,
} from "./robots";

export {
  buildBreadcrumbs,
  estadoBreadcrumbs,
  lugarBreadcrumbs,
  rutaBreadcrumbs,
  categoriaBreadcrumbs,
  type BreadcrumbItem,
} from "./breadcrumbs";

export {
  buildOrganizationSchema,
  buildWebSiteSchema,
  buildBreadcrumbSchema,
  buildPlaceSchema,
  buildMuseumSchema,
  buildArticleSchema,
  buildCollectionPageSchema,
  buildItemListSchema,
  buildRouteSchema,
  type PlaceSchemaInput,
  type MuseumSchemaInput,
  type ArticleSchemaInput,
  type CollectionItem,
  type ItemListEntry,
  type RouteSchemaInput,
} from "./schema";

export {
  getOgImageUrl,
  getDefaultOgImage,
  getPlaceOgImage,
  getEstadoOgImage,
  getRutaOgImage,
  getGuiaOgImage,
} from "./og";

export {
  buildSitemapEntries,
  getSitemapDefaults,
  SITEMAP_DEFAULTS,
  type SitemapEntry,
  type ChangeFreq,
} from "./sitemap";

export {
  getKeywordCluster,
  buildTitleFromKeywords,
  type KeywordCluster,
} from "./keywords";

export {
  PAGE_TYPES,
  MIN_RICHNESS_SCORE,
  calculateRichnessScore,
  shouldIndex,
} from "./indexation";

export {
  getKeywordOwner,
  detectCannibalization,
  type KeywordOwnership,
  type CannibalizationIssue,
} from "./cannibalization";
