/**
 * Camada de texto do resultado.
 *
 * Os textos são do Michel, do protótipo aprovado. Aqui eles só deixaram de ser
 * fixos: onde havia um número escrito à mão ({time}, {exec}, {gap}) agora entra
 * o número calculado, para a mesma redação servir qualquer líder.
 *
 * As frases de impacto vieram inteiras, sem uma vírgula mudada — elas já eram
 * genéricas por dimensão.
 */

import { band, ROTULO_BAND } from "./motor-calculo";
import type { ChaveDimensao, ResultadoLiderCalculado, Severidade } from "./motor-calculo";
import type { ItemLista, LeituraDimensao, ResultadoLiderDados, Treinamento } from "@/components/diagnosticos/ResultadoLider";

function preenche(modelo: string, v: { time: number; exec: number; gap: number }): string {
  return modelo
    .replace(/\{time\}/g, String(v.time))
    .replace(/\{exec\}/g, String(v.exec))
    .replace(/\{gap\}/g, String(v.gap));
}

/** Abertura de cada dimensão. Uma variação por severidade quando o Michel escreveu mais de uma. */
const NARRATIVAS: Record<ChaveDimensao, Partial<Record<Severidade, string>> & { padrao: string }> = {
  comunicacao: {
    padrao:
      "Os sócios avaliam a comunicação em {exec} e o time recebe em {time} — {gap} pontos de distância. A estratégia é formulada no topo, mas **se perde antes de chegar à execução**. O feedback, quando existe, não chega de forma que desenvolva quem o recebe.",
    crit:
      "A **maior fratura do diagnóstico**. Os sócios acreditam que a liderança comunica bem ({exec}), mas a base recebe em {time} — um abismo de {gap} pontos. A estratégia é formulada no topo, mas **se perde antes de chegar à execução**. O feedback, quando existe, não chega de forma que desenvolva quem o recebe.",
    good:
      "As duas óticas se encontram ({time} / {exec}): a mensagem que sai do topo é a que chega na base. **Comunicação deixou de ser gargalo** e passa a ser alavanca para o resto.",
  },
  conflito: {
    padrao:
      "A liderança conduz a operação, mas conflitos e disputas de prioridade ainda geram atrito — e a equipe sente isso mais ({time}) do que os sócios percebem ({exec}).",
    warn:
      "Zona intermediária com **sinal de alerta**. A liderança conduz a operação, mas conflitos e disputas de prioridade ainda geram atrito — e a equipe sente isso mais ({time}) do que os sócios percebem ({exec}).",
    good:
      "Conflito conduzido com maturidade, e as duas óticas concordam ({time} / {exec}). **O atrito vira decisão** em vez de desgaste.",
  },
  emocoes: {
    padrao:
      "Sólida aos olhos do topo ({exec}), mais **oscilante na base** ({time}). Os sócios confiam na serenidade da liderança; o time convive com variações de humor no dia a dia que os sócios não enxergam.",
    good:
      "Estabilidade reconhecida pelas duas óticas ({time} / {exec}). A equipe sabe o que esperar, e **previsibilidade é o que sustenta segurança psicológica**.",
  },
  autonomia: {
    padrao:
      "O time percebe a liderança em {time} e o executivo em {exec}. A distância de {gap} pontos mostra desalinhamento sobre **o quanto essa liderança pode decidir sozinha**.",
    inv:
      "Inversão rara e reveladora. O time percebe a liderança mais autônoma ({time}) do que os próprios sócios ({exec}). Não é falta de capacidade — é o **executivo ainda segurando a delegação** que gostaria de dar.",
    good:
      "Autonomia com consenso ({time} / {exec}): a liderança decide e o topo confia. **É o que libera o executivo da operação.**",
  },
  identidade: {
    padrao:
      "Confiança avaliada em {time} pelo time e {exec} pelo executivo. É o terreno sobre o qual todas as outras dimensões se apoiam — e ele pede atenção.",
    good:
      "A **força consolidada** — e o ponto de consenso pleno. As duas óticas concordam ({time} / {exec}): a liderança inspira confiança e age com integridade. É o alicerce sobre o qual todo o resto pode ser construído.",
  },
};

