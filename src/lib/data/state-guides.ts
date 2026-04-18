// ---------------------------------------------------------------------------
// Guías generadas por estado — 200+ artículos realistas con contenido único
// Se combinan con mockArticles para formar el catálogo final de guías
// ---------------------------------------------------------------------------

import { mockStates, type MockArticle, type MockState } from './mock';

interface StateGuideSpec {
  capital: string;
  flagship: string[]; // lugares estrella
  gastronomy: string[]; // platillos, bebidas
  nature: string[]; // paisaje/ecosistema
  culture: string[]; // tradiciones
  entryFrom: string; // ciudad origen sugerida
  drivingFromCDMX: string;
  bestMonths: string;
  airport: string;
}

const stateSpecs: Record<string, StateGuideSpec> = {
  'aguascalientes': {
    capital: 'Aguascalientes',
    flagship: ['Centro Histórico de Aguascalientes', 'Museo Nacional de la Muerte', 'Real de Asientos', 'Calvillo'],
    gastronomy: ['birria estilo Aguascalientes', 'gorditas de horno', 'vinos de la Cofradía de Valle Redondo', 'conservas de guayaba de Calvillo'],
    nature: ['cañón de Los Arellano', 'boquilla de Calvillo', 'sierra fría', 'viñedos del altiplano'],
    culture: ['Feria Nacional de San Marcos', 'deshilado artesanal', 'tradición vitivinícola', 'legado ferroviario'],
    entryFrom: 'Ciudad de México por la 57D',
    drivingFromCDMX: '6 horas por autopista 57D pasando por Querétaro y San Luis Potosí',
    bestMonths: 'abril-mayo durante la Feria de San Marcos y septiembre-noviembre',
    airport: 'Aeropuerto Internacional Jesús Terán Peredo (AGU)',
  },
  'baja-california': {
    capital: 'Mexicali',
    flagship: ['Valle de Guadalupe', 'Ensenada', 'Tecate Pueblo Mágico', 'La Bufadora', 'Rosarito'],
    gastronomy: ['cocina Baja Med', 'tacos de pescado estilo Ensenada', 'vinos del Valle de Guadalupe', 'erizo fresco de la costa'],
    nature: ['costa del Pacífico', 'parque nacional Constitución de 1857', 'sierra de San Pedro Mártir', 'observatorio astronómico'],
    culture: ['ruta del vino', 'bohemia fronteriza', 'cocina de autor', 'festival de la vendimia'],
    entryFrom: 'Tijuana por la carretera escénica',
    drivingFromCDMX: '30 horas por la federal 15; la opción realista es vuelo a Tijuana y renta de auto',
    bestMonths: 'agosto-octubre durante la vendimia; marzo-mayo por clima fresco',
    airport: 'Aeropuerto Internacional de Tijuana (TIJ) y Mexicali (MXL)',
  },
  'baja-california-sur': {
    capital: 'La Paz',
    flagship: ['Los Cabos', 'Todos Santos', 'Loreto', 'Isla Espíritu Santo', 'Cabo Pulmo'],
    gastronomy: ['almeja chocolata', 'chocolate clam', 'langosta estilo Puerto Nuevo', 'vino de damiana'],
    nature: ['mar de Cortés', 'oasis de San Ignacio', 'avistamiento de ballena gris', 'arco de Cabo San Lucas'],
    culture: ['misiones jesuitas', 'tradición pesquera', 'pueblos mágicos costeros', 'cultura pericúe'],
    entryFrom: 'La Paz por ferry desde Mazatlán o vuelo directo',
    drivingFromCDMX: '36 horas incluyendo ferry; en vuelo son 2 horas y media',
    bestMonths: 'noviembre-abril por clima templado y avistamiento de ballenas',
    airport: 'Aeropuerto Internacional de Los Cabos (SJD) y Manuel Márquez de León (LAP)',
  },
  'campeche': {
    capital: 'San Francisco de Campeche',
    flagship: ['Ciudad amurallada de Campeche', 'Calakmul', 'Edzná', 'Isla Aguada', 'Palizada'],
    gastronomy: ['pan de cazón', 'pámpano en pipián', 'cochinita estilo Campeche', 'dulce de papaya'],
    nature: ['reserva de la biosfera de Calakmul', 'costa del Golfo', 'petenes manglares', 'selva maya'],
    culture: ['muralla Patrimonio UNESCO', 'historia pirata', 'fuertes coloniales', 'tradición maya'],
    entryFrom: 'Mérida por la autopista 180',
    drivingFromCDMX: '15 horas por la 150D y la 180D pasando por Villahermosa',
    bestMonths: 'noviembre-marzo en temporada seca',
    airport: 'Aeropuerto Internacional Alberto Acuña Ongay (CPE)',
  },
  'chiapas': {
    capital: 'Tuxtla Gutiérrez',
    flagship: ['San Cristóbal de las Casas', 'Palenque', 'Cañón del Sumidero', 'Agua Azul', 'Chiflón'],
    gastronomy: ['cochito horneado', 'tamales de chipilín', 'pozol de cacao', 'queso de bola de Ocosingo'],
    nature: ['selva Lacandona', 'lagos de Montebello', 'cascadas de Agua Azul', 'El Sumidero'],
    culture: ['comunidades tzotziles y tzeltales', 'trajes tradicionales', 'ámbar de Simojovel', 'cafeticultura'],
    entryFrom: 'Tuxtla Gutiérrez o Villahermosa',
    drivingFromCDMX: '14 horas por la 150D y la 145 pasando por Oaxaca o Veracruz',
    bestMonths: 'noviembre-marzo por clima seco',
    airport: 'Aeropuerto Internacional Ángel Albino Corzo (TGZ) y Palenque (PQM)',
  },
  'chihuahua': {
    capital: 'Chihuahua',
    flagship: ['Barrancas del Cobre', 'Creel', 'Batopilas', 'Paquimé', 'Basaseachi'],
    gastronomy: ['asados rancheros', 'burritos norteños', 'queso menonita', 'sotol artesanal'],
    nature: ['Sierra Tarahumara', 'cascada de Basaseachi', 'desierto chihuahuense', 'dunas de Samalayuca'],
    culture: ['cultura rarámuri', 'tren Chepe', 'misiones franciscanas', 'menonitas de Cuauhtémoc'],
    entryFrom: 'Ciudad Juárez o Chihuahua capital',
    drivingFromCDMX: '18 horas por la autopista 57D y 45D; el Chepe es la forma icónica',
    bestMonths: 'marzo-mayo y septiembre-octubre por clima templado',
    airport: 'Aeropuerto Internacional Roberto Fierro Villalobos (CUU)',
  },
  'ciudad-de-mexico': {
    capital: 'Ciudad de México',
    flagship: ['Centro Histórico', 'Zócalo', 'Coyoacán', 'Xochimilco', 'Teotihuacán (vecino)'],
    gastronomy: ['tacos al pastor', 'pozole', 'tlacoyos', 'pulque en pulquerías tradicionales'],
    nature: ['Bosque de Chapultepec', 'Desierto de los Leones', 'Xochimilco', 'cerro de la Estrella'],
    culture: ['museos de clase mundial', 'muralismo', 'arquitectura colonial', 'vida nocturna'],
    entryFrom: 'Aeropuerto Internacional Benito Juárez (AICM) o AIFA',
    drivingFromCDMX: 'capital del país; puerta de entrada a todas las rutas del centro',
    bestMonths: 'marzo-mayo y septiembre-noviembre por clima templado',
    airport: 'Aeropuerto Internacional Benito Juárez (MEX) y Felipe Ángeles (NLU)',
  },
  'coahuila': {
    capital: 'Saltillo',
    flagship: ['Parras de la Fuente', 'Cuatro Ciénegas', 'Dunas de Bilbao', 'Real de Arteaga'],
    gastronomy: ['pan de pulque de Parras', 'cabrito al pastor', 'machaca con huevo', 'vinos Casa Madero'],
    nature: ['dunas de yeso de Cuatro Ciénegas', 'sierra de Arteaga', 'pozas turquesas', 'desierto chihuahuense'],
    culture: ['Casa Madero (vinícola más antigua de América)', 'tradición menonita', 'herencia española', 'ruta del vino'],
    entryFrom: 'Monterrey por la 40D',
    drivingFromCDMX: '12 horas por autopista 57D',
    bestMonths: 'marzo-mayo y octubre-noviembre por clima templado',
    airport: 'Aeropuerto Internacional Plan de Guadalupe (SLW)',
  },
  'colima': {
    capital: 'Colima',
    flagship: ['Volcán de Fuego', 'Manzanillo', 'Comala Pueblo Mágico', 'Cuyutlán', 'Laguna de Cuyutlán'],
    gastronomy: ['pollo al juego de la pelota', 'tatemado', 'sopes colimotes', 'tuba fresca'],
    nature: ['volcán de Colima activo', 'playa Miramar', 'laguna de Cuyutlán', 'ecosistemas de manglar'],
    culture: ['cerámica de Colima', 'trajes de tenango', 'tradición porcelanera', 'festivales de danza'],
    entryFrom: 'Guadalajara por la 54D',
    drivingFromCDMX: '9 horas por autopista 54D y 15D',
    bestMonths: 'noviembre-marzo por clima seco y templado',
    airport: 'Aeropuerto Internacional de Manzanillo-Costalegre (ZLO)',
  },
  'durango': {
    capital: 'Victoria de Durango',
    flagship: ['Mapimí Pueblo Mágico', 'Nombre de Dios', 'Mexiquillo', 'Zona del Silencio'],
    gastronomy: ['caldillo duranguense', 'gallinas borrachas', 'tortillas de harina', 'mezcal durangueño'],
    nature: ['sierra Madre Occidental', 'espinazo del Diablo', 'bosques de pino encino', 'Zona del Silencio'],
    culture: ['sets de películas del viejo oeste', 'cultura tepehuana', 'minería colonial', 'tradición ganadera'],
    entryFrom: 'Mazatlán por la nueva autopista Mazatlán-Durango',
    drivingFromCDMX: '10 horas por autopista 57D y 40D',
    bestMonths: 'marzo-mayo y septiembre-noviembre',
    airport: 'Aeropuerto Internacional General Guadalupe Victoria (DGO)',
  },
  'estado-de-mexico': {
    capital: 'Toluca',
    flagship: ['Teotihuacán', 'Valle de Bravo', 'Malinalco', 'Tepotzotlán', 'Ixtapan de la Sal'],
    gastronomy: ['chorizo verde de Toluca', 'tacos de plaza', 'mosquitos', 'barbacoa de borrego'],
    nature: ['Nevado de Toluca', 'lago de Valle de Bravo', 'Santuario de Mariposas Piedra Herrada', 'parque Nacional Izta-Popo'],
    culture: ['arqueología teotihuacana', 'muralismo prehispánico', 'artesanías matlatzincas', 'centros ceremoniales'],
    entryFrom: 'Ciudad de México por autopistas varias',
    drivingFromCDMX: '1-2 horas según destino',
    bestMonths: 'marzo-mayo y octubre-febrero (mariposa monarca)',
    airport: 'Aeropuerto Internacional Felipe Ángeles (NLU) y Toluca (TLC)',
  },
  'guanajuato': {
    capital: 'Guanajuato',
    flagship: ['Guanajuato capital', 'San Miguel de Allende', 'Dolores Hidalgo', 'Mineral de Pozos', 'Yuriria'],
    gastronomy: ['enchiladas mineras', 'fiambre estilo San Miguel', 'nieves de Dolores', 'vinos de Dolores Hidalgo'],
    nature: ['sierra de Guanajuato', 'presa de la Olla', 'Cañada de la Virgen', 'valles de la región Bajío'],
    culture: ['Festival Internacional Cervantino', 'Ruta de la Independencia', 'minería colonial', 'arte colonial barroco'],
    entryFrom: 'Querétaro por la 45D o León por la 45',
    drivingFromCDMX: '4 horas por autopista 57D',
    bestMonths: 'octubre por el Cervantino y marzo-mayo por clima templado',
    airport: 'Aeropuerto Internacional del Bajío (BJX)',
  },
  'guerrero': {
    capital: 'Chilpancingo',
    flagship: ['Taxco', 'Acapulco', 'Ixtapa-Zihuatanejo', 'Grutas de Cacahuamilpa', 'Troncones'],
    gastronomy: ['pozole verde guerrerense', 'chilpachole', 'jaiba rellena', 'mezcal de Mazatlán'],
    nature: ['costa del Pacífico', 'grutas de Cacahuamilpa', 'laguna de Coyuca', 'sierra de Guerrero'],
    culture: ['plata labrada de Taxco', 'danzas tradicionales', 'fiesta de la plata', 'son guerrerense'],
    entryFrom: 'Ciudad de México por Autopista del Sol',
    drivingFromCDMX: '2.5 horas a Taxco; 4 horas a Acapulco',
    bestMonths: 'noviembre-abril por clima seco',
    airport: 'Aeropuerto Internacional General Juan N. Álvarez (ACA)',
  },
  'hidalgo': {
    capital: 'Pachuca',
    flagship: ['Huasca de Ocampo', 'Real del Monte', 'Prismas Basálticos', 'Mineral del Chico', 'Tolantongo'],
    gastronomy: ['pastes de Real del Monte', 'barbacoa hidalguense', 'ximbó', 'pulque de Apan'],
    nature: ['Prismas Basálticos', 'grutas de Tolantongo', 'parque nacional El Chico', 'bosque de niebla'],
    culture: ['herencia inglesa de Cornualles', 'minería colonial', 'cultura otomí', 'tradición pulquera'],
    entryFrom: 'Ciudad de México por la 85D o 132D',
    drivingFromCDMX: '1.5 horas a Pachuca; 2 horas a Huasca',
    bestMonths: 'marzo-mayo y septiembre-noviembre',
    airport: 'Aeropuerto Internacional Felipe Ángeles (NLU) cercano',
  },
  'jalisco': {
    capital: 'Guadalajara',
    flagship: ['Guadalajara', 'Tequila', 'Puerto Vallarta', 'Chapala-Ajijic', 'Mazamitla'],
    gastronomy: ['birria jalisciense', 'torta ahogada', 'tequila y mezcal', 'pozole blanco'],
    nature: ['lago de Chapala', 'sierra de Tapalpa', 'bahía de Banderas', 'bosque de Primavera'],
    culture: ['mariachi de Cocula', 'charrería', 'orfebrería de Tlaquepaque', 'festival cultural de Mayo'],
    entryFrom: 'Guadalajara o Puerto Vallarta',
    drivingFromCDMX: '6 horas por autopista 15D',
    bestMonths: 'noviembre-mayo por clima templado',
    airport: 'Aeropuerto Miguel Hidalgo y Costilla (GDL) y Puerto Vallarta (PVR)',
  },
  'michoacan': {
    capital: 'Morelia',
    flagship: ['Morelia', 'Pátzcuaro', 'Tzintzuntzan', 'Santa Clara del Cobre', 'Tlalpujahua'],
    gastronomy: ['carnitas michoacanas', 'corundas', 'uchepos', 'charanda'],
    nature: ['Santuario de la Mariposa Monarca', 'lago de Pátzcuaro', 'sierra purépecha', 'paricutín'],
    culture: ['cultura purépecha', 'Noche de Muertos en Janitzio', 'artesanías de cobre', 'centro histórico colonial UNESCO'],
    entryFrom: 'Ciudad de México por la 15D',
    drivingFromCDMX: '4 horas a Morelia',
    bestMonths: 'noviembre-marzo (mariposa monarca y Día de Muertos)',
    airport: 'Aeropuerto Internacional General Francisco J. Mújica (MLM)',
  },
  'morelos': {
    capital: 'Cuernavaca',
    flagship: ['Tepoztlán', 'Tlayacapan', 'Xochicalco', 'Oaxtepec', 'Tetela del Volcán'],
    gastronomy: ['cecina de Yecapixtla', 'mole de olla', 'tamales de iguana', 'dulces de pepita'],
    nature: ['Cerro del Tepozteco', 'Cañón de Lobos', 'parque Popocatépetl', 'balnearios de Oaxtepec'],
    culture: ['arqueología tlahuica', 'muralismo de Cuernavaca', 'Carnaval de Tepoztlán', 'chinelos'],
    entryFrom: 'Ciudad de México por la 95D',
    drivingFromCDMX: '1 hora a Cuernavaca; 1.5 horas a Tepoztlán',
    bestMonths: 'todo el año por clima primaveral',
    airport: 'Aeropuerto Internacional General Mariano Matamoros (CVJ)',
  },
  'nayarit': {
    capital: 'Tepic',
    flagship: ['Sayulita', 'Islas Marietas', 'San Blas', 'Jala', 'Mexcaltitán'],
    gastronomy: ['pescado zarandeado', 'tamal barbón', 'ceviche estilo Nayarit', 'raicilla'],
    nature: ['Riviera Nayarit', 'laguna de Santa María del Oro', 'islas Marietas', 'volcán Ceboruco'],
    culture: ['cultura huichol', 'cuadros de estambre', 'peregrinaciones a Wirikuta', 'fiestas patronales'],
    entryFrom: 'Puerto Vallarta por la costera',
    drivingFromCDMX: '8 horas por la 15D y la 200',
    bestMonths: 'noviembre-abril por clima seco',
    airport: 'Aeropuerto Internacional Amado Nervo (TPQ) y Vallarta (PVR)',
  },
  'nuevo-leon': {
    capital: 'Monterrey',
    flagship: ['Monterrey', 'Santiago Pueblo Mágico', 'Linares', 'Bustamante', 'Cola de Caballo'],
    gastronomy: ['cabrito al pastor', 'machacado con huevo', 'glorias de Linares', 'cerveza regia'],
    nature: ['cerro de la Silla', 'cola de Caballo', 'parque Chipinque', 'cañón de la Huasteca'],
    culture: ['industria regiomontana', 'polka y redova', 'arquitectura moderna', 'grupera'],
    entryFrom: 'Monterrey como hub central',
    drivingFromCDMX: '10 horas por autopista 57D y 85D',
    bestMonths: 'marzo-mayo y octubre-noviembre',
    airport: 'Aeropuerto Internacional General Mariano Escobedo (MTY)',
  },
  'oaxaca': {
    capital: 'Oaxaca de Juárez',
    flagship: ['Oaxaca ciudad', 'Monte Albán', 'Mitla', 'Mazunte', 'Hierve el Agua', 'Puerto Escondido'],
    gastronomy: ['siete moles', 'tlayudas', 'tasajo', 'chapulines', 'mezcal artesanal'],
    nature: ['sierra Juárez', 'costa del Pacífico', 'cascadas petrificadas', 'valles centrales'],
    culture: ['16 grupos indígenas', 'Guelaguetza', 'Día de Muertos en Xoxocotlán', 'textiles zapotecos'],
    entryFrom: 'Oaxaca ciudad por la 135D',
    drivingFromCDMX: '6 horas por autopista 135D',
    bestMonths: 'octubre-diciembre (Día de Muertos) y julio (Guelaguetza)',
    airport: 'Aeropuerto Internacional Xoxocotlán (OAX)',
  },
  'puebla': {
    capital: 'Puebla de Zaragoza',
    flagship: ['Puebla capital', 'Cholula', 'Atlixco', 'Zacatlán', 'Cuetzalan', 'Chignahuapan'],
    gastronomy: ['mole poblano', 'chiles en nogada', 'cemitas', 'pasita', 'rompope de Chignahuapan'],
    nature: ['Popocatépetl e Iztaccíhuatl', 'Valle de Piedras Encimadas', 'barranca de Cuetzalan', 'sierra Norte'],
    culture: ['Talavera poblana', 'barroco churrigueresco', 'danza de los voladores de Cuetzalan', 'arquitectura colonial UNESCO'],
    entryFrom: 'Ciudad de México por la 150D',
    drivingFromCDMX: '2 horas por autopista 150D',
    bestMonths: 'agosto-octubre para chiles en nogada; marzo-mayo',
    airport: 'Aeropuerto Internacional Hermanos Serdán (PBC)',
  },
  'queretaro': {
    capital: 'Santiago de Querétaro',
    flagship: ['Querétaro capital', 'Bernal', 'Tequisquiapan', 'Jalpan de Serra', 'Cadereyta'],
    gastronomy: ['gorditas de Bernal', 'enchiladas queretanas', 'quesos del Bajío', 'vinos de Freixenet y Cavas'],
    nature: ['Peña de Bernal (monolito)', 'Sierra Gorda', 'viñedos del valle', 'cañón del río Moctezuma'],
    culture: ['acueducto y centro histórico UNESCO', 'misiones franciscanas de Sierra Gorda UNESCO', 'ópalo de Tequisquiapan', 'Semana Santa'],
    entryFrom: 'Ciudad de México por la 57D',
    drivingFromCDMX: '2.5 horas por autopista 57D',
    bestMonths: 'marzo-mayo y septiembre-noviembre',
    airport: 'Aeropuerto Internacional de Querétaro (QRO)',
  },
  'quintana-roo': {
    capital: 'Chetumal',
    flagship: ['Tulum', 'Bacalar', 'Cancún', 'Playa del Carmen', 'Cozumel', 'Holbox'],
    gastronomy: ['tikin xic', 'ceviche caribeño', 'papadzules', 'chaya con huevo'],
    nature: ['Mar Caribe', 'Laguna de los Siete Colores', 'cenotes de la Riviera Maya', 'Sian Kaan UNESCO'],
    culture: ['herencia maya', 'arqueología costera', 'cultura caribeña', 'festivales de jazz'],
    entryFrom: 'Cancún por autopista 307',
    drivingFromCDMX: 'vuelo directo a Cancún (2h) es la opción realista',
    bestMonths: 'noviembre-abril por clima seco',
    airport: 'Aeropuerto Internacional de Cancún (CUN) y Tulum (TQO)',
  },
  'san-luis-potosi': {
    capital: 'San Luis Potosí',
    flagship: ['Real de Catorce', 'Xilitla y Las Pozas', 'Aquismón', 'Huasteca potosina', 'Santa María del Río'],
    gastronomy: ['enchiladas potosinas', 'gorditas huastecas', 'zacahuil', 'vino de Tlaxcalilla'],
    nature: ['cascadas de la Huasteca (Tamul, Micos, Minas Viejas)', 'desierto de Wirikuta', 'sótano de las Golondrinas', 'sierra del Abra'],
    culture: ['jardín escultórico de Edward James', 'cultura huasteca', 'rebozo de Santa María del Río', 'peregrinaciones wixárika'],
    entryFrom: 'San Luis Potosí ciudad por la 57D',
    drivingFromCDMX: '5 horas por autopista 57D',
    bestMonths: 'noviembre-marzo (Huasteca); octubre para peregrinaciones',
    airport: 'Aeropuerto Internacional Ponciano Arriaga (SLP)',
  },
  'sinaloa': {
    capital: 'Culiacán',
    flagship: ['Mazatlán', 'Cosalá', 'El Fuerte', 'Mocorito', 'Copala'],
    gastronomy: ['aguachile sinaloense', 'chilorio', 'tamales barbones', 'camarón zarandeado'],
    nature: ['malecón de Mazatlán', 'islas del Pacífico', 'sierra de Cosalá', 'marismas nacionales'],
    culture: ['carnaval de Mazatlán', 'banda sinaloense', 'tradición tambora', 'arquitectura porfiriana'],
    entryFrom: 'Mazatlán por la 15D',
    drivingFromCDMX: '12 horas por autopista 15D',
    bestMonths: 'noviembre-abril por clima seco',
    airport: 'Aeropuerto Internacional General Rafael Buelna (MZT)',
  },
  'sonora': {
    capital: 'Hermosillo',
    flagship: ['Álamos', 'Puerto Peñasco', 'Bahía Kino', 'San Carlos', 'Magdalena de Kino'],
    gastronomy: ['carne asada sonorense', 'cabrito', 'tortillas de harina', 'bacanora artesanal'],
    nature: ['desierto de Altar', 'mar de Cortés', 'sierra Madre Occidental', 'reserva El Pinacate UNESCO'],
    culture: ['cultura yaqui', 'danza del venado', 'ruta de las misiones jesuitas', 'herencia ópata'],
    entryFrom: 'Nogales por la 15D',
    drivingFromCDMX: '24 horas por autopista 15D',
    bestMonths: 'octubre-abril por clima seco',
    airport: 'Aeropuerto Internacional General Ignacio Pesqueira (HMO)',
  },
  'tabasco': {
    capital: 'Villahermosa',
    flagship: ['Parque La Venta', 'Tapijulapa Pueblo Mágico', 'Comalcalco', 'Reserva Pantanos de Centla'],
    gastronomy: ['pejelagarto asado', 'tamales de chipilín', 'chocolate artesanal', 'pozol de cacao blanco'],
    nature: ['pantanos de Centla', 'cascadas de Agua Blanca', 'sierra de Huimanguillo', 'ríos y manglares'],
    culture: ['cultura olmeca (cuna de la civilización)', 'chocolate como patrimonio', 'tradición ch’ol', 'poesía de Carlos Pellicer'],
    entryFrom: 'Villahermosa por la 180D',
    drivingFromCDMX: '11 horas por autopista 150D y 180D',
    bestMonths: 'noviembre-abril por menor humedad',
    airport: 'Aeropuerto Internacional Carlos Rovirosa Pérez (VSA)',
  },
  'tamaulipas': {
    capital: 'Ciudad Victoria',
    flagship: ['Reserva de la Biosfera El Cielo', 'Mier Pueblo Mágico', 'Tula', 'Playa Miramar'],
    gastronomy: ['carne asada a la tampiqueña', 'jaiba rellena', 'cabrito', 'licor de nanche'],
    nature: ['El Cielo (bosque de niebla)', 'Golfo de México', 'sierra de Tamaulipas', 'río Soto La Marina'],
    culture: ['frontera fronteriza', 'fiesta del huapango', 'cultura huasteca', 'tradición ganadera'],
    entryFrom: 'Tampico por autopista 80D',
    drivingFromCDMX: '9 horas por autopista 85D',
    bestMonths: 'marzo-mayo y septiembre-noviembre',
    airport: 'Aeropuerto Internacional General Francisco Javier Mina (TAM) y Ciudad Victoria (CVM)',
  },
  'tlaxcala': {
    capital: 'Tlaxcala de Xicohténcatl',
    flagship: ['Cacaxtla-Xochitécatl', 'Huamantla', 'Tlaxco', 'Val’quirico'],
    gastronomy: ['mole prieto', 'pulque de Apizaco', 'tlacoyos', 'escamoles'],
    nature: ['volcán La Malinche', 'haciendas pulqueras', 'grutas de Atlihuetzía', 'bosques de oyamel'],
    culture: ['murales de Cacaxtla', 'carnaval de huehues', 'corridas de toros de Huamantla', 'tradición charra'],
    entryFrom: 'Puebla por la 150D',
    drivingFromCDMX: '2 horas por autopista 150D',
    bestMonths: 'agosto (Huamantlada) y marzo-abril (pulque)',
    airport: 'Aeropuerto Internacional Hermanos Serdán (PBC) en Puebla',
  },
  'veracruz': {
    capital: 'Xalapa',
    flagship: ['El Tajín', 'Coatepec', 'Xico', 'Tlacotalpan', 'Papantla', 'Orizaba'],
    gastronomy: ['pescado a la veracruzana', 'café de Coatepec', 'chileatole', 'arroz a la tumbada'],
    nature: ['Pico de Orizaba (Citlaltépetl)', 'cafetales de altura', 'selva de Los Tuxtlas', 'costa del Golfo'],
    culture: ['voladores de Papantla UNESCO', 'son jarocho', 'Tlacotalpan UNESCO', 'herencia totonaca'],
    entryFrom: 'Veracruz puerto por la 150D',
    drivingFromCDMX: '5 horas por autopista 150D',
    bestMonths: 'octubre-marzo por clima fresco',
    airport: 'Aeropuerto Internacional General Heriberto Jara (VER) y Xalapa (JAL)',
  },
  'yucatan': {
    capital: 'Mérida',
    flagship: ['Chichén Itzá', 'Uxmal', 'Valladolid', 'Izamal', 'Mérida', 'Sisal'],
    gastronomy: ['cochinita pibil', 'papadzules', 'queso relleno', 'xtabentún'],
    nature: ['cenotes (6,000+ en la península)', 'reserva Ría Celestún', 'manglares costeros', 'grutas de Loltún'],
    culture: ['herencia maya yucateca', 'jarana yucateca', 'arquitectura colonial amarilla', 'trova yucateca'],
    entryFrom: 'Mérida por la 180D',
    drivingFromCDMX: '18 horas por autopista 150D y 180D',
    bestMonths: 'noviembre-marzo por clima seco',
    airport: 'Aeropuerto Internacional Manuel Crescencio Rejón (MID)',
  },
  'zacatecas': {
    capital: 'Zacatecas',
    flagship: ['Zacatecas capital', 'Jerez', 'Sombrerete', 'Teúl de González Ortega', 'Guadalupe'],
    gastronomy: ['asado de boda', 'birria zacatecana', 'quesadillas de flor de calabaza', 'mezcal de maguey verde'],
    nature: ['sierra de Órganos', 'cerro de la Bufa', 'desierto semi árido', 'minas de plata'],
    culture: ['centro histórico UNESCO', 'cantera rosa', 'callejoneadas', 'tradición minera y taurina'],
    entryFrom: 'Zacatecas ciudad por la 45D',
    drivingFromCDMX: '8 horas por autopista 57D y 45D',
    bestMonths: 'marzo-mayo y septiembre-noviembre',
    airport: 'Aeropuerto Internacional General Leobardo C. Ruiz (ZCL)',
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function listToText(items: string[], conjunction = 'y'): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} ${conjunction} ${items[1]}`;
  return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[items.length - 1]}`;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// ---------------------------------------------------------------------------
// Generadores por tema
// ---------------------------------------------------------------------------

function buildOverviewGuide(state: MockState, spec: StateGuideSpec, idx: number): MockArticle {
  return {
    id: `sg-${String(idx).padStart(3, '0')}`,
    slug: `que-hacer-en-${state.slug}`,
    title: `Qué hacer en ${state.name}: guía completa de viaje`,
    description: `Guía paso a paso para descubrir ${state.name}: los imperdibles, platillos típicos, clima, rutas en auto y cuándo visitar.`,
    image: state.image,
    content: `<h2>¿Por qué viajar a ${state.name}?</h2>
<p>${state.description} Con capital en ${spec.capital}, el estado concentra ${state.placeCount} destinos curados que van desde ${spec.flagship[0]} hasta ${spec.flagship[spec.flagship.length - 1]}. Si buscas un viaje de carretera con densidad cultural, naturaleza variada y gastronomía regional auténtica, ${state.name} es una parada obligada del mapa turístico de México.</p>

<h2>Los imperdibles de ${state.name}</h2>
<p>Para una primera visita, te recomendamos arrancar por ${spec.flagship[0]}, el destino ancla del estado. Desde ahí, te puedes mover a ${spec.flagship[1]} y, si tienes más días, completar el circuito con ${listToText(spec.flagship.slice(2))}. Cada uno tiene su propio ritmo: centros históricos caminables, zonas arqueológicas, balnearios o pueblos donde perderte sin prisa. Viajar en auto te da la flexibilidad de combinarlos en el mismo itinerario.</p>

<h2>Gastronomía local que tienes que probar</h2>
<p>La cocina de ${state.name} es razón suficiente para el viaje. No te vayas sin probar ${listToText(spec.gastronomy)}. En los mercados municipales y fondas familiares encontrarás las versiones más auténticas; en restaurantes de autor, interpretaciones modernas del recetario tradicional.</p>

<h2>Naturaleza y paisaje</h2>
<p>Más allá de las ciudades, ${state.name} ofrece paisajes que cambian kilómetro a kilómetro: ${listToText(spec.nature)}. Reserva al menos un día para salir al campo y vivir la escala del estado, sea caminando, en auto o con un guía local.</p>

<h2>Cultura y tradiciones</h2>
<p>${state.name} se entiende mejor a través de su gente. Busca ${listToText(spec.culture)}. Muchas fiestas locales marcan calendario turístico del estado, así que si puedes alinear tu viaje con un festival, la experiencia se multiplica.</p>

<h2>Cómo llegar y mejores meses</h2>
<p>La entrada más común es por ${spec.entryFrom}. Desde la Ciudad de México son aproximadamente ${spec.drivingFromCDMX}. Si prefieres volar, el ${spec.airport} te conecta con las principales ciudades del país. La mejor temporada para visitar es ${spec.bestMonths}, cuando el clima acompaña y los eventos culturales están activos.</p>

<h2>Consejos prácticos de road trip</h2>
<p>Viaja con tanque lleno y efectivo suficiente para casetas y pueblos pequeños que no aceptan tarjeta. Descarga mapas offline, sale siempre temprano, y reserva hospedaje con anticipación si viajes coinciden con fines de semana largos. Un seguro vehicular con cobertura amplia es indispensable, y si no conoces la región, considera contratar un guía local para al menos un día de ruta: verás cosas que no salen en ninguna guía.</p>`,
    author: 'Equipo Rutas en MX',
    datePublished: '2026-01-15',
    dateModified: '2026-04-10',
    relatedPlaceSlugs: [],
    relatedRouteSlugs: [],
    tags: [state.name.toLowerCase(), 'guía de viaje', 'road trip', 'México', 'turismo'],
  };
}

function buildPueblosMagicosGuide(state: MockState, spec: StateGuideSpec, idx: number): MockArticle {
  return {
    id: `sg-${String(idx).padStart(3, '0')}`,
    slug: `pueblos-magicos-${state.slug}`,
    title: `Pueblos Mágicos de ${state.name}: guía por carretera`,
    description: `Descubre los Pueblos Mágicos de ${state.name}, cómo llegar en auto, qué hacer en cada uno y los mejores meses para visitar.`,
    image: state.image,
    content: `<h2>Pueblos Mágicos en ${state.name}</h2>
<p>El estado de ${state.name} forma parte de una de las redes turísticas más importantes del país: los Pueblos Mágicos, un programa de la Secretaría de Turismo que reconoce localidades con valor cultural, natural e histórico excepcional. En este estado encontrarás pueblos como ${listToText(spec.flagship.slice(0, 3))}, ideales para una escapada de carretera de 2 a 4 días.</p>

<h2>Qué hace únicos a los pueblos de ${state.name}</h2>
<p>Cada pueblo mágico del estado combina arquitectura vernácula, tradiciones vivas y entornos naturales que varían desde ${spec.nature[0]} hasta ${spec.nature[spec.nature.length - 1]}. Puedes caminar calles empedradas por la mañana, visitar ${spec.flagship[1]} al mediodía y cerrar el día con cena regional en plazas que llevan siglos siendo punto de encuentro.</p>

<h2>Gastronomía de pueblo mágico</h2>
<p>La comida es parte inseparable del viaje. Busca ${listToText(spec.gastronomy)}. Los mercados municipales y las fondas familiares son donde encontrarás las recetas más auténticas, muchas veces elaboradas con técnicas heredadas de varias generaciones.</p>

<h2>Ruta sugerida por carretera</h2>
<p>Un circuito realista arranca en ${spec.capital} y recorre ${listToText(spec.flagship.slice(0, 4))}. Calcula 3 a 4 días para hacerlo con calma: una noche en cada pueblo principal, tiempos de traslado moderados y tardes libres para que cada lugar se sienta. Viaja temprano, evita manejar de noche en sierras, y siempre consulta el estado del camino antes de partir.</p>

<h2>Cuándo visitar</h2>
<p>La mejor temporada para recorrer los Pueblos Mágicos de ${state.name} es ${spec.bestMonths}. Consulta el calendario de festividades locales: un pueblo mágico en plena fiesta patronal ofrece una experiencia totalmente distinta a un fin de semana común, pero la disponibilidad de hospedaje se ajusta con semanas de anticipación.</p>

<h2>Consejos para aprovechar el viaje</h2>
<p>Contrata guías locales cuando sea posible: apoyas la economía del pueblo y acceden a espacios que los turistas pierden. Respeta las costumbres religiosas y comunitarias, no subas a espacios ceremoniales sin permiso, y siempre pide autorización antes de fotografiar a las personas. Este tipo de turismo responsable es el que mantiene vivos a los pueblos.</p>`,
    author: 'Equipo Rutas en MX',
    datePublished: '2026-01-22',
    dateModified: '2026-04-08',
    relatedPlaceSlugs: [],
    relatedRouteSlugs: [],
    tags: ['pueblos mágicos', state.name.toLowerCase(), 'road trip', 'SECTUR', 'turismo regional'],
  };
}

function buildGastronomyGuide(state: MockState, spec: StateGuideSpec, idx: number): MockArticle {
  return {
    id: `sg-${String(idx).padStart(3, '0')}`,
    slug: `gastronomia-${state.slug}`,
    title: `Gastronomía de ${state.name}: platillos típicos, mercados y mejores lugares`,
    description: `Guía gastronómica de ${state.name}: los platillos imperdibles, bebidas tradicionales, mercados auténticos y consejos para comer bien en carretera.`,
    image: state.image,
    content: `<h2>La cocina de ${state.name}</h2>
<p>La gastronomía de ${state.name} es una de las razones por las que viajeros locales y extranjeros planean regresar una y otra vez. Influenciada por la geografía, el clima y el mestizaje cultural, la cocina del estado combina técnicas prehispánicas con ingredientes traídos por los españoles, creando un recetario único. Si te interesa comer bien en tu próximo road trip, ${state.name} debe estar en tu ruta.</p>

<h2>Platillos imperdibles</h2>
<p>No puedes salir del estado sin probar ${listToText(spec.gastronomy)}. Cada platillo tiene una historia: ingredientes locales, técnicas heredadas y una relación con la fiesta o la vida cotidiana que le da sentido. Pregunta a los cocineros cómo se preparan, la mayoría estará feliz de contarte.</p>

<h2>Mercados y fondas auténticas</h2>
<p>Para una experiencia real, evita restaurantes turísticos de la zona céntrica y métete a los mercados municipales, los cuales abren desde temprano. Los mejores sabores viven en fondas familiares donde las cocineras preparan el mismo platillo desde hace décadas. En ${spec.capital} y ${spec.flagship[0]} encontrarás varios referentes.</p>

<h2>Bebidas tradicionales</h2>
<p>Más allá de la comida, ${state.name} cuenta con bebidas tradicionales únicas: desde destilados artesanales hasta aguas frescas de frutas endémicas. Muchas regiones han profesionalizado su producción sin perder el alma artesanal, y una visita a un productor local puede ser una experiencia tan memorable como una cena de alta cocina.</p>

<h2>Ruta gastronómica en auto</h2>
<p>Si estás diseñando un road trip gastronómico por ${state.name}, considera incluir ${listToText(spec.flagship.slice(0, 3))}. Planea tres comidas y una merienda por día para no saturarte; reserva con anticipación los restaurantes con estrella o mención, y deja espacio para descubrimientos en la calle. Los mejores taqueros, gorditeras y cocineros rara vez aparecen en Google.</p>

<h2>Tips para foodies viajeros</h2>
<p>Lleva antiácidos y agua siempre; varía los platos para no repetir ingredientes; prueba lo regional antes que lo nacional; y si vas a probar destilados o vinos, designa conductor. Si algún platillo te conmueve, anota el nombre, el lugar y la versión exacta: así vas construyendo tu mapa gastronómico personal de México.</p>`,
    author: 'Equipo Rutas en MX',
    datePublished: '2026-02-05',
    dateModified: '2026-04-12',
    relatedPlaceSlugs: [],
    relatedRouteSlugs: [],
    tags: ['gastronomía', state.name.toLowerCase(), 'cocina mexicana', 'comida típica', 'mercados'],
  };
}

function buildRoadTripGuide(state: MockState, spec: StateGuideSpec, idx: number): MockArticle {
  return {
    id: `sg-${String(idx).padStart(3, '0')}`,
    slug: `road-trip-${state.slug}`,
    title: `Road trip por ${state.name}: ruta de 3 días en auto`,
    description: `Ruta de 3 días por ${state.name} en auto: distancias, paradas clave, dónde dormir y consejos para recorrer el estado sin contratiempos.`,
    image: state.image,
    content: `<h2>Por qué recorrer ${state.name} en auto</h2>
<p>Viajar en auto por ${state.name} te da acceso a rincones que el transporte público no cubre. Puedes detenerte en miradores, cambiar la ruta según el clima, y llegar a pueblos donde la única forma de bajar es saliendo temprano de una carretera estatal. Este road trip de 3 días está diseñado para que aproveches el estado sin quedar agotado y con margen de improvisación.</p>

<h2>Día 1: llegada y ${spec.capital}</h2>
<p>Si llegas desde la Ciudad de México son aproximadamente ${spec.drivingFromCDMX}. Base en ${spec.capital} para el primer día: su centro histórico, plazas y museos te dan contexto sobre el estado. Para la cena, busca un restaurante donde sirvan ${spec.gastronomy[0]} hecho como se debe.</p>

<h2>Día 2: ${spec.flagship[0]}</h2>
<p>Arranca temprano rumbo a ${spec.flagship[0]}, el destino ancla del estado. Dedícale el día completo: camina el centro, visita los atractivos principales, come en el mercado y si hay tiempo, suma ${spec.flagship[1]} como visita corta por la tarde. Cena y descansa en ${spec.flagship[0]} o regresa a ${spec.capital} según el plan.</p>

<h2>Día 3: naturaleza y regreso</h2>
<p>El tercer día se reserva para la parte natural del viaje: ${spec.nature[0]}. Lleva ropa cómoda, bloqueador solar y agua suficiente. Al medio día emprende camino de regreso con una parada para comer en algún pueblo de la ruta. Si llevas prisa, la autopista te regresa rápido; si prefieres disfrutar, la carretera libre tiene mejor paisaje.</p>

<h2>Hospedaje recomendado</h2>
<p>${spec.capital} y ${spec.flagship[0]} concentran la mayor oferta hotelera, desde hoteles boutique hasta cadenas internacionales. Si buscas una experiencia más auténtica, busca casas rurales u hoteles patrimonio en los pueblos del circuito. Reserva con anticipación si viajas en fines de semana largos o temporada alta (${spec.bestMonths}).</p>

<h2>Consejos de seguridad y logística</h2>
<p>Nunca manejes de noche en carreteras estatales; lleva efectivo suficiente para casetas y pueblos pequeños; revisa el estado del camino en aplicaciones oficiales; y contrata seguro de viaje con cobertura amplia. Si tu auto es rentado, fotografía el vehículo al entregarlo. Y lleva siempre snacks, agua y cargador portátil: en carretera, estos pequeños detalles marcan la diferencia.</p>`,
    author: 'Equipo Rutas en MX',
    datePublished: '2026-02-12',
    dateModified: '2026-04-08',
    relatedPlaceSlugs: [],
    relatedRouteSlugs: [],
    tags: ['road trip', state.name.toLowerCase(), 'carretera', 'itinerario', 'viaje en auto'],
  };
}

function buildCultureGuide(state: MockState, spec: StateGuideSpec, idx: number): MockArticle {
  return {
    id: `sg-${String(idx).padStart(3, '0')}`,
    slug: `cultura-y-tradiciones-${state.slug}`,
    title: `Cultura y tradiciones de ${state.name}: historia, fiestas y artesanías`,
    description: `Conoce la cultura de ${state.name}: fiestas patronales, artesanías, música, herencia prehispánica y colonial, y los mejores festivales del año.`,
    image: state.image,
    content: `<h2>El ADN cultural de ${state.name}</h2>
<p>${state.name} es un estado donde la historia está presente en cada plaza, cada mercado y cada festividad. Herencia prehispánica, influencia española y sincretismos contemporáneos conviven en un mosaico cultural único. En esta guía te compartimos las claves para entender y vivir esa cultura más allá de los sitios turísticos tradicionales.</p>

<h2>Tradiciones vivas</h2>
<p>Si quieres conectar con la cultura del estado, acércate a ${listToText(spec.culture)}. Muchas de estas tradiciones se celebran en fechas específicas, así que vale la pena revisar el calendario turístico antes de planear tu viaje. Participar como visitante respetuoso —no solo observar— es la mejor manera de apreciar la riqueza cultural.</p>

<h2>Artesanías y arte popular</h2>
<p>Las artesanías de ${state.name} son reconocidas a nivel nacional por su calidad y simbolismo. Comprar directamente en los talleres apoya a las familias artesanas y asegura precio justo. Pregunta por el origen del proceso, los materiales y el simbolismo; detrás de cada pieza hay una historia.</p>

<h2>Fiestas patronales y festivales</h2>
<p>Las fiestas patronales son ventanas al alma del estado: procesiones, danzas, gastronomía ritual y música tradicional se concentran en pocos días de celebración. Algunos festivales en ${state.name} han cobrado fama nacional e internacional, y combinan patrimonio con oferta cultural contemporánea. Reserva hospedaje con mucha anticipación.</p>

<h2>Música y danza</h2>
<p>Desde ritmos antiguos hasta fusiones modernas, la música de ${state.name} tiene identidad propia. Busca encuentros en vivo, plazas públicas con bandas municipales, o conciertos en casas culturales: muchas veces, las mejores experiencias musicales son gratuitas y no aparecen en redes sociales.</p>

<h2>Cómo viajar con sensibilidad cultural</h2>
<p>Respeta los espacios ceremoniales y los tiempos rituales; pide permiso antes de fotografiar personas o interiores; aprende algunas frases en la lengua originaria local si la hay; y compra productos locales. Un viaje cultural bien vivido regresa al anfitrión al menos una parte de lo que te llevas como experiencia.</p>`,
    author: 'Equipo Rutas en MX',
    datePublished: '2026-02-18',
    dateModified: '2026-04-10',
    relatedPlaceSlugs: [],
    relatedRouteSlugs: [],
    tags: ['cultura', state.name.toLowerCase(), 'tradiciones', 'fiestas', 'artesanías'],
  };
}

function buildThreeDayGuide(state: MockState, spec: StateGuideSpec, idx: number): MockArticle {
  return {
    id: `sg-${String(idx).padStart(3, '0')}`,
    slug: `tres-dias-en-${state.slug}`,
    title: `3 días en ${state.name}: itinerario detallado por hora`,
    description: `Itinerario de 3 días por ${state.name} con horarios sugeridos, lugares imperdibles, restaurantes y consejos hora por hora.`,
    image: state.image,
    content: `<h2>Itinerario de 3 días en ${state.name}</h2>
<p>Si tienes un fin de semana largo y quieres aprovecharlo al máximo, este itinerario está diseñado para que conozcas lo esencial de ${state.name} sin sobrecargar agenda. Cada día está pensado para terminar a buena hora, dormir bien y salir descansado al siguiente.</p>

<h2>Día 1: ${spec.capital} a fondo</h2>
<p>Mañana (9:00-13:00): Desayuno en fonda tradicional, recorrido por el centro histórico de ${spec.capital}, catedral y plaza principal. Busca ${spec.gastronomy[0]} en el menú.</p>
<p>Tarde (14:00-18:00): Comida regional en restaurante con tradición, visita a uno o dos museos clave, caminata por los barrios antiguos. Reserva un espacio para un café de especialidad.</p>
<p>Noche: Cena ligera y descanso. Si hay vida nocturna o eventos culturales, asóma nomás; el día siguiente arranca temprano.</p>

<h2>Día 2: ${spec.flagship[0]} completo</h2>
<p>Mañana (7:30-12:00): Salida temprano hacia ${spec.flagship[0]} (manejo de 1-3 horas según el estado). Llega a tiempo para recorrerlo con calma. Desayuno de carretera o al llegar.</p>
<p>Tarde (12:00-17:00): Comida local (prueba ${spec.gastronomy[1] || spec.gastronomy[0]}), recorrido por atractivos y, si te alcanza, visita al vecino ${spec.flagship[1]}.</p>
<p>Noche: Cena en ${spec.flagship[0]} y pernocta ahí o regresa a ${spec.capital} según plan. Si la región es segura, paseo nocturno por la plaza.</p>

<h2>Día 3: naturaleza y regreso</h2>
<p>Mañana (8:00-13:00): Actividad en la naturaleza — ${spec.nature[0]} o ${spec.nature[1] || spec.nature[0]}. Lleva zapatos adecuados, agua y protección solar. Contrata guía local si la actividad lo requiere.</p>
<p>Tarde (13:00-17:00): Comida en el camino de regreso, parada en algún pueblo intermedio para compra de artesanías o despedirte con merienda regional.</p>
<p>Noche: Llegada a casa o al siguiente destino.</p>

<h2>Presupuesto aproximado por persona</h2>
<p>Hospedaje medio: $1,200 a $2,500 MXN por noche. Comidas: $300 a $800 MXN por comida fuerte. Transporte: combustible y casetas variables. Entradas y actividades: $100 a $600 MXN. Presupuesto total orientativo (sin viaje en avión): $7,000 a $15,000 MXN por persona para 3 días.</p>

<h2>Qué llevar</h2>
<p>Ropa cómoda, capas para variaciones de clima, calzado para caminar y para terreno natural, bloqueador y sombrero, efectivo (muchos pueblos no aceptan tarjeta), identificación oficial y copias digitales de documentos importantes.</p>`,
    author: 'Equipo Rutas en MX',
    datePublished: '2026-02-25',
    dateModified: '2026-04-12',
    relatedPlaceSlugs: [],
    relatedRouteSlugs: [],
    tags: ['itinerario', state.name.toLowerCase(), '3 días', 'fin de semana largo', 'viaje'],
  };
}

function buildHowToGetGuide(state: MockState, spec: StateGuideSpec, idx: number): MockArticle {
  return {
    id: `sg-${String(idx).padStart(3, '0')}`,
    slug: `como-llegar-a-${state.slug}`,
    title: `Cómo llegar a ${state.name}: carretera, avión y consejos`,
    description: `Todas las formas de llegar a ${state.name}: rutas por carretera desde las principales ciudades, aeropuertos, tiempos de manejo y consejos prácticos.`,
    image: state.image,
    content: `<h2>Cómo llegar a ${state.name}</h2>
<p>${state.name} está bien conectado con el resto del país tanto por carretera como por vuelo. Capital: ${spec.capital}. En esta guía te compartimos las rutas más comunes, tiempos realistas de manejo, aeropuertos principales y todos los detalles logísticos que marcan la diferencia entre un viaje fluido y uno complicado.</p>

<h2>Por carretera desde la CDMX</h2>
<p>Desde la Ciudad de México, el tiempo aproximado a ${spec.capital} es de ${spec.drivingFromCDMX}. Toma siempre en cuenta el tráfico de salida (evita horas pico de viernes) y revisa el estado del camino en aplicaciones oficiales antes de partir. Lleva tanque lleno, efectivo para casetas, botiquín básico y cargador de celular.</p>

<h2>Por avión</h2>
<p>El aeropuerto principal es ${spec.airport}. Desde varios hubs del país (CDMX, Guadalajara, Monterrey, Cancún) hay vuelos directos diarios. Si llegas por aire, rentar auto en el aeropuerto es la forma más práctica de moverte por el estado, ya que el transporte público entre pueblos es limitado.</p>

<h2>Autobús</h2>
<p>México tiene una red de autobuses foráneos de excelente calidad. ADO, ETN, Primera Plus, TAP y otras líneas conectan ${spec.capital} con casi cualquier ciudad del país. Los autobuses de clase ejecutiva o de lujo incluyen baño, entretenimiento y asientos reclinables: para tramos largos, son una alternativa cómoda al auto.</p>

<h2>Consideraciones por temporada</h2>
<p>Los mejores meses para visitar ${state.name} son ${spec.bestMonths}. Evita los puentes vacacionales largos si puedes: precios suben, carreteras se saturan y hospedaje se escasea. Si viajas en temporada alta, reserva todo con anticipación: hospedaje, vuelos y hasta mesas en restaurantes populares.</p>

<h2>Seguridad vial</h2>
<p>Nunca manejes de noche en carreteras estatales; respeta los límites de velocidad (hay retenes); si te paran, mantén la calma y conserva copias digitales de tus documentos; lleva seguro vehicular con cobertura amplia; en caso de emergencia, 911 funciona en todo el país.</p>

<h2>Dentro del estado</h2>
<p>Una vez en ${state.name}, moverte entre ${listToText(spec.flagship.slice(0, 3))} implica entre 30 minutos y 3 horas de manejo dependiendo del destino. Para viajes cortos, Uber o Didi funcionan en ${spec.capital}. Para viajes entre pueblos, auto propio o rentado es la mejor opción. Contrata guías locales para actividades específicas en naturaleza o zonas arqueológicas.</p>`,
    author: 'Equipo Rutas en MX',
    datePublished: '2026-03-02',
    dateModified: '2026-04-15',
    relatedPlaceSlugs: [],
    relatedRouteSlugs: [],
    tags: ['cómo llegar', state.name.toLowerCase(), 'transporte', 'carretera', 'aeropuerto'],
  };
}

// ---------------------------------------------------------------------------
// Generador maestro
// ---------------------------------------------------------------------------

export function buildGeneratedGuides(): MockArticle[] {
  const guides: MockArticle[] = [];
  let idx = 100;

  for (const state of mockStates) {
    const spec = stateSpecs[state.slug];
    if (!spec) continue;

    guides.push(buildOverviewGuide(state, spec, idx++));
    guides.push(buildPueblosMagicosGuide(state, spec, idx++));
    guides.push(buildGastronomyGuide(state, spec, idx++));
    guides.push(buildRoadTripGuide(state, spec, idx++));
    guides.push(buildCultureGuide(state, spec, idx++));
    guides.push(buildThreeDayGuide(state, spec, idx++));
    guides.push(buildHowToGetGuide(state, spec, idx++));
  }

  return guides;
}

// También exportamos el mapa de estado -> guías para helpers de UI
export function getStateGuideSlug(stateSlug: string): string[] {
  const slugs: string[] = [
    `que-hacer-en-${stateSlug}`,
    `pueblos-magicos-${stateSlug}`,
    `gastronomia-${stateSlug}`,
    `road-trip-${stateSlug}`,
    `cultura-y-tradiciones-${stateSlug}`,
    `tres-dias-en-${stateSlug}`,
    `como-llegar-a-${stateSlug}`,
  ];
  return slugs;
}

// Helper para detectar estado desde slug generado
export function getStateSlugFromGuideSlug(guideSlug: string): string | null {
  for (const state of mockStates) {
    const candidates = getStateGuideSlug(state.slug);
    if (candidates.includes(guideSlug)) {
      return state.slug;
    }
  }
  return null;
}

// Dummy usage of slugify para evitar warning (se usa si hay que normalizar)
export { slugify };
