import { createFileRoute } from "@tanstack/react-router";
import { adminPanoramaEmpresa } from "@/lib/diag-server";
import { montaOverview } from "@/lib/overview-textos";
import { OverviewEmpresa } from "@/components/diagnosticos/OverviewEmpresa";
import overviewCss from "@/styles/overview-empresa.css?url";

/** Mapa da liderança visto pela Korthex — mesma tela, cabeçalho interno. */
export const Route = createFileRoute("/admin/diagnosticos/empresa/$id")({
  loader: ({ params }) => adminPanoramaEmpresa({ data: params.id }),
  head: () => ({
    meta: [
      { title: "Mapa da empresa — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: overviewCss }],
  }),
  component: MapaAdmin,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function MapaAdmin() {
  const dados = Route.useLoaderData();

  if (!dados || !dados.resultado) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--surface)] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Sem dados para o mapa</h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/55">
            É preciso pelo menos um líder com respostas para consolidar o panorama.
          </p>
          <a href="/admin/diagnosticos" className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-primary hover:underline">
            ← Diagnósticos
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

  return (
    <>
      <div className="border-b border-border bg-background px-6 py-3">
        <div className="mx-auto flex max-w-[1060px] flex-wrap items-center justify-between gap-4">
          <a href="/admin/diagnosticos" className="text-[10px] uppercase tracking-[0.2em] text-primary hover:underline">
            ← Diagnósticos
          </a>
          <div className="flex items-center gap-5">
            <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">
              Visão interna · {dados.chave}
            </span>
            <a
              href={`/diagnosticos/${dados.chave}/mapa`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 hover:text-primary"
            >
              Ver como o cliente vê ↗
            </a>
          </div>
        </div>
      </div>
      <OverviewEmpresa dados={montado} />
    </>
  );
}
