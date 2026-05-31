# Panel admin interno (#17) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir el panel interno `/admin` para listar eventos con saldos, marcar eventos sospechosos (bloqueando sus retiros) y editar la configuración de monetización sin desplegar código.

**Architecture:** Server Components bajo `/admin` + server actions, gateados por una allowlist de correos (env `ADMIN_EMAILS`). La lógica de dominio vive en módulos puros y testeables (`acceso`, `configEscritura`, guarda de retiros); las lecturas/escrituras admin usan el cliente `service_role` para saltar RLS. Reutiliza `resumenDashboard` para los saldos.

**Tech Stack:** Next.js 16 (App Router, server actions), Supabase (Postgres + Auth, RLS), Vitest, TypeScript.

**Convención de pruebas:** TDD estricto — primero la prueba que falla, luego el código mínimo. Tres módulos puros se prueban (`esAdmin`, `aFilasConfig`, `puedeRetirar`); las pages/acciones y los lectores de DB son orquestación delgada, verificados con `pnpm build` + humo manual (igual que el resto del panel del festejado).

**Comandos del proyecto:** `pnpm test` (vitest run), `pnpm build` (Next/Turbopack — correr antes de mergear; tsc/tests no cazan errores de imports relativos `.js`).

---

## Estructura de archivos

- Crear `src/admin/acceso.ts` — `esAdmin(email, allowlist)` + `obtenerAllowlistAdmin()` (puro/env).
- Crear `src/admin/acceso.test.ts` — pruebas de `esAdmin`.
- Crear `src/retiros/guarda.ts` — `puedeRetirar(evento)` (puro).
- Crear `src/retiros/guarda.test.ts` — pruebas de `puedeRetirar`.
- Crear `src/admin/configEscritura.ts` — `aFilasConfig(entrada)` (puro, valida + serializa).
- Crear `src/admin/configEscritura.test.ts` — pruebas de `aFilasConfig`.
- Crear `supabase/migrations/20260530210000_evento_sospechoso.sql` — columnas `sospechoso` + `nota_admin`.
- Crear `src/admin/eventos.ts` — `listarEventosAdmin(db)` + `marcarSospechoso(db, id, valor)` (orquestación DB).
- Crear `src/admin/exigirAdmin.ts` — gate server-side que devuelve cliente `service_role`.
- Modificar `src/middleware.ts` — proteger `/admin/:path*`.
- Crear `src/app/admin/acciones.ts` — server actions `alternarSospechoso`, `guardarConfig`.
- Crear `src/app/admin/page.tsx` — lista de eventos + toggle.
- Crear `src/app/admin/config/page.tsx` — formulario de monetización.
- Modificar `src/app/dashboard/mesa/[slug]/retirar/acciones.ts` — bloquear retiro si sospechoso.
- Modificar `README.md` — documentar `ADMIN_EMAILS`.

---

## Task 1: Módulo de acceso admin (allowlist)

**Files:**
- Create: `src/admin/acceso.ts`
- Test: `src/admin/acceso.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/admin/acceso.test.ts
import { test, expect } from "vitest";
import { esAdmin } from "./acceso";

test("acepta un correo presente en la allowlist", () => {
  expect(esAdmin("cris@pp.com", "cris@pp.com,otro@pp.com")).toBe(true);
});

test("es case-insensitive y tolera espacios", () => {
  expect(esAdmin("  CRIS@PP.com ", "cris@pp.com")).toBe(true);
  expect(esAdmin("cris@pp.com", " CRIS@PP.COM , otro@pp.com ")).toBe(true);
});

test("rechaza un correo fuera de la allowlist", () => {
  expect(esAdmin("intruso@pp.com", "cris@pp.com")).toBe(false);
});

test("allowlist vacía o correo nulo ⇒ false", () => {
  expect(esAdmin("cris@pp.com", "")).toBe(false);
  expect(esAdmin(null, "cris@pp.com")).toBe(false);
  expect(esAdmin(undefined, "cris@pp.com")).toBe(false);
  expect(esAdmin("", "cris@pp.com")).toBe(false);
});

test("ignora entradas vacías de la lista (comas colgantes)", () => {
  expect(esAdmin("cris@pp.com", "cris@pp.com,,")).toBe(true);
  expect(esAdmin("", "a@pp.com,,b@pp.com")).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/admin/acceso.test.ts`
