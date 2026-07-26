import { createFileRoute } from "@tanstack/react-router";
import { calculaExecutivo, classificaExecutivo, MINIMO_RESPONDENTES_EXEC } from "@/lib/motor-calculo";
import { montaResultadoExecutivo } from "@/lib/executivo-textos";
import { respostasExemploExecutivo, CONTEXTO_EXEMPLO } from "@/lib/executivo-exemplo";
import { ResultadoExecutivo } from "@/components/diagnosticos/ResultadoExecutivo";
import { TravaAnonimato } from "@/components/diagnosticos/TravaAnonimato";
import resultadoCss from "@/styles/resultado-lider.css?url";
import execCss from "@/styles/resultado-executivo.css?url";

/**
 * Prévia da tela de resultado do executivo, com respostas de exemplo passando
 * pelo motor de verdade. Serve para revisar o desenho antes de existir uma
 * aplicação real deste diagnóstico.
 */
export const Route = createFileRoute("/admin/diagnosticos/resultado-executivo-exemplo")({
  // ?n=2 mostra a trava de anonimato, que é o outro estado possível desta tela.
  validateSearch: (busca: Record<string, unknown>) => ({
    n: Number(busca.n) > 0 ? Number(busca.n) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Recorte do executivo (exemplo) — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [
      { rel: "stylesheet", href: resultadoCss },
      { rel: "stylesheet", href: execCss },
    ],
  }),
  component: Previa,
});

function Previa() {
  const { n } = Route.useSearch();
  const respostas = respostasExemploExecutivo();
  const calculo = calculaExecutivo(n ? respostas.slice(0, n) : respostas);

  if (!calculo.liberado) {
    return <TravaAnonimato respondentes={calculo.respondentes} minimo={MINIMO_RESPONDENTES_EXEC} />;
  }

  const dados = montaResultadoExecutivo(
    CONTEXTO_EXEMPLO,
    calculo,
    classificaExecutivo(calculo.indiceGeral ?? 0).rotulo,
  );

  if (!dados) return <TravaAnonimato respondentes={calculo.respondentes} minimo={MINIMO_RESPONDENTES_EXEC} />;

  return <ResultadoExecutivo dados={dados} />;
}
