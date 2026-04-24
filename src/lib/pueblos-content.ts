/**
 * Content generator for the 177 Pueblo Mágico detail pages.
 *
 * Produces structured, rich article sections from the seed data (resumen, dato
 * curioso, atracciones, experiencias, macrorregión) — no hardcoded per-pueblo
 * prose. The output reads naturally because each template block is parametrised
 * by the pueblo's actual fields and tags.
 */

import type { ExperienceType, PuebloMagico } from './pueblos-magicos';

// ── Macroregion context ─────────────────────────────────────────────────────

interface MacroregionInfo {
  clima: string;
  mejorTemporada: string;
  altitud: string;
  platosSignature: string[];
}

const MACROREGION: Record<string, MacroregionInfo> = {
  'Centro-Norte y Occidente': {
    clima: 'templado seco con veranos cálidos e inviernos frescos',
    mejorTemporada: 'de octubre a abril, cuando las lluvias amainan y el clima es más agradable',
    altitud: 'alto (1,500–2,400 msnm), por lo que las noches suelen ser frescas',
    platosSignature: ['birria', 'pozole rojo', 'tacos de carnitas', 'mezcal artesanal'],
  },
  'Centro': {
    clima: 'templado de montaña, con temperaturas estables todo el año',
    mejorTemporada: 'de noviembre a mayo para evitar la temporada de lluvias',
    altitud: 'elevado (1,800–2,600 msnm); abriga el valle central del país',
    platosSignature: ['mole poblano', 'cecina', 'pulque', 'barbacoa de hoyo'],
  },
  'Golfo': {
    clima: 'cálido húmedo con lluvias abundantes de junio a octubre',
    mejorTemporada: 'de diciembre a marzo, cuando baja la humedad',
    altitud: 'bajo a medio, con vegetación exuberante y tropical',
    platosSignature: ['mojarra frita', 'zacahuil', 'café de altura', 'chilapas'],
  },
  'Mar de Cortés': {
    clima: 'árido a semiárido; calor intenso en verano y templado en invierno',
    mejorTemporada: 'de noviembre a abril, temporada alta para observar ballenas',
    altitud: 'bajo (nivel del mar a 400 msnm), con sierras interiores',
    platosSignature: ['mariscos frescos', 'tacos de pescado', 'almejas tatemadas', 'machaca'],
  },
  'Noreste': {
    clima: 'semiárido con veranos extremos e inviernos fríos',
    mejorTemporada: 'de octubre a abril para evitar el calor de verano',
    altitud: 'variable, entre sierras y valles (300–2,200 msnm)',
    platosSignature: ['cabrito al pastor', 'carne asada', 'machacado', 'empalmes'],
  },
  'Norte-Centro': {
    clima: 'templado de altura con grandes contrastes día-noche',
    mejorTemporada: 'de octubre a mayo, con cielos despejados',
    altitud: 'alto (2,000–2,500 msnm); prepárate para el frío nocturno',
    platosSignature: ['asado de boda', 'gorditas de horno', 'pulque', 'queso menonita'],
  },
  'Pacífico-Sur': {
    clima: 'cálido subhúmedo con microclimas de sierra y costa',
    mejorTemporada: 'de noviembre a abril, temporada seca',
    altitud: 'muy variable: de playas a sierras sobre los 2,500 msnm',
    platosSignature: ['mole negro', 'tlayuda', 'mezcal', 'chapulines', 'chocolate'],
  },
  'Península de Yucatán': {
    clima: 'cálido tropical con humedad alta y temporada de huracanes en verano',
    mejorTemporada: 'de noviembre a marzo, después de los huracanes',
    altitud: 'plano, cerca del nivel del mar; abundan los cenotes',
    platosSignature: ['cochinita pibil', 'sopa de lima', 'panuchos', 'papadzules'],
  },
};

// ── Experience-driven templates ─────────────────────────────────────────────

