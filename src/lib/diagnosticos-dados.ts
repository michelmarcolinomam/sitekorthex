/**
 * Conteúdo dos diagnósticos — os blocos e perguntas de cada questionário.
 *
 * Portado dos protótipos HTML de ~/Desktop/Korthex-Diagnosticos sem mudar uma
 * vírgula do texto: a redação é do Michel e é o que faz o respondente
 * entender a pergunta. Aqui só ganhou tipagem.
 */

export type Pergunta =
  | { type: "faces"; theme: string; facet: string; text: string; labels: string[] }
  | {
      type: "polarity";
      theme: string;
      facet: string;
      text: string;
      left: { tag: string; t: string };
      right: { tag: string; t: string };
    }
  | { type: "relevance"; theme: string; facet: string; text: string; lo: string; hi: string }
  | {
      type: "battery";
      theme: string;
      poles: string[];
      rows: { text: string; reverse?: boolean; facet: string }[];
    }
  | { type: "agree"; theme: string; facet: string; text: string; poles: string[] }
  | { type: "freq"; theme: string; facet: string; text: string; poles: string[] }
  | { type: "scenario"; theme: string; facet: string; text: string; options: { t: string; s: number }[] }
  | { type: "level"; theme: string; facet: string; text: string; options: string[] };

export interface Bloco {
  name: string;
  kicker: string;
  questions: Pergunta[];
}

