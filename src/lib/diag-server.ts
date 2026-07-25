import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "./access-auth";

/**
 * Camada de servidor do módulo DIAGNÓSTICOS do Korthex.
 *
 * Conecta no projeto Supabase Korthex usando a chave service_role, que só
 * existe no servidor (Cloudflare Worker) — nunca vai ao navegador. O acesso
 * ao painel já é protegido pelo Cloudflare Access via requireAdmin().
 *
 * As tabelas vivem no schema `public` do projeto dedicado Korthex (o projeto
 * inteiro é Korthex — não há MAM para misturar). Módulos futuros (crm, site,
 * emails) podem usar prefixo ou schema próprio exposto quando entrarem.
 */

interface DiagEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE: string;
}

function sb(): SupabaseClient {
  const e = env as unknown as DiagEnv;
  if (!e.SUPABASE_URL || !e.SUPABASE_SERVICE_ROLE) {
    throw new Error(
      "Supabase não configurado: defina SUPABASE_URL (wrangler.jsonc) e SUPABASE_SERVICE_ROLE (.dev.vars / secret).",
    );
  }
  return createClient(e.SUPABASE_URL, e.SUPABASE_SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export type ClienteStatus = "criado" | "lead" | "ativo" | "arquivado";

export interface Cliente {
  id: string;
  nome_empresa: string;
  chave: string;
  status: ClienteStatus;
  responsavel_nome: string | null;
  responsavel_cargo: string | null;
  responsavel_email: string | null;
  responsavel_telefone: string | null;
  observacoes: string | null;
  criado_por: string | null;
  lead_preenchido_em: string | null;
  created_at: string;
  updated_at: string;
}

export type AvaliacaoTipo =
  | "lideranca_time"
  | "lideranca_executivo"
  | "executivo_lideranca"
  | "performance_time";

/** Visão PÚBLICA do cliente — só o que a tela do cliente precisa ver. */
export interface DiagnosticoPublico {
  nome_empresa: string;
  chave: string;
  status: ClienteStatus;
  lead_preenchido: boolean;
  responsavel_nome: string | null;
  avaliacoes: {
    chave_avaliacao: string;
    tipo: AvaliacaoTipo;
    status: string;
    respondentes_esperados: number | null;
    lider_nome: string | null;
    lider_cargo: string | null;
  }[];
}

const CHAVE_RE = /^KX-[A-Z2-9]{4,10}$/;

function chaveValida(chave: string): string {
  const c = (chave ?? "").trim().toUpperCase();
  if (!CHAVE_RE.test(c)) throw new Error("Chave de acesso inválida.");
  return c;
}

/* ────────────────────  PÚBLICO (tela do cliente, por chave)  ──────────────────── */

/**
 * Abre o diagnóstico do cliente pela chave KX-. Rota pública: a chave é o
 * segredo (código não sequencial), e só devolvemos os campos que a tela usa.
 */
export const publicGetDiagnostico = createServerFn({ method: "GET" })
  .inputValidator((chave: string) => chave)
  .handler(async ({ data }): Promise<DiagnosticoPublico | null> => {
    const c = (data ?? "").trim().toUpperCase();
    if (!CHAVE_RE.test(c)) return null;
    const chave = c;
    const { data: cliente, error } = await sb()
      .from("clientes")
      .select("id, nome_empresa, chave, status, responsavel_nome, lead_preenchido_em")
      .eq("chave", chave)
      .neq("status", "arquivado")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cliente) return null;

    const { data: avs, error: e2 } = await sb()
      .from("avaliacoes")
      .select("chave_avaliacao, tipo, status, respondentes_esperados, lideres(nome, cargo)")
      .eq("cliente_id", cliente.id)
      .neq("status", "arquivada")
      .order("created_at", { ascending: true });
    if (e2) throw new Error(e2.message);

    return {
      nome_empresa: cliente.nome_empresa,
      chave: cliente.chave,
      status: cliente.status,
      lead_preenchido: Boolean(cliente.lead_preenchido_em),
      responsavel_nome: cliente.responsavel_nome,
      avaliacoes: (avs ?? []).map((a) => {
        const lider = Array.isArray(a.lideres) ? a.lideres[0] : a.lideres;
        return {
          chave_avaliacao: a.chave_avaliacao as string,
          tipo: a.tipo as AvaliacaoTipo,
          status: a.status as string,
          respondentes_esperados: a.respondentes_esperados as number | null,
          lider_nome: (lider as { nome?: string } | null)?.nome ?? null,
          lider_cargo: (lider as { cargo?: string } | null)?.cargo ?? null,
        };
      }),
    };
  });

/**
 * Grava os dados do responsável (captura do lead) e promove o status
 * criado → lead. Reenvios atualizam os dados sem rebaixar um cliente ativo.
 */
export const publicSalvarLead = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      chave: string;
      nome: string;
      cargo?: string;
      email: string;
      telefone?: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const chave = chaveValida(data.chave);
    const nome = data.nome?.trim();
    const email = data.email?.trim().toLowerCase();
    if (!nome) throw new Error("Informe o seu nome.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new Error("Informe um e-mail válido.");

    const { data: cliente, error } = await sb()
      .from("clientes")
      .select("id, status")
      .eq("chave", chave)
      .neq("status", "arquivado")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cliente) throw new Error("Chave de acesso não encontrada.");

    const { error: e2 } = await sb()
      .from("clientes")
      .update({
        responsavel_nome: nome.slice(0, 120),
        responsavel_cargo: data.cargo?.trim().slice(0, 120) || null,
        responsavel_email: email.slice(0, 160),
        responsavel_telefone: data.telefone?.trim().slice(0, 40) || null,
        lead_preenchido_em: new Date().toISOString(),
        ...(cliente.status === "criado" ? { status: "lead" } : {}),
      })
      .eq("id", cliente.id);
    if (e2) throw new Error(e2.message);
    return { ok: true };
  });

/* ────────────────────────  ADMIN (Korthex interno)  ──────────────────────── */

/** Lista todos os clientes, mais recentes primeiro. */
export const adminListClientes = createServerFn({ method: "GET" }).handler(
  async (): Promise<Cliente[]> => {
    await requireAdmin();
    const { data, error } = await sb()
      .from("clientes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Cliente[];
  },
);

/** Cria um cliente novo. A chave (KX-XXXXXX) é gerada pelo banco. */
export const adminCreateCliente = createServerFn({ method: "POST" })
  .inputValidator((input: { nome_empresa: string; criado_por?: string }) => input)
  .handler(async ({ data }): Promise<Cliente> => {
    await requireAdmin();
    const nome = data.nome_empresa?.trim();
    if (!nome) throw new Error("Informe o nome da empresa.");
    const { data: row, error } = await sb()
      .from("clientes")
      .insert({ nome_empresa: nome, criado_por: data.criado_por ?? null })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Cliente;
  });

/** Arquiva um cliente (some da lista ativa sem apagar dados). */
export const adminArchiveCliente = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<{ ok: true }> => {
    await requireAdmin();
    const { error } = await sb()
      .from("clientes")
      .update({ status: "arquivado" })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
