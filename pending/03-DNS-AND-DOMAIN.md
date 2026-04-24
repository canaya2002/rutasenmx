# 03 — DNS y dominio

**Bloquea:** cualquier URL pública, emails transaccionales (SPF/DKIM), Universal Links de iOS, App Links de Android.

## Dominio

- [ ] Registrar `rutasenmx.com` (si no está ya) — Namecheap, Cloudflare Registrar, Google Domains. ~$12/año.
- [ ] Añadir en Vercel: `Project → Settings → Domains → Add rutasenmx.com`.

## DNS records (en tu registrador o Cloudflare)

| Tipo | Host | Valor | Propósito |
|---|---|---|---|
| A | `@` | `76.76.21.21` | Vercel apex (mira tu dashboard para el valor exacto) |
| CNAME | `www` | `cname.vercel-dns.com` | redirect `www` → apex |
| TXT | `@` | (de Vercel / Search Console) | verificación |
| MX | `@` | (de SendGrid / Resend / Postmark) | recibir emails |
| TXT | `@` | `v=spf1 include:sendgrid.net ~all` | SPF (ajusta provider) |
| TXT | `s1._domainkey` | (de tu proveedor SMTP) | DKIM |
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:dmarc@rutasenmx.com` | DMARC policy (empieza con `none`) |

## Universal Links (iOS)

iOS requiere servir `/.well-known/apple-app-site-association` desde `https://rutasenmx.com`. **Ya hay soporte en `app.json`** (`associatedDomains: ['applinks:rutasenmx.com']`), pero el archivo lo tienes que hostear tú.

Crea `public/.well-known/apple-app-site-association` con:

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAMID.com.rutasenmx.app",
        "paths": [
          "/lugares/*",
          "/rutas/*",
          "/mis-viajes/*",
          "/comunidad/*",
          "/categoria/*",
          "/precios",
          "/suscripcion",
          "/planear"
        ]
      }
    ]
  }
}
```

- Reemplaza `TEAMID` con tu Apple Team ID (lo ves en `developer.apple.com/account → Membership`).
- Debe servirse con `content-type: application/json` y SIN autenticación.
- Apple cachea esto hasta 48h — test con `branch.io/resources/aasa-validator/`.

## App Links (Android)

El `app.json` ya declara el `intentFilter` con `autoVerify: true`. Android exige un archivo en `https://rutasenmx.com/.well-known/assetlinks.json`:

```json
[
  {
    "relation": ["delegate_permission/common.handle_all_urls"],
    "target": {
      "namespace": "android_app",
      "package_name": "com.rutasenmx.app",
      "sha256_cert_fingerprints": ["AA:BB:CC:..."]
    }
  }
]
```

`sha256_cert_fingerprints` sale de EAS después del primer build:
```bash
eas credentials -p android
# Copia el SHA-256 fingerprint del Upload Keystore
```

Valida con `https://digitalassetlinks.googleapis.com/v1/statements:list?source.web.site=https://rutasenmx.com`.

## Test end-to-end

1. Post-deploy, tap en iPhone a un link `https://rutasenmx.com/lugares/teotihuacan` desde Messages (no Safari — Safari no abre Universal Links desde la misma página).
2. El app debe abrir directamente en `/lugar/teotihuacan`.
3. Si abre Safari en su lugar: AASA mal servido. Revisa Content-Type + contenido.
4. Android: `adb shell am start -W -a android.intent.action.VIEW -d "https://rutasenmx.com/rutas/cdmx-a-oaxaca" com.rutasenmx.app`.
