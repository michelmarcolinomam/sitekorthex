import { env } from "cloudflare:workers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * O acesso ao banco do Korthex, num módulo só.
 *
 * Mora sozinho de propósito: `cloudflare:workers` não existe no navegador, e
 * este import só some do bundle do cliente enquanto nada que o navegador
 * enxerga referenciar esta função. Por isso ela é usada apenas dentro dos
 * handlers das server functions (que o TanStack remove do lado do cliente) —
 * nunca em código que roda nos dois lados.
 *
 * A chave é a service_role: ela só existe no Worker e nunca vai ao navegador.
 * Todas as tabelas estão no schema `public` do projeto dedicado Korthex, com
 * RLS ligado e sem policy pública — quem lê é o servidor.
 */

interface KorthexEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE: string;
}

export function supabaseKorthex(): SupabaseClient {
  const e = env as unknown as KorthexEnv;
  if (!e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE) {
    throw new Error(
      "Supabase não configurado: defina SUPABASE_URL (wrangler.jsonc) e SUPABASE_SERVICE_ROLE (.dev.vars / secret).",
    );
  }
  return createClient(e.SUPABASE_URL, e.SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
