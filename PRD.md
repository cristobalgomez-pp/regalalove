# PRD — Regalove (v1 / MVP)

> Mesa de regalos en efectivo para eventos, con bodas como mercado de lanzamiento. El festejado crea una mesa con lista de deseos; los invitados aportan dinero (entero o fraccionado) sin necesidad de cuenta; todo se convierte en saldo flexible que el festejado retira a su cuenta bancaria. Cobro y dispersión vía EcartPay.

---

## Problem Statement

Quien organiza una boda (o cualquier evento) en México quiere recibir apoyo económico de sus invitados de forma moderna y flexible, sin depender de las mesas de regalos físicas de tiendas departamentales (limitadas a productos de catálogo, devoluciones engorrosas, y que no permiten usar el dinero como uno quiera). Por el otro lado, el invitado quiere regalar de forma fácil, desde su casa, con un par de toques en el celular, sintiendo que regala "algo" concreto y con la certeza de que su dinero llegó. Hoy las opciones existentes (como RegalaShop) resuelven parte del problema pero dejan espacio para una experiencia más cálida, más compartible y con mejor conversión de pago.

## Solution

**Regalove**: una plataforma web donde el festejado crea una **mesa de regalos** envuelta en una **página de evento** atractiva (foto, historia, fecha, cuenta regresiva). La mesa es una **lista de deseos protagonista**: ítems con precio (vajilla, refri, "una noche de la luna de miel") que funcionan como ancla emocional y de monto, más un **fondo general** para quien prefiere solo dar dinero. Los invitados aportan **sin crear cuenta** (guest checkout), de forma **completa o fraccionada** (varios pueden completar un mismo ítem, con barra de progreso). Todo el dinero —independientemente del ítem elegido— se convierte en **saldo flexible** que el festejado puede **retirar a su CLABE** en cualquier momento (con una retención parcial corta para amortiguar contracargos), verificando su identidad (KYC) en el primer retiro.

El cobro a invitados y la dispersión al festejado se hacen a través de **EcartPay** (con quien ya existe relación directa), de modo que Regalove **nunca custodia legalmente el dinero** y no requiere licencia IFPE para operar: la experiencia se siente como "tengo un saldo y lo retiro", pero los fondos viven en el proveedor regulado.

El modelo de ingresos combina: **comisión base configurable** al festejado, **absorción opcional de la comisión por parte del invitado** ("que el festejado reciba el 100%"), y un **plan Premium por evento** con comisión reducida y funciones extra. Todos estos parámetros son **editables sin tocar código**.

## User Stories

### Festejado — creación y gestión de la mesa
1. Como festejado, quiero crear una cuenta con correo y contraseña, para administrar mi mesa y volver cuando quiera.
2. Como festejado, quiero crear una mesa eligiendo el **tipo de evento** (boda en el lanzamiento, con la plataforma preparada para otros tipos), para que el lenguaje y la presentación se ajusten a mi celebración.
3. Como festejado, quiero armar una **lista de deseos** con ítems que tengan nombre, imagen, descripción y precio meta, para anclar montos y darle un gancho emocional a mis invitados.
4. Como festejado, quiero que exista siempre un **fondo general** ("aportar libre") que nunca se llena, para los invitados que solo quieren dar dinero.
5. Como festejado, quiero editar, reordenar y eliminar ítems de mi lista mientras la mesa esté activa, para mantenerla al día.
6. Como festejado, quiero personalizar mi **página de evento** (foto de portada, historia/mensaje, fecha y lugar del evento, cuenta regresiva), para que el link que comparto sea cálido y se sienta mío.
7. Como festejado, quiero obtener un **link personalizado** de mi mesa (ej. `regalove.com/juan-y-ana`), para compartirlo fácilmente.
8. Como festejado, quiero un botón para **compartir por WhatsApp** con un solo toque, para difundir mi mesa por el canal que usan mis invitados.
9. Como festejado, quiero generar un **código QR** de mi mesa, para imprimirlo en mis invitaciones físicas.

