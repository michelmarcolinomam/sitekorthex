/**
 * Questionário do respondente — servido direto pelo Worker, antes do roteador
 * React (mesmo padrão do handleSeoRoute).
 *
 * POR QUE ASSIM: o questionário é o protótipo aprovado pelo Michel, escrito à
 * mão em HTML/CSS/JS (~/Desktop/Korthex-Diagnosticos). Recriar aquilo em React
 * já custou o design uma vez. Então o arquivo é servido COMO ELE É — nem uma
 * linha de layout, animação ou texto foi tocada. O que acrescentamos é só o
 * encanamento: descobrir de qual avaliação se trata e enviar as respostas no
 * final. Editar o visual = editar o HTML em src/questionarios/.
 */

import htmlTime from "../questionarios/diagnostico-time.html?raw";
import htmlExecutivo from "../questionarios/diagnostico-executivo.html?raw";
import htmlExecutivoAvaliado from "../questionarios/diagnostico-executivo-pela-lideranca.html?raw";
import htmlEquipeGestao from "../questionarios/diagnostico-time-pela-lideranca.html?raw";
import htmlEquipeResultado from "../questionarios/diagnostico-time-pelo-executivo.html?raw";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
}

const CHAVE_AV_RE = /^AV-[A-Z2-9]{4,10}$/;

const TEMPLATES: Record<string, string> = {
  lideranca_time: htmlTime,
  lideranca_executivo: htmlExecutivo,
  executivo_lideranca: htmlExecutivoAvaliado,
  performance_lideranca: htmlEquipeGestao,
  performance_executivo: htmlEquipeResultado,
};

interface AvaliacaoInfo {
  id: string;
  tipo: string;
  status: string;
}

async function buscaAvaliacao(env: Env, chave: string): Promise<AvaliacaoInfo | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) return null;
  const url =
    `${env.SUPABASE_URL}/rest/v1/avaliacoes` +
    `?chave_avaliacao=eq.${encodeURIComponent(chave)}&select=id,tipo,status&limit=1`;
  const r = await fetch(url, {
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
    },
  });
  if (!r.ok) return null;
  const linhas = (await r.json()) as AvaliacaoInfo[];
  return linhas[0] ?? null;
}

