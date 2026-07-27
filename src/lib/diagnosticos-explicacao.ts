import { DIMENSOES, EIXOS_EXECUTIVO, DIMENSOES_EQUIPE } from "./motor-calculo";
import type { PapelAvaliado } from "./diag-server";

/**
 * O que a empresa precisa ENTENDER antes de gerar um diagnóstico.
 *
 * O painel do cliente não é um formulário: é o primeiro contato dele com o
 * método. Quem entende o que está aplicando escolhe melhor, explica melhor
 * para quem vai responder e lê melhor o resultado — e responder mal é o
 * único jeito de um diagnóstico não valer nada.
 *
 * O texto vive aqui, separado da tela, para poder ser ajustado sem mexer em
 * layout. As dimensões vêm do motor: se o cálculo mudar, a explicação
 * acompanha sozinha.
 */

export const PRINCIPIO = {
  titulo: "Ninguém se avalia sozinho",
  texto:
    "Cada camada da empresa é lida por quem convive com ela e tem expectativa real sobre ela — nunca por ela mesma. O time lê a liderança; a liderança lê o topo; quem conduz e quem cobra leem a equipe. O valor não está na nota: está na distância entre como cada lado enxerga a mesma coisa.",
};

export interface ExplicacaoDiagnostico {
  titulo: string;
  /** Uma frase que define o instrumento. */
  resumo: string;
  /** Quem responde, e quantos — a parte que mais gera dúvida. */
  quemResponde: string[];
  /** O que é medido, com os nomes que aparecem no relatório. */
  mede: string[];
  /** O que a empresa ganha com isso — a leitura de negócio. */
  ganho: string[];
  /** Como aplicar, na ordem. */
  comoAplicar: string[];
  /** A regra que protege o instrumento. Aparece em destaque. */
  cuidado: string;
}

export const EXPLICACAO: Record<PapelAvaliado, ExplicacaoDiagnostico> = {
  lider: {
    titulo: "Diagnóstico de uma liderança",
    resumo:
      "Lê um líder pelos dois lados: como a equipe experimenta a condução dele no dia a dia e como o executivo avalia a entrega dele.",
    quemResponde: [
      "De baixo: as pessoas lideradas por ele. Quatro ou mais respostas dão um retrato estável; abaixo disso a leitura fica sensível a uma opinião só.",
      "De cima: sócios, diretoria ou quem cobra resultado dele. Uma a três respostas bastam.",
      "As respostas do time são anônimas: ninguém, nem a Korthex, sabe quem respondeu o quê.",
    ],
    mede: DIMENSOES.map((d) => d.nome),
    ganho: [
      "Mostra onde a liderança custa dinheiro à operação: retrabalho por ordem mal entendida, decisão que não vem, gente boa que sai.",
      "O gap entre as duas visões é a conversa mais valiosa — o líder que o dono adora e o time teme aparece aqui, com número.",
      "Quando vários líderes repetem a mesma fragilidade, o problema deixa de ser pessoa e vira cultura: é o que separa mentoria individual de treinamento em grupo.",
    ],
    comoAplicar: [
      "Cadastre o líder e escolha se aplica as duas óticas ou só uma.",
      "Copie o link de cada ótica e envie para quem vai responder — o link já sabe quem está sendo avaliado.",
      "Acompanhe a barra de progresso aqui. O resultado abre com a primeira resposta e fica mais firme a cada uma.",
    ],
    cuidado:
      "Diga a quem vai responder que é anônimo e que serve para desenvolver, não para punir. Resposta protegida vira diagnóstico inútil.",
  },
  executivo: {
    titulo: "Diagnóstico do executivo",
    resumo:
      "A leitura que quase nenhuma empresa tem: como a liderança enxerga quem está no topo — a única camada que ninguém costuma avaliar.",
    quemResponde: [
      "Os líderes que se reportam diretamente ao executivo avaliado.",
      "É anônimo, e o relatório só é liberado a partir de três respostas: com uma ou duas, o retrato entrega quem falou.",
      "Empresa com menos de três líderes: aplique os outros diagnósticos e trate esta leitura em conversa, sem relatório.",
    ],
    mede: EIXOS_EXECUTIVO.map((e) => e.nome),
    ganho: [
      "Mostra o que a condução do topo produz sem que o topo perceba — do humor que vira clima à decisão que volta atrás.",
      "Expõe a dependência da empresa em relação a uma pessoa só: é o número que abre a conversa de sucessão.",
      "Quando os líderes divergem muito entre si sobre o mesmo executivo, o tema deixa de ser competência e passa a ser consistência.",
    ],
    comoAplicar: [
      "Cadastre o executivo a ser avaliado — normalmente o fundador, um sócio ou um diretor.",
      "Envie o link para os líderes que se reportam a ele. Quanto mais respostas, mais protegido o anonimato.",
      "O relatório destrava sozinho quando a terceira resposta entrar.",
    ],
    cuidado:
      "Este é o diagnóstico mais delicado da série. Se quem responde desconfiar que dá para rastrear, responde o que é seguro — e a leitura perde o sentido.",
  },
  equipe: {
    titulo: "Diagnóstico de uma equipe",
    resumo:
      "Lê o time como conjunto por duas exigências diferentes: a de quem o conduz no dia a dia e a de quem cobra o resultado dele.",
    quemResponde: [
      "Visão de quem conduz: o líder responsável pela equipe.",
      "Visão de quem cobra: o dono, o diretor ou quem responde pelo resultado dela.",
      "As duas óticas respondem perguntas diferentes sobre as mesmas seis dimensões — e uma frase idêntica em cada dimensão garante que a comparação é justa.",
    ],
    mede: DIMENSOES_EQUIPE.map((d) => d.nome),
    ganho: [
      "Mostra o custo real da operação: retrabalho, entrega que trava entre áreas, conhecimento preso numa pessoa só.",
      "A distância entre as duas visões é o achado: o topo cobrando o que a gestão nem vê como problema, ou o resultado chegando às custas de um desgaste que ninguém lá em cima enxerga.",
      "Indica o treinamento direto, sem tradução: cada dimensão desta leitura é um treinamento do Korthex Performance.",
    ],
    comoAplicar: [
      "Identifique a equipe, informe quantas pessoas tem e aponte o líder responsável.",
      "Gere as duas óticas para ter o cruzamento — com uma só, você tem meia leitura.",
      "Envie cada link para a pessoa certa: uma para quem conduz, outra para quem cobra.",
    ],
    cuidado:
      "Não é avaliação de desempenho: não existe nota por pessoa em lugar nenhum. Com menos de três pessoas, o relatório avisa que ali o retrato é de indivíduo.",
  },
};