/** Frases de impacto — vieram inteiras do protótipo, sem número dentro. */
const IMPACTOS: Record<ChaveDimensao, { titulo: string; itens: ItemLista[] }> = {
  comunicacao: {
    titulo: "Impacto na companhia",
    itens: [
      { destaque: "Retrabalho e erros de execução", texto: "— a equipe entrega o que entendeu, não o que foi pedido. Custo direto em horas e prazos.", tom: "crit" },
      { destaque: "Prioridades distorcidas", texto: "— decisões chegam sem contexto; energia gasta na coisa errada.", tom: "crit" },
      { destaque: "Desengajamento e turnover", texto: "— talentos que não recebem retorno claro sobre o próprio trabalho tendem a se desligar.", tom: "crit" },
      { destaque: "Ilusão de alinhamento no topo", texto: "— o executivo opera achando que comunicou; a ordem não chegou. É o risco mais perigoso, porque é invisível para quem decide.", tom: "crit" },
    ],
  },
  conflito: {
    titulo: "Impacto na companhia",
    itens: [
      { destaque: "Atrito que drena o clima", texto: "— conflitos mal resolvidos consomem tempo e energia que deveriam ir para a entrega.", tom: "crit" },
      { destaque: "Prazos e recursos escorregam", texto: "— prioridades mal geridas geram desperdício silencioso.", tom: "crit" },
      { destaque: "Custo invisível ao topo", texto: "— não aparece no relatório dos sócios, mas corrói a produtividade do dia a dia.", tom: "crit" },
    ],
  },
  emocoes: {
    titulo: "Impacto na companhia",
    itens: [
      { destaque: "Clima instável", texto: "— o humor da liderança define o dia da equipe; previsibilidade baixa mina a segurança psicológica.", tom: "crit" },
      { destaque: "Reatividade sob pressão", texto: "— em crise real, a base pode não encontrar a âncora que os sócios presumem existir.", tom: "crit" },
      { destaque: "Desgaste acumulado", texto: "— equipes que caminham sobre ovos rendem menos e adoecem mais.", tom: "crit" },
    ],
  },
  autonomia: {
    titulo: "Impacto na companhia",
    itens: [
      { destaque: "Gargalo no fundador", texto: "— a dependência do topo limita o quanto a liderança pode assumir; o crescimento trava na cadeira do dono.", tom: "crit" },
      { destaque: "Sucessão represada", texto: "— sem espaço para decidir, a liderança não forma os próprios sucessores.", tom: "crit" },
      { destaque: "Executivo preso na operação", texto: "— energia que deveria ir para a estratégia fica retida no acompanhamento do dia a dia.", tom: "crit" },
    ],
  },
  identidade: {
    titulo: "O que essa força sustenta",
    itens: [
      { destaque: "Capital raro", texto: "— confiança consolidada é a base que permite desenvolver as demais dimensões com segurança e rapidez.", tom: "good" },
      { destaque: "Lealdade do time", texto: "— pessoas seguem quem confiam, mesmo em momentos difíceis; reduz risco de fuga de talentos.", tom: "good" },
      { destaque: "Atenção", texto: "— se houver fratura em outra dimensão, essa confiança tende a se corroer com o tempo. É uma força a proteger, não a assumir como garantida.", tom: "crit" },
    ],
  },
};

/**
 * Treinamento indicado por dimensão. Só existem os dois que o Michel escreveu;
 * as demais dimensões ficam sem card até a copy ser escrita por ele.
 */
