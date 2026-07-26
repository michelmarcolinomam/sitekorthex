import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "./access-auth";
import { validaLead, dominioRecebeEmail, type ResultadoValidacao } from "./lead-validacao";
import { programaDe } from "./programas";
import {
  calculaLider,
  calculaEmpresa,
  DIMENSOES,
  media as mediaDe,
  type ItemResposta,
  type RespostaBruta,
  type ResultadoEmpresa,
  type ResultadoLiderCalculado,
} from "./motor-calculo";

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

/**
 * Painel do cliente. Quem gera as avaliações é a própria empresa, dentro do
 * link dela — a Korthex só cria o cliente e entrega a chave.
 */
export interface PainelCliente {
  nome_empresa: string;
  chave: string;
  lead_preenchido: boolean;
  responsavel_nome: string | null;
  lideres: Lider[];
  avaliacoes: Avaliacao[];
  respostasPorAvaliacao: Record<string, number>;
}

/** Sucesso, ou os erros campo a campo para a tela destacar. */
export type SalvarLeadResposta =
  | { ok: true }
  | { ok: false; erros: ResultadoValidacao["erros"] };

const CHAVE_RE = /^KX-[A-Z2-9]{4,10}$/;

const TIPOS_VALIDOS: AvaliacaoTipo[] = [
  "lideranca_time",
  "lideranca_executivo",
  "executivo_lideranca",
  "performance_time",
];

/** Óticas que já têm questionário pronto — as outras não podem ser geradas. */
const TIPOS_DISPONIVEIS: AvaliacaoTipo[] = ["lideranca_time", "lideranca_executivo"];

function normalizaChave(chave: string): string | null {
  const c = (chave ?? "").trim().toUpperCase();
  return CHAVE_RE.test(c) ? c : null;
}

/** Resolve a chave KX- em um cliente ativo. A chave é a credencial do painel. */
async function clientePorChave(
  db: SupabaseClient,
  chave: string,
): Promise<{ id: string; nome_empresa: string; chave: string; responsavel_nome: string | null; lead_preenchido_em: string | null } | null> {
  const c = normalizaChave(chave);
  if (!c) return null;
  const { data, error } = await db
    .from("clientes")
    .select("id, nome_empresa, chave, responsavel_nome, lead_preenchido_em")
    .eq("chave", c)
    .neq("status", "arquivado")
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

/** Líderes + avaliações + quantas respostas cada avaliação já recebeu. */
async function carregaTrabalho(db: SupabaseClient, clienteId: string) {
  const [{ data: lideres, error: e1 }, { data: avaliacoes, error: e2 }] = await Promise.all([
    db.from("lideres").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: true }),
    db
      .from("avaliacoes")
      .select("*")
      .eq("cliente_id", clienteId)
      .neq("status", "arquivada")
      .order("created_at", { ascending: true }),
  ]);
  if (e1) throw new Error(e1.message);
  if (e2) throw new Error(e2.message);

  const ids = (avaliacoes ?? []).map((a) => a.id as string);
  const respostasPorAvaliacao: Record<string, number> = {};
  if (ids.length) {
    const { data: rs, error: e3 } = await db
      .from("respostas")
      .select("avaliacao_id")
      .in("avaliacao_id", ids);
    if (e3) throw new Error(e3.message);
    for (const r of rs ?? []) {
      const k = r.avaliacao_id as string;
      respostasPorAvaliacao[k] = (respostasPorAvaliacao[k] ?? 0) + 1;
    }
  }

  return {
    lideres: (lideres ?? []) as Lider[],
    avaliacoes: (avaliacoes ?? []) as Avaliacao[],
    respostasPorAvaliacao,
  };
}

/* ──────────────────  PÚBLICO — o painel do cliente, por chave  ────────────────── */

