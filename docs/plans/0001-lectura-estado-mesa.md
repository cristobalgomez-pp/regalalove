# Plan 0001 — Lectura de Estado de Mesa (candidato 1)

> Refactor de arquitectura surgido de la revisión `/improve-codebase-architecture`.
> Objetivo: eliminar la duplicación de la receta "cargar ítems + cargar
> aportaciones confirmadas + proyectar filas a dominio + `resumenDashboard`" y
> darle pruebas a la orquestación que hoy NO tiene ninguna.
>
> Estilo: pasos pequeños, TDD donde aplique. Tras CADA fase correr
> `pnpm test` **y** `pnpm build` (Turbopack caza imports rotos que tsc/tests no).
> Imports relativos **sin** extensión `.js`. Alias `@/*` → `src/*`.

---

## Hallazgos de descubrimiento (Fase 0)

Patrones reales del repo que las fases siguientes deben **copiar**, no inventar.

### Tipos y firmas existentes (no asumir, ya verificados)

- `resumenDashboard(items: DefinicionItem[], asentadas: AportacionAsentada[], ahora: number, config: ConfigRetencion): ResumenDashboard` — **puro**, posicional. `src/dashboard/resumen.ts:22`. Queda **intacto** (refuerza ADR-0002).
- `AportacionAsentada` = `{ cobroId, itemId: string|null, monto, metodoPago, fecha, nombre, mensaje }`. `src/pagos/webhook.ts:17`.
- `DefinicionItem` = `{ id: string, montoMeta: number }`. `src/ledger/ledger.ts:22`.
- `ConfigRetencion` = `{ ventanaRetencionDias: number }`. `src/retencion/retencion.ts:11`.
- `AportacionConfirmadaRow` = `{ id, nombre_invitado, monto_centavos, item_id: string|null, mensaje: string|null, metodo_pago: string, creado_en: string }`. `src/lib/datos-mesa.ts:29`.
- `ItemMesaRow` = `{ id, nombre, descripcion, imagen_url, monto_meta_centavos, cantidad, orden }`. `src/lib/datos-mesa.ts:9`.
- Loaders: `itemsDeMesa(db, eventoId)`, `aportacionesConfirmadas(db, eventoId)`. `src/lib/datos-mesa.ts`.
- Proyecciones existentes a imitar: `feedDe`, `entradaLedger` en `src/aportaciones/proyecciones.ts` (el docstring ya dice que es "la única traducción tipada").
- Config: `obtenerConfigMonetizacion(): Promise<ConfigMonetizacion>` **NO recibe `db`** (crea su cliente service_role adentro). `src/config/obtenerConfigMonetizacion.ts:13`.

### Patrón de test del repo (copiar tal cual)

- vitest, `import { test, expect } from "vitest"`. Sin librerías de mock.
- Funciones puras: aserción directa entrada→salida (ver `src/dashboard/resumen.test.ts`, `src/aportaciones/proyecciones.test.ts`).
- Doble de Supabase en memoria: `crearDb(seed)` con `select/eq/order/then`. **Copiar de `src/lib/datos-mesa.test.ts:6-26`.** Soporta `select().eq().order()` y es *thenable*. **NO** soporta `.in()`, `.maybeSingle()` ni `auth.admin.listUsers()` — la Fase 4 deberá extenderlo.

### Las 3 copias a mano de la proyección fila→`AportacionAsentada`

1. `src/admin/eventos.ts:58-66` — `aps.map(a => ({ cobroId: a.id, ... }))`.
2. `src/app/dashboard/mesa/[slug]/recibido/page.tsx:38-47` — vía `AportacionVista`.
3. `src/app/dashboard/mesa/[slug]/recibido/PanelEnVivo.tsx:61-71` (payload realtime → vista) y `:86-95` (vista → asentada, incluye el guard "ítem borrado → fondo general").

### Dos restricciones que moldean el diseño (descubiertas en Fase 0)

- **R1 — config no inyectable:** la lógica va en una función **pura** `componerEstadoMesa(itemsRows, apsRows, ahora, config)`; así se testea sin tocar `obtenerConfigMonetizacion`.
- **R2 — sin segundo consumidor del reader single:** `recibido` no computa el resumen en servidor (lo hace el cliente); el único que lo computa server-side es el admin, que necesita el **batch**. Por eso el `leerEstadoMesa` de una sola mesa se **difiere al candidato 5** (retiro será su 2º consumidor). Aquí enviamos la **proyección compartida** + el **composer puro** + el **batch admin**.

