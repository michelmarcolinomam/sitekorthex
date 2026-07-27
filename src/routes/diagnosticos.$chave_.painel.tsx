import { createFileRoute } from "@tanstack/react-router";
import { publicGetPainel } from "@/lib/diag-server";
import { PainelOperacional } from "@/components/diagnosticos/PainelOperacional";

/**
 * O painel operacional da empresa. Fica um passo depois da tela de
 * boas-vindas: primeiro a empresa entende o método, aqui ela aplica.
 *
 * A chave KX- continua sendo a credencial.
 */
export const Route = createFileRoute("/diagnosticos/$chave_/painel")({
  loader: ({ params }) => publicGetPainel({ data: params.chave }),
  head: () => ({
    meta: [
      { title: "Painel de avaliação — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Painel,
});

function Painel() {
  const painel = Route.useLoaderData();
  const { chave } = Route.useParams();

  if (!painel) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Chave não encontrada</h1>
          <p className="mt-4 text-sm leading-relaxed text-foreground/55">
            Confira o link que você recebeu ou peça um novo à Korthex.
          </p>
        </div>
      </div>
    );
  }

  if (!painel.lead_preenchido) {
    // Sem cadastro não há painel: volta para o começo do caminho.
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">Falta o seu cadastro</h1>
          <p className="mt-4 text-sm leading-relaxed text-foreground/55">
            Preencha os dados do responsável para liberar a geração das avaliações.
          </p>
          <a
            href={`/diagnosticos/${chave}`}
            className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-primary hover:underline"
          >
            ← Voltar ao início
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-6 py-5">
          <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">
            {painel.nome_empresa}
          </span>
          <a
            href={`/diagnosticos/${chave}`}
            className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 hover:text-primary"
          >
            Como funciona
          </a>
        </div>
      </header>
      <PainelOperacional painel={painel} />
    </div>
  );
}
