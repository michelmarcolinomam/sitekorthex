import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  adminListClientes,
  adminCreateCliente,
  adminArchiveCliente,
  type Cliente,
} from "@/lib/diag-server";
import { KorthexLogo } from "@/components/blog/Chrome";

export const Route = createFileRoute("/admin/diagnosticos/")({
  loader: () => adminListClientes(),
  head: () => ({
    meta: [
      { title: "Diagnósticos — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PainelDiagnosticos,
});

const STATUS_LABEL: Record<Cliente["status"], string> = {
  criado: "Chave criada",
  lead: "Lead capturado",
  ativo: "Ativo",
  arquivado: "Arquivado",
};
const STATUS_CLS: Record<Cliente["status"], string> = {
  criado: "bg-foreground/8 text-foreground/55",
  lead: "bg-amber-500/12 text-amber-700",
  ativo: "bg-primary/12 text-primary",
  arquivado: "bg-foreground/8 text-foreground/40",
};

function PainelDiagnosticos() {
  const clientes = Route.useLoaderData();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const ativos = clientes.filter((c) => c.status !== "arquivado");

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    const n = nome.trim();
    if (!n || salvando) return;
    setSalvando(true);
    try {
      await adminCreateCliente({ data: { nome_empresa: n } });
      setNome("");
      await router.invalidate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao criar cliente.");
    } finally {
      setSalvando(false);
    }
  };

  const arquivar = async (c: Cliente) => {
    if (!window.confirm(`Arquivar "${c.nome_empresa}"? Some da lista, sem apagar os dados.`)) return;
    await adminArchiveCliente({ data: c.id });
    void router.invalidate();
  };

  const copiarLink = (chave: string) => {
    const url = `${window.location.origin}/diagnosticos/${chave}`;
    void navigator.clipboard?.writeText(url);
    setCopiado(chave);
    setTimeout(() => setCopiado((k) => (k === chave ? null : k)), 1800);
  };

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
            href="/admin"
            className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 hover:text-primary"
          >
            ← Painel
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-12">
        {/* Criar cliente */}
        <form
          onSubmit={criar}
          className="mb-10 flex flex-col gap-4 rounded-lg border border-border bg-background p-6 md:flex-row md:items-end"
        >
          <div className="flex-1">
            <label className="mb-2 block text-[10px] uppercase tracking-[0.2em] text-foreground/50">
              Novo cliente — nome da empresa
            </label>
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Nexa Logística"
              className="w-full rounded-md border border-border bg-[color:var(--surface)] px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={salvando || !nome.trim()}
            className="rounded-full bg-primary px-7 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {salvando ? "Gerando…" : "Gerar chave"}
          </button>
        </form>

        {/* Lista */}
        {ativos.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-background py-24 text-center">
            <p className="text-sm text-foreground/50">Nenhum cliente ainda.</p>
            <p className="mt-2 text-xs text-foreground/40">
              Crie o primeiro acima — a chave é gerada automaticamente.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-background">
            {ativos.map((c, i) => (
              <div
                key={c.id}
                className={`flex flex-col gap-4 px-6 py-5 md:flex-row md:items-center md:gap-6 ${
                  i === ativos.length - 1 ? "" : "border-b border-border"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] ${STATUS_CLS[c.status]}`}
                    >
                      {STATUS_LABEL[c.status]}
                    </span>
                    <span className="font-mono text-[11px] tracking-wider text-primary">
                      {c.chave}
                    </span>
                  </div>
                  <h2 className="mt-2 truncate text-base font-semibold text-foreground">
                    {c.nome_empresa}
                  </h2>
                  {c.responsavel_nome ? (
                    <p className="mt-1 truncate text-xs text-foreground/45">
                      {c.responsavel_nome}
                      {c.responsavel_email ? ` · ${c.responsavel_email}` : ""}
                      {c.responsavel_telefone ? ` · ${c.responsavel_telefone}` : ""}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-foreground/35">Aguardando preenchimento do lead</p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  <button
                    type="button"
                    onClick={() => copiarLink(c.chave)}
                    className="text-[10px] uppercase tracking-[0.16em] text-primary hover:underline"
                  >
                    {copiado === c.chave ? "Copiado ✓" : "Copiar link"}
                  </button>
                  <a
                    href={`/diagnosticos/${c.chave}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] uppercase tracking-[0.16em] text-foreground/50 hover:text-primary"
                  >
                    Abrir
                  </a>
                  <button
                    type="button"
                    onClick={() => void arquivar(c)}
                    className="text-[10px] uppercase tracking-[0.16em] text-foreground/40 hover:text-destructive"
                  >
                    Arquivar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
