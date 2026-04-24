# 02 — Base de datos productiva

**Bloquea:** todo endpoint que no sea estático. Actualmente `.env.local` apunta a `localhost:5432` — **eso no va a deployar**.

## Recomendación: Neon (Postgres serverless)

- Plan free: 3 GB, suficiente para los primeros ~1,000 usuarios activos.
- PostGIS preinstalado, solo hay que `CREATE EXTENSION postgis;`.
- SSL por default.
- URL se copia lista para pegar en `DATABASE_URL`.

Alternativas equivalentes: Supabase, Railway, Render, AWS RDS (más trabajo).

## Pasos, en orden exacto

1. **Crear la DB**
   - [ ] Crear cuenta Neon → proyecto "rutasenmx-prod"
   - [ ] Copiar el connection string (con `?sslmode=require`)
   - [ ] Pegarlo en `DATABASE_URL` de Vercel (ver `01-PROD-SECRETS.md`)

2. **Activar PostGIS** (requerido — varias queries lo usan)
   ```sql
   CREATE EXTENSION IF NOT EXISTS postgis;
   CREATE EXTENSION IF NOT EXISTS postgis_topology;
   CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- uuid_generate_v4 fallback
   ```
   Corre esto en la consola SQL de Neon / el cliente que uses. **Si no, `db:push` falla.**

3. **Schema migration**
   ```bash
   # Apunta DATABASE_URL a prod y corre:
   npm run db:push
   ```
   Esto crea las 38 tablas definidas en `src/db/schema.ts` incluyendo `push_tokens`, `mobile_subscriptions`, `social_*`, etc.

4. **Seed del catálogo**
   ```bash
   npm run seed              # pueblos mágicos, zonas arqueológicas, museos
   npm run seed:plans        # free / pro / premium
   npm run seed:communities  # 8 foros + 1 canal
   ```
   Estos scripts son idempotentes — correrlos dos veces no duplica.

5. **Crear al menos un usuario admin**
   ```sql
   -- Después del primer registro a través de /registrarse:
   UPDATE users SET role = 'admin' WHERE email = 'tuemail@tudominio.com';
   ```

## Pool size

El código usa `POSTGRES_POOL_SIZE` (default 1) a propósito para evitar agotar conexiones serverless. Si vas a escalar Vercel con muchas funciones concurrentes:

- En Neon: activa **connection pooling** (pgbouncer endpoint, URL termina en `-pooler.`).
- En el app: set `POSTGRES_POOL_SIZE=1` siempre. El pooling lo hace Neon.

## Validación post-deploy

```bash
# El endpoint /api/health hace un SELECT 1 y mide latencia
curl https://rutasenmx.com/api/health | jq
# Esperado: { "ok": true, "db": "up", "dbLatencyMs": 50-200 }
```

Si `dbLatencyMs > 400` consistente, la DB está en otra región que Vercel — mueve una de las dos.

## Backups

Neon hace snapshots cada hora en el plan pago ($19/mes) y retiene 7 días en free.
Para backups extra (recomendado una vez que tengas usuarios pagando):

```bash
# Backup manual:
pg_dump "$DATABASE_URL" > backup-$(date +%Y-%m-%d).sql.gz
```
