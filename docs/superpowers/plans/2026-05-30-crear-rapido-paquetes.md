# "Crear rápido" — Paquetes de mesa prearmados · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir crear una mesa eligiendo un paquete prearmado de regalos (curado por Regalove) que copia esos regalos —editables— a la mesa, además del flujo manual actual.

**Architecture:** Dos tablas nuevas en Supabase (`paquetes`, `paquete_items`) que referencian el catálogo existente, sembradas por migración. Un nuevo punto de entrada `/dashboard/crear` con dos caminos (rápido/manual). El flujo rápido usa un Server Action que copia los `paquete_items` a `items_mesa`. La lógica de monto vive en funciones puras testeadas en `src/paquetes/`.

**Tech Stack:** Next.js 16 (App Router, Server Actions), Supabase (Postgres + RLS), Vitest, TypeScript.

**Branch:** `feat/crear-rapido-paquetes` (ya creada).

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `supabase/migrations/20260530000000_crear_tabla_paquetes.sql` | Tablas `paquetes`/`paquete_items`, RLS, seed de 8 paquetes | Crear |
| `src/paquetes/armar.ts` | Funciones puras: `armarItemsDesdePaquete`, `totalPaquete` | Crear |
| `src/paquetes/armar.test.ts` | Pruebas Vitest de las funciones puras | Crear |
| `src/app/dashboard/acciones.ts` | Extraer `crearEventoBase`; refactor `crearEvento`; nuevo `crearEventoConPaquete` | Modificar |
| `src/app/dashboard/crear/page.tsx` | Pantalla chooser (rápido / manual) | Crear |
| `src/app/dashboard/crear/rapido/page.tsx` | Listado de 8 paquetes + form de creación | Crear |
| `src/app/dashboard/crear/manual/page.tsx` | Form título+tipo (flujo actual reubicado) | Crear |
| `src/app/dashboard/page.tsx` | Reemplazar form inline por botón "+ Crear mesa" | Modificar |

---

## Task 1: Migración — tablas, RLS y seed de 8 paquetes

**Files:**
- Create: `supabase/migrations/20260530000000_crear_tabla_paquetes.sql`

- [ ] **Step 1: Escribir la migración completa**

Crear `supabase/migrations/20260530000000_crear_tabla_paquetes.sql` con este contenido exacto:

