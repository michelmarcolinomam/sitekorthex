/**
 * Boas-vindas do cliente — a tela que abre assim que o cadastro é enviado.
 *
 * É o meio do caminho: a empresa acabou de virar lead e ainda não sabe o que
 * tem em mãos. Aqui ela entende o princípio da série, o que cada diagnóstico
 * mede, por que aquilo importa para o negócio e como aplicar — e só então
 * entra no painel, pelo botão.
 *
 * O visual mora em src/styles/boas-vindas.css, escopado em .kx-boas.
 */
export function BoasVindas({
  empresa,
  nome,
  hrefPainel,
}: {
  empresa: string;
  /** Primeiro nome de quem se cadastrou. Vazio = trata sem nome. */
  nome: string;
  hrefPainel: string;
}) {
  return (
    <div className="kx-boas">
      <div className="topo">
        <div className="wrap">
          <div className="marca">Korthe<span>x</span></div>
          <div className="empresa">{empresa} · painel de avaliação</div>
        </div>
      </div>
    
      <div className="wrap">
        <header className="hero">
          <div className="olho">Cadastro concluído</div>
          <h1>{nome ? `${nome}, o` : "O"} retrato da sua liderança começa aqui.</h1>
          <p className="lead">
            Os diagnósticos Korthex medem como a sua empresa é conduzida — do topo à base — e devolvem
            em número o que hoje só existe em percepção. Antes de começar, três minutos para você
            entender o que vai aplicar, em quem, e o que recebe de volta.
          </p>
          <div className="acoes">
            <a className="btn" href={hrefPainel}>Iniciar meus diagnósticos →</a>
            <span className="tempo">Leitura de 3 minutos · você pode voltar a esta página quando quiser</span>
          </div>
    
          <div className="selos">
            <span className="selo"><i></i><b>5</b> leituras possíveis</span>
            <span className="selo"><i></i><b>3</b> camadas da empresa</span>
            <span className="selo"><i></i>Respostas <b>anônimas</b> por padrão</span>
            <span className="selo"><i></i>Resultado em <b>escala 0 a 100</b></span>
          </div>
        </header>
    
        <section>
          <div className="cabeca">
            <div className="olho">O princípio</div>
            <h2>Ninguém se avalia sozinho.</h2>
            <p>
              Autoavaliação mede o que a pessoa acha de si. O que interessa é outra coisa: o que ela <b>produz</b> em quem convive com ela. Por isso cada camada da sua empresa é lida por quem
              tem expectativa real sobre ela — e o valor não está na nota isolada, está na distância
              entre como cada lado enxerga a mesma coisa.
            </p>
          </div>
    
          <div className="piramide">
            <div className="camada c-exec">
              <div className="quem">Executivo<span>Fundador, sócios, diretoria</span></div>
              <div className="leitura">
                <b>É lido por baixo.</b> Quem se reporta ao topo diz como a condução chega — e essa é a
                camada que ninguém costuma avaliar em empresa nenhuma.
                <div className="setas"><span className="seta s-baixo">↑ a liderança avalia o executivo</span></div>
              </div>
            </div>
            <div className="camada c-lider">
              <div className="quem">Liderança<span>Coordenadores, supervisores, gerentes</span></div>
              <div className="leitura">
                <b>É lida dos dois lados.</b> É a única camada que responde a dois senhores: entrega
                para cima e conduz para baixo — e as duas expectativas são diferentes.
                <div className="setas">
                  <span className="seta s-cima">↓ o executivo avalia a liderança</span>
                  <span className="seta s-baixo">↑ o time avalia a liderança</span>
                </div>
              </div>
            </div>
            <div className="camada c-time">
              <div className="quem">Equipe<span>O time que executa</span></div>
              <div className="leitura">
                <b>É lida por cima, por duas exigências.</b> Quem conduz o time no dia a dia quer uma
                coisa; quem cobra o resultado quer outra. A diferença entre as duas é o achado.
                <div className="setas">
                  <span className="seta s-cima">↓ a liderança avalia a equipe</span>
                  <span className="seta s-cima">↓ o executivo avalia a equipe</span>
                </div>
              </div>
            </div>
          </div>
        </section>
    
        <section>
          <div className="cabeca">
            <div className="olho">O que é avaliado</div>
            <h2>Três instrumentos, dimensões objetivas.</h2>
            <p>
              Cada diagnóstico mede dimensões fixas, sempre as mesmas — é isso que permite comparar
              pessoas, áreas e momentos diferentes, e provar evolução com número numa reaplicação.
            </p>
          </div>
    
          <div className="instrumentos">
            <article className="inst">
              <span className="rot r-lider">Uma liderança</span>
              <h3>Diagnóstico de liderança</h3>
              <p className="desc">
                Lê um líder pelos dois lados: como a equipe experimenta a condução dele e como o
                executivo avalia a entrega dele.
              </p>
              <ul className="dims">
                <li className="t" style={{ display: "block" }}>As cinco dimensões</li>
                <li>Estabilidade Emocional</li>
                <li>Gestão & Conflitos</li>
                <li>Comunicação & Feedback</li>
                <li>Confiança & Integridade</li>
                <li>Autonomia & Desenvolvimento</li>
              </ul>
              <p className="quemresponde">
                <b>Quem responde:</b> os liderados (anônimo) e sócios ou diretoria. Quatro ou mais
                respostas do time dão um retrato estável.
              </p>
            </article>
    
            <article className="inst">
              <span className="rot r-exec">Um executivo</span>
              <h3>Diagnóstico do executivo</h3>
              <p className="desc">
                A leitura que quase nenhuma empresa tem: como a liderança enxerga quem está no topo e o
                que a condução dele produz sem que ele perceba.
              </p>
              <ul className="dims">
                <li className="t" style={{ display: "block" }}>Os cinco eixos</li>
                <li>Consciência & Autopercepção</li>
                <li>Identidade & Posicionamento</li>
                <li>Decisão & Gestão Emocional</li>
                <li>Liderança & Sucessão</li>
                <li>Visão de Futuro & Cultura</li>
              </ul>
              <p className="quemresponde">
                <b>Quem responde:</b> os líderes que se reportam a ele, de forma anônima. O relatório é
                liberado a partir de três respostas.
              </p>
            </article>
    
            <article className="inst">
              <span className="rot r-time">Uma equipe</span>
              <h3>Diagnóstico de equipe</h3>
              <p className="desc">
                Lê o time como conjunto por duas exigências diferentes: a de quem o conduz e a de quem
                cobra o resultado dele.
              </p>
              <ul className="dims">
                <li className="t" style={{ display: "block" }}>As seis dimensões</li>
                <li>Gestão das Emoções & Autopercepção</li>
                <li>Comunicação & Relacionamentos Produtivos</li>
                <li>Autorresponsabilidade & Protagonismo</li>
                <li>Identidade Profissional & Posicionamento</li>
                <li>Colaboração & Trabalho em Equipe</li>
                <li>Projeto de Vida & Produtividade</li>
              </ul>
              <p className="quemresponde">
                <b>Quem responde:</b> o líder da equipe e o dono ou diretor. Não existe nota por pessoa —
                a leitura é do conjunto.
              </p>
            </article>
          </div>
        </section>
    
        <section>
          <div className="cabeca">
            <div className="olho">Por que isso importa</div>
            <h2>O que hoje custa caro e ninguém consegue apontar.</h2>
            <p>
              Toda empresa sente onde trava, mas discute isso em opinião. Estes diagnósticos transformam
              percepção em dado — e dado muda conversa.
            </p>
          </div>
    
          <div className="valor">
            <div>
              <h3>Separa problema de pessoa de problema de cultura</h3>
              <p>
                Uma fragilidade que aparece num líder é caso individual. A mesma fragilidade repetida em
                vários é padrão da casa — e a resposta para cada um é diferente, com custo diferente.
              </p>
            </div>
            <div>
              <h3>Mostra o custo escondido da condução</h3>
              <p>
                Retrabalho por ordem mal entendida, decisão que volta atrás, gente boa que pede demissão:
                tudo isso nasce em algum ponto da liderança, e o diagnóstico diz em qual.
              </p>
            </div>
            <div>
              <h3>Expõe a dependência do topo</h3>
              <p>
                O crescimento para no tamanho da agenda de uma pessoa. Medir isso é o começo de qualquer
                conversa séria sobre sucessão e autonomia.
              </p>
            </div>
            <div>
              <h3>Prova evolução com número</h3>
              <p>
                Reaplicando o mesmo instrumento depois do desenvolvimento, a mudança aparece em escala —
                não em impressão de quem conduziu o processo.
              </p>
            </div>
          </div>
        </section>
    
        <section>
          <div className="cabeca">
            <div className="olho">Como aplicar</div>
            <h2>Quatro passos, e você conduz o processo inteiro.</h2>
            <p>
              Quem gera e distribui as avaliações é a sua empresa. A Korthex não fala com ninguém do seu
              time: recebe apenas os resultados consolidados.
            </p>
          </div>
    
          <div className="passos">
            <div className="passo">
              <div className="n">1</div>
              <div>
                <h3>Escolha o que vai ser diagnosticado</h3>
                <p>
                  Uma liderança, um executivo ou uma equipe. Comece por onde dói: se a dúvida é sobre um
                  gestor específico, comece por ele; se é sobre a empresa, comece pelos líderes.
                </p>
              </div>
            </div>
            <div className="passo">
              <div className="n">2</div>
              <div>
                <h3>Cadastre quem será avaliado e quantas pessoas respondem</h3>
                <p>
                  Nome, cargo e o número de respondentes de cada ótica. No caso de uma equipe, informe
                  também quantas pessoas ela tem — é o que dá peso ao retrato.
                </p>
              </div>
            </div>
            <div className="passo">
              <div className="n">3</div>
              <div>
                <h3>Envie o link de cada questionário</h3>
                <p>
                  O sistema gera um link por ótica. Cada link já sabe quem está sendo avaliado, então
                  quem responde não precisa preencher nada além das respostas — leva de 6 a 8 minutos.
                </p>
              </div>
            </div>
            <div className="passo">
              <div className="n">4</div>
              <div>
                <h3>Acompanhe e leia o resultado</h3>
                <p>
                  Você vê em tempo real quantas respostas entraram. O relatório abre assim que houver
                  dado suficiente e fica mais firme a cada resposta nova.
                </p>
              </div>
            </div>
          </div>
        </section>
    
        <section>
          <div className="cabeca">
            <div className="olho">Como estruturar bem</div>
            <h2>Três cuidados que decidem se o diagnóstico vale alguma coisa.</h2>
          </div>
    
          <div className="cuidados">
            <div className="cuidado">
              <h3>Diga que é anônimo — e cumpra</h3>
              <p>
                As respostas do time e da liderança são gravadas sem identificação. Quem responde
                precisa saber disso antes, ou responde o que é seguro em vez do que é verdade.
              </p>
            </div>
            <div className="cuidado">
              <h3>Não é avaliação de desempenho</h3>
              <p>
                Nenhum diagnóstico gera nota por pessoa dentro de uma equipe, e nenhum resultado serve
                para punir. Serve para decidir onde investir desenvolvimento.
              </p>
            </div>
            <div className="cuidado">
              <h3>Aplique em bloco, não pingado</h3>
              <p>
                Diagnosticar todos os líderes no mesmo período é o que permite comparar e enxergar
                padrão. Um líder isolado dá leitura individual, não retrato da empresa.
              </p>
            </div>
          </div>
        </section>
    
        <section>
          <div className="cabeca">
            <div className="olho">O que você recebe</div>
            <h2>Relatórios prontos para decidir, não planilhas.</h2>
          </div>
    
          <div className="entregas">
            <div className="entrega">
              <div className="tela"><div className="barra a"></div><div className="barra b"></div><div className="barra c"></div></div>
              <div className="txt">
                <h3>O recorte individual</h3>
                <p>
                  Cada avaliado com as dimensões lado a lado, a distância entre as óticas e a leitura do
                  que cada número custa à operação.
                </p>
              </div>
            </div>
            <div className="entrega">
              <div className="tela"><div className="barra b"></div><div className="barra a"></div><div className="barra c"></div></div>
              <div className="txt">
                <h3>O mapa da empresa</h3>
                <p>
                  Todos os líderes num retrato só, com a matriz que revela o que é caso isolado e o que
                  virou padrão de cultura.
                </p>
              </div>
            </div>
            <div className="entrega">
              <div className="tela"><div className="barra c"></div><div className="barra a"></div><div className="barra b"></div></div>
              <div className="txt">
                <h3>O caminho de desenvolvimento</h3>
                <p>
                  A partir do que foi medido, quais frentes atacar primeiro — e qual programa Korthex
                  responde a cada uma.
                </p>
              </div>
            </div>
          </div>
        </section>
    
        <div className="final">
          <div className="olho" style={{ justifyContent: "center" }}>Tudo pronto</div>
          <h2>Comece pelo que mais incomoda hoje.</h2>
          <p>
            Você pode gerar quantos diagnósticos quiser, na ordem que fizer sentido, e voltar a esta
            explicação sempre que precisar.
          </p>
          <a className="btn btn-claro" href={hrefPainel}>Iniciar meus diagnósticos →</a>
        </div>
    
        <footer>Korthex · Mentoria executiva e desenvolvimento de liderança</footer>
      </div>
    </div>
  );
}
