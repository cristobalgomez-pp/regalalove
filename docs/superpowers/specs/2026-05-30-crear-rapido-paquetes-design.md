# Diseño: "Crear rápido" — paquetes de mesa prearmados

Fecha: 2026-05-30
Estado: aprobado, listo para plan de implementación

## Problema / objetivo

Hoy crear una mesa obliga al festejado a armarla regalo por regalo. Queremos una
ruta más rápida: al crear una mesa, el usuario elige entre dos caminos:

- **Crear rápido** — escoge un paquete prearmado (curado por Regalove) que ya trae
  una lista fija de regalos del catálogo con un monto total estimado.
- **Crear manual** — el flujo actual: arma la mesa desde cero, regalo a regalo,
  con control total de precios y cantidades.

El objetivo es bajar la fricción para parejas que solo quieren "una mesa de ~$X"
sin pensar en cada producto.

## Decisiones de diseño (aprobadas)

1. **Modelo "paquetes prearmados por monto".** Regalove cura paquetes con una
   lista fija de regalos del catálogo. El usuario solo elige un paquete.
2. **Los regalos se copian y quedan editables.** Elegir un paquete llena la mesa
   con sus regalos como ítems normales; el usuario puede quitar/agregar/ajustar
   después en la pantalla "Arma tu mesa" existente.
3. **Datos en Supabase** (no hardcode): tablas `paquetes` + `paquete_items` que
   referencian el catálogo existente, sembradas por migración.
4. **Punto de entrada:** página nueva `/dashboard/crear` con las dos opciones.

## Modelo de datos (nueva migración)

```sql
create table paquetes (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null,              -- "Mesa Esencial"
  descripcion text,                       -- gancho corto
  tipo        text not null default 'boda',
  orden       integer not null default 0, -- orden de la escalera
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

create table paquete_items (
  id               uuid primary key default gen_random_uuid(),
  paquete_id       uuid not null references paquetes(id) on delete cascade,
  catalogo_item_id uuid not null references catalogo_items(id) on delete cascade,
  cantidad         integer not null default 1 check (cantidad > 0)
);
```

- **RLS:** lectura pública en ambas tablas (para listar paquetes en el chooser);
  sin políticas de escritura para usuarios (curado por Regalove vía
  migración/service role), igual que `catalogo_items`.
- **Total NO persistido:** se calcula al vuelo como `Σ precio_catálogo × cantidad`,
  para que nunca se desincronice si cambia un precio del catálogo.
- **Seed robusto:** los `paquete_items` se insertan haciendo match por `nombre`
  contra `catalogo_items` (no por UUID, que es aleatorio en el seed del catálogo).

## Flujo y pantallas

### Panel (`/dashboard`)
La tarjeta "Crear una mesa" se simplifica: en vez del form inline (título + tipo),
muestra un botón **"+ Crear mesa"** que lleva a `/dashboard/crear`.

### `/dashboard/crear` (chooser)
Dos tarjetas grandes, mobile-first:
- **⚡ Crear rápido** — "Escoge un paquete listo por monto" → `/dashboard/crear/rapido`
- **✏️ Crear manual** — "Arma tu mesa desde cero, regalo a regalo" → `/dashboard/crear/manual`

### `/dashboard/crear/rapido`
- Arriba: campos **Título** (requerido) y **Tipo de evento** (select).
- Abajo: escalera de 8 paquetes (cards). Cada card muestra nombre, descripción,
  total estimado (~$X) y una mini-lista de sus primeros regalos ("+N más").
- Cada card tiene un botón **"Usar este"** que envía `{ titulo, tipo, paquete_id }`
  a la server action. Crea la mesa con los regalos copiados y redirige a
  "Arma tu mesa", donde el usuario puede editar todo.

### `/dashboard/crear/manual`
El form actual (título + tipo) → `crearEvento` → mesa vacía → "Arma tu mesa".
Es exactamente el comportamiento de hoy, solo reubicado.

## Server actions (refactor + nuevo)

Extraer un helper compartido para no duplicar la lógica de slug/código:

- `crearEventoBase(supabase, user, { titulo, tipo }) → { eventoId, slug }`
  — genera slug único + código único + inserta el evento. Usado por ambos flujos.
- `crearEvento(formData)` (actual) — se refactoriza para usar el helper; sin cambio
  de comportamiento observable.
- `crearEventoConPaquete(formData)` (**nuevo**) — lee `titulo`, `tipo`, `paquete_id`;
  llama a `crearEventoBase`; carga `paquete_items ⨝ catalogo_items`; inserta en lote
  en `items_mesa` (`monto_meta_centavos = precio × cantidad`, copiando
  nombre/descripcion/imagen_url/`catalogo_item_id`, con `orden` incremental);
  redirige a `/dashboard/mesa/{slug}`.

## Lógica pura testeable (TDD)

Nuevo módulo `src/paquetes/`:

- `armarItemsDesdePaquete(paqueteItems) → Fila[]` — pura: convierte cada
  `(catalogo_item, cantidad)` en una fila lista para `items_mesa`
  (`monto_meta_centavos = precio_centavos × cantidad`, `orden` secuencial 0..n).
- `totalPaquete(paqueteItems) → centavos` — pura: suma para el badge "~$X".

Ambas cubiertas por pruebas Vitest. Las server actions solo orquestan la DB
alrededor de estas funciones puras (consistente con `src/ledger`, `src/fees`,
`src/retencion`).

## Paquetes seed (escalera ~$45k → ~$500k)

| # | Paquete        | Total aprox. | Enfoque                                   |
|---|----------------|--------------|-------------------------------------------|
| 1 | Mesa Esencial  | ~$45k        | Cocina básica, vajilla, recámara          |
| 2 | Cocina & Mesa  | ~$65k        | Todo para cocinar y recibir               |
| 3 | Luna de miel   | ~$80k        | Hotel, cena, excursiones + algo de hogar  |
| 4 | Mesa Completa  | ~$120k       | Mezcla amplia de todas las áreas          |
| 5 | Hogar Plus     | ~$170k       | Completa + electrodoméstico grande        |
| 6 | Premium        | ~$280k       | + refrigerador, sofá                      |
| 7 | Casa Llena     | ~$380k       | Casi todo el catálogo                     |
| 8 | Todo Incluido  | ~$500k       | Catálogo completo con cantidades          |

La composición exacta (qué ítems del catálogo y qué cantidades) se afina al sembrar
para clavar cada total objetivo. Todos `tipo = 'boda'` en esta primera entrega.

## Fuera de alcance (YAGNI)

- **Admin para editar paquetes** (nombres/montos/composición sin migración) — es el
  siguiente proyecto acordado, no parte de esta entrega.
- Armado automático por monto libre (opción descartada en brainstorming).
- Cambios al flujo de invitado/checkout — esta entrega solo toca creación de mesa.
- Paquetes para otros tipos de evento (XV, baby shower, etc.) — solo boda por ahora.

## Criterios de éxito

- Desde el panel, "Crear mesa" lleva al chooser de dos opciones.
- "Crear rápido" + elegir un paquete crea una mesa cuyo "En tu mesa" ya trae los
  regalos del paquete con sus montos correctos, y el usuario puede editarlos.
- "Crear manual" reproduce el flujo actual sin regresión.
- Las funciones puras de `src/paquetes/` pasan sus pruebas; `pnpm test` y
  `pnpm exec tsc --noEmit` quedan verdes.
