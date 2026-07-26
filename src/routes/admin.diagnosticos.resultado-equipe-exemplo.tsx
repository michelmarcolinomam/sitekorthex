import { createFileRoute } from "@tanstack/react-router";
import { calculaEquipe } from "@/lib/motor-calculo";
import { montaResultadoEquipe, type ModoEquipe } from "@/lib/equipe-textos";
import { respostasExemploEquipe, CONTEXTO_EXEMPLO_EQUIPE } from "@/lib/equipe-exemplo";
import { ResultadoEquipe } from "@/components/diagnosticos/ResultadoEquipe";
import resultadoCss from "@/styles/resultado-lider.css?url";
import equipeCss from "@/styles/resultado-equipe.css?url";

/**
 * Prévia dos três recortes da equipe, com respostas de exemplo passando pelo
 * motor de verdade. `?modo=lideranca | executivo | cruzado` (padrão: cruzado).
 */
export const Route = createFileRoute("/admin/diagnosticos/resultado-equipe-exemplo")({
  validateSearch: (busca: Record<string, unknown>): { modo: ModoEquipe } => {
    const m = String(busca.modo ?? "");
    return { modo: m === "lideranca" || m === "executivo" ? m : "cruzado" };
  },
  head: () => ({
    meta: [
      { title: "Recorte da equipe (exemplo) — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "stylesheet", href: resultadoCss },
      { rel: "stylesheet", href: equipeCss },
    ],
  }),
  component: Previa,
});

function Previa() {
  const { modo } = Route.useSearch();
  const calculo = calculaEquipe(respostasExemploEquipe());
  const dados = montaResultadoEquipe(CONTEXTO_EXEMPLO_EQUIPE, calculo, modo);

  if (!dados) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center">
        <p className="max-w-md text-sm text-foreground/60">
          Sem respostas suficientes para montar este recorte.
        </p>
      </div>
    );
  }

  return (
    <ResultadoEquipe
      dados={dados}
      linkDoRecorte={(m) => `/admin/diagnosticos/resultado-equipe-exemplo?modo=${m}`}
    />
  );
}
