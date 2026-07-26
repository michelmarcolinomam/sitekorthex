/**
 * A leitura das telas de resultado da EQUIPE.
 *
 * São três recortes do mesmo diagnóstico:
 *   · a visão de quem CONDUZ a equipe;
 *   · a visão de quem COBRA o resultado;
 *   · o cruzado, que põe as duas lado a lado.
 *
 * REGRA QUE ATRAVESSA TUDO: aqui não existe nada individualizado. A unidade é
 * a equipe, e nenhuma frase deste arquivo pode permitir deduzir uma pessoa.
 *
 * Os nomes dos treinamentos são os do site (src/routes/performance.tsx).
 */

import type { ChaveEquipe, DimensaoEquipe, ResultadoEquipeCalculado, Severidade } from "./motor-calculo";

export type ModoEquipe = "lideranca" | "executivo" | "cruzado";

export interface ItemSintese {
  nome: string;
  valor: number;
  severidade: Severidade;
  rotulo: string;
  custo: string;
}

export interface DimensaoNaTela {
  chave: ChaveEquipe;
  nome: string;
  curto: string;
  lideranca: number | null;
  executivo: number | null;
  gap: number | null;
  /** O número que manda no recorte aberto: a ótica escolhida, ou a média no cruzado. */
  valor: number;
  severidade: Severidade;
  rotulo: string;
  ancora: { lideranca: number | null; executivo: number | null; gap: number | null };
  narrativa: string;
  impactos: { destaque: string; texto: string; tom: "good" | "crit" }[];
}

export interface ResultadoEquipeDados {
  modo: ModoEquipe;
  equipe: string;
  meta: string;
  tamanho: number | null;
  /** Verdadeiro quando a equipe é pequena demais para o retrato ser de conjunto. */
  equipePequena: boolean;
  indiceLideranca: number | null;
  indiceExecutivo: number | null;
  divergencia: number | null;
  divergenciaAncoras: number | null;
  insight: string;
  dimensoes: DimensaoNaTela[];
  forcas: ItemSintese[];
  vulnerabilidades: ItemSintese[];
  treinamentos: { titulo: string; porque: string; severidade: Severidade }[];
}

/** O nome do treinamento é o da dimensão — são a mesma coisa no Korthex Performance. */
const CUSTO: Record<ChaveEquipe, { frouxo: { destaque: string; texto: string; tom: "crit" }[]; firme: { destaque: string; texto: string; tom: "good" }[] }> = {
  emocoes: {
    frouxo: [
      { destaque: "Clima vira entrega", texto: "o humor do grupo decide a produtividade do dia, e ninguém consegue planejar em cima disso.", tom: "crit" },
      { destaque: "Desgaste que some", texto: "a equipe absorve pressão sem processar, e o custo aparece depois — em erro, atestado ou pedido de demissão.", tom: "crit" },
      { destaque: "Respinga para fora", texto: "o que era problema interno chega ao cliente como atraso ou aspereza.", tom: "crit" },
    ],
    firme: [
      { destaque: "Constância", texto: "a entrega não depende do humor da semana.", tom: "good" },
      { destaque: "Problema que sobe cedo", texto: "o time fala antes de virar crise.", tom: "good" },
    ],
  },
  comunicacao: {
    frouxo: [
      { destaque: "Retrabalho por ruído", texto: "trabalho refeito porque a informação chegou torta é a forma mais cara de desperdício: já foi paga uma vez.", tom: "crit" },
      { destaque: "Surpresa de última hora", texto: "o que a equipe já sabia chega tarde a quem decide, e o problema chega caro.", tom: "crit" },
      { destaque: "Conversa que não acontece", texto: "o assunto difícil vira corredor, e o corredor vira clima.", tom: "crit" },
    ],
    firme: [
      { destaque: "Alinhamento barato", texto: "combina uma vez e executa igual.", tom: "good" },
      { destaque: "Risco antecipado", texto: "o problema aparece enquanto ainda é barato resolver.", tom: "good" },
    ],
  },
  autorresp: {
    frouxo: [
      { destaque: "Tudo volta para a gestão", texto: "cada decisão pequena consome tempo de quem deveria estar cuidando do que é grande.", tom: "crit" },
      { destaque: "Erro que só aparece tarde", texto: "quando ninguém assume, o problema é descoberto pelo cliente ou pelo resultado do mês.", tom: "crit" },
      { destaque: "Meta sem dono", texto: "o resultado vira responsabilidade de ninguém e chega ao fim do mês sem recuperação.", tom: "crit" },
    ],
    firme: [
      { destaque: "Gestão liberada", texto: "a equipe resolve o dia a dia e devolve tempo para quem lidera.", tom: "good" },
      { destaque: "Correção rápida", texto: "o erro é assumido e corrigido antes de escalar.", tom: "good" },
    ],
  },
  identidade: {
    frouxo: [
      { destaque: "A marca na mão errada", texto: "quem atende constrói ou destrói a reputação que a empresa levou anos para fazer.", tom: "crit" },
      { destaque: "Padrão que cede", texto: "quando a pressa manda, a qualidade cai — e o cliente aprende a esperar menos.", tom: "crit" },
      { destaque: "Venda por desconto", texto: "sem sustentar o valor do que entrega, a conversa com o cliente vira preço.", tom: "crit" },
    ],
    firme: [
      { destaque: "Reputação que trabalha a favor", texto: "o cliente cita o atendimento como diferencial.", tom: "good" },
      { destaque: "Padrão sem vigilância", texto: "a qualidade não depende de alguém olhando.", tom: "good" },
    ],
  },
  colaboracao: {
    frouxo: [
      { destaque: "Entrega que trava", texto: "o que depende de mais de uma pessoa para na fronteira, e alguém de fora precisa destravar.", tom: "crit" },
      { destaque: "Conhecimento preso", texto: "quando o que se sabe fica com uma pessoa só, férias e desligamento viram risco operacional.", tom: "crit" },
      { destaque: "Disputa que custa prazo", texto: "energia gasta em quem tem razão é energia que não foi para a entrega.", tom: "crit" },
    ],
    firme: [
      { destaque: "Fluxo sem ponte", texto: "as áreas se resolvem sem intermediário.", tom: "good" },
      { destaque: "Cobertura", texto: "uma ausência não para a operação.", tom: "good" },
    ],
  },
  projeto: {
    frouxo: [
      { destaque: "Capacidade que evapora", texto: "retrabalho e urgência criada dentro de casa consomem a equipe que já está paga.", tom: "crit" },
      { destaque: "Operação imprevisível", texto: "sem constância, não dá para prometer prazo a cliente nem planejar investimento.", tom: "crit" },
      { destaque: "Gente de passagem", texto: "quem não enxerga futuro aqui entrega o mínimo e treina para sair.", tom: "crit" },
    ],
    firme: [
      { destaque: "Previsibilidade", texto: "dá para planejar em cima do que esta equipe entrega.", tom: "good" },
      { destaque: "Gente que fica", texto: "quem vê horizonte investe no próprio trabalho.", tom: "good" },
    ],
  },
};

