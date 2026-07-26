import { useMemo, useState } from "react";
import type { OfertaParaMontar, ItemDaOferta } from "@/lib/crm-server";
import {
  AVISO_PERFORMANCE,
  PUBLICOS,
  ROTULO_FORCA,
  chaveDaOferta,
  type ForcaEvidencia,
  type ProgramaChave,
  type SugestaoOferta,
} from "@/lib/oportunidades";

/**
 * Montar oferta — a tela onde o diagnóstico vira oportunidade.
 *
 * O sistema marca o que a evidência sustenta e escreve o porquê em cada linha;
 * o vendedor cura. O que é HIPÓTESE nunca vem marcado: propor sem medição é
 * decisão de quem vende, não do sistema.
 *
 * O visual mora em src/styles/montar-oferta.css, escopado em .kx-oferta.
 */

const ORDEM: ProgramaChave[] = ["executivo", "lideranca", "performance"];

const CLASSE_PUBLICO: Record<ProgramaChave, { card: string; selo: string }> = {
  executivo: { card: "p-exec", selo: "s-exec" },
  lideranca: { card: "p-lid", selo: "s-lid" },
  performance: { card: "p-time", selo: "s-time" },
};

const CLASSE_FORCA: Record<ForcaEvidencia, string> = {
  forte: "r-forte",
  atencao: "r-media",
  hipotese: "r-livre",
};

const CLASSE_FAIXA: Record<"hi" | "mid" | "lo", string> = { hi: "a-good", mid: "a-warn", lo: "a-crit" };

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

function dataCurta(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  return `${d.getDate()} de ${MESES[d.getMonth()]}`;
}

