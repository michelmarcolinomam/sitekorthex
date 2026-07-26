/**
 * Monta o panorama da empresa a partir do que o motor calculou.
 *
 * Mesma divisão da tela do líder: o motor entrega números, aqui eles viram
 * frases. Os textos seguem a leitura que o Michel escreveu no protótipo de
 * nível 2 — cultura versus caso individual.
 */

import { band, classificaLider, ROTULO_BAND, DIMENSOES, type ResultadoEmpresa } from "./motor-calculo";
import { programaDe } from "./programas";
import type {
  Faixa,
  ItemCultura,
  OfertaGrupo,
  OverviewEmpresaDados,
} from "@/components/diagnosticos/OverviewEmpresa";

const CHIP_CLASSE: Record<string, string> = {
  ref: "ch-ref",
  ok: "ch-ok",
  ment: "ch-ment",
  emerg: "ch-emerg",
};

export interface ContextoEmpresa {
  empresa: string;
  periodo: string;
  totalRespondentes: number;
  indiceTime: number | null;
  indiceExec: number | null;
  divergencia: number | null;
}

export function montaOverview(ctx: ContextoEmpresa, emp: ResultadoEmpresa): OverviewEmpresaDados {
  const dimensoes = emp.porDimensao.map((d) => {
    const def = DIMENSOES.find((x) => x.chave === d.chave)!;
    return {
      nome: d.nome,
      curto: def.curto,
      valor: d.valor,
      faixa: d.band as Faixa,
      rotulo: ROTULO_BAND[d.band],
    };
  });

  // A matriz segue a mesma ordem de colunas do mapa (pior primeiro).
  const ordemColunas = dimensoes.map((d) => DIMENSOES.findIndex((x) => x.nome === d.nome));

  const matriz = emp.ranking.map((l) => ({
    nome: l.nome,
    cargo: l.cargo,
    celulas: ordemColunas.map((idx) => {
      const v = l.porDimensao[idx];
      return { valor: v, faixa: v === null ? null : (band(v) as Faixa) };
    }),
    media: l.indiceGeral,
    faixaMedia: band(l.indiceGeral) as Faixa,
    classificacao: l.classificacao.rotulo,
    chipClasse: CHIP_CLASSE[l.classificacao.chave] ?? "ch-ok",
  }));

  const mediaLinha = {
    celulas: dimensoes.map((d) => ({ valor: d.valor, faixa: d.faixa })),
    media: emp.indiceGeral,
  };

  const dividasChaves = new Set(emp.padraoSistemico.map((p) => p.chave));
  const colunasDebito = dimensoes.filter((d) => {
    const def = DIMENSOES.find((x) => x.nome === d.nome)!;
    return dividasChaves.has(def.chave);
  }).map((d) => d.curto);

  /* ── insight ──
     Cuidado deliberado: só é "padrão de cultura" quando há líderes suficientes
     para o padrão existir. Com um líder só, isto é o recorte dele, e afirmar
     cultura seria mentira. */
  const totalLideres = emp.lideres.length;
  const pior = dimensoes[0];
  const afetadosNoPior = emp.padraoSistemico.find((p) => p.nome === pior?.nome);
  const plural = (n: number) => (n === 1 ? "líder" : "líderes");

  const evidencia = !afetadosNoPior
    ? ". É por onde a leitura da liderança começa."
    : totalLideres >= 3
      ? `, com **${afetadosNoPior.lideresAfetados} de ${afetadosNoPior.total} ${plural(afetadosNoPior.total)}** fora da faixa forte. Não é problema de uma pessoa — é um **padrão de cultura**.`
      : totalLideres === 2
        ? `, presente nos **dois líderes avaliados**. Com mais lideranças avaliadas dá para dizer se é padrão de cultura ou coincidência.`
        : `. Por enquanto esta é a leitura de **um único líder** — o mapa da empresa ganha sentido quando houver mais lideranças avaliadas.`;

  const insight = !pior
    ? "Ainda não há avaliações suficientes para desenhar o panorama."
    : `**${pior.nome} é a competência mais frágil${totalLideres >= 2 ? " da companhia" : ""}**: índice **${pior.valor}**` +
      evidencia +
      (ctx.divergencia !== null && Math.abs(ctx.divergencia) >= 5
        ? ` E ${ctx.divergencia > 0 ? "os sócios avaliam a liderança" : "as equipes avaliam a liderança"} **${Math.abs(ctx.divergencia)} pontos** acima do que ${ctx.divergencia > 0 ? "as equipes de fato sentem" : "o topo reconhece"}.`
        : "");

  /* ── força e dívida da cultura ── */
  const forcas: ItemCultura[] = dimensoes
    .filter((d) => d.faixa === "hi")
    .slice(0, 3)
    .map((d) => ({
      destaque: `${d.nome} (${d.valor})`,
      texto: "— competência consolidada no grupo. Base sólida para construir o resto.",
      tom: "good" as const,
    }));

  const dividas: ItemCultura[] = emp.padraoSistemico.slice(0, 3).map((p) => ({
    destaque: `${p.nome} (${p.valor})`,
    texto: `— abaixo da média da empresa, com ${p.lideresAfetados} de ${p.total} ${p.total === 1 ? "líder" : "líderes"} fora da faixa forte.${totalLideres >= 3 ? " Custo espalhado por toda a operação." : ""}`,
    tom: "crit" as const,
  }));

  /* ── oferta ──
     O nome do treinamento é o do site, sem prefixo. Quando duas dimensões caem
     no mesmo programa, a oferta é uma só e cita as duas. */
  type Alvo = { nome: string; valor: number; faixa: Faixa };

  function ofertaDe(alvos: Alvo[], prioritaria: boolean): OfertaGrupo {
    const principal = alvos[0];
    const def = DIMENSOES.find((x) => x.nome === principal.nome)!;
    const p = programaDe(def.chave);
    const afetados = emp.padraoSistemico.find((x) => x.chave === def.chave);
    const lista = alvos.map((a) => `${a.nome} (${a.valor})`).join(" e ");

    return {
      rotulo: prioritaria
        ? "Frente prioritária · corrigir o que está frágil"
        : `Responde a ${lista}`,
      titulo: p.titulo,
      subtitulo: "Korthex Liderança",
      descricao: p.corpo,
      desenvolve: p.impactos,
      destrava: p.destrava,
      faixa: principal.faixa,
      porque: prioritaria
        ? `**Por que em grupo:** a fragilidade em ${principal.nome} (${principal.valor}) atravessa a liderança${afetados && emp.lideres.length >= 3 ? ` — ${afetados.lideresAfetados} de ${afetados.total} líderes` : ""}. ${emp.lideres.length >= 3 ? "É **cultura, não pessoa**. Um treinamento aplicado ao grupo cria linguagem comum e custa uma fração de " + emp.lideres.length + " processos individuais." : "Corrigir aqui é o que destrava o resto."}`
        : `**Por que agora:** ${lista} ${alvos.length > 1 ? "estão" : "está"} na faixa de atenção. Treinar agora custa uma fração do que custa recuperar depois de quebrada.`,
      nota:
        alvos.length > 1
          ? `**Uma frente, duas dimensões:** ${alvos.map((a) => a.nome).join(" e ")} respondem ao mesmo programa — um treinamento cobre as duas.`
          : undefined,
    };
  }

  const frageis = dimensoes.filter((d) => d.faixa === "lo");
  const atencao = dimensoes.filter((d) => d.faixa === "mid");

  const ofertaPrioritaria = frageis.length ? ofertaDe([frageis[0]], true) : null;

  // Agrupa o que sobrou por programa, para não repetir o mesmo card.
  const restantes = [...frageis.slice(1), ...atencao];
  const porPrograma = new Map<string, Alvo[]>();
  for (const d of restantes) {
    const def = DIMENSOES.find((x) => x.nome === d.nome)!;
    const titulo = programaDe(def.chave).titulo;
    if (titulo === (ofertaPrioritaria?.titulo ?? "")) continue; // já ofertado acima
    porPrograma.set(titulo, [...(porPrograma.get(titulo) ?? []), d]);
  }
  const ofertasPreventivas = [...porPrograma.values()].map((alvos) => ofertaDe(alvos, false));

  /* ── frentes complementares: quem puxa para baixo e quem multiplica ── */
  const complementares: ItemCultura[] = [];
  const precisamMentoria = emp.ranking.filter(
    (l) => l.classificacao.chave === "ment" || l.classificacao.chave === "emerg",
  );
  // Ninguém é gargalo e multiplicador ao mesmo tempo: quem precisa de mentoria
  // sai da lista de quem pode ancorar a cultura.
  const multiplicadores = emp.ranking
    .filter((l) => l.classificacao.chave === "ref" || l.classificacao.chave === "ok")
    .filter((l) => l.indiceGeral >= emp.indiceGeral)
    .slice(0, 2);

  if (precisamMentoria.length) {
    complementares.push({
      destaque: precisamMentoria.map((l) => `${l.nome} (${l.indiceGeral})`).join(" e "),
      texto:
        totalLideres >= 2
          ? `— ${precisamMentoria.length === 1 ? "está" : "estão"} abaixo da média e ${precisamMentoria.length === 1 ? "puxa" : "puxam"} o índice da empresa para baixo. A mentoria individual acelera o grupo inteiro.`
          : `— pela régua da Korthex, este é o acompanhamento indicado para o momento dele.`,
      tom: "crit",
    });
  }
  if (multiplicadores.length) {
    complementares.push({
      destaque: multiplicadores.map((l) => `${l.nome} (${l.indiceGeral})`).join(" e "),
      texto: "— as lideranças mais maduras podem ancorar a cultura e ajudar a formar as demais. Ativo interno a aproveitar, não só a desenvolver.",
      tom: "good",
    });
  }

  return {
    empresa: ctx.empresa,
    meta: `${emp.lideres.length} ${emp.lideres.length === 1 ? "líder avaliado" : "líderes avaliados"} · ${ctx.totalRespondentes} ${ctx.totalRespondentes === 1 ? "respondente" : "respondentes"} · ${ctx.periodo}`,
    indiceGeral: emp.indiceGeral,
    indiceTime: ctx.indiceTime,
    indiceExec: ctx.indiceExec,
    divergencia: ctx.divergencia === null ? "—" : `${ctx.divergencia > 0 ? "+" : ""}${ctx.divergencia}`,
    insight,
    dimensoes,
    colunasDebito,
    matriz,
    mediaLinha,
    forcas,
    dividas,
    ofertaPrioritaria,
    ofertasPreventivas,
    complementares,
  };
}