async function gravaResposta(
  env: Env,
  avaliacaoId: string,
  corpo: { genero?: string; respostas?: Record<string, unknown> },
): Promise<boolean> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) return false;
  const respostas = corpo.respostas ?? {};
  if (!Object.keys(respostas).length) return false;

  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/respostas`, {
    method: "POST",
    headers: {
      apikey: env.SUPABASE_SERVICE_ROLE,
      authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: JSON.stringify({
      avaliacao_id: avaliacaoId,
      genero_lideranca: corpo.genero === "f" ? "f" : "m",
      respostas,
      meta: { itens: Object.keys(respostas).length },
    }),
  });
  return r.ok;
}

/**
 * O que a pessoa vai responder, por leitura.
 *
 * Este link é o que a EMPRESA gera no painel dela e dispara para a equipe. Ele
 * é exclusivo daquela avaliação, então a prévia também é: cada uma das cinco
 * leituras coloca a pessoa numa situação diferente, e ela precisa saber do que
 * se trata ANTES de abrir.
 *
 * **Não cita o nome da empresa de propósito.** A prévia é montada por servidor
 * do WhatsApp e fica visível para quem receber o link encaminhado; a empresa
 * ali contaria a terceiros que aquela companhia está em diagnóstico. Quem
 * precisa se reconhecer é quem abre o link, dentro da página.
 */
const PREVIA_POR_TIPO: Record<string, { titulo: string; descricao: string }> = {
  lideranca_time: {
    titulo: "Sua visão sobre quem te lidera — Korthex",
    descricao:
      "Anônimo, sem identificação de quem responde. Poucos minutos, sem resposta certa ou errada.",
  },
  lideranca_executivo: {
    titulo: "Sua avaliação de um líder — Korthex",
    descricao:
      "A leitura de quem acompanha esse líder de cima. Poucos minutos, sem resposta certa ou errada.",
  },
  executivo_lideranca: {
    titulo: "Sua avaliação do executivo — Korthex",
    descricao:
      "Anônimo, sem identificação de quem responde. A leitura de quem é liderado por ele.",
  },
  performance_lideranca: {
    titulo: "Sua avaliação da equipe — Korthex",
    descricao:
      "A leitura de quem conduz o time no dia a dia. Poucos minutos, sem resposta certa ou errada.",
  },
  performance_executivo: {
    titulo: "Sua avaliação da equipe — Korthex",
    descricao:
      "A leitura de quem cobra o resultado do time. Poucos minutos, sem resposta certa ou errada.",
  },
};

const IMAGEM_PREVIA = "https://korthex.com.br/assets/og-diagnostico.jpg";

/**
 * O <head> que os protótipos não têm.
 *
 * Eles começam direto no <title>, sem <head> nem <html>, então não havia meta
 * tag nenhuma. Isto vai por PREFIXO, e não por replace, porque não existe
 * <head> para substituir; o navegador monta o head implícito. Fica aqui, no
 * servidor, para os HTMLs aprovados continuarem intocados.
 *
 * **A viewport é a tag que mais importa.** Sem ela o celular renderiza a
 * página a 980px e reduz tudo a ~40%, e o `@media (max-width:560px)` que os
 * protótipos já trazem nunca dispara — o design de celular existia e estava
 * inalcançável. O questionário é respondido majoritariamente no celular.
 */
function metaPrevia(tipo: string): string {
  const p = PREVIA_POR_TIPO[tipo] ?? {
    titulo: "Sua resposta no diagnóstico — Korthex",
    descricao: "Anônimo, sem identificação de quem responde. Leva alguns minutos.",
  };
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;");
  return [
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta property="og:type" content="website">',
    `<meta property="og:title" content="${esc(p.titulo)}">`,
    `<meta property="og:description" content="${esc(p.descricao)}">`,
    `<meta property="og:image" content="${IMAGEM_PREVIA}">`,
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:image" content="${IMAGEM_PREVIA}">`,
  ].join("\n");
}