```sql
-- Paquetes prearmados de mesa, curados por Regalove. Cada paquete agrupa una
-- lista fija de regalos del catálogo con su cantidad. El total NO se persiste:
-- se calcula al vuelo como Σ(precio_catálogo × cantidad).
create table paquetes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,
  descripcion text,
  tipo        text not null default 'boda',
  orden       integer not null default 0,
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

create table paquete_items (
  id               uuid primary key default gen_random_uuid(),
  paquete_id       uuid not null references paquetes (id) on delete cascade,
  catalogo_item_id uuid not null references catalogo_items (id) on delete cascade,
  cantidad         integer not null default 1 check (cantidad > 0)
);

create index paquete_items_paquete_id_idx on paquete_items (paquete_id);

alter table paquetes enable row level security;
alter table paquete_items enable row level security;

-- Lectura pública: cualquiera lista los paquetes en el chooser. La escritura la
-- hace Regalove (service role / migraciones), sin políticas para usuarios.
create policy "lectura publica de paquetes"
  on paquetes for select
  using (true);

create policy "lectura publica de paquete_items"
  on paquete_items for select
  using (true);

-- ----------------------------------------------------------------------------
-- Seed: 8 paquetes en escalera (~$45k → ~$500k). Cada bloque inserta el paquete
-- y luego sus ítems, haciendo match por nombre contra catalogo_items (los UUID
-- del catálogo son aleatorios, no se pueden hardcodear).
-- ----------------------------------------------------------------------------

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Mesa Esencial', 'Lo básico para empezar tu hogar', 'boda', 1) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Batería de cocina', 2), ('Vajilla de 12 piezas', 2), ('Juego de sábanas', 2),
  ('Edredón king size', 2), ('Almohadas (par)', 2), ('Cafetera espresso', 1),
  ('Licuadora', 1), ('Microondas', 1), ('Aspiradora', 1), ('Mesa de centro', 1),
  ('Lámpara de piso', 2), ('Juego de cuchillos', 1), ('Juego de copas', 2)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Cocina & Mesa', 'Todo para cocinar y recibir invitados', 'boda', 2) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Batería de cocina', 3), ('Juego de cuchillos', 2), ('Cafetera espresso', 2),
  ('Vajilla de 12 piezas', 4), ('Juego de copas', 4), ('Comedor de 6 sillas', 1),
  ('Licuadora', 2), ('Microondas', 2), ('Aspiradora', 1), ('Mesa de centro', 1)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Luna de miel', 'Hotel, cenas y experiencias para celebrar', 'boda', 3) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Noche de hotel', 6), ('Cena romántica', 6), ('Excursión', 6),
  ('Vajilla de 12 piezas', 2), ('Juego de copas', 2), ('Cafetera espresso', 1),
  ('Batería de cocina', 1), ('Edredón king size', 2), ('Juego de sábanas', 2),
  ('Mesa de centro', 1), ('Lámpara de piso', 2)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Mesa Completa', 'Una mezcla amplia de todas las áreas del hogar', 'boda', 4) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Batería de cocina', 2), ('Juego de cuchillos', 2), ('Cafetera espresso', 2),
  ('Comedor de 6 sillas', 1), ('Vajilla de 12 piezas', 4), ('Juego de copas', 4),
  ('Edredón king size', 2), ('Juego de sábanas', 3), ('Almohadas (par)', 3),
  ('Mesa de centro', 1), ('Lámpara de piso', 3), ('Licuadora', 2), ('Microondas', 2),
  ('Aspiradora', 2), ('Sofá de 3 plazas', 1), ('Refrigerador', 1),
  ('Cena romántica', 2), ('Noche de hotel', 1)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Hogar Plus', 'La completa más los electrodomésticos grandes', 'boda', 5) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 2), ('Sofá de 3 plazas', 2), ('Comedor de 6 sillas', 2),
  ('Cafetera espresso', 2), ('Vajilla de 12 piezas', 4), ('Batería de cocina', 3),
  ('Aspiradora', 2), ('Mesa de centro', 2), ('Lámpara de piso', 3),
  ('Edredón king size', 3), ('Juego de sábanas', 4), ('Microondas', 2),
  ('Licuadora', 2), ('Juego de copas', 4)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Premium', 'Equipa la casa entera con lo esencial y más', 'boda', 6) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 3), ('Sofá de 3 plazas', 3), ('Comedor de 6 sillas', 3),
  ('Cafetera espresso', 3), ('Vajilla de 12 piezas', 6), ('Batería de cocina', 4),
  ('Aspiradora', 3), ('Mesa de centro', 3), ('Lámpara de piso', 4),
  ('Edredón king size', 4), ('Juego de sábanas', 5), ('Microondas', 3),
  ('Licuadora', 3), ('Juego de copas', 6), ('Noche de hotel', 4),
  ('Cena romántica', 4), ('Excursión', 3)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Casa Llena', 'Casi todo el catálogo para estrenar casa', 'boda', 7) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 4), ('Sofá de 3 plazas', 4), ('Comedor de 6 sillas', 4),
  ('Cafetera espresso', 4), ('Vajilla de 12 piezas', 8), ('Batería de cocina', 6),
  ('Aspiradora', 4), ('Mesa de centro', 4), ('Lámpara de piso', 6),
  ('Edredón king size', 6), ('Juego de sábanas', 8), ('Microondas', 4),
  ('Licuadora', 4), ('Juego de copas', 8), ('Noche de hotel', 6),
  ('Cena romántica', 6), ('Excursión', 6)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;

with p as (
  insert into paquetes (nombre, descripcion, tipo, orden) values
    ('Todo Incluido', 'El catálogo completo, sin que falte nada', 'boda', 8) returning id
)
insert into paquete_items (paquete_id, catalogo_item_id, cantidad)
select p.id, c.id, v.cantidad
from p
join (values
  ('Refrigerador', 5), ('Sofá de 3 plazas', 5), ('Comedor de 6 sillas', 5),
  ('Cafetera espresso', 5), ('Vajilla de 12 piezas', 10), ('Batería de cocina', 8),
  ('Aspiradora', 6), ('Mesa de centro', 5), ('Lámpara de piso', 8),
  ('Edredón king size', 8), ('Juego de sábanas', 10), ('Microondas', 6),
  ('Licuadora', 6), ('Juego de copas', 10), ('Noche de hotel', 8),
  ('Cena romántica', 8), ('Excursión', 8), ('Juego de cuchillos', 6),
  ('Almohadas (par)', 8)
) as v(nombre, cantidad) on true
join catalogo_items c on c.nombre = v.nombre;
```