/** Abre o painel da empresa pela chave KX-. */
export const publicGetPainel = createServerFn({ method: "GET" })
  .inputValidator((chave: string) => chave)
  .handler(async ({ data }): Promise<PainelCliente | null> => {
    const db = sb();
    const cliente = await clientePorChave(db, data);
    if (!cliente) return null;

    const trabalho = await carregaTrabalho(db, cliente.id);
    return {
      nome_empresa: cliente.nome_empresa,
      chave: cliente.chave,
      lead_preenchido: Boolean(cliente.lead_preenchido_em),
      responsavel_nome: cliente.responsavel_nome,
      ...trabalho,
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
  .handler(async ({ data }): Promise<SalvarLeadResposta> => {
    const db = sb();

    // A régua vale no servidor: a tela pode ser contornada, isto não.
    const v = validaLead(data);
    if (!v.ok) return { ok: false, erros: v.erros };

    if (!(await dominioRecebeEmail(v.dominioEmail))) {
      return {
        ok: false,
        erros: { email: "Esse domínio de e-mail não recebe mensagens. Confira o endereço." },
      };
    }

    const cliente = await clientePorChave(db, data.chave);
    if (!cliente) throw new Error("Chave de acesso não encontrada.");

    const { data: atual } = await db
      .from("clientes")
      .select("status")
      .eq("id", cliente.id)
      .maybeSingle();

    const { error } = await db
      .from("clientes")
      .update({
        responsavel_nome: v.limpo.nome.slice(0, 120),
        responsavel_cargo: v.limpo.cargo.slice(0, 120),
        responsavel_email: v.limpo.email.slice(0, 160),
        responsavel_telefone: v.limpo.telefone.slice(0, 40),
        lead_preenchido_em: new Date().toISOString(),
        ...(atual?.status === "criado" ? { status: "lead" } : {}),
      })
      .eq("id", cliente.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/**
 * A EMPRESA gera as próprias avaliações: escolhe o líder e as óticas que
 * quer aplicar. Cria o líder se ainda não existir (compara pelo nome) e abre
 * uma avaliação por ótica, pulando as óticas que aquele líder já tem abertas.
 */
export const publicCreateAvaliacoes = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      chave: string;
      lider_nome: string;
      lider_cargo?: string;
      tipos: AvaliacaoTipo[];
      respondentes_esperados?: number;
    }) => input,
  )
  .handler(async ({ data }): Promise<{ criadas: number; jaExistiam: number }> => {
    const db = sb();

    const cliente = await clientePorChave(db, data.chave);
    if (!cliente) throw new Error("Chave de acesso não encontrada.");
    if (!cliente.lead_preenchido_em)
      throw new Error("Preencha os dados do responsável antes de gerar avaliações.");

    const nome = data.lider_nome?.trim();
    if (!nome) throw new Error("Informe o nome do líder a ser avaliado.");

    const tipos = (data.tipos ?? []).filter(
      (t) => TIPOS_VALIDOS.includes(t) && TIPOS_DISPONIVEIS.includes(t),
    );
    if (!tipos.length) throw new Error("Escolha ao menos uma ótica de avaliação.");

    const esperados = Math.max(0, Math.min(200, Math.trunc(data.respondentes_esperados ?? 0)));

    const { data: existente, error: eBusca } = await db
      .from("lideres")
      .select("id")
      .eq("cliente_id", cliente.id)
      .ilike("nome", nome)
      .maybeSingle();
    if (eBusca) throw new Error(eBusca.message);

    let liderId = existente?.id as string | undefined;
    if (!liderId) {
      const { data: novo, error: eIns } = await db
        .from("lideres")
        .insert({
          cliente_id: cliente.id,
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
        cliente_id: cliente.id,
        lider_id: liderId,
        tipo,
        respondentes_esperados: esperados,
      })),
    );
    if (eAv) throw new Error(eAv.message);

    return { criadas: novos.length, jaExistiam: tipos.length - novos.length };
  });

/** A empresa arquiva uma avaliação própria. Só toca no que é dela. */
export const publicArchiveAvaliacao = createServerFn({ method: "POST" })
  .inputValidator((input: { chave: string; avaliacao_id: string }) => input)
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const db = sb();
    const cliente = await clientePorChave(db, data.chave);
    if (!cliente) throw new Error("Chave de acesso não encontrada.");

    const { error } = await db
      .from("avaliacoes")
      .update({ status: "arquivada" })
      .eq("id", data.avaliacao_id)
      .eq("cliente_id", cliente.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/* ──────────────────  RESPONDENTE — o questionário, por chave AV-  ────────────────── */

const CHAVE_AV_RE = /^AV-[A-Z2-9]{4,10}$/;

/** O que o respondente pode saber: a empresa, quem ele avalia e a ótica. */
export interface AvaliacaoPublica {
  chave_avaliacao: string;
  tipo: AvaliacaoTipo;
  nome_empresa: string;
  lider_nome: string | null;
  lider_cargo: string | null;
  encerrada: boolean;
}

export const publicGetAvaliacao = createServerFn({ method: "GET" })
  .inputValidator((chave: string) => chave)
  .handler(async ({ data }): Promise<AvaliacaoPublica | null> => {
    const c = (data ?? "").trim().toUpperCase();
    if (!CHAVE_AV_RE.test(c)) return null;

    const { data: av, error } = await sb()
      .from("avaliacoes")
      .select("chave_avaliacao, tipo, status, clientes(nome_empresa, status), lideres(nome, cargo)")
      .eq("chave_avaliacao", c)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!av) return null;

    const cliente = (Array.isArray(av.clientes) ? av.clientes[0] : av.clientes) as
      | { nome_empresa: string; status: string }
      | null;
    const lider = (Array.isArray(av.lideres) ? av.lideres[0] : av.lideres) as
      | { nome: string; cargo: string | null }
      | null;
    if (!cliente || cliente.status === "arquivado") return null;

    return {
      chave_avaliacao: av.chave_avaliacao as string,
      tipo: av.tipo as AvaliacaoTipo,
      nome_empresa: cliente.nome_empresa,
      lider_nome: lider?.nome ?? null,
      lider_cargo: lider?.cargo ?? null,
      encerrada: av.status === "arquivada",
    };
  });

/**
 * Grava a resposta de UMA pessoa. Anônima de propósito: guardamos as notas e
 * o gênero usado nos textos, nunca quem respondeu — é isso que faz a equipe
 * responder com honestidade.
 */
export const publicSalvarResposta = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      chave: string;
      genero: "m" | "f";
      respostas: Record<string, { valor: number; score: number; theme: string; facet: string }>;
    }) => input,
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    const c = (data.chave ?? "").trim().toUpperCase();
    if (!CHAVE_AV_RE.test(c)) throw new Error("Link de avaliação inválido.");

    const db = sb();
    const { data: av, error } = await db
      .from("avaliacoes")
      .select("id, status")
      .eq("chave_avaliacao", c)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!av) throw new Error("Link de avaliação não encontrado.");
    if (av.status === "arquivada") throw new Error("Esta avaliação foi encerrada.");

    const respostas = data.respostas ?? {};
    if (!Object.keys(respostas).length) throw new Error("Nenhuma resposta para enviar.");

    const { error: eIns } = await db.from("respostas").insert({
      avaliacao_id: av.id,
      genero_lideranca: data.genero === "f" ? "f" : "m",
      respostas,
      meta: { itens: Object.keys(respostas).length },
    });
    if (eIns) throw new Error(eIns.message);
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

    const trabalho = await carregaTrabalho(db, id);
    return { cliente: cliente as Cliente, ...trabalho };
  });

