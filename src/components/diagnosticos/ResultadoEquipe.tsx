import type { ResultadoEquipeDados, ItemSintese, ModoEquipe } from "@/lib/equipe-textos";

/**
 * Recorte da EQUIPE — os três modos do mesmo diagnóstico.
 *
 *   lideranca  · como quem conduz a equipe enxerga (gestão)
 *   executivo  · como quem cobra o resultado enxerga (entrega)
 *   cruzado    · as duas leituras lado a lado, com a distância marcada
 *
 * ★ NADA AQUI É INDIVIDUALIZADO. A unidade é a equipe: não há nome, ranking
 * nem recorte por pessoa em lugar nenhum da tela — e a nota de método diz isso
 * ao leitor, porque é o que impede o instrumento de virar avaliação de
 * desempenho por tabela.
 *
 * Visual base em resultado-lider.css; o que muda, em resultado-equipe.css.
 */

const RECORTES: { modo: ModoEquipe; rotulo: string }[] = [
  { modo: "lideranca", rotulo: "Visão da liderança" },
  { modo: "executivo", rotulo: "Visão do executivo" },
  { modo: "cruzado", rotulo: "As duas visões" },
];

function comDestaques(texto: string) {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? <strong key={i}>{parte}</strong> : <span key={i}>{parte}</span>,
  );
}

function Sintese({ itens }: { itens: ItemSintese[] }) {
  return (
    <div className="sintese">
      {itens.map((i) => (
        <div className="sit" key={i.nome}>
          <div className="sit-top">
            <span className="sit-nome">{i.nome}</span>
            <span className={`sit-valor num v-${i.severidade}`}>{i.valor}</span>
          </div>
          <div className="sit-sub">
            <span className={`ponto p-${i.severidade}`} />
            {i.rotulo} · {i.custo}
          </div>
        </div>
      ))}
    </div>
  );
}