### Anti-patrones a evitar

- Inventar métodos del cliente Supabase fuera de los que ya usa el repo.
- Tocar `resumenDashboard` / el Ledger para volverlos impuros (violaría ADR-0002).
- Crear `leerEstadoMesa` single sin consumidor (costura hipotética / código muerto).
- Dejar `.js` en imports relativos.

---

## Fase 1 — Proyección compartida (TDD)

**Qué implementar** en `src/aportaciones/proyecciones.ts` (junto a `feedDe`/`entradaLedger`):

- `filaAAsentada(row: AportacionConfirmadaRow): AportacionAsentada`
  mapeo: `cobroId: row.id`, `itemId: row.item_id`, `monto: row.monto_centavos`,
  `metodoPago: row.metodo_pago as MetodoPago`, `fecha: new Date(row.creado_en).getTime()`,
  `nombre: row.nombre_invitado`, `mensaje: row.mensaje ?? ""`.
- `vistaDesde(a: AportacionAsentada, itemsMap: Record<string,string>): AportacionVista`
  (mover el tipo `AportacionVista` desde `PanelEnVivo.tsx` a un lugar compartido —
  p. ej. `aportaciones/proyecciones.ts` — y reexportarlo). `itemNombre`:
  `a.itemId ? (itemsMap[a.itemId] ?? "Un regalo") : null`; `id: a.cobroId`.

**Tests primero** (`src/aportaciones/proyecciones.test.ts`, ampliar): copiar el estilo
de los tests existentes en ese mismo archivo. Casos: mapeo de campos, `mensaje` null→"",
`item_id` null→`itemId` null, `vistaDesde` con/sin `itemNombre`.

**Verificación:** `pnpm test src/aportaciones/proyecciones.test.ts` verde · `pnpm build`.

**Guard:** no incluir todavía la lógica de "ítem borrado→general" en la proyección
(esa es de la fase de replay, va en el composer / o se deja donde está).

---

## Fase 2 — Migrar las 3 copias a la proyección compartida (sin cambio de comportamiento)

**Qué implementar:** reemplazar los `.map` a mano por `filaAAsentada` / `vistaDesde`.

- `src/admin/eventos.ts:58-66` → `aps.map(filaAAsentada)`.
- `src/app/dashboard/mesa/[slug]/recibido/page.tsx:38-47` →
  `aportaciones.map(filaAAsentada).map(a => vistaDesde(a, itemsMap))`.
- `src/app/dashboard/mesa/[slug]/recibido/PanelEnVivo.tsx`:
  - `:61-71` payload realtime → construir un `AportacionConfirmadaRow` desde el
    `payload.new` y pasar por `filaAAsentada` → `vistaDesde`.
  - `:86-95` usar `filaAAsentada`/conservar el guard de ítem desconocido (ver nota).

**Nota (guard ítem desconocido):** mantenerlo idéntico en esta fase para no cambiar
comportamiento. Opcional (señalar, no obligar): moverlo al Ledger/`reconstruir` para
que tolere `itemId` desconocido como `general` — eso lo eliminaría de PanelEnVivo,
pero es un cambio en la capa pura; dejar para después si se quiere.

**Verificación:** `pnpm test` completo verde · `pnpm build` · revisar a ojo que los
3 sitios ya no arman objetos a mano (`grep -n "cobroId: a.id\|cobroId: a\." src`).
Comportamiento idéntico (es refactor puro de mapeo).

---

## Fase 3 — Composer puro `componerEstadoMesa` (TDD)

**Qué implementar** en NUEVO `src/mesa/estado.ts`:

```ts
export interface EstadoMesa {
  resumen: ResumenDashboard;
  itemsMap: Record<string, string>;   // id -> nombre
  nAportaciones: number;
}

export function componerEstadoMesa(
  itemsRows: ItemMesaRow[],
  apsRows: AportacionConfirmadaRow[],
  ahora: number,
  config: ConfigRetencion,
): EstadoMesa
```

