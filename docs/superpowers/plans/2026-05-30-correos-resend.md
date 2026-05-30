# Correos transaccionales por Resend (Entrega A) · Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la app mande de verdad, por Resend, correos con marca: comprobante al invitado, aviso de aportación y de retiro al festejado, y bienvenida al confirmar la cuenta.

**Architecture:** Las plantillas se renderizan a HTML con marca en `resend.ts`. Un factory elige Resend (si hay `RESEND_API_KEY`) o un no-op que loguea (dev). Los flujos existentes (checkout, retiro, callback de confirmación) disparan el envío inline, envuelto en `try/catch` para no romper nunca el flujo del usuario.

**Tech Stack:** Next.js 16 (server actions + route handlers), Resend REST API (`fetch`), Vitest.

**Branch:** `feat/correos-resend` (ya creada; ya tiene la spec commiteada).

---

## Estructura de archivos

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `src/notificaciones/correos.ts` | Tipos + builders de correos (agregar `bienvenida`) | Modificar |
| `src/notificaciones/correos.test.ts` | Test del builder de bienvenida | Modificar |
| `src/notificaciones/resend.ts` | Layout HTML con marca + `renderizar` (export) + adaptador Resend | Modificar |
| `src/notificaciones/resend.test.ts` | Tests de `renderizar` por plantilla | Crear |
| `src/notificaciones/enviador.factory.ts` | `obtenerEnviador()` (Resend o no-op) | Crear |
| `src/notificaciones/enviador.factory.test.ts` | Test de selección del factory | Crear |
| `src/app/[slug]/aportar/acciones.ts` | Disparar comprobante + aviso al asentar aportación | Modificar |
| `src/app/dashboard/mesa/[slug]/retirar/acciones.ts` | Disparar aviso de retiro | Modificar |
| `src/app/auth/callback/route.ts` | Disparar bienvenida al confirmar correo | Modificar |

---

## Task 1: Plantilla y builder `bienvenida` (TDD)

**Files:**
- Modify: `src/notificaciones/correos.ts`
- Modify: `src/notificaciones/correos.test.ts`

- [ ] **Step 1: Escribir el test que falla**

En `src/notificaciones/correos.test.ts`, cambiar la línea de import para incluir `correoBienvenida`:

```ts
import { correosPorAportacion, correoPorRetiro, correoBienvenida } from "./correos";
```

Y agregar al final del archivo:

```ts
test("la bienvenida va al festejado con su nombre", () => {
  const correo = correoBienvenida({ nombre: "Ana", correo: "ana@example.com" });

  expect(correo.plantilla).toBe("bienvenida");
  expect(correo.destinatario).toBe("ana@example.com");
  expect(correo.datos).toMatchObject({ nombreFestejado: "Ana" });
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `pnpm test src/notificaciones/correos.test.ts`
Expected: FAIL — `correoBienvenida` no existe / tipo `"bienvenida"` no asignable.

- [ ] **Step 3: Implementar**

En `src/notificaciones/correos.ts`:

1. Agregar `"bienvenida"` al union `PlantillaCorreo`:

```ts
export type PlantillaCorreo =
  | "comprobante_invitado"
  | "aviso_aportacion_festejado"
  | "aviso_retiro_festejado"
  | "bienvenida";
```

2. Agregar al final del archivo el builder:

```ts
/** Correo de bienvenida al festejado tras confirmar su cuenta. */
export function correoBienvenida(festejado: Festejado): CorreoPendiente {
  return {
    destinatario: festejado.correo,
    plantilla: "bienvenida",
    datos: {
      nombreFestejado: festejado.nombre,
    },
  };
}
```

- [ ] **Step 4: Correr para ver que pasa**

Run: `pnpm test src/notificaciones/correos.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/notificaciones/correos.ts src/notificaciones/correos.test.ts
git commit -m "feat(correos): builder y plantilla de bienvenida"
```

---

## Task 2: Plantillas HTML con marca en `resend.ts` (TDD)

**Files:**
- Modify: `src/notificaciones/resend.ts`
- Create: `src/notificaciones/resend.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/notificaciones/resend.test.ts`:

```ts
import { test, expect } from "vitest";
import { renderizar } from "./resend";