Expected: FAIL — `esAdmin` no existe / no se puede importar.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/admin/acceso.ts

/** Determina si un correo pertenece a la allowlist de administradores.
 *  La allowlist viene de ADMIN_EMAILS (correos separados por comas). */
export function esAdmin(email: string | null | undefined, allowlist: string): boolean {
  if (!email) return false;
  const objetivo = email.trim().toLowerCase();
  if (!objetivo) return false;
  const permitidos = allowlist
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
  return permitidos.includes(objetivo);
}

/** Lee la allowlist de administradores del entorno (vacía si no está). */
export function obtenerAllowlistAdmin(): string {
  return process.env.ADMIN_EMAILS ?? "";
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/admin/acceso.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/admin/acceso.ts src/admin/acceso.test.ts
git commit -m "feat(admin): allowlist de acceso por correo (esAdmin) (#17)"
```

---

## Task 2: Guarda de retiros (bloqueo por sospechoso)

**Files:**
- Create: `src/retiros/guarda.ts`
- Test: `src/retiros/guarda.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/retiros/guarda.test.ts
import { test, expect } from "vitest";
import { puedeRetirar } from "./guarda";

test("permite retirar de un evento no sospechoso", () => {
  expect(puedeRetirar({ sospechoso: false })).toBe(true);
});

test("bloquea el retiro de un evento sospechoso", () => {
  expect(puedeRetirar({ sospechoso: true })).toBe(false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/retiros/guarda.test.ts`
Expected: FAIL — `puedeRetirar` no existe.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/retiros/guarda.ts

export interface EventoRetirable {
  sospechoso: boolean;
}

/** Un evento marcado como sospechoso tiene los retiros bloqueados. */
export function puedeRetirar(evento: EventoRetirable): boolean {
  return !evento.sospechoso;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/retiros/guarda.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/retiros/guarda.ts src/retiros/guarda.test.ts
git commit -m "feat(retiros): guarda puedeRetirar (bloquea si sospechoso) (#17)"
```

---

## Task 3: Escritura de config de monetización

**Files:**
- Create: `src/admin/configEscritura.ts`
- Test: `src/admin/configEscritura.test.ts`

Nota: `FilaConfig` ya existe en `src/config/monetizacion.ts` (`{ clave: string; valor: string }`). El precio Premium se guarda en **centavos** (clave `precio_premium_centavos`) pero el formulario lo captura en **pesos**; la conversión vive aquí.

- [ ] **Step 1: Write the failing test**

```ts
// src/admin/configEscritura.test.ts
import { test, expect } from "vitest";
import { aFilasConfig } from "./configEscritura";

const valida = {
  comisionBasePct: 5,
  comisionPremiumPct: 3,
  precioPremiumPesos: 499,
  absorcionPreMarcada: true,
  ventanaRetencionDias: 7,
};

test("serializa una config válida a filas clave/valor", () => {
  const filas = aFilasConfig(valida);
  const mapa = Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
  expect(mapa).toEqual({
    comision_base_pct: "5",
    comision_premium_pct: "3",
    precio_premium_centavos: "49900", // pesos → centavos
    absorcion_pre_marcada: "true",
    ventana_retencion_dias: "7",
  });
});

test("serializa absorción desmarcada como 'false'", () => {
  const filas = aFilasConfig({ ...valida, absorcionPreMarcada: false });
  const mapa = Object.fromEntries(filas.map((f) => [f.clave, f.valor]));
  expect(mapa.absorcion_pre_marcada).toBe("false");
});

test("rechaza porcentajes negativos", () => {
  expect(() => aFilasConfig({ ...valida, comisionBasePct: -1 })).toThrow();
});

test("rechaza valores no numéricos", () => {
  expect(() => aFilasConfig({ ...valida, precioPremiumPesos: NaN })).toThrow();
});

test("rechaza una ventana de retención no entera", () => {
  expect(() => aFilasConfig({ ...valida, ventanaRetencionDias: 2.5 })).toThrow();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/admin/configEscritura.test.ts`
Expected: FAIL — `aFilasConfig` no existe.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/admin/configEscritura.ts
import type { FilaConfig } from "@/config/monetizacion";

/** Entrada del formulario admin (precio Premium en pesos, no centavos). */
export interface EntradaConfigMonetizacion {
  comisionBasePct: number;
  comisionPremiumPct: number;
  precioPremiumPesos: number;
  absorcionPreMarcada: boolean;
  ventanaRetencionDias: number;
}

function exigirNoNegativo(clave: string, n: number): number {
  if (!Number.isFinite(n) || n < 0) {
    throw new Error(`Valor inválido para "${clave}": debe ser un número ≥ 0`);
  }
  return n;
}

/** Valida y serializa la config de monetización a filas clave/valor para upsert
 *  en la tabla `configuracion`. Inverso de interpretarConfigMonetizacion. */
export function aFilasConfig(entrada: EntradaConfigMonetizacion): FilaConfig[] {
  exigirNoNegativo("comision_base_pct", entrada.comisionBasePct);
  exigirNoNegativo("comision_premium_pct", entrada.comisionPremiumPct);
  exigirNoNegativo("precio_premium_centavos", entrada.precioPremiumPesos);
  if (!Number.isInteger(entrada.ventanaRetencionDias) || entrada.ventanaRetencionDias < 0) {
    throw new Error('Valor inválido para "ventana_retencion_dias": debe ser un entero ≥ 0');
  }

  return [
    { clave: "comision_base_pct", valor: String(entrada.comisionBasePct) },
    { clave: "comision_premium_pct", valor: String(entrada.comisionPremiumPct) },
    { clave: "precio_premium_centavos", valor: String(Math.round(entrada.precioPremiumPesos * 100)) },
    { clave: "absorcion_pre_marcada", valor: entrada.absorcionPreMarcada ? "true" : "false" },
    { clave: "ventana_retencion_dias", valor: String(entrada.ventanaRetencionDias) },
  ];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/admin/configEscritura.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/admin/configEscritura.ts src/admin/configEscritura.test.ts
git commit -m "feat(admin): valida y serializa config de monetización (#17)"
```

---

## Task 4: Migración — columnas `sospechoso` + `nota_admin`

**Files:**
- Create: `supabase/migrations/20260530210000_evento_sospechoso.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260530210000_evento_sospechoso.sql
-- Marca de fraude administrada desde el panel interno (#17).
-- La escritura ocurre server-side con service_role (salta RLS); no se
-- agregan políticas nuevas. La lectura pública existente sigue igual.
alter table eventos
  add column sospechoso boolean not null default false,
  add column nota_admin text;
```

- [ ] **Step 2: Apply the migration**

Run: `pnpm dlx supabase db push`
(Si el dev usa el MCP de Supabase: `apply_migration` con name `evento_sospechoso` y el SQL de arriba.)
Expected: la migración aplica sin error; `eventos` ahora tiene `sospechoso` y `nota_admin`.

- [ ] **Step 3: Verify the columns exist**

Run: `pnpm dlx supabase migration list` (o consulta `select column_name from information_schema.columns where table_name='eventos';`)
Expected: aparece `20260530210000` aplicada; columnas `sospechoso`, `nota_admin` presentes.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260530210000_evento_sospechoso.sql
git commit -m "feat(db): columnas sospechoso/nota_admin en eventos (#17)"
```

---

## Task 5: Lector de eventos admin + marcar sospechoso

**Files:**
- Create: `src/admin/eventos.ts`

Orquestación de DB (sin prueba unitaria; se verifica con `pnpm build` + humo manual en Task 10). Reutiliza `itemsDeMesa`/`aportacionesConfirmadas` (`src/lib/datos-mesa.ts`), `obtenerConfigMonetizacion` y `resumenDashboard`.

- [ ] **Step 1: Write the module**

```ts
// src/admin/eventos.ts
import type { SupabaseClient } from "@supabase/supabase-js";
import { itemsDeMesa, aportacionesConfirmadas } from "@/lib/datos-mesa";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import { resumenDashboard } from "@/dashboard/resumen";
import type { AportacionAsentada } from "@/pagos/webhook";
import type { DefinicionItem } from "@/ledger/ledger";
import type { MetodoPago } from "@/dominio/tipos";

interface EventoRow {
  id: string;
  slug: string;
  titulo: string;
  festejado_id: string;
  sospechoso: boolean;
  nota_admin: string | null;
}

export interface EventoAdmin {
  id: string;
  slug: string;
  titulo: string;
  festejadoEmail: string;
  saldoTotal: number; // centavos
  retirable: number; // centavos
  retenido: number; // centavos
  nAportaciones: number;
  sospechoso: boolean;
  notaAdmin: string | null;
}

/** Lista TODOS los eventos (cross-festejado) con sus saldos para el panel admin.
 *  Requiere un cliente service_role (salta RLS y puede leer auth.users). */
export async function listarEventosAdmin(db: SupabaseClient): Promise<EventoAdmin[]> {
  const { data } = await db
    .from("eventos")
    .select("id, slug, titulo, festejado_id, sospechoso, nota_admin")
    .order("creado_en", { ascending: false });
  const eventos = (data ?? []) as unknown as EventoRow[];

  const { data: usuarios } = await db.auth.admin.listUsers();
  const emailPorId = new Map((usuarios?.users ?? []).map((u) => [u.id, u.email ?? "—"]));

  const config = await obtenerConfigMonetizacion();
  const ahora = Date.now();

  const filas: EventoAdmin[] = [];
  for (const e of eventos) {
    const [items, aps] = await Promise.all([
      itemsDeMesa(db, e.id),
      aportacionesConfirmadas(db, e.id),
    ]);

    const definiciones: DefinicionItem[] = items.map((it) => ({
      id: it.id,
      montoMeta: it.monto_meta_centavos,
    }));
    const asentadas: AportacionAsentada[] = aps.map((a) => ({
      cobroId: a.id,
      itemId: a.item_id,
      monto: a.monto_centavos,
      metodoPago: a.metodo_pago as MetodoPago,
      fecha: new Date(a.creado_en).getTime(),
      nombre: a.nombre_invitado,
      mensaje: a.mensaje ?? "",
    }));

    const r = resumenDashboard(definiciones, asentadas, ahora, {
      ventanaRetencionDias: config.ventanaRetencionDias,
    });

    filas.push({
      id: e.id,
      slug: e.slug,
      titulo: e.titulo,
      festejadoEmail: emailPorId.get(e.festejado_id) ?? "—",
      saldoTotal: r.saldoTotal,
      retirable: r.retirable,
      retenido: r.retenido,
      nAportaciones: asentadas.length,
      sospechoso: e.sospechoso,
      notaAdmin: e.nota_admin,
    });
  }

  return filas;
}

/** Marca o desmarca un evento como sospechoso (fija el valor explícito). */
export async function marcarSospechoso(
  db: SupabaseClient,
  eventoId: string,
  valor: boolean,
): Promise<void> {
  const { error } = await db.from("eventos").update({ sospechoso: valor }).eq("id", eventoId);
  if (error) throw new Error(`No se pudo actualizar el evento: ${error.message}`);
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores en `src/admin/eventos.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/admin/eventos.ts
git commit -m "feat(admin): lector de eventos con saldos + marcar sospechoso (#17)"
```

---

## Task 6: Gate server-side `exigirAdmin` + middleware

**Files:**
- Create: `src/admin/exigirAdmin.ts`
- Modify: `src/middleware.ts`

- [ ] **Step 1: Write the gate helper**

```ts
// src/admin/exigirAdmin.ts
import { redirect } from "next/navigation";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { crearClienteServidor } from "@/lib/supabase/server";
import { esAdmin, obtenerAllowlistAdmin } from "./acceso";

/**
 * Exige que el usuario logueado sea admin (allowlist). Defensa en profundidad
 * sobre el middleware: cada page/action admin lo llama. Devuelve un cliente
 * Supabase con service_role listo para operar (salta RLS).
 *   - sin sesión               → redirige a /login
 *   - sesión fuera de allowlist → redirige a /dashboard
 */
export async function exigirAdmin() {
  const auth = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user) redirect("/login");
  if (!esAdmin(user.email, obtenerAllowlistAdmin())) redirect("/dashboard");
  return crearClienteServidor();
}
```

- [ ] **Step 2: Extend the middleware to protect `/admin`**

Modificar `src/middleware.ts`. Añadir el import arriba:

```ts
import { esAdmin, obtenerAllowlistAdmin } from "@/admin/acceso";
```

Reemplazar el bloque del guard de `/dashboard` (el `if (!user && ...)`) por:

```ts
  const ruta = request.nextUrl.pathname;

  if (ruta.startsWith("/admin")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    if (!esAdmin(user.email, obtenerAllowlistAdmin())) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
  }

  if (!user && ruta.startsWith("/dashboard")) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }
```

Y actualizar el matcher al final del archivo:

```ts
export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
```

- [ ] **Step 3: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/admin/exigirAdmin.ts src/middleware.ts
git commit -m "feat(admin): gate exigirAdmin + middleware protege /admin (#17)"
```

---

## Task 7: Server actions del panel admin

**Files:**
- Create: `src/app/admin/acciones.ts`

- [ ] **Step 1: Write the actions**

```ts
// src/app/admin/acciones.ts
"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/admin/exigirAdmin";
import { marcarSospechoso } from "@/admin/eventos";
import { aFilasConfig, type EntradaConfigMonetizacion } from "@/admin/configEscritura";

/** Marca/desmarca un evento como sospechoso (valor explícito, idempotente). */
export async function alternarSospechoso(eventoId: string, valor: boolean) {
  const db = await exigirAdmin();
  await marcarSospechoso(db, eventoId, valor);
  revalidatePath("/admin");
}

/** Guarda la configuración de monetización desde el formulario admin. */
export async function guardarConfig(formData: FormData) {
  const db = await exigirAdmin();

  const entrada: EntradaConfigMonetizacion = {
    comisionBasePct: Number(formData.get("comision_base_pct")),
    comisionPremiumPct: Number(formData.get("comision_premium_pct")),
    precioPremiumPesos: Number(formData.get("precio_premium_pesos")),
    absorcionPreMarcada: formData.get("absorcion_pre_marcada") === "on",
    ventanaRetencionDias: Number(formData.get("ventana_retencion_dias")),
  };

  const filas = aFilasConfig(entrada); // lanza si algo es inválido (no escribe parcial)

  const { error } = await db
    .from("configuracion")
    .upsert(filas.map((f) => ({ clave: f.clave, valor: f.valor })), { onConflict: "clave" });
  if (error) throw new Error(`No se pudo guardar la configuración: ${error.message}`);

  revalidatePath("/admin/config");
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/acciones.ts
git commit -m "feat(admin): acciones alternarSospechoso y guardarConfig (#17)"
```

---

## Task 8: Página `/admin` (lista de eventos + toggle)

**Files:**
- Create: `src/app/admin/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/app/admin/page.tsx
import Link from "next/link";
import { exigirAdmin } from "@/admin/exigirAdmin";
import { listarEventosAdmin } from "@/admin/eventos";
import { alternarSospechoso } from "./acciones";

const pesos = (centavos: number) =>
  (centavos / 100).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

export default async function PanelAdmin() {
  const db = await exigirAdmin();
  const eventos = await listarEventosAdmin(db);

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 980 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.8rem" }}>Panel admin</h1>
          <p className="muted" style={{ marginTop: "0.25rem" }}>{eventos.length} eventos</p>
        </div>
        <Link href="/admin/config" className="btn btn-primario">Configuración</Link>
      </header>

      {eventos.length === 0 ? (
        <p className="muted">Aún no hay eventos.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th style={{ padding: "0.5rem" }}>Mesa</th>
                <th style={{ padding: "0.5rem" }}>Festejado</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Total</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Retirable</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Retenido</th>
                <th style={{ padding: "0.5rem", textAlign: "right" }}>Aport.</th>
                <th style={{ padding: "0.5rem" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {eventos.map((e) => (
                <tr key={e.id} style={{ borderBottom: "1px solid #f0f0f0", background: e.sospechoso ? "#fff5f5" : undefined }}>
                  <td style={{ padding: "0.5rem" }}>
                    <Link href={`/${e.slug}`} target="_blank" rel="noopener">{e.titulo}</Link>
                    <div className="muted" style={{ fontSize: "0.8rem" }}>/{e.slug}</div>
                  </td>
                  <td style={{ padding: "0.5rem" }}>{e.festejadoEmail}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{pesos(e.saldoTotal)}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{pesos(e.retirable)}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{pesos(e.retenido)}</td>
                  <td style={{ padding: "0.5rem", textAlign: "right" }}>{e.nAportaciones}</td>
                  <td style={{ padding: "0.5rem" }}>
                    <form action={alternarSospechoso.bind(null, e.id, !e.sospechoso)}>
                      <button type="submit" className="btn" style={{ fontSize: "0.8rem" }}>
                        {e.sospechoso ? "🚩 Quitar marca" : "Marcar sospechoso"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat(admin): página de lista de eventos con saldos y toggle (#17)"
```

---

## Task 9: Página `/admin/config` (formulario de monetización)

**Files:**
- Create: `src/app/admin/config/page.tsx`

- [ ] **Step 1: Write the page**

```tsx
// src/app/admin/config/page.tsx
import Link from "next/link";
import { exigirAdmin } from "@/admin/exigirAdmin";
import { obtenerConfigMonetizacion } from "@/config/obtenerConfigMonetizacion";
import { guardarConfig } from "../acciones";

export default async function ConfigAdmin() {
  await exigirAdmin();
  const config = await obtenerConfigMonetizacion();

  return (
    <main className="contenedor" style={{ paddingTop: "2rem", paddingBottom: "4rem", maxWidth: 520 }}>
      <Link href="/admin" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>← Volver al panel</Link>
      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem", marginBottom: "1.5rem" }}>Configuración de monetización</h1>

      <form action={guardarConfig} style={{ display: "grid", gap: "1rem" }}>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Comisión base (%)
          <input type="number" name="comision_base_pct" step="0.1" min="0" defaultValue={config.comisionBasePct} required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Comisión Premium (%)
          <input type="number" name="comision_premium_pct" step="0.1" min="0" defaultValue={config.comisionPremiumPct} required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Precio Premium (pesos)
          <input type="number" name="precio_premium_pesos" step="1" min="0" defaultValue={config.precioPremium / 100} required />
        </label>
        <label style={{ display: "grid", gap: "0.35rem" }}>
          Ventana de retención (días)
          <input type="number" name="ventana_retencion_dias" step="1" min="0" defaultValue={config.ventanaRetencionDias} required />
        </label>
        <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          <input type="checkbox" name="absorcion_pre_marcada" defaultChecked={config.absorcionPreMarcada} />
          Casilla de absorción pre-marcada en checkout
        </label>
        <button type="submit" className="btn btn-primario">Guardar</button>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/config/page.tsx
git commit -m "feat(admin): página de edición de config de monetización (#17)"
```

---

## Task 10: Bloquear retiros de eventos sospechosos

**Files:**
- Modify: `src/app/dashboard/mesa/[slug]/retirar/acciones.ts`

- [ ] **Step 1: Add the import**

Añadir junto a los imports existentes:

```ts
import { puedeRetirar } from "@/retiros/guarda";
```

- [ ] **Step 2: Extend the mesa load to include `sospechoso`**

En `solicitarRetiro`, reemplazar:

```ts
  const { supabase, user, evento } = await cargarMesaDelFestejado<{
    id: string;
    festejado_id: string;
  }>(slug, "id, festejado_id");
```

por:

```ts
  const { supabase, user, evento } = await cargarMesaDelFestejado<{
    id: string;
    festejado_id: string;
    sospechoso: boolean;
  }>(slug, "id, festejado_id, sospechoso");

  if (!puedeRetirar(evento)) {
    throw new Error("Esta mesa está en revisión; los retiros están temporalmente bloqueados.");
  }
```

- [ ] **Step 3: Run the suite + typecheck**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: todas las pruebas PASS, sin errores de tipos.

- [ ] **Step 4: Commit**

```bash
git add "src/app/dashboard/mesa/[slug]/retirar/acciones.ts"
git commit -m "feat(retiros): bloquea retiro de mesas sospechosas (#17)"
```

---

## Task 11: README, verificación final y cierre

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

- [ ] **Step 1: Documentar la variable de entorno**

Añadir a `.env.example` (el README delega ahí la lista de variables):

```bash
# Correos de administradores (separados por comas). Quien inicie sesión con un
# correo de esta lista ve el panel interno en /admin. Sin valor ⇒ sin acceso admin.
ADMIN_EMAILS=
```

Y una línea en la sección "Variables de entorno" del `README.md` (tras la mención de `NOMBRE_MARCA`/`URL_BASE`):

```markdown
`ADMIN_EMAILS` (correos separados por comas) define quién ve el panel interno `/admin`.
```

Asegurarse de que `ADMIN_EMAILS` esté configurada en Vercel (Production) y en `.env.local` para desarrollo.

- [ ] **Step 2: Verificación completa**

Run: `pnpm test`
Expected: toda la suite PASS (incluye los 12 tests nuevos: acceso 5, guarda 2, configEscritura 5).

Run: `pnpm build`
Expected: build de Turbopack exitoso (cazaría imports relativos `.js` rotos — aquí se usan alias `@/`, así que debe pasar limpio).

- [ ] **Step 3: Humo manual**

1. Con tu correo en `ADMIN_EMAILS`, inicia sesión y entra a `/admin`: ves la lista de eventos con saldos.
2. Marca un evento como sospechoso → la fila se resalta; intenta retirar de esa mesa como festejado → error de "mesa en revisión".
3. Quita la marca → el retiro vuelve a funcionar.
4. Entra a `/admin/config`, cambia la comisión base, guarda → el checkout refleja el nuevo valor.
5. Sin sesión o con un correo fuera de la lista, `/admin` redirige (a `/login` o `/dashboard` respectivamente).

- [ ] **Step 4: Commit + cerrar issue**

```bash
git add README.md .env.example
git commit -m "docs: documenta ADMIN_EMAILS para el panel admin (#17)"
gh issue close 17 -c "✅ Panel admin interno implementado: lista de eventos con saldos, marcar sospechoso (bloquea retiros), y edición de config de monetización. Acceso por allowlist ADMIN_EMAILS."
```

---

## Self-Review (completado al escribir el plan)

- **Cobertura del spec:** acceso por allowlist → T1+T6; flag sospechoso → T4 (migración) + T5 (escritura) + T8 (UI); bloqueo de retiros → T2+T10; edición de config → T3+T7+T9; lista de eventos con saldos → T5+T8; gate server-side → T6; pruebas (esAdmin/aFilasConfig/puedeRetirar) → T1/T3/T2; env var → T11. Sin huecos.
- **Consistencia de tipos:** `FilaConfig` reutilizado de `config/monetizacion.ts`; `AportacionAsentada` (cobroId, itemId, monto, metodoPago, fecha, nombre, mensaje) coincide con `pagos/webhook.ts`; `DefinicionItem` {id, montoMeta} coincide con `ledger.ts`; `EntradaConfigMonetizacion` usada igual en T3, T7. `exigirAdmin()` devuelve cliente service_role usado consistentemente en T7/T8/T9.
- **Sin placeholders:** todos los pasos de código traen el código completo.