const TREINAMENTOS: Partial<Record<ChaveDimensao, Omit<Treinamento, "ordem" | "severidade" | "rotulo" | "marcaPorque" | "porque"> & { porqueModelo: string }>> = {
  comunicacao: {
    titulo: "Comunicação Assertiva & Modelação de Equipes",
    subtitulo: "Treinamento · Korthex Liderança",
    descricao:
      "Desenvolvimento da **clareza na comunicação**, da qualidade dos feedbacks e da capacidade de influenciar comportamentos através do exemplo — fechando a distância entre o que a liderança pretende dizer e o que a equipe de fato recebe.",
    entregas: [
      "Equipes mais alinhadas",
      "Redução de ruídos de comunicação",
      "Feedbacks mais eficazes",
      "Fortalecimento da influência da liderança",
    ],
    porqueModelo:
      "Indicado porque o gap de {gap} pontos mostra que a mensagem **se perde entre o topo e a base** — exatamente o que este treinamento corrige.",
  },
  conflito: {
    titulo: "Gestão de Conflitos & Recursos",
    subtitulo: "Treinamento · Korthex Liderança",
    descricao:
      "Formação da capacidade de **lidar com divergências, tensões, interesses e recursos** de forma produtiva, fortalecendo relações e resultados — transformando o atrito que hoje drena a equipe em decisão e alinhamento.",
    entregas: [
      "Redução de conflitos improdutivos",
      "Melhoria no clima organizacional",
      "Tomada de decisão mais equilibrada",
      "Maior capacidade de negociação",
    ],
    porqueModelo:
      "Indicado porque o atrito ainda percebido pela equipe ({time}) **drena clima e produtividade** no dia a dia.",
  },
};

const CAMINHO = {
  rotulo: "O caminho completo · recomendado para {nome}",
  titulo: "Korthex Liderança · Acompanhamento Individual",
  subtitulo: "Mentoria contínua",
  descricao:
    "Mais do que treinamentos pontuais, um **processo contínuo de desenvolvimento** desenhado sobre as vulnerabilidades específicas de {nome}. Cada desafio é trabalhado dentro do próprio contexto em que aparece — no ritmo e na realidade dela, preservando as forças já consolidadas.",
  eixos: [
    "Gestão das Emoções & Autorresponsabilidade",
    "Gestão de Conflitos & Recursos",
    "Comunicação Assertiva & Modelação de Equipes",
    "Identidade & Brand Persona",
  ],
  constroi: [
    "Liderança emocionalmente mais madura",
    "Comunicação mais clara e produtiva",
    "Maior capacidade de delegação",
    "Equipe mais alinhada e autônoma",
    "Formação de novos líderes e sucessores",
  ],
  rodape: [
    "**Processo contínuo** — presencial, online ou híbrido, ajustado ao ritmo da liderança.",
    "**Reavaliação em 6 meses** — o mesmo diagnóstico, aplicado de novo, prova a evolução com número.",
  ],
};

