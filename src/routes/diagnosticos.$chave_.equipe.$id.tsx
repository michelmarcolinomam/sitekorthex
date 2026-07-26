import { createFileRoute } from "@tanstack/react-router";
import { publicResultadoEquipe } from "@/lib/diag-server";
import { montaResultadoEquipe, type ModoEquipe } from "@/lib/equipe-textos";
import { ResultadoEquipe } from "@/components/diagnosticos/ResultadoEquipe";
import resultadoCss from "@/styles/resultado-lider.css?url";
import equipeCss from "@/styles/resultado-equipe.css?url";

/**
 * O recorte da equipe como a EMPRESA vê — os três modos leem os mesmos dados,
 * `?modo=` só decide qual leitura é apresentada. A chave KX- é a credencial.
 */
export const Route = createFileRoute("/diagnosticos/$chave_/equipe/$id")({
  validateSearch: (busca: Record<string, unknown>): { modo: ModoEquipe } => {
    const m = String(busca.modo ?? "");
    return { modo: m === "lideranca" || m === "executivo" ? m : "cruzado" };
  },
  loader: ({ params }) => publicResultadoEquipe({ data: { chave: params.chave, id: params.id } }),
  head: () => ({
    meta: [{ title: "Resultado da equipe — Korthex" }, { name: "robots", content: "noindex, nofollow" }],
    links: [
      { rel: "stylesheet", href: resultadoCss },
      { rel: "stylesheet", href: equipeCss },
    ],
  }),
  component: ResultadoEquipeDoCliente,
});

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function Aviso({ titulo, texto, chave }: { titulo: string; texto: string; chave: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        <p className="mt-4 text-sm leading-relaxed text-foreground/55">{texto}</p>
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

function ResultadoEquipeDoCliente() {
  const dados = Route.useLoaderData();
  const { modo } = Route.useSearch();
  const { chave } = Route.useParams();

  if (!dados) {
    return (
      <Aviso
        titulo="Resultado não encontrado"
        texto="Esta equipe não pertence a esta empresa, ou a avaliação foi arquivada."
        chave={chave}
      />
    );
  }

  // Um modo só existe se a ótica dele foi respondida; o cruzado precisa das duas.
  const faltaOtica =
    (modo === "lideranca" && !dados.calculo.respondeuLideranca) ||
    (modo === "executivo" && !dados.calculo.respondeuExecutivo) ||
    (modo === "cruzado" && !(dados.calculo.respondeuLideranca && dados.calculo.respondeuExecutivo));

  const agora = new Date();
  const montado = montaResultadoEquipe(
    {
      equipe: dados.avaliado.nome,
      empresa: dados.cliente.nome_empresa,
      periodo: `${MESES[agora.getMonth()]} ${agora.getFullYear()}`,
      tamanho: dados.avaliado.tamanho,
      responsavel: dados.avaliado.responsavel?.nome ?? null,
    },
    dados.calculo,
    modo,
  );

  if (faltaOtica || !montado) {
    return (
      <Aviso
        titulo="Este recorte ainda não está disponível"
        texto={
          modo === "cruzado"
            ? "O cruzamento precisa das duas leituras respondidas — a de quem conduz a equipe e a de quem cobra o resultado."
            : "A ótica deste recorte ainda não foi respondida."
        }
        chave={chave}
      />
    );
  }

  return (
    <ResultadoEquipe
      dados={montado}
      linkDoRecorte={(m) => `/diagnosticos/${chave}/equipe/${dados.avaliado.id}?modo=${m}`}
    />
  );
}
