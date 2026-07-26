import { createServerFn } from "@tanstack/react-start";
import { requireAdmin } from "./access-auth";
import { diasEntre, type Cliente } from "./diag-server";
import { supabaseKorthex } from "./korthex-db";
import { panoramaDoCliente } from "./diag-panorama";
import {
  chaveDaOferta,
  sugereOfertas,
  tituloOportunidade,
  ESTAGIOS_ABERTOS,
  type EstagioFunil,
  type EvidenciaOportunidade,
  type ForcaEvidencia,
  type FormatoOferta,
  type Interacao,
  type Oportunidade,
  type ProgramaChave,
  type SugestaoOferta,
  type TipoInteracao,
} from "./oportunidades";

/**
 * Camada de servidor do módulo COMERCIAL do Korthex.
 *
 * O diagnóstico não termina no relatório — ele é matéria-prima comercial.
 * Aqui a evidência vira oferta, a oferta vira oportunidade e a oportunidade
 * anda num funil. Tudo interno da Korthex: protegido por requireAdmin(), com a
 * service key que só existe no Worker.
 *
 * O domínio (o que é uma oferta, como o diagnóstico sugere) mora em
 * oportunidades.ts, que é puro. Aqui só se fala com o banco.
 */

/** Uma oportunidade com o contexto que o funil precisa mostrar. */
export interface OportunidadeNoFunil extends Oportunidade {
  empresa: string;
  chave: string;
  responsavel: { nome: string | null; email: string | null; telefone: string | null } | null;
  lider_nome: string | null;
  /** O que aparece na linha: o nome do treinamento ou "Mentoria · Fulano". */
  titulo: string;
  /** Dias parados no estágio atual — é o que dá urgência à lista. */
  diasParado: number;
  /** Dias desde a última conversa com gente (nota, e-mail, ligação...). */
  diasSemContato: number | null;
}

export interface FiltroFunil {
  /** Vazio = só as abertas. Encerrada só aparece quando pedida. */
  estagios?: EstagioFunil[];
  programa?: ProgramaChave | null;
  /** O filtro que sustenta a abordagem em massa: o nome exato do treinamento. */
  treinamento?: string | null;
  forca?: ForcaEvidencia | null;
  busca?: string | null;
}

export interface FunilOportunidades {
  itens: OportunidadeNoFunil[];
  /** Contagem por estágio, ignorando o filtro de estágio (é o cabeçalho do funil). */
  totais: Record<EstagioFunil, number>;
  /** Facetas para os filtros: cada treinamento com quantas oportunidades abertas tem. */
  treinamentos: { nome: string; programa: ProgramaChave; abertas: number }[];
}

/* ────────────────────────  Leitura do funil  ──────────────────────── */

interface LinhaCrua extends Oportunidade {
  clientes: { nome_empresa: string; chave: string; responsavel_nome: string | null; responsavel_email: string | null; responsavel_telefone: string | null } | null;
  lideres: { nome: string } | null;
}

const SELECT_FUNIL =
  "*, clientes(nome_empresa, chave, responsavel_nome, responsavel_email, responsavel_telefone), lideres(nome)";

/** PostgREST devolve o embed como objeto ou array de um, dependendo da relação. */
function um<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

/** Última conversa com gente por cliente. Mudança de estágio não conta. */
async function ultimoContatoPorCliente(
  db: ReturnType<typeof supabaseKorthex>,
  clienteIds: string[],
): Promise<Record<string, string>> {
  if (!clienteIds.length) return {};
  const { data, error } = await db
    .from("interacoes")
    .select("cliente_id, created_at")
    .in("cliente_id", clienteIds)
    .eq("contato", true)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const mapa: Record<string, string> = {};
  for (const r of data ?? []) {
    const k = r.cliente_id as string;
    if (!mapa[k]) mapa[k] = r.created_at as string; // já vem da mais nova para a mais velha
  }
  return mapa;
}

function montaLinha(o: LinhaCrua, ultimoContato: string | undefined, agora: number): OportunidadeNoFunil {
  const { clientes, lideres, ...base } = o;
  const c = um(clientes);
  const l = um(lideres);
  return {
    ...base,
    empresa: c?.nome_empresa ?? "—",
    chave: c?.chave ?? "",
    responsavel: c?.responsavel_email
      ? { nome: c.responsavel_nome, email: c.responsavel_email, telefone: c.responsavel_telefone }
      : null,
    lider_nome: l?.nome ?? null,
    titulo: tituloOportunidade({ formato: o.formato, treinamento: o.treinamento, lider_nome: l?.nome ?? null }),
    diasParado: diasEntre(o.estagio_em, agora),
    diasSemContato: ultimoContato ? diasEntre(ultimoContato, agora) : null,
  };
}