/** Diagnóstico 1 — o time avalia a liderança (visão de baixo). */
export const BLOCOS_TIME: Bloco[] = [
 {name:"No aperto do dia", kicker:"Aqui a gente vai falar sobre como o seu líder fica quando as coisas ficam difíceis — quando bate a pressão, o estresse, quando algo dá errado. Se ele mantém a calma ou perde a linha, e o quanto o humor dele mexe com você e com a equipe.",
  questions:[
   {type:"faces", theme:"emocoes", facet:"autorregulacao",
    text:"Quando o dia aperta e as coisas dão errado, como meu líder costuma ficar?",
    labels:["Explode","Estressa","Normal","Mantém a calma","Firme e tranquilo"]},
   {type:"polarity", theme:"emocoes", facet:"autorregulacao",
    text:"Quando bate a pressão, o que ele faz?",
    left:{tag:"De um lado", t:"Desconta o nervoso na equipe"},
    right:{tag:"Do outro", t:"Segura o nervoso e protege a equipe"}},
   {type:"relevance", theme:"emocoes", facet:"empatia",
    text:"O quanto ele percebe quando alguém não está bem?",
    lo:"Não percebe", hi:"Percebe na hora"},
   {type:"faces", theme:"emocoes", facet:"recuperacao",
    text:"Quando ele pega pesado com alguém, o que ele faz depois?",
    labels:["Ignora","Fica bravo","Deixa pra lá","Reconhece","Resolve"]},
   {type:"battery", theme:"emocoes", poles:["Nunca","Sempre"],
    rows:[
     {text:"Quando ele chega de mau humor, a equipe inteira sente.", reverse:true, facet:"previsibilidade"},
     {text:"Eu sei mais ou menos como ele vai reagir às coisas.", facet:"previsibilidade"},
     {text:"Ele percebe quando alguém não está bem.", facet:"empatia"},
     {text:"Depois de um estresse, ele desconta na equipe.", reverse:true, facet:"recuperacao"}
    ]}
 ]},
 {name:"Espaço pra ser honesto", kicker:"Aqui a gente vai falar sobre o quanto você se sente à vontade pra ser sincero com o seu líder. Se dá pra dar sua opinião, discordar dele, admitir um erro ou levar um problema, sem medo de sobrar pra você depois.",
  questions:[
   {type:"agree", theme:"conflito", facet:"seguranca",
    text:"Me sinto seguro pra levar um problema ruim pra ele.",
    poles:["Discordo","Concordo"]},
   {type:"scenario", theme:"conflito", facet:"seguranca",
    text:"Quando alguém erra na equipe, o que costuma acontecer?",
    options:[
     {t:"Vira caça ao culpado", s:0},
     {t:"Sobra bronca na frente dos outros", s:1},
     {t:"Passa batido, ninguém fala nada", s:2},
     {t:"Conversa reservada pra ajustar", s:3},
     {t:"Todo mundo aprende com o que houve", s:4}]},
   {type:"polarity", theme:"conflito", facet:"conducao",
    text:"Quando tem uma briga na equipe, ele...",
    left:{tag:"De um lado", t:"Deixa o problema crescer"},
    right:{tag:"Do outro", t:"Chama pra resolver na hora"}},
   {type:"relevance", theme:"conflito", facet:"justica",
    text:"O quanto ele trata todo mundo por igual?",
    lo:"Tem favoritos", hi:"Todos por igual"},
   {type:"battery", theme:"conflito", poles:["Nunca","Sempre"],
    rows:[
     {text:"Posso discordar dele sem medo de sobrar pra mim.", facet:"seguranca"},
     {text:"Tenho que tomar cuidado com tudo que falo perto dele.", reverse:true, facet:"seguranca"},
     {text:"Quando dois colegas se desentendem, ele ajuda a resolver.", facet:"conducao"},
     {text:"Ele tem favoritos na equipe.", reverse:true, facet:"justica"}
    ]}
 ]},
 {name:"Clareza e conversa", kicker:"Aqui a gente vai falar sobre o quanto você consegue entender o seu líder e ser entendido por ele. Se as coisas que ele pede ficam claras, se o feedback que ele dá te ajuda de verdade, e se ele escuta quando é a sua vez de falar.",
  questions:[
   {type:"faces", theme:"comunicacao", facet:"feedback",
    text:"Como é quando ele fala sobre o seu trabalho?",
    labels:["Machuca","Confunde","Tanto faz","Ajuda","Ajuda muito"]},
   {type:"polarity", theme:"comunicacao", facet:"informacao",
    text:"As coisas importantes eu fico sabendo...",
    left:{tag:"De um lado", t:"Só por último, quando já passou"},
    right:{tag:"Do outro", t:"Na hora certa e com clareza"}},
   {type:"relevance", theme:"comunicacao", facet:"escuta",
    text:"O quanto ele te escuta antes de responder?",
    lo:"Não escuta", hi:"Escuta de verdade"},
   {type:"scenario", theme:"comunicacao", facet:"direcao",
    text:"Quando ele te passa uma tarefa, como você fica?",
    options:[
     {t:"Sem entender o que ele quer", s:0},
     {t:"Com mais dúvida do que antes", s:1},
     {t:"Mais ou menos, vou tentando", s:2},
     {t:"Com uma boa ideia do caminho", s:3},
     {t:"Sabendo exatamente o que fazer", s:4}]},
   {type:"battery", theme:"comunicacao", poles:["Nunca","Sempre"],
    rows:[
     {text:"Saio das conversas com ele sabendo o que fazer.", facet:"direcao"},
     {text:"Quando ele fala do meu trabalho, isso me ajuda a melhorar.", facet:"feedback"},
     {text:"Ele explica o motivo das coisas, não só manda fazer.", facet:"direcao"},
     {text:"Fico sem saber o que é mais importante fazer.", reverse:true, facet:"direcao"}
    ]}
 ]},
 {name:"Palavra e exemplo", kicker:"Aqui a gente vai falar sobre o quanto a palavra do seu líder vale. Se ele faz o que cobra dos outros, se cumpre o que promete, e se ele é o mesmo com todo mundo — ou muda o jeito dependendo de quem está por perto.",
  questions:[
   {type:"agree", theme:"identidade", facet:"coerencia",
    text:"Ele faz o que cobra dos outros.",
    poles:["Discordo","Concordo"]},
   {type:"relevance", theme:"identidade", facet:"confiabilidade",
    text:"O quanto confio na palavra dele?",
    lo:"Não confio", hi:"Confio totalmente"},
   {type:"polarity", theme:"identidade", facet:"consistencia",
    text:"O jeito dele no dia a dia...",
    left:{tag:"De um lado", t:"Muda conforme quem está junto"},
    right:{tag:"Do outro", t:"É o mesmo com todo mundo"}},
   {type:"faces", theme:"identidade", facet:"inspiracao",
    text:"Como eu me sinto tendo essa pessoa como líder?",
    labels:["Mal","Indiferente","Ok","Bem","Com orgulho"]},
   {type:"battery", theme:"identidade", poles:["Nunca","Sempre"],
    rows:[
     {text:"Ele cumpre o que promete.", facet:"confiabilidade"},
     {text:"Ele fala uma coisa e faz outra.", reverse:true, facet:"coerencia"},
     {text:"Quando ele erra, ele assume.", facet:"coerencia"},
     {text:"Eu vejo essa pessoa como um exemplo.", facet:"inspiracao"}
    ]}
 ]},
 {name:"Autonomia e crescimento", kicker:"Aqui a gente vai falar sobre o quanto o seu líder te dá espaço pra trabalhar e crescer. Se ele confia em você, te deixa decidir as coisas do seu trabalho, reconhece quando você faz bem, e se importa com o seu crescimento.",
  questions:[
   {type:"freq", theme:"autorresp", facet:"responsabilidade",
    text:"Quando algo dá errado, ele assume junto com a gente em vez de procurar culpado.",
    poles:["Nunca","Sempre"]},
   {type:"relevance", theme:"autorresp", facet:"delegacao",
    text:"O quanto ele confia em mim pra decidir as coisas do meu trabalho?",
    lo:"Não confia", hi:"Confia total"},
   {type:"scenario", theme:"autorresp", facet:"delegacao",
    text:"Aparece uma tarefa importante. O que ele faz?",
    options:[
     {t:"Faz tudo sozinho, não solta", s:0},
     {t:"Manda fazer sem explicar", s:1},
     {t:"Explica o que quer e acompanha", s:3},
     {t:"Delega, confia e me ajuda a crescer", s:4}]},
   {type:"faces", theme:"autorresp", facet:"desenvolvimento",
    text:"Olhando meu crescimento desde que essa liderança começou...",
    labels:["Piorei","Na mesma","Pouco","Cresci","Cresci muito"]},
   {type:"battery", theme:"autorresp", poles:["Nunca","Sempre"],
    rows:[
     {text:"Ele me dá espaço pra fazer do meu jeito.", facet:"delegacao"},
     {text:"Ele reconhece quando faço um bom trabalho.", facet:"reconhecimento"},
     {text:"Ele quer fazer tudo sozinho e não deixa a gente.", reverse:true, facet:"delegacao"},
     {text:"Ele se importa com o meu crescimento, não só com o resultado.", facet:"desenvolvimento"}
    ]}
 ]}
];