### Festejado — dashboard y notificaciones
10. Como festejado, quiero ver en un **dashboard** mi saldo total, el saldo retirable y el retenido, para saber con qué cuento.
11. Como festejado, quiero ver la lista de **aportaciones recibidas** (quién, cuánto, a qué ítem, con su mensaje), para agradecer y llevar registro.
12. Como festejado, quiero ver el **progreso de cada ítem** (porcentaje fondeado, completado), para saber qué falta.
13. Como festejado, quiero recibir una **notificación en vivo en el dashboard** cuando alguien aporta, para enterarme al instante.
14. Como festejado, quiero recibir un **correo** cuando recibo una aportación y cuando se completa un retiro, para estar informado aunque no esté en la plataforma.

### Festejado — retiros y KYC
15. Como festejado, quiero **retirar mi saldo en cualquier momento**, para disponer de mi dinero sin esperar al evento.
16. Como festejado, quiero entender que una parte de mi saldo (aportaciones recientes con tarjeta) queda **retenida unos días** antes de ser retirable, para que el sistema me proteja de contracargos.
17. Como festejado, quiero que las aportaciones por métodos irreversibles (SPEI, OXXO/efectivo, CoDi) estén **disponibles de inmediato**, para acceder antes a ese dinero.
18. Como festejado, quiero **verificar mi identidad (KYC) y registrar mi CLABE en mi primer retiro**, para cobrar de forma segura sin fricción al registrarme.
19. Como festejado, quiero ver el **estado de cada retiro** (en proceso, completado), para saber cuándo llega mi dinero.

### Invitado — descubrimiento y aportación
20. Como invitado, quiero abrir el link de la mesa desde WhatsApp en mi celular y ver una **página bonita del evento**, para sentir que estoy invitado, no solo que me piden dinero.
21. Como invitado, quiero ver la **lista de deseos con barras de progreso**, para elegir a qué quiero contribuir.
22. Como invitado, quiero aportar a un ítem de forma **fraccionada** (poner $300 de $3,500), para participar aunque no pueda cubrir el ítem completo.
23. Como invitado, quiero poder **regalar un ítem completo** de un solo toque, para cubrirlo entero si así lo deseo.
24. Como invitado, quiero aportar al **fondo general** sin elegir ítem, para simplemente dar dinero.
25. Como invitado, quiero **aportar sin crear cuenta** (guest checkout), para no perder tiempo en registros.
26. Como invitado, quiero dejar mi **nombre y un mensaje** ("¡Felicidades! — Tía Lupe"), para que el festejado sepa quién regaló.
27. Como invitado, quiero pagar con **tarjeta, efectivo en tienda (OXXO), transferencia (SPEI) o CoDi**, para usar el método que me convenga.
28. Como invitado, quiero recibir un **comprobante por correo** de mi aportación, para tener la certeza de que mi dinero llegó.
29. Como invitado, quiero ver una opción para **cubrir la comisión** ("que Juan reciba el 100%, agrego $X"), para que mi regalo llegue completo si así lo decido.
30. Como invitado, quiero poder **desmarcar** esa opción de comisión fácilmente, para no sentirme obligado.

### Plataforma — monetización (configurable)
31. Como dueño del negocio, quiero cobrar una **comisión base configurable** al festejado sobre lo recaudado, para generar ingreso en cada mesa.
32. Como dueño del negocio, quiero ofrecer un **plan Premium por evento** (cuota fija configurable) que reduzca la comisión y desbloquee funciones, para una segunda vía de ingreso.
33. Como dueño del negocio, quiero que la **absorción de comisión por el invitado** aumente mi margen efectivo y mejore la oferta al festejado, para ser más competitivo que RegalaShop.
34. Como dueño del negocio, quiero **ajustar comisiones, precios y reglas** (porcentaje base, precio Premium, comisión Premium, si la casilla de absorción va pre-marcada) **sin tocar código**, para iterar con datos reales.

### Plataforma — administración interna
35. Como administrador, quiero ver todos los **eventos y sus saldos**, para dar soporte y monitorear el negocio.
36. Como administrador, quiero **marcar/flaggear eventos sospechosos**, para mitigar fraude.
37. Como administrador, quiero **editar la configuración de monetización** desde un panel, para cambiar parámetros sin despliegues.

## Implementation Decisions

