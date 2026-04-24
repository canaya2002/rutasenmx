# 15 — Trabajo futuro (no bloquea lanzamiento)

Cosas que detecté durante la auditoría que NO son necesarias para el día 1 pero que vale la pena atacar pronto.

## Prioridad ALTA (primer mes post-launch)

### A. Account deletion backend real
Ver `14-COULD-NOT-VERIFY.md` #10. Hoy el mobile linkea al web con `?delete=1` pero el flujo web puede no estar implementado. Blueprint:

```typescript
// src/app/api/account/route.ts
export async function DELETE() {
  const session = await getSession();
  if (!session) return unauthorized();

  // Soft delete inmediato
  await db.update(users).set({
    email: `deleted-${session.userId}@deleted.local`,
    name: 'Cuenta eliminada',
    passwordHash: null,
    deletedAt: new Date(),
  }).where(eq(users.id, session.userId));

  // Cancela Stripe si hay
  const sub = await getActiveStripeSubscription(session.userId);
  if (sub) await stripe.subscriptions.cancel(sub.stripeSubscriptionId);

  // Encola hard delete a 30 días
  await db.insert(deletionQueue).values({
    userId: session.userId,
    scheduledFor: addDays(new Date(), 30),
  });

  await clearSession();
  return NextResponse.json({ ok: true });
}
```

Necesitarás:
- Nueva columna `deletedAt` en `users`
- Tabla `deletion_queue`
- Cron job (Vercel Cron) que procesa la cola diaria

### B. Email verification
Hoy registras con cualquier email y ya. Deberías:
- Mandar token a email en registro
- Bloquear features sensibles (Autopilot, suscripción) hasta verificar
- `emailVerifiedAt` column en `users`

### C. Rate limiting distribuido
Hoy `src/lib/auth/rate-limit.ts` usa memoria local — en Vercel serverless cada función tiene su propia memoria, así que el límite real es `60 req/min × N_instances`. Para rate limit serio:
- Upstash Redis + `@upstash/ratelimit`
- O Vercel KV (igual, Redis under the hood)

### D. Content moderation automática
Hoy solo bloqueas keywords en `src/lib/social/text-validator.ts`. Antes del primer troll activa **Sightengine** (fotos) + **OpenAI moderation** (texto):
- [Sightengine](https://sightengine.com) — ~$50/mes para 100k checks
- OpenAI moderation API es gratis

### E. Export CSV de datos (GDPR / LFPDPPP)
Los usuarios tienen derecho ARCO. Endpoint:
```
GET /api/account/export → ZIP con JSON de toda su data
```

## Prioridad MEDIA (mes 2-3)

### F. Onboarding mobile
El mobile hoy te manda directo a Home después del registro. Sería mejor:
- Carousel de 3 slides (Autopilot / Social / Offline)
- Permission requests justificados (location, notifications) en momento apropiado, no al inicio
- Crear perfil social opcional en onboarding

### G. Búsqueda mobile
`/search` en web existe, en mobile no. Añadir tab "Explorar" con buscador.

### H. Internacionalización
El app está todo en español. Cuando quieras expandir a US/LatAm:
- `i18n/` ya existe en `src/lib/i18n/locales/`
- Mobile necesitaría `expo-localization` (ya está instalado) + `i18n-js`

### I. Performance: images
Hoy usas `expo-image` (bueno) pero no tienes thumbnails. Un `lugar` con foto de 4MB tarda en cargar. Sube al CDN en 3 tamaños (thumb/med/full).

### J. Accessibility pass 2
Ya añadí labels básicos. Falta:
- `accessibilityHint` en todas las pressables críticas (no solo role)
- Dynamic Type support (hoy todos los Text usan tamaños fijos — respetar `allowFontScaling`)
- High-contrast mode

## Prioridad BAJA (nice to have)

### K. Ticket/helpdesk
Hoy `/ayuda` es un link a una página estática. Cuando tengas >500 usuarios:
- Intercom / Crisp.chat
- O una tabla `support_tickets` y un `/admin/tickets` dashboard

### L. Referral program
"Invita a un amigo → ambos obtienen 1 mes Pro gratis". Clásico growth hack, necesita:
- Tabla `referral_codes`
- Lógica de atribución
- Campaña de email

### M. Widgets iOS (iOS 14+)
"Próximo viaje" widget en home screen. Expo SDK 54 los soporta con `expo-widgets` (beta).

### N. Apple Watch
Mostrar "siguiente parada" en el reloj durante un road trip. Nicho pero alguien lo amará.

### O. CarPlay / Android Auto
Integración con navegación del carro. Necesita módulo nativo, NO Expo Go.

### P. Compartir viaje públicamente
Ya hay `src/app/(public)/compartido/[token]/page.tsx` scaffold con TODOs. Implementarlo.

### Q. Blog / guías SEO
Ya tienes `src/app/guias/*` scaffold. Llenarlo con 20-30 artículos es la mejor inversión de tráfico orgánico para un travel SaaS.
