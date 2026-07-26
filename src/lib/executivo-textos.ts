/**
 * A leitura da tela de resultado do EXECUTIVO.
 *
 * Traduz o cálculo em texto: o insight que abre a conversa, a leitura eixo a
 * eixo com o custo de cada fragilidade para a companhia, e a oferta — que aqui
 * é sempre a mesma, o Korthex Executivo, mudando apenas por onde começar.
 *
 * O texto dos eixos e a promessa do programa são os do site
 * (src/routes/korthex-executivo.tsx). Não inventar nome nem promessa.
 */

import type { ResultadoExecutivoCalculado, ChaveEixo, Severidade } from "./motor-calculo";
import type { ItemLista } from "@/components/diagnosticos/ResultadoLider";

export interface EixoNaTela {
  chave: ChaveEixo;
  nome: string;
  valor: number;
  severidade: Severidade;
  rotulo: string;
  amplitude: number | null;
  dividido: boolean;
  /** A pergunta que o site faz sobre este eixo — abre a leitura. */
  pergunta: string;
  narrativa: string;
  impactos: ItemLista[];
}

export interface ResultadoExecutivoDados {
  executivo: string;
  meta: string;
  respondentes: number;
  indiceGeral: number;
  classificacao: string;
  divergenciaInterna: number | null;
  insight: string;
  eixos: EixoNaTela[];
  forcas: ItemLista[];
  vulnerabilidades: ItemLista[];
  prioridades: { eixo: string; pergunta: string; porque: string }[];
  programa: {
    titulo: string;
    subtitulo: string;
    descricao: string;
    eixos: { nome: string; descricao: string }[];
    constroi: string[];
    rodape: string[];
  };
}

/** O conteúdo oficial de cada eixo, como está no site. */
const EIXO_SITE: Record<ChaveEixo, { pergunta: string; descricao: string }> = {
  consciencia: {
    pergunta: "O que este executivo projeta na organização sem perceber?",
    descricao:
      "Antes de impactar a organização, todo comportamento impacta quem o produz. Este eixo investiga padrões emocionais, crenças, mecanismos de proteção e experiências que influenciam silenciosamente a forma como o executivo lidera, decide, se relaciona e conduz o negócio.",
  },
  identidade: {
    pergunta:
      "Quem é o executivo quando ninguém está olhando — e o que essa identidade produz dentro da organização?",
    descricao:
      "Toda organização absorve, em alguma medida, a identidade de quem a conduz. Este eixo trabalha a consciência sobre padrões, crenças, comportamentos e posicionamentos que impactam silenciosamente a cultura, as decisões e os resultados da empresa.",
  },
  decisao: {
    pergunta:
      "A decisão nasce de convicção estratégica ou da tentativa de aliviar um desconforto momentâneo?",
    descricao:
      "Toda decisão carrega uma carga emocional. Este eixo desenvolve a capacidade de sustentar clareza, critério e responsabilidade mesmo em contextos de pressão, incerteza e conflito.",
  },
  sucessao: {
    pergunta: "A organização consegue evoluir sem depender permanentemente da presença do fundador?",
    descricao:
      "O crescimento sustentável exige que a capacidade de decidir e liderar deixe de estar concentrada em uma única pessoa. Este eixo trabalha a formação de lideranças, a construção de autonomia e a transferência gradual de autoridade.",
  },
  cultura: {
    pergunta: "Que organização está sendo construída pelas escolhas que são feitas hoje?",
    descricao:
      "Toda cultura é construída pelas decisões que se repetem ao longo do tempo. Este eixo amplia a consciência sobre o papel do executivo na formação dos comportamentos, das prioridades e da direção que sustentará os próximos ciclos de crescimento.",
  },
};

