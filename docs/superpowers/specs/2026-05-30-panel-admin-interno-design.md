# Diseño: Panel admin interno (#17)

Fecha: 2026-05-30
Estado: aprobado, listo para plan de implementación

## Problema / objetivo

El negocio necesita una vista interna para operar Regalove: ver todos los
eventos con sus saldos, marcar eventos sospechosos de fraude, y ajustar la
configuración de monetización sin desplegar código. Hoy no existe ningún
concepto de rol/admin: el auth solo distingue "festejado logueado" (Supabase
Auth) de "invitado anónimo". Este es el último módulo del PRD (#1) sin construir.

Cierra el issue #17.

## Decisiones de diseño (aprobadas)

1. **Acceso por allowlist de correos (env).** Una variable `ADMIN_EMAILS`
   (correos separados por comas) define quién es admin. El admin inicia sesión
   con su cuenta normal de Supabase; si su correo está en la lista, ve `/admin`.
   Cero esquema nuevo de roles, cero fricción. Decisión YAGNI para uso interno
   en v1.
2. **Marcar sospechoso bloquea retiros.** Además de ser un marcador visible, un
   evento marcado no puede retirar saldo hasta des-marcarlo.
3. **Patrón existente.** Server Components bajo `/admin` + server actions, con la
   lógica de dominio aislada en módulos puros y testeables (igual que `ledger`,
   `fees`, `retencion`). Sin sub-app ni API nueva.
4. **Lecturas/escrituras admin con `service_role`.** El panel necesita ver
   saldos de todos los festejados y escribir el flag en eventos ajenos; eso
   salta RLS, así que usa el cliente `crearClienteServidor()` (service_role),
   solo del lado servidor.

## Control de acceso

### Módulo puro `src/admin/acceso.ts`

```ts
/** Determina si un correo pertenece a la allowlist de administradores.
 *  La allowlist viene de ADMIN_EMAILS (correos separados por comas). */
export function esAdmin(email: string | null | undefined, allowlist: string): boolean
```

- Normaliza a minúsculas y recorta espacios en ambos lados.
- `allowlist` vacía o `email` nulo ⇒ `false`.
- Ignora entradas vacías de la lista (ej. comas colgantes).

Un helper `obtenerAllowlistAdmin()` lee `process.env.ADMIN_EMAILS ?? ""`.

### Middleware

Extender `src/middleware.ts` para también proteger `/admin/:path*`:

- Sin sesión ⇒ redirige a `/login`.
- Con sesión pero correo fuera de la allowlist ⇒ redirige a `/dashboard`.
- El matcher pasa a `["/dashboard/:path*", "/admin/:path*"]`.

`ADMIN_EMAILS` debe estar disponible en el runtime del middleware (edge). Se
documenta en el README junto a las demás variables.

### Defensa en profundidad

Cada page y cada server action de `/admin` revalida con `esAdmin` server-side
antes de operar (no se confía solo en el middleware). Un helper compartido
`exigirAdmin()` obtiene el usuario de la sesión, verifica la allowlist y hace
`redirect("/dashboard")` si no aplica; devuelve el cliente `service_role` listo
para usar.

## Modelo de datos (nueva migración)

```sql
-- Marca de fraude administrada desde el panel interno.
alter table eventos
  add column sospechoso boolean not null default false,
  add column nota_admin text;
```

No se agregan políticas RLS nuevas: la escritura del flag ocurre server-side con
`service_role` (que salta RLS). La política pública de lectura existente sigue
igual.

## Rutas y pantallas

### `/admin` — lista de eventos

Server Component. Lista **todos** los eventos (cross-festejado), ordenados del
más reciente al más antiguo. Por cada evento muestra:

- Título y slug (link a la página pública).
- Correo del festejado (leído de `auth.users` vía service_role).
- Saldo total, retirable y retenido.
- Número de aportaciones confirmadas.
- Marca "sospechoso" + toggle (server action `alternarSospechoso`).

### `/admin/config` — configuración de monetización

Server Component con formulario de los 5 parámetros tipados:

| Campo (form) | Clave en `configuracion` | Tipo |
|---|---|---|
| Comisión base (%) | `comision_base_pct` | número ≥ 0 |
| Comisión Premium (%) | `comision_premium_pct` | número ≥ 0 |
| Precio Premium (pesos) | `precio_premium_centavos` | número ≥ 0 (se guarda en centavos) |
| Absorción pre-marcada | `absorcion_pre_marcada` | bool |
| Ventana de retención (días) | `ventana_retencion_dias` | entero ≥ 0 |

Los valores actuales se precargan con `obtenerConfigMonetizacion()`. Al guardar,
la action hace upsert y `revalidatePath`; como la config se lee en vivo en cada
checkout/retiro, el cambio se refleja de inmediato.

## Módulos de dominio (interfaces estables)

- `src/admin/acceso.ts` — `esAdmin(email, allowlist)`, `obtenerAllowlistAdmin()`.
- `src/admin/eventos.ts` — lector `listarEventosAdmin(db)` que devuelve, por
  evento, los datos de la lista + saldos (reutiliza `reconstruir`/`resumen`); y
  `marcarSospechoso(db, eventoId, valor, nota?)`.
- `src/admin/configEscritura.ts` — función pura
  `aFilasConfig(config: EntradaConfigMonetizacion): FilaConfig[]` que **valida**
  (rechaza % negativos, no-numéricos, días no-enteros) y serializa a filas
  `{ clave, valor }` para upsert. Pesos→centavos vive aquí. Es el inverso de
  `interpretarConfigMonetizacion`.
- `src/retiros/guarda.ts` (o junto al cálculo de retiro) — `puedeRetirar(evento)`
  pura: `false` si `evento.sospechoso`.

Las pages y `acciones.ts` de `/admin` son capas delgadas que orquestan estos
módulos con el cliente `service_role`.

## Bloqueo de retiros

En `solicitarRetiro` (`src/app/dashboard/mesa/[slug]/retirar/acciones.ts`):

- Ampliar el `select` de `cargarMesaDelFestejado` para traer `sospechoso`.
- Tras validar el monto contra lo disponible, llamar `puedeRetirar(evento)`; si
  es `false`, lanzar: **"Esta mesa está en revisión; los retiros están
  temporalmente bloqueados."**

## Manejo de errores

- No-admin ⇒ redirección silenciosa a `/dashboard` (no se filtra existencia del
  panel).
- Config inválida ⇒ la action lanza un error con mensaje claro; no se escribe
  nada parcial.
- Toggle de sospechoso ⇒ idempotente (fija el valor explícito, no alterna a
  ciegas sobre estado posiblemente viejo).

## Pruebas

Módulos profundos y guardas puras (donde un error cuesta dinero o seguridad):

1. **`esAdmin`** — correo en lista (case-insensitive, con espacios), fuera de
   lista, allowlist vacía, email nulo, comas colgantes.
2. **`aFilasConfig`** — params válidos ⇒ filas correctas (incluida conversión
   pesos→centavos y bool→`"true"/"false"`); rechaza % negativo, valor
   no-numérico, días no-enteros.
3. **`puedeRetirar`** — `false` si `sospechoso`, `true` si no.

Saldos y montos ya están cubiertos por las pruebas de `ledger`/`resumen`; no se
re-prueban. Las pages/acciones (UI) se cubren ligeramente o e2e más adelante,
igual que el resto del panel del festejado.

## Variables de entorno

- `ADMIN_EMAILS` — correos de administradores separados por comas (ej.
  `cristobal@parapaquetes.com`). Sin valor ⇒ nadie tiene acceso admin.

## Fuera de alcance

- Gestión del plan Premium por evento (es fase 2 en el PRD; no hay columna de
  plan todavía).
- Asignar el rol admin desde la UI (se hace por env; migrar a `is_admin` en DB
  es evolución futura si se necesita dar acceso a terceros).
- Acciones masivas, exportación, métricas/analytics del negocio.