/** Diagnóstico 2 — o executivo avalia a liderança (visão de cima). */
export const BLOCOS_EXECUTIVO: Bloco[] = [
 {name:"Entrega & Resultado", kicker:"Avalie a capacidade deste líder de entregar o que foi acordado e responder pelos próprios resultados — a base de qualquer relação de confiança executiva.",
  questions:[
   {type:"level", theme:"autorresp", facet:"entrega",
    text:"Consistência na entrega dos resultados acordados.",
    options:["Falha recorrente em entregar o combinado","Entrega abaixo do acordado com frequência","Entrega o essencial, com oscilações","Entrega com consistência e previsibilidade","Supera o acordado e antecipa demandas"]},
   {type:"level", theme:"autorresp", facet:"execucao",
    text:"Capacidade de converter metas em plano e execução.",
    options:["Não estrutura um caminho para a meta","Planeja de forma vaga, sem execução firme","Executa, mas com retrabalho e desvios","Traduz metas em planos claros e executa","Planeja, executa e ajusta com maestria"]},
   {type:"relevance", theme:"autorresp", facet:"confianca",
    text:"O quanto você confia neste líder para conduzir uma meta crítica sem o seu acompanhamento direto?",
    lo:"Nenhuma confiança", hi:"Confiança total"},
   {type:"scenario", theme:"autorresp", facet:"ownership",
    text:"Diante de um resultado abaixo do esperado, ele costuma...",
    options:[
     {t:"Justificar e transferir a responsabilidade", s:0},
     {t:"Minimizar ou omitir a gravidade", s:1},
     {t:"Reconhecer, mas sem plano de correção", s:2},
     {t:"Assumir e apresentar um plano de recuperação", s:3},
     {t:"Assumir, corrigir e prevenir a recorrência", s:4}]},
   {type:"battery", theme:"autorresp", poles:["Discordo","Concordo"],
    rows:[
     {text:"Assume os resultados — bons ou ruins — sem transferir responsabilidade.", facet:"ownership"},
     {text:"Traz soluções estruturadas, não apenas problemas.", facet:"entrega"},
     {text:"Compromete-se com prazos e os honra.", facet:"entrega"}]}
 ]},
 {name:"Gestão & Recursos", kicker:"Avalie como ele administra a operação sob sua responsabilidade: tempo, pessoas, recursos, conflitos e as decisões que não podem esperar.",
  questions:[
   {type:"level", theme:"conflito", facet:"eficiencia",
    text:"Eficiência na gestão de tempo, pessoas e recursos.",
    options:["Desperdiça recursos e perde prazos","Gestão reativa, vive apagando incêndios","Gerencia o básico, sem otimização","Aloca recursos com eficiência","Otimiza recursos e gera folga operacional"]},
   {type:"level", theme:"conflito", facet:"conflitos",
    text:"Condução de conflitos na equipe até a resolução.",
    options:["Evita ou agrava os conflitos","Intervém tarde e sem método","Resolve na superfície; os conflitos reincidem","Media e resolve com equilíbrio","Transforma conflito em alinhamento e melhoria"]},
   {type:"agree", theme:"conflito", facet:"prioridade",
    text:"Prioriza o que é estratégico sobre o que é meramente urgente.",
    poles:["Discordo","Concordo"]},
   {type:"relevance", theme:"conflito", facet:"previsibilidade",
    text:"O quanto a operação sob responsabilidade dele funciona de forma previsível?",
    lo:"Imprevisível", hi:"Totalmente previsível"},
   {type:"scenario", theme:"conflito", facet:"recursos",
    text:"Quando faltam recursos para uma entrega, ele...",
    options:[
     {t:"Paralisa e espera orientação", s:0},
     {t:"Reclama sem propor saída", s:1},
     {t:"Improvisa sem avaliar o risco", s:2},
     {t:"Renegocia escopo ou prazo com critério", s:3},
     {t:"Reprioriza e apresenta alternativas viáveis", s:4}]},
   {type:"battery", theme:"conflito", poles:["Discordo","Concordo"],
    rows:[
     {text:"Toma as decisões difíceis no tempo certo.", facet:"decisao"},
     {text:"Antecipa riscos antes que virem crises.", facet:"eficiencia"}]}
 ]},
 {name:"Estabilidade & Maturidade", kicker:"Avalie a solidez emocional e o julgamento deste líder sob pressão — o quanto você pode contar com a lucidez dele quando o cenário aperta.",
  questions:[
   {type:"level", theme:"emocoes", facet:"estabilidade",
    text:"Estabilidade emocional diante de pressão e adversidade.",
    options:["Perde o controle sob pressão","Oscila e transmite insegurança","Segura a pressão, mas com desgaste visível","Mantém equilíbrio e clareza","Serena a equipe e decide com lucidez"]},
   {type:"agree", theme:"emocoes", facet:"julgamento",
    text:"Mantém julgamento sólido mesmo sob estresse.",
    poles:["Discordo","Concordo"]},
   {type:"agree", theme:"emocoes", facet:"contagio",
    text:"O estado emocional dele não contamina a equipe nem a operação.",
    poles:["Discordo","Concordo"]},
   {type:"level", theme:"emocoes", facet:"critica",
    text:"Maturidade para receber crítica e feedback.",
    options:["Reage na defensiva ou se ressente","Ouve, mas não incorpora","Aceita, com dificuldade","Recebe bem e ajusta a conduta","Busca ativamente o feedback e evolui"]},
   {type:"relevance", theme:"emocoes", facet:"crise",
    text:"O quanto você confia na serenidade dele em uma crise real?",
    lo:"Nenhuma confiança", hi:"Confiança total"}
 ]},
 {name:"Comunicação & Reporte", kicker:"Avalie a qualidade e a confiabilidade da comunicação dele com você, com a diretoria e com o próprio time — inclusive a ausência de surpresas.",
  questions:[
   {type:"level", theme:"comunicacao", facet:"reporte",
    text:"Clareza e confiabilidade na comunicação com você e a diretoria.",
    options:["Comunicação confusa e não confiável","Informa parcialmente, com ruído","Comunica o básico, sem profundidade","Reporta com clareza e no tempo certo","Comunicação precisa, antecipada e estratégica"]},
   {type:"agree", theme:"comunicacao", facet:"transparencia",
    text:"Reporta com transparência — você não é surpreendido por problemas que foram ocultados.",
    poles:["Discordo","Concordo"]},
   {type:"agree", theme:"comunicacao", facet:"traducao",
    text:"Traduz a estratégia para a equipe de forma que ela execute o pretendido.",
    poles:["Discordo","Concordo"]},
   {type:"level", theme:"comunicacao", facet:"feedback",
    text:"Qualidade dos feedbacks que oferece ao próprio time.",
    options:["Não dá retorno ao time","Feedback vago ou apenas punitivo","Feedback esporádico","Feedback claro e construtivo","Desenvolve pessoas pelo feedback contínuo"]},
   {type:"scenario", theme:"comunicacao", facet:"transparencia",
    text:"Quando um problema sério surge na área dele, você fica sabendo...",
    options:[
     {t:"Quando o dano já é grande — e por terceiros", s:0},
     {t:"Tarde, e de forma incompleta", s:1},
     {t:"Apenas quando você pergunta", s:2},
     {t:"A tempo, com o contexto necessário", s:3},
     {t:"De imediato, com diagnóstico e proposta", s:4}]}
 ]},
 {name:"Confiança, Lealdade & Integridade", kicker:"Avalie o caráter deste líder: honestidade, lealdade, coerência e o quanto ele guarda e representa a cultura da empresa.",
  questions:[
   {type:"agree", theme:"identidade", facet:"honestidade",
    text:"Age com honestidade, mesmo quando ninguém está observando.",
    poles:["Discordo","Concordo"]},
   {type:"agree", theme:"identidade", facet:"lealdade",
    text:"É leal à empresa e ao projeto, acima dos próprios interesses.",
    poles:["Discordo","Concordo"]},
   {type:"level", theme:"identidade", facet:"coerencia",
    text:"Coerência entre o que declara e o que pratica.",
    options:["Discurso e prática se contradizem","Coerência frágil, conforme a conveniência","Coerente na maior parte do tempo","Sólida coerência entre fala e ação","Referência de integridade para o time"]},
   {type:"agree", theme:"identidade", facet:"representacao",
    text:"Representa bem a empresa perante clientes, parceiros e mercado.",
    poles:["Discordo","Concordo"]},
   {type:"relevance", theme:"identidade", facet:"confidencialidade",
    text:"O quanto você confia neste líder com informações sensíveis do negócio?",
    lo:"Nenhuma confiança", hi:"Confiança total"},
   {type:"battery", theme:"identidade", poles:["Discordo","Concordo"],
    rows:[
     {text:"É um verdadeiro guardião da cultura da empresa.", facet:"cultura"},
     {text:"Defende as decisões da empresa mesmo quando é difícil.", facet:"lealdade"}]}
 ]},
 {name:"Autonomia & Desenvolvimento", kicker:"Avalie a autonomia deste líder e a sua capacidade de desenvolver pessoas e reduzir a dependência da operação em relação a você.",
  questions:[
   {type:"level", theme:"autonomia", facet:"autonomia",
    text:"Autonomia para conduzir a própria área sem depender de você.",
    options:["Depende de você para quase tudo","Recorre a você com frequência excessiva","Autônomo no operacional, não no estratégico","Conduz a área com autonomia","Assume decisões estratégicas com segurança"]},
   {type:"agree", theme:"autonomia", facet:"desenvolvimento",
    text:"Desenvolve as pessoas do time, não apenas cobra entregas.",
    poles:["Discordo","Concordo"]},
   {type:"level", theme:"autonomia", facet:"sucessao",
    text:"Capacidade de formar e preparar sucessores.",
    options:["Não forma ninguém; torna-se insubstituível por inércia","Retém conhecimento, não desenvolve","Desenvolve pontualmente","Prepara pessoas para assumir mais","Forma sucessores prontos para o próximo nível"]},
   {type:"agree", theme:"autonomia", facet:"delegacao",
    text:"Delega com critério, em vez de centralizar.",
    poles:["Discordo","Concordo"]},
   {type:"relevance", theme:"autonomia", facet:"dependencia",
    text:"O quanto a área dele continuaria funcionando bem se ele se ausentasse por um mês?",
    lo:"Entraria em colapso", hi:"Seguiria perfeitamente"},
   {type:"battery", theme:"autonomia", poles:["Discordo","Concordo"],
    rows:[
     {text:"Reduz a dependência da empresa em relação a você.", facet:"dependencia"},
     {text:"Pensa no longo prazo do negócio, não só no resultado do mês.", facet:"visao"}]}
 ]}
];

