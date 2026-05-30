// Borra el usuario de prueba y su mesa (revierte seed-usuario-prueba.mjs).
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

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const EMAIL = "mobiletest@regalove.test";
const slug = "mesa-de-prueba-movil";

// La mesa (cascade borra items/aportaciones/retiros)
await admin.from("eventos").delete().eq("slug", slug);

// El usuario de auth
const { data } = await admin.auth.admin.listUsers();
const u = data.users.find((x) => x.email === EMAIL);
if (u) await admin.auth.admin.deleteUser(u.id);

console.log(JSON.stringify({ borrado: { email: EMAIL, slug, userId: u?.id ?? null } }));
