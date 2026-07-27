import { createServerFn } from "@tanstack/react-start";
import type { SupabaseClient } from "@supabase/supabase-js";
import { requireAdmin } from "./access-auth";
import { supabaseKorthex as sb } from "./korthex-db";
import {
  recorteDoLider,
  respostasDoAvaliado,
  panoramaDoCliente,
  montaPanorama,
  type PanoramaEmpresa,
} from "./diag-panorama";
import {
  validaLead,
  validaSolicitacao,
  dominioRecebeEmail,
  type ResultadoValidacao,
  type ResultadoSolicitacao,
} from "./lead-validacao";
import { programaDe } from "./programas";
import {
  calculaLider,
  calculaEmpresa,
  calculaExecutivo,
  calculaEquipe,
  type ResultadoExecutivoCalculado,
  type ResultadoEquipeCalculado,
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
  /** Como a ficha NASCEU: cadastrada pela Korthex ou criada por um pedido do site. */
  origem: "korthex" | "site";
  /** Quando a empresa PEDIU o diagnóstico em /diagnostico. */
  solicitado_em: string | null;
  /** Quando a Korthex entregou a chave. */
  liberado_em: string | null;
  tamanho_empresa: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * As cinco leituras da série. Cada camada é lida por quem tem expectativa
 * real sobre ela — e a liderança e o time são lidos por DOIS lados, porque a
 * exigência de quem conduz não é a mesma de quem cobra o resultado.
 */
export type AvaliacaoTipo =
  | "lideranca_time"
  | "lideranca_executivo"
  | "executivo_lideranca"
  | "performance_lideranca"
  | "performance_executivo";

/** O que está sendo avaliado. A tabela ainda se chama `lideres` por causa das
 *  chaves estrangeiras já em uso; o papel é que diz do que se trata. */
export type PapelAvaliado = "lider" | "executivo" | "equipe";

export interface Lider {
  id: string;
  cliente_id: string;
  nome: string;
  cargo: string | null;
  papel: PapelAvaliado;
  /** Número de pessoas — só existe quando o papel é equipe. */
  tamanho: number | null;
  /** Quem conduz a equipe: o líder cadastrado (vínculo) ou um nome solto. */
  responsavel_id: string | null;
  responsavel_nome: string | null;
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
  "performance_lideranca",
  "performance_executivo",
];

/** Óticas que já têm questionário pronto — as outras não podem ser geradas. */
const TIPOS_DISPONIVEIS: AvaliacaoTipo[] = [
  "lideranca_time",
  "lideranca_executivo",
  "executivo_lideranca",
  "performance_lideranca",
  "performance_executivo",
];

/**
 * Quais óticas cabem em cada papel. É a regra que impede gerar, por exemplo,
 * "o time avalia" para uma equipe — quem avalia a equipe é a camada de cima.
 */
export const TIPOS_POR_PAPEL: Record<PapelAvaliado, AvaliacaoTipo[]> = {
  lider: ["lideranca_time", "lideranca_executivo"],
  executivo: ["executivo_lideranca"],
  equipe: ["performance_lideranca", "performance_executivo"],
};

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

export type SolicitacaoResposta =
  | { ok: true; empresa: string; email: string; telefone: string }
  | { ok: false; erros: ResultadoSolicitacao["erros"] };

/**
 * Chave pública do Web3Forms — a mesma do formulário de contato. É pública por
 * natureza (vive no bundle do navegador em ContactForm); só serve para entregar
 * o aviso por e-mail.
 */
const WEB3FORMS_ACCESS_KEY = "af71bff1-67bb-4d4d-bbc0-2449dcf1516f";

/** Avisa a Korthex por e-mail. Nunca derruba a solicitação se o envio falhar. */
async function avisaSolicitacao(corpo: Record<string, string>): Promise<void> {
  try {
    await fetch("https://api.web3forms.com/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        access_key: WEB3FORMS_ACCESS_KEY,
        subject: `Diagnóstico solicitado — ${corpo.empresa}`,
        from_name: "Site Korthex",
        ...corpo,
      }),
    });
  } catch {
    // O registro no banco é a fonte da verdade; o e-mail é só o alerta.
  }
}