/** Quantas respostas o questionário espera (bateria conta por linha). */
export function totalItens(blocos: Bloco[]): number {
  return blocos.reduce(
    (a, b) => a + b.questions.reduce((x, q) => x + (q.type === "battery" ? q.rows.length : 1), 0),
    0,
  );
}

/**
 * Flexão de gênero da liderança avaliada. Os textos são escritos no
 * masculino; quando quem está sendo avaliada é uma mulher, trocamos.
 */
const REGRAS_F: [RegExp, string][] = [
  [/\bo seu líder\b/g, "a sua líder"],
  [/\bO seu líder\b/g, "A sua líder"],
  [/\bseu líder\b/g, "sua líder"],
  [/\bSeu líder\b/g, "Sua líder"],
  [/\bmeu líder\b/g, "minha líder"],
  [/\bMeu líder\b/g, "Minha líder"],
  [/\blíder\b/g, "líder"],
  [/\bdele\b/g, "dela"],
  [/\bDele\b/g, "Dela"],
  [/\bele\b/g, "ela"],
  [/\bEle\b/g, "Ela"],
  [/é o mesmo\b/g, "é a mesma"],
  [/É o mesmo\b/g, "É a mesma"],
  [/\btranquilo\b/g, "tranquila"],
  [/\bbravo\b/g, "brava"],
  [/\bsozinho\b/g, "sozinha"],
];

export type Genero = "m" | "f";

/** Aplica a flexão num texto solto. */
export function flex(texto: string, genero: Genero): string {
  if (!texto || genero === "m") return texto;
  return REGRAS_F.reduce((s, [de, para]) => s.replace(de, para), texto);
}