### Arquitectura general
- Aplicación web **mobile-first (PWA)**, sin app nativa en v1. Stack: **Next.js (React)** para frontend y backend, **Supabase** (Postgres + Auth + Realtime), **Vercel** para hosting/deploy, **EcartPay** para pagos, proveedor transaccional de **correo** (ej. Resend/SendGrid).
- **Un solo tipo de usuario registrado: el festejado** (Supabase Auth). El invitado es **anónimo/efímero** (guest checkout, sin cuenta). Panel admin interno aparte.
- El modelo de datos es **agnóstico al tipo de evento**: un evento tiene un campo "tipo" configurable; nada de hardcodear "boda". El lenguaje/plantillas de lanzamiento apuntan a bodas, pero el motor soporta cualquier tipo.

### Modelo de custodia y flujo de dinero
- Regalove **no custodia legalmente los fondos**. El dinero vive en **EcartPay** (proveedor regulado). Regalove lleva el **"saldo lógico" de cada mesa** como fuente de verdad de cara al usuario, y dispara cobros y dispersiones contra EcartPay.
- Decisión de fondo: **"experiencia A (saldo flexible, retiro libre) sobre rieles B (proveedor regulado)"**, para no requerir licencia IFPE en el lanzamiento, conservando una arquitectura que permita migrar a un esquema regulado propio en el futuro sin rehacer el producto.
- Pendiente operativo a cerrar con EcartPay (no bloquea diseño): tiempos de dispersión, segregación del saldo en espera, límites por transacción, y requisitos de PLD/KYC que EcartPay exija a Regalove y al festejado.