test("comprobante_invitado: asunto, datos y marca en el html", () => {
  const { asunto, html } = renderizar("comprobante_invitado", {
    nombreInvitado: "Tía Lucha",
    monto: 50000,
    itemNombre: "Vajilla",
  });
  expect(asunto).toBe("Tu regalo fue recibido 🎁");
  expect(html).toContain("Tía Lucha");
  expect(html).toContain("Vajilla");
  expect(html).toContain("$500.00");
  expect(html).toContain("Love"); // marca en el encabezado
});

test("aviso_aportacion_festejado: invitado, monto, item y CTA al panel", () => {
  const { asunto, html } = renderizar("aviso_aportacion_festejado", {
    nombreFestejado: "Ana",
    nombreInvitado: "Tía Lucha",
    monto: 50000,
    itemNombre: "Vajilla",
  });
  expect(asunto).toContain("regalo");
  expect(html).toContain("Tía Lucha");
  expect(html).toContain("$500.00");
  expect(html).toContain("/dashboard");
});

test("aviso_retiro_festejado: incluye el monto", () => {
  const { html } = renderizar("aviso_retiro_festejado", { nombreFestejado: "Ana", monto: 120000 });
  expect(html).toContain("$1,200.00");
});

test("bienvenida: saluda al festejado y enlaza a crear mesa", () => {
  const { asunto, html } = renderizar("bienvenida", { nombreFestejado: "Ana" });
  expect(asunto).toContain("Bienvenido");
  expect(html).toContain("Ana");
  expect(html).toContain("/dashboard");
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `pnpm test src/notificaciones/resend.test.ts`
Expected: FAIL — `renderizar` no está exportado.

- [ ] **Step 3: Implementar el layout con marca y exportar `renderizar`**

En `src/notificaciones/resend.ts`, reemplazar la función `renderizar` (y dejar todo lo demás igual: imports, `pesos`, `crearEnviadorResend`) por esto. **Importante:** `renderizar` ahora se **exporta**.

```ts
const MARCA = "RegalaLove";

function urlBase(): string {
  return process.env.URL_BASE ?? "https://regalalove.com";
}

/** Envuelve el contenido en una plantilla HTML con marca RegalaLove. */
function layout(opts: {
  encabezado: string;
  cuerpoHtml: string;
  cta?: { texto: string; url: string };
}): string {
  const boton = opts.cta
    ? `<a href="${opts.cta.url}" style="display:inline-block;background:#ff5a5f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 22px;border-radius:10px;margin-top:12px;">${opts.cta.texto}</a>`
    : "";
  return `<!doctype html>
<html lang="es"><body style="margin:0;background:#fafafa;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fafafa;padding:24px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border:1px solid #e7e7ea;border-radius:14px;overflow:hidden;">
        <tr><td style="padding:20px 28px;border-bottom:1px solid #e7e7ea;">
          <span style="font-size:20px;font-weight:800;letter-spacing:-0.03em;">Regala<span style="color:#ff5a5f;">Love</span></span>
        </td></tr>
        <tr><td style="padding:28px;">
          <h1 style="font-size:20px;margin:0 0 12px;">${opts.encabezado}</h1>
          ${opts.cuerpoHtml}
          ${boton}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid #e7e7ea;color:#6b7280;font-size:12px;">
          ${MARCA} · <a href="${urlBase()}" style="color:#6b7280;">regalalove.com</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/** Render de cada plantilla a asunto + HTML con marca. */
export function renderizar(
  plantilla: PlantillaCorreo,
  datos: Record<string, unknown>,
): { asunto: string; html: string } {
  switch (plantilla) {
    case "comprobante_invitado":
      return {
        asunto: "Tu regalo fue recibido 🎁",
        html: layout({
          encabezado: `¡Gracias, ${datos.nombreInvitado}! 🎁`,
          cuerpoHtml: `<p style="margin:0 0 8px;color:#3f3f46;">Recibimos tu aportación de <strong>${pesos(datos.monto)}</strong> para <strong>${datos.itemNombre}</strong>.</p><p style="margin:0;color:#6b7280;font-size:14px;">Tu regalo ya cuenta para la mesa. ¡Gracias por participar!</p>`,
        }),
      };
    case "aviso_aportacion_festejado":
      return {
        asunto: "¡Recibiste un regalo! 🎉",
        html: layout({
          encabezado: `¡Recibiste un regalo, ${datos.nombreFestejado}! 🎉`,
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;"><strong>${datos.nombreInvitado}</strong> aportó <strong>${pesos(datos.monto)}</strong> para <strong>${datos.itemNombre}</strong>.</p>`,
          cta: { texto: "Ver mi mesa →", url: `${urlBase()}/dashboard` },
        }),
      };
    case "aviso_retiro_festejado":
      return {
        asunto: "Tu retiro se completó 💸",
        html: layout({
          encabezado: "Tu retiro se completó 💸",
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;">Hola ${datos.nombreFestejado}, tu retiro de <strong>${pesos(datos.monto)}</strong> fue procesado y va en camino a tu cuenta.</p>`,
          cta: { texto: "Ver mi panel →", url: `${urlBase()}/dashboard` },
        }),
      };
    case "bienvenida":
      return {
        asunto: "Bienvenido a RegalaLove ❤️",
        html: layout({
          encabezado: `¡Bienvenido, ${datos.nombreFestejado}! ❤️`,
          cuerpoHtml: `<p style="margin:0;color:#3f3f46;">Tu cuenta está lista. Crea tu mesa de regalos en minutos y compártela con tus invitados.</p>`,
          cta: { texto: "Crear mi mesa →", url: `${urlBase()}/dashboard` },
        }),
      };
  }
}
```

- [ ] **Step 4: Correr para ver que pasa**

Run: `pnpm test src/notificaciones/resend.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Verificar typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add src/notificaciones/resend.ts src/notificaciones/resend.test.ts
git commit -m "feat(correos): plantillas HTML con marca RegalaLove"
```

---

## Task 3: Factory de enviador (TDD)

**Files:**
- Create: `src/notificaciones/enviador.factory.ts`
- Create: `src/notificaciones/enviador.factory.test.ts`

- [ ] **Step 1: Escribir los tests que fallan**

Crear `src/notificaciones/enviador.factory.test.ts`:

```ts
import { test, expect, vi, beforeEach, afterEach } from "vitest";
import { obtenerEnviador } from "./enviador.factory";

const ORIG = { ...process.env };
beforeEach(() => {
  delete process.env.RESEND_API_KEY;
  delete process.env.CORREO_REMITENTE;
});
afterEach(() => {
  process.env = { ...ORIG };
});

test("sin RESEND_API_KEY devuelve un enviador no-op que no lanza", async () => {
  const enviador = obtenerEnviador();
  const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

  await expect(
    enviador.enviar({ destinatario: "a@b.com", plantilla: "bienvenida", datos: {} }),
  ).resolves.toBeUndefined();
  expect(warn).toHaveBeenCalled();

  warn.mockRestore();
});

test("con credenciales construye el enviador de Resend sin lanzar", () => {
  process.env.RESEND_API_KEY = "re_test";
  process.env.CORREO_REMITENTE = "RegalaLove <no-responder@regalalove.com>";

  expect(() => obtenerEnviador()).not.toThrow();
});
```

- [ ] **Step 2: Correr para ver que falla**

Run: `pnpm test src/notificaciones/enviador.factory.test.ts`
Expected: FAIL — módulo `./enviador.factory` no existe.

- [ ] **Step 3: Implementar**

Crear `src/notificaciones/enviador.factory.ts`:

```ts
import type { CorreoPendiente } from "./correos.js";
import type { EnviadorCorreo } from "./enviador.js";
import { crearEnviadorResend } from "./resend.js";

/** Enviador no-op: loguea en vez de mandar. Para dev/preview sin credenciales. */
function crearEnviadorNoop(): EnviadorCorreo {
  return {
    async enviar(correo: CorreoPendiente): Promise<void> {
      console.warn(
        `[correo omitido] falta RESEND_API_KEY — destino=${correo.destinatario} plantilla=${correo.plantilla}`,
      );
    },
  };
}

/**
 * Elige el enviador según el entorno: Resend si hay credenciales completas,
 * si no un no-op que no rompe el flujo (dev/preview).
 */
export function obtenerEnviador(): EnviadorCorreo {
  if (process.env.RESEND_API_KEY && process.env.CORREO_REMITENTE) {
    return crearEnviadorResend();
  }
  return crearEnviadorNoop();
}
```

- [ ] **Step 4: Correr para ver que pasa**

Run: `pnpm test src/notificaciones/enviador.factory.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/notificaciones/enviador.factory.ts src/notificaciones/enviador.factory.test.ts
git commit -m "feat(correos): factory de enviador (Resend o no-op)"
```

---

## Task 4: Disparar correos en la aportación

**Files:**
- Modify: `src/app/[slug]/aportar/acciones.ts`

- [ ] **Step 1: Agregar imports**

Tras los imports existentes en `src/app/[slug]/aportar/acciones.ts`, agregar:

```ts
import { correosPorAportacion } from "@/notificaciones/correos";
import { enviarCorreos } from "@/notificaciones/enviador";
import { obtenerEnviador } from "@/notificaciones/enviador.factory";
```

- [ ] **Step 2: Incluir `festejado_id` en el select del evento**

Buscar:

```ts
  const { data: evento } = await supabase
    .from("eventos")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) throw new Error("Mesa no encontrada");
```

Reemplazar el `.select("id")` por `.select("id, festejado_id")` (el resto igual):

```ts
  const { data: evento } = await supabase
    .from("eventos")
    .select("id, festejado_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!evento) throw new Error("Mesa no encontrada");
```

- [ ] **Step 3: Disparar los correos tras asentar (no bloqueante)**

Buscar el bloque final:

```ts
  revalidatePath(`/${slug}`);
  redirect(`/${slug}/gracias?monto=${montoPesos}`);
}
```

Insertar ANTES de `revalidatePath` el envío de correos:

```ts
  // Correos transaccionales: no deben romper el flujo si Resend falla.
  try {
    let itemNombre = "Fondo general";
    if (itemId) {
      const { data: item } = await supabase
        .from("items_mesa")
        .select("nombre")
        .eq("id", itemId)
        .maybeSingle();
      if (item?.nombre) itemNombre = item.nombre;
    }
    const { data: festejadoUser } = await supabase.auth.admin.getUserById(evento.festejado_id);
    const correoFestejado = festejadoUser?.user?.email;
    if (correoFestejado) {
      const correos = correosPorAportacion(
        { invitado: { nombre, correo, mensaje }, monto: montoCentavos, itemNombre },
        { nombre: correoFestejado, correo: correoFestejado },
      );
      await enviarCorreos(obtenerEnviador(), correos);
    }
  } catch (e) {
    console.error("No se pudieron enviar los correos de la aportación:", e);
  }

  revalidatePath(`/${slug}`);
  redirect(`/${slug}/gracias?monto=${montoPesos}`);
}
```

(`supabase` aquí es el cliente service-role de `crearClienteServidor`, por eso `auth.admin.getUserById` está disponible.)

- [ ] **Step 4: Verificar typecheck y suite**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

Run: `pnpm test`
Expected: toda la suite PASS.

- [ ] **Step 5: Commit**

```bash
git add src/app/[slug]/aportar/acciones.ts
git commit -m "feat(correos): enviar comprobante y aviso al asentar una aportación"
```

---

## Task 5: Disparar el aviso de retiro

**Files:**
- Modify: `src/app/dashboard/mesa/[slug]/retirar/acciones.ts`

- [ ] **Step 1: Agregar imports**

Tras los imports existentes, agregar:

```ts
import { correoPorRetiro } from "@/notificaciones/correos";
import { enviarCorreos } from "@/notificaciones/enviador";
import { obtenerEnviador } from "@/notificaciones/enviador.factory";
```

- [ ] **Step 2: Enviar tras insertar el retiro**

En `solicitarRetiro`, buscar el final:

```ts
  if (error) throw new Error(`No se pudo procesar el retiro: ${error.message}`);

  revalidatePath(`/dashboard/mesa/${slug}/retirar`);
  revalidatePath(`/dashboard/mesa/${slug}/recibido`);
}
```

Insertar el envío ANTES de los `revalidatePath`:

```ts
  if (error) throw new Error(`No se pudo procesar el retiro: ${error.message}`);

  // Aviso de retiro (no bloqueante). El festejado es el usuario logueado.
  try {
    if (user.email) {
      await enviarCorreos(obtenerEnviador(), [
        correoPorRetiro({ monto: montoCentavos }, { nombre: user.email, correo: user.email }),
      ]);
    }
  } catch (e) {
    console.error("No se pudo enviar el aviso de retiro:", e);
  }

  revalidatePath(`/dashboard/mesa/${slug}/retirar`);
  revalidatePath(`/dashboard/mesa/${slug}/recibido`);
}
```

- [ ] **Step 3: Verificar typecheck**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/mesa/[slug]/retirar/acciones.ts
git commit -m "feat(correos): enviar aviso al completar un retiro"
```

