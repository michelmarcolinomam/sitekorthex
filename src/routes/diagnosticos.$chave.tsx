import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  publicGetDiagnostico,
  publicSalvarLead,
  type AvaliacaoTipo,
  type DiagnosticoPublico,
} from "@/lib/diag-server";
import { KorthexLogo } from "@/components/blog/Chrome";

export const Route = createFileRoute("/diagnosticos/$chave")({
  loader: ({ params }) => publicGetDiagnostico({ data: params.chave }),
  head: () => ({
    meta: [
      { title: "Seu diagnóstico — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: TelaDiagnosticoCliente,
});

const TIPO_LABEL: Record<AvaliacaoTipo, { titulo: string; otica: string }> = {
  lideranca_time: { titulo: "Diagnóstico de Liderança", otica: "Visão do time" },
  lideranca_executivo: { titulo: "Diagnóstico de Liderança", otica: "Visão do executivo" },
  executivo_lideranca: { titulo: "Diagnóstico do Executivo", otica: "Visão da liderança" },
  performance_time: { titulo: "Diagnóstico de Performance", otica: "Visão do time" },
};

function TelaDiagnosticoCliente() {
  const diag = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[880px] items-center justify-between px-6 py-5">
          <a href="/" aria-label="Korthex">
            <KorthexLogo className="h-6 w-auto" />
          </a>
          <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">
            Diagnósticos
          </span>
        </div>
      </header>

      {diag ? <Conteudo diag={diag} /> : <NaoEncontrado />}

      <footer className="border-t border-border py-10">
        <p className="text-center text-[10px] uppercase tracking-[0.2em] text-foreground/35">
          Korthex · Mentoria executiva e desenvolvimento de liderança
        </p>
      </footer>
    </div>
  );
}

function NaoEncontrado() {
  return (
    <main className="mx-auto max-w-[880px] px-6 py-28 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Acesso</p>
      <h1 className="mt-4 text-2xl font-semibold">Chave não encontrada</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground/55">
        O link que você abriu não corresponde a nenhum diagnóstico ativo. Confira o
        endereço enviado pela Korthex ou fale com quem compartilhou o acesso.
      </p>
    </main>
  );
}

function Conteudo({ diag }: { diag: DiagnosticoPublico }) {
  return (
    <main className="mx-auto max-w-[880px] px-6 pb-24">
      {/* Hero personalizado */}
      <section className="pt-16 pb-12 md:pt-24">
        <p className="text-[11px] uppercase tracking-[0.3em] text-primary">
          Diagnóstico de Liderança
        </p>
        <h1 className="mt-5 text-3xl font-semibold leading-tight md:text-[42px] md:leading-[1.15]">
          Olá, <span className="text-primary">{diag.nome_empresa}</span>.
          <br />
          Aqui está o seu diagnóstico.
        </h1>
        <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-foreground/60">
          A Korthex preparou este ambiente exclusivo para mapear a liderança da sua
          empresa. As respostas da equipe se transformam em um retrato claro de onde
          a liderança sustenta o negócio — e onde ela precisa de reforço.
        </p>
      </section>

      {diag.lead_preenchido ? <Avaliacoes diag={diag} /> : <FormLead chave={diag.chave} />}
    </main>
  );
}

/* ─────────────────────────  Etapa 1 — captura do lead  ───────────────────────── */

function FormLead({ chave }: { chave: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", cargo: "", email: "", telefone: "" });
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);
    setErro(null);
    try {
      await publicSalvarLead({ data: { chave, ...form } });
      await router.invalidate();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  const campo =
    "w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary";
  const rotulo = "mb-2 block text-[10px] uppercase tracking-[0.2em] text-foreground/50";

  return (
    <section className="rounded-xl border border-border bg-card p-7 md:p-10">
      <div className="mb-8 max-w-lg">
        <h2 className="text-lg font-semibold">Antes de começar, quem acompanha por aí?</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/55">
          Precisamos de um responsável na empresa para conduzir o processo e receber
          os resultados. Leva menos de um minuto.
        </p>
      </div>

      <form onSubmit={enviar} className="grid gap-5 md:grid-cols-2">
        <div>
          <label className={rotulo} htmlFor="lead-nome">Seu nome *</label>
          <input id="lead-nome" required value={form.nome} onChange={set("nome")} placeholder="Nome completo" className={campo} />
        </div>
        <div>
          <label className={rotulo} htmlFor="lead-cargo">Cargo</label>
          <input id="lead-cargo" value={form.cargo} onChange={set("cargo")} placeholder="Ex.: Diretora de RH" className={campo} />
        </div>
        <div>
          <label className={rotulo} htmlFor="lead-email">E-mail corporativo *</label>
          <input id="lead-email" required type="email" value={form.email} onChange={set("email")} placeholder="voce@empresa.com.br" className={campo} />
        </div>
        <div>
          <label className={rotulo} htmlFor="lead-telefone">Telefone / WhatsApp</label>
          <input id="lead-telefone" value={form.telefone} onChange={set("telefone")} placeholder="(11) 99999-9999" className={campo} />
        </div>

        {erro ? (
          <p className="md:col-span-2 text-sm text-destructive">{erro}</p>
        ) : null}

        <div className="md:col-span-2 flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] leading-relaxed text-foreground/40">
            Seus dados ficam com a Korthex e são usados apenas para conduzir este diagnóstico.
          </p>
          <button
            type="submit"
            disabled={salvando}
            className="shrink-0 rounded-full bg-primary px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {salvando ? "Salvando…" : "Acessar diagnóstico"}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ────────────────────  Etapa 2 — diagnósticos liberados  ──────────────────── */

const AV_STATUS: Record<string, { label: string; cls: string }> = {
  aguardando: { label: "Aguardando respostas", cls: "bg-primary/12 text-primary" },
  concluida: { label: "Concluída", cls: "bg-emerald-500/12 text-emerald-700" },
};

function Avaliacoes({ diag }: { diag: DiagnosticoPublico }) {
  const primeiroNome = diag.responsavel_nome?.split(" ")[0];

  return (
    <section>
      <div className="mb-8 flex items-start justify-between gap-6">
        <div>
          <h2 className="text-lg font-semibold">
            {primeiroNome ? `${primeiroNome}, estes` : "Estes"} são os diagnósticos da sua equipe
          </h2>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-foreground/55">
            Cada avaliação abaixo foi preparada para uma pessoa e uma ótica específicas.
            Compartilhe o link de cada uma com quem vai responder.
          </p>
        </div>
      </div>

      {diag.avaliacoes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card px-8 py-16 text-center">
          <p className="text-sm font-medium">Tudo certo por aqui ✓</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground/55">
            Recebemos os seus dados. A Korthex está preparando as avaliações da sua
            equipe — assim que forem liberadas, elas aparecem nesta mesma página.
            Guarde este link.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {diag.avaliacoes.map((a) => {
            const tipo = TIPO_LABEL[a.tipo] ?? { titulo: "Diagnóstico", otica: a.tipo };
            const st = AV_STATUS[a.status] ?? { label: a.status, cls: "bg-foreground/8 text-foreground/55" };
            return (
              <article
                key={a.chave_avaliacao}
                className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] ${st.cls}`}>
                      {st.label}
                    </span>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">
                      {tipo.otica}
                    </span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold">{tipo.titulo}</h3>
                  {a.lider_nome ? (
                    <p className="mt-1 text-sm text-foreground/55">
                      Avaliando: {a.lider_nome}
                      {a.lider_cargo ? ` · ${a.lider_cargo}` : ""}
                    </p>
                  ) : null}
                </div>
                <span className="shrink-0 font-mono text-[11px] tracking-wider text-primary/70">
                  {a.chave_avaliacao}
                </span>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
