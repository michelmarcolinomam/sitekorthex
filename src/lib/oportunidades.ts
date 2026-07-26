/**
 * O domínio da camada comercial: o que é uma oportunidade e como o diagnóstico
 * vira oferta.
 *
 * ★ A REGRA QUE SUSTENTA TUDO: uma oportunidade = cliente × programa ×
 * TREINAMENTO. Nunca um pacote com vários treinamentos dentro. É isso que
 * permite selecionar "todas as empresas do Korthex Liderança com problema de
 * Comunicação Assertiva & Modelação de Equipes que ainda não fecharam" e fazer
 * uma abordagem em massa. O nome do treinamento é a chave do filtro.
 *
 * ★ E O NOME DO TREINAMENTO É O DO SITE, sem prefixo, sufixo ou variação. Ele
 * vem de PROGRAMAS (src/lib/programas.ts) e de src/routes/performance.tsx.
 *
 * Este arquivo é puro: não fala com banco nem com rede. O que grava é
 * crm-server.ts.
 */

import type { PanoramaEmpresa } from "./diag-panorama";
import { DIMENSOES, type ChaveDimensao } from "./motor-calculo";
import { programaDe } from "./programas";

/* ─────────────────────────  Vocabulário  ───────────────────────── */

/** O público do programa — é ele que decide o formato da entrega. */
export type ProgramaChave = "executivo" | "lideranca" | "performance";

export type FormatoOferta = "treinamento" | "mentoria";

export type EstagioFunil = "nova" | "apresentacao" | "proposta" | "ganha" | "perdida";

/**
 * Quanto o diagnóstico sustenta a oferta. `hipotese` existe para não vender
 * como medido o que não foi medido — o diagnóstico de hoje lê a liderança pela
 * ótica do time, não avalia o time.
 */
export type ForcaEvidencia = "forte" | "atencao" | "hipotese";

export const PUBLICOS: Record<ProgramaChave, { nome: string; quem: string; formato: FormatoOferta }> = {
  executivo: {
    nome: "Korthex Executivo",
    quem: "fundadores, sócios, CEOs e diretoria",
    formato: "mentoria",
  },
  lideranca: {
    nome: "Korthex Liderança",
    quem: "coordenadores, supervisores e gerentes",
    formato: "treinamento",
  },
  performance: {
    nome: "Korthex Performance",
    quem: "equipes",
    formato: "treinamento",
  },
};

/**
 * Ganha e Perdida são estágios SEPARADOS de propósito: perder pede leitura
 * diferente de ganhar. "Abertas" nunca traz encerrada.
 */
export const ESTAGIOS: { chave: EstagioFunil; rotulo: string; aberto: boolean }[] = [
  { chave: "nova", rotulo: "Nova", aberto: true },
  { chave: "apresentacao", rotulo: "Apresentação enviada", aberto: true },
  { chave: "proposta", rotulo: "Proposta enviada", aberto: true },
  { chave: "ganha", rotulo: "Ganha", aberto: false },
  { chave: "perdida", rotulo: "Perdida", aberto: false },
];

export const ESTAGIOS_ABERTOS: EstagioFunil[] = ESTAGIOS.filter((e) => e.aberto).map((e) => e.chave);

export const ROTULO_ESTAGIO: Record<EstagioFunil, string> = Object.fromEntries(
  ESTAGIOS.map((e) => [e.chave, e.rotulo]),
) as Record<EstagioFunil, string>;

export const ROTULO_FORCA: Record<ForcaEvidencia, string> = {
  forte: "evidência forte",
  atencao: "ponto de atenção",
  hipotese: "hipótese",
};

/**
 * O nome da mentoria em cada público — também o do site, sem invenção:
 * "Mentoria & Acompanhamento" é como src/routes/lideranca.tsx chama, e
 * "Mentoria para Fundadores e CEOs" é como o Korthex Executivo se apresenta.
 */
export const NOME_MENTORIA: Record<ProgramaChave, string> = {
  lideranca: "Mentoria & Acompanhamento",
  executivo: "Mentoria para Fundadores e CEOs",
  performance: "Mentoria & Acompanhamento",
};