---

## Task 6: Disparar la bienvenida al confirmar el correo

**Files:**
- Modify: `src/app/auth/callback/route.ts`

- [ ] **Step 1: Agregar imports**

Tras los imports existentes en `src/app/auth/callback/route.ts`, agregar:

```ts
import { correoBienvenida } from "@/notificaciones/correos";
import { enviarCorreos } from "@/notificaciones/enviador";
import { obtenerEnviador } from "@/notificaciones/enviador.factory";
```

- [ ] **Step 2: Enviar la bienvenida tras intercambiar el código**

Buscar:

```ts
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${destino}`);
    }
```

Reemplazar por:

```ts
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Bienvenida (no bloqueante). La app usa login con contraseña, así que
      // este callback se visita esencialmente solo al confirmar el correo.
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email) {
          await enviarCorreos(obtenerEnviador(), [
            correoBienvenida({ nombre: user.email, correo: user.email }),
          ]);
        }
      } catch (e) {
        console.error("No se pudo enviar la bienvenida:", e);
      }
      return NextResponse.redirect(`${origin}${destino}`);
    }
```

- [ ] **Step 3: Verificar typecheck y suite completa**

Run: `pnpm exec tsc --noEmit`
Expected: sin errores.

Run: `pnpm test`
Expected: toda la suite PASS.

- [ ] **Step 4: Commit**

```bash
git add src/app/auth/callback/route.ts
git commit -m "feat(correos): enviar bienvenida al confirmar el correo"
```

---

## Task 7: Verificación y notas de operación

**Files:** ninguno (verificación).

- [ ] **Step 1: Suite + typecheck**

Run: `pnpm test && pnpm exec tsc --noEmit`
Expected: todas las pruebas PASS, typecheck limpio.

- [ ] **Step 2: Prueba en dev sin credenciales (no rompe)**

Con `pnpm dev` y sin `RESEND_API_KEY` en `.env.local`: hacer una aportación de prueba (checkout simulado). Expected: el flujo llega a `/gracias` normal y en la consola del server aparece `[correo omitido] falta RESEND_API_KEY ...` (el no-op). Nada se rompe.

- [ ] **Step 3: (Operación, requiere al usuario) habilitar el envío real**

Para que salgan de verdad:
1. Verificar el dominio **regalalove.com** en Resend (DNS).
2. Crear una **API key** en Resend.
3. Poner `RESEND_API_KEY=...` en **Vercel** (Production) y en `.env.local` para dev.
4. `CORREO_REMITENTE` ya está como `RegalaLove <no-responder@regalalove.com>`.
5. Redeploy en Vercel (las env vars de servidor se aplican al correr).

Tras esto, una aportación/retiro/confirmación reales mandan el correo con marca.

---

## Self-review (cobertura del spec)

- Conectar envío real por Resend en los flujos → Tasks 4, 5, 6. ✅
- Plantillas HTML con marca (layout + CTA + pie) → Task 2. ✅
- Plantilla `bienvenida` nueva → Tasks 1 (builder) y 2 (render). ✅
- Factory Resend/no-op para no romper dev → Task 3. ✅
- Disparo inline no bloqueante (try/catch) → Tasks 4, 5, 6. ✅
- Correo del festejado vía service-role (`auth.admin.getUserById`) → Task 4. ✅
- Festejado en retiro/bienvenida = usuario logueado (`user.email`) → Tasks 5, 6. ✅
- Pruebas: builder bienvenida, render por plantilla, selección de factory → Tasks 1–3. ✅
- Fuera de alcance (Entrega B: correo de confirmación de Supabase) → no se toca. ✅
- Ops (dominio + API key) → Task 7 Step 3. ✅
