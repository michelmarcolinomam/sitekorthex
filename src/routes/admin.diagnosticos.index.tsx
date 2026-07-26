import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  adminVisaoGeral,
  adminArchiveCliente,
  type ClienteNoFunil,
  type EtapaFunil,
} from "@/lib/diag-server";
import { AdminNav } from "@/components/admin/AdminNav";
import adminCss from "@/styles/admin-diagnosticos.css?url";

/**
 * Painel interno: o funil da carteira.
 *
 * A ideia central é que o admin não espelha o painel do cliente. Ele responde
 * "com quem eu falo hoje e o que ofereço" — por isso cada etapa do funil é um
 * filtro que carrega a lista dela, com as colunas que importam naquele momento.
 */
export const Route = createFileRoute("/admin/diagnosticos/")({
  loader: () => adminVisaoGeral(),
  head: () => ({
    meta: [
      { title: "Diagnósticos — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: adminCss }],
  }),
  component: PainelDiagnosticos,
});

const ETAPAS: {
  chave: EtapaFunil;
  rotulo: string;
  titulo: string;
  sub: string;
  marca: string;
  cor: string;
  classeParado: string;
  textoParado: (n: number) => string;
}[] = [
  {
    chave: "entregues",
    rotulo: "Empresas entregues",
    titulo: "Nunca abriram",
    sub: "Chave entregue e link nunca aberto. Ou não chegou em quem devia, ou a oferta não foi entendida.",
    marca: "Nunca abriu",
    cor: "var(--line-strong)",
    classeParado: "p-frio",
    textoParado: (n) => `${n} ${n === 1 ? "nunca abriu" : "nunca abriram"}`,
  },
  {
    chave: "lead",
    rotulo: "Viraram lead",
    titulo: "Entregaram os dados e pararam",
    sub: "Preencheram o cadastro — o contato já é seu — mas não geraram nenhuma avaliação. Não sabem por onde começar.",
    marca: "Cadastrou e parou",
    cor: "var(--warn)",
    classeParado: "p-morno",
    textoParado: (n) => `${n} ${n === 1 ? "cadastrou e parou" : "cadastraram e pararam"}`,
  },
  {
    chave: "campo",
    rotulo: "Entraram em campo",
    titulo: "Começaram e travaram",
    sub: "Geraram avaliações e as respostas ainda não fecharam. Sem cobrança, o diagnóstico morre aqui.",
    marca: "Em campo",
    cor: "var(--crit)",
    classeParado: "p-travado",
    textoParado: (n) => `${n} ${n === 1 ? "em andamento" : "em andamento"}`,
  },
  {
    chave: "pronto",
    rotulo: "Diagnósticos prontos",
    titulo: "Pronto para a abordagem",
    sub: "Terminaram o diagnóstico. A leitura já aponta o programa — é conversa de proposta.",
    marca: "Pronto para a abordagem",
    cor: "var(--good)",
    classeParado: "p-quente",
    textoParado: (n) => `${n} para abordar`,
  },
];

const MARCA_ESTILO: Record<EtapaFunil, { bg: string; cor: string }> = {
  entregues: { bg: "var(--surface)", cor: "var(--muted)" },
  lead: { bg: "var(--warn-soft)", cor: "var(--warn)" },
  campo: { bg: "var(--crit-soft)", cor: "var(--crit)" },
  pronto: { bg: "var(--good-soft)", cor: "var(--good)" },
};

/** Para onde o "ver o resultado" leva: um líder vai ao recorte, vários ao mapa. */
function destinoResultado(c: ClienteNoFunil) {
  // Um líder só não tem mapa de empresa que valha: vai direto ao recorte dele.
  return c.lideres === 1 && c.liderUnicoId
    ? { texto: "Ver o recorte do líder →", href: `/admin/diagnosticos/lider/${c.liderUnicoId}` }
    : { texto: "Ver o mapa da empresa →", href: `/admin/diagnosticos/empresa/${c.id}` };
}

function diasTexto(n: number) {
  if (n === 0) return "hoje";
  if (n === 1) return "há 1 dia";
  return `há ${n} dias`;
}

function PainelDiagnosticos() {
  const visao = Route.useLoaderData();
  const router = useRouter();
  const [etapa, setEtapa] = useState<EtapaFunil>("pronto");
  const [copiado, setCopiado] = useState<string | null>(null);

  const daEtapa = useMemo(
    () =>
      visao.clientes
        .filter((c) => c.etapa === etapa)
        .sort((a, b) => b.diasParado - a.diasParado),
    [visao.clientes, etapa],
  );

  const fecharamOntem = useMemo(
    () => visao.clientes.filter((c) => c.fechouOntem),
    [visao.clientes],
  );

  const def = ETAPAS.find((e) => e.chave === etapa)!;

  const copiar = (c: ClienteNoFunil) => {
    void navigator.clipboard?.writeText(`${window.location.origin}/diagnosticos/${c.chave}`);
    setCopiado(c.id);
    setTimeout(() => setCopiado((k) => (k === c.id ? null : k)), 1800);
  };

  const arquivar = async (c: ClienteNoFunil) => {
    if (!window.confirm(`Arquivar "${c.empresa}"? Some da lista, sem apagar os dados.`)) return;
    await adminArchiveCliente({ data: c.id });
    void router.invalidate();
  };

  return (
    <div className="kx-admin">
      <AdminNav ativa="diagnosticos" />

      <div className="wrap">
        <header className="head">
          <div>
            <div className="tag">Visão geral</div>
            <h1>O que precisa de você hoje</h1>
          </div>
          <a href="/admin/diagnosticos/clientes" className="btn" style={{ textDecoration: "none" }}>
            + Novo cliente
          </a>
        </header>

        {/* Desde ontem: só quem fechou no dia anterior. */}
        <div className="ontem">
          <div className="topo">
            <div>
              <div className="tag">Desde ontem</div>
              <h2>
                {fecharamOntem.length === 0
                  ? "Nenhum diagnóstico fechou ontem"
                  : `${fecharamOntem.length} ${fecharamOntem.length === 1 ? "diagnóstico fechou" : "diagnósticos fecharam"} — e ninguém falou com ${fecharamOntem.length === 1 ? "ele" : "eles"} ainda`}
              </h2>
            </div>
          </div>

          {fecharamOntem.length === 0 ? (
            <p className="nenhum">
              Quando um diagnóstico fechar, ele aparece aqui no dia seguinte — é a hora de abordar.
            </p>
          ) : (
            <div className="novos">
              {fecharamOntem.map((c) => {
                const d = destinoResultado(c);
                return (
                  <div className="novo" key={c.id}>
                    <div className="esq">
                      <div className="nome">{c.empresa}</div>
                      <div className="det">
                        Fechou com {c.respostas} de {c.esperadas} respostas ·{" "}
                        <b>
                          {c.lideres} {c.lideres === 1 ? "líder" : "líderes"}
                        </b>
                        {c.piorDimensao ? (
                          <>
                            {" "}
                            · mais frágil{" "}
                            <b>
                              {c.piorDimensao.nome} ({c.piorDimensao.valor})
                            </b>
                          </>
                        ) : null}
                      </div>
                      {c.responsavel ? (
                        <div className="hora">
                          {c.responsavel.nome} · {c.responsavel.email}
                        </div>
                      ) : null}
                    </div>
                    <a href={d.href}>{d.texto}</a>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="funil" role="group" aria-label="Etapas do funil — clique para filtrar">
          {ETAPAS.map((e) => {
            const t = visao.totais[e.chave];
            return (
              <button
                key={e.chave}
                type="button"
                className="etapa"
                aria-pressed={etapa === e.chave}
                onClick={() => setEtapa(e.chave)}
              >
                <div className="v num">{t.alcancaram}</div>
                <div className="k tag">{e.rotulo}</div>
                <div className={`parados ${e.classeParado}`}>{e.textoParado(t.parados)}</div>
              </button>
            );
          })}
        </div>

        <section>
          <div className="sec-head">
            <div className="tag" style={{ color: def.cor === "var(--line-strong)" ? "var(--muted)" : def.cor }}>
              {def.rotulo}
            </div>
            <h2>{def.titulo}</h2>
            <p>{def.sub}</p>
          </div>

          {daEtapa.length === 0 ? (
            <div className="vazio">Nenhuma empresa nesta etapa agora.</div>
          ) : (
            <div className="fila">
              {daEtapa.map((c) => (
                <LinhaCliente
                  key={c.id}
                  c={c}
                  etapa={def}
                  copiado={copiado === c.id}
                  onCopiar={() => copiar(c)}
                  onArquivar={() => void arquivar(c)}
                />
              ))}
            </div>
          )}
        </section>

        {visao.demanda.length ? (
          <section>
            <div className="sec-head">
              <div className="tag" style={{ color: "var(--brand)" }}>
                Carteira
              </div>
              <h2>Qual treinamento a sua base está pedindo</h2>
              <p>
                Cruzando os diagnósticos concluídos: em quantas empresas cada competência está fora
                da faixa forte. É a leitura que só você enxerga — serve para decidir que turma abrir.
              </p>
            </div>
            <div className="demanda">
              {visao.demanda.map((d) => (
                <div className="drow" key={d.programa}>
                  <div className="drow-top">
                    <span className="drow-nome">{d.programa}</span>
                    <span className="drow-n">
                      <b>{d.empresas}</b> de {d.total} {d.total === 1 ? "empresa" : "empresas"}
                    </span>
                  </div>
                  <div className="dtrack">
                    <i
                      className={d.empresas === d.total ? "q" : undefined}
                      style={{ width: `${d.total ? Math.round((d.empresas / d.total) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <footer>Painel interno Korthex · dados agregados dos diagnósticos · acesso restrito</footer>
      </div>
    </div>
  );
}

function LinhaCliente({
  c,
  etapa,
  copiado,
  onCopiar,
  onArquivar,
}: {
  c: ClienteNoFunil;
  etapa: (typeof ETAPAS)[number];
  copiado: boolean;
  onCopiar: () => void;
  onArquivar: () => void;
}) {
  const marca = MARCA_ESTILO[c.etapa];
  const pct = c.esperadas > 0 ? Math.min(100, Math.round((c.respostas / c.esperadas) * 100)) : 0;
  const destino = destinoResultado(c);

  return (
    <div className="acao">
      <span className="barra" style={{ background: etapa.cor }} />
      <div className="corpo">
        <div className="linha1">
          <span className="empresa">{c.empresa}</span>
          <span className="marca" style={{ background: marca.bg, color: marca.cor }}>
            {c.etapa === "campo" && c.diasParado >= 5 ? `Travado ${diasTexto(c.diasParado)}` : etapa.marca}
          </span>
        </div>

        {c.etapa === "entregues" ? (
          <p className="porque">
            Chave entregue <b>{diasTexto(c.diasParado)}</b> e o link nunca foi aberto.
          </p>
        ) : null}

        {c.etapa === "lead" ? (
          <>
            <p className="porque">
              Cadastro preenchido <b>{diasTexto(c.diasParado)}</b> e nenhuma avaliação gerada. É a
              ligação curta mostrando como cadastrar o primeiro líder.
            </p>
            {c.responsavel ? (
              <div className="contato">
                <span className="cchip">
                  <b>{c.responsavel.nome}</b>
                  {c.responsavel.cargo ? ` · ${c.responsavel.cargo}` : ""}
                </span>
                <span className="cchip">{c.responsavel.email}</span>
                {c.responsavel.telefone ? <span className="cchip">{c.responsavel.telefone}</span> : null}
              </div>
            ) : null}
          </>
        ) : null}

        {c.etapa === "campo" ? (
          <>
            <p className="porque">
              {c.respostas === 0
                ? "Gerou as avaliações e não recebeu nenhuma resposta ainda."
                : `Última resposta ${diasTexto(c.diasParado)} — faltam ${Math.max(0, c.esperadas - c.respostas)} para fechar.`}
            </p>
            <div className="prog">
              <div className="ptrack">
                <i style={{ width: `${pct}%` }} />
              </div>
              <span className="pval num">
                {c.respostas}/{c.esperadas} respostas
              </span>
            </div>
          </>
        ) : null}

        {c.etapa === "pronto" ? (
          <>
            <p className="porque">
              Diagnóstico concluído: <b>{c.lideres} {c.lideres === 1 ? "líder" : "líderes"}, {c.respostas} respostas</b>
              {c.piorDimensao ? (
                <>
                  . Mais frágil: <b>{c.piorDimensao.nome} ({c.piorDimensao.valor})</b>
                </>
              ) : null}
              .
            </p>
            <div className="leitura">
              {c.indiceGeral !== null ? (
                <span className="indice">
                  <b>{c.indiceGeral}</b>
                  <span>índice da empresa</span>
                </span>
              ) : null}
              {c.ofertaIndicada ? (
                <span className="ofertinha">
                  Oferta indicada: <b>{c.ofertaIndicada}</b>
                </span>
              ) : null}
            </div>
          </>
        ) : null}

        <p className="rodape">
          {c.responsavel && c.etapa !== "lead" ? `${c.responsavel.nome} · ${c.responsavel.email} · ` : ""}
          {c.chave}
        </p>
      </div>

      <div className="cta">
        {c.etapa === "pronto" ? (
          <>
            {/* Diagnóstico fechado é oferta esperando: a ação principal aqui é vender. */}
            <a href={`/admin/diagnosticos/oferta/${c.id}`}>Montar oferta →</a>
            <a className="sec" href={destino.href}>
              {destino.texto}
            </a>
            <a className="sec" href={`/diagnosticos/${c.chave}`} target="_blank" rel="noopener noreferrer">
              Abrir painel do cliente
            </a>
          </>
        ) : c.etapa === "campo" ? (
          <>
            <a href={`/admin/diagnosticos/${c.id}`}>Ver progresso →</a>
            <a className="sec" onClick={onCopiar}>
              {copiado ? "Copiado ✓" : "Copiar link do painel"}
            </a>
          </>
        ) : c.etapa === "lead" ? (
          <>
            <a href={`/diagnosticos/${c.chave}`} target="_blank" rel="noopener noreferrer">
              Abrir o painel dele →
            </a>
            <a className="sec" onClick={onCopiar}>
              {copiado ? "Copiado ✓" : "Copiar link"}
            </a>
          </>
        ) : (
          <>
            <a onClick={onCopiar}>{copiado ? "Copiado ✓" : "Copiar link de novo"}</a>
            <a className="sec" onClick={onArquivar}>
              Arquivar
            </a>
          </>
        )}
      </div>
    </div>
  );
}