/** Os 5 eixos do Korthex Executivo, como estão em src/routes/korthex-executivo.tsx. */
export const EIXOS_EXECUTIVO = [
  "Consciência & Autopercepção",
  "Identidade & Posicionamento",
  "Decisão & Gestão Emocional",
  "Liderança & Sucessão",
  "Visão de Futuro & Cultura",
] as const;

/**
 * Os treinamentos do Korthex Performance, com o título do site
 * (src/routes/performance.tsx). O sexto — "Projeto de Vida & Produtividade" —
 * não tem dimensão correspondente no diagnóstico da liderança e por isso não
 * aparece aqui: seria inventar evidência.
 */
export const TREINAMENTO_PERFORMANCE: Record<ChaveDimensao, string> = {
  emocoes: "Gestão das Emoções & Autopercepção",
  comunicacao: "Comunicação & Relacionamentos Produtivos",
  autonomia: "Autorresponsabilidade & Protagonismo",
  identidade: "Identidade Profissional & Posicionamento",
  conflito: "Colaboração & Trabalho em Equipe",
};

/* ─────────────────────────  A linha do banco  ───────────────────────── */

/**
 * O snapshot da evidência, congelado no momento em que a oferta foi montada.
 * O diagnóstico continua recebendo respostas; a oportunidade precisa guardar o
 * número que justificou a abordagem, não o número de hoje.
 */
export interface EvidenciaOportunidade {
  /** De onde veio a leitura: o mapa da empresa ou o recorte de um líder. */
  nivel: "empresa" | "lider";
  indiceGeral: number | null;
  dimensoes: { chave: ChaveDimensao; nome: string; valor: number; faixa: "hi" | "mid" | "lo" }[];
  lideresAfetados?: number;
  totalLideres?: number;
  lider?: { nome: string; indice: number; classificacao: string };
  /** Quando o diagnóstico foi lido — não confundir com a data da oportunidade. */
  lidoEm?: string;
}

export interface Oportunidade {
  id: string;
  cliente_id: string;
  programa: ProgramaChave;
  formato: FormatoOferta;
  /** Título idêntico ao do site. Nulo quando o formato é mentoria. */
  treinamento: string | null;
  lider_id: string | null;
  origem: "diagnostico" | "manual";
  forca_evidencia: ForcaEvidencia;
  dimensoes: ChaveDimensao[];
  evidencia_resumo: string | null;
  evidencia: EvidenciaOportunidade | null;
  estagio: EstagioFunil;
  estagio_em: string;
  apresentacao_em: string | null;
  proposta_em: string | null;
  fechada_em: string | null;
  motivo_perda: string | null;
  valor: number | null;
  lote: string | null;
  criado_por: string | null;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
}

export type TipoInteracao =
  | "nota"
  | "email"
  | "whatsapp"
  | "ligacao"
  | "reuniao"
  | "apresentacao"
  | "proposta"
  | "estagio"
  | "sistema";

export interface Interacao {
  id: string;
  cliente_id: string;
  oportunidade_id: string | null;
  tipo: TipoInteracao;
  conteudo: string | null;
  autor: string | null;
  meta: Record<string, string | number | boolean | null> | null;
  /** Conversa com gente. Mudança de estágio não é contato. */
  contato: boolean;
  created_at: string;
}

/**
 * A identidade de uma oferta, para não duplicar o que já existe aberto.
 * É a mesma regra dos índices únicos do banco.
 */
export function chaveDaOferta(o: {
  programa: ProgramaChave;
  formato: FormatoOferta;
  treinamento?: string | null;
  lider_id?: string | null;
}): string {
  return o.formato === "treinamento"
    ? `${o.programa}|treinamento|${o.treinamento ?? ""}`
    : `${o.programa}|mentoria|${o.lider_id ?? ""}`;
}

/* ─────────────────────  Do diagnóstico para a oferta  ───────────────────── */

/**
 * Uma linha da tela "Montar oferta": o que o sistema propõe e por quê. O
 * vendedor cura — nada vira oportunidade sem ele mandar.
 */