/** O que uma fragilidade em cada eixo custa à companhia — a leitura de negócio. */
const CUSTO: Record<ChaveEixo, { frouxo: ItemLista[]; firme: ItemLista[] }> = {
  consciencia: {
    frouxo: [
      { destaque: "Humor vira clima", texto: "a equipe gasta energia lendo o estado dele antes de trabalhar — e a produtividade do dia passa a depender disso.", tom: "crit" },
      { destaque: "Informação filtrada", texto: "quem convive aprende o que pode e o que não pode dizer. O que chega até ele já vem editado.", tom: "crit" },
      { destaque: "Correção lenta", texto: "erros de rota demoram a ser vistos porque o sinal que os denuncia não sobe.", tom: "crit" },
    ],
    firme: [
      { destaque: "Ambiente previsível", texto: "a equipe traz o problema cedo, quando ainda é barato resolver.", tom: "good" },
      { destaque: "Correção rápida", texto: "ele percebe o próprio efeito e ajusta antes que vire padrão.", tom: "good" },
    ],
  },
  identidade: {
    frouxo: [
      { destaque: "Cobrança sem lastro", texto: "o que ele exige não se sustenta, porque a prática dele contradiz o discurso — e a liderança repete o padrão.", tom: "crit" },
      { destaque: "Regra de dois pesos", texto: "quando a regra não vale para o topo, ela deixa de valer para todos: a disciplina da operação se dissolve.", tom: "crit" },
      { destaque: "Credibilidade gasta", texto: "o time deixa de acreditar no que é anunciado, e cada mudança passa a custar mais para emplacar.", tom: "crit" },
    ],
    firme: [
      { destaque: "Autoridade com lastro", texto: "a coerência dele é o que autoriza a cobrança — e o que a liderança copia.", tom: "good" },
      { destaque: "Padrão claro", texto: "as pessoas sabem o que vale aqui sem precisar perguntar.", tom: "good" },
    ],
  },
  decisao: {
    frouxo: [
      { destaque: "Retrabalho", texto: "decisão revertida depois de comunicada joga fora o trabalho já feito e ensina a equipe a esperar antes de executar.", tom: "crit" },
      { destaque: "Notícia ruim atrasa", texto: "quando a reação é imprevisível, o problema sobe tarde — e chega caro.", tom: "crit" },
      { destaque: "Operação em suspenso", texto: "decisão que não vem no tempo certo trava projeto, contratação e investimento ao mesmo tempo.", tom: "crit" },
    ],
    firme: [
      { destaque: "Ritmo confiável", texto: "a operação sabe quando terá resposta e planeja em cima disso.", tom: "good" },
      { destaque: "Âncora na pressão", texto: "na crise, ele é âncora e não fonte de ruído.", tom: "good" },
    ],
  },
  sucessao: {
    frouxo: [
      { destaque: "Gargalo no topo", texto: "tudo que importa espera por ele. O crescimento para no tamanho da agenda de uma pessoa.", tom: "crit" },
      { destaque: "Ninguém amadurece", texto: "quem nunca decide de verdade não desenvolve critério — e a empresa não forma o próximo nível.", tom: "crit" },
      { destaque: "Risco de continuidade", texto: "sem sucessores em formação, uma ausência longa dele vira crise operacional.", tom: "crit" },
    ],
    firme: [
      { destaque: "Empresa anda sozinha", texto: "a operação sustenta o dia a dia sem ele, e ele volta a trabalhar no negócio, não dentro dele.", tom: "good" },
      { destaque: "Banco de sucessores", texto: "existe gente sendo formada para o lugar dele, não só para o de baixo.", tom: "good" },
    ],
  },
  cultura: {
    frouxo: [
      { destaque: "Esforço disperso", texto: "sem direção clara, cada área otimiza a própria parte e o conjunto anda de lado.", tom: "crit" },
      { destaque: "Prioridade que gira", texto: "mudança sem explicação queima energia da liderança e ensina o time a não levar a sério o que foi pedido.", tom: "crit" },
      { destaque: "Cultura de fachada", texto: "quando o resultado justifica qualquer comportamento, o valor declarado vira enfeite — e a seleção natural da empresa passa a favorecer o comportamento errado.", tom: "crit" },
    ],
    firme: [
      { destaque: "Direção que orienta", texto: "a liderança decide sozinha na direção certa porque sabe para onde a empresa vai.", tom: "good" },
      { destaque: "Cultura com peso", texto: "o que é declarado se sustenta nas decisões difíceis — e por isso é levado a sério.", tom: "good" },
    ],
  },
};

