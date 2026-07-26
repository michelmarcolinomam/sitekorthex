import { createFileRoute } from "@tanstack/react-router";
import { publicPanoramaEmpresa } from "@/lib/diag-server";
import { montaOverview } from "@/lib/overview-textos";
import { OverviewEmpresa } from "@/components/diagnosticos/OverviewEmpresa";
import overviewCss from "@/styles/overview-empresa.css?url";

/** Panorama da liderança (nível 2), visto pela própria empresa. */
export const Route = createFileRoute("/diagnosticos/$chave_/mapa")({
  loader: ({ params }) => publicPanoramaEmpresa({ data: params.chave }),
  head: () => ({
    meta: [
      { title: "Panorama da liderança — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: overviewCss }],
  }),
  component: Panorama,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function Panorama() {
  const { chave } = Route.useParams();
  const dados = Route.useLoaderData();
  const painel = `/diagnosticos/${chave}`;

  if (!dados || !dados.resultado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Panorama ainda não disponível</h1>
          <p className="mt-4 text-sm leading-relaxed text-foreground/55">
            O mapa da liderança precisa de pelo menos um líder avaliado. Assim que as primeiras
            respostas chegarem, ele aparece aqui.
          </p>
          <a href={painel} className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-primary hover:underline">
            ← Voltar ao painel
          </a>
        </div>
      </div>
    );
  }

  const agora = new Date();
  const montado = montaOverview(
    {
      empresa: dados.empresa,
      periodo: `${MESES[agora.getMonth()]} ${agora.getFullYear()}`,
      totalRespondentes: dados.totalRespondentes,
      indiceTime: dados.indiceTime,
      indiceExec: dados.indiceExec,
      divergencia: dados.divergencia,
    },
    dados.resultado,
  );

  const poucos = dados.resultado.lideres.length < 2;

  return (
    <>
      <div className="border-b border-border bg-background px-6 py-3">
        <div className="mx-auto flex max-w-[1060px] items-center justify-between gap-4">
          <a href={painel} className="text-[10px] uppercase tracking-[0.2em] text-primary hover:underline">
            ← Painel de avaliação
          </a>
          {poucos ? (
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-700">
              Leitura preliminar · só um líder avaliado até agora
            </span>
          ) : null}
        </div>
      </div>
      <OverviewEmpresa dados={montado} />
    </>
  );
}