> Totales esperados (centavos→pesos, calculados): Esencial $43,800 · Cocina & Mesa $62,500 · Luna de miel $80,000 · Mesa Completa $121,400 · Hogar Plus $164,900 · Premium $271,800 · Casa Llena $377,800 · Todo Incluido $499,900.

- [ ] **Step 2: Aplicar la migración al proyecto Supabase de Regalove**

El proyecto es `apfmhrvofeeuutvdjjjt`. Aplicar por **una** de estas vías:

- **Dashboard (más simple):** abrir https://supabase.com/dashboard/project/apfmhrvofeeuutvdjjjt/sql/new , pegar el SQL del Step 1 y ejecutar.
- **CLI (si el proyecto está enlazado):** `supabase db push`.

Expected: ejecuta sin error y crea las tablas con datos.

- [ ] **Step 3: Verificar que el seed cuadró**

En el SQL editor del dashboard correr:

```sql
select p.nombre, sum(c.precio_centavos * pi.cantidad) / 100.0 as total_pesos
from paquetes p
join paquete_items pi on pi.paquete_id = p.id
join catalogo_items c on c.id = pi.catalogo_item_id
group by p.nombre, p.orden
order by p.orden;
```

Expected: 8 filas con totales ≈ los del Step 1 (Esencial 43800 … Todo Incluido 499900). Si algún paquete tiene total 0 o ítems faltantes, significa que un `nombre` no coincidió con el catálogo → revisar acentos/escritura exacta.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260530000000_crear_tabla_paquetes.sql
git commit -m "feat: tablas paquetes + seed de 8 paquetes prearmados"
```

---

## Task 2: Funciones puras `src/paquetes/` (TDD)

**Files:**
- Create: `src/paquetes/armar.ts`
- Test: `src/paquetes/armar.test.ts`

- [ ] **Step 1: Escribir las pruebas que fallan**

Crear `src/paquetes/armar.test.ts`:

```ts
import { test, expect } from "vitest";
import { armarItemsDesdePaquete, totalPaquete } from "./armar";

const entradas = [
  {
    nombre: "Refrigerador",
    descripcion: "Dos puertas",
    imagenUrl: "https://img/refri",
    precioCentavos: 1800000,
    cantidad: 2,
    catalogoItemId: "cat-refri",
  },
  {
    nombre: "Vajilla de 12 piezas",
    descripcion: null,
    imagenUrl: null,
    precioCentavos: 350000,
    cantidad: 3,
    catalogoItemId: "cat-vajilla",
  },
];

test("totalPaquete suma precio × cantidad de cada ítem", () => {
  expect(totalPaquete(entradas)).toBe(1800000 * 2 + 350000 * 3); // 4650000
});

test("totalPaquete de lista vacía es 0", () => {
  expect(totalPaquete([])).toBe(0);
});