function narrativa(chave: ChaveEixo, valor: number, severidade: Severidade, dividido: boolean, amplitude: number | null, n: number): string {
  const faixa = severidade === "crit" ? "frágil" : severidade === "warn" ? "em atenção" : "sólido";
  const abre = `**${valor}/100** — ${faixa} na leitura de ${n} ${n === 1 ? "líder" : "líderes"}.`;

  const leitura: Record<ChaveEixo, Record<"crit" | "warn" | "good", string>> = {
    consciencia: {
      crit: "A liderança relata que o efeito dele sobre o ambiente não é percebido por ele mesmo. É o eixo que contamina todos os outros: quem não enxerga o próprio impacto corrige tarde.",
      warn: "Ele percebe o próprio impacto em parte — e é justamente a parte que não percebe que a liderança contorna todo dia.",
      good: "Ele enxerga o efeito que produz e ajusta. É a base sobre a qual o resto do desenvolvimento se apoia.",
    },
    identidade: {
      crit: "O que ele cobra e o que ele pratica contam histórias diferentes, e a liderança percebe. Toda cobrança feita a partir daqui custa mais caro.",
      warn: "A coerência existe, mas tem exceções conhecidas — e exceção conhecida vira precedente.",
      good: "A prática confirma o discurso. É essa coerência que autoriza a cobrança e forma o padrão da casa.",
    },
    decisao: {
      crit: "Critério e tempo da decisão não estão firmes. É o eixo que a operação sente mais rápido: cada oscilação lá em cima vira retrabalho aqui embaixo.",
      warn: "Decide bem na maior parte, mas a pressão ainda muda o critério — e a liderança aprendeu a prever quando isso acontece.",
      good: "Decide no tempo certo e sustenta o que decidiu. A operação planeja em cima disso.",
    },
    sucessao: {
      crit: "A decisão continua concentrada nele. Este é o eixo que limita o tamanho da empresa, porque nenhuma operação cresce além da agenda de uma pessoa.",
      warn: "Delega, mas ainda retoma o que importa. A liderança conduz até certo ponto e devolve.",
      good: "Transfere decisão de verdade e forma gente. A empresa não depende da presença dele para andar.",
    },
    cultura: {
      crit: "A direção não chega clara à liderança, ou muda antes de ser executada. Sem rumo estável, esforço vira desperdício.",
      warn: "A direção existe e é conhecida em parte — falta constância para virar critério de decisão no dia a dia.",
      good: "A direção é clara e as decisões repetidas constroem a empresa que ele diz querer.",
    },
  };

  const base = leitura[chave][severidade === "crit" ? "crit" : severidade === "warn" ? "warn" : "good"];
  const divisao = dividido
    ? ` **Atenção ao desacordo:** as leituras variam ${amplitude} pontos entre os líderes — ele não é a mesma pessoa para todo mundo, e isso costuma indicar tratamento desigual ou acesso desigual.`
    : "";

  return `${abre} ${base}${divisao}`;
}

