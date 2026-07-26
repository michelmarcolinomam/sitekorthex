import type { RespostaBruta } from "./motor-calculo";

/**
 * Dados de exemplo do recorte da equipe — só para a prévia das três telas.
 *
 * Monta RESPOSTAS sintéticas e deixa o motor calcular, para a prévia mostrar
 * exatamente o que o cliente verá quando as respostas forem reais.
 *
 * O cenário foi desenhado para expor o que este diagnóstico tem de próprio: a
 * equipe entrega (o dono vê resultado em Produtividade e Identidade), mas quem
 * conduz enxerga o custo de produzir isso — Emoções e Colaboração estão bem
 * abaixo na leitura da gestão. E em Autorresponsabilidade acontece o inverso:
 * o topo cobra mais do que a gestão reconhece como problema.
 */

const nota = (indice: number) => (indice / 100) * 4;

/** [visão da liderança, visão do executivo] por dimensão. */
const LEITURAS: Record<string, [number, number]> = {
  emocoes: [44, 62],
  comunicacao: [58, 54],
  autorresp: [66, 45],
  identidade: [72, 76],
  colaboracao: [46, 63],
  projeto: [61, 70],
};

/** A âncora costuma ficar perto da própria ótica, com ruído pequeno. */
const AJUSTE_ANCORA: Record<string, [number, number]> = {
  emocoes: [-4, 3],
  comunicacao: [2, -2],
  autorresp: [-3, 2],
  identidade: [1, -1],
  colaboracao: [-5, 4],
  projeto: [3, -3],
};

function respostaDe(indice: 0 | 1, tipo: RespostaBruta["tipo"]): RespostaBruta {
  const itens = Object.entries(LEITURAS).flatMap(([theme, valores]) => {
    const alvo = valores[indice];
    // Seis itens de ótica + a âncora, como no questionário real.
    const lente = Array.from({ length: 6 }, (_, k) => ({
      score: nota(Math.max(0, Math.min(100, alvo + ((k % 3) - 1) * 5))),
      theme,
      facet: `f${k}`,
    }));
    const ancora = {
      score: nota(Math.max(0, Math.min(100, alvo + AJUSTE_ANCORA[theme][indice]))),
      theme,
      facet: "ancora",
    };
    return [...lente, ancora];
  });
  return { tipo, itens };
}

export function respostasExemploEquipe(): RespostaBruta[] {
  return [respostaDe(0, "performance_lideranca"), respostaDe(1, "performance_executivo")];
}

export const CONTEXTO_EXEMPLO_EQUIPE = {
  equipe: "Equipe Comercial · Marina Prado",
  empresa: "Nexa Logística",
  periodo: "Julho 2026",
  tamanho: 9,
};
