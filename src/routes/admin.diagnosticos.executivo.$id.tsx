import { createFileRoute } from "@tanstack/react-router";
import { adminResultadoExecutivo } from "@/lib/diag-server";
import { classificaExecutivo, MINIMO_RESPONDENTES_EXEC } from "@/lib/motor-calculo";
import { montaResultadoExecutivo } from "@/lib/executivo-textos";
import { ResultadoExecutivo } from "@/components/diagnosticos/ResultadoExecutivo";
import { TravaAnonimato } from "@/components/diagnosticos/TravaAnonimato";
import resultadoCss from "@/styles/resultado-lider.css?url";
import execCss from "@/styles/resultado-executivo.css?url";

/** O recorte do executivo pela porta interna da Korthex. */
export const Route = createFileRoute("/admin/diagnosticos/executivo/$id")({
  loader: ({ params }) => adminResultadoExecutivo({ data: params.id }),
  head: () => ({
    meta: [
      { title: "Recorte do executivo — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "stylesheet", href: resultadoCss },
      { rel: "stylesheet", href: execCss },
    ],
  }),
  component: Interna,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function Interna() {
  const dados = Route.useLoaderData();

  if (!dados) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="max-w-md text-sm text-foreground/60">Executivo não encontrado.</p>
      </div>
    );
  }
  if (!dados.calculo.liberado) {
    return <TravaAnonimato respondentes={dados.calculo.respondentes} minimo={MINIMO_RESPONDENTES_EXEC} />;
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
    return <TravaAnonimato respondentes={dados.calculo.respondentes} minimo={MINIMO_RESPONDENTES_EXEC} />;
  }
  return <ResultadoExecutivo dados={montado} />;
}