/**
 * O funil inteiro, filtrado. Os filtros são aplicados em memória de propósito:
 * o volume é de dezenas, e assim as contagens por estágio continuam certas
 * mesmo quando a lista está filtrada por estágio.
 */
export const adminListOportunidades = createServerFn({ method: "GET" })
  .inputValidator((f: FiltroFunil | undefined) => f ?? {})
  .handler(async ({ data: filtro }): Promise<FunilOportunidades> => {
    await requireAdmin();
    const db = supabaseKorthex();
    const agora = Date.now();

    const { data, error } = await db
      .from("oportunidades")
      .select(SELECT_FUNIL)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const cruas = (data ?? []) as unknown as LinhaCrua[];
    const contatos = await ultimoContatoPorCliente(db, [...new Set(cruas.map((o) => o.cliente_id))]);
    const todas = cruas.map((o) => montaLinha(o, contatos[o.cliente_id], agora));

    // Recorte que NÃO depende do estágio — é sobre ele que as contagens são feitas.
    const busca = (filtro.busca ?? "").trim().toLowerCase();
    const base = todas.filter(
      (o) =>
        (!filtro.programa || o.programa === filtro.programa) &&
        (!filtro.treinamento || o.treinamento === filtro.treinamento) &&
        (!filtro.forca || o.forca_evidencia === filtro.forca) &&
        (!busca || o.empresa.toLowerCase().includes(busca) || (o.treinamento ?? "").toLowerCase().includes(busca)),
    );

    const estagios = filtro.estagios?.length ? filtro.estagios : ESTAGIOS_ABERTOS;
    const itens = base
      .filter((o) => estagios.includes(o.estagio))
      // Mais parado primeiro: a lista é de cobrança, não de cadastro.
      .sort((a, b) => b.diasParado - a.diasParado);

    const totais = { nova: 0, apresentacao: 0, proposta: 0, ganha: 0, perdida: 0 } as Record<EstagioFunil, number>;
    for (const o of base) totais[o.estagio] += 1;

    const conta = new Map<string, { programa: ProgramaChave; abertas: number }>();
    for (const o of todas) {
      if (!o.treinamento) continue;
      const atual = conta.get(o.treinamento) ?? { programa: o.programa, abertas: 0 };
      if (ESTAGIOS_ABERTOS.includes(o.estagio)) atual.abertas += 1;
      conta.set(o.treinamento, atual);
    }

    return {
      itens,
      totais,
      treinamentos: [...conta.entries()]
        .map(([nome, v]) => ({ nome, programa: v.programa, abertas: v.abertas }))
        .sort((a, b) => b.abertas - a.abertas),
    };
  });

/* ────────────────────────  Montar a oferta  ──────────────────────── */

export interface OfertaParaMontar {
  cliente: { id: string; empresa: string; chave: string; responsavel_nome: string | null; responsavel_email: string | null };
  /** Nulo quando o diagnóstico ainda não tem resposta suficiente para calcular. */
  indiceGeral: number | null;
  totalLideres: number;
  sugestoes: SugestaoOferta[];
  /** O que já virou oportunidade — a tela mostra em vez de deixar duplicar. */
  existentes: OportunidadeNoFunil[];
}

/**
 * A tela "Montar oferta": o sistema pré-marca com base na evidência e escreve o
 * porquê em cada linha; quem decide é o vendedor.
 */
export const adminOfertaDoCliente = createServerFn({ method: "GET" })
  .inputValidator((clienteId: string) => clienteId)
  .handler(async ({ data: clienteId }): Promise<OfertaParaMontar | null> => {
    await requireAdmin();
    const db = supabaseKorthex();
    const agora = Date.now();

    const { data: cliente, error } = await db
      .from("clientes")
      .select("id, nome_empresa, chave, responsavel_nome, responsavel_email")
      .eq("id", clienteId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!cliente) return null;

    const [panorama, { data: lideres, error: e2 }, { data: existentesCruas, error: e3 }] = await Promise.all([
      panoramaDoCliente(clienteId),
      db.from("lideres").select("id, nome").eq("cliente_id", clienteId),
      db.from("oportunidades").select(SELECT_FUNIL).eq("cliente_id", clienteId).order("created_at", { ascending: false }),
    ]);
    if (e2) throw new Error(e2.message);
    if (e3) throw new Error(e3.message);

    const idPorLider: Record<string, string> = {};
    for (const l of lideres ?? []) idPorLider[l.nome as string] = l.id as string;

    const existentes = ((existentesCruas ?? []) as unknown as LinhaCrua[]).map((o) =>
      montaLinha(o, undefined, agora),
    );
    // Só o que está aberto bloqueia: um ciclo novo pode reofertar o que foi perdido.
    const abertas = new Set(
      existentes
        .filter((o) => ESTAGIOS_ABERTOS.includes(o.estagio))
        .map((o) => chaveDaOferta(o)),
    );

    const sugestoes = (panorama ? sugereOfertas(panorama, idPorLider) : []).map((s) => ({
      ...s,
      jaExiste: abertas.has(chaveDaOferta(s)),
    }));

    return {
      cliente: {
        id: cliente.id as string,
        empresa: cliente.nome_empresa as string,
        chave: cliente.chave as string,
        responsavel_nome: cliente.responsavel_nome as string | null,
        responsavel_email: cliente.responsavel_email as string | null,
      },
      indiceGeral: panorama?.resultado?.indiceGeral ?? null,
      totalLideres: panorama?.resultado?.lideres.length ?? 0,
      sugestoes,
      existentes,
    };
  });

