// Crea (idempotente) un usuario de prueba confirmado y le siembra una mesa con
// algunos regalos, para poder capturar las pantallas con sesión.
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const EMAIL = "mobiletest@regalove.test";
const PASSWORD = "Mobile-Test-1234";

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// 1) Usuario confirmado (si ya existe, lo reusa)
let userId;
const creado = await admin.auth.admin.createUser({
  email: EMAIL,
  password: PASSWORD,
  email_confirm: true,
});
if (creado.error && !creado.error.message.toLowerCase().includes("already")) {
  throw creado.error;
}
if (creado.data?.user) {
  userId = creado.data.user.id;
} else {
  const { data } = await admin.auth.admin.listUsers();
  userId = data.users.find((u) => u.email === EMAIL)?.id;
}
if (!userId) throw new Error("No se pudo obtener el id del usuario de prueba");

// 2) Mesa de prueba con ítems (idempotente por slug)
const slug = "mesa-de-prueba-movil";
const { data: existente } = await admin.from("eventos").select("id").eq("slug", slug).maybeSingle();
let eventoId = existente?.id;
if (!eventoId) {
  const { data, error } = await admin
    .from("eventos")
    .insert({ festejado_id: userId, tipo: "boda", titulo: "Mesa de prueba móvil", slug, codigo: "9001" })
    .select("id")
    .single();
  if (error) throw error;
  eventoId = data.id;

  const { data: cat } = await admin
    .from("catalogo_items")
    .select("id, nombre, descripcion, imagen_url, precio_centavos")
    .limit(4);
  await admin.from("items_mesa").insert(
    (cat ?? []).map((c, i) => ({
      evento_id: eventoId,
      catalogo_item_id: c.id,
      nombre: c.nombre,
      descripcion: c.descripcion,
      imagen_url: c.imagen_url,
      monto_meta_centavos: c.precio_centavos,
      cantidad: 1,
      orden: i,
    })),
  );
}

console.log(JSON.stringify({ EMAIL, PASSWORD, slug }));
