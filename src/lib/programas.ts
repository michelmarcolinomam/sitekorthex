/**
 * Os programas da Korthex, com o texto oficial do site (src/routes/lideranca.tsx).
 *
 * Existe para as telas de resultado recomendarem exatamente o que a página de
 * vendas promete. Se o site mudar a descrição de um treinamento, muda aqui
 * também — é a mesma promessa em dois lugares.
 */

import type { ChaveDimensao } from "./motor-calculo";

export interface Programa {
  titulo: string;
  /** Descrição oficial, como está no site. */
  corpo: string;
  /** O que o programa entrega — os impactos listados no site. */
  impactos: string[];
  /** O que isso destrava na operação: a leitura de negócio, por dimensão. */
  destrava: string[];
}

export const PROGRAMAS: Record<string, Programa> = {
  emocoes: {
    titulo: "Gestão das Emoções & Autorresponsabilidade",
    corpo:
      "Desenvolvimento da consciência emocional, da autorregulação e da capacidade de assumir responsabilidade sobre comportamentos, decisões e impactos produzidos na equipe.",
    impactos: [
      "Maior equilíbrio emocional",
      "Redução de reatividade",
      "Desenvolvimento da maturidade profissional",
      "Lideranças mais conscientes de seus impactos",
    ],
    destrava: [
      "Clima menos dependente do humor do líder",
      "Decisão sob pressão com menos ruído",
      "Menos desgaste e absenteísmo nas equipes",
    ],
  },
  conflito: {
    titulo: "Gestão de Conflitos & Recursos",
    corpo:
      "Formação da capacidade de lidar com divergências, tensões, interesses e recursos de forma produtiva, fortalecendo relações e resultados.",
    impactos: [
      "Redução de conflitos improdutivos",
      "Melhoria no clima organizacional",
      "Tomada de decisão mais equilibrada",
      "Maior capacidade de negociação",
    ],
    destrava: [
      "Prioridades disputadas com menos atrito",
      "Prazos e recursos que param de escorregar",
      "Menos energia gasta em ruído entre áreas",
    ],
  },
  comunicacao: {
    titulo: "Comunicação Assertiva & Modelação de Equipes",
    corpo:
      "Desenvolvimento da clareza na comunicação, da qualidade dos feedbacks e da capacidade de influenciar comportamentos através do exemplo.",
    impactos: [
      "Equipes mais alinhadas",
      "Redução de ruídos de comunicação",
      "Feedbacks mais eficazes",
      "Fortalecimento da influência da liderança",
    ],
    destrava: [
      "Menos retrabalho por ordem mal entendida",
      "Prioridade que chega com contexto",
      "Feedback que desenvolve em vez de constranger",
    ],
  },
  identidade: {
    titulo: "Identidade & Brand Persona",
    corpo:
      "Construção da identidade da liderança, fortalecendo posicionamento, presença, credibilidade e coerência entre discurso e comportamento.",
    impactos: [
      "Lideranças mais seguras e consistentes",
      "Fortalecimento da autoridade",
      "Maior coerência entre valores e atitudes",
      "Desenvolvimento da presença executiva",
    ],
    destrava: [
      "Confiança que sustenta mudança difícil",
      "Menos fuga de talentos por descrédito na liderança",
      "Discurso e prática andando juntos",
    ],
  },
  // Autonomia responde ao mesmo programa de Emoções & Autorresponsabilidade.
  // O nome é o do site, sem sufixo; o que muda é a leitura de negócio.
  autonomia: {
    titulo: "Gestão das Emoções & Autorresponsabilidade",
    corpo:
      "Desenvolvimento da consciência emocional, da autorregulação e da capacidade de assumir responsabilidade sobre comportamentos, decisões e impactos produzidos na equipe.",
    impactos: [
      "Maior equilíbrio emocional",
      "Redução de reatividade",
      "Desenvolvimento da maturidade profissional",
      "Lideranças mais conscientes de seus impactos",
    ],
    destrava: [
      "Executivo fora do dia a dia",
      "Crescimento que não trava na cadeira do dono",
      "Banco de sucessores em formação",
    ],
  },
};

export function programaDe(chave: ChaveDimensao): Programa {
  return PROGRAMAS[chave];
}

/**
 * REGRA: o nome do treinamento é sempre o que está no site. Nada de prefixo,
 * sufixo ou variação inventada. Duas dimensões podem cair no mesmo programa —
 * nesse caso a oferta é uma só, citando as duas.
 */