function pagina(titulo: string, texto: string, status: number): Response {
  return new Response(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow"><title>${titulo} · Korthex</title>
<style>body{margin:0;min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;
background:#F3F1F9;color:#1B1826;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;text-align:center;padding:24px}
h1{font-family:"Iowan Old Style",Palatino,Georgia,serif;font-weight:600;font-size:2rem;margin:0 0 14px}
p{color:#4C4860;max-width:44ch;line-height:1.55;margin:0}</style></head>
<body><h1>${titulo}</h1><p>${texto}</p></body></html>`,
    { status, headers: { "content-type": "text/html; charset=utf-8" } },
  );
}

/**
 * Script injetado no fim do protótipo. Só duas coisas: manda as respostas
 * quando a pessoa chega na tela final, e avisa se o envio falhar. Usa as
 * variáveis globais do próprio protótipo (answers, BLOCKS, G, paintOutro).
 */
function encanamento(chave: string): string {
  return `
<script>
(function(){
  var CHAVE = ${JSON.stringify(chave)};
  var enviado = false;

  // As notas do protótipo são {value, score}. O cálculo dos resultados precisa
  // saber de qual tema/faceta veio cada item — isso está no BLOCKS.
  function comTemaEFaceta(){
    var saida = {};
    Object.keys(answers).forEach(function(k){
      var p = k.split('.').map(Number);
      var q = (BLOCKS[p[0]] && BLOCKS[p[0]].questions[p[1]]) || {};
      var faceta = q.facet;
      if (q.type === 'battery' && q.rows && p.length > 2) faceta = q.rows[p[2]].facet;
      saida[k] = {
        valor: answers[k].value,
        score: answers[k].score,
        theme: q.theme || '',
        facet: faceta || ''
      };
    });
    return saida;
  }

  function avisarFalha(){
    var nav = document.getElementById('nav');
    if (nav && !document.getElementById('kx-falha')) {
      var d = document.createElement('div');
      d.id = 'kx-falha';
      d.style.cssText = 'color:#D65A47;font-size:.9rem;padding:10px 0';
      d.textContent = 'Não conseguimos enviar suas respostas. Verifique a conexão — tentaremos de novo ao avançar.';
      nav.parentNode.insertBefore(d, nav);
    }
  }

  function enviar(){
    if (enviado) return;
    enviado = true;
    fetch(location.pathname, {
      method: 'POST',
      headers: {'content-type':'application/json'},
      body: JSON.stringify({ chave: CHAVE, genero: (typeof G !== 'undefined' ? G : 'm'), respostas: comTemaEFaceta() })
    }).then(function(r){ if(!r.ok){ enviado = false; avisarFalha(); } })
      .catch(function(){ enviado = false; avisarFalha(); });
  }

  // paintOutro é declaração de função no escopo global do protótipo:
  // envolvemos para enviar exatamente quando a tela de agradecimento aparece.
  if (typeof window.paintOutro === 'function') {
    var original = window.paintOutro;
    window.paintOutro = function(){
      var r = original.apply(this, arguments);
      enviar();
      return r;
    };
  }

  // Segunda trava, caso o protótipo mude de forma: observa a marca da tela
  // final aparecer no palco. Enviar duas vezes é impossível (flag 'enviado').
  var palco = document.getElementById('stage');
  if (palco) {
    new MutationObserver(function(){
      if (palco.querySelector('.outro-mark')) enviar();
    }).observe(palco, { childList: true, subtree: true });
  }
})();
</script>
`;
}

/** Retorna null quando o path não é /avaliacao/{chave}. */
export async function handleAvaliacaoRoute(
  request: Request,
  env: unknown,
): Promise<Response | null> {
  const { pathname } = new URL(request.url);
  const m = /^\/avaliacao\/([^/]+)\/?$/.exec(pathname);
  if (!m) return null;

  const chave = decodeURIComponent(m[1]).trim().toUpperCase();
  const e = (env ?? {}) as Env;

  if (!CHAVE_AV_RE.test(chave)) {
    return pagina(
      "Link inválido",
      "Confira o endereço que você recebeu ou peça um novo para quem enviou.",
      404,
    );
  }

  const av = await buscaAvaliacao(e, chave);
  if (!av)
    return pagina(
      "Link não encontrado",
      "Esta avaliação não existe ou foi removida. Peça um novo link para quem enviou.",
      404,
    );

  if (request.method === "POST") {
    if (av.status === "arquivada") return new Response("encerrada", { status: 409 });
    const corpo = (await request.json().catch(() => ({}))) as {
      genero?: string;
      respostas?: Record<string, unknown>;
    };
    const ok = await gravaResposta(e, av.id, corpo);
    return new Response(ok ? "ok" : "erro", { status: ok ? 200 : 400 });
  }

  if (av.status === "arquivada")
    return pagina("Avaliação encerrada", "Esta avaliação não está mais recebendo respostas.", 410);

  const template = TEMPLATES[av.tipo];
  if (!template)
    return pagina(
      "Questionário em preparação",
      "Este diagnóstico ainda não está disponível para resposta.",
      404,
    );

  // Os protótipos terminam em </script>, sem </body> — por isso anexamos no
  // fim quando a tag não existe, em vez de perder a injeção em silêncio.
  const script = encanamento(chave);
  const html =
    metaPrevia(av.tipo) +
    (template.includes("</body>")
      ? template.replace("</body>", `${script}</body>`)
      : template + script);
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "x-robots-tag": "noindex, nofollow",
    },
  });
}
