# CONTEXT — Regalove

Glosario de dominio de Regalove. Es la **fuente del vocabulario**: al hablar de
arquitectura, refiérete a los conceptos por estos nombres (p. ej. "el módulo de
Aportación", no "el FooHandler"). Si un módulo nuevo nombra un concepto que no
está aquí, agrégalo.

Regalove es una **mesa de regalos en efectivo para eventos** (bodas como mercado
de lanzamiento). El festejado crea una mesa; los invitados aportan dinero sin
cuenta; todo se vuelve saldo flexible que el festejado retira a su CLABE. Cobro
y dispersión vía EcartPay.

---

## Actores

- **Festejado** — único usuario registrado (Supabase Auth). Crea y administra su
  mesa, ve su saldo, retira. Owner de la fila en `eventos`.
- **Invitado** — anónimo/efímero. Aporta sin crear cuenta (*guest checkout*),
  dejando nombre y mensaje. No tiene sesión.
- **Admin** — operador interno del negocio. Acceso por allowlist de correos
  (`ADMIN_EMAILS`). Ve todas las mesas, marca fraude, edita monetización.

## Mesa y wishlist

- **Mesa / Evento** — la unidad central (`eventos`). Tipo configurable (`boda`
  por default, nunca hardcodeado). Identificada por **slug** público.
  Lectores/guard: `lib/mesa.ts` (`cargarMesaDelFestejado`), `lib/datos-mesa.ts`.
- **Página de evento** — la vista pública compartible de una Mesa (portada,
  historia, fecha, cuenta regresiva, wishlist, guest checkout).
- **Lista de deseos / Wishlist** — los **Ítems** de la mesa (`items_mesa`), con
  nombre, imagen, descripción y **monto meta**. Validación: `items/validarItem`.
- **Ítem** — un deseo con monto meta. Puede recibir aportaciones completas o
  fraccionadas. Al llegar al 100% queda **completado** y no recibe más.
- **Fondo general** — destino sin tope, siempre presente. Aportación con
  `item_id = null`. El **sobre-fondeo** de un ítem completado se redirige aquí.
- **Paquete** — wishlist prearmada y curada (`paquetes`, `paquete_items`) para
  "crear rápido" una mesa. Armado: `paquetes/armar`.
- **Catálogo** — ítems de referencia (`catalogo_items`) de los que se copian los
  deseos.

## Aportaciones y Ledger

- **Aportación** — dinero que un invitado da a un ítem o al fondo general
  (`aportaciones`). **Completa** (cubre el ítem) o **fraccionada** (parcial).
  Estado `confirmada` | `revertida`. Proyecciones tipadas: `aportaciones/proyecciones`.
- **Ledger** — motor de saldo, **fuente de verdad** del estado de la mesa
  (`ledger/`). Reconstruye el estado replayando las aportaciones asentadas
  (`reconstruir`). Es **puro** y **agnóstico al proveedor de pagos**. Ver
  [ADR-0002](docs/adr/0002-ledger-fuente-de-verdad.md).
- **Sobre-fondeo** — excedente sobre el monto meta de un ítem; se redirige al
  fondo general.
- **Estado de Mesa** — la foto reconstruida de una Mesa (saldo, retirable/
  retenido, feed, `itemsMap`, nº de aportaciones). Se arma con dos piezas puras:
  `resumenDashboard` (`dashboard/resumen`, el saldo) y `componerEstadoMesa`
  (`mesa/estado`, que proyecta filas vía `aportaciones/proyecciones` y compone).
  La carga de la BD (la costura **impura**) la hace el consumidor: hoy el batch
  del admin (`admin/eventos`, una pasada por tabla, sin N+1). El panel en vivo
  recalcula con la **misma** proyección en el cliente, sin tocar la BD. Un lector
  `leerEstadoMesa(db, eventoId)` de una sola Mesa se añadirá cuando el retiro sea
  su segundo consumidor (candidato 5).

## Dinero del festejado

- **Saldo total** — todo lo aportado confirmado. Lo calcula el Ledger.
- **Retirable vs Retenido** — partición del saldo según método de pago
  (`retencion/`). Ver [ADR-0004](docs/adr/0004-retencion-por-metodo.md).
- **Ventana de retención** — días que una aportación con **tarjeta** queda
  retenida (~7, configurable) antes de ser retirable; SPEI/OXXO/CoDi se liberan
  de inmediato.
- **Retiro** — solicitud de sacar saldo retirable a la CLABE (`retiros`).
  Orquestación: `app/.../retirar/`. Guard de moderación: `retiros/guarda`
  (`puedeRetirar`).
- **Dispersión** — el envío real del dinero a la CLABE vía EcartPay (hoy
  simulado).
- **KYC** — verificación de identidad + registro de CLABE del festejado
  (`kyc_festejado`). **Diferido** al primer retiro. Ver
  [ADR-0005](docs/adr/0005-kyc-diferido.md).
- **CLABE** — cuenta bancaria destino del festejado (18 dígitos).
- **Contracargo** — reversa de un cobro con tarjeta; el Ledger lo asienta como
  aportación `revertida`.

## Pagos

- **Cobro** — petición de pago a un invitado vía EcartPay.
- **Método de pago** — `tarjeta` | `spei` | `oxxo` | `codi` (`dominio/tipos`).
  Tarjeta es reversible (contracargo); el resto irreversibles.
- **Pasarela / Adaptador de pagos** — el puerto estable que envuelve EcartPay
  (`pagos/pasarela`); único módulo que conoce al proveedor. Implementación
  simulada: `pagos/ecartpay.fake`. Ver [ADR-0003](docs/adr/0003-adaptador-pagos.md).
- **Webhook** — evento de EcartPay (confirmado/fallido/contracargo) que asienta
  o revierte en el Ledger (`pagos/webhook`).
- **Confirmación de pago (seam único)** — todo cobro cambia el saldo por un solo
  camino (`pagos/confirmacion`), espejando idempotencia y contracargo.
- **Idempotencia** — un mismo `cobroId` no duplica aportación (upsert
  `onConflict`). Ver [ADR-0007 nota] — `cobroId` estable por cobro.

## Monetización

- **Comisión base** — % que cobra Regalove al festejado (default 5%).
- **Plan** — `Gratis` o `Premium` (cuota fija por evento, comisión reducida).
- **Absorción de comisión** — opción del invitado de cubrir la comisión ("que el
  festejado reciba el 100%"); casilla pre-marcada configurable
  (`checkout/absorcion`).
- **Motor de Comisiones / Fees** — función pura dirigida por config: dado
  aportación + plan + absorción, calcula lo que paga el invitado, la comisión y
  el neto al festejado (`fees/`).
- **Configuración de monetización** — parámetros editables en runtime sin
  desplegar (tabla `configuracion`, clave/valor). Lectura:
  `config/obtenerConfigMonetizacion` + `config/monetizacion`
  (`interpretar...`). Escritura admin: `admin/configEscritura` (`aFilasConfig`).
  Ver [ADR-0006](docs/adr/0006-monetizacion-configurable.md).

## Moderación y admin

- **Allowlist de admin** — correos en `ADMIN_EMAILS` que pueden entrar a
  `/admin` (`admin/acceso` `esAdmin`; gate `admin/exigirAdmin`). Ver
  [ADR-0007](docs/adr/0007-acceso-admin-y-moderacion.md).
- **Sospechoso** — flag de moderación en `eventos.sospechoso`. Una mesa marcada
  **bloquea sus retiros**. Solo lo escribe `service_role` (protegido por
  privilegios de columna). **nota_admin** — nota interna opcional asociada.

## Plataforma

- **Slug** — identificador legible y único de la mesa en su URL pública
  (`eventos/slug`, palabras reservadas en `eventos/reservados`).
- **Código de mesa** — código corto único para compartir/encontrar la mesa.
- **Marca / URL base** — `NOMBRE_MARCA`, `URL_BASE` viven en configuración, no en
  el código.
- **service_role** — cliente Supabase server-side que salta RLS
  (`lib/supabase/server`); úsalo solo en operaciones de confianza (admin, asiento
  de pagos). El cliente con sesión del festejado es `lib/supabase/servidor-auth`.