export function montaResultadoExecutivo(
  ctx: { executivo: string; cargo: string | null; empresa: string; periodo: string },
  calculo: ResultadoExecutivoCalculado,
  classificacao: string,
): ResultadoExecutivoDados | null {
  const comValor = calculo.eixos.filter((e) => e.valor !== null && e.severidade !== null);
  if (!comValor.length || calculo.indiceGeral === null) return null;

  const n = calculo.respondentes;
  const ordenados = [...comValor].sort((a, b) => (a.valor as number) - (b.valor as number));

  const eixos: EixoNaTela[] = ordenados.map((e) => {
    const sev = e.severidade as Severidade;
    const custo = CUSTO[e.chave];
    return {
      chave: e.chave,
      nome: e.nome,
      valor: e.valor as number,
      severidade: sev,
      rotulo: e.rotulo ?? "",
      amplitude: e.amplitude,
      dividido: e.dividido,
      pergunta: EIXO_SITE[e.chave].pergunta,
      narrativa: narrativa(e.chave, e.valor as number, sev, e.dividido, e.amplitude, n),
      impactos: sev === "good" ? custo.firme : custo.frouxo,
    };
  });

  const pior = eixos[0];
  const melhor = eixos[eixos.length - 1];

  // O desacordo mais alto de UM eixo pesa mais do que a média: uma média baixa
  // pode esconder um eixo em que a liderança está rachada ao meio.
  const maisDividido = [...eixos]
    .filter((e) => e.dividido)
    .sort((a, b) => (b.amplitude ?? 0) - (a.amplitude ?? 0))[0];

  const insight = maisDividido
    ? `**${pior.nome} (${pior.valor})** é onde a condução mais custa à operação hoje. Mas há um sinal que a média esconde: em **${maisDividido.nome}** as leituras variam **${maisDividido.amplitude} pontos** entre os líderes — parte da liderança descreve um executivo, parte descreve outro. Quando o retrato muda conforme quem responde, o tema deixa de ser competência e passa a ser **consistência**: ele não é a mesma pessoa para todo mundo.`
    : calculo.divergenciaInterna !== null && calculo.divergenciaInterna >= 20
      ? `**${pior.nome} (${pior.valor})** é o ponto mais frágil da condução — mas o dado que mais pesa é outro: os líderes divergem em média **${calculo.divergenciaInterna} pontos** entre si sobre a mesma pessoa. Quando a leitura muda tanto conforme quem responde, o problema não é só de competência: é de **consistência**.`
      : `**${pior.nome} (${pior.valor})** é onde a condução mais custa à operação hoje, e **${melhor.nome} (${melhor.valor})** é o que já sustenta. A liderança é consistente na leitura — ${n} pessoas descrevendo a mesma pessoa do mesmo jeito, o que dá peso ao retrato.`;

  const forcas: ItemLista[] = eixos
    .filter((e) => e.severidade === "good")
    .slice(-2)
    .map((e) => ({
      destaque: `${e.nome} (${e.valor})`,
      texto: "— reconhecido pela liderança como base sólida. É por onde as mudanças difíceis passam com menos atrito.",
      tom: "good" as const,
    }));

  const vulnerabilidades: ItemLista[] = eixos
    .filter((e) => e.severidade !== "good")
    .slice(0, 3)
    .map((e) => ({
      destaque: `${e.nome} (${e.valor})`,
      texto: e.dividido
        ? `— ${e.rotulo}, com ${e.amplitude} pontos de distância entre o líder que melhor e o que pior avalia.`
        : `— ${e.rotulo} na leitura de quem convive com as decisões dele todos os dias.`,
      tom: "crit" as const,
    }));

  const prioridades = eixos
    .filter((e) => e.severidade !== "good")
    .slice(0, 3)
    .map((e) => ({
      eixo: e.nome,
      pergunta: EIXO_SITE[e.chave].pergunta,
      porque: `O diagnóstico marcou ${e.valor}/100 aqui${e.dividido ? `, com leituras divididas em ${e.amplitude} pontos` : ""} — é por este eixo que o trabalho começa.`,
    }));

  return {
    executivo: ctx.executivo,
    meta: `${ctx.cargo ? `${ctx.cargo} · ` : ""}${ctx.empresa} · ${ctx.periodo}`,
    respondentes: n,
    indiceGeral: calculo.indiceGeral,
    classificacao,
    divergenciaInterna: calculo.divergenciaInterna,
    insight,
    eixos,
    forcas,
    vulnerabilidades,
    prioridades,
    programa: {
      titulo: "Korthex Executivo",
      subtitulo: "Mentoria para Fundadores e CEOs",
      descricao:
        "Um processo individual e contínuo com quem conduz a empresa. Os cinco eixos abaixo são o percurso completo do programa; o diagnóstico apenas diz por onde este executivo começa.",
      eixos: (Object.keys(EIXO_SITE) as ChaveEixo[]).map((c) => ({
        nome: EIXOS_NOME[c],
        descricao: EIXO_SITE[c].descricao,
      })),
      constroi: [
        "Mais consciência sobre os próprios impactos na organização",
        "Mais maturidade diante da pressão e da decisão difícil",
        "Capacidade de desenvolver pessoas e formar sucessores",
        "Condição de sustentar o próximo ciclo de crescimento",
      ],
      rodape: [
        "Processo individual e contínuo · presencial, online ou híbrido",
        "Reavaliação com o mesmo instrumento mostra a evolução em número",
      ],
    },
  };
}

const EIXOS_NOME: Record<ChaveEixo, string> = {
  consciencia: "Consciência & Autopercepção",
  identidade: "Identidade & Posicionamento",
  decisao: "Decisão & Gestão Emocional",
  sucessao: "Liderança & Sucessão",
  cultura: "Visão de Futuro & Cultura",
};