/**
 * Uma empresa pede o diagnóstico por korthex.com.br/diagnostico.
 *
 * A ficha nasce com a chave JÁ GERADA pelo banco mas NÃO ENTREGUE
 * (`liberado_em` nulo) — quem tem a chave entra, então entregar é o ato de
 * liberação da Korthex. Por isso esta função **nunca devolve a chave**: se
 * devolvesse, bastaria adivinhar o nome de uma empresa para entrar no
 * diagnóstico dela.
 *
 * A resposta é idêntica para pedido novo e para empresa que já é cliente, de
 * propósito: variar a mensagem contaria a quem está do outro lado quem já é
 * cliente da Korthex. Quem fica sabendo da diferença é o e-mail de aviso.
 */
export const publicSolicitarDiagnostico = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      empresa: string;
      nome: string;
      cargo: string;
      email: string;
      telefone: string;
      tamanho: string;
    }) => input,
  )
  .handler(async ({ data }): Promise<SolicitacaoResposta> => {
    // A régua vale no servidor: a tela pode ser contornada, isto não.
    const v = validaSolicitacao(data);
    if (!v.ok) return { ok: false, erros: v.erros };

    if (!(await dominioRecebeEmail(v.dominioEmail))) {
      return {
        ok: false,
        erros: { email: "Esse domínio de e-mail não recebe mensagens. Confira o endereço." },
      };
    }

    const db = sb();
    const { empresa, nome, cargo, email, telefone, tamanho } = v.limpo;

    const agora = new Date().toISOString();
    const contato = {
      responsavel_nome: nome.slice(0, 120),
      responsavel_cargo: cargo.slice(0, 120),
      responsavel_email: email.slice(0, 160),
      responsavel_telefone: telefone.slice(0, 40),
      tamanho_empresa: tamanho,
      lead_preenchido_em: agora,
      // Marca o PEDIDO. É isto que coloca a empresa na fila de liberação, e não
      // o fato de a ficha ser nova: uma empresa que já é cliente e pede um
      // ciclo novo tem de aparecer igual. Antes disso, o pedido que caía numa
      // ficha existente ficava invisível no painel.
      solicitado_em: agora,
    };

    // Dedup em duas passadas em vez de um .or(): o valor vai como parâmetro,
    // não concatenado na sintaxe de filtro do PostgREST. Sem curinga, ilike é
    // igualdade sem diferenciar maiúscula.
    const colunas = "id, nome_empresa, liberado_em";
    const busca = (coluna: "responsavel_email" | "nome_empresa", valor: string) =>
      db
        .from("clientes")
        .select(colunas)
        .ilike(coluna, valor)
        .neq("status", "arquivado")
        .limit(1)
        .maybeSingle();

    const { data: porEmail } = await busca("responsavel_email", email);
    const { data: porEmpresa } = porEmail ? { data: null } : await busca("nome_empresa", empresa);
    const existente = porEmail ?? porEmpresa;

    if (existente) {
      // Atualiza o contato e carimba o pedido. NÃO mexe em liberado_em: quem
      // entrega é a Korthex. Como solicitado_em passa a ser mais recente que a
      // última entrega, a ficha volta para a fila — é assim que uma empresa que
      // já é cliente e pede um ciclo novo aparece para ser atendida.
      const { error } = await db.from("clientes").update(contato).eq("id", existente.id);
      if (error) throw new Error(error.message);

      await avisaSolicitacao({
        empresa,
        nome,
        cargo,
        email,
        telefone,
        tamanho,
        situacao: existente.liberado_em
          ? `JÁ ERA CLIENTE com a chave entregue (ficha "${existente.nome_empresa}"). Pediu de novo — está na fila de liberação, marcada como pedido de quem já é cliente.`
          : `Ficha "${existente.nome_empresa}" já estava na fila aguardando liberação. Dados atualizados.`,
      });

      return { ok: true, empresa, email, telefone };
    }

    const { error } = await db.from("clientes").insert({
      nome_empresa: empresa.slice(0, 160),
      status: "lead",
      origem: "site",
      liberado_em: null,
      criado_por: "site",
      ...contato,
    });
    if (error) throw new Error(error.message);

    await avisaSolicitacao({
      empresa,
      nome,
      cargo,
      email,
      telefone,
      tamanho,
      situacao: "Solicitação NOVA aguardando liberação em /admin/diagnosticos/clientes.",
    });

    return { ok: true, empresa, email, telefone };
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
      papel: PapelAvaliado;
      nome: string;
      cargo?: string;
      /** Só para equipe: quantas pessoas. Quem informa é o RH, nunca quem responde. */
      tamanho?: number;
      /** Quem conduz a equipe: o id de um líder já cadastrado… */
      responsavel_id?: string | null;
      /** …ou um nome livre, quando essa pessoa não está no sistema. */
      responsavel_nome?: string | null;
      /** Uma entrada por ótica escolhida, com quantos vão responder aquela. */
      oticas: { tipo: AvaliacaoTipo; respondentes: number }[];
    }) => input,
  )
  .handler(async ({ data }): Promise<{ criadas: number; jaExistiam: number }> => {
    const db = sb();

    const cliente = await clientePorChave(db, data.chave);
    if (!cliente) throw new Error("Chave de acesso não encontrada.");
    if (!cliente.lead_preenchido_em)
      throw new Error("Preencha os dados do responsável antes de gerar avaliações.");

    const papel: PapelAvaliado = data.papel;
    if (!TIPOS_POR_PAPEL[papel]) throw new Error("Escolha o que vai ser avaliado.");

    const nome = data.nome?.trim();
    if (!nome)
      throw new Error(
        papel === "equipe" ? "Informe de quem é a equipe." : "Informe o nome de quem será avaliado.",
      );

    // A ótica tem que caber no papel: ninguém gera "o time avalia" para uma
    // equipe, nem "a liderança avalia o executivo" para um líder.
    const permitidos = TIPOS_POR_PAPEL[papel];
    const oticas = (data.oticas ?? []).filter(
      (o) => permitidos.includes(o.tipo) && TIPOS_DISPONIVEIS.includes(o.tipo),
    );
    if (!oticas.length) throw new Error("Escolha ao menos uma ótica de avaliação.");

    const tamanho =
      papel === "equipe" && data.tamanho ? Math.max(1, Math.min(500, Math.trunc(data.tamanho))) : null;

    // O vínculo ganha do texto: havendo líder cadastrado, o nome vem dele.
    const responsavelId = papel === "equipe" ? (data.responsavel_id || null) : null;
    const responsavelNome =
      papel === "equipe" && !responsavelId ? data.responsavel_nome?.trim().slice(0, 120) || null : null;

    // Reaproveita o avaliado de mesmo nome NO MESMO PAPEL — um líder e uma
    // equipe podem carregar o nome da mesma pessoa sem se misturarem.
    const { data: existente, error: eBusca } = await db
      .from("lideres")
      .select("id")
      .eq("cliente_id", cliente.id)
      .eq("papel", papel)
      .ilike("nome", nome)
      .maybeSingle();
    if (eBusca) throw new Error(eBusca.message);

    let avaliadoId = existente?.id as string | undefined;
    if (!avaliadoId) {
      const { data: novoAvaliado, error: eIns } = await db
        .from("lideres")
        .insert({
          cliente_id: cliente.id,
          nome: nome.slice(0, 120),
          cargo: data.cargo?.trim().slice(0, 120) || null,
          papel,
          tamanho,
          responsavel_id: responsavelId,
          responsavel_nome: responsavelNome,
        })
        .select("id")
        .single();
      if (eIns) throw new Error(eIns.message);
      avaliadoId = novoAvaliado.id as string;
    } else {
      const patch: Record<string, unknown> = {};
      if (data.cargo?.trim()) patch.cargo = data.cargo.trim().slice(0, 120);
      if (tamanho !== null) patch.tamanho = tamanho;
      if (responsavelId) {
        patch.responsavel_id = responsavelId;
        patch.responsavel_nome = null;
      } else if (responsavelNome) {
        patch.responsavel_nome = responsavelNome;
        patch.responsavel_id = null;
      }
      if (Object.keys(patch).length) await db.from("lideres").update(patch).eq("id", avaliadoId);
    }

    const { data: jaTem, error: eJa } = await db
      .from("avaliacoes")
      .select("tipo")
      .eq("lider_id", avaliadoId)
      .neq("status", "arquivada");
    if (eJa) throw new Error(eJa.message);

    const ocupados = new Set((jaTem ?? []).map((a) => a.tipo as string));
    const novas = oticas.filter((o) => !ocupados.has(o.tipo));
    if (!novas.length) return { criadas: 0, jaExistiam: oticas.length };

    const { error: eAv } = await db.from("avaliacoes").insert(
      novas.map((o) => ({
        cliente_id: cliente.id,
        lider_id: avaliadoId,
        tipo: o.tipo,
        respondentes_esperados: Math.max(0, Math.min(200, Math.trunc(o.respondentes || 0))),
      })),
    );
    if (eAv) throw new Error(eAv.message);

    return { criadas: novas.length, jaExistiam: oticas.length - novas.length };
  });