/* ────────────────────  RESULTADO — lê o banco e calcula  ──────────────────── */

/** Junta as respostas de um líder e calcula. Usado pelas duas portas. */
async function recorteDoLider(
  db: SupabaseClient,
  liderId: string,
): Promise<{ nome: string; cargo: string | null; cliente_id: string; calculo: ResultadoLiderCalculado } | null> {
  const { data: lider, error } = await db
    .from("lideres")
    .select("id, nome, cargo, cliente_id")
    .eq("id", liderId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!lider) return null;

  const { data: avs, error: e2 } = await db
    .from("avaliacoes")
    .select("id, tipo")
    .eq("lider_id", liderId)
    .neq("status", "arquivada");
  if (e2) throw new Error(e2.message);

  const ids = (avs ?? []).map((a) => a.id as string);
  const tipoPorId = new Map((avs ?? []).map((a) => [a.id as string, a.tipo as AvaliacaoTipo]));

  let brutas: RespostaBruta[] = [];
  if (ids.length) {
    const { data: rs, error: e3 } = await db
      .from("respostas")
      .select("avaliacao_id, respostas")
      .in("avaliacao_id", ids);
    if (e3) throw new Error(e3.message);
    brutas = (rs ?? []).map((r) => ({
      tipo: tipoPorId.get(r.avaliacao_id as string) as AvaliacaoTipo,
      itens: Object.values((r.respostas ?? {}) as Record<string, ItemResposta>).filter(
        (i) => i && typeof i.score === "number",
      ),
    }));
  }

  return {
    nome: lider.nome as string,
    cargo: lider.cargo as string | null,
    cliente_id: lider.cliente_id as string,
    calculo: calculaLider(brutas),
  };
}

