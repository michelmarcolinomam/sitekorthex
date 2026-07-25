import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { adminGetCliente, type AvaliacaoTipo, type ClienteDetalhe } from "@/lib/diag-server";
import { KorthexLogo } from "@/components/blog/Chrome";

/**
 * Acompanhamento de um cliente. Quem gera as avaliações é a própria empresa,
 * no painel dela (/diagnosticos/{chave}) — aqui a Korthex só observa o que
 * está acontecendo e cobra quem está parado.
 */
export const Route = createFileRoute("/admin/diagnosticos/$id")({
  loader: ({ params }) => adminGetCliente({ data: params.id }),
  head: () => ({
    meta: [
      { title: "Cliente — Diagnósticos Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: DetalheCliente,
});

const TIPO_CURTO: Record<AvaliacaoTipo, string> = {
  lideranca_time: "Visão do time",
  lideranca_executivo: "Visão do executivo",
  executivo_lideranca: "Liderança → executivo",
  performance_time: "Performance do time",
};

function DetalheCliente() {
  const dados = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4 text-foreground">
            <KorthexLogo className="h-6 w-auto" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">
              Diagnósticos
            </span>
          </div>
          <a
            href="/admin/diagnosticos"
            className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 hover:text-primary"
          >
            ← Clientes
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-12">
        {dados ? <Conteudo dados={dados} /> : <NaoEncontrado />}
      </main>
    </div>
  );
}

function NaoEncontrado() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-xl font-semibold">Cliente não encontrado</h1>
      <a href="/admin/diagnosticos" className="mt-4 inline-block text-sm text-primary hover:underline">
        ← Voltar para a lista
      </a>
    </div>
  );
}

function Conteudo({ dados }: { dados: ClienteDetalhe }) {
  const { cliente } = dados;
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    void navigator.clipboard?.writeText(
      `${window.location.origin}/diagnosticos/${cliente.chave}`,
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  const respostas = Object.values(dados.respostasPorAvaliacao).reduce((s, n) => s + n, 0);
  const comAvaliacao = dados.lideres.filter((l) =>
    dados.avaliacoes.some((a) => a.lider_id === l.id),
  );

  return (
    <>
      <section className="mb-10 rounded-lg border border-border bg-background p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0">
            <span className="font-mono text-[11px] tracking-wider text-primary">{cliente.chave}</span>
            <h1 className="mt-2 text-2xl font-semibold text-foreground">{cliente.nome_empresa}</h1>
            {cliente.responsavel_nome ? (
              <p className="mt-2 text-sm text-foreground/55">
                {cliente.responsavel_nome}
                {cliente.responsavel_cargo ? ` · ${cliente.responsavel_cargo}` : ""}
                {cliente.responsavel_email ? ` · ${cliente.responsavel_email}` : ""}
                {cliente.responsavel_telefone ? ` · ${cliente.responsavel_telefone}` : ""}
              </p>
            ) : (
              <p className="mt-2 text-sm text-foreground/40">
                Lead ainda não preenchido — a empresa não abriu o link.
              </p>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-4">
            <button
              type="button"
              onClick={copiar}
              className="text-[10px] uppercase tracking-[0.16em] text-primary hover:underline"
            >
              {copiado ? "Copiado ✓" : "Copiar link do painel"}
            </button>
            <a
              href={`/diagnosticos/${cliente.chave}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] uppercase tracking-[0.16em] text-foreground/50 hover:text-primary"
            >
              Abrir painel
            </a>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap gap-8 border-t border-border pt-6">
          <Kpi valor={comAvaliacao.length} rotulo="Líderes em avaliação" />
          <Kpi valor={dados.avaliacoes.length} rotulo="Avaliações geradas" />
          <Kpi valor={respostas} rotulo="Respostas recebidas" />
        </div>
      </section>

      <p className="mb-5 text-xs text-foreground/45">
        As avaliações são geradas pela própria empresa, no painel dela. Esta tela é só
        acompanhamento.
      </p>

      {comAvaliacao.length === 0 ? (
        <div className="rounded-md border border-dashed border-border bg-background py-20 text-center">
          <p className="text-sm text-foreground/50">A empresa ainda não gerou nenhuma avaliação.</p>
          <p className="mt-2 text-xs text-foreground/40">
            Envie o link do painel para o responsável começar.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {comAvaliacao.map((lider) => {
            const suas = dados.avaliacoes.filter((a) => a.lider_id === lider.id);
            return (
              <section key={lider.id} className="rounded-lg border border-border bg-background p-6">
                <div className="mb-5">
                  <h3 className="text-base font-semibold text-foreground">{lider.nome}</h3>
                  {lider.cargo ? (
                    <p className="mt-1 text-xs text-foreground/45">{lider.cargo}</p>
                  ) : null}
                </div>

                <div className="grid gap-3">
                  {suas.map((a) => {
                    const got = dados.respostasPorAvaliacao[a.id] ?? 0;
                    const exp = a.respondentes_esperados || 0;
                    const pct = exp > 0 ? Math.min(100, Math.round((got / exp) * 100)) : 0;
                    return (
                      <div key={a.id} className="rounded-md border border-border p-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <span className="text-[10px] uppercase tracking-[0.16em] text-foreground/50">
                            {TIPO_CURTO[a.tipo]}
                          </span>
                          <span className="font-mono text-[11px] tracking-wider text-primary">
                            {a.chave_avaliacao}
                          </span>
                        </div>
                        <div className="mt-3 flex items-center gap-3">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/8">
                            <div
                              className="h-full rounded-full bg-primary transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[11px] text-foreground/45">
                            {got}/{exp || "—"} respostas
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function Kpi({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold text-foreground">{valor}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-foreground/45">{rotulo}</p>
    </div>
  );
}
