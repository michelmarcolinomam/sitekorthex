import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseKorthex } from "./korthex-db";
import {
  calculaLider,
  calculaEmpresa,
  media as mediaDe,
  type ItemResposta,
  type RespostaBruta,
  type ResultadoEmpresa,
  type ResultadoLiderCalculado,
} from "./motor-calculo";
import type { AvaliacaoTipo } from "./diag-server";

/**
 * A leitura agregada do diagnóstico: das respostas cruas ao retrato da empresa.
 *
 * Fica fora de diag-server porque tem DOIS consumidores — as telas de resultado
 * (diag-server) e a camada comercial (crm-server), que monta a oferta a partir
 * da mesma evidência. Módulo de servidor: só é chamado de dentro de handlers.
 */

/**
 * As respostas cruas de um avaliado, seja ele líder, executivo ou equipe.
 * Cada tela decide o que fazer com elas — o motor tem um cálculo para cada.
 */
export async function respostasDoAvaliado(
  db: SupabaseClient,
  avaliadoId: string,
): Promise<RespostaBruta[]> {
  const { data: avs, error } = await db
    .from("avaliacoes")
    .select("id, tipo")
    .eq("lider_id", avaliadoId)
    .neq("status", "arquivada");
  if (error) throw new Error(error.message);

  const ids = (avs ?? []).map((a) => a.id as string);
  if (!ids.length) return [];
  const tipoPorId = new Map((avs ?? []).map((a) => [a.id as string, a.tipo as AvaliacaoTipo]));

  const { data: rs, error: e2 } = await db
    .from("respostas")
    .select("avaliacao_id, respostas")
    .in("avaliacao_id", ids);
  if (e2) throw new Error(e2.message);

  return (rs ?? []).map((r) => ({
    tipo: tipoPorId.get(r.avaliacao_id as string) as AvaliacaoTipo,
    itens: Object.values((r.respostas ?? {}) as Record<string, ItemResposta>).filter(
      (i) => i && typeof i.score === "number",
    ),
  }));
}

/** Junta as respostas de um líder e calcula. Usado por todas as portas. */
export async function recorteDoLider(
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
 * Panorama de nível 2 pelo id do cliente: junta todos os líderes e agrega.
 * Só entram líderes que já têm resposta — quem não foi avaliado não conta.
 */
export async function panoramaDoCliente(clienteId: string): Promise<PanoramaEmpresa | null> {
  const db = supabaseKorthex();

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

  return montaPanorama(cliente.nome_empresa as string, cliente.chave as string, recortes);
}

/** O fechamento do panorama, comum às duas portas (por id e por chave KX-). */
export function montaPanorama(
  empresa: string,
  chave: string,
  recortes: { nome: string; cargo: string | null; recorte: ResultadoLiderCalculado }[],
): PanoramaEmpresa {
  const comTime = recortes.map((r) => r.recorte.indiceTime).filter((v): v is number => v !== null);
  const comExec = recortes.map((r) => r.recorte.indiceExec).filter((v): v is number => v !== null);
  const divs = recortes.map((r) => r.recorte.divergencia).filter((v): v is number => v !== null);

  return {
    empresa,
    chave,
    totalRespondentes: recortes.reduce(
      (s, r) => s + r.recorte.respondentesTime + r.recorte.respondentesExec,
      0,
    ),
    indiceTime: comTime.length ? mediaDe(comTime) : null,
    indiceExec: comExec.length ? mediaDe(comExec) : null,
    divergencia: divs.length ? mediaDe(divs) : null,
    resultado: calculaEmpresa(recortes),
  };
}

export type { ResultadoEmpresa };