const LEITURA: Record<ChaveEquipe, Record<"crit" | "warn" | "good", string>> = {
  emocoes: {
    crit: "A equipe não sustenta o próprio equilíbrio quando aperta, e isso chega na entrega.",
    warn: "Segura a pressão, mas com desgaste — e desgaste que não é tratado vira rotatividade.",
    good: "Mantém o trabalho estável mesmo quando o mês aperta.",
  },
  comunicacao: {
    crit: "O que se perde entre o combinado e o executado está custando caro aqui.",
    warn: "Se entende na maior parte, mas ainda precisa de repetição para alinhar.",
    good: "Combina uma vez e executa igual — é o que torna o resto barato.",
  },
  autorresp: {
    crit: "A equipe entrega tarefa, não resultado. Cada decisão volta para quem lidera.",
    warn: "Assume o que é seu quando é cobrada; falta o passo de assumir antes de pedirem.",
    good: "Assume o resultado como próprio e devolve tempo à gestão.",
  },
  identidade: {
    crit: "O padrão de fora depende de quem está na frente — e isso é a reputação da empresa no jogo.",
    warn: "Representa bem, com oscilações conhecidas quando a pressa entra.",
    good: "Sustenta o padrão da casa sem precisar de vigilância.",
  },
  colaboracao: {
    crit: "As fronteiras internas estão custando prazo: o que depende de várias mãos trava.",
    warn: "Colabora dentro do próprio quadrado; entre áreas ainda precisa de empurrão.",
    good: "O trabalho atravessa pessoas e áreas sem precisar de ponte.",
  },
  projeto: {
    crit: "Muito esforço para pouco resultado — e a maior parte do que se perde é criada aqui dentro.",
    warn: "Entrega o combinado, mas a urgência ainda come a capacidade de melhorar.",
    good: "Entrega com constância e ainda melhora o próprio processo.",
  },
};

function tomDe(s: Severidade): "crit" | "warn" | "good" {
  return s === "crit" ? "crit" : s === "warn" ? "warn" : "good";
}