test("armarItemsDesdePaquete calcula monto = precio × cantidad y orden secuencial", () => {
  const filas = armarItemsDesdePaquete(entradas);

  expect(filas).toEqual([
    {
      nombre: "Refrigerador",
      descripcion: "Dos puertas",
      imagen_url: "https://img/refri",
      monto_meta_centavos: 3600000,
      cantidad: 2,
      catalogo_item_id: "cat-refri",
      orden: 0,
    },
    {
      nombre: "Vajilla de 12 piezas",
      descripcion: null,
      imagen_url: null,
      monto_meta_centavos: 1050000,
      cantidad: 3,
      catalogo_item_id: "cat-vajilla",
      orden: 1,
    },
  ]);
});

test("armarItemsDesdePaquete normaliza descripcion/imagen ausentes a null", () => {
  const [fila] = armarItemsDesdePaquete([
    { nombre: "Licuadora", precioCentavos: 130000, cantidad: 1, catalogoItemId: "cat-lic" },
  ]);
  expect(fila.descripcion).toBeNull();
  expect(fila.imagen_url).toBeNull();
});
```

- [ ] **Step 2: Correr la prueba para verificar que falla**

Run: `pnpm test src/paquetes/armar.test.ts`
Expected: FAIL — `Failed to resolve import "./armar"` / función no definida.

- [ ] **Step 3: Implementar las funciones puras**

Crear `src/paquetes/armar.ts`:

```ts
/** Un ítem de un paquete con los datos del catálogo ya resueltos. */
export interface PaqueteItemEntrada {
  nombre: string;
  descripcion?: string | null;
  imagenUrl?: string | null;
  precioCentavos: number;
  cantidad: number;
  catalogoItemId: string;
}

/** Fila lista para insertar en items_mesa (falta solo evento_id, que pone la
 *  server action). Forma en snake_case para mapear directo a la columna. */
export interface FilaItemMesa {
  nombre: string;
  descripcion: string | null;
  imagen_url: string | null;
  monto_meta_centavos: number;
  cantidad: number;
  catalogo_item_id: string;
  orden: number;
}

/** Total del paquete en centavos: Σ(precio × cantidad). */
export function totalPaquete(
  items: Pick<PaqueteItemEntrada, "precioCentavos" | "cantidad">[],
): number {
  return items.reduce((suma, it) => suma + it.precioCentavos * it.cantidad, 0);
}

/** Convierte los ítems de un paquete en filas de items_mesa: el monto meta es
 *  precio unitario × cantidad y el orden es secuencial (0..n) preservando la
 *  posición del paquete. */
export function armarItemsDesdePaquete(items: PaqueteItemEntrada[]): FilaItemMesa[] {
  return items.map((it, i) => ({
    nombre: it.nombre,
    descripcion: it.descripcion ?? null,
    imagen_url: it.imagenUrl ?? null,
    monto_meta_centavos: it.precioCentavos * it.cantidad,
    cantidad: it.cantidad,
    catalogo_item_id: it.catalogoItemId,
    orden: i,
  }));
}
```

- [ ] **Step 4: Correr la prueba para verificar que pasa**

Run: `pnpm test src/paquetes/armar.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/paquetes/armar.ts src/paquetes/armar.test.ts
git commit -m "feat: funciones puras de paquetes (armar items + total)"
```

---

## Task 3: Server Actions — refactor `crearEventoBase` + `crearEventoConPaquete`

**Files:**
- Modify: `src/app/dashboard/acciones.ts`

- [ ] **Step 1: Reemplazar el contenido de `acciones.ts`**

Sustituir TODO el archivo `src/app/dashboard/acciones.ts` por:

```ts
"use server";

import { redirect } from "next/navigation";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { generarSlug } from "@/eventos/slug";
import { SLUGS_RESERVADOS } from "@/eventos/reservados";
import { armarItemsDesdePaquete } from "@/paquetes/armar";

