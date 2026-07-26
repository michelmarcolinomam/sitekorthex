import type { ResultadoExecutivoDados, ItemSintese } from "@/lib/executivo-textos";
import type { ItemLista } from "./ResultadoLider";

/**
 * Recorte do EXECUTIVO — o resultado do diagnóstico respondido pela liderança.
 *
 * Mesma linguagem visual da tela do líder (src/styles/resultado-lider.css,
 * escopo .kx-resultado); o que muda mora em resultado-executivo.css. A
 * diferença estrutural: aqui existe uma ótica só, e o lugar do "gap" é ocupado
 * pelo DESACORDO entre os líderes que responderam.
 *
 * PARA MEXER NO VISUAL: editar o CSS, não reescrever em utilitários.
 */

function comDestaques(texto: string) {
  return texto.split(/\*\*(.+?)\*\*/g).map((parte, i) =>
    i % 2 === 1 ? (
      <strong key={i}>{parte}</strong>
    ) : (
      <span key={i}>{parte}</span>
    ),
  );
}

function Lista({ itens }: { itens: ItemLista[] }) {
  return (
    <div className="lista">
      {itens.map((it, i) => (
        <div className="item" key={i}>
          <b>{it.destaque}</b> {it.texto}
        </div>
      ))}
    </div>
  );
}

/** A síntese em linha de painel: eixo à esquerda, nota à direita, leitura embaixo. */
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

