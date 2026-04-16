// ---------------------------------------------------------------------------
// State photo mapping — maps state slugs to real photos in /public
// ---------------------------------------------------------------------------

export interface StateImageSet {
  hero: string;       // Main/cover image
  gallery: string[];  // All images for the state
}

/** Map state slug to images available in /public/<FolderName>/ */
export const STATE_IMAGES: Record<string, StateImageSet> = {
  'baja-california': {
    hero: '/BajaCalifornia/Mar.jpg',
    gallery: [
      '/BajaCalifornia/Mar.jpg',
      '/BajaCalifornia/CasaTradicional.jpg',
      '/BajaCalifornia/Desierto.jpg',
      '/BajaCalifornia/Playa.jpg',
    ],
  },
  chiapas: {
    hero: '/Chiapas/Cascada.jpg',
    gallery: [
      '/Chiapas/Cascada.jpg',
      '/Chiapas/CentroDeChiapas.jpg',
      '/Chiapas/Cerros.jpg',
      '/Chiapas/Iglesia.jpg',
      '/Chiapas/Laguna.jpg',
      '/Chiapas/Piramide.jpg',
      '/Chiapas/Ropa.jpg',
      '/Chiapas/Trajinera.jpg',
    ],
  },
  'ciudad-de-mexico': {
    hero: '/CiudadDeMexico/PalacioBellasArtes.jpg',
    gallery: [
      '/CiudadDeMexico/PalacioBellasArtes.jpg',
      '/CiudadDeMexico/BasilicaDeGuadalupe.jpg',
      '/CiudadDeMexico/CastilloDeChapultepec.jpg',
      '/CiudadDeMexico/CatedralZocalo.jpg',
      '/CiudadDeMexico/MonumentoaLaRevolucion.jpg',
      '/CiudadDeMexico/MuseoSoumaya.jpg',
      '/CiudadDeMexico/ParqueLaMexicana.jpg',
      '/CiudadDeMexico/ParqueMexicoCondesa.jpg',
      '/CiudadDeMexico/PaseoDeReforma.jpg',
      '/CiudadDeMexico/Reforma.jpg',
      '/CiudadDeMexico/TorreLatinoAmericana.jpg',
      '/CiudadDeMexico/TorresAltasenReforma.jpg',
      '/CiudadDeMexico/ZocaloCDMX.jpg',
    ],
  },
  'estado-de-mexico': {
    hero: '/EstadoDeMexico/CentroDeToluca.jpg',
    gallery: [
      '/EstadoDeMexico/CentroDeToluca.jpg',
      '/EstadoDeMexico/Centro.jpg',
      '/EstadoDeMexico/Estatua.jpg',
      '/EstadoDeMexico/Torres.jpg',
    ],
  },
  jalisco: {
    hero: '/Jalisco/Catedral.jpg',
    gallery: [
      '/Jalisco/Catedral.jpg',
      '/Jalisco/Estatua.jpg',
      '/Jalisco/Festival.jpg',
      '/Jalisco/Iglesia.jpg',
      '/Jalisco/Muralla.jpg',
      '/Jalisco/TequilaPlanta.jpg',
    ],
  },
  michoacan: {
    hero: '/Michoacan/Pueblo.jpg',
    gallery: [
      '/Michoacan/Pueblo.jpg',
      '/Michoacan/CasaAntigua.jpg',
      '/Michoacan/Catedral.jpg',
      '/Michoacan/Festival.jpg',
      '/Michoacan/IglesiaCentro.jpg',
      '/Michoacan/Playa.jpg',
    ],
  },
  morelos: {
    hero: '/Morelos/Catedral.jpg',
    gallery: [
      '/Morelos/Catedral.jpg',
      '/Morelos/Calles.jpg',
      '/Morelos/Festival.jpg',
      '/Morelos/Iglesia.jpg',
    ],
  },
  'nuevo-leon': {
    hero: '/NuevoLeon/CerroDeLaSilla.jpg',
    gallery: [
      '/NuevoLeon/CerroDeLaSilla.jpg',
      '/NuevoLeon/Aesthetic.jpg',
      '/NuevoLeon/Bebidas.jpg',
      '/NuevoLeon/Laguna.jpg',
      '/NuevoLeon/MultiplesTorres.jpg',
      '/NuevoLeon/Paisaje.jpg',
      '/NuevoLeon/PalacioDeGobierno.jpg',
      '/NuevoLeon/ParqueFundidora.jpg',
      '/NuevoLeon/Torre.jpg',
    ],
  },
  oaxaca: {
    hero: '/Oaxaca/CallesDeOaxaca.jpg',
    gallery: [
      '/Oaxaca/CallesDeOaxaca.jpg',
      '/Oaxaca/BebidasTequila.jpg',
      '/Oaxaca/CasaDePlaya.jpg',
      '/Oaxaca/Catedral.jpg',
      '/Oaxaca/ImagenAestheticOaxaca.jpg',
      '/Oaxaca/Local.jpg',
      '/Oaxaca/MarDeOaxaca.jpg',
      '/Oaxaca/RuinasMaya.jpg',
      '/Oaxaca/VistaCerros.jpg',
    ],
  },
  'quintana-roo': {
    hero: '/QuintanaRoo/Playa.jpg',
    gallery: [
      '/QuintanaRoo/Playa.jpg',
      '/QuintanaRoo/Amaca.jpg',
      '/QuintanaRoo/Atardecer.jpg',
      '/QuintanaRoo/Estatua.jpg',
      '/QuintanaRoo/Hoteles.jpg',
      '/QuintanaRoo/Mercado.jpg',
      '/QuintanaRoo/Tulum.jpg',
    ],
  },
  sonora: {
    hero: '/Sonora/CentroDelEstado.jpg',
    gallery: [
      '/Sonora/CentroDelEstado.jpg',
      '/Sonora/Calles.jpg',
      '/Sonora/Catedral.jpg',
      '/Sonora/Desierto.jpg',
    ],
  },
  tamaulipas: {
    hero: '/Tamaulipas/Catedral.jpg',
    gallery: [
      '/Tamaulipas/Catedral.jpg',
      '/Tamaulipas/Local.jpg',
    ],
  },
  yucatan: {
    hero: '/Yucatan/Piramide.jpg',
    gallery: [
      '/Yucatan/Piramide.jpg',
      '/Yucatan/Cenote.jpg',
      '/Yucatan/Cuenca.jpg',
      '/Yucatan/Laguna.jpg',
      '/Yucatan/Locales.jpg',
      '/Yucatan/Piramides.jpg',
    ],
  },
  zacatecas: {
    hero: '/Zacatecas/IglesiaDelCentro.jpg',
    gallery: [
      '/Zacatecas/IglesiaDelCentro.jpg',
      '/Zacatecas/Calles.jpg',
      '/Zacatecas/Cerros.jpg',
      '/Zacatecas/Desierto.jpg',
      '/Zacatecas/Iglesia.jpg',
      '/Zacatecas/LocalesDelCentro.jpg',
    ],
  },
};

/** Get a state's hero image path, or null if no images are available. */
export function getStateHeroImage(stateSlug: string): string | null {
  return STATE_IMAGES[stateSlug]?.hero ?? null;
}

/** Get all gallery images for a state, or an empty array if none. */
export function getStateGallery(stateSlug: string): string[] {
  return STATE_IMAGES[stateSlug]?.gallery ?? [];
}