export interface SugestaoOferta {
  programa: ProgramaChave;
  formato: FormatoOferta;
  treinamento: string | null;
  lider_id: string | null;
  lider_nome: string | null;
  /** O nome do produto como aparece na tela — sempre o do site. */
  nome: string;
  dimensoes: ChaveDimensao[];
  forca: ForcaEvidencia;
  /** O rótulo da camada da oferta: prioritária, preventiva, complementar. */
  rotulo: string;
  /** A frase que justifica, em linguagem de venda. */
  resumo: string;
  evidencia: EvidenciaOportunidade;
  /**
   * Vem marcada? Só o que o diagnóstico realmente mediu. Hipótese nunca vem
   * pré-marcada — cabe ao vendedor assumir o risco de propor.
   */
  preSelecionada: boolean;
  /** Já existe uma oportunidade aberta igual — a tela mostra e não deixa duplicar. */
  jaExiste?: boolean;
}

function nomeDim(chave: ChaveDimensao): string {
  return DIMENSOES.find((d) => d.chave === chave)?.nome ?? chave;
}

/**
 * Traduz o panorama da empresa nas ofertas que ele sustenta.
 *
 * Segue a OFERTA EM CAMADAS do Michel, a mesma que a empresa vê no mapa:
 *   1. o que está FRÁGIL vira frente prioritária (corrigir);
 *   2. o que está em ATENÇÃO vira frente preventiva (agir antes de quebrar);
 *   3. quem está na faixa de mentoria vira frente complementar, por líder.
 *
 * Duas dimensões que caem no mesmo treinamento viram UMA oferta citando as
 * duas — nunca dois cards com o mesmo título.
 */
