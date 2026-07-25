import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  adminGetCliente,
  adminCreateAvaliacoes,
  adminArchiveAvaliacao,
  type AvaliacaoTipo,
  type ClienteDetalhe,
} from "@/lib/diag-server";
import { KorthexLogo } from "@/components/blog/Chrome";

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

const TIPOS: {
  valor: AvaliacaoTipo;
  titulo: string;
  descricao: string;
  pronto: boolean;
}[] = [
  {
    valor: "lideranca_time",
    titulo: "Time avalia a liderança",
    descricao: "Visão de baixo — como os liderados enxergam o líder",
    pronto: true,
  },
  {
    valor: "lideranca_executivo",
    titulo: "Executivo avalia a liderança",
    descricao: "Visão de cima — como sócios e diretoria enxergam o líder",
    pronto: true,
  },
  {
    valor: "executivo_lideranca",
    titulo: "Liderança avalia o executivo",
    descricao: "Questionário ainda em construção",
    pronto: false,
  },
  {
    valor: "performance_time",
    titulo: "Performance do time",
    descricao: "Questionário ainda em construção",
    pronto: false,
  },
];

const TIPO_CURTO: Record<AvaliacaoTipo, string> = {
  lideranca_time: "Visão do time",
  lideranca_executivo: "Visão do executivo",
  executivo_lideranca: "Liderança → executivo",
  performance_time: "Performance do time",
};

function DetalheCliente() {
  const dados = Route.useLoaderData();

  if (!dados) {
    return (
      <Moldura>
        <div className="py-24 text-center">
          <h1 className="text-xl font-semibold">Cliente não encontrado</h1>
          <a href="/admin/diagnosticos" className="mt-4 inline-block text-sm text-primary hover:underline">
            ← Voltar para a lista
          </a>
        </div>
      </Moldura>
    );
  }

  return (
    <Moldura>
      <Cabecalho dados={dados} />
      <FormNovaAvaliacao clienteId={dados.cliente.id} />
      <ListaLideres dados={dados} />
    </Moldura>
  );
}

function Moldura({ children }: { children: React.ReactNode }) {
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
      <main className="mx-auto max-w-[1100px] px-6 py-12">{children}</main>
    </div>
  );
}