type Supabase = Awaited<ReturnType<typeof crearClienteServidorAuth>>;

/** Genera un código de 4 dígitos (1000–9999) que no choque con otra mesa. */
async function generarCodigoUnico(supabase: Supabase): Promise<string> {
  for (let intento = 0; intento < 30; intento++) {
    const candidato = String(Math.floor(1000 + Math.random() * 9000));
    const { data } = await supabase
      .from("eventos")
      .select("id")
      .eq("codigo", candidato)
      .maybeSingle();
    if (!data) return candidato;
  }
  throw new Error("No se pudo generar un código único para la mesa");
}

/**
 * Crea el evento del festejado (slug + código únicos) y devuelve su id y slug.
 * Helper compartido por la creación manual y por paquete.
 */
async function crearEventoBase(
  supabase: Supabase,
  userId: string,
  datos: { titulo: string; tipo: string },
): Promise<{ eventoId: string; slug: string }> {
  const titulo = datos.titulo.trim();
  if (!titulo) {
    throw new Error("El título es obligatorio");
  }
  const tipo = datos.tipo.trim() || "boda";

  const { data: filas } = await supabase.from("eventos").select("slug");
  const existentes = (filas ?? []).map((f) => f.slug as string);
  const slug = generarSlug(titulo, { existentes, reservados: SLUGS_RESERVADOS });
  const codigo = await generarCodigoUnico(supabase);

  const { data, error } = await supabase
    .from("eventos")
    .insert({ festejado_id: userId, tipo, titulo, slug, codigo })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(`No se pudo crear la mesa: ${error?.message ?? "sin datos"}`);
  }
  return { eventoId: data.id as string, slug };
}

/** Devuelve el usuario autenticado o redirige a /login. */
async function usuarioOLogin(supabase: Supabase) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return user;
}

/**
 * Crea una mesa vacía (flujo manual) y lleva a gestionarla.
 */
export async function crearEvento(formData: FormData) {
  const supabase = await crearClienteServidorAuth();
  const user = await usuarioOLogin(supabase);

  const { slug } = await crearEventoBase(supabase, user.id, {
    titulo: String(formData.get("titulo") ?? ""),
    tipo: String(formData.get("tipo") ?? "boda"),
  });

  redirect(`/dashboard/mesa/${slug}`);
}

/**
 * Crea una mesa a partir de un paquete prearmado: copia los regalos del paquete
 * a items_mesa (como ítems normales, editables) y lleva a gestionarla.
 */
export async function crearEventoConPaquete(formData: FormData) {
  const paqueteId = String(formData.get("paquete_id") ?? "").trim();
  if (!paqueteId) {
    throw new Error("Falta el paquete a usar");
  }

  const supabase = await crearClienteServidorAuth();
  const user = await usuarioOLogin(supabase);

  const { eventoId, slug } = await crearEventoBase(supabase, user.id, {
    titulo: String(formData.get("titulo") ?? ""),
    tipo: String(formData.get("tipo") ?? "boda"),
  });

  const { data: paqueteItems } = await supabase
    .from("paquete_items")
    .select("cantidad, catalogo_items(id, nombre, descripcion, imagen_url, precio_centavos)")
    .eq("paquete_id", paqueteId);

  const entradas = (paqueteItems ?? []).map((pi) => {
    const c = pi.catalogo_items as unknown as {
      id: string;
      nombre: string;
      descripcion: string | null;
      imagen_url: string | null;
      precio_centavos: number;
    };
    return {
      nombre: c.nombre,
      descripcion: c.descripcion,
      imagenUrl: c.imagen_url,
      precioCentavos: c.precio_centavos,
      cantidad: pi.cantidad,
      catalogoItemId: c.id,
    };
  });

  const filas = armarItemsDesdePaquete(entradas).map((f) => ({
    ...f,
    evento_id: eventoId,
  }));

  if (filas.length > 0) {
    const { error } = await supabase.from("items_mesa").insert(filas);
    if (error) {
      throw new Error(`No se pudieron copiar los regalos del paquete: ${error.message}`);
    }
  }

  redirect(`/dashboard/mesa/${slug}`);
}
```

> Nota: `redirect()` lanza internamente; por eso va al final de cada action (no dentro de try/catch). El comportamiento observable de `crearEvento` no cambia.

- [ ] **Step 2: Verificar typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores. (Si `pi.catalogo_items` da error de tipo, el cast `as unknown as {...}` ya lo cubre.)

- [ ] **Step 3: Verificar que las pruebas siguen verdes**

Run: `pnpm test`
Expected: PASS (incluye `src/paquetes/armar.test.ts`).

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/acciones.ts
git commit -m "feat: crearEventoConPaquete + refactor crearEventoBase"
```