export function sugereOfertas(
  panorama: PanoramaEmpresa,
  idPorLider: Record<string, string> = {},
): SugestaoOferta[] {
  const emp = panorama.resultado;
  if (!emp) return [];

  const lidoEm = new Date().toISOString();
  const totalLideres = emp.lideres.length;
  const sugestoes: SugestaoOferta[] = [];

  /* ── 1 e 2. Treinamento em grupo, por dimensão fora da faixa forte ── */

  // porDimensao já vem ordenada do pior para o melhor.
  const foraDoForte = emp.porDimensao.filter((d) => d.band !== "hi");
  const prioritaria = foraDoForte.find((d) => d.band === "lo") ?? null;

  const porTreinamento = new Map<string, typeof foraDoForte>();
  for (const d of foraDoForte) {
    const titulo = programaDe(d.chave).titulo;
    porTreinamento.set(titulo, [...(porTreinamento.get(titulo) ?? []), d]);
  }

  for (const [treinamento, alvos] of porTreinamento) {
    const ehPrioritaria = prioritaria !== null && alvos.some((a) => a.chave === prioritaria.chave);
    const principal = alvos[0];
    const afetados = emp.padraoSistemico.find((p) => p.chave === principal.chave);
    const lista = alvos.map((a) => `${a.nome} (${a.valor})`).join(" e ");

    sugestoes.push({
      programa: "lideranca",
      formato: "treinamento",
      treinamento,
      lider_id: null,
      lider_nome: null,
      nome: treinamento,
      dimensoes: alvos.map((a) => a.chave),
      forca: alvos.some((a) => a.band === "lo") ? "forte" : "atencao",
      rotulo: ehPrioritaria
        ? "Frente prioritária · corrigir o que está frágil"
        : "Frente preventiva · fortalecer antes de quebrar",
      resumo:
        `${lista}${
          afetados && totalLideres >= 3
            ? ` · fora da faixa forte em ${afetados.lideresAfetados} de ${afetados.total} líderes`
            : ""
        }${totalLideres >= 3 && ehPrioritaria ? " · é cultura, não pessoa" : ""}`,
      evidencia: {
        nivel: "empresa",
        indiceGeral: emp.indiceGeral,
        dimensoes: alvos.map((a) => ({ chave: a.chave, nome: a.nome, valor: a.valor, faixa: a.band })),
        lideresAfetados: afetados?.lideresAfetados,
        totalLideres,
        lidoEm,
      },
      preSelecionada: true,
    });
  }

  /* ── 3. Mentoria individual, por líder na faixa que pede acompanhamento ── */

  for (const l of emp.ranking) {
    if (l.classificacao.chave !== "ment" && l.classificacao.chave !== "emerg") continue;
    const piores = l.porDimensao
      .flatMap((valor, i) =>
        valor === null
          ? []
          : [{ valor, chave: DIMENSOES[i].chave as ChaveDimensao, nome: DIMENSOES[i].nome as string }],
      )
      .sort((a, b) => a.valor - b.valor)
      .slice(0, 2);

    sugestoes.push({
      programa: "lideranca",
      formato: "mentoria",
      treinamento: null,
      lider_id: idPorLider[l.nome] ?? null,
      lider_nome: l.nome,
      nome: `${NOME_MENTORIA.lideranca} · ${l.nome}`,
      dimensoes: piores.map((p) => p.chave),
      forca: l.classificacao.chave === "emerg" ? "forte" : "atencao",
      rotulo: "Frente complementar · acompanhamento individual",
      resumo: `${l.nome} (${l.indiceGeral}) · ${l.classificacao.rotulo}${
        piores.length ? ` · mais frágil em ${piores.map((p) => `${p.nome} (${p.valor})`).join(" e ")}` : ""
      }`,
      evidencia: {
        nivel: "lider",
        indiceGeral: l.indiceGeral,
        dimensoes: piores.map((p) => ({
          chave: p.chave,
          nome: p.nome,
          valor: p.valor,
          faixa: p.valor >= 70 ? "hi" : p.valor >= 55 ? "mid" : "lo",
        })),
        totalLideres,
        lider: { nome: l.nome, indice: l.indiceGeral, classificacao: l.classificacao.rotulo },
        lidoEm,
      },
      preSelecionada: true,
    });
  }

  /* ── Korthex Executivo: dois sinais sobre o TOPO ──
     O diagnóstico não avalia o executivo. O que ele deixa ver sobre o topo é
     (a) a DISTÂNCIA entre o que os sócios enxergam e o que a equipe sente e
     (b) a AUTONOMIA represada — delegação que não desce costuma ser decisão de
     quem está em cima, não incapacidade de quem está embaixo. Os dois valem
     como conversa; nenhum é medição. Por isso, hipótese e sem pré-marcação. */
  const autonomia = emp.porDimensao.find((d) => d.chave === "autonomia") ?? null;
  const topoDistante = panorama.divergencia !== null && panorama.divergencia >= 10;
  const autonomiaRepresada = autonomia !== null && autonomia.band !== "hi";

  if (topoDistante || autonomiaRepresada) {
    sugestoes.push({
      programa: "executivo",
      formato: "mentoria",
      treinamento: null,
      lider_id: null,
      lider_nome: null,
      nome: NOME_MENTORIA.executivo,
      dimensoes: autonomia && autonomia.band !== "hi" ? ["autonomia"] : [],
      forca: "hipotese",
      rotulo: "Hipótese · leitura do topo",
      resumo: [
        topoDistante
          ? `Os sócios avaliam a liderança ${panorama.divergencia} pontos acima do que as equipes sentem — a distância está no topo.`
          : null,
        autonomiaRepresada
          ? `${autonomia!.nome} em ${autonomia!.valor}: delegação que não desce costuma ser decisão de quem está em cima. Eixos ${EIXOS_EXECUTIVO[3]} e ${EIXOS_EXECUTIVO[2]}.`
          : null,
        "Nada disso foi medido no executivo — é conversa, não diagnóstico.",
      ]
        .filter(Boolean)
        .join(" "),
      evidencia: {
        nivel: "empresa",
        indiceGeral: emp.indiceGeral,
        dimensoes: autonomiaRepresada
          ? [{ chave: "autonomia" as ChaveDimensao, nome: autonomia!.nome, valor: autonomia!.valor, faixa: autonomia!.band }]
          : [],
        totalLideres,
        lidoEm,
      },
      preSelecionada: false,
    });
  }

  /* ── Korthex Performance: sempre hipótese ──
     Cuidado honesto: este diagnóstico mede a liderança pela ótica do time — ele
     NÃO avalia o time. Evidência de verdade só com o diagnóstico de performance
     (#4). Por isso vem descrito como hipótese e nunca pré-marcado. */
  const piorDaEmpresa = emp.porDimensao[0];
  if (piorDaEmpresa && piorDaEmpresa.band !== "hi") {
    sugestoes.push({
      programa: "performance",
      formato: "treinamento",
      treinamento: TREINAMENTO_PERFORMANCE[piorDaEmpresa.chave],
      lider_id: null,
      lider_nome: null,
      nome: TREINAMENTO_PERFORMANCE[piorDaEmpresa.chave],
      dimensoes: [piorDaEmpresa.chave],
      forca: "hipotese",
      rotulo: "Hipótese · não medida neste diagnóstico",
      resumo: `${piorDaEmpresa.nome} (${piorDaEmpresa.valor}) é o ponto mais frágil da liderança. Se o mesmo tema também trava a equipe, é o treinamento correspondente — mas isto aqui não foi medido: o diagnóstico lê a liderança, não o time.`,
      evidencia: {
        nivel: "empresa",
        indiceGeral: emp.indiceGeral,
        dimensoes: [
          {
            chave: piorDaEmpresa.chave,
            nome: piorDaEmpresa.nome,
            valor: piorDaEmpresa.valor,
            faixa: piorDaEmpresa.band,
          },
        ],
        totalLideres,
        lidoEm,
      },
      preSelecionada: false,
    });
  }

  return sugestoes;
}

