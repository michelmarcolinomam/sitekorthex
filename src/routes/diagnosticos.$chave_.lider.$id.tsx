import { createFileRoute } from "@tanstack/react-router";
import { publicResultadoLider } from "@/lib/diag-server";
import { montaResultado } from "@/lib/resultado-textos";
import { ResultadoLider } from "@/components/diagnosticos/ResultadoLider";
import resultadoCss from "@/styles/resultado-lider.css?url";

/**
 * O resultado como a EMPRESA vê, dentro do painel dela. A chave KX- na URL é a
 * credencial — o líder precisa pertencer àquele cliente.
 */
export const Route = createFileRoute("/diagnosticos/$chave_/lider/$id")({
  loader: ({ params }) => publicResultadoLider({ data: { chave: params.chave, liderId: params.id } }),
  head: () => ({
    meta: [
      { title: "Resultado — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: resultadoCss }],
  }),
  component: ResultadoDoCliente,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function Aviso({ titulo, texto, voltar }: { titulo: string; texto: string; voltar: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground/55">{texto}</p>
        <a href={voltar} className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-primary hover:underline">
          ← Voltar ao painel
        </a>
      </div>
    </div>
  );
}

function ResultadoDoCliente() {
  const { chave } = Route.useParams();
  const recorte = Route.useLoaderData();
  const painel = `/diagnosticos/${chave}`;

  if (!recorte) {
    return <Aviso titulo="Resultado não encontrado" texto="Este líder não pertence a este diagnóstico." voltar={painel} />;
  }

  const { calculo, lider, cliente } = recorte;

  if (calculo.indiceTime === null && calculo.indiceExec === null) {
    return (
      <Aviso
        titulo={lider.nome}
        texto="Ainda não há respostas suficientes para montar a leitura. Assim que a equipe responder, o resultado aparece aqui."
        voltar={painel}
      />
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
      <div className="border-b border-border bg-background px-6 py-3">
        <div className="mx-auto flex max-w-[1060px] items-center justify-between gap-4">
          <a href={painel} className="text-[10px] uppercase tracking-[0.2em] text-primary hover:underline">
            ← Painel de avaliação
          </a>
          {parcial ? (
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-700">
              Leitura parcial · falta a visão {calculo.respondentesTime === 0 ? "do time" : "do executivo"}
            </span>
          ) : null}
        </div>
      </div>
      <ResultadoLider dados={dados} />
    </>
  );
}