const EXPERIENCE_SECTIONS: Record<ExperienceType, (p: PuebloMagico) => string> = {
  cultura: (p) =>
    `El tejido cultural de ${p.name} se siente al caminar sus calles. Los edificios virreinales, la parroquia principal y los portales conviven con tradiciones que todavía marcan el calendario local: fiestas patronales, procesiones y mercados donde conviven generaciones. Detente a escuchar; muchas veces la historia del pueblo se cuenta de boca en boca antes de aparecer en un letrero.`,
  naturaleza: (p) =>
    `Los paisajes alrededor de ${p.name} son una razón de peso para quedarse más tiempo. El entorno —sea sierra, lago, cañón o bosque— ofrece caminatas, miradores y rincones para respirar profundo lejos del ruido. Si viajas en la mañana temprano o al atardecer encontrarás la luz que hace justicia a estos paisajes.`,
  gastronomia: (p) =>
    `La cocina de ${p.name} no es un espectáculo: es una conversación. Los mercados locales y las fondas familiares son el mejor lugar para probar lo que se come de diario, y muchas veces el platillo más sencillo es el que mejor cuenta la región. Pregunta qué es de temporada.`,
  espiritualidad: (p) =>
    `${p.name} tiene un componente espiritual que se siente incluso si no eres creyente. Santuarios, templos y rituales todavía marcan el ritmo de la vida cotidiana. Si te toca una procesión o una fiesta patronal, quédate: son experiencias únicas que no están en los folletos.`,
  playa: (p) =>
    `Aunque ${p.name} destaca por su centro histórico, su cercanía al mar (o a la laguna) marca todo: la gastronomía, los colores, el ritmo del día. Reserva una tarde para salir del pueblo y pisar la arena o el agua; es la mejor manera de entender el lugar.`,
  arqueologia: (p) =>
    `${p.name} está a distancia caminable —o un trayecto corto— de vestigios prehispánicos relevantes. Aprovecha una mañana completa para visitarlos con calma: llegar temprano evita el calor, las multitudes y te deja tiempo para el museo de sitio, que suele valer tanto como las ruinas.`,
  aventura: (p) =>
    `Si buscas actividad física, ${p.name} y sus alrededores ofrecen opciones más allá del paseo por el centro: senderismo, rutas ciclistas, tirolesa, espeleología o deportes acuáticos según la zona. Contrata con operadores locales; aportan contexto y suelen tener mejores precios.`,
  artesania: (p) =>
    `La artesanía de ${p.name} está viva. Lo que verás en los talleres y en el mercado se hace con técnicas que llevan generaciones, y cada objeto tiene una historia que vale la pena preguntar. Comprar directamente al artesano sostiene ese oficio mucho más que hacerlo en tiendas de paso.`,
};

// ── Build article sections ──────────────────────────────────────────────────

export interface Section {
  id: string;
  heading: string;
  body: string;
  kind: 'intro' | 'list' | 'prose' | 'meta';
}

export interface FAQ {
  q: string;
  a: string;
}

