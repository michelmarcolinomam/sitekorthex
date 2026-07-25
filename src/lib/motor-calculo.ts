/**
 * Motor de cálculo dos diagnósticos.
 *
 * Faz o elo que faltava: pega as respostas cruas gravadas pelos questionários
 * (nota 0-4 por item, etiquetada com tema e faceta) e produz os índices 0-100
 * que as telas de resultado consomem.
 *
 * As REGRAS são as do Michel, tiradas do próprio código dele em
 * "Resultado - Overview da Empresa (nivel 2).html":
 *   - média simples das notas;
 *   - severidade de DIMENSÃO em 70 / 55  (band: forte / atenção / frágil);
 *   - classificação de LÍDER em 80 / 66 / 55 (Referência / Sólido / Mentoria
 *     individual / Mentoria emergencial);
 *   - ordenação do pior para o melhor;
 *   - fraqueza repetida entre líderes = cultura; concentrada = caso individual.
 */

import type { AvaliacaoTipo } from "./diag-server";

/* ─────────────────────────  Dimensões  ───────────────────────── */

export const DIMENSOES = [
  { chave: "emocoes", nome: "Estabilidade Emocional", curto: "Estabilidade" },
  { chave: "conflito", nome: "Gestão & Conflitos", curto: "Gestão" },
  { chave: "comunicacao", nome: "Comunicação & Feedback", curto: "Comunicação" },
  { chave: "identidade", nome: "Confiança & Integridade", curto: "Confiança" },
  { chave: "autonomia", nome: "Autonomia & Desenvolvimento", curto: "Autonomia" },
] as const;

export type ChaveDimensao = (typeof DIMENSOES)[number]["chave"];

/**
 * Cada bloco dos questionários carrega um `theme`. Os dois questionários usam
 * nomes próprios, então aqui eles se encontram na mesma dimensão.
 *
 * Um detalhe do desenho: o questionário do executivo tem SEIS blocos — o extra
 * é "Entrega & Resultado" (theme `autorresp`), que não tem equivalente na visão
 * do time. Ele é calculado e devolvido à parte, como dimensão só do executivo,
 * em vez de ser forçado numa comparação que não existe.
 */
const TEMA_POR_TIPO: Record<string, Record<string, ChaveDimensao | "entrega">> = {
  lideranca_time: {
    emocoes: "emocoes",
    conflito: "conflito",
    comunicacao: "comunicacao",
    identidade: "identidade",
    autorresp: "autonomia", // bloco "Autonomia e crescimento"
  },
  lideranca_executivo: {
    emocoes: "emocoes",
    conflito: "conflito",
    comunicacao: "comunicacao",
    identidade: "identidade",
    autonomia: "autonomia",
    autorresp: "entrega", // bloco "Entrega & Resultado", exclusivo do executivo
  },
};

/* ─────────────────────────  Régua e faixas  ───────────────────────── */

/** Nota 0-4 vira índice 0-100. Ponto único de conversão. */
export function paraIndice(notas: number[]): number | null {
  if (!notas.length) return null;
  const media = notas.reduce((a, b) => a + b, 0) / notas.length;
  return Math.round((media / 4) * 100);
}

export function media(valores: number[]): number {
  return Math.round(valores.reduce((a, b) => a + b, 0) / valores.length);
}

/** Severidade de uma DIMENSÃO — regra do overview do Michel. */
export function band(v: number): "hi" | "mid" | "lo" {
  return v >= 70 ? "hi" : v >= 55 ? "mid" : "lo";
}

export const ROTULO_BAND: Record<"hi" | "mid" | "lo", string> = {
  hi: "forte",
  mid: "atenção",
  lo: "frágil",
};

/** Classificação de um LÍDER pela média dele — régua de 4 faixas. */
export function classificaLider(indice: number): { chave: string; rotulo: string } {
  if (indice >= 80) return { chave: "ref", rotulo: "Referência" };
  if (indice >= 66) return { chave: "ok", rotulo: "Sólido" };
  if (indice >= 55) return { chave: "ment", rotulo: "Mentoria individual" };
  return { chave: "emerg", rotulo: "Mentoria emergencial" };
}

export type Severidade = "crit" | "warn" | "good" | "inv";

/** A faixa do nível traduzida para a mesma escala de severidade das telas. */
const SEV_POR_FAIXA: Record<"hi" | "mid" | "lo", Severidade> = { hi: "good", mid: "warn", lo: "crit" };

/** Quanto menor, mais grave — usado para escolher a pior de duas severidades. */
const PESO_SEV: Record<Severidade, number> = { crit: 0, warn: 1, inv: 2, good: 3 };

/**
 * Severidade do GAP entre as duas óticas. Calibrado pelos rótulos que o Michel
 * usou no protótipo do recorte: gap 27 "alto/fratura", 15 e 16 "atenção",
 * 4 "consenso", e o caso invertido (time enxerga melhor que o executivo).
 */