/** Uma linha que o vendedor marcou para virar oportunidade. */
export interface ItemDaOferta {
  programa: ProgramaChave;
  formato: FormatoOferta;
  treinamento?: string | null;
  lider_id?: string | null;
  dimensoes?: string[];
  forca_evidencia?: ForcaEvidencia;
  evidencia_resumo?: string | null;
  evidencia?: EvidenciaOportunidade | null;
  origem?: "diagnostico" | "manual";
  observacoes?: string | null;
}

export interface SalvarOfertaEntrada {
  clienteId: string;
  itens: ItemDaOferta[];
  criadoPor?: string | null;
}

/**
 * Grava a oferta curada. Tudo que sai da mesma montagem compartilha um `lote`,
 * então dá para dizer depois "a oferta montada em 26/07 tinha 4 frentes".
 *
 * O que já existe aberto é ignorado, não atualizado: se o vendedor mandar duas
 * vezes, ninguém perde histórico e nada duplica.
 */
export const adminSalvarOferta = createServerFn({ method: "POST" })
  .inputValidator((e: SalvarOfertaEntrada) => e)
  .handler(async ({ data }): Promise<{ criadas: number; jaExistiam: number; lote: string }> => {
    await requireAdmin();
    const db = supabaseKorthex();
    const lote = crypto.randomUUID();

    const { data: existentes, error } = await db
      .from("oportunidades")
      .select("programa, formato, treinamento, lider_id, estagio")
      .eq("cliente_id", data.clienteId)
      .in("estagio", ESTAGIOS_ABERTOS);
    if (error) throw new Error(error.message);

    const abertas = new Set(
      (existentes ?? []).map((o) =>
        chaveDaOferta({
          programa: o.programa as ProgramaChave,
          formato: o.formato as FormatoOferta,
          treinamento: o.treinamento as string | null,
          lider_id: o.lider_id as string | null,
        }),
      ),
    );

    const novas: Record<string, unknown>[] = [];
    const vistas = new Set<string>();
    let jaExistiam = 0;

    for (const item of data.itens) {
      const chave = chaveDaOferta(item);
      if (abertas.has(chave) || vistas.has(chave)) {
        jaExistiam += 1;
        continue;
      }
      vistas.add(chave);
      novas.push({
        cliente_id: data.clienteId,
        programa: item.programa,
        formato: item.formato,
        treinamento: item.formato === "treinamento" ? item.treinamento : null,
        lider_id: item.formato === "mentoria" ? (item.lider_id ?? null) : null,
        origem: item.origem ?? "diagnostico",
        forca_evidencia: item.forca_evidencia ?? "hipotese",
        dimensoes: item.dimensoes ?? [],
        evidencia_resumo: item.evidencia_resumo ?? null,
        evidencia: item.evidencia ?? null,
        observacoes: item.observacoes ?? null,
        criado_por: data.criadoPor ?? null,
        lote,
      });
    }

    if (novas.length) {
      const { error: e2 } = await db.from("oportunidades").insert(novas);
      if (e2) throw new Error(e2.message);

      await db.from("interacoes").insert({
        cliente_id: data.clienteId,
        tipo: "sistema",
        conteudo: `Oferta montada: ${novas.length} ${novas.length === 1 ? "frente" : "frentes"}.`,
        autor: data.criadoPor ?? null,
        meta: { lote },
      });
    }

    return { criadas: novas.length, jaExistiam, lote };
  });

/* ────────────────────────  Mover no funil  ──────────────────────── */

export interface MoverEstagioEntrada {
  ids: string[];
  estagio: EstagioFunil;
  /** Obrigatório ao perder: perder sem motivo não ensina nada. */
  motivo?: string | null;
  valor?: number | null;
  autor?: string | null;
}

/**
 * Move uma ou várias oportunidades de estágio — é o que sustenta a ação em
 * massa do funil. As datas do funil quem carimba é o banco (trigger); aqui só
 * fica o registro de quem mexeu.
 */