export function montaResultadoEquipe(
  ctx: { equipe: string; empresa: string; periodo: string; tamanho: number | null },
  calculo: ResultadoEquipeCalculado,
  modo: ModoEquipe,
): ResultadoEquipeDados | null {
  const valorDe = (d: DimensaoEquipe) =>
    modo === "lideranca" ? d.lideranca : modo === "executivo" ? d.executivo : d.nivel;

  const uteis = calculo.dimensoes.filter((d) => valorDe(d) !== null && d.severidade !== null);
  if (!uteis.length) return null;

  const dimensoes: DimensaoNaTela[] = uteis
    .map((d) => {
      const valor = valorDe(d) as number;
      // No recorte de uma ótica só, o gap não existe: a severidade é a da faixa.
      const severidade = (modo === "cruzado" ? d.severidade : d.faixa ? (valor >= 70 ? "good" : valor >= 55 ? "warn" : "crit") : "warn") as Severidade;
      const rotulo = modo === "cruzado" ? (d.rotulo ?? "") : severidade === "good" ? "sólido" : severidade === "warn" ? "atenção" : "frágil";
      const custo = CUSTO[d.chave];
      return {
        chave: d.chave,
        nome: d.nome,
        curto: d.curto,
        lideranca: d.lideranca,
        executivo: d.executivo,
        gap: d.gap,
        valor,
        severidade,
        rotulo,
        ancora: d.ancora,
        narrativa: `**${valor}/100** — ${LEITURA[d.chave][tomDe(severidade)]}`,
        impactos: severidade === "good" ? custo.firme : custo.frouxo,
      };
    })
    .sort((a, b) => a.valor - b.valor);

  const pior = dimensoes[0];
  const linha = (d: DimensaoNaTela): ItemSintese => ({
    nome: d.nome,
    valor: d.valor,
    severidade: d.severidade,
    rotulo: d.rotulo,
    custo: d.impactos[0].destaque.toLowerCase(),
  });

  /* ── o insight muda com o recorte ── */
  const maiorGap = [...dimensoes]
    .filter((d) => d.gap !== null)
    .sort((a, b) => Math.abs(b.gap as number) - Math.abs(a.gap as number))[0];

  let insight: string;
  if (modo === "cruzado" && maiorGap && Math.abs(maiorGap.gap as number) >= 10) {
    const g = maiorGap.gap as number;
    insight =
      g < 0
        ? `A maior distância está em **${maiorGap.nome}**: quem cobra o resultado marca **${Math.abs(g)} pontos abaixo** de quem conduz a equipe. O topo está exigindo algo que a gestão ainda não enxerga como problema — e é essa conversa, não a nota, que precisa acontecer primeiro.`
        : `A maior distância está em **${maiorGap.nome}**: quem conduz a equipe marca **${Math.abs(g)} pontos abaixo** de quem cobra o resultado. O número chega bonito lá em cima, mas quem convive vê o custo de produzi-lo — normalmente desgaste que ainda não virou perda de gente.`;
    if (calculo.divergenciaAncoras !== null && Math.abs(calculo.divergenciaAncoras) >= 10) {
      insight += ` E não é efeito das perguntas: nas frases **idênticas** nos dois questionários, a diferença média ainda é de ${Math.abs(calculo.divergenciaAncoras)} pontos.`;
    }
  } else if (modo === "cruzado") {
    insight = `As duas leituras estão alinhadas: quem conduz e quem cobra descrevem a mesma equipe. **${pior.nome} (${pior.valor})** é o ponto mais frágil, e o acordo entre as óticas dá peso ao diagnóstico — não há discussão sobre o que precisa ser desenvolvido.`;
  } else if (modo === "lideranca") {
    insight = `Pela ótica de quem conduz, **${pior.nome} (${pior.valor})** é o que mais trava o dia a dia desta equipe. Esta é a leitura da gestão: engajamento, cumprimento, diálogo e colaboração — o que se sente de perto.`;
  } else {
    insight = `Pela ótica de quem cobra o resultado, **${pior.nome} (${pior.valor})** é o que mais custa. Esta é a leitura da entrega: prazo, erro, previsibilidade e o que a operação consome — o que se vê de cima.`;
  }

  const modoNome = modo === "lideranca" ? "visão da liderança" : modo === "executivo" ? "visão do executivo" : "as duas visões";

  return {
    modo,
    equipe: ctx.equipe,
    meta: `${ctx.empresa} · ${ctx.tamanho ? `${ctx.tamanho} pessoas · ` : ""}${modoNome} · ${ctx.periodo}`,
    tamanho: ctx.tamanho,
    equipePequena: ctx.tamanho !== null && ctx.tamanho < 3,
    indiceLideranca: calculo.indiceLideranca,
    indiceExecutivo: calculo.indiceExecutivo,
    divergencia: calculo.divergencia,
    divergenciaAncoras: calculo.divergenciaAncoras,
    insight,
    dimensoes,
    forcas: dimensoes.filter((d) => d.severidade === "good").slice(-2).map(linha),
    vulnerabilidades: dimensoes.filter((d) => d.severidade !== "good").slice(0, 3).map(linha),
    treinamentos: dimensoes
      .filter((d) => d.severidade !== "good")
      .slice(0, 3)
      .map((d) => ({
        titulo: d.nome,
        severidade: d.severidade,
        porque: `O diagnóstico marcou ${d.valor}/100 nesta dimensão${
          modo === "cruzado" && d.gap !== null && Math.abs(d.gap) >= 10
            ? `, com ${Math.abs(d.gap)} pontos de distância entre as duas óticas`
            : ""
        }.`,
      })),
  };
}
