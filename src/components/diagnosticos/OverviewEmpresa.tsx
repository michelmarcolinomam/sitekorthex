/**
 * Panorama da liderança — o resultado de nível 2, a empresa inteira.
 *
 * Igual à tela do líder: recebe os dados prontos e desenha. O visual mora em
 * src/styles/overview-empresa.css, escopado em .kx-overview.
 */

export type Faixa = "hi" | "mid" | "lo";

export interface DimensaoEmpresa {
  nome: string;
  curto: string;
  valor: number;
  faixa: Faixa;
  rotulo: string;
}

export interface LiderNaMatriz {
  nome: string;
  cargo: string | null;
  /** Um valor por dimensão, na ordem de `dimensoes`. */
  celulas: { valor: number | null; faixa: Faixa | null }[];
  media: number;
  faixaMedia: Faixa;
  classificacao: string;
  chipClasse: string;
}

export interface ItemCultura {
  destaque: string;
  texto: string;
  tom: "good" | "crit";
}

export interface OfertaGrupo {
  rotulo: string;
  titulo: string;
  subtitulo: string;
  descricao: string;
  desenvolve: string[];
  destrava: string[];
  porque: string;
  faixa: Faixa;
  nota?: string;
}

export interface OverviewEmpresaDados {
  empresa: string;
  meta: string;
  indiceGeral: number;
  indiceTime: number | null;
  indiceExec: number | null;
  divergencia: string;
  insight: string;
  /** Ordenadas da mais frágil para a mais forte. */
  dimensoes: DimensaoEmpresa[];
  /** Coluna marcada como dívida da cultura, pelo nome curto. */
  colunasDebito: string[];
  matriz: LiderNaMatriz[];
  mediaLinha: { celulas: { valor: number; faixa: Faixa }[]; media: number };
  forcas: ItemCultura[];
  dividas: ItemCultura[];
  ofertaPrioritaria: OfertaGrupo | null;
  ofertasPreventivas: OfertaGrupo[];
  complementares: ItemCultura[];
}

function comDestaques(texto: string) {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? <strong key={i}>{parte}</strong> : <span key={i}>{parte}</span>,
  );
}