export const adminMoverEstagio = createServerFn({ method: "POST" })
  .inputValidator((e: MoverEstagioEntrada) => e)
  .handler(async ({ data }): Promise<{ movidas: number }> => {
    await requireAdmin();
    if (!data.ids.length) return { movidas: 0 };
    if (data.estagio === "perdida" && !(data.motivo ?? "").trim()) {
      throw new Error("Diga por que perdeu — é o dado que faz a leitura da perda valer alguma coisa.");
    }
    const db = supabaseKorthex();

    const { data: antes, error } = await db
      .from("oportunidades")
      .select("id, cliente_id, estagio")
      .in("id", data.ids);
    if (error) throw new Error(error.message);

    const patch: Record<string, unknown> = { estagio: data.estagio };
    if (data.estagio === "perdida") patch.motivo_perda = (data.motivo ?? "").trim();
    if (data.valor !== undefined && data.valor !== null) patch.valor = data.valor;

    const { error: e2 } = await db.from("oportunidades").update(patch).in("id", data.ids);
    if (e2) throw new Error(e2.message);

    const historico = (antes ?? [])
      .filter((o) => o.estagio !== data.estagio)
      .map((o) => ({
        cliente_id: o.cliente_id as string,
        oportunidade_id: o.id as string,
        tipo: "estagio" as TipoInteracao,
        conteudo: `${o.estagio} → ${data.estagio}${data.motivo ? ` · ${data.motivo}` : ""}`,
        autor: data.autor ?? null,
        meta: { de: o.estagio, para: data.estagio },
      }));
    if (historico.length) {
      const { error: e3 } = await db.from("interacoes").insert(historico);
      if (e3) throw new Error(e3.message);
    }

    return { movidas: historico.length };
  });

/* ────────────────────────  Histórico do lead  ──────────────────────── */

export const adminRegistrarInteracao = createServerFn({ method: "POST" })
  .inputValidator(
    (e: {
      clienteId: string;
      oportunidadeId?: string | null;
      tipo: TipoInteracao;
      conteudo: string;
      autor?: string | null;
    }) => e,
  )
  .handler(async ({ data }): Promise<{ ok: true }> => {
    await requireAdmin();
    const conteudo = (data.conteudo ?? "").trim();
    if (!conteudo) throw new Error("Anotação vazia.");

    const { error } = await supabaseKorthex().from("interacoes").insert({
      cliente_id: data.clienteId,
      oportunidade_id: data.oportunidadeId ?? null,
      tipo: data.tipo,
      conteudo,
      autor: data.autor ?? null,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export interface FichaDoLead {
  cliente: Cliente;
  oportunidades: OportunidadeNoFunil[];
  interacoes: Interacao[];
  /** Nulo quando ninguém falou com o lead ainda. */
  diasSemContato: number | null;
  abertas: number;
  ganhas: number;
  perdidas: number;
  /** Soma do valor das propostas em aberto. */
  emJogo: number;
}

/** A ficha do lead: tudo sobre uma empresa numa tela só. */
export const adminFichaLead = createServerFn({ method: "GET" })
  .inputValidator((clienteId: string) => clienteId)
  .handler(async ({ data: clienteId }): Promise<FichaDoLead | null> => {
    await requireAdmin();
    const db = supabaseKorthex();
    const agora = Date.now();

    const [{ data: cliente, error }, { data: cruas, error: e2 }, { data: interacoes, error: e3 }] =
      await Promise.all([
        db.from("clientes").select("*").eq("id", clienteId).maybeSingle(),
        db.from("oportunidades").select(SELECT_FUNIL).eq("cliente_id", clienteId).order("created_at", { ascending: false }),
        db.from("interacoes").select("*").eq("cliente_id", clienteId).order("created_at", { ascending: false }),
      ]);
    if (error) throw new Error(error.message);
    if (e2) throw new Error(e2.message);
    if (e3) throw new Error(e3.message);
    if (!cliente) return null;

    const ultimo = (interacoes ?? []).find((i) => i.contato)?.created_at as string | undefined;
    const oportunidades = ((cruas ?? []) as unknown as LinhaCrua[]).map((o) => montaLinha(o, ultimo, agora));

    return {
      cliente: cliente as Cliente,
      oportunidades,
      interacoes: (interacoes ?? []) as Interacao[],
      diasSemContato: ultimo ? diasEntre(ultimo, agora) : null,
      abertas: oportunidades.filter((o) => ESTAGIOS_ABERTOS.includes(o.estagio)).length,
      ganhas: oportunidades.filter((o) => o.estagio === "ganha").length,
      perdidas: oportunidades.filter((o) => o.estagio === "perdida").length,
      emJogo: oportunidades
        .filter((o) => o.estagio === "proposta")
        .reduce((s, o) => s + (Number(o.valor) || 0), 0),
    };
  });
