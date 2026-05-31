# RegalaLove

Plataforma de **mesas de regalos en efectivo** para eventos (bodas como mercado inicial). El festejado crea una mesa con lista de deseos; los invitados aportan dinero sin necesidad de cuenta; todo se convierte en saldo flexible que el festejado retira a su cuenta. Cobro y dispersión vía EcartPay.

Ver el [PRD](./PRD.md) para el detalle del producto.

## Stack

- **Next.js** (App Router) + React — web mobile-first
- **Supabase** — Postgres, Auth, Realtime
- **Vitest** — pruebas
- **EcartPay** — cobro y dispersión (pendiente de integrar)
- Despliegue en **Vercel**

## Requisitos

- Node 20+ y **pnpm**
- Un proyecto de **Supabase** (las credenciales van en `.env.local`)

## Desarrollo

```bash
pnpm install
cp .env.example .env.local   # y rellenar las credenciales de Supabase
pnpm dev                     # http://localhost:3000
```

### Variables de entorno

Ver [`.env.example`](./.env.example). La marca y la URL base (`NOMBRE_MARCA`, `URL_BASE`) viven en configuración, no en el código. `ADMIN_EMAILS` (correos separados por comas) define quién ve el panel interno `/admin`.

## Pruebas

```bash
pnpm test          # corre todas las pruebas una vez
pnpm test:watch    # modo watch
pnpm exec tsc --noEmit   # typecheck
```

Los módulos de dinero (`src/ledger`, `src/fees`, `src/retencion`) están construidos con TDD y cubiertos por pruebas.

## Despliegue

Se despliega en Vercel conectando este repositorio. Las variables de entorno se configuran en el panel de Vercel (mismas que `.env.local`).

## Estructura

```
src/
  app/         # Next.js App Router (páginas)
  config/      # capa de configuración (marca, URL base)
  dominio/     # tipos de dominio compartidos
  ledger/      # Motor de Saldo y Aportaciones (TDD)
  fees/        # Motor de Comisiones (TDD)
  retencion/   # Retención parcial: retirable vs retenido (TDD)
  lib/supabase/# clientes de Supabase (navegador y servidor)
```