export interface PanoramaEmpresa {
  empresa: string;
  chave: string;
  totalRespondentes: number;
  indiceTime: number | null;
  indiceExec: number | null;
  divergencia: number | null;
  resultado: ResultadoEmpresa | null;
}

/**
 * Panorama de nível 2: junta todos os líderes do cliente e agrega.
 * Só entram líderes que já têm resposta — quem não foi avaliado não conta.
 */
export const publicPanoramaEmpresa = createServerFn({ method: "GET" })
  .inputValidator((chave: string) => chave)
  .handler(async ({ data }): Promise<PanoramaEmpresa | null> => {
    const db = sb();
    const cliente = await clientePorChave(db, data);
    if (!cliente) return null;

    const { data: lideres, error } = await db
      .from("lideres")
      .select("id, nome, cargo")
      .eq("cliente_id", cliente.id)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const recortes = [];
    for (const l of lideres ?? []) {
      const r = await recorteDoLider(db, l.id as string);
      if (r && (r.calculo.indiceTime !== null || r.calculo.indiceExec !== null)) {
        recortes.push({ nome: l.nome as string, cargo: l.cargo as string | null, recorte: r.calculo });
      }
    }

    const comTime = recortes.map((r) => r.recorte.indiceTime).filter((v): v is number => v !== null);
    const comExec = recortes.map((r) => r.recorte.indiceExec).filter((v): v is number => v !== null);
    const divs = recortes.map((r) => r.recorte.divergencia).filter((v): v is number => v !== null);

    return {
      empresa: cliente.nome_empresa,
      chave: cliente.chave,
      totalRespondentes: recortes.reduce(
        (s, r) => s + r.recorte.respondentesTime + r.recorte.respondentesExec,
        0,
      ),
      indiceTime: comTime.length ? mediaDe(comTime) : null,
      indiceExec: comExec.length ? mediaDe(comExec) : null,
      divergencia: divs.length ? mediaDe(divs) : null,
      resultado: calculaEmpresa(recortes),
    };
  });

/**
 * Resultado visto pela PRÓPRIA EMPRESA, dentro do painel dela.
 * A chave KX- é a credencial: o líder tem que pertencer àquele cliente.
 */
export const publicResultadoLider = createServerFn({ method: "GET" })
  .inputValidator((input: { chave: string; liderId: string }) => input)
  .handler(async ({ data }): Promise<RecorteLider | null> => {
    const db = sb();
    const cliente = await clientePorChave(db, data.chave);
    if (!cliente) return null;

    const r = await recorteDoLider(db, data.liderId);
    if (!r || r.cliente_id !== cliente.id) return null;

    return {
      lider: { id: data.liderId, nome: r.nome, cargo: r.cargo },
      cliente: { nome_empresa: cliente.nome_empresa, chave: cliente.chave },
      calculo: r.calculo,
    };
  });

export interface RecorteLider {
  lider: { id: string; nome: string; cargo: string | null };
  cliente: { nome_empresa: string; chave: string };
  calculo: ResultadoLiderCalculado;
}

/**
 * Monta o recorte de um líder a partir das respostas reais.
 * O cálculo em si mora em motor-calculo.ts — aqui só buscamos os dados.
 */