---

## Task 4: Pantalla chooser `/dashboard/crear`

**Files:**
- Create: `src/app/dashboard/crear/page.tsx`

- [ ] **Step 1: Crear la página**

Crear `src/app/dashboard/crear/page.tsx`:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";

export default async function Crear() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 820 }}>
      <Link href="/dashboard" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver al panel
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem" }}>¿Cómo quieres crear tu mesa?</h1>
      <p className="muted" style={{ marginBottom: "2rem" }}>
        Elige un paquete listo o ármala a tu gusto.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        <Link href="/dashboard/crear/rapido" className="tarjeta" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: "2rem" }}>⚡</div>
          <h2 style={{ fontSize: "1.25rem", margin: "0.5rem 0 0.35rem" }}>Crear rápido</h2>
          <p className="muted" style={{ margin: "0 0 1rem" }}>
            Escoge un paquete listo por monto. Nosotros ya elegimos los regalos; tú puedes ajustarlos después.
          </p>
          <span className="btn btn-primario btn-bloque">Empezar →</span>
        </Link>

        <Link href="/dashboard/crear/manual" className="tarjeta" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={{ fontSize: "2rem" }}>✏️</div>
          <h2 style={{ fontSize: "1.25rem", margin: "0.5rem 0 0.35rem" }}>Crear manual</h2>
          <p className="muted" style={{ margin: "0 0 1rem" }}>
            Arma tu mesa desde cero, regalo a regalo, con control total de precios y cantidades.
          </p>
          <span className="btn btn-contorno btn-bloque">Empezar →</span>
        </Link>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/crear/page.tsx