export function MontarOferta({
  dados,
  salvando,
  onSalvar,
}: {
  dados: OfertaParaMontar;
  salvando: boolean;
  onSalvar: (itens: ItemDaOferta[]) => void;
}) {
  const [marcadas, setMarcadas] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      dados.sugestoes.map((s) => [chaveDaOferta(s), s.preSelecionada && !s.jaExiste]),
    ),
  );

  const porPublico = useMemo(() => {
    const mapa = new Map<ProgramaChave, SugestaoOferta[]>();
    for (const s of dados.sugestoes) mapa.set(s.programa, [...(mapa.get(s.programa) ?? []), s]);
    return mapa;
  }, [dados.sugestoes]);

  const selecionadas = dados.sugestoes.filter((s) => marcadas[chaveDaOferta(s)] && !s.jaExiste);
  const publicosSelecionados = [...new Set(selecionadas.map((s) => s.programa))];

  const frageis = dados.dimensoes.filter((d) => d.faixa === "lo");
  const atencao = dados.dimensoes.filter((d) => d.faixa === "mid");
  const fortes = dados.dimensoes.filter((d) => d.faixa === "hi");

  function alterna(chave: string) {
    setMarcadas((m) => ({ ...m, [chave]: !m[chave] }));
  }

  function salvar() {
    onSalvar(
      selecionadas.map((s) => ({
        programa: s.programa,
        formato: s.formato,
        treinamento: s.treinamento,
        lider_id: s.lider_id,
        dimensoes: s.dimensoes,
        forca_evidencia: s.forca,
        evidencia_resumo: s.resumo,
        evidencia: s.evidencia,
        origem: "diagnostico",
      })),
    );
  }

  const quemLeu =
    dados.totalLideres === 1 && dados.lideres[0]
      ? `A leitura de ${dados.lideres[0].nome}${dados.lideres[0].cargo ? ` (${dados.lideres[0].cargo})` : ""}`
      : `A leitura de ${dados.totalLideres} líderes`;

  return (
    <div className="kx-oferta">
      <div className="wrap">
        <header className="head">
          <div className="tag">
            {dados.concluidoEm ? `Diagnóstico concluído · ${dataCurta(dados.concluidoEm)}` : "Diagnóstico em campo"}
          </div>
          <h1>{dados.cliente.empresa}</h1>
          <div className="contato">
            {dados.cliente.responsavel_nome && (
              <span className="cchip">
                <b>{dados.cliente.responsavel_nome}</b>
                {dados.cliente.responsavel_cargo ? ` · ${dados.cliente.responsavel_cargo}` : ""}
              </span>
            )}
            {dados.cliente.responsavel_email && <span className="cchip">{dados.cliente.responsavel_email}</span>}
            {dados.cliente.responsavel_telefone && <span className="cchip">{dados.cliente.responsavel_telefone}</span>}
            <span className="cchip num">
              {dados.totalLideres} {dados.totalLideres === 1 ? "líder avaliado" : "líderes avaliados"} ·{" "}
              {dados.totalRespondentes} {dados.totalRespondentes === 1 ? "resposta" : "respostas"}
            </span>
          </div>
        </header>

        <div className="evidencia">
          <div className="tag" style={{ color: "var(--brand)" }}>
            O que o diagnóstico mostrou
          </div>
          <h2>
            Índice geral {dados.indiceGeral ?? "—"}
            {fortes.length === 0
              ? " — nenhuma competência na faixa forte"
              : ` — ${fortes.length} ${fortes.length === 1 ? "competência" : "competências"} na faixa forte`}
          </h2>
          <p className="lead">
            {quemLeu}{" "}
            {frageis.length > 0 ? (
              <>
                aponta fragilidade em{" "}
                {frageis.map((d, i) => (
                  <span key={d.chave}>
                    {i > 0 && (i === frageis.length - 1 ? " e " : ", ")}
                    <b>
                      {d.nome} ({d.valor})
                    </b>
                  </span>
                ))}
                {atencao.length > 0 && `, com ${atencao.length === 1 ? "outra" : `outras ${atencao.length}`} em zona de atenção`}.
              </>
            ) : atencao.length > 0 ? (
              <>
                não aponta nenhuma fragilidade, mas deixa{" "}
                <b>
                  {atencao.length} {atencao.length === 1 ? "dimensão" : "dimensões"} em zona de atenção
                </b>{" "}
                — o momento de agir antes de quebrar.
              </>
            ) : (
              <>não aponta fragilidade: a liderança está inteira na faixa forte.</>
            )}
            {dados.totalLideres === 1 && (
              <>
                {" "}
                <b>É leitura de um líder só</b> — não afirma padrão de cultura.
              </>
            )}
          </p>
          <div className="achados">
            {dados.dimensoes.map((d) => (
              <span key={d.chave} className={`achado ${CLASSE_FAIXA[d.faixa]}`}>
                {d.nome} <span className="num">{d.valor}</span>
              </span>
            ))}
          </div>
          <div className="links">
            {dados.lideres[0]?.id && (
              <a href={`/admin/diagnosticos/lider/${dados.lideres[0].id}`}>Ver o recorte do líder →</a>
            )}
            <a href={`/admin/diagnosticos/empresa/${dados.cliente.id}`}>Ver o mapa da empresa →</a>
            <a href={`/diagnosticos/${dados.cliente.chave}`} target="_blank" rel="noopener noreferrer">
              Abrir painel do cliente ↗
            </a>
          </div>
        </div>

        <section>
          <div className="sec-head">
            <div className="tag" style={{ color: "var(--brand)" }}>
              Montagem da oferta
            </div>
            <h2>O que dá para oferecer a esta empresa</h2>
            <p>
              O sistema marca o que a evidência sustenta e mostra o porquê de cada indicação. Você ajusta, tira o
              que não faz sentido e acrescenta o que a conversa pedir — a curadoria é sua.
            </p>
          </div>

          {ORDEM.filter((p) => porPublico.has(p)).map((programa) => {
            const itens = porPublico.get(programa) ?? [];
            const pub = PUBLICOS[programa];
            const classe = CLASSE_PUBLICO[programa];
            const sinal = dados.sinais[programa];

            return (
              <div key={programa} className={`publico ${classe.card}`}>
                <div className="pub-top">
                  <div>
                    <div className="pub-nome">{pub.nome}</div>
                    <div className="pub-quem">{pub.quem}</div>
                  </div>
                  <span className={`selo ${classe.selo}`}>
                    Público ·{" "}
                    {programa === "executivo" ? "Executivo" : programa === "lideranca" ? "Líder" : "Time"}
                  </span>
                </div>

                {programa === "performance" ? (
                  <p className="semdado">
                    <b>Atenção:</b> {AVISO_PERFORMANCE}
                  </p>
                ) : sinal ? (
                  <p className="pub-sinal">
                    <b>Sinal encontrado:</b> {sinal}
                  </p>
                ) : null}

                <div className="produtos">
                  {itens.map((s) => {
                    const chave = chaveDaOferta(s);
                    const marcada = Boolean(marcadas[chave]) && !s.jaExiste;
                    return (
                      <label
                        key={chave}
                        className="produto"
                        data-sel={marcada ? "1" : ""}
                        data-ja={s.jaExiste ? "1" : ""}
                      >
                        <input
                          type="checkbox"
                          checked={marcada}
                          disabled={s.jaExiste}
                          onChange={() => alterna(chave)}
                        />
                        <span>
                          <span className="nome">{s.nome}</span>
                          <span className="porque">
                            <b>{s.rotulo}:</b> {s.resumo}
                          </span>
                        </span>
                        <span className={`rec ${s.jaExiste ? "r-ja" : CLASSE_FORCA[s.forca]}`}>
                          {s.jaExiste ? "Já no funil" : ROTULO_FORCA[s.forca]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {!dados.sugestoes.length && (
            <p className="semdado">
              Ainda não há evidência suficiente para montar uma oferta: o diagnóstico precisa de pelo menos um
              líder com respostas.
            </p>
          )}
        </section>
      </div>

      <div className="barra">
        <div className="wrap">
          <div className="resumo">
            <div className="linha">
              {selecionadas.length
                ? `${selecionadas.length} ${selecionadas.length === 1 ? "produto selecionado" : "produtos selecionados"} · ${publicosSelecionados.length} ${publicosSelecionados.length === 1 ? "público" : "públicos"}`
                : "Nenhum produto selecionado"}
            </div>
            <div className="det">
              {selecionadas.length
                ? publicosSelecionados.map((p) => PUBLICOS[p].nome).join(" · ")
                : "Marque ao menos um produto para criar a oportunidade"}
            </div>
          </div>
          <div className="acoes">
            <button className="btn" onClick={salvar} disabled={!selecionadas.length || salvando}>
              {salvando ? "Criando..." : "Criar oportunidade no funil →"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