function Lista({ itens }: { itens: ItemCultura[] }) {
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

function CardOferta({ oferta, prioritaria }: { oferta: OfertaGrupo; prioritaria?: boolean }) {
  return (
    <div className={`card-oferta ${prioritaria ? "prio" : "aten"}`}>
      {prioritaria ? (
        <div className="tag" style={{ color: "var(--crit)" }}>{oferta.rotulo}</div>
      ) : (
        <div className="origem">
          <span className="dim">{oferta.rotulo}</span>
        </div>
      )}
      <h3>{oferta.titulo}</h3>
      <div className="sub">{oferta.subtitulo}</div>
      <p className="desc">{comDestaques(oferta.descricao)}</p>

      <div className="colunas">
        <div>
          <div className="tag">O que o grupo desenvolve</div>
          <div className="chips">
            {oferta.desenvolve.map((c) => (
              <span className="chip" key={c}>{c}</span>
            ))}
          </div>
        </div>
        <div>
          <div className="tag">O que isso destrava na operação</div>
          <div className="chips">
            {oferta.destrava.map((c) => (
              <span className="chip" key={c}>{c}</span>
            ))}
          </div>
        </div>
      </div>

      <p className={prioritaria ? "porque-agora" : "porque-agora"}>{comDestaques(oferta.porque)}</p>
      {oferta.nota ? <p className="combina">{comDestaques(oferta.nota)}</p> : null}
    </div>
  );
}

export function OverviewEmpresa({ dados }: { dados: OverviewEmpresaDados }) {
  return (
    <div className="kx-overview">
      <div className="topbar">
        <div className="wrap">
          <div className="wordmark">Korthe<span>x</span></div>
          <div className="tag">Nível 2 · empresa · confidencial</div>
        </div>
      </div>

      <div className="wrap">
        <header className="head">
          <div className="tag tag-brand">Panorama da Liderança</div>
          <h1>{dados.empresa}</h1>
          <p className="meta">{dados.meta}</p>
        </header>

        <div className="resumo">
          <div className="kpi kpi-geral">
            <div className="v num">{dados.indiceGeral}<small>/100</small></div>
            <div className="k tag">Índice geral de liderança</div>
            <div className="d">Maturidade média da liderança da empresa</div>
          </div>
          <div className="kpi kpi-time">
            <div className="v num">{dados.indiceTime ?? "—"}</div>
            <div className="k tag">Visão do time</div>
            <div className="d">Como as equipes experimentam</div>
          </div>
          <div className="kpi kpi-exec">
            <div className="v num">{dados.indiceExec ?? "—"}</div>
            <div className="k tag">Visão do executivo</div>
            <div className="d">Como os sócios avaliam</div>
          </div>
          <div className="kpi kpi-div">
            <div className="v num">{dados.divergencia}</div>
            <div className="k tag">Divergência sistêmica</div>
            <div className="d">O quanto o topo enxerga acima da base</div>
          </div>
        </div>

        <section>
          <div className="insight">
            <div className="tag tag-brand">O padrão que atravessa a empresa</div>
            <p>{comDestaques(dados.insight)}</p>
          </div>
        </section>

        <section>
          <div className="sec-head">
            <div className="tag">Competências</div>
            <h2>Mapa das competências da liderança</h2>
            <p>Onde a liderança da empresa é forte — e onde é frágil. Ordenado da maior fragilidade ao maior consenso.</p>
          </div>

          <div className="mapa">
            {dados.dimensoes.map((d) => (
              <div className="crow" key={d.nome}>
                <div className="crow-top">
                  <span className="crow-nome">{d.nome}</span>
                  <span className="crow-dir">
                    <span className={`pill p-${d.faixa}`}>{d.rotulo}</span>
                    <span className={`crow-val v-${d.faixa} num`}>{d.valor}</span>
                  </span>
                </div>
                <div className="track"><i className={`f-${d.faixa}`} style={{ width: `${d.valor}%` }} /></div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="sec-head">
            <div className="tag">A matriz</div>
            <h2>Cada líder, cada competência</h2>
            <p>
              O retrato completo. Leia por <b>coluna</b>: quando a cor ruim desce a coluna inteira, deixou de
              ser pessoa e virou cultura. Leia por <b>linha</b> para achar quem precisa de acompanhamento
              individual.
            </p>
          </div>

          <div className="matriz-wrap">
            <table>
              <thead>
                <tr>
                  <th className="rowh">Líder</th>
                  {dados.dimensoes.map((d) => (
                    <th key={d.curto} className={dados.colunasDebito.includes(d.curto) ? "col-debito" : undefined}>
                      {d.curto}
                    </th>
                  ))}
                  <th className="media-col">Média</th>
                </tr>
              </thead>
              <tbody>
                {dados.matriz.map((l) => (
                  <tr key={l.nome}>
                    <td className="rowh">
                      <div className="lname">{l.nome}</div>
                      {l.cargo ? <div className="lrole">{l.cargo}</div> : null}
                    </td>
                    {l.celulas.map((c, i) => (
                      <td key={i} className={`cell ${c.faixa ? `c-${c.faixa}` : ""}`}>
                        {c.valor ?? "—"}
                      </td>
                    ))}
                    <td className="cell media-col">{l.media}</td>
                  </tr>
                ))}
                <tr className="linha-media">
                  <td className="rowh">Média da empresa</td>
                  {dados.mediaLinha.celulas.map((c, i) => (
                    <td key={i} className={`cell c-${c.faixa}`}>{c.valor}</td>
                  ))}
                  <td className="cell media-col">{dados.mediaLinha.media}</td>
                </tr>
              </tbody>
            </table>
            <div className="legenda-mx">
              <span className="lg"><i className="f-hi" />70+ · forte</span>
              <span className="lg"><i className="f-mid" />55–69 · atenção</span>
              <span className="lg"><i className="f-lo" />abaixo de 55 · frágil</span>
              {dados.colunasDebito.length ? (
                <span className="lg" style={{ color: "var(--crit)" }}>
                  {dados.colunasDebito.length === 1 ? "A coluna marcada é" : "As colunas marcadas são"} a dívida da cultura
                </span>
              ) : null}
            </div>
          </div>
        </section>

        <section>
          <div className="sec-head">
            <div className="tag">Padrão sistêmico</div>
            <h2>O que a empresa tem e o que a empresa deve</h2>
          </div>
          <div className="duo">
            <div className="bloco">
              <div className="tag" style={{ color: "var(--good)" }}>Força da cultura</div>
              <h3>O que já está no grupo</h3>
              {dados.forcas.length ? (
                <Lista itens={dados.forcas} />
              ) : (
                <p className="item">Nenhuma competência alcançou a faixa forte nesta rodada.</p>
              )}
            </div>
            <div className="bloco">
              <div className="tag" style={{ color: "var(--crit)" }}>Dívida da cultura</div>
              <h3>O que a empresa está pagando</h3>
              {dados.dividas.length ? (
                <Lista itens={dados.dividas} />
              ) : (
                <p className="item">Nenhuma competência está abaixo da média da empresa.</p>
              )}
            </div>
          </div>
        </section>

        <section>
          <div className="sec-head">
            <div className="tag">Ranking</div>
            <h2>Ranking dos líderes</h2>
            <p>Pela média das duas óticas. A faixa indica o tipo de acompanhamento que cada um pede.</p>
          </div>
          <div className="rank">
            {dados.matriz.map((l, i) => (
              <div className="rrow" key={l.nome}>
                <span className="rpos num">{i + 1}º</span>
                <div className="rid">
                  <div className="lname">{l.nome}</div>
                  {l.cargo ? <div className="lrole">{l.cargo}</div> : null}
                </div>
                <div className="rbar"><i className={`f-${l.faixaMedia}`} style={{ width: `${l.media}%` }} /></div>
                <span className={`rval v-${l.faixaMedia} num`}>{l.media}</span>
                <span className={`rchip ${l.chipClasse}`}>{l.classificacao}</span>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="oferta-topo">
            <div className="tag">Da análise à solução · nível empresa</div>
            <h2>Um padrão de cultura pede uma resposta de cultura.</h2>
            <p>
              Quando a mesma fraqueza aparece em quase todos os líderes, treinar um por um é caro e lento. A
              resposta certa é desenvolver a liderança como grupo — corrigindo o que já está frágil,
              fortalecendo o que é ponto de atenção antes que vire dívida, e dando acompanhamento individual a
              quem está mais distante.
            </p>
          </div>

          {dados.ofertaPrioritaria ? <CardOferta oferta={dados.ofertaPrioritaria} prioritaria /> : null}

          {dados.ofertasPreventivas.length ? (
            <>
              <div className="oferta-topo sub">
                <div className="tag">Frentes preventivas · pontos de atenção</div>
                <h2>Corrigir antes de virar dívida.</h2>
                <p>
                  Estas dimensões ainda não estão frágeis — mas estão em zona de atenção. Treiná-las agora, em
                  grupo, custa uma fração do que custa recuperá-las depois de quebradas.
                </p>
              </div>
              {dados.ofertasPreventivas.map((o) => (
                <CardOferta oferta={o} key={o.titulo + o.rotulo} />
              ))}
            </>
          ) : null}

          {dados.complementares.length ? (
            <div className="card-oferta" style={{ borderLeftColor: "var(--brand)" }}>
              <div className="tag tag-brand">Frentes complementares</div>
              <h3>Quem puxa para baixo e quem pode puxar para cima</h3>
              <div className="lista" style={{ marginTop: 18 }}>
                {dados.complementares.map((c, i) => (
                  <div className="item" key={i}>
                    <span className={`b b-${c.tom}`} />
                    <span><b>{c.destaque}</b> {c.texto}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <div className="comoler">
          <b>Como ler:</b> cada índice (0–100) é a média das avaliações agregadas por dimensão, consolidada
          entre todos os líderes. A <b>matriz</b> combina as duas óticas (time e executivo) num índice único
          por líder. Fraquezas que se repetem em vários líderes indicam <b>padrão de cultura</b> (frente de
          grupo); fraquezas concentradas em um líder indicam <b>caso individual</b> (mentoria). Dados
          agregados e anônimos; nenhum respondente é identificável.
        </div>

        <footer>
          <span>© MMXXVI Korthex · Inteligência &amp; Desenvolvimento</span>
          <span>Panorama da liderança · confidencial</span>
        </footer>
      </div>
    </div>
  );
}
