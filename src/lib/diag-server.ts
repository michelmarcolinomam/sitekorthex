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

export interface Lider {
  id: string;
  cliente_id: string;
  nome: string;
  cargo: string | null;
  created_at: string;
}

export interface Avaliacao {
  id: string;
  cliente_id: string;
  lider_id: string | null;
  tipo: AvaliacaoTipo;
  chave_avaliacao: string;
  respondentes_esperados: number;
  status: "aguardando" | "concluida" | "arquivada";
  created_at: string;
}

export interface ClienteDetalhe {
  cliente: Cliente;
  lideres: Lider[];
  avaliacoes: Avaliacao[];
  respostasPorAvaliacao: Record<string, number>;
}

/** Abre um cliente com seus líderes, avaliações e contagem de respostas. */
export const adminGetCliente = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<ClienteDetalhe | null> => {
    await requireAdmin();
    const db = sb();

    const { data: cliente, error } = await db
      .from("clientes")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cliente) return null;

    const [{ data: lideres, error: e2 }, { data: avaliacoes, error: e3 }] = await Promise.all([
      db.from("lideres").select("*").eq("cliente_id", id).order("created_at", { ascending: true }),
      db
        .from("avaliacoes")
        .select("*")
        .eq("cliente_id", id)
        .order("created_at", { ascending: true }),
    ]);
    if (e2) throw new Error(e2.message);
    if (e3) throw new Error(e3.message);

    // Quantas respostas já chegaram em cada avaliação.
    const ids = (avaliacoes ?? []).map((a) => a.id as string);
    const respostasPorAvaliacao: Record<string, number> = {};
    if (ids.length) {
      const { data: rs, error: e4 } = await db
        .from("respostas")
        .select("avaliacao_id")
        .in("avaliacao_id", ids);
      if (e4) throw new Error(e4.message);
      for (const r of rs ?? []) {
        const k = r.avaliacao_id as string;
        respostasPorAvaliacao[k] = (respostasPorAvaliacao[k] ?? 0) + 1;
      }
    }

    return {
      cliente: cliente as Cliente,
      lideres: (lideres ?? []) as Lider[],
      avaliacoes: (avaliacoes ?? []) as Avaliacao[],
      respostasPorAvaliacao,
    };
  });

const TIPOS_VALIDOS: AvaliacaoTipo[] = [
  "lideranca_time",
  "lideranca_executivo",
  "executivo_lideranca",
  "performance_time",
];

/**
 * Gera as avaliações de um líder. Cria o líder se ele ainda não existir
 * (compara pelo nome, sem diferenciar maiúsculas) e abre uma avaliação por
 * ótica escolhida, pulando as óticas que aquele líder já tem em aberto.
 */
export const adminCreateAvaliacoes = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      cliente_id: string;
      lider_nome: string;
      lider_cargo?: string;
      tipos: AvaliacaoTipo[];
      respondentes_esperados?: number;
    }) => input,
  )
  .handler(async ({ data }): Promise<{ criadas: number; jaExistiam: number }> => {
    await requireAdmin();
    const db = sb();

    const nome = data.lider_nome?.trim();
    if (!nome) throw new Error("Informe o nome do líder a ser avaliado.");

    const tipos = (data.tipos ?? []).filter((t) => TIPOS_VALIDOS.includes(t));
    if (!tipos.length) throw new Error("Escolha ao menos uma ótica de avaliação.");

    const esperados = Math.max(0, Math.min(200, Math.trunc(data.respondentes_esperados ?? 0)));

    const { data: cliente, error: eCli } = await db
      .from("clientes")
      .select("id")
      .eq("id", data.cliente_id)
      .maybeSingle();
    if (eCli) throw new Error(eCli.message);
    if (!cliente) throw new Error("Cliente não encontrado.");

    // Reaproveita o líder já cadastrado com o mesmo nome, para não duplicar.
    const { data: existente, error: eBusca } = await db
      .from("lideres")
      .select("id")
      .eq("cliente_id", data.cliente_id)
      .ilike("nome", nome)
      .maybeSingle();
    if (eBusca) throw new Error(eBusca.message);

    let liderId = existente?.id as string | undefined;
    if (!liderId) {
      const { data: novo, error: eIns } = await db
        .from("lideres")
        .insert({
          cliente_id: data.cliente_id,
          nome: nome.slice(0, 120),
          cargo: data.lider_cargo?.trim().slice(0, 120) || null,
        })
        .select("id")
        .single();
      if (eIns) throw new Error(eIns.message);
      liderId = novo.id as string;
    } else if (data.lider_cargo?.trim()) {
      await db
        .from("lideres")
        .update({ cargo: data.lider_cargo.trim().slice(0, 120) })
        .eq("id", liderId);
    }

    // Não abre uma segunda avaliação da mesma ótica enquanto a atual está viva.
    const { data: jaTem, error: eJa } = await db
      .from("avaliacoes")
      .select("tipo")
      .eq("lider_id", liderId)
      .neq("status", "arquivada");
    if (eJa) throw new Error(eJa.message);

    const ocupados = new Set((jaTem ?? []).map((a) => a.tipo as string));
    const novos = tipos.filter((t) => !ocupados.has(t));
    if (!novos.length) return { criadas: 0, jaExistiam: tipos.length };

    const { error: eAv } = await db.from("avaliacoes").insert(
      novos.map((tipo) => ({
        cliente_id: data.cliente_id,
        lider_id: liderId,
        tipo,
        respondentes_esperados: esperados,
      })),
    );
    if (eAv) throw new Error(eAv.message);

    return { criadas: novos.length, jaExistiam: tipos.length - novos.length };
  });

/** Arquiva uma avaliação (some da tela do cliente sem apagar respostas). */
export const adminArchiveAvaliacao = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<{ ok: true }> => {
    await requireAdmin();
    const { error } = await sb()
      .from("avaliacoes")
      .update({ status: "arquivada" })
      .eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
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