/** Monta a tela a partir dos números calculados. */
export function montaResultado(
  info: { lider: string; cargo: string | null; empresa: string; periodo: string },
  calc: ResultadoLiderCalculado,
): ResultadoLiderDados {
  // Uma dimensão entra se pelo menos UMA das óticas respondeu. Com as duas,
  // vale o gap; com uma só, vale a régua de severidade da própria nota.
  const completas = calc.dimensoes
    .filter((d) => d.time !== null || d.exec !== null)
    .map((d) => {
      if (d.severidade && d.rotulo && d.gap !== null) {
        return d as typeof d & { severidade: Severidade; rotulo: string };
      }
      const unico = (d.time ?? d.exec) as number;
      const faixa = band(unico);
      return {
        ...d,
        gap: null,
        severidade: (faixa === "hi" ? "good" : faixa === "mid" ? "warn" : "crit") as Severidade,
        rotulo: ROTULO_BAND[faixa],
      };
    });

  // Pior primeiro: é a ordem que conduz a conversa.
  const ordenadas = [...completas].sort((a, b) => {
    const peso = { crit: 0, warn: 1, inv: 2, good: 3 } as const;
    return peso[a.severidade] - peso[b.severidade] || (b.gap ?? 0) - (a.gap ?? 0);
  });

  const pior = ordenadas[0];
  const fortes = completas.filter((d) => d.severidade === "good");
  const fracas = completas.filter((d) => d.severidade === "crit" || d.severidade === "warn");

  const leituras: LeituraDimensao[] = ordenadas.map((d) => {
    const modelos = NARRATIVAS[d.chave];
    const modelo = modelos[d.severidade] ?? modelos.padrao;
    return {
      nome: d.nome,
      time: d.time,
      exec: d.exec,
      gap: d.gap,
      rotulo: d.rotulo,
      severidade: d.severidade,
      narrativa: preenche(modelo, { time: d.time ?? 0, exec: d.exec ?? 0, gap: d.gap ?? 0 }),
      tituloImpacto: IMPACTOS[d.chave].titulo,
      impactos: IMPACTOS[d.chave].itens,
    };
  });

  const treinamentos: Treinamento[] = fracas
    .map((d, i) => {
      const base = TREINAMENTOS[d.chave];
      if (!base) return null;
      const { porqueModelo, ...resto } = base;
      const numeros = { time: d.time ?? 0, exec: d.exec ?? 0, gap: d.gap ?? 0 };
      return {
        ...resto,
        ordem: `${i + 1}º`,
        severidade: d.severidade,
        rotulo:
          d.severidade === "crit"
            ? `Resolve a fratura · ${d.nome}`
            : `Resolve o ponto de atenção · ${d.nome}`,
        marcaPorque: d.gap === null ? undefined : `Gap ${d.gap}`,
        porque: preenche(porqueModelo, numeros),
      } as Treinamento;
    })
    .filter((t): t is Treinamento => t !== null);

  const primeiroNome = info.lider.split(" ")[0];

  return {
    lider: info.lider,
    meta: [info.cargo, info.empresa, info.periodo].filter(Boolean).join(" · "),
    respondentesTime: `${calc.respondentesTime} ${calc.respondentesTime === 1 ? "respondente" : "respondentes"}`,
    respondentesExec: `${calc.respondentesExec} ${calc.respondentesExec === 1 ? "avaliador" : "avaliadores"}`,
    indiceTime: calc.indiceTime ?? 0,
    indiceExec: calc.indiceExec ?? 0,
    divergencia: `${(calc.divergencia ?? 0) > 0 ? "+" : ""}${calc.divergencia ?? 0}`,

    insight: !pior
      ? "Ainda não há respostas suficientes para apontar o ponto de partida."
      : pior.gap === null
        ? `O ponto mais frágil é **${pior.nome}**, avaliado em **${pior.time ?? pior.exec}**. Com apenas uma das óticas respondida, ainda não dá para medir o desalinhamento entre topo e base.`
        : `A maior divergência está em **${pior.nome}**: o executivo avalia em **${pior.exec}**, mas o time sente **${pior.time}** — um gap de **${pior.gap} pontos**.`,

    dimensoes: ordenadas.map((d) => ({
      nome: d.nome,
      time: d.time,
      exec: d.exec,
      gap: d.gap,
      rotulo: d.rotulo,
      severidade: d.severidade,
    })),

    forcas: fortes.map((d) => ({
      destaque: d.nome,
      texto:
        d.gap === null
          ? `— avaliada em ${d.time ?? d.exec}, dentro da faixa forte.`
          : `— consenso entre time e executivo (${d.time} / ${d.exec}).`,
      tom: "good" as const,
    })),
    vulnerabilidades: fracas.map((d) => ({
      destaque: d.nome,
      texto:
        d.gap === null
          ? `— avaliada em ${d.time ?? d.exec}, abaixo do esperado.`
          : `— time em ${d.time}, executivo em ${d.exec}, gap de ${d.gap} pontos.`,
      tom: "crit" as const,
    })),

    leituras,

    ofertaTitulo: "O diagnóstico mostrou onde dói. Veja como a Korthex resolve.",
    ofertaTexto: `Cada vulnerabilidade tem um treinamento desenhado para resolvê-la. Estes são os programas indicados para o momento de ${primeiroNome}, na ordem de prioridade do diagnóstico.`,
    treinamentos,
    caminho: {
      ...CAMINHO,
      rotulo: CAMINHO.rotulo.replace("{nome}", primeiroNome),
      descricao: CAMINHO.descricao.replace(/\{nome\}/g, primeiroNome),
    },
  };
}
