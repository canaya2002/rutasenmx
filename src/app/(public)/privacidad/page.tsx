import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';

const PAGE_PATH = '/privacidad';
const PAGE_TITLE = 'Politica de privacidad';
const PAGE_DESCRIPTION =
  'Conoce como Rutas en MX recopila, utiliza y protege tu informacion personal. Politica de privacidad, cookies y datos analiticos.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    noIndex: true,
  });
}

export default function PrivacidadPage() {
  const breadcrumbs = buildBreadcrumbs([{ label: 'Privacidad', href: PAGE_PATH }]);
  const breadcrumbSchema = buildBreadcrumbSchema(breadcrumbs);

  return (
    <>
      <JsonLd data={breadcrumbSchema} />

      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8 text-sm text-zinc-500">
          <ol className="flex items-center gap-2">
            {breadcrumbs.map((item, idx) => (
              <li key={item.href} className="flex items-center gap-2">
                {idx > 0 && <span aria-hidden="true">/</span>}
                {idx === breadcrumbs.length - 1 ? (
                  <span className="text-zinc-900">{item.label}</span>
                ) : (
                  <Link href={item.href} className="hover:text-zinc-900">
                    {item.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Politica de privacidad
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            En Rutas en MX nos tomamos en serio la privacidad de nuestros usuarios. Esta politica
            explica que informacion recopilamos, como la usamos y que derechos tienes sobre tus
            datos.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Ultima actualizacion: 16 de abril de 2026
          </p>
        </header>

        <div className="prose prose-zinc max-w-none space-y-10">
          {/* Responsable */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              1. Responsable del tratamiento de datos
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              El responsable del tratamiento de tus datos personales es Rutas en MX, con domicilio
              en Mexico y contacto a traves de{' '}
              <a
                href="mailto:privacidad@rutasenmx.com"
                className="text-blue-600 hover:underline"
              >
                privacidad@rutasenmx.com
              </a>
              . Operamos el sitio web{' '}
              <Link href="/" className="text-blue-600 hover:underline">
                rutasenmx.com
              </Link>{' '}
              y sus servicios asociados.
            </p>
          </section>

          {/* Datos que recopilamos */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              2. Informacion que recopilamos
            </h2>

            <h3 className="mt-6 text-lg font-semibold text-zinc-900">
              2.1 Informacion que nos proporcionas directamente
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>
                <strong>Cuenta de usuario:</strong> al crear una cuenta, recopilamos tu nombre,
                direccion de correo electronico y contrasena (almacenada de forma cifrada).
              </li>
              <li>
                <strong>Viajes guardados:</strong> las rutas e itinerarios que crees dentro de la
                plataforma se almacenan asociados a tu cuenta.
              </li>
              <li>
                <strong>Formulario de contacto:</strong> nombre, correo electronico y el contenido
                del mensaje que nos envies a traves de la pagina de{' '}
                <Link href="/contacto" className="text-blue-600 hover:underline">
                  contacto
                </Link>
                .
              </li>
            </ul>

            <h3 className="mt-6 text-lg font-semibold text-zinc-900">
              2.2 Informacion recopilada automaticamente
            </h3>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>
                <strong>Datos de navegacion:</strong> direccion IP, tipo de navegador, sistema
                operativo, paginas visitadas, tiempo de permanencia y URL de referencia.
              </li>
              <li>
                <strong>Datos de ubicacion aproximada:</strong> si autorizas el acceso a tu
                ubicacion para funciones del mapa, solo la usamos en el momento y no la almacenamos
                en nuestros servidores.
              </li>
              <li>
                <strong>Datos del dispositivo:</strong> tipo de dispositivo, resolucion de pantalla
                e idioma del navegador, utilizados para mejorar la experiencia de usuario.
              </li>
            </ul>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              3. Cookies y tecnologias similares
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Utilizamos cookies y tecnologias similares para los siguientes propositos:
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="border-b border-zinc-200">
                    <th className="py-3 pr-4 font-semibold text-zinc-900">
                      Tipo
                    </th>
                    <th className="py-3 pr-4 font-semibold text-zinc-900">
                      Proposito
                    </th>
                    <th className="py-3 font-semibold text-zinc-900">
                      Duracion
                    </th>
                  </tr>
                </thead>
                <tbody className="text-zinc-600">
                  <tr className="border-b border-zinc-100">
                    <td className="py-3 pr-4 font-medium">Esenciales</td>
                    <td className="py-3 pr-4">
                      Mantener tu sesion iniciada, recordar preferencias de idioma y tema.
                    </td>
                    <td className="py-3">Sesion / 1 ano</td>
                  </tr>
                  <tr className="border-b border-zinc-100">
                    <td className="py-3 pr-4 font-medium">Analiticas</td>
                    <td className="py-3 pr-4">
                      Entender como los usuarios interactuan con la plataforma para mejorar el
                      servicio. Utilizamos herramientas de analisis web que generan estadisticas
                      agregadas.
                    </td>
                    <td className="py-3">Hasta 2 anos</td>
                  </tr>
                  <tr>
                    <td className="py-3 pr-4 font-medium">Funcionales</td>
                    <td className="py-3 pr-4">
                      Recordar tus preferencias de filtro, destinos favoritos y configuracion del
                      planificador de viajes.
                    </td>
                    <td className="py-3">1 ano</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-zinc-600 leading-7">
              No utilizamos cookies de publicidad ni compartimos datos con redes publicitarias.
              Puedes gestionar las cookies desde la configuracion de tu navegador.
            </p>
          </section>

          {/* Uso de los datos */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              4. Como usamos tu informacion
            </h2>
            <ul className="mt-4 list-disc space-y-2 pl-6 text-zinc-600">
              <li>Proporcionar, mantener y mejorar nuestros servicios.</li>
              <li>Guardar y sincronizar tus viajes e itinerarios entre dispositivos.</li>
              <li>Responder a tus consultas y solicitudes de soporte.</li>
              <li>
                Generar estadisticas agregadas y anonimas sobre el uso de la plataforma.
              </li>
              <li>Prevenir fraude, abuso y actividades no autorizadas.</li>
              <li>Cumplir con obligaciones legales aplicables.</li>
            </ul>
          </section>

          {/* Compartir datos */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              5. Con quien compartimos tu informacion
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              No vendemos ni alquilamos tu informacion personal a terceros. Solo compartimos datos
              en los siguientes casos:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>
                <strong>Proveedores de servicio:</strong> empresas que nos ayudan a operar la
                plataforma (alojamiento web, procesamiento de pagos, envio de correos), que solo
                procesan datos siguiendo nuestras instrucciones.
              </li>
              <li>
                <strong>Requerimientos legales:</strong> cuando sea necesario para cumplir con una
                obligacion legal, proceso judicial o solicitud gubernamental.
              </li>
              <li>
                <strong>Proteccion de derechos:</strong> para proteger los derechos, propiedad o
                seguridad de Rutas en MX, nuestros usuarios o el publico.
              </li>
            </ul>
          </section>

          {/* Seguridad */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              6. Seguridad de los datos
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Implementamos medidas de seguridad tecnicas y organizativas para proteger tu
              informacion, incluyendo cifrado en transito (HTTPS/TLS), cifrado de contrasenas,
              control de acceso basado en roles y monitoreo continuo. Sin embargo, ningun sistema es
              100% seguro y no podemos garantizar la seguridad absoluta de los datos.
            </p>
          </section>

          {/* Derechos ARCO */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              7. Tus derechos (derechos ARCO)
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              De acuerdo con la Ley Federal de Proteccion de Datos Personales en Posesion de los
              Particulares (LFPDPPP), tienes derecho a:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>
                <strong>Acceso:</strong> conocer que datos personales tenemos sobre ti.
              </li>
              <li>
                <strong>Rectificacion:</strong> solicitar la correccion de datos inexactos.
              </li>
              <li>
                <strong>Cancelacion:</strong> pedir la eliminacion de tus datos.
              </li>
              <li>
                <strong>Oposicion:</strong> oponerte al tratamiento de tus datos para fines
                especificos.
              </li>
            </ul>
            <p className="mt-4 text-zinc-600 leading-7">
              Para ejercer cualquiera de estos derechos, envía un correo a{' '}
              <a
                href="mailto:privacidad@rutasenmx.com"
                className="text-blue-600 hover:underline"
              >
                privacidad@rutasenmx.com
              </a>{' '}
              con tu solicitud. Responderemos en un plazo maximo de 20 dias habiles.
            </p>
          </section>

          {/* Retencion */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              8. Retencion de datos
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Conservamos tu informacion personal mientras tu cuenta este activa o mientras sea
              necesario para proporcionarte nuestros servicios. Si solicitas la eliminacion de tu
              cuenta, borraremos tus datos personales en un plazo de 30 dias, salvo aquellos que
              debamos conservar por obligacion legal.
            </p>
          </section>

          {/* Menores */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              9. Menores de edad
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Nuestros servicios no estan dirigidos a menores de 13 anos. No recopilamos
              intencionalmente informacion personal de menores. Si descubrimos que hemos recopilado
              datos de un menor sin consentimiento parental, los eliminaremos de inmediato.
            </p>
          </section>

          {/* Cambios */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              10. Cambios a esta politica
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Podemos actualizar esta politica periodicamente. Cuando realicemos cambios
              significativos, te notificaremos a traves de un aviso en la plataforma o por correo
              electronico. Te recomendamos revisar esta pagina regularmente.
            </p>
          </section>

          {/* Contacto */}
          <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
            <h2 className="text-xl font-bold text-zinc-900">
              Preguntas sobre privacidad?
            </h2>
            <p className="mt-2 text-zinc-600">
              Si tienes dudas sobre como manejamos tu informacion, no dudes en contactarnos.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <a
                href="mailto:privacidad@rutasenmx.com"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                privacidad@rutasenmx.com
              </a>
              <Link
                href="/contacto"
                className="inline-block rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Formulario de contacto
              </Link>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
