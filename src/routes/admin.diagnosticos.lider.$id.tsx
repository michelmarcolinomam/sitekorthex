import { createFileRoute } from "@tanstack/react-router";
import { adminResultadoLider } from "@/lib/diag-server";
import { montaResultado } from "@/lib/resultado-textos";
import { ResultadoLider } from "@/components/diagnosticos/ResultadoLider";
import resultadoCss from "@/styles/resultado-lider.css?url";

/** Resultado de um líder com os números reais, calculados a partir das respostas. */
export const Route = createFileRoute("/admin/diagnosticos/lider/$id")({
  loader: ({ params }) => adminResultadoLider({ data: params.id }),
  head: () => ({
    meta: [
      { title: "Resultado do líder — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: resultadoCss }],
  }),
  component: Resultado,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function Resultado() {
  const recorte = Route.useLoaderData();

  if (!recorte) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--surface)] px-6 text-center">
        <div>
          <h1 className="text-xl font-semibold">Líder não encontrado</h1>
          <a href="/admin/diagnosticos" className="mt-4 inline-block text-sm text-primary hover:underline">
            ← Voltar
          </a>
        </div>
      </div>
    );
  }

  const { calculo, lider, cliente } = recorte;
  const semDados = calculo.indiceTime === null && calculo.indiceExec === null;

  if (semDados) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--surface)] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">{lider.nome}</h1>
          <p className="mt-3 text-sm leading-relaxed text-foreground/55">
            Ainda não há respostas suficientes para calcular o resultado. Assim que a equipe
            responder, o recorte aparece aqui.
          </p>
          <a
            href={`/admin/diagnosticos`}
            className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-primary hover:underline"
          >
            ← Diagnósticos
          </a>
        </div>
      </div>
    );
  }

  const agora = new Date();
  const dados = montaResultado(
    {
      lider: lider.nome,
      cargo: lider.cargo,
      empresa: cliente.nome_empresa,
      periodo: `${MESES[agora.getMonth()]} ${agora.getFullYear()}`,
    },
    calculo,
  );

  const parcial = calculo.respondentesTime === 0 || calculo.respondentesExec === 0;

  return (
    <>
      {parcial ? (
        <div className="border-b border-border bg-background px-6 py-3">
          <div className="mx-auto max-w-[1060px] text-[10px] uppercase tracking-[0.2em] text-amber-700">
            Leitura parcial · falta a visão {calculo.respondentesTime === 0 ? "do time" : "do executivo"}
          </div>
        </div>
      ) : null}
      <ResultadoLider dados={dados} />
    </>
  );
}