export const adminResultadoLider = createServerFn({ method: "GET" })
  .inputValidator((liderId: string) => liderId)
  .handler(async ({ data: liderId }): Promise<RecorteLider | null> => {
    await requireAdmin();
    const db = sb();

    const { data: lider, error } = await db
      .from("lideres")
      .select("id, nome, cargo, cliente_id, clientes(nome_empresa, chave)")
      .eq("id", liderId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!lider) return null;

    const cliente = (Array.isArray(lider.clientes) ? lider.clientes[0] : lider.clientes) as
      | { nome_empresa: string; chave: string }
      | null;
    if (!cliente) return null;

    const { data: avs, error: e2 } = await db
      .from("avaliacoes")
      .select("id, tipo")
      .eq("lider_id", liderId)
      .neq("status", "arquivada");
    if (e2) throw new Error(e2.message);

    const ids = (avs ?? []).map((a) => a.id as string);
    const tipoPorId = new Map((avs ?? []).map((a) => [a.id as string, a.tipo as AvaliacaoTipo]));

    let brutas: RespostaBruta[] = [];
    if (ids.length) {
      const { data: rs, error: e3 } = await db
        .from("respostas")
        .select("avaliacao_id, respostas")
        .in("avaliacao_id", ids);
      if (e3) throw new Error(e3.message);

      brutas = (rs ?? []).map((r) => ({
        tipo: tipoPorId.get(r.avaliacao_id as string) as AvaliacaoTipo,
        itens: Object.values((r.respostas ?? {}) as Record<string, ItemResposta>).filter(
          (i) => i && typeof i.score === "number",
        ),
      }));
    }

    return {
      lider: { id: lider.id as string, nome: lider.nome as string, cargo: lider.cargo as string | null },
      cliente,
      calculo: calculaLider(brutas),
    };
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

/* ────────────────────  ADMIN — visão geral (o funil)  ──────────────────── */

export type EtapaFunil = "entregues" | "lead" | "campo" | "pronto";

export interface ClienteNoFunil {
  id: string;
  empresa: string;
  chave: string;
  etapa: EtapaFunil;
  /** Dias parado na etapa atual — é o que dá urgência à lista. */
  diasParado: number;
  responsavel: { nome: string; cargo: string | null; email: string; telefone: string | null } | null;
  lideres: number;
  respostas: number;
  esperadas: number;
  /** Quando chegou a última resposta (ISO), se houver. */
  ultimaResposta: string | null;
  /** Só para quem concluiu. */
  indiceGeral: number | null;
  piorDimensao: { nome: string; valor: number } | null;
  ofertaIndicada: string | null;
  /** Fechou no dia anterior — alimenta o bloco "desde ontem". */
  fechouOntem: boolean;
}

export interface VisaoGeralAdmin {
  clientes: ClienteNoFunil[];
  totais: Record<EtapaFunil, { alcancaram: number; parados: number }>;
  /** Em quantas empresas concluídas cada programa é indicado. */
  demanda: { programa: string; empresas: number; total: number }[];
}

/**
 * Dias de CALENDÁRIO no fuso de Brasília, não períodos de 24h.
 * Num painel de cobrança "ontem às 20h" tem que dizer "há 1 dia", não "hoje".
 */
const FUSO_BR = -3 * 3600000;

function diaBR(ms: number): number {
  return Math.floor((ms + FUSO_BR) / 86400000);
}

function diasEntre(iso: string | null, agora: number): number {
  if (!iso) return 0;
  return Math.max(0, diaBR(agora) - diaBR(new Date(iso).getTime()));
}

export const adminVisaoGeral = createServerFn({ method: "GET" }).handler(
  async (): Promise<VisaoGeralAdmin> => {
    await requireAdmin();
    const db = sb();
    const agora = Date.now();

    const [{ data: clientes, error: e1 }, { data: lideres, error: e2 }, { data: avaliacoes, error: e3 }] =
      await Promise.all([
        db.from("clientes").select("*").neq("status", "arquivado").order("created_at", { ascending: false }),
        db.from("lideres").select("id, cliente_id, nome, cargo"),
        db.from("avaliacoes").select("id, cliente_id, lider_id, tipo, respondentes_esperados").neq("status", "arquivada"),
      ]);
    if (e1) throw new Error(e1.message);
    if (e2) throw new Error(e2.message);
    if (e3) throw new Error(e3.message);

    // Primeiro só o leve: quantas respostas e quando chegaram.
    const idsAv = (avaliacoes ?? []).map((a) => a.id as string);
    const porAvaliacao = new Map<string, { n: number; ultima: string | null }>();
    if (idsAv.length) {
      const { data: rs, error: e4 } = await db
        .from("respostas")
        .select("avaliacao_id, created_at")
        .in("avaliacao_id", idsAv);
      if (e4) throw new Error(e4.message);
      for (const r of rs ?? []) {
        const k = r.avaliacao_id as string;
        const at = r.created_at as string;
        const atual = porAvaliacao.get(k) ?? { n: 0, ultima: null };
        atual.n += 1;
        if (!atual.ultima || at > atual.ultima) atual.ultima = at;
        porAvaliacao.set(k, atual);
      }
    }

    // Ontem, no fuso de quem opera o painel (Brasil).
    const ontemBR = diaBR(agora) - 1;

    const saida: ClienteNoFunil[] = [];
    const prontosParaCalcular: { cliente: ClienteNoFunil; lideresIds: string[] }[] = [];

    for (const c of clientes ?? []) {
      const meusLideres = (lideres ?? []).filter((l) => l.cliente_id === c.id);
      const minhasAv = (avaliacoes ?? []).filter((a) => a.cliente_id === c.id);

      const respostas = minhasAv.reduce((s, a) => s + (porAvaliacao.get(a.id as string)?.n ?? 0), 0);
      const esperadas = minhasAv.reduce((s, a) => s + ((a.respondentes_esperados as number) || 0), 0);
      const ultimaResposta = minhasAv
        .map((a) => porAvaliacao.get(a.id as string)?.ultima ?? null)
        .filter((v): v is string => v !== null)
        .sort()
        .pop() ?? null;

      const concluido =
        minhasAv.length > 0 &&
        minhasAv.every((a) => {
          const got = porAvaliacao.get(a.id as string)?.n ?? 0;
          const exp = (a.respondentes_esperados as number) || 0;
          return exp > 0 && got >= exp;
        });

      let etapa: EtapaFunil;
      let referencia: string | null;
      if (concluido) {
        etapa = "pronto";
        referencia = ultimaResposta;
      } else if (minhasAv.length > 0) {
        etapa = "campo";
        referencia = ultimaResposta ?? (c.lead_preenchido_em as string | null);
      } else if (c.lead_preenchido_em) {
        etapa = "lead";
        referencia = c.lead_preenchido_em as string;
      } else {
        etapa = "entregues";
        referencia = c.created_at as string;
      }

      const item: ClienteNoFunil = {
        id: c.id as string,
        empresa: c.nome_empresa as string,
        chave: c.chave as string,
        etapa,
        diasParado: diasEntre(referencia, agora),
        responsavel: c.responsavel_email
          ? {
              nome: (c.responsavel_nome as string) ?? "",
              cargo: c.responsavel_cargo as string | null,
              email: c.responsavel_email as string,
              telefone: c.responsavel_telefone as string | null,
            }
          : null,
        lideres: meusLideres.length,
        respostas,
        esperadas,
        ultimaResposta,
        indiceGeral: null,
        piorDimensao: null,
        ofertaIndicada: null,
        // Só quem fechou no dia anterior — nem hoje, nem antes de ontem.
        fechouOntem:
          concluido && ultimaResposta ? diaBR(new Date(ultimaResposta).getTime()) === ontemBR : false,
      };

      saida.push(item);
      if (concluido) {
        prontosParaCalcular.push({ cliente: item, lideresIds: meusLideres.map((l) => l.id as string) });
      }
    }

    // Só quem concluiu paga o custo do cálculo.
    const demandaConta = new Map<string, number>();
    for (const { cliente, lideresIds } of prontosParaCalcular) {
      const recortes = [];
      for (const id of lideresIds) {
        const r = await recorteDoLider(db, id);
        if (r && (r.calculo.indiceTime !== null || r.calculo.indiceExec !== null)) {
          recortes.push({ nome: r.nome, cargo: r.cargo, recorte: r.calculo });
        }
      }
      const emp = calculaEmpresa(recortes);
      if (!emp) continue;

      cliente.indiceGeral = emp.indiceGeral;
      const pior = emp.porDimensao[0];
      if (pior) {
        cliente.piorDimensao = { nome: pior.nome, valor: pior.valor };
        const def = DIMENSOES.find((d) => d.chave === pior.chave);
        cliente.ofertaIndicada = def ? programaDe(def.chave).titulo : null;
      }
      // Demanda: toda dimensão fora da faixa forte conta para o programa dela.
      for (const d of emp.porDimensao) {
        if (d.band === "hi") continue;
        const def = DIMENSOES.find((x) => x.chave === d.chave);
        if (!def) continue;
        const titulo = programaDe(def.chave).titulo;
        demandaConta.set(titulo, (demandaConta.get(titulo) ?? 0) + 1);
      }
    }

    const conta = (e: EtapaFunil) => saida.filter((c) => c.etapa === e).length;
    const totalProntos = prontosParaCalcular.length;

    return {
      clientes: saida,
      totais: {
        // "Alcançaram" é cumulativo — é o funil. "Parados" é quem está ali agora.
        entregues: { alcancaram: saida.length, parados: conta("entregues") },
        lead: {
          alcancaram: saida.filter((c) => c.etapa !== "entregues").length,
          parados: conta("lead"),
        },
        campo: {
          alcancaram: saida.filter((c) => c.etapa === "campo" || c.etapa === "pronto").length,
          parados: conta("campo"),
        },
        pronto: { alcancaram: conta("pronto"), parados: conta("pronto") },
      },
      demanda: [...demandaConta.entries()]
        .map(([programa, empresas]) => ({ programa, empresas, total: totalProntos }))
        .sort((a, b) => b.empresas - a.empresas),
    };
  },
);

/** Panorama de nível 2 pelo id do cliente — a versão que a Korthex enxerga. */
export const adminPanoramaEmpresa = createServerFn({ method: "GET" })
  .inputValidator((clienteId: string) => clienteId)
  .handler(async ({ data: clienteId }): Promise<PanoramaEmpresa | null> => {
    await requireAdmin();
    const db = sb();

    const { data: cliente, error } = await db
      .from("clientes")
      .select("id, nome_empresa, chave")
      .eq("id", clienteId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cliente) return null;

    const { data: lideres, error: e2 } = await db
      .from("lideres")
      .select("id, nome, cargo")
      .eq("cliente_id", clienteId)
      .order("created_at", { ascending: true });
    if (e2) throw new Error(e2.message);

    const recortes = [];
    for (const l of lideres ?? []) {
      const r = await recorteDoLider(db, l.id as string);
      if (r && (r.calculo.indiceTime !== null || r.calculo.indiceExec !== null)) {
        recortes.push({ nome: l.nome as string, cargo: l.cargo as string | null, recorte: r.calculo });
      }
    }

    const comTime = recortes.map((r) => r.recorte.indiceTime).filter((v): v is number => v !== null);
    const comExec = recortes.map((r) => r.recorte.indiceExec).filter((v): v is number => v !== null);
    const divs = recortes.map((r) => r.recorte.divergencia).filter((v): v is number => v !== null);

    return {
      empresa: cliente.nome_empresa as string,
      chave: cliente.chave as string,
      totalRespondentes: recortes.reduce(
        (s, r) => s + r.recorte.respondentesTime + r.recorte.respondentesExec,
        0,
      ),
      indiceTime: comTime.length ? mediaDe(comTime) : null,
      indiceExec: comExec.length ? mediaDe(comExec) : null,
      divergencia: divs.length ? mediaDe(divs) : null,
      resultado: calculaEmpresa(recortes),
    };
  });