git commit -m "feat: pantalla chooser /dashboard/crear"
```

---

## Task 5: Pantalla `/dashboard/crear/rapido` (paquetes)

**Files:**
- Create: `src/app/dashboard/crear/rapido/page.tsx`

- [ ] **Step 1: Crear la página**

Crear `src/app/dashboard/crear/rapido/page.tsx`. Usa UN solo `<form>` con título + tipo compartidos y un botón submit por paquete (`name="paquete_id" value={id}`), de modo que el regalo elegido viaja sin JS:

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { crearEventoConPaquete } from "../../acciones";
import { totalPaquete } from "@/paquetes/armar";

function pesos(centavos: number): string {
  return (centavos / 100).toLocaleString("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  });
}

interface ItemPaquete {
  cantidad: number;
  catalogo_items: { nombre: string; precio_centavos: number };
}
interface Paquete {
  id: string;
  nombre: string;
  descripcion: string | null;
  paquete_items: ItemPaquete[];
}

export default async function CrearRapido() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data } = await supabase
    .from("paquetes")
    .select("id, nombre, descripcion, paquete_items(cantidad, catalogo_items(nombre, precio_centavos))")
    .eq("activo", true)
    .order("orden", { ascending: true });

  const paquetes = (data ?? []) as unknown as Paquete[];

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 1000 }}>
      <Link href="/dashboard/crear" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem" }}>Crear rápido</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Ponle nombre a tu mesa y elige un paquete. Podrás editar los regalos después.
      </p>

      <form action={crearEventoConPaquete}>
        <div
          className="tarjeta"
          style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}
        >
          <div className="campo" style={{ flex: "1 1 220px" }}>
            <label htmlFor="titulo">Título de la mesa</label>
            <input id="titulo" name="titulo" className="input" placeholder="ej. Juan y Ana" required />
          </div>
          <div className="campo" style={{ flex: "0 1 180px" }}>
            <label htmlFor="tipo">Tipo de evento</label>
            <select id="tipo" name="tipo" className="input" defaultValue="boda">
              <option value="boda">Boda</option>
              <option value="xv">XV años</option>
              <option value="baby_shower">Baby shower</option>
              <option value="cumpleanos">Cumpleaños</option>
            </select>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "1.25rem",
          }}
        >
          {paquetes.map((p) => {
            const items = p.paquete_items ?? [];
            const total = totalPaquete(
              items.map((it) => ({
                precioCentavos: it.catalogo_items.precio_centavos,
                cantidad: it.cantidad,
              })),
            );
            const preview = items.slice(0, 3);
            const restantes = items.length - preview.length;

            return (
              <div
                key={p.id}
                className="tarjeta"
                style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "0.5rem" }}>
                  <strong style={{ fontSize: "1.1rem" }}>{p.nombre}</strong>
                  <span style={{ fontWeight: 700, color: "var(--accent)" }}>{pesos(total)}</span>
                </div>
                {p.descripcion && (
                  <p className="muted" style={{ margin: 0, fontSize: "0.9rem" }}>
                    {p.descripcion}
                  </p>
                )}
                <ul className="muted" style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.85rem" }}>
                  {preview.map((it, i) => (
                    <li key={i}>
                      {it.cantidad > 1 ? `${it.cantidad}× ` : ""}
                      {it.catalogo_items.nombre}
                    </li>
                  ))}
                  {restantes > 0 && <li>+{restantes} más</li>}
                </ul>
                <button
                  type="submit"
                  name="paquete_id"
                  value={p.id}
                  className="btn btn-primario btn-bloque"
                  style={{ marginTop: "auto" }}
                >
                  Usar este →
                </button>
              </div>
            );
          })}
        </div>
      </form>
    </main>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/crear/rapido/page.tsx
git commit -m "feat: pantalla de paquetes /dashboard/crear/rapido"
```

---

## Task 6: Pantalla `/dashboard/crear/manual`

**Files:**
- Create: `src/app/dashboard/crear/manual/page.tsx`

- [ ] **Step 1: Crear la página**

Crear `src/app/dashboard/crear/manual/page.tsx` (reusa la action `crearEvento` existente):

```tsx
import { redirect } from "next/navigation";
import Link from "next/link";
import { crearClienteServidorAuth } from "@/lib/supabase/servidor-auth";
import { crearEvento } from "../../acciones";

export default async function CrearManual() {
  const supabase = await crearClienteServidorAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <main className="contenedor" style={{ paddingTop: "2.5rem", paddingBottom: "4rem", maxWidth: 480 }}>
      <Link href="/dashboard/crear" className="muted" style={{ fontSize: "0.9rem", textDecoration: "none" }}>
        ← Volver
      </Link>

      <h1 style={{ fontSize: "1.8rem", marginTop: "0.75rem" }}>Crear manual</h1>
      <p className="muted" style={{ marginBottom: "1.5rem" }}>
        Crea la mesa y agrégale los regalos uno a uno.
      </p>

      <section className="tarjeta">
        <form action={crearEvento} className="pila">
          <div className="campo">
            <label htmlFor="titulo">Título</label>
            <input id="titulo" name="titulo" className="input" placeholder="ej. Juan y Ana" required />
          </div>
          <div className="campo">
            <label htmlFor="tipo">Tipo de evento</label>
            <select id="tipo" name="tipo" className="input" defaultValue="boda">
              <option value="boda">Boda</option>
              <option value="xv">XV años</option>
              <option value="baby_shower">Baby shower</option>
              <option value="cumpleanos">Cumpleaños</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primario btn-bloque">
            Crear mesa
          </button>
        </form>
      </section>
    </main>
  );
}
```