### Módulos (con foco en módulos profundos / deep modules)
- **Motor de Saldo y Aportaciones (Ledger)** 🟢 — fuente de verdad del saldo. Registra cada aportación, la asigna a un ítem o al fondo general, calcula progreso por ítem, maneja **sobre-fondeo** (excedente se redirige al fondo general), y separa **saldo retirable vs. retenido** según método de pago y ventana de retención. Lógica de dominio aislada y testeable; no conoce a EcartPay.
- **Motor de Comisiones (Fees)** 🟢 — función pura dirigida por configuración. Entrada: aportación, plan del evento (Gratis/Premium), bandera de absorción del invitado. Salida: monto que paga el invitado, comisión, monto neto al festejado. Encapsula todas las reglas de monetización editables.
- **Adaptador de Pagos EcartPay** 🟢 — envuelve a EcartPay tras una interfaz estable: crear cobro (tarjeta/OXXO/SPEI/CoDi), procesar **webhooks** (pago confirmado/fallido/**contracargo**), iniciar **dispersión** a CLABE, e iniciar **KYC**. Único punto que conoce los detalles de EcartPay (seam real para poder cambiar de proveedor o agregar dispersión por STP si hiciera falta).
- **Retiros y KYC (orquestador)** 🟢 — valida saldo retirable, exige **KYC en el primer retiro**, registra CLABE, llama al adaptador para dispersar, y asienta el retiro en el Ledger.
- **Gestión de Mesa / Wishlist** — CRUD de evento (tipo configurable) e ítems con meta y estado "completado".
- **Página de Evento pública** — página compartible (portada, historia, fecha, cuenta regresiva, wishlist) + **guest checkout** + compartir por **WhatsApp/QR**.
- **Dashboard del Festejado** — administración de mesa, aportaciones en vivo, saldo, mensajes, retiro.
- **Notificaciones** — correo transaccional (comprobante al invitado, avisos al festejado) + feed en vivo vía **Supabase Realtime**.
- **Panel Admin (interno)** — eventos, saldos, banderas de fraude, edición de configuración de comisiones/precios.
- **Auth** — cuentas del festejado vía Supabase Auth.

### Reglas de negocio clave
- **Aportación fraccionada**: múltiples aportaciones por ítem; barra de progreso por ítem.
- **Ítem completado**: queda visible marcado "¡Completado!", no recibe más; cualquier excedente se **redirige al fondo general**.
- **Fondo general**: siempre presente, sin tope.
- **Retención parcial**: aportaciones con tarjeta quedan retenidas ~**7 días** (parámetro configurable) antes de ser retirables; SPEI/OXXO/CoDi se liberan de inmediato. La gobierna en gran parte EcartPay.
- **KYC diferido (lazy)**: se pide en el primer retiro, no en el registro.
- **Monetización configurable**: comisión base (default 5%), Premium por evento (default $499 MXN, comisión 3%), absorción opcional del invitado (casilla pre-marcada y desmarcable por default). Todos editables desde configuración/panel admin.

### Configuración editable
- Existe una capa de **configuración de monetización** (porcentajes, precios, flags) editable sin desplegar código, expuesta en el panel admin. Es un requisito explícito del producto.

## Testing Decisions

- **Qué hace una buena prueba aquí**: prueba el **comportamiento externo** del módulo (entradas → resultados y efectos observables), no detalles internos de implementación. Para los módulos de dinero, las pruebas afirman corrección monetaria (sumas, splits, retenciones, redirecciones de excedente) y manejo de casos borde (contracargo, sobre-fondeo, doble webhook).
- **Módulos con pruebas en v1** (los cuatro 🟢 de dinero, donde un error cuesta dinero real y confianza):
  1. **Motor de Saldo y Aportaciones (Ledger)** — asignación a ítem/fondo, progreso, sobre-fondeo → fondo general, separación retirable/retenido por método y ventana.
  2. **Motor de Comisiones (Fees)** — cálculo de comisión, neto al festejado, e impacto de la absorción del invitado, bajo distintas configuraciones (Gratis vs Premium).
  3. **Adaptador de Pagos EcartPay** — probado contra un **EcartPay simulado (mock)**: cobro, webhooks (confirmado/fallido/contracargo), dispersión, idempotencia ante webhooks repetidos.
  4. **Retiros y KYC (orquestador)** — bloqueo si no hay KYC, validación de saldo retirable, asiento correcto en el Ledger, manejo de fallos de dispersión.
- **Módulos de UI** (página de evento, dashboard, panel admin): sin pruebas unitarias exhaustivas en v1; se cubren con pruebas ligeras o de extremo a extremo más adelante.
- **Prior art**: al ser repositorio nuevo, no hay arte previo; estas pruebas establecerán el patrón. Se favorecen pruebas a nivel de la interfaz de cada módulo profundo (la interfaz es la superficie de prueba).

## Out of Scope

Fuera del alcance del v1 (planeado para fase 2 / posterior):
- **Plan Premium** completo (temas de lujo, dominio personalizado, sin marca "Powered by", reportes avanzados). El v1 deja el **gancho de configuración** pero la experiencia Premium rica es fase 2.
- **Invitación digital + RSVP** (confirmación de asistencia). Fase 2 / atado a Premium.
- **Notificaciones por WhatsApp** (WhatsApp Business API). Fase 2 / Premium; el v1 usa correo + feed en vivo en dashboard.
- **App nativa** (iOS/Android). El v1 es web mobile-first / PWA.
- **Otros tipos de evento al frente del marketing** (XV años, baby shower). El motor los soporta, pero el lanzamiento se enfoca en **bodas**.
- **Custodia propia regulada (IFPE) y dispersión por STP**. El v1 opera sobre EcartPay; migrar a esquema regulado propio es evolución futura.
- **Dominio definitivo**: durante construcción se usa el subdominio gratuito de Vercel; el dominio real se conecta al final (cambio de DNS + variable de config), sin atar `paraalimentos.com` ni otro dominio existente como placeholder.

## Further Notes

- **Marca**: Regalove (regalo + love). Nombre y URL base viven en **configuración** (`NOMBRE_MARCA`, `URL_BASE`), no en el código, para conectar el dominio definitivo sin refactorizar.
- **Competidor de referencia**: RegalaShop (regalashop.com.mx) — mismo modelo (mesa de dinero flexible). Diferenciadores de Regalove: página de evento más cálida y compartible (WhatsApp/QR), oferta de "el festejado recibe más" vía absorción de comisión, y experiencia mobile-first.
- **Canal de difusión principal**: WhatsApp; cada boda (~100+ invitados) es un motor de adquisición orgánica.
- **Construcción**: el proyecto se desarrolla de forma colaborativa (usuario + Claude Code), empezando por el esqueleto y avanzando módulo por módulo con despliegues tempranos en Vercel/Supabase.
- **Tracker**: el repositorio es `github.com/cristobalgomez-pp/regalove`. Para usar los skills `to-issues`/`to-prd` con publicación a tracker, se usarán **GitHub Issues** y se configurarán las etiquetas de triage (`ready-for-agent`).
