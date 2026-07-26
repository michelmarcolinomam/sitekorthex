import { createFileRoute } from "@tanstack/react-router";
import { publicResultadoExecutivo } from "@/lib/diag-server";
import { classificaExecutivo, MINIMO_RESPONDENTES_EXEC } from "@/lib/motor-calculo";
import { montaResultadoExecutivo } from "@/lib/executivo-textos";
import { ResultadoExecutivo } from "@/components/diagnosticos/ResultadoExecutivo";
import { TravaAnonimato } from "@/components/diagnosticos/TravaAnonimato";
import resultadoCss from "@/styles/resultado-lider.css?url";
import execCss from "@/styles/resultado-executivo.css?url";

/**
 * O recorte do executivo como a EMPRESA vê. A chave KX- é a credencial: o
 * avaliado precisa pertencer àquele cliente.
 *
 * Abaixo de três respostas a tela não mostra o relatório — mostra a trava, e
 * explica por quê. É o anonimato que faz a liderança responder a verdade.
 */
export const Route = createFileRoute("/diagnosticos/$chave_/executivo/$id")({
  loader: ({ params }) =>
    publicResultadoExecutivo({ data: { chave: params.chave, id: params.id } }),
  head: () => ({
    meta: [{ title: "Resultado — Korthex" }, { name: "robots", content: "noindex, nofollow" }],
    links: [
      { rel: "stylesheet", href: resultadoCss },
      { rel: "stylesheet", href: execCss },
    ],
  }),
  component: ResultadoExecutivoDoCliente,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function ResultadoExecutivoDoCliente() {
  const dados = Route.useLoaderData();
  const { chave } = Route.useParams();

  if (!dados) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Resultado não encontrado</h1>
          <p className="mt-4 text-sm leading-relaxed text-foreground/55">
            Este executivo não pertence a esta empresa, ou a avaliação foi arquivada.
          </p>
          <a
            href={`/diagnosticos/${chave}`}
            className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-primary hover:underline"
          >
            ← Voltar ao painel
          </a>
        </div>
      </div>
    );
  }

  if (!dados.calculo.liberado) {
    return (
      <TravaAnonimato
        respondentes={dados.calculo.respondentes}
        minimo={MINIMO_RESPONDENTES_EXEC}
      />
    );
  }

  const agora = new Date();
  const montado = montaResultadoExecutivo(
    {
      executivo: dados.avaliado.nome,
      cargo: dados.avaliado.cargo,
      empresa: dados.cliente.nome_empresa,
      periodo: `${MESES[agora.getMonth()]} ${agora.getFullYear()}`,
    },
    dados.calculo,
    classificaExecutivo(dados.calculo.indiceGeral ?? 0).rotulo,
  );

  if (!montado) {
    return (
      <TravaAnonimato
        respondentes={dados.calculo.respondentes}
        minimo={MINIMO_RESPONDENTES_EXEC}
      />
    );
  }

  return <ResultadoExecutivo dados={montado} />;
}