- [ ] **Step 2: Verificar que compila**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/crear/manual/page.tsx
git commit -m "feat: pantalla /dashboard/crear/manual"
```

---

## Task 7: Panel — reemplazar form inline por botón "+ Crear mesa"

**Files:**
- Modify: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Quitar imports y lógica del form inline**

En `src/app/dashboard/page.tsx`, eliminar el import de la action (ya no se usa aquí):

Buscar y borrar la línea:
```tsx
import { crearEvento } from "./acciones";
```

- [ ] **Step 2: Reemplazar la sección "Crear una mesa"**

Reemplazar todo el bloque `<section className="tarjeta">…</section>` que contiene el form (el de "Crear una mesa", desde `<section className="tarjeta">` hasta su `</section>` de cierre, justo antes de `<section>` de "Tus mesas") por:

```tsx
        <section className="tarjeta">
          <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Crear una mesa</h2>
          <p className="muted" style={{ marginTop: 0, marginBottom: "1.25rem" }}>
            Empieza con un paquete listo o ármala tú mismo.
          </p>
          <Link href="/dashboard/crear" className="btn btn-primario btn-bloque">
            + Crear mesa
          </Link>
        </section>
```

(`Link` ya está importado en este archivo.)

- [ ] **Step 3: Verificar que compila y no quedó código muerto**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores (en particular, ningún "crearEvento is declared but never used").

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: panel usa botón a /dashboard/crear en vez de form inline"
```

---

## Task 8: Verificación end-to-end

**Files:** ninguno (solo verificación).

- [ ] **Step 1: Suite completa + typecheck**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: todas las pruebas PASS, typecheck sin errores.

- [ ] **Step 2: Prueba manual del flujo rápido**

Con `pnpm dev` corriendo y sesión iniciada:
1. Panel → "+ Crear mesa" → llega a `/dashboard/crear`.
2. "Crear rápido" → se ven los 8 paquetes con sus totales (~$43,800 … ~$499,900) y preview de regalos.
3. Escribir un título, dejar "Boda", clic en "Usar este" de "Mesa Esencial".
4. Expected: redirige a `/dashboard/mesa/<slug>` y "En tu mesa" ya muestra los 13 regalos del paquete con sus montos; el Total ≈ $43,800.
5. Quitar/ajustar un regalo → funciona como cualquier ítem (confirma que son editables).

- [ ] **Step 3: Prueba manual del flujo manual (sin regresión)**

1. Panel → "+ Crear mesa" → "Crear manual".
2. Crear con un título → redirige a "Arma tu mesa" vacía (comportamiento idéntico al anterior).

- [ ] **Step 4: Commit final (si hubo ajustes) y push**

```bash
git push -u origin feat/crear-rapido-paquetes
```

---

## Self-review (cobertura del spec)

- Tablas `paquetes`/`paquete_items` + RLS lectura pública → Task 1. ✅
- Total no persistido, calculado al vuelo → `totalPaquete` (Task 2) usado en Task 5. ✅
- Seed por match de nombre, 8 paquetes en escalera → Task 1 (totales verificados). ✅
- Regalos copiados y editables → `crearEventoConPaquete` inserta en `items_mesa` (Task 3); editables vía pantalla existente (Task 8 Step 2.5). ✅
- Punto de entrada `/dashboard/crear` con dos opciones → Tasks 4–6; panel enlaza (Task 7). ✅
- Refactor `crearEventoBase` compartido, sin regresión manual → Task 3 + Task 8 Step 3. ✅
- Lógica pura en `src/paquetes/` con tests → Task 2. ✅
- Fuera de alcance (admin, monto libre, checkout, otros tipos) → no se implementa. ✅
```
