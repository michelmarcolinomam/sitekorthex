/**
 * Tela de RESULTADO do líder — o recorte individual.
 *
 * O componente é burro de propósito: recebe os dados prontos e desenha. Hoje
 * quem alimenta é o exemplo em src/lib/resultado-exemplo.ts; quando o motor de
 * cálculo existir, ele passa a montar este mesmo objeto a partir das respostas
 * e nada aqui muda.
 *
 * O visual mora em src/styles/resultado-lider.css, escopado em .kx-resultado.
 */

export type Severidade = "crit" | "warn" | "good" | "inv";

export interface DimensaoResultado {
  nome: string;
  /** Nulo quando aquela ótica ainda não respondeu. */
  time: number | null;
  exec: number | null;
  gap: number | null;
  /** Rótulo da pílula: "fratura", "atenção", "consenso", "invertido". */
  rotulo: string;
  severidade: Severidade;
}

export interface ItemLista {
  texto: string;
  destaque: string;
  tom: "good" | "crit";
}

export interface LeituraDimensao extends DimensaoResultado {
  /** Parágrafo de leitura. Trechos entre **asteriscos** viram destaque. */
  narrativa: string;
  tituloImpacto: string;
  impactos: ItemLista[];
}

export interface Treinamento {
  ordem: string;
  severidade: Severidade;
  rotulo: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  entregas: string[];
  marcaPorque?: string;
  porque: string;
}

export interface CaminhoCompleto {
  rotulo: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  eixos: string[];
  constroi: string[];
  rodape: string[];
}

export interface ResultadoLiderDados {
  lider: string;
  meta: string;
  respondentesTime: string;
  respondentesExec: string;
  indiceTime: number;
  indiceExec: number;
  divergencia: string;
  insight: string;
  dimensoes: DimensaoResultado[];
  forcas: ItemLista[];
  vulnerabilidades: ItemLista[];
  leituras: LeituraDimensao[];
  ofertaTitulo: string;
  ofertaTexto: string;
  treinamentos: Treinamento[];
  caminho: CaminhoCompleto;
}

/** Converte **trecho** em <strong>, para os textos ficarem legíveis nos dados. */
function comDestaques(texto: string) {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? <strong key={i}>{parte}</strong> : <span key={i}>{parte}</span>,
  );
}

