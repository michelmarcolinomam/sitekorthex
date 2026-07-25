import type { ResultadoLiderDados } from "@/components/diagnosticos/ResultadoLider";

/**
 * Dados de EXEMPLO da tela de resultado (Marina Prado / Nexa Logística).
 *
 * Existe para a tela poder ser vista e ajustada enquanto o motor de cálculo
 * não existe. Quando ele entrar, ele monta este mesmo formato a partir das
 * respostas reais e este arquivo sai de cena.
 *
 * Os textos são do Michel, vindos do protótipo aprovado.
 */
export const RESULTADO_EXEMPLO: ResultadoLiderDados = {
  lider: "Marina Prado",
  meta: "Gerente de Operações · Nexa Logística · Julho 2026",
  respondentesTime: "8 respondentes",
  respondentesExec: "3 sócios",
  indiceTime: 63,
  indiceExec: 72,
  divergencia: "+9",

  insight:
    "A maior divergência está em **Comunicação & Feedback**: os sócios avaliam em **68**, mas o time sente **41** — um gap de **27 pontos**. A liderança acredita comunicar bem; a equipe não recebe assim.",

  dimensoes: [
    { nome: "Comunicação & Feedback", time: 41, exec: 68, gap: 27, rotulo: "fratura", severidade: "crit" },
    { nome: "Estabilidade Emocional", time: 62, exec: 78, gap: 16, rotulo: "atenção", severidade: "warn" },
    { nome: "Gestão & Conflitos", time: 55, exec: 70, gap: 15, rotulo: "atenção", severidade: "warn" },
    { nome: "Autonomia & Desenvolvimento", time: 66, exec: 58, gap: 8, rotulo: "invertido", severidade: "inv" },
    { nome: "Confiança & Integridade", time: 80, exec: 84, gap: 4, rotulo: "consenso", severidade: "good" },
  ],

  forcas: [
    {
      destaque: "Confiança & Integridade",
      texto: "— consenso alto entre time e sócios (80 / 84).",
      tom: "good",
    },
    {
      destaque: "Estabilidade percebida no topo",
      texto: "— os sócios confiam na sua serenidade em crise.",
      tom: "good",
    },
  ],

  vulnerabilidades: [
    {
      destaque: "Comunicação & Feedback",
      texto: "— baixa na base (41) e maior divergência (gap 27).",
      tom: "crit",
    },
    {
      destaque: "Gestão & Conflitos",
      texto: "— atrito ainda percebido pela equipe (55).",
      tom: "crit",
    },
  ],

  leituras: [
    {
      nome: "Comunicação & Feedback",
      time: 41,
      exec: 68,
      gap: 27,
      rotulo: "fratura",
      severidade: "crit",
      narrativa:
        "A **maior fratura do diagnóstico**. Os sócios acreditam que a liderança comunica bem (68), mas a base recebe em 41 — um abismo de 27 pontos. A estratégia é formulada no topo, mas **se perde antes de chegar à execução**. O feedback, quando existe, não chega de forma que desenvolva quem o recebe.",
      tituloImpacto: "Impacto na companhia",
      impactos: [
        {
          destaque: "Retrabalho e erros de execução",
          texto: "— a equipe entrega o que entendeu, não o que foi pedido. Custo direto em horas e prazos.",
          tom: "crit",
        },
        {
          destaque: "Prioridades distorcidas",
          texto: "— decisões chegam sem contexto; energia gasta na coisa errada.",
          tom: "crit",
        },
        {
          destaque: "Desengajamento e turnover",
          texto: "— talentos que não recebem retorno claro sobre o próprio trabalho tendem a se desligar.",
          tom: "crit",
        },
        {
          destaque: "Ilusão de alinhamento no topo",
          texto:
            "— o executivo opera achando que comunicou; a ordem não chegou. É o risco mais perigoso, porque é invisível para quem decide.",
          tom: "crit",
        },
      ],
    },
    {
      nome: "Gestão & Conflitos",
      time: 55,
      exec: 70,
      gap: 15,
      rotulo: "atenção",
      severidade: "warn",
      narrativa:
        "Zona intermediária com **sinal de alerta**. A liderança conduz a operação, mas conflitos e disputas de prioridade ainda geram atrito — e a equipe sente isso mais (55) do que os sócios percebem (70).",
      tituloImpacto: "Impacto na companhia",
      impactos: [
        {
          destaque: "Atrito que drena o clima",
          texto: "— conflitos mal resolvidos consomem tempo e energia que deveriam ir para a entrega.",
          tom: "crit",
        },
        {
          destaque: "Prazos e recursos escorregam",
          texto: "— prioridades mal geridas geram desperdício silencioso.",
          tom: "crit",
        },
        {
          destaque: "Custo invisível ao topo",
          texto: "— não aparece no relatório dos sócios, mas corrói a produtividade do dia a dia.",
          tom: "crit",
        },
      ],
    },
    {
      nome: "Estabilidade Emocional",
      time: 62,
      exec: 78,
      gap: 16,
      rotulo: "atenção",
      severidade: "warn",
      narrativa:
        "Sólida aos olhos do topo (78), mais **oscilante na base** (62). Os sócios confiam na serenidade da liderança; o time convive com variações de humor no dia a dia que os sócios não enxergam.",
      tituloImpacto: "Impacto na companhia",
      impactos: [
        {
          destaque: "Clima instável",
          texto: "— o humor da liderança define o dia da equipe; previsibilidade baixa mina a segurança psicológica.",
          tom: "crit",
        },
        {
          destaque: "Reatividade sob pressão",
          texto: "— em crise real, a base pode não encontrar a âncora que os sócios presumem existir.",
          tom: "crit",
        },
        {
          destaque: "Desgaste acumulado",
          texto: "— equipes que caminham sobre ovos rendem menos e adoecem mais.",
          tom: "crit",
        },
      ],
    },
    {
      nome: "Autonomia & Desenvolvimento",
      time: 66,
      exec: 58,
      gap: 8,
      rotulo: "invertido",
      severidade: "inv",
      narrativa:
        "Inversão rara e reveladora. O time percebe a liderança mais autônoma (66) do que os próprios sócios (58). Não é falta de capacidade — é o **executivo ainda segurando a delegação** que gostaria de dar.",
      tituloImpacto: "Impacto na companhia",
      impactos: [
        {
          destaque: "Gargalo no fundador",
          texto:
            "— a dependência do topo limita o quanto a liderança pode assumir; o crescimento trava na cadeira do dono.",
          tom: "crit",
        },
        {
          destaque: "Sucessão represada",
          texto: "— sem espaço para decidir, a liderança não forma os próprios sucessores.",
          tom: "crit",
        },
        {
          destaque: "Executivo preso na operação",
          texto: "— energia que deveria ir para a estratégia fica retida no acompanhamento do dia a dia.",
          tom: "crit",
        },
      ],
    },
    {
      nome: "Confiança & Integridade",
      time: 80,
      exec: 84,
      gap: 4,
      rotulo: "consenso",
      severidade: "good",
      narrativa:
        "A **força consolidada** — e o único ponto de consenso pleno. As duas óticas concordam (80 / 84): a liderança inspira confiança e age com integridade. É o alicerce sobre o qual todo o resto pode ser construído.",
      tituloImpacto: "O que essa força sustenta",
      impactos: [
        {
          destaque: "Capital raro",
          texto:
            "— confiança consolidada é a base que permite desenvolver as demais dimensões com segurança e rapidez.",
          tom: "good",
        },
        {
          destaque: "Lealdade do time",
          texto: "— pessoas seguem quem confiam, mesmo em momentos difíceis; reduz risco de fuga de talentos.",
          tom: "good",
        },
        {
          destaque: "Atenção",
          texto:
            "— se a fratura de comunicação não for tratada, essa confiança tende a se corroer com o tempo. É uma força a proteger, não a assumir como garantida.",
          tom: "crit",
        },
      ],
    },
  ],

  ofertaTitulo: "O diagnóstico mostrou onde dói. Veja como a Korthex resolve.",
  ofertaTexto:
    "Cada vulnerabilidade tem um treinamento desenhado para resolvê-la. Estes são os programas indicados para o momento de Marina, na ordem de prioridade do diagnóstico.",

  treinamentos: [
    {
      ordem: "1º",
      severidade: "crit",
      rotulo: "Resolve a fratura · Comunicação & Feedback",
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
      marcaPorque: "Gap 27",
      porque:
        "Indicado porque o gap de 27 pontos mostra que a mensagem **se perde entre o topo e a base** — exatamente o que este treinamento corrige.",
    },
    {
      ordem: "2º",
      severidade: "warn",
      rotulo: "Resolve o ponto de atenção · Gestão & Conflitos",
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
      marcaPorque: "Gap 15",
      porque:
        "Indicado porque o atrito ainda percebido pela equipe (55) **drena clima e produtividade** no dia a dia.",
    },
  ],

  caminho: {
    rotulo: "O caminho completo · recomendado para Marina",
    titulo: "Korthex Liderança · Acompanhamento Individual",
    subtitulo: "Mentoria contínua",
    descricao:
      "Mais do que treinamentos pontuais, um **processo contínuo de desenvolvimento** desenhado sobre as vulnerabilidades específicas de Marina. Cada desafio é trabalhado dentro do próprio contexto em que aparece — no ritmo e na realidade dela, com foco inicial em **Comunicação** e **Gestão de Conflitos**, preservando as forças já consolidadas.",
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
  },
};