export function ResultadoEquipe({
  dados,
  linkDoRecorte,
}: {
  dados: ResultadoEquipeDados;
  /** Como montar o link de cada recorte — a rota decide. */
  linkDoRecorte: (modo: ModoEquipe) => string;
}) {
  const cruzado = dados.modo === "cruzado";
  const pior = dados.dimensoes[0];

  return (
    <div className="kx-resultado kx-equipe">
      <div className="topbar">
        <div className="wrap">
          <div className="wordmark">
            Korthe<span>x</span>
          </div>
          <div className="tag">Recorte da equipe · confidencial</div>
        </div>
      </div>

      <div className="wrap">
        <header className="head">
          <div className="tag tag-brand">Diagnóstico da Equipe</div>
          <h1>{dados.equipe}</h1>
          <p className="meta">{dados.meta}</p>

          <nav className="recortes" aria-label="Recortes deste diagnóstico">
            {RECORTES.map((r) => (
              <a
                key={r.modo}
                href={linkDoRecorte(r.modo)}
                aria-current={r.modo === dados.modo ? "page" : undefined}
              >
                {r.rotulo}
              </a>
            ))}
          </nav>
        </header>

        {dados.equipePequena ? (
          <div className="aviso-pequena">
            <b>Atenção:</b> esta equipe tem {dados.tamanho}{" "}
            {dados.tamanho === 1 ? "pessoa" : "pessoas"}. Com um grupo deste tamanho, o retrato
            deixa de ser de conjunto e passa a descrever indivíduos — leia como leitura de pessoa,
            não como cultura de equipe, e trate o resultado com o cuidado que isso exige.
          </div>
        ) : null}

        <div className={`resumo${cruzado ? "" : " resumo-3"}`}>
          {cruzado ? (
            <>
              <div className="kpi kpi-gestao">
                <div className="v num">
                  {dados.indiceLideranca ?? "—"}
                  <small>/100</small>
                </div>
                <div className="k tag">Visão da liderança</div>
                <div className="d">Como quem conduz a equipe enxerga</div>
              </div>
              <div className="kpi kpi-resultado">
                <div className="v num">
                  {dados.indiceExecutivo ?? "—"}
                  <small>/100</small>
                </div>
                <div className="k tag">Visão do executivo</div>
                <div className="d">Como quem cobra o resultado enxerga</div>
              </div>
              <div className="kpi kpi-div">
                <div className="v num">
                  {dados.divergencia === null
                    ? "—"
                    : `${dados.divergencia > 0 ? "+" : ""}${dados.divergencia}`}
                </div>
                <div className="k tag">Distância média</div>
                <div className="d">
                  {dados.divergenciaAncoras !== null
                    ? `${dados.divergenciaAncoras > 0 ? "+" : ""}${dados.divergenciaAncoras} nas frases idênticas`
                    : "Entre as duas leituras"}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className={`kpi ${dados.modo === "lideranca" ? "kpi-gestao" : "kpi-resultado"}`}>
                <div className="v num">
                  {(dados.modo === "lideranca" ? dados.indiceLideranca : dados.indiceExecutivo) ?? "—"}
                  <small>/100</small>
                </div>
                <div className="k tag">
                  {dados.modo === "lideranca" ? "Índice · gestão" : "Índice · resultado"}
                </div>
                <div className="d">
                  {dados.modo === "lideranca"
                    ? "Engajamento, cumprimento, diálogo e colaboração"
                    : "Entrega, prazo, erro e previsibilidade"}
                </div>
              </div>
              <div className="kpi">
                <div className="v num">{pior.valor}</div>
                <div className="k tag">{pior.nome}</div>
                <div className="d">A dimensão mais frágil nesta leitura</div>
              </div>
              <div className="kpi">
                <div className="v num">{dados.dimensoes.filter((d) => d.severidade !== "good").length}</div>
                <div className="k tag">Frentes abertas</div>
                <div className="d">Dimensões fora da faixa sólida</div>
              </div>
            </>
          )}
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
            <h2>
              {cruzado
                ? "As duas exigências, lado a lado"
                : dados.modo === "lideranca"
                  ? "A equipe pela ótica de quem a conduz"
                  : "A equipe pela ótica de quem cobra o resultado"}
            </h2>
            <p className="lead">
              {cruzado ? (
                <>
                  As perguntas de cada lado são diferentes, porque a exigência é diferente — mas as
                  seis dimensões e o peso de cada uma são os mesmos.{" "}
                  <b>
                    Em cada dimensão existe ainda uma frase idêntica nos dois questionários: é ela
                    que garante que a distância não vem da pergunta, e sim da leitura.
                  </b>
                </>
              ) : (
                <>
                  As seis dimensões do Korthex Performance, na escala de 0 a 100.{" "}
                  <b>Este é um dos três recortes deste diagnóstico</b> — a mesma equipe pode ser
                  lida pela outra ótica e pelas duas juntas.
                </>
              )}
            </p>
          </div>

          <div className="reguas">
            {dados.dimensoes.map((d) => (
              <div className="dim" key={d.chave}>
                <div className="dim-top">
                  <span className="dim-nome">{d.nome}</span>
                  <span className={`pill pill-${d.severidade}`}>
                    {cruzado && d.gap !== null && Math.abs(d.gap) >= 10
                      ? `${d.gap > 0 ? "+" : ""}${d.gap} · ${d.rotulo}`
                      : d.rotulo}
                  </span>
                </div>

                {cruzado ? (
                  <>
                    <div className="brow">
                      <span className="btag btag-gestao">Gestão</span>
                      <div className="bar">
                        <div className="fill fill-gestao" style={{ width: `${d.lideranca ?? 0}%` }} />
                      </div>
                      <span className="bval num">{d.lideranca ?? "—"}</span>
                    </div>
                    <div className="brow">
                      <span className="btag btag-resultado">Resultado</span>
                      <div className="bar">
                        <div className="fill fill-resultado" style={{ width: `${d.executivo ?? 0}%` }} />
                      </div>
                      <span className="bval num">{d.executivo ?? "—"}</span>
                    </div>
                    {d.ancora.lideranca !== null && d.ancora.executivo !== null ? (
                      <div className="ancora">
                        <span className="rot">Mesma frase</span>
                        gestão <b className="num">{d.ancora.lideranca}</b> · resultado{" "}
                        <b className="num">{d.ancora.executivo}</b>
                        {d.ancora.gap !== null && Math.abs(d.ancora.gap) >= 10
                          ? " — a diferença se confirma no item idêntico"
                          : " — no item idêntico, as leituras se aproximam"}
                      </div>
                    ) : null}
                  </>
                ) : (
                  <div className="brow">
                    <span className={`btag ${dados.modo === "lideranca" ? "btag-gestao" : "btag-resultado"}`}>
                      {dados.modo === "lideranca" ? "Gestão" : "Resultado"}
                    </span>
                    <div className="bar">
                      <div
                        className={`fill ${dados.modo === "lideranca" ? "fill-gestao" : "fill-resultado"}`}
                        style={{ width: `${d.valor}%` }}
                      />
                    </div>
                    <span className="bval num">{d.valor}</span>
                  </div>
                )}
              </div>
            ))}

            <div className="escala">
              <span>0 · não demonstra</span>
              <span>50</span>
              <span>100 · referência</span>
            </div>

            <div className="legenda">
              <span className="leg">
                Ordenado da dimensão mais frágil à mais sólida — a primeira linha é por onde o
                desenvolvimento começa.
              </span>
            </div>
          </div>

          <div className="nota-conjunto">
            <b>Leitura de conjunto:</b> este diagnóstico avalia a equipe como um todo. Não existe
            nota por pessoa, ranking interno nem recorte individual — nem aqui, nem no banco de
            dados. Avaliação pessoa a pessoa é outro instrumento, com outro contrato.
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
              {dados.forcas.length ? (
                <Sintese itens={dados.forcas} />
              ) : (
                <p className="sem-forca">
                  Nenhuma dimensão chegou à faixa sólida nesta leitura — o trabalho começa pela
                  base.
                </p>
              )}
            </div>
            <div className="bloco">
              <div className="tag" style={{ color: "var(--crit)" }}>
                Vulnerabilidades a desenvolver
              </div>
              <h3>O que precisa de resposta</h3>
              <Sintese itens={dados.vulnerabilidades} />
            </div>
          </div>
        </section>

        <section>
          <div className="sec-head">
            <div className="tag">Leitura dimensão a dimensão</div>
            <h2>O que cada número significa para a operação</h2>
            <p>Da mais frágil à mais sólida, com o custo concreto de cada fragilidade.</p>
          </div>

          <div className="leitura">
            {dados.dimensoes.map((d) => (
              <article className={`card-dim sev-${d.severidade}`} key={d.chave}>
                <div className="cd-top">
                  <h3>{d.nome}</h3>
                  <div className="cd-nums">
                    <b className="num">{d.valor}</b>
                    <span className={`pill pill-${d.severidade}`}>{d.rotulo}</span>
                  </div>
                </div>
                <p className="cd-texto">{comDestaques(d.narrativa)}</p>
                {cruzado && d.gap !== null && Math.abs(d.gap) >= 10 ? (
                  <p className="cd-texto">
                    {d.gap < 0 ? (
                      <>
                        Quem cobra o resultado marca <strong>{Math.abs(d.gap)} pontos abaixo</strong>{" "}
                        de quem conduz: a exigência do topo aqui é maior do que a gestão reconhece
                        como problema.
                      </>
                    ) : (
                      <>
                        Quem conduz marca <strong>{Math.abs(d.gap)} pontos abaixo</strong> de quem
                        cobra: o resultado chega, mas quem convive vê o custo de produzi-lo.
                      </>
                    )}
                  </p>
                ) : null}
                <div className="impacto">
                  <div className="tag">
                    {d.severidade === "good" ? "O que isso sustenta" : "Impacto na operação"}
                  </div>
                  <div className="lista">
                    {d.impactos.map((im, i) => (
                      <div className="item" key={i}>
                        <b>{im.destaque}</b> {im.texto}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="oferta-topo">
            <div className="tag">A resposta da Korthex</div>
            <h2>
              O diagnóstico mostrou onde a equipe trava.
              <br />
              Veja o treinamento que responde a isso.
            </h2>
            <p>
              Cada dimensão deste diagnóstico corresponde a um treinamento do Korthex Performance —
              não é preciso traduzir nada: o que está frágil já aponta a turma a abrir.
            </p>
          </div>

          <div className="sec-head sec-oferta">
            <div className="tag">Por onde começar</div>
            <h2>Os treinamentos que este diagnóstico indica</h2>
          </div>

          <div className="treinos">
            {dados.treinamentos.map((t, i) => (
              <article className={`treino t-${t.severidade === "crit" ? "crit" : "warn"}`} key={t.titulo}>
                <div className="t-head">
                  <span className={`t-idx t-idx-${t.severidade === "crit" ? "crit" : "warn"}`}>
                    {i + 1}º
                  </span>
                  <div className="t-corpo">
                    <h3>{t.titulo}</h3>
                    <span className="sub">Korthex Performance · treinamento em grupo</span>
                    <p className={`porque porque-${t.severidade === "crit" ? "crit" : "warn"}`}>
                      <b>Indicado porque:</b> {t.porque}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer>
          <div className="tag">Método</div>
          <p>
            Índice de 0 a 100 por dimensão. Faixas: até 55 frágil, 55 a 70 atenção, acima de 70
            sólido.{" "}
            {cruzado
              ? "As duas óticas respondem perguntas diferentes sobre as mesmas seis dimensões, com o mesmo número de itens em cada uma. Em cada dimensão há um item âncora — frase idêntica nos dois questionários — usado para verificar se a distância entre as leituras se sustenta."
              : "Esta é uma das duas óticas do diagnóstico da equipe; a outra e o cruzamento estão nos recortes acima."}
          </p>
          <p>
            <b>Sem recorte individual:</b> a unidade de análise é a equipe. Nenhum resultado deste
            diagnóstico identifica ou pontua uma pessoa.
          </p>
        </footer>
      </div>
    </div>
  );
}