Hace (todo con piezas existentes):
- `definiciones = itemsRows.map(it => ({ id: it.id, montoMeta: it.monto_meta_centavos }))`
- `asentadas = apsRows.map(filaAAsentada)` (Fase 1)
- `itemsMap` desde `itemsRows` (`id -> nombre`)
- `resumen = resumenDashboard(definiciones, asentadas, ahora, config)`
- `nAportaciones = asentadas.length`
- (decisión) incluir aquí el guard "ítem desconocido → general" si se centraliza.

**Tests primero** (`src/mesa/estado.test.ts`): copiar estilo de `resumen.test.ts`.
Casos: saldo total, `itemsMap` correcto, `nAportaciones`, retenido/retirable
delegado a `resumenDashboard` (un caso de humo basta, la lógica ya está testeada ahí).

**Verificación:** `pnpm test src/mesa/estado.test.ts` verde · `pnpm build`.

**Guard:** `componerEstadoMesa` es **pura** — recibe `config` y `ahora`, no llama a
`obtenerConfigMonetizacion` ni a la BD (R1).

---

## Fase 4 — Reescribir `listarEventosAdmin` en batch (matar el N+1)

**Problema actual:** `src/admin/eventos.ts:48-84` hace `itemsDeMesa` +
`aportacionesConfirmadas` **por cada evento dentro de un `for`** (2·N queries).

**Qué implementar:** rehacer `listarEventosAdmin(db)` sin el N+1:
1. 1 query: todos los eventos (como hoy).
2. 1 query: `items_mesa` con `.in("evento_id", ids)`.
3. 1 query: `aportaciones` confirmadas con `.in("evento_id", ids)`.
4. Agrupar en memoria por `evento_id` (Map).
5. `config = await obtenerConfigMonetizacion()` **una sola vez**; `ahora = Date.now()` una sola vez.
6. Por evento: `componerEstadoMesa(itemsDeEse, apsDeEse, ahora, config)` (Fase 3) →
   mapear a `EventoAdmin` (mismos campos de hoy: `saldoTotal/retirable/retenido` desde
   `.resumen`, `nAportaciones` desde `.nAportaciones`, + `festejadoEmail`).
7. Email: `db.auth.admin.listUsers()` una vez (como hoy, `:41-42`).

`EventoAdmin` y la firma pública **no cambian** → `src/app/admin/page.tsx:12`
(`listarEventosAdmin(db)`) sigue igual.

**Tests** (`src/admin/eventos.test.ts`, nuevo): **extender el doble** `crearDb`
de `datos-mesa.test.ts` con:
- `.in(col, vals[])` (filtra por inclusión),
- `auth.admin.listUsers()` → `{ data: { users: [...] }, error: null }`.
Casos: 2 eventos con aportaciones distintas devuelven saldos correctos; **conteo de
queries** = constante (no crece con N) — p. ej. instrumentar el doble para contar
llamadas a `from("items_mesa")` y aseverar que es 1.

**Verificación:** `pnpm test` completo · `pnpm build` · cargar `/admin` localmente y
confirmar que la tabla muestra los mismos números que antes.

**Guard:** no llamar `componerEstadoMesa` con config por defecto; usar la leída.
No reintroducir queries dentro del loop.

---

## Fase 5 — Verificación final

1. `pnpm test` — toda la suite verde (incluye los nuevos: proyecciones, mesa/estado, admin/eventos).
2. `pnpm build` — Turbopack sin errores de import.
3. Greps de anti-patrón:
   - `grep -rn "cobroId: a.id" src` → 0 resultados (proyección centralizada).
   - `grep -rn "monto_centavos," src/app src/admin | grep map` → revisar que no queden mapeos a mano de aportación.
   - Confirmar que no existe `leerEstadoMesa` single sin consumidor.
4. Confirmar que `src/dashboard/resumen.ts` y `src/ledger/*` **no** se modificaron (pura intacta, ADR-0002).
5. Correr la app: `/dashboard/mesa/<slug>/recibido` (panel en vivo) y `/admin`
   muestran lo mismo que antes del refactor.

---

## Fuera de alcance (explícito)

- `leerEstadoMesa` de una sola mesa (reader impuro single) → **candidato 5**, cuando
  `retirar/calculo.ts` (`calcularSaldoRetiro`) sea su segundo consumidor.
- Centralizar el guard de "ítem desconocido → general" en la capa pura → opcional, futuro.
- Mover `retiros`/email dentro del snapshot → descartado por diseño.
