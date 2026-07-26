/**
 * A tela que aparece no lugar do resultado quando ainda há poucas respostas.
 *
 * Não é uma limitação técnica: com uma ou duas respostas, o retrato do
 * executivo é o retrato de quem respondeu. Mostrar aqui destruiria o anonimato
 * que faz a liderança responder com honestidade — e sem honestidade o
 * instrumento não vale nada.
 */
export function TravaAnonimato({ respondentes, minimo }: { respondentes: number; minimo: number }) {
  const faltam = Math.max(0, minimo - respondentes);

  return (
    <div className="kx-trava">
      <div className="caixa">
        <span className="n">
          {respondentes} de {minimo} respostas
        </span>
        <h1>O resultado ainda não pode ser mostrado.</h1>
        <p>
          Este diagnóstico é respondido pela liderança sobre quem está no topo, e por isso é
          anônimo. Com {respondentes === 1 ? "uma resposta" : `${respondentes} respostas`}, o
          retrato seria o retrato de quem respondeu — e quem respondeu ficaria exposto.
        </p>
        <p>
          {faltam === 1
            ? "Falta 1 resposta para o relatório ser liberado."
            : `Faltam ${faltam} respostas para o relatório ser liberado.`}{" "}
          É a mesma regra para todas as empresas: sem isso, ninguém responde a verdade na próxima
          vez.
        </p>
      </div>
    </div>
  );
}
