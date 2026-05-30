# Diseño: Correos transaccionales por Resend (Entrega A)

Fecha: 2026-05-30
Estado: aprobado, listo para plan

## Problema / objetivo

La plomería de correos existe (`src/notificaciones/`: `correos.ts` arma plantillas,
`enviador.ts` es el puerto, `resend.ts` el adaptador, `enviador.fake.ts` para
pruebas) **pero no se dispara en ningún flujo de la app** — hoy no se manda ningún
correo. Queremos:

1. **Conectar el envío real por Resend** en los flujos de la app.
2. **Mejorar las plantillas** a HTML con marca RegalaLove (hoy son un `<p>` mínimo).

## Alcance

**Entrega A (esta spec) — correos que manda nuestra app:**
- `comprobante_invitado` — al invitado cuando aporta (plantilla ya existe).
- `aviso_aportacion_festejado` — al festejado cuando recibe un regalo (ya existe).
- `aviso_retiro_festejado` — al festejado cuando se completa un retiro (ya existe).
- `bienvenida` — al festejado tras confirmar su correo (**plantilla nueva**).

**Entrega B (follow-up, fuera de esta spec):** brandear el correo de
"confirma tu correo", que lo manda **Supabase Auth**, no nuestra app —
requiere configurar SMTP de Resend en Supabase + plantilla. Es más config que código.

## Decisiones de diseño (aprobadas)

1. **Disparo inline y no bloqueante.** El envío ocurre dentro de los server actions
   existentes, envuelto en `try/catch`: si Resend falla, el pago/retiro/login del
   usuario **igual procede** y solo se loguea el error. Nada de colas ni cron (YAGNI).
2. **Plantillas HTML con marca** mediante un layout compartido + contenido por correo.
3. **Factory de enviador**: si hay `RESEND_API_KEY` → Resend real; si no (dev) → un
   enviador no-op que loguea. Así dev nunca truena y prod sí manda.

## Arquitectura y componentes

### 1. Factory de enviador — `src/notificaciones/enviador.factory.ts` (nuevo)
```
obtenerEnviador(): EnviadorCorreo
```
- Si `process.env.RESEND_API_KEY` y `CORREO_REMITENTE` están → `crearEnviadorResend()`.
- Si no → un enviador no-op que hace `console.warn` ("correo omitido: falta RESEND_API_KEY")
  y registra qué se hubiera mandado. Mantiene dev/preview funcionando sin credenciales.

### 2. Plantillas HTML con marca — mejora de `src/notificaciones/resend.ts`
- Un helper `layout({ titulo, cuerpoHtml, cta })` que envuelve el contenido en una
  tabla HTML responsiva con: encabezado con la marca **RegalaLove**, cuerpo, un botón
  de acción opcional (color `--accent` #ff5a5f), y pie con `regalalove.com`.
- `renderizar(plantilla, datos)` usa ese layout y produce `{ asunto, html }` por cada
  plantilla, incluida la nueva `bienvenida`.
- Estructura visual:
  ```
  ┌───────────────────────────────┐
  │         RegalaLove ❤️          │
  ├───────────────────────────────┤
  │  <encabezado + cuerpo>         │
  │     [ botón CTA opcional ]     │
  ├───────────────────────────────┤
  │  RegalaLove · regalalove.com   │
  └───────────────────────────────┘
  ```
- El logo en correo va como **texto estilizado** ("Regala" + "Love" en coral) — no se
  incrusta imagen para evitar dependencia de hosting/CID y problemas de clientes de correo.

### 3. Nueva plantilla `bienvenida`
- Agregar `"bienvenida"` al tipo `PlantillaCorreo` en `correos.ts`.
- Builder `correoBienvenida(festejado: { nombre; correo }): CorreoPendiente`.
- Render: saludo + "tu cuenta está lista" + CTA "Crear mi mesa" (a `URL_BASE/dashboard`).

### 4. Disparadores (inline, no bloqueante)

- **`src/app/[slug]/aportar/acciones.ts` → `procesarAportacion`** (ya usa el cliente
  service-role `crearClienteServidor`):
  - Tras `asentarAportacion`, recopilar datos: nombre del ítem (query a `items_mesa`
    por `itemId`, o "Fondo general" si no hay ítem) y correo/nombre del festejado
    (`supabase.auth.admin.getUserById(evento.festejado_id)`; requiere añadir
    `festejado_id` al `select` del evento).
  - Construir con `correosPorAportacion(...)` y enviar con
    `enviarCorreos(obtenerEnviador(), correos)` dentro de `try/catch`.
  - El correo del festejado puede no tener nombre (solo email): usar el email como
    fallback de `nombreFestejado`.

- **`src/app/dashboard/mesa/[slug]/retirar/acciones.ts` → `solicitarRetiro`**:
  - Tras insertar el retiro con éxito, el festejado es el `user` logueado:
    construir `correoPorRetiro({ monto }, { nombre: user.email!, correo: user.email! })`
    y enviar dentro de `try/catch`.

- **`src/app/auth/callback/route.ts` → `GET`**:
  - Tras `exchangeCodeForSession` exitoso, obtener `user` (`getUser()`) y enviar
    `correoBienvenida(...)` dentro de `try/catch` antes del redirect.
  - Nota: la app usa login con contraseña (no magic links), así que `/auth/callback`
    se visita esencialmente solo al confirmar el correo → la bienvenida se manda una vez.

### 5. Manejo de errores
- Todo envío va en `try/catch`; en error: `console.error` y continuar. **Nunca** se
  propaga al usuario (un fallo de correo no debe abortar un pago, retiro o login).

### 6. Pruebas (Vitest)
- `correos.ts`: agregar test de `correoBienvenida` (destinatario + plantilla + datos).
- `resend.ts`: tests de `renderizar` para cada plantilla — que el `asunto` sea el
  esperado y que el `html` **contenga** los datos clave (monto formateado, nombres,
  el CTA). No se hace fetch real.
- `enviador.factory.ts`: test de que sin `RESEND_API_KEY` devuelve el no-op (y no lanza).
- Los flujos siguen testeables con `crearEnviadorFake()`; no se hacen llamadas de red
  en pruebas.

## Ops (requiere acción del usuario, fuera del código)
- Verificar el dominio **regalalove.com** en Resend.
- Poner `RESEND_API_KEY` en **Vercel** (Production) y en `.env.local` para dev.
- `CORREO_REMITENTE` ya está como `RegalaLove <no-responder@regalalove.com>`.

## Fuera de alcance (YAGNI)
- **Entrega B**: brandear el correo de confirmación de Supabase (SMTP Resend + plantilla).
- Reintentos/cola de correos, tracking de aperturas, internacionalización.
- Incrustar el logo como imagen (se usa texto estilizado).

## Criterios de éxito
- Al aportar (checkout simulado), el invitado recibe comprobante y el festejado recibe
  aviso (cuando hay `RESEND_API_KEY`); sin la key, el flujo sigue sin romperse.
- Al completar un retiro, el festejado recibe el aviso.
- Al confirmar el correo, el festejado recibe la bienvenida.
- Los correos se ven con marca (encabezado RegalaLove, botón, pie).
- `pnpm test` y `pnpm exec tsc --noEmit` verdes.
