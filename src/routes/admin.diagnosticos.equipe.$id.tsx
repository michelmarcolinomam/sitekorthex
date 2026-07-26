import { createFileRoute } from "@tanstack/react-router";
import { adminResultadoEquipe } from "@/lib/diag-server";
import { montaResultadoEquipe, type ModoEquipe } from "@/lib/equipe-textos";
import { ResultadoEquipe } from "@/components/diagnosticos/ResultadoEquipe";
import resultadoCss from "@/styles/resultado-lider.css?url";
import equipeCss from "@/styles/resultado-equipe.css?url";

/** O recorte da equipe pela porta interna da Korthex. */
export const Route = createFileRoute("/admin/diagnosticos/equipe/$id")({
  validateSearch: (busca: Record<string, unknown>): { modo: ModoEquipe } => {
    const m = String(busca.modo ?? "");
    return { modo: m === "lideranca" || m === "executivo" ? m : "cruzado" };
  },
  loader: ({ params }) => adminResultadoEquipe({ data: params.id }),
  head: () => ({
    meta: [
      { title: "Recorte da equipe — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "stylesheet", href: resultadoCss },
      { rel: "stylesheet", href: equipeCss },
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
  const { modo } = Route.useSearch();

  const agora = new Date();
  const montado = dados
    ? montaResultadoEquipe(
        {
          equipe: dados.avaliado.nome,
          empresa: dados.cliente.nome_empresa,
          periodo: `${MESES[agora.getMonth()]} ${agora.getFullYear()}`,
          tamanho: dados.avaliado.tamanho,
        },
        dados.calculo,
        modo,
      )
    : null;

  if (!dados || !montado) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="max-w-md text-sm text-foreground/60">
          {dados ? "Este recorte ainda não tem respostas." : "Equipe não encontrada."}
        </p>
      </div>
    );
  }

  return (
    <ResultadoEquipe
      dados={montado}
      linkDoRecorte={(m) => `/admin/diagnosticos/equipe/${dados.avaliado.id}?modo=${m}`}
    />
  );
}
