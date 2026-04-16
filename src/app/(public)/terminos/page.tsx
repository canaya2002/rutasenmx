import type { Metadata } from 'next';
import Link from 'next/link';
import { buildPageMetadata } from '@/lib/seo/metadata';
import { buildBreadcrumbs } from '@/lib/seo/breadcrumbs';
import { buildBreadcrumbSchema } from '@/lib/seo/schema';
import { JsonLd } from '@/components/seo/JsonLd';

const PAGE_PATH = '/terminos';
const PAGE_TITLE = 'Terminos de servicio';
const PAGE_DESCRIPTION =
  'Terminos y condiciones de uso de la plataforma Rutas en MX. Lee las reglas que rigen el uso de nuestros servicios de planificacion de viajes.';

export function generateMetadata(): Metadata {
  return buildPageMetadata({
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    path: PAGE_PATH,
    noIndex: true,
  });
}

export default function TerminosPage() {
  const breadcrumbs = buildBreadcrumbs([{ label: 'Terminos de servicio', href: PAGE_PATH }]);
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
            Terminos de servicio
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-zinc-600">
            Al acceder y utilizar Rutas en MX aceptas estos terminos de servicio. Te recomendamos
            leerlos con atencion antes de usar nuestra plataforma.
          </p>
          <p className="mt-2 text-sm text-zinc-500">
            Ultima actualizacion: 16 de abril de 2026
          </p>
        </header>

        <div className="space-y-10">
          {/* 1. Aceptacion */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              1. Aceptacion de los terminos
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Estos terminos de servicio (&quot;Terminos&quot;) constituyen un acuerdo legal entre
              tu (&quot;Usuario&quot;) y Rutas en MX (&quot;Nosotros&quot;, &quot;la
              Plataforma&quot;). Al crear una cuenta, navegar por el sitio web o utilizar cualquiera
              de nuestros servicios, aceptas cumplir con estos Terminos y con nuestra{' '}
              <Link href="/privacidad" className="text-blue-600 hover:underline">
                politica de privacidad
              </Link>
              .
            </p>
            <p className="mt-4 text-zinc-600 leading-7">
              Si no estas de acuerdo con estos Terminos, no debes utilizar la Plataforma.
            </p>
          </section>

          {/* 2. Descripcion del servicio */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              2. Descripcion del servicio
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Rutas en MX es una plataforma de planificacion de viajes por carretera en Mexico que
              ofrece:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>
                Un directorio de destinos turisticos incluyendo{' '}
                <Link
                  href="/pueblos-magicos"
                  className="text-blue-600 hover:underline"
                >
                  Pueblos Magicos
                </Link>
                ,{' '}
                <Link href="/museos" className="text-blue-600 hover:underline">
                  museos
                </Link>{' '}
                y{' '}
                <Link
                  href="/zonas-arqueologicas"
                  className="text-blue-600 hover:underline"
                >
                  zonas arqueologicas
                </Link>
                .
              </li>
              <li>Herramientas de planificacion de rutas e itinerarios.</li>
              <li>Guias de viaje y contenido editorial.</li>
              <li>Informacion sobre costos, distancias y tiempos de recorrido.</li>
            </ul>
          </section>

          {/* 3. Cuentas de usuario */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              3. Cuentas de usuario
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Para acceder a ciertas funcionalidades es necesario crear una cuenta. Al hacerlo te
              comprometes a:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>Proporcionar informacion veraz y actualizada.</li>
              <li>Mantener la confidencialidad de tus credenciales de acceso.</li>
              <li>Notificarnos de cualquier uso no autorizado de tu cuenta.</li>
              <li>No crear mas de una cuenta por persona.</li>
            </ul>
            <p className="mt-4 text-zinc-600 leading-7">
              Nos reservamos el derecho de suspender o cancelar cuentas que violen estos Terminos.
            </p>
          </section>

          {/* 4. Uso aceptable */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              4. Uso aceptable
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Al usar la Plataforma te comprometes a no:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>
                Realizar scraping, mineria de datos o extraccion automatizada de contenido sin
                autorizacion escrita.
              </li>
              <li>
                Intentar acceder a areas restringidas del sistema o vulnerar medidas de seguridad.
              </li>
              <li>Utilizar el servicio para fines ilegales o no autorizados.</li>
              <li>
                Publicar contenido ofensivo, difamatorio, falso o que infrinja derechos de
                terceros.
              </li>
              <li>
                Sobrecargar intencionalmente la infraestructura del servicio.
              </li>
              <li>
                Suplantar la identidad de otra persona o entidad.
              </li>
            </ul>
          </section>

          {/* 5. Propiedad intelectual */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              5. Propiedad intelectual
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              El contenido de la Plataforma, incluyendo textos, diseno, logotipos, iconografia y
              codigo fuente, es propiedad de Rutas en MX o se utiliza bajo licencia. Los datos
              provenientes de fuentes gubernamentales se utilizan conforme a las politicas de datos
              abiertos del gobierno de Mexico. Consulta nuestra pagina de{' '}
              <Link
                href="/fuentes-de-datos"
                className="text-blue-600 hover:underline"
              >
                fuentes de datos
              </Link>{' '}
              para mas informacion.
            </p>
            <p className="mt-4 text-zinc-600 leading-7">
              Los itinerarios y rutas que crees son de tu propiedad. Al publicar contenido en la
              Plataforma (resenas, fotos, comentarios), nos otorgas una licencia no exclusiva,
              mundial y libre de regalias para utilizarlo con fines de mejora del servicio.
            </p>
          </section>

          {/* 6. Planes y pagos */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              6. Planes y pagos
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Rutas en MX ofrece un plan gratuito y planes de pago con funcionalidades adicionales.
              Consulta los detalles en la pagina de{' '}
              <Link href="/precios" className="text-blue-600 hover:underline">
                precios
              </Link>
              . Al contratar un plan de pago:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>
                Los pagos se procesan a traves de Stripe y estan sujetos a sus terminos de
                servicio.
              </li>
              <li>
                Las suscripciones se renuevan automaticamente al final de cada periodo, salvo que
                canceles antes.
              </li>
              <li>
                Los precios estan en pesos mexicanos (MXN) e incluyen IVA cuando corresponda.
              </li>
              <li>
                Puedes cancelar tu suscripcion en cualquier momento. El acceso al plan pagado se
                mantendra hasta el final del periodo ya pagado.
              </li>
            </ul>
          </section>

          {/* 7. Limitacion de responsabilidad */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              7. Limitacion de responsabilidad
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              La informacion proporcionada en la Plataforma tiene fines informativos y de
              planificacion. Aunque nos esforzamos por mantener datos precisos y actualizados:
            </p>
            <ul className="mt-3 list-disc space-y-2 pl-6 text-zinc-600">
              <li>
                No garantizamos la exactitud, integridad o vigencia de la informacion sobre
                destinos, horarios, precios o condiciones de las carreteras.
              </li>
              <li>
                No somos responsables de danos, perdidas o inconvenientes derivados del uso de la
                informacion de la Plataforma.
              </li>
              <li>
                Recomendamos siempre verificar la informacion directamente con las autoridades
                locales antes de emprender un viaje.
              </li>
              <li>
                Los tiempos y costos estimados son aproximados y pueden variar segun las
                condiciones reales.
              </li>
            </ul>
          </section>

          {/* 8. Disponibilidad */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              8. Disponibilidad del servicio
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Nos esforzamos por mantener la Plataforma disponible las 24 horas, los 7 dias de la
              semana. Sin embargo, no garantizamos disponibilidad ininterrumpida. Podemos realizar
              mantenimiento programado o experimentar interrupciones por causas ajenas a nuestro
              control.
            </p>
          </section>

          {/* 9. Modificaciones */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              9. Modificaciones a los terminos
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Podemos modificar estos Terminos en cualquier momento. Los cambios significativos se
              comunicaran a traves de la Plataforma o por correo electronico con al menos 15 dias de
              anticipacion. El uso continuado de la Plataforma despues de las modificaciones implica
              la aceptacion de los nuevos Terminos.
            </p>
          </section>

          {/* 10. Ley aplicable */}
          <section>
            <h2 className="text-2xl font-bold text-zinc-900">
              10. Ley aplicable y jurisdiccion
            </h2>
            <p className="mt-4 text-zinc-600 leading-7">
              Estos Terminos se rigen por las leyes de los Estados Unidos Mexicanos. Cualquier
              controversia derivada de estos Terminos se sometera a la jurisdiccion de los
              tribunales competentes en la Ciudad de Mexico, renunciando las partes a cualquier otro
              fuero que pudiera corresponderles.
            </p>
          </section>

          {/* 11. Contacto */}
          <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
            <h2 className="text-xl font-bold text-zinc-900">
              Preguntas sobre estos terminos?
            </h2>
            <p className="mt-2 text-zinc-600">
              Si tienes dudas sobre nuestros terminos de servicio, contactanos.
            </p>
            <div className="mt-4 flex flex-wrap gap-4">
              <a
                href="mailto:soporte@rutasenmx.com"
                className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              >
                soporte@rutasenmx.com
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