/**
 * A empresa CORRIGE um avaliado que ela mesma criou.
 *
 * Existe porque criar era irreversível: um nome digitado errado ou um
 * respondente a mais só se resolvia arquivando e recriando — e isso jogava
 * fora as respostas já coletadas, que ficam presas ao avaliacao_id antigo e
 * saem do cálculo quando a avaliação é arquivada. Aqui a ficha é a mesma, então
 * nada do que já foi respondido se perde, e a chave AV- não muda: o link que a
 * equipe recebeu continua valendo.
 *
 * **O que NÃO se edita, e por quê:** o `papel` e o `tipo` da avaliação. Os dois
 * decidem qual questionário a pessoa respondeu; trocá-los depois de haver
 * resposta seria misturar respostas de perguntas diferentes no mesmo balde.
 * A chave AV- também não, para não invalidar o que já foi distribuído.
 *
 * Escopo: cada id é conferido contra o cliente da chave KX- no SERVIDOR. A tela
 * só mostra o que é do cliente, mas a tela pode ser contornada.
 */
export const publicEditarAvaliado = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      chave: string;
      avaliado_id: string;
      nome: string;
      cargo?: string;
      /** Só vale quando o papel é equipe; ignorado nos outros. */
      tamanho?: number;
      responsavel_id?: string | null;
      responsavel_nome?: string | null;
      /** Uma entrada por ótica que se quer reajustar. */
      oticas?: { avaliacao_id: string; respondentes: number }[];
    }) => input,
  )
  .handler(async ({ data }): Promise<{ ok: true; oticasAjustadas: number }> => {
    const db = sb();

    const cliente = await clientePorChave(db, data.chave);
    if (!cliente) throw new Error("Chave de acesso não encontrada.");

    // O avaliado tem de ser DESTE cliente. Sem esta conferência, um id
    // adivinhado editaria a ficha de outra empresa.
    const { data: avaliado, error: eBusca } = await db
      .from("lideres")
      .select("id, papel")
      .eq("id", data.avaliado_id)
      .eq("cliente_id", cliente.id)
      .maybeSingle();
    if (eBusca) throw new Error(eBusca.message);
    if (!avaliado) throw new Error("Avaliado não encontrado.");

    const papel = avaliado.papel as PapelAvaliado;

    const nome = data.nome?.trim();
    if (!nome)
      throw new Error(
        papel === "equipe" ? "Informe de quem é a equipe." : "Informe o nome de quem será avaliado.",
      );

    // Mesmos limites do cadastro, para os dois caminhos não divergirem.
    const patch: Record<string, unknown> = {
      nome: nome.slice(0, 120),
      cargo: data.cargo?.trim().slice(0, 120) || null,
    };

    if (papel === "equipe") {
      patch.tamanho = data.tamanho
        ? Math.max(1, Math.min(500, Math.trunc(data.tamanho)))
        : null;
      // O vínculo ganha do texto, igual ao cadastro.
      const responsavelId = data.responsavel_id || null;
      patch.responsavel_id = responsavelId;
      patch.responsavel_nome = responsavelId
        ? null
        : data.responsavel_nome?.trim().slice(0, 120) || null;
    }

    const { error: eUp } = await db
      .from("lideres")
      .update(patch)
      .eq("id", avaliado.id)
      .eq("cliente_id", cliente.id);
    if (eUp) throw new Error(eUp.message);

    // Respondentes esperados, ótica por ótica. Cada avaliação é conferida
    // contra o avaliado E contra o cliente; arquivada não se mexe.
    let oticasAjustadas = 0;
    for (const o of data.oticas ?? []) {
      const { data: linha, error } = await db
        .from("avaliacoes")
        .update({
          respondentes_esperados: Math.max(0, Math.min(200, Math.trunc(o.respondentes || 0))),
        })
        .eq("id", o.avaliacao_id)
        .eq("lider_id", avaliado.id)
        .eq("cliente_id", cliente.id)
        .neq("status", "arquivada")
        .select("id")
        .maybeSingle();
      if (error) throw new Error(error.message);
      if (linha) oticasAjustadas++;
    }

    return { ok: true, oticasAjustadas };
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
      .insert({
        nome_empresa: nome,
        criado_por: data.criado_por ?? null,
        // Cadastrada aqui dentro: a Korthex já sai daqui para entregar a chave,
        // então não é uma solicitação pendente.
        origem: "korthex",
        liberado_em: new Date().toISOString(),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row as Cliente;
  });

/**
 * Entrega a chave: registra que saiu. O envio em si é humano (WhatsApp ou
 * e-mail) — o sistema só carimba a data, e é isso que tira a empresa da fila.
 *
 * Não trava em `liberado_em is null`: uma empresa que já recebeu a chave uma
 * vez pode pedir de novo, e essa segunda entrega tem de ser registrável. O que
 * exige é ter um pedido — sem `solicitado_em` não há o que liberar.
 */
export const adminLiberarSolicitacao = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Cliente> => {
    await requireAdmin();
    const { data: row, error } = await sb()
      .from("clientes")
      .update({ liberado_em: new Date().toISOString() })
      .eq("id", id)
      .not("solicitado_em", "is", null)
      .select("*")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("Essa ficha não tem pedido do site para liberar.");
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

    return montaPanorama(cliente.nome_empresa, cliente.chave, recortes);
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
  /** Quando só há um líder, o id dele — para linkar direto no recorte. */
  liderUnicoId: string | null;
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

/** Dias corridos entre uma data e agora, na virada de dia de Brasília. */
export function diasEntre(iso: string | null, agora: number): number {
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
        db.from("lideres").select("id, cliente_id, nome, cargo, papel"),
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
      // O funil acompanha o diagnóstico da LIDERANÇA — é ele que vira mapa da
      // empresa e oferta. Avaliação de executivo e de equipe tem leitura
      // própria e não pode segurar a etapa deste cliente.
      const meusLideres = (lideres ?? []).filter(
        (l) => l.cliente_id === c.id && ((l.papel as string) ?? "lider") === "lider",
      );
      const idsLideranca = new Set(meusLideres.map((l) => l.id as string));
      const minhasAv = (avaliacoes ?? []).filter(
        (a) => a.cliente_id === c.id && a.lider_id !== null && idsLideranca.has(a.lider_id as string),
      );

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
        liderUnicoId: meusLideres.length === 1 ? (meusLideres[0].id as string) : null,
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
      // Demanda: em quantas EMPRESAS cada treinamento é indicado. Duas
      // dimensões podem cair no mesmo programa (Emoções e Autonomia) — e aí
      // continua sendo uma empresa pedindo aquele treinamento, não duas.
      const programasDaEmpresa = new Set<string>();
      for (const d of emp.porDimensao) {
        if (d.band === "hi") continue;
        const def = DIMENSOES.find((x) => x.chave === d.chave);
        if (!def) continue;
        programasDaEmpresa.add(programaDe(def.chave).titulo);
      }
      for (const titulo of programasDaEmpresa) {
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

/** A porta admin do panorama — o cálculo acima, atrás do Cloudflare Access. */
export const adminPanoramaEmpresa = createServerFn({ method: "GET" })
  .inputValidator((clienteId: string) => clienteId)
  .handler(async ({ data: clienteId }): Promise<PanoramaEmpresa | null> => {
    await requireAdmin();
    return panoramaDoCliente(clienteId);
  });

/* ──────────────  RESULTADO do EXECUTIVO e da EQUIPE  ────────────── */

export interface RecorteAvaliado<T> {
  avaliado: {
    id: string;
    nome: string;
    cargo: string | null;
    tamanho: number | null;
    /** Quem conduz a equipe, com o aviso de que sem vínculo não há cruzamento. */
    responsavel: { nome: string; vinculado: boolean } | null;
  };
  cliente: { nome_empresa: string; chave: string };
  calculo: T;
}

/** Carrega o avaliado, confere o papel e devolve o cálculo pedido. */
async function recorteDoAvaliado<T>(
  db: SupabaseClient,
  avaliadoId: string,
  papel: PapelAvaliado,
  calcular: (respostas: RespostaBruta[]) => T,
  clienteEsperado?: string,
): Promise<RecorteAvaliado<T> | null> {
  const { data: av, error } = await db
    .from("lideres")
    .select(
      "id, nome, cargo, papel, tamanho, responsavel_nome, cliente_id, clientes(nome_empresa, chave), responsavel:responsavel_id(nome)",
    )
    .eq("id", avaliadoId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!av || (av.papel as PapelAvaliado) !== papel) return null;
  if (clienteEsperado && (av.cliente_id as string) !== clienteEsperado) return null;

  const cliente = (Array.isArray(av.clientes) ? av.clientes[0] : av.clientes) as
    | { nome_empresa: string; chave: string }
    | null;
  if (!cliente) return null;

  const vinculado = (Array.isArray(av.responsavel) ? av.responsavel[0] : av.responsavel) as
    | { nome: string }
    | null;

  return {
    avaliado: {
      id: av.id as string,
      nome: av.nome as string,
      cargo: av.cargo as string | null,
      tamanho: av.tamanho as number | null,
      responsavel: vinculado
        ? { nome: vinculado.nome, vinculado: true }
        : av.responsavel_nome
          ? { nome: av.responsavel_nome as string, vinculado: false }
          : null,
    },
    cliente,
    calculo: calcular(await respostasDoAvaliado(db, avaliadoId)),
  };
}

/** O recorte do executivo, pela chave da empresa. */
export const publicResultadoExecutivo = createServerFn({ method: "GET" })
  .inputValidator((input: { chave: string; id: string }) => input)
  .handler(async ({ data }): Promise<RecorteAvaliado<ResultadoExecutivoCalculado> | null> => {
    const db = sb();
    const cliente = await clientePorChave(db, data.chave);
    if (!cliente) return null;
    return recorteDoAvaliado(db, data.id, "executivo", calculaExecutivo, cliente.id);
  });

/** O recorte da equipe, pela chave da empresa. Os três modos leem os mesmos dados. */
export const publicResultadoEquipe = createServerFn({ method: "GET" })
  .inputValidator((input: { chave: string; id: string }) => input)
  .handler(async ({ data }): Promise<RecorteAvaliado<ResultadoEquipeCalculado> | null> => {
    const db = sb();
    const cliente = await clientePorChave(db, data.chave);
    if (!cliente) return null;
    return recorteDoAvaliado(db, data.id, "equipe", calculaEquipe, cliente.id);
  });

/** As mesmas leituras pela porta interna da Korthex. */
export const adminResultadoExecutivo = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<RecorteAvaliado<ResultadoExecutivoCalculado> | null> => {
    await requireAdmin();
    return recorteDoAvaliado(sb(), id, "executivo", calculaExecutivo);
  });

export const adminResultadoEquipe = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<RecorteAvaliado<ResultadoEquipeCalculado> | null> => {
    await requireAdmin();
    return recorteDoAvaliado(sb(), id, "equipe", calculaEquipe);
  });