export function ResultadoExecutivo({ dados }: { dados: ResultadoExecutivoDados }) {
  const pior = dados.eixos[0];

  return (
    <div className="kx-resultado kx-exec">
      <div className="topbar">
        <div className="wrap">
          <div className="wordmark">
            Korthe<span>x</span>
          </div>
          <div className="tag">Recorte do executivo · confidencial</div>
        </div>
      </div>

      <div className="wrap">
        <header className="head">
          <div className="tag tag-brand">Diagnóstico do Executivo</div>
          <h1>{dados.executivo}</h1>
          <p className="meta">{dados.meta}</p>
          <div className="oticas">
            <span className="otica otica-exec">
              <i />
              Leitura da liderança <b className="num">{dados.respondentes}</b>
            </span>
            <span className="otica otica-anon">
              <i />
              Respostas anônimas · nenhuma resposta individual é exibida
            </span>
          </div>
        </header>

        <div className="resumo resumo-3">
          <div className="kpi">
            <div className="v num">
              {dados.indiceGeral}
              <small>/100</small>
            </div>
            <div className="k tag">Índice de condução</div>
            <div className="d">{dados.classificacao}</div>
          </div>
          <div className="kpi kpi-div">
            <div className="v num">{dados.divergenciaInterna ?? "—"}</div>
            <div className="k tag">Desacordo entre líderes</div>
            <div className="d">Distância média entre a melhor e a pior leitura</div>
          </div>
          <div className="kpi">
            <div className="v num">{pior.valor}</div>
            <div className="k tag">{pior.nome}</div>
            <div className="d">O eixo que mais custa à operação hoje</div>
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
            <h2>Os cinco eixos, na leitura de quem convive com as decisões</h2>
            <p className="lead">
              Cada eixo foi avaliado por {dados.respondentes} líderes que se reportam a este
              executivo, na mesma escala de 0 a 100.{" "}
              <b>
                Onde as leituras estão divididas, a média esconde mais do que revela — por isso o
                desacordo aparece marcado.
              </b>
            </p>
          </div>

          <div className="reguas">
            {dados.eixos.map((e) => (
              <div className="dim" key={e.chave}>
                <div className="dim-top">
                  <span className="dim-nome">{e.nome}</span>
                  <span className={`pill pill-${e.severidade}`}>{e.rotulo}</span>
                </div>
                <div className="brow">
                  <span className="btag btag-exec">Líderes</span>
                  <div className="bar">
                    <div className="fill fill-exec" style={{ width: `${e.valor}%` }} />
                  </div>
                  <span className="bval num">{e.valor}</span>
                </div>
                {e.dividido ? (
                  <div className="desacordo">
                    <span className="dd" />
                    As leituras variam <b className="num">{e.amplitude}</b> pontos entre os líderes
                  </div>
                ) : null}
              </div>
            ))}

            <div className="escala">
              <span>0 · não demonstra</span>
              <span>50</span>
              <span>100 · referência</span>
            </div>

            <div className="legenda">
              <span className="leg">
                Ordenado do eixo mais frágil ao mais sólido — a primeira linha é por onde o
                desenvolvimento começa.
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
              {dados.forcas.length ? (
                <Sintese itens={dados.forcas} />
              ) : (
                <p className="sem-forca">
                  Nenhum eixo chegou à faixa forte nesta leitura — o trabalho começa pela base, não
                  pelo ajuste fino.
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
            <div className="tag">Leitura eixo a eixo</div>
            <h2>O que cada número significa para a companhia</h2>
            <p>
              Do mais frágil ao mais sólido. Cada eixo traz a pergunta que o Korthex Executivo faz
              sobre ele e o custo concreto que a fragilidade impõe à operação.
            </p>
          </div>

          <div className="leitura">
            {dados.eixos.map((e) => (
              <article className={`card-dim sev-${e.severidade}`} key={e.chave}>
                <div className="cd-top">
                  <h3>{e.nome}</h3>
                  <div className="cd-nums">
                    <b className="num">{e.valor}</b>
                    <span className={`pill pill-${e.severidade}`}>{e.rotulo}</span>
                  </div>
                </div>
                <p className="cd-pergunta">{e.pergunta}</p>
                <p className="cd-texto">{comDestaques(e.narrativa)}</p>
                <div className="impacto">
                  <div className="tag">
                    {e.severidade === "good" ? "O que isso sustenta" : "Impacto na companhia"}
                  </div>
                  <Lista itens={e.impactos} />
                </div>
              </article>
            ))}
          </div>
        </section>
        {/* A faixa roxa é um card dentro da coluna, como na tela do líder —
            não uma banda colada de ponta a ponta. */}
        <section>
          <div className="oferta-topo">
            <div className="tag">A resposta da Korthex</div>
            <h2>
              O diagnóstico mostrou onde a condução trava.
              <br />
              Veja o trabalho que responde a isso.
            </h2>
            <p>
              Toda organização cresce até o limite da maturidade de quem a conduz. O próximo ciclo
              desta empresa exige uma nova versão de quem está no topo.
            </p>
          </div>

          <div className="sec-head sec-oferta">
            <div className="tag">Por onde começar</div>
            <h2>Os eixos que este diagnóstico prioriza</h2>
          </div>
          <div className="prioridades">
            {dados.prioridades.map((p, i) => (
              <div className="prio" key={p.eixo}>
                <span className="t-idx t-idx-crit">{i + 1}º</span>
                <div>
                  <h3>{p.eixo}</h3>
                  <p className="prio-q">{p.pergunta}</p>
                  <p className="prio-p">{p.porque}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="sec-programa">
          <article className="treino t-caminho">
            <div className="t-head">
              <span className="t-idx t-idx-brand">★</span>
              <div>
                <h3>{dados.programa.titulo}</h3>
                <span className="sub">{dados.programa.subtitulo}</span>
              </div>
            </div>
            <div className="t-corpo">
              <p className="desc">{dados.programa.descricao}</p>
              <div className="duo">
                <div>
                  <div className="tag">Os cinco eixos do processo</div>
                  <div className="eixos">
                    {dados.programa.eixos.map((e, i) => (
                      <div className="eixo eixo-exec" key={e.nome}>
                        <span className="n num">{String(i + 1).padStart(2, "0")}</span>
                        <div>
                          <b>{e.nome}</b>
                          <span>{e.descricao}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="tag">O que constrói ao longo do tempo</div>
                  <div className="lista">
                    {dados.programa.constroi.map((c) => (
                      <div className="item" key={c}>
                        {c}
                      </div>
                    ))}
                  </div>
                  <div className="rodape-programa">
                    {dados.programa.rodape.map((r) => (
                      <p key={r}>{r}</p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </section>

        <footer>
          <div className="tag">Método</div>
          <p>
            Índice de 0 a 100 por eixo, calculado a partir das respostas de {dados.respondentes}{" "}
            líderes que se reportam a este executivo. Faixas: até 55 frágil, 55 a 70 atenção, acima
            de 70 sólido. O desacordo é a distância entre a leitura mais alta e a mais baixa no
            mesmo eixo.
          </p>
          <p>
            <b>Anonimato:</b> as respostas são gravadas sem qualquer identificação de quem
            respondeu, e este relatório só é gerado a partir de três respostas — abaixo disso, o
            retrato individualizaria quem falou.
          </p>
        </footer>
      </div>
    </div>
  );
}