export function severidadeGap(time: number, exec: number): { severidade: Severidade; rotulo: string; gap: number } {
  const gap = Math.abs(exec - time);
  if (exec < time) return { severidade: "inv", rotulo: "invertido", gap };
  if (gap >= 20) return { severidade: "crit", rotulo: "fratura", gap };
  if (gap >= 10) return { severidade: "warn", rotulo: "atenção", gap };
  return { severidade: "good", rotulo: "consenso", gap };
}

/* ─────────────────────────  Nível 1 — o líder  ───────────────────────── */

/** Uma resposta gravada: um item respondido por uma pessoa. */
export interface ItemResposta {
  score: number;
  theme: string;
  facet: string;
}

/** O que uma pessoa respondeu num questionário. */
export interface RespostaBruta {
  tipo: AvaliacaoTipo;
  itens: ItemResposta[];
}

export interface DimensaoCalculada {
  chave: ChaveDimensao;
  nome: string;
  time: number | null;
  exec: number | null;
  gap: number | null;
  /** Média das duas óticas — o NÍVEL da competência. */
  nivel: number | null;
  /** Faixa do nível pela régua 70/55. */
  faixa: "hi" | "mid" | "lo" | null;
  /** Severidade final: a pior entre o nível e o desalinhamento. */
  severidade: Severidade | null;
  rotulo: string | null;
}

export interface ResultadoLiderCalculado {
  dimensoes: DimensaoCalculada[];
  /** Dimensão exclusiva do questionário do executivo. */
  entregaExec: number | null;
  indiceTime: number | null;
  indiceExec: number | null;
  /** Média dos gaps com sinal: positivo = executivo enxerga melhor. */
  divergencia: number | null;
  /** Média geral do líder — é ela que alimenta a classificação de 4 faixas. */
  indiceGeral: number | null;
  respondentesTime: number;
  respondentesExec: number;
}

/** Agrupa as notas por dimensão, separando as duas óticas. */
function notasPorDimensao(respostas: RespostaBruta[]) {
  const time = new Map<string, number[]>();
  const exec = new Map<string, number[]>();

  for (const r of respostas) {
    const mapaTema = TEMA_POR_TIPO[r.tipo];
    if (!mapaTema) continue;
    const destino = r.tipo === "lideranca_time" ? time : exec;
    for (const item of r.itens) {
      const dim = mapaTema[item.theme];
      if (!dim) continue;
      if (typeof item.score !== "number" || Number.isNaN(item.score)) continue;
      const lista = destino.get(dim) ?? [];
      lista.push(item.score);
      destino.set(dim, lista);
    }
  }
  return { time, exec };
}

/** Calcula o recorte de UM líder a partir de todas as respostas dele. */
export function calculaLider(respostas: RespostaBruta[]): ResultadoLiderCalculado {
  const { time, exec } = notasPorDimensao(respostas);

  const dimensoes: DimensaoCalculada[] = DIMENSOES.map((d) => {
    const vTime = paraIndice(time.get(d.chave) ?? []);
    const vExec = paraIndice(exec.get(d.chave) ?? []);

    const presentes = [vTime, vExec].filter((v): v is number => v !== null);
    const nivel = presentes.length ? media(presentes) : null;
    const faixa = nivel === null ? null : band(nivel);

    if (vTime === null || vExec === null) {
      return {
        chave: d.chave, nome: d.nome, time: vTime, exec: vExec, gap: null, nivel, faixa,
        severidade: faixa ? (SEV_POR_FAIXA[faixa]) : null,
        rotulo: faixa ? ROTULO_BAND[faixa] : null,
      };
    }

    const g = severidadeGap(vTime, vExec);
    const sevNivel = SEV_POR_FAIXA[faixa as "hi" | "mid" | "lo"];

    // A pior das duas manda. Consenso sobre uma competência fraca continua
    // sendo fraqueza — só deixou de ser também um desalinhamento.
    const pior = PESO_SEV[sevNivel] <= PESO_SEV[g.severidade] ? sevNivel : g.severidade;
    const rotulo =
      pior === g.severidade && g.severidade !== "good"
        ? g.rotulo
        : `${ROTULO_BAND[faixa as "hi" | "mid" | "lo"]}${g.severidade === "inv" ? " · invertido" : ""}`;

    return {
      chave: d.chave, nome: d.nome, time: vTime, exec: vExec, gap: g.gap, nivel, faixa,
      severidade: pior, rotulo,
    };
  });

  const indicesTime = dimensoes.map((d) => d.time).filter((v): v is number => v !== null);
  const indicesExec = dimensoes.map((d) => d.exec).filter((v): v is number => v !== null);
  const entregaExec = paraIndice(exec.get("entrega") ?? []);
  const comAsDuas = dimensoes.filter((d) => d.time !== null && d.exec !== null);

  const todos = [...indicesTime, ...indicesExec, ...(entregaExec !== null ? [entregaExec] : [])];

  return {
    dimensoes,
    entregaExec,
    indiceTime: indicesTime.length ? media(indicesTime) : null,
    indiceExec: indicesExec.length ? media(indicesExec) : null,
    divergencia: comAsDuas.length
      ? media(comAsDuas.map((d) => (d.exec as number) - (d.time as number)))
      : null,
    indiceGeral: todos.length ? media(todos) : null,
    respondentesTime: respostas.filter((r) => r.tipo === "lideranca_time").length,
    respondentesExec: respostas.filter((r) => r.tipo === "lideranca_executivo").length,
  };
}