function Cabecalho({ dados }: { dados: ClienteDetalhe }) {
  const { cliente } = dados;
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    void navigator.clipboard?.writeText(
      `${window.location.origin}/diagnosticos/${cliente.chave}`,
    );
    setCopiado(true);
    setTimeout(() => setCopiado(false), 1800);
  };

  return (
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
            {copiado ? "Copiado ✓" : "Copiar link do cliente"}
          </button>
          <a
            href={`/diagnosticos/${cliente.chave}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] uppercase tracking-[0.16em] text-foreground/50 hover:text-primary"
          >
            Abrir
          </a>
        </div>
      </div>
    </section>
  );
}

function FormNovaAvaliacao({ clienteId }: { clienteId: string }) {
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [cargo, setCargo] = useState("");
  const [esperados, setEsperados] = useState("6");
  const [tipos, setTipos] = useState<AvaliacaoTipo[]>(["lideranca_time"]);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  const alternar = (t: AvaliacaoTipo) =>
    setTipos((atual) => (atual.includes(t) ? atual.filter((x) => x !== t) : [...atual, t]));

  const gerar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await adminCreateAvaliacoes({
        data: {
          cliente_id: clienteId,
          lider_nome: nome,
          lider_cargo: cargo,
          tipos,
          respondentes_esperados: Number(esperados) || 0,
        },
      });
      setNome("");
      setCargo("");
      if (r.criadas === 0) {
        setAviso("Esse líder já tem avaliação aberta nessas óticas — nada foi duplicado.");
      } else if (r.jaExistiam > 0) {
        setAviso(`${r.criadas} avaliação(ões) gerada(s). ${r.jaExistiam} já existia(m).`);
      }
      await router.invalidate();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar avaliação.");
    } finally {
      setSalvando(false);
    }
  };

  const campo =
    "w-full rounded-md border border-border bg-[color:var(--surface)] px-4 py-3 text-sm text-foreground outline-none focus:border-primary";
  const rotulo = "mb-2 block text-[10px] uppercase tracking-[0.2em] text-foreground/50";

  return (
    <form onSubmit={gerar} className="mb-10 rounded-lg border border-border bg-background p-6">
      <h2 className="mb-6 text-base font-semibold text-foreground">Gerar nova avaliação</h2>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className={rotulo} htmlFor="lider-nome">Líder a ser avaliado *</label>
          <input
            id="lider-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Marina Prado"
            className={campo}
          />
        </div>
        <div>
          <label className={rotulo} htmlFor="lider-esperados">Respondentes esperados</label>
          <input
            id="lider-esperados"
            type="number"
            min={0}
            max={200}
            value={esperados}
            onChange={(e) => setEsperados(e.target.value)}
            className={campo}
          />
        </div>
        <div className="md:col-span-3">
          <label className={rotulo} htmlFor="lider-cargo">Cargo</label>
          <input
            id="lider-cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Ex.: Gerente de Operações"
            className={campo}
          />
        </div>
      </div>

      <p className={`${rotulo} mt-7`}>Óticas a aplicar</p>
      <div className="grid gap-3 md:grid-cols-2">
        {TIPOS.map((t) => {
          const marcado = tipos.includes(t.valor);
          return (
            <label
              key={t.valor}
              className={`flex cursor-pointer gap-3 rounded-md border p-4 transition-colors ${
                marcado ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              } ${t.pronto ? "" : "opacity-60"}`}
            >
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => alternar(t.valor)}
                disabled={!t.pronto}
                className="mt-0.5 accent-[color:var(--primary)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{t.titulo}</span>
                <span className="mt-0.5 block text-xs text-foreground/50">{t.descricao}</span>
              </span>
            </label>
          );
        })}
      </div>

      {erro ? <p className="mt-5 text-sm text-destructive">{erro}</p> : null}
      {aviso ? <p className="mt-5 text-sm text-amber-700">{aviso}</p> : null}

      <div className="mt-7 flex justify-end">
        <button
          type="submit"
          disabled={salvando || !nome.trim() || tipos.length === 0}
          className="rounded-full bg-primary px-8 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
        >
          {salvando ? "Gerando…" : "Gerar avaliação"}
        </button>
      </div>
    </form>
  );
}

function ListaLideres({ dados }: { dados: ClienteDetalhe }) {
  const router = useRouter();
  const [copiada, setCopiada] = useState<string | null>(null);

  const ativas = dados.avaliacoes.filter((a) => a.status !== "arquivada");

  const copiarAv = (chave: string) => {
    void navigator.clipboard?.writeText(`${window.location.origin}/avaliacao/${chave}`);
    setCopiada(chave);
    setTimeout(() => setCopiada((k) => (k === chave ? null : k)), 1800);
  };

  const arquivar = async (id: string, rotulo: string) => {
    if (!window.confirm(`Arquivar a avaliação ${rotulo}? Ela some da tela do cliente.`)) return;
    await adminArchiveAvaliacao({ data: id });
    void router.invalidate();
  };

  const comAvaliacao = dados.lideres.filter((l) =>
    ativas.some((a) => a.lider_id === l.id),
  );

  if (comAvaliacao.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border bg-background py-20 text-center">
        <p className="text-sm text-foreground/50">Nenhuma avaliação gerada ainda.</p>
        <p className="mt-2 text-xs text-foreground/40">
          Cadastre o primeiro líder acima — o link do questionário é gerado na hora.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {comAvaliacao.map((lider) => {
        const suas = ativas.filter((a) => a.lider_id === lider.id);
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
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] uppercase tracking-[0.16em] text-foreground/50">
                          {TIPO_CURTO[a.tipo]}
                        </span>
                        <span className="font-mono text-[11px] tracking-wider text-primary">
                          {a.chave_avaliacao}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => copiarAv(a.chave_avaliacao)}
                          className="text-[10px] uppercase tracking-[0.16em] text-primary hover:underline"
                        >
                          {copiada === a.chave_avaliacao ? "Copiado ✓" : "Copiar link"}
                        </button>
                        <button
                          type="button"
                          onClick={() => void arquivar(a.id, a.chave_avaliacao)}
                          className="text-[10px] uppercase tracking-[0.16em] text-foreground/40 hover:text-destructive"
                        >
                          Arquivar
                        </button>
                      </div>
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
  );
}