function Lista({ itens }: { itens: ItemLista[] }) {
  return (
    <div className="lista">
      {itens.map((item, i) => (
        <div className="item" key={i}>
          <span className={`b b-${item.tom}`} />
          <span>
            <b>{item.destaque}</b> {item.texto}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ResultadoLider({ dados }: { dados: ResultadoLiderDados }) {
  return (
    <div className="kx-resultado">
      <div className="topbar">
        <div className="wrap">
          <div className="wordmark">
            Korthe<span>x</span>
          </div>
          <div className="tag">Recorte individual · confidencial</div>
        </div>
      </div>

      <div className="wrap">
        <header className="head">
          <div className="tag tag-brand">Diagnóstico de Liderança</div>
          <h1>{dados.lider}</h1>
          <p className="meta">{dados.meta}</p>
          <div className="oticas">
            <span className="otica otica-time">
              <i />
              Visão do time <b className="num">{dados.respondentesTime}</b>
            </span>
            <span className="otica otica-exec">
              <i />
              Visão do executivo <b className="num">{dados.respondentesExec}</b>
            </span>
          </div>
        </header>

        <div className="resumo">
          <div className="kpi">
            <div className="v num">
              {dados.indiceTime}
              <small>/100</small>
            </div>
            <div className="k tag">Índice · Time</div>
            <div className="d">Como a equipe experimenta a liderança</div>
          </div>
          <div className="kpi">
            <div className="v num">
              {dados.indiceExec}
              <small>/100</small>
            </div>
            <div className="k tag">Índice · Executivo</div>
            <div className="d">Como os sócios avaliam a liderança</div>
          </div>
          <div className="kpi kpi-div">
            <div className="v num">{dados.divergencia}</div>
            <div className="k tag">Divergência média</div>
            <div className="d">O topo enxerga melhor que a base sente</div>
          </div>
        </div>

        <section>
          <div className="insight">
            <div className="tag tag-brand">O ponto que abre a conversa</div>
            <p>{comDestaques(dados.insight)}</p>
          </div>
        </section>

        <section>
          <div className="abre">
            <div className="risca" />
            <h2>As duas leituras, lado a lado</h2>
            <p className="lead">
              Cada dimensão foi avaliada por dois grupos diferentes, na mesma escala de 0 a 100.{" "}
              <b>Quanto maior a distância entre as duas barras, mais as óticas discordam</b> — e é
              exatamente aí que mora a conversa que este diagnóstico abre.
            </p>

            <div className="comoler-box">
              <div className="clr">
                <span className="s s-time" />
                <div>
                  <b>Barra de cima · Time</b>
                  <span className="t">Como a equipe sente a liderança no dia a dia</span>
                </div>
              </div>
              <div className="clr">
                <span className="s s-exec" />
                <div>
                  <b>Barra de baixo · Executivo</b>
                  <span className="t">Como sócios e diretoria avaliam a liderança</span>
                </div>
              </div>
              <div className="clr">
                <span className="s s-gap" />
                <div>
                  <b>A diferença · Gap</b>
                  <span className="t">O tamanho do desalinhamento entre as duas visões</span>
                </div>
              </div>
            </div>
          </div>

          <div className="reguas">
            {dados.dimensoes.map((d) => (
              <div className="dim" key={d.nome}>
                <div className="dim-top">
                  <span className="dim-nome">{d.nome}</span>
                  <span className={`pill pill-${d.severidade}`}>
                    {d.gap === null ? d.rotulo : `Gap ${d.gap} · ${d.rotulo}`}
                  </span>
                </div>
                <div className="brow">
                  <span className="btag btag-time">Time</span>
                  <div className="bar">
                    <div className="fill fill-time" style={{ width: `${d.time ?? 0}%` }} />
                  </div>
                  <span className="bval num">{d.time ?? "—"}</span>
                </div>
                <div className="brow">
                  <span className="btag btag-exec">Exec</span>
                  <div className="bar">
                    <div className="fill fill-exec" style={{ width: `${d.exec ?? 0}%` }} />
                  </div>
                  <span className="bval num">{d.exec ?? "—"}</span>
                </div>
              </div>
            ))}

            <div className="escala">
              <span>0 · não demonstra</span>
              <span>50</span>
              <span>100 · referência</span>
            </div>

            <div className="legenda">
              <span className="leg">
                Ordenado da maior fratura ao maior consenso — a primeira linha é onde a companhia
                mais sente.
              </span>
            </div>
          </div>
        </section>

        <section>
          <div className="sec-head">
            <div className="tag">Síntese</div>
            <h2>Forças &amp; vulnerabilidades</h2>
          </div>
          <div className="duo">
            <div className="bloco">
              <div className="tag" style={{ color: "var(--good)" }}>
                Forças a preservar
              </div>
              <h3>O que já sustenta</h3>
              <Lista itens={dados.forcas} />
            </div>
            <div className="bloco">
              <div className="tag" style={{ color: "var(--crit)" }}>
                Vulnerabilidades a desenvolver
              </div>
              <h3>O que precisa de resposta</h3>
              <Lista itens={dados.vulnerabilidades} />
            </div>
          </div>
        </section>

        <section>
          <div className="sec-head">
            <div className="tag">Leitura por dimensão</div>
            <h2>O que cada número significa para a companhia</h2>
            <p>
              O coração do diagnóstico: cada dimensão lida não como nota, mas como consequência no
              negócio.
            </p>
          </div>

          <div className="leitura">
            {dados.leituras.map((l) => (
              <article className={`card-dim sev-${l.severidade}`} key={l.nome}>
                <div className="cd-top">
                  <h3>{l.nome}</h3>
                  <div className="cd-nums">
                    <span>
                      Time <b>{l.time ?? "—"}</b>
                    </span>
                    <span>
                      Exec <b>{l.exec ?? "—"}</b>
                    </span>
                    {l.gap !== null ? (
                      <span>
                        Gap <b>{l.gap}</b>
                        {l.severidade === "inv" ? " invertido" : ""}
                      </span>
                    ) : null}
                  </div>
                </div>
                <p className="cd-texto">{comDestaques(l.narrativa)}</p>
                <div className="impacto">
                  <div className="tag">{l.tituloImpacto}</div>
                  <Lista itens={l.impactos} />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="oferta-topo">
            <div className="tag">Da análise à solução</div>
            <h2>{dados.ofertaTitulo}</h2>
            <p>{dados.ofertaTexto}</p>
          </div>

          <div className="treinos">
            {dados.treinamentos.map((tr) => (
              <article className={`treino t-${tr.severidade}`} key={tr.titulo}>
                <div className="t-head">
                  <div className={`t-idx t-idx-${tr.severidade}`}>{tr.ordem}</div>
                  <div className="t-corpo">
                    <div className="tag" style={{ color: `var(--${tr.severidade})` }}>
                      {tr.rotulo}
                    </div>
                    <h3>{tr.titulo}</h3>
                    <div className="sub">{tr.subtitulo}</div>
                    <p className="desc">{comDestaques(tr.descricao)}</p>

                    <div className="tag chips-rot">O que este treinamento desenvolve</div>
                    <div className="chips">
                      {tr.entregas.map((e) => (
                        <span className="chip" key={e}>
                          {e}
                        </span>
                      ))}
                    </div>

                    <p className={`porque porque-${tr.severidade}`}>
                      {tr.marcaPorque ? (
                        <span className={`marca m-${tr.severidade}`}>{tr.marcaPorque}</span>
                      ) : null}
                      {comDestaques(tr.porque)}
                    </p>
                  </div>
                </div>
              </article>
            ))}

            <article className="treino t-caminho">
              <div className="t-head">
                <div className="t-idx t-idx-brand">★</div>
                <div className="t-corpo">
                  <div className="tag tag-brand">{dados.caminho.rotulo}</div>
                  <h3>{dados.caminho.titulo}</h3>
                  <div className="sub">{dados.caminho.subtitulo}</div>
                  <p className="desc">{comDestaques(dados.caminho.descricao)}</p>

                  <div className="tag chips-rot">Os eixos que desenvolvemos</div>
                  <div className="eixos">
                    {dados.caminho.eixos.map((eixo, i) => (
                      <div className="eixo" key={eixo}>
                        <span className="n">{String(i + 1).padStart(2, "0")}</span>
                        <span>{eixo}</span>
                      </div>
                    ))}
                  </div>

                  <div className="tag chips-rot">O que constrói ao longo do tempo</div>
                  <div className="chips">
                    {dados.caminho.constroi.map((c) => (
                      <span className="chip" key={c}>
                        {c}
                      </span>
                    ))}
                  </div>

                  <p className="porque">
                    {dados.caminho.rodape.map((linha, i) => (
                      <span key={i}>
                        {i > 0 ? <br /> : null}
                        {comDestaques(linha)}
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            </article>
          </div>
        </section>

        <div className="comoler">
          <b>Como ler:</b> cada índice (0–100) é o resultado agregado das respostas de todos os
          avaliadores daquela ótica, normalizado por dimensão. A <b>visão do time</b> reúne quem é
          liderado pela pessoa; a <b>visão do executivo</b> reúne sócios e diretoria. O <b>gap</b> é
          a distância entre as duas leituras. Faixa de severidade:{" "}
          <b style={{ color: "var(--good)" }}>verde</b> = força/consenso,{" "}
          <b style={{ color: "var(--warn)" }}>âmbar</b> = atenção,{" "}
          <b style={{ color: "var(--crit)" }}>vermelho</b> = vulnerabilidade. Dados agregados e
          anônimos; nenhum respondente é identificável.
        </div>

        <footer>
          <span>© MMXXVI Korthex · Inteligência &amp; Desenvolvimento</span>
          <span>Recorte individual confidencial</span>
        </footer>
      </div>
    </div>
  );
}