/** Nome de exibição de uma oportunidade — o que aparece na linha do funil. */
export function tituloOportunidade(o: {
  programa: ProgramaChave;
  formato: FormatoOferta;
  treinamento: string | null;
  lider_nome?: string | null;
}): string {
  if (o.formato === "treinamento") return o.treinamento ?? "—";
  const nome = NOME_MENTORIA[o.programa];
  return o.lider_nome ? `${nome} · ${o.lider_nome}` : nome;
}

/**
 * A frase de abertura de cada público na tela "Montar oferta": o que o
 * diagnóstico mostrou que justifica falar daquele público. Nulo = não há sinal,
 * e a tela não inventa um.
 */
export function sinaisPorPublico(panorama: PanoramaEmpresa): Record<ProgramaChave, string | null> {
  const emp = panorama.resultado;
  if (!emp) return { executivo: null, lideranca: null, performance: null };

  const autonomia = emp.porDimensao.find((d) => d.chave === "autonomia") ?? null;
  const frageis = emp.porDimensao.filter((d) => d.band === "lo");
  const atencao = emp.porDimensao.filter((d) => d.band === "mid");
  const pedemMentoria = emp.ranking.filter(
    (l) => l.classificacao.chave === "ment" || l.classificacao.chave === "emerg",
  );

  const executivo = (() => {
    const partes: string[] = [];
    if (panorama.divergencia !== null && panorama.divergencia >= 10) {
      partes.push(
        `os sócios avaliam a liderança ${panorama.divergencia} pontos acima do que as equipes sentem`,
      );
    }
    if (autonomia && autonomia.band !== "hi") {
      partes.push(`a autonomia da liderança está em ${autonomia.valor}`);
    }
    if (!partes.length) return null;
    return `${partes.join(" e ")}. Delegação represada e distância de percepção são temas de quem está em cima — mentoria do executivo, não treinamento da liderança.`;
  })();

  const lideranca = (() => {
    const partes: string[] = [];
    if (frageis.length) {
      partes.push(
        `${frageis.map((d) => `${d.nome} (${d.valor})`).join(" e ")} ${frageis.length === 1 ? "está frágil" : "estão frágeis"} e ${frageis.length === 1 ? "tem" : "têm"} treinamento correspondente`,
      );
    }
    if (atencao.length) {
      partes.push(
        `${atencao.map((d) => d.nome).join(", ")} ${atencao.length === 1 ? "está" : "estão"} em zona de atenção — treinar antes de quebrar custa uma fração de recuperar depois`,
      );
    }
    if (pedemMentoria.length) {
      partes.push(
        `${pedemMentoria.map((l) => `${l.nome} (${l.indiceGeral})`).join(" e ")} ${pedemMentoria.length === 1 ? "cai" : "caem"} na faixa de mentoria individual pela régua`,
      );
    }
    return partes.length ? `${partes.join(". ")}.` : null;
  })();

  return { executivo, lideranca, performance: null };
}

/** O aviso que sempre acompanha o Korthex Performance. Não é opcional. */
export const AVISO_PERFORMANCE =
  "Este diagnóstico mede a liderança pela ótica do time — ele não avalia o time. As indicações abaixo são hipóteses a partir do que a equipe relatou sobre o líder, não medição direta. Para evidência real, o caminho é aplicar o diagnóstico de Performance.";

export { nomeDim as nomeDaDimensao };