export function buildArticleSections(
  p: PuebloMagico,
  neighbors: PuebloMagico[],
): { sections: Section[]; faqs: FAQ[] } {
  const macro = MACROREGION[p.macroregion] ?? {
    clima: 'variado según la zona',
    mejorTemporada: 'de noviembre a abril por lo general',
    altitud: 'variable',
    platosSignature: ['platillos regionales'],
  };

  const sections: Section[] = [];

  // 1) Intro expandida ---------------------------------------------------------
  sections.push({
    id: 'intro',
    heading: `Por qué visitar ${p.name}`,
    kind: 'intro',
    body:
      `${p.resumen} ${p.datoCurioso} Ubicado en ${p.estado} (macrorregión ${p.macroregion}), ${p.name} combina ${describeExperiences(p.experiences)} en un entorno ${macro.clima}. Es un destino ideal si buscas un viaje pausado, con atención al detalle y a la vida local.`,
  });

  // 2) Atracciones ancla -------------------------------------------------------
  sections.push({
    id: 'atracciones',
    heading: 'Atracciones ancla',
    kind: 'list',
    body: p.atracciones
      .map(
        (a, i) =>
          `**${i + 1}. ${a}.** ${anchorDescription(a, p)}`,
      )
      .join('\n\n'),
  });

  // 3) Experiencias destacadas ------------------------------------------------
  const primaryExps = p.experiences
    .filter((e) => e !== 'cultura' || p.experiences.length === 1)
    .slice(0, 3);

  if (primaryExps.length > 0) {
    sections.push({
      id: 'experiencias',
      heading: `Qué esperar en ${p.name}`,
      kind: 'prose',
      body: primaryExps.map((e) => EXPERIENCE_SECTIONS[e](p)).join('\n\n'),
    });
  }

  // 4) Cuándo visitar ---------------------------------------------------------
  sections.push({
    id: 'cuando-visitar',
    heading: 'Mejor época para visitar',
    kind: 'meta',
    body:
      `El clima de ${p.name} y la macrorregión ${p.macroregion} es ${macro.clima}. La temporada recomendada es **${macro.mejorTemporada}**. El pueblo se encuentra en un piso altitudinal ${macro.altitud}; empaca en capas. Evita los puentes largos y temporadas vacacionales si buscas menos gente, y aprovecha fiestas patronales cuando te interese vivir la faceta más viva del pueblo.`,
  });

  // 5) Cómo llegar ------------------------------------------------------------
  sections.push({
    id: 'como-llegar',
    heading: `Cómo llegar a ${p.name}`,
    kind: 'prose',
    body:
      `El punto natural de entrada es la capital de ${p.estado}, desde donde hay accesos por carretera federal. Si vas en auto, verifica el estado de las carreteras secundarias en temporada de lluvias; algunas de las vistas que convierten a ${p.name} en un Pueblo Mágico implican tramos de sierra o camino mixto. En transporte público hay corridas regulares desde la capital estatal y, en muchos casos, desde las ciudades grandes más cercanas. Si viajas desde CDMX, considera un vuelo a la capital más cercana y rentar auto para la última parte del recorrido.`,
  });

  // 6) Dónde dormir ----------------------------------------------------------
  sections.push({
    id: 'donde-dormir',
    heading: `Dónde dormir en ${p.name}`,
    kind: 'prose',
    body:
      `Los Pueblos Mágicos suelen ofrecer tres perfiles de hospedaje: casas rurales o posadas familiares (presupuesto ajustado, experiencia local), hoteles boutique (en edificios patrimoniales, precio medio-alto) y haciendas u hoteles de autor para escapadas premium. Para Semana Santa, Día de Muertos y los fines de semana largos conviene reservar con **al menos seis semanas de anticipación**. Si buscas tranquilidad, pregunta por habitaciones alejadas del zócalo: durante fiestas patronales la música se extiende hasta tarde.`,
  });

  // 7) Gastronomía -----------------------------------------------------------
  sections.push({
    id: 'gastronomia',
    heading: `Qué comer en ${p.name}`,
    kind: 'prose',
    body:
      `La cocina de ${p.estado} está marcada por ingredientes locales y técnicas transmitidas por generaciones. Platillos que vale la pena probar: **${macro.platosSignature.join(', ')}**. Busca el mercado municipal en la mañana para desayunar como un local, y fondas de comida corrida al mediodía. Muchos Pueblos Mágicos tienen su propia especialidad — pide al mesero o al dueño qué es lo que solo se come ahí, no el platillo "turístico" del menú.`,
  });

  // 8) Consejos prácticos ----------------------------------------------------
  sections.push({
    id: 'consejos',
    heading: 'Consejos prácticos',
    kind: 'list',
    body: [
      '**Efectivo a la mano:** muchos comercios pequeños no aceptan tarjeta; lleva billetes chicos para mercado y propinas.',
      '**Altitud y clima:** si el pueblo está a más de 2,000 msnm, tómate el primer día con calma y mantente hidratado.',
      '**Calzado cómodo:** las calles son empedradas; pierde peso en la maleta, pero no en el calzado.',
      '**Respeta los usos:** durante rituales, ceremonias o fiestas patronales pregunta antes de fotografiar.',
      '**Horarios mexicanos:** las iglesias suelen cerrar al mediodía; los restaurantes familiares cierran temprano.',
      '**Combustible:** carga gasolina en la ciudad grande más cercana; en algunos Pueblos Mágicos no hay estaciones.',
    ].join('\n\n'),
  });

  // 9) Alrededores -----------------------------------------------------------
  if (neighbors.length > 0) {
    sections.push({
      id: 'alrededores',
      heading: `Otros Pueblos Mágicos cerca de ${p.name}`,
      kind: 'prose',
      body:
        `Si armas un road-trip por ${p.estado}, puedes encadenar varios Pueblos Mágicos en pocos días. Considera combinar ${p.name} con ${neighbors
          .slice(0, 3)
          .map((n) => n.name)
          .join(', ')}; cada uno ofrece una personalidad distinta dentro de la misma región.`,
    });
  }

  // 10) Datos por verificar ---------------------------------------------------
  sections.push({
    id: 'verificar',
    heading: 'Antes de viajar: datos por verificar',
    kind: 'list',
    body: [
      'Horarios y tarifas de los sitios que planees visitar (suelen cambiar cada temporada).',
      'Estado operativo de caminos rurales, especialmente en temporada de lluvias.',
      'Fechas exactas de fiestas patronales y eventos culturales: pueden ser tu razón para ir o el momento a evitar.',
      'Disponibilidad de hospedaje en fines de semana largos, Semana Santa y Día de Muertos.',
      'Restricciones de aforo o cierres temporales en áreas naturales protegidas.',
    ].join('\n\n'),
  });

  // ── FAQs ──────────────────────────────────────────────────────────────────
  const faqs: FAQ[] = [
    {
      q: `¿Cuántos días necesito para conocer ${p.name}?`,
      a: `Una escapada de fin de semana (2 noches) alcanza para recorrer el centro histórico, las atracciones ancla y probar la gastronomía local. Si quieres incluir paseos por los alrededores o hacer excursiones naturales, planea 3 a 4 noches.`,
    },
    {
      q: `¿Cuándo es la mejor época para visitar ${p.name}?`,
      a: `La temporada recomendada es ${macro.mejorTemporada}. En temporada de lluvias (junio a octubre) el paisaje está más verde, pero algunos caminos secundarios pueden complicarse.`,
    },
    {
      q: `¿${p.name} es apto para viajar con niños?`,
      a: `En general sí: los Pueblos Mágicos son seguros y con ritmo tranquilo. Verifica que las atracciones específicas (cuevas, cascadas, senderos) sean adecuadas para la edad de tus hijos y revisa distancias caminables en calles empedradas.`,
    },
    {
      q: `¿Se puede llegar a ${p.name} en transporte público?`,
      a: `Sí, hay corridas desde la capital de ${p.estado} y, en muchos casos, desde ciudades cercanas. El servicio es menos frecuente los domingos; revisa horarios de regreso antes de salir.`,
    },
    {
      q: `¿Cuál es el mayor atractivo de ${p.name}?`,
      a: `${p.datoCurioso}`,
    },
  ];

  return { sections, faqs };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function describeExperiences(exps: ExperienceType[]): string {
  const labels: Record<ExperienceType, string> = {
    cultura: 'patrimonio cultural',
    naturaleza: 'paisaje natural',
    gastronomia: 'tradición gastronómica',
    espiritualidad: 'raíces espirituales',
    playa: 'cercanía al mar',
    arqueologia: 'historia prehispánica',
    aventura: 'actividades al aire libre',
    artesania: 'oficios artesanales',
  };
  const picked = exps.slice(0, 3).map((e) => labels[e]);
  if (picked.length === 0) return 'una fuerte identidad local';
  if (picked.length === 1) return picked[0];
  if (picked.length === 2) return `${picked[0]} y ${picked[1]}`;
  return `${picked.slice(0, -1).join(', ')} y ${picked[picked.length - 1]}`;
}

function anchorDescription(atraccion: string, _p: PuebloMagico): string {
  const a = atraccion.toLowerCase();
  if (/parroqu|templo|bas[íi]lica|catedral/.test(a))
    return `El templo suele ser el punto de referencia del pueblo; visítalo al caer la tarde, cuando la luz favorece la cantera y el interior está menos concurrido.`;
  if (/mercado/.test(a))
    return `El mejor momento para ir es la mañana entre semana: productos frescos, menos gente y mesas de comida corrida con sabores imposibles de replicar fuera del pueblo.`;
  if (/plaza|zócalo|jardín principal/.test(a))
    return `El zócalo es el corazón social: bancas, portales, nieves de garrafa y la oportunidad de observar al pueblo en su cotidianidad.`;
  if (/zona arqueol|pir[áa]mide|ruinas/.test(a))
    return `Llega antes de las 9 am para evitar calor y multitudes. Vale la pena contratar un guía certificado INAH: aporta contexto que no está en los letreros.`;
  if (/cascada|cenote|r[íi]o|laguna/.test(a))
    return `Lleva traje de baño, agua y protector solar biodegradable. Si hay operadores locales, contrátalos: conocen las zonas seguras y las que no.`;
  if (/mina|t[úu]nel|socav/.test(a))
    return `Las visitas suelen ser guiadas por exmineros; es la mejor forma de entender la historia del pueblo y sus ciclos económicos. Lleva suéter: dentro hace frío.`;
  if (/museo/.test(a))
    return `Un museo pequeño pero cuidado suele dar el mejor retrato del pueblo. Reserva una hora; cierran a media tarde en días de diario.`;
  if (/hacienda/.test(a))
    return `Las haciendas conservan arquitectura de la época del Porfiriato; varias funcionan como hoteles boutique y hacen recorridos guiados al público.`;
  if (/mirador/.test(a))
    return `Sube al atardecer para la mejor luz; muchos miradores ofrecen una vista integral del pueblo y su entorno natural.`;
  return `Vale la pena dedicarle al menos una hora con calma. Pregunta a los locales por el mejor momento y ángulo para disfrutarlo.`;
}
