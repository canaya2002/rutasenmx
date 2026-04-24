# 05 — Email transaccional

**Bloquea:** emails de bienvenida, reset de contraseña, notificaciones de match fuera de app, recibos de Stripe con tu branding.

## Elige un provider

| Provider | Free tier | Notas |
|---|---|---|
| **Resend** | 3,000 emails/mes | API-first, el más simple. Recomendado. |
| SendGrid | 100/día | SMTP clásico. |
| Postmark | 100/mes | Excelente deliverability. |
| AWS SES | $0.10/1000 | El más barato a escala. Requiere sacarte del sandbox. |

## Pasos (ejemplo con Resend)

1. **Cuenta** — `resend.com/signup`.
2. **Añadir dominio** — `Domains → Add Domain → rutasenmx.com`. Te va a dar 3 records DNS:
   - TXT SPF (`v=spf1 include:spf.resend.com ~all`)
   - CNAME DKIM (`resend._domainkey.rutasenmx.com`)
   - TXT para MX (si quieres recibir también)
3. **Pegar en DNS** — ver `03-DNS-AND-DOMAIN.md`. Verifica dentro del dashboard — tarda 5-30 min.
4. **API key** — `API Keys → Create`. Permisos: "Sending only".
5. **Env vars** (Vercel):
   ```
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_USER=resend
   SMTP_PASSWORD=re_your_api_key
   EMAIL_FROM=hola@rutasenmx.com
   ```

## Templates

El código actual dispara emails desde `src/lib/providers/email.ts`. Por ahora el único flujo cableado es **password reset** (si lo implementaste) y los recibos los maneja Stripe automáticamente.

Templates que valdría la pena añadir (futuro, no bloqueador):
- Bienvenida después de registro
- "Tu viaje está listo" después de Autopilot
- "Match nuevo con {{name}}" digest diario
- "Confirma tu email" (actualmente no hay verificación de email)

## Test post-deploy

```bash
# Usa el endpoint /api/auth/forgot-password (si existe) o la feature que sea
curl -X POST https://rutasenmx.com/api/auth/forgot-password \
  -H "content-type: application/json" \
  -d '{"email":"tu@email.com"}'
# Debe llegar el email dentro de 10 seg.
```

Si no llega: Resend → Logs → busca por email → muestra exactamente por qué rebotó.

## SPF/DKIM/DMARC — no saltes esto

Emails desde un dominio sin SPF+DKIM van al spam de Gmail. Después de pegar los DNS, verifica:

```bash
dig TXT rutasenmx.com +short
dig TXT resend._domainkey.rutasenmx.com +short
dig TXT _dmarc.rutasenmx.com +short
```

O usa `mail-tester.com` — manda un email a la dirección que te da y te califica del 1 al 10. Target: ≥ 9/10.
