import type { RespostaBruta } from "./motor-calculo";

/**
 * Dados de exemplo do recorte do executivo — só para a prévia da tela.
 *
 * Em vez de cravar o resultado pronto, monta RESPOSTAS sintéticas e deixa o
 * motor calcular: assim a prévia mostra exatamente o que a tela vai mostrar
 * quando as respostas forem reais, incluindo as regras de faixa e de desacordo.
 *
 * O cenário: seis líderes avaliando o fundador. Sucessão é o gargalo (ele não
 * larga a decisão), consciência vem logo atrás, e Identidade tem leituras
 * DIVIDIDAS — metade da liderança o vê coerente, a outra metade não, que é o
 * retrato clássico de tratamento desigual.
 */

/** Índice desejado (0-100) vira nota 0-4 no item, que é o que o motor lê. */
const nota = (indice: number) => (indice / 100) * 4;

/** Cada linha é um líder; cada coluna, o que ele enxerga naquele eixo. */
const LEITURAS: Record<string, number[]> = {
  //            líder1 líder2 líder3 líder4 líder5 líder6
  consciencia: [48, 55, 44, 60, 50, 53],
  identidade: [82, 46, 78, 44, 80, 50],
  decisao: [58, 62, 55, 66, 60, 57],
  sucessao: [40, 45, 38, 48, 42, 44],
  cultura: [66, 70, 62, 72, 68, 65],
};

export function respostasExemploExecutivo(): RespostaBruta[] {
  const quantos = LEITURAS.consciencia.length;
  const respostas: RespostaBruta[] = [];

  for (let i = 0; i < quantos; i++) {
    const itens = Object.entries(LEITURAS).flatMap(([theme, valores]) => {
      const alvo = valores[i];
      // Oito itens por eixo, como no questionário real, com pequena variação
      // interna para não fabricar uma precisão que a resposta humana não tem.
      return Array.from({ length: 8 }, (_, k) => ({
        score: nota(Math.max(0, Math.min(100, alvo + ((k % 3) - 1) * 6))),
        theme,
        facet: `f${k}`,
      }));
    });
    respostas.push({ tipo: "executivo_lideranca", itens });
  }

  return respostas;
}

export const CONTEXTO_EXEMPLO = {
  executivo: "Eduardo Nassar",
  cargo: "Fundador e CEO",
  empresa: "Nexa Logística",
  periodo: "Julho 2026",
};
