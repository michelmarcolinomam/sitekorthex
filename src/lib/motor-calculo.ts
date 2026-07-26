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

/* ─────────────────────  O EXECUTIVO — outro conjunto  ─────────────────────

   O executivo não é lido pelas mesmas cinco dimensões da liderança: ele é lido
   pelos CINCO EIXOS do Korthex Executivo, com os nomes do site
   (src/routes/korthex-executivo.tsx). E é lido por uma ótica só — a liderança
   abaixo dele. Onde no líder existe o gap entre duas óticas, aqui existe outra
   coisa igualmente reveladora: o quanto os líderes DIVERGEM entre si sobre a
   mesma pessoa. Quando um vê 80 e outro vê 40, ele é um executivo diferente
   dependendo de quem entra na sala. */

export const EIXOS_EXECUTIVO = [
  { chave: "consciencia", nome: "Consciência & Autopercepção", curto: "Consciência" },
  { chave: "identidade", nome: "Identidade & Posicionamento", curto: "Identidade" },
  { chave: "decisao", nome: "Decisão & Gestão Emocional", curto: "Decisão" },
  { chave: "sucessao", nome: "Liderança & Sucessão", curto: "Sucessão" },
  { chave: "cultura", nome: "Visão de Futuro & Cultura", curto: "Cultura" },
] as const;

export type ChaveEixo = (typeof EIXOS_EXECUTIVO)[number]["chave"];

/**
 * Abaixo deste número de respondentes o resultado NÃO deve ser mostrado: com
 * uma ou duas respostas, o executivo descobre quem falou o quê e o instrumento
 * morre na primeira aplicação. O anonimato é o que sustenta a honestidade.
 */
export const MINIMO_RESPONDENTES_EXEC = 3;

/** A partir daqui as leituras dos líderes estão divididas demais para ignorar. */
const AMPLITUDE_DIVIDIDA = 25;

export interface EixoCalculado {
  chave: ChaveEixo;
  nome: string;
  curto: string;
  valor: number | null;
  faixa: "hi" | "mid" | "lo" | null;
  severidade: Severidade | null;
  rotulo: string | null;
  /** Distância entre o líder que melhor e o que pior avaliou este eixo. */
  amplitude: number | null;
  /** As leituras estão divididas — o eixo merece conversa mesmo se a média salva. */
  dividido: boolean;
}

export interface ResultadoExecutivoCalculado {
  eixos: EixoCalculado[];
  indiceGeral: number | null;
  respondentes: number;
  /** Média das amplitudes: o quanto os líderes discordam entre si, no geral. */
  divergenciaInterna: number | null;
  /** Falso quando ainda não há respostas suficientes para mostrar sem expor ninguém. */
  liberado: boolean;
}

/** Régua do executivo — mesma escala de 4 faixas, leitura própria. */
export function classificaExecutivo(indice: number): { chave: string; rotulo: string } {
  if (indice >= 80) return { chave: "ref", rotulo: "Referência para a liderança" };
  if (indice >= 66) return { chave: "ok", rotulo: "Condução sólida" };
  if (indice >= 55) return { chave: "ment", rotulo: "Mentoria executiva indicada" };
  return { chave: "emerg", rotulo: "Mentoria executiva prioritária" };
}

/**
 * Calcula o recorte de UM executivo a partir das respostas dos líderes dele.
 * Cada respondente vira um índice por eixo; o eixo é a média entre eles, e a
 * amplitude guarda o desacordo.
 */
export function calculaExecutivo(respostas: RespostaBruta[]): ResultadoExecutivoCalculado {
  const validas = respostas.filter((r) => r.tipo === "executivo_lideranca");

  // Um índice por eixo POR RESPONDENTE — é isso que permite ver o desacordo.
  const porEixo = new Map<string, number[]>();
  for (const r of validas) {
    const notas = new Map<string, number[]>();
    for (const item of r.itens) {
      if (typeof item.score !== "number" || Number.isNaN(item.score)) continue;
      const lista = notas.get(item.theme) ?? [];
      lista.push(item.score);
      notas.set(item.theme, lista);
    }
    for (const [tema, valores] of notas) {
      const indice = paraIndice(valores);
      if (indice === null) continue;
      porEixo.set(tema, [...(porEixo.get(tema) ?? []), indice]);
    }
  }

  const eixos: EixoCalculado[] = EIXOS_EXECUTIVO.map((e) => {
    const leituras = porEixo.get(e.chave) ?? [];
    if (!leituras.length) {
      return { chave: e.chave, nome: e.nome, curto: e.curto, valor: null, faixa: null, severidade: null, rotulo: null, amplitude: null, dividido: false };
    }

    const valor = media(leituras);
    const faixa = band(valor);
    const amplitude = leituras.length > 1 ? Math.max(...leituras) - Math.min(...leituras) : null;
    const dividido = amplitude !== null && amplitude >= AMPLITUDE_DIVIDIDA;

    // Mesma regra da tela do líder: vale a PIOR das duas leituras. Média boa
    // com líderes divididos não é força — é sinal de que ele é uma pessoa
    // diferente dependendo de quem pergunta.
    const sevNivel = SEV_POR_FAIXA[faixa];
    const severidade: Severidade = dividido && sevNivel === "good" ? "warn" : sevNivel;
    const rotulo = dividido ? `leituras divididas · ${ROTULO_BAND[faixa]}` : ROTULO_BAND[faixa];

    return { chave: e.chave, nome: e.nome, curto: e.curto, valor, faixa, severidade, rotulo, amplitude, dividido };
  });

  const comValor = eixos.filter((e) => e.valor !== null).map((e) => e.valor as number);
  const amplitudes = eixos.map((e) => e.amplitude).filter((v): v is number => v !== null);

  return {
    eixos,
    indiceGeral: comValor.length ? media(comValor) : null,
    respondentes: validas.length,
    divergenciaInterna: amplitudes.length ? media(amplitudes) : null,
    liberado: validas.length >= MINIMO_RESPONDENTES_EXEC,
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