/* ─────────────────────────  Nível 2 — a empresa  ───────────────────────── */

export interface LiderNaEmpresa {
  nome: string;
  cargo: string | null;
  /** Índice por dimensão, na ordem de DIMENSOES. Nulo = sem dado. */
  porDimensao: (number | null)[];
  indiceGeral: number;
}

export interface ResultadoEmpresa {
  lideres: LiderNaEmpresa[];
  /** Média da empresa em cada dimensão, ordenada do pior para o melhor. */
  porDimensao: { chave: ChaveDimensao; nome: string; valor: number; band: "hi" | "mid" | "lo"; rotulo: string }[];
  indiceGeral: number;
  ranking: (LiderNaEmpresa & { posicao: number; classificacao: { chave: string; rotulo: string } })[];
  /** Dimensões abaixo da média da empresa = dívida da cultura. */
  padraoSistemico: {
    chave: ChaveDimensao;
    nome: string;
    valor: number | null;
    lideresAfetados: number;
    total: number;
  }[];
}

/**
 * Junta os líderes num retrato da empresa. Um líder entra na conta com a média
 * das duas óticas por dimensão — é o número que aparece na matriz.
 */
export function calculaEmpresa(
  entradas: { nome: string; cargo: string | null; recorte: ResultadoLiderCalculado }[],
): ResultadoEmpresa | null {
  const lideres: LiderNaEmpresa[] = entradas
    .map((e) => {
      const porDimensao = e.recorte.dimensoes.map((d) => {
        const vals = [d.time, d.exec].filter((v): v is number => v !== null);
        return vals.length ? media(vals) : null;
      });
      const validos = porDimensao.filter((v): v is number => v !== null);
      return validos.length
        ? { nome: e.nome, cargo: e.cargo, porDimensao, indiceGeral: media(validos) }
        : null;
    })
    .filter((l): l is LiderNaEmpresa => l !== null);

  if (!lideres.length) return null;

  const porDimensao = DIMENSOES.map((d, i) => {
    const vals = lideres.map((l) => l.porDimensao[i]).filter((v): v is number => v !== null);
    return vals.length ? { chave: d.chave, nome: d.nome, valor: media(vals) } : null;
  })
    .filter((x): x is { chave: ChaveDimensao; nome: string; valor: number } => x !== null)
    .map((x) => ({ ...x, band: band(x.valor), rotulo: ROTULO_BAND[band(x.valor)] }))
    .sort((a, b) => a.valor - b.valor); // pior primeiro, como no overview

  const ranking = [...lideres]
    .sort((a, b) => b.indiceGeral - a.indiceGeral)
    .map((l, i) => ({ ...l, posicao: i + 1, classificacao: classificaLider(l.indiceGeral) }));

  const indiceGeral = media(lideres.map((l) => l.indiceGeral));

  // Dívida da cultura: a dimensão que puxa a empresa para baixo, isto é, que
  // fica ABAIXO da média geral. É a régua que reproduz a leitura do Michel no
  // overview — lá, com média 64, a dívida é Comunicação (54) e Autonomia (63),
  // e Gestão (64) fica de fora, como frente preventiva.
  const padraoSistemico = DIMENSOES.map((d, i) => {
    const avaliados = lideres.filter((l) => l.porDimensao[i] !== null);
    const afetados = avaliados.filter((l) => band(l.porDimensao[i] as number) !== "hi");
    const dim = porDimensao.find((x) => x.chave === d.chave);
    return {
      chave: d.chave,
      nome: d.nome,
      valor: dim?.valor ?? null,
      lideresAfetados: afetados.length,
      total: avaliados.length,
    };
  })
    .filter((x) => x.total > 0 && x.valor !== null && x.valor < indiceGeral)
    .sort((a, b) => (a.valor as number) - (b.valor as number));

  return {
    lideres,
    porDimensao,
    indiceGeral,
    ranking,
    padraoSistemico,
  };
}
