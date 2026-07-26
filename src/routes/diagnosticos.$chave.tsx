import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  publicGetPainel,
  publicSalvarLead,
  publicCreateAvaliacoes,
  publicArchiveAvaliacao,
  type AvaliacaoTipo,
  type PainelCliente,
} from "@/lib/diag-server";
import { validaLead } from "@/lib/lead-validacao";
import { KorthexLogo } from "@/components/blog/Chrome";

export const Route = createFileRoute("/diagnosticos/$chave")({
  loader: ({ params }) => publicGetPainel({ data: params.chave }),
  head: () => ({
    meta: [
      { title: "Seu diagnóstico — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PainelDoCliente,
});

/** Catálogo de diagnósticos que a empresa pode aplicar. */
const CATALOGO: {
  valor: AvaliacaoTipo;
  titulo: string;
  descricao: string;
  disponivel: boolean;
}[] = [
  {
    valor: "lideranca_time",
    titulo: "Visão do time",
    descricao: "Os liderados avaliam a liderança — a leitura de baixo para cima.",
    disponivel: true,
  },
  {
    valor: "lideranca_executivo",
    titulo: "Visão do executivo",
    descricao: "Sócios e diretoria avaliam a liderança — a leitura de cima para baixo.",
    disponivel: true,
  },
  {
    valor: "executivo_lideranca",
    titulo: "Liderança avalia o executivo",
    descricao: "Em breve.",
    disponivel: false,
  },
  {
    valor: "performance_lideranca",
    titulo: "A liderança avalia a equipe",
    descricao: "Em breve.",
    disponivel: false,
  },
  {
    valor: "performance_executivo",
    titulo: "O executivo avalia a equipe",
    descricao: "Em breve.",
    disponivel: false,
  },
];

const TIPO_CURTO: Record<AvaliacaoTipo, string> = {
  lideranca_time: "Visão do time",
  lideranca_executivo: "Visão do executivo",
  executivo_lideranca: "Liderança → executivo",
  performance_lideranca: "Equipe · visão da liderança",
  performance_executivo: "Equipe · visão do executivo",
};

function PainelDoCliente() {
  const painel = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[980px] items-center justify-between px-6 py-5">
          <a href="/" aria-label="Korthex">
            <KorthexLogo className="h-6 w-auto" />
          </a>
          <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">
            {painel?.lead_preenchido ? "Painel de avaliação" : "Diagnósticos"}
          </span>
        </div>
      </header>

      {painel ? <Conteudo painel={painel} /> : <NaoEncontrado />}

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
    <main className="mx-auto max-w-[980px] px-6 py-28 text-center">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">Acesso</p>
      <h1 className="mt-4 text-2xl font-semibold">Chave não encontrada</h1>
      <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground/55">
        O link que você abriu não corresponde a nenhum diagnóstico ativo. Confira o
        endereço enviado pela Korthex ou fale com quem compartilhou o acesso.
      </p>
    </main>
  );
}

function Conteudo({ painel }: { painel: PainelCliente }) {
  if (!painel.lead_preenchido) {
    return (
      <main className="mx-auto max-w-[980px] px-6 pb-24">
        <Boas nome={painel.nome_empresa} />
        <FormLead chave={painel.chave} />
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[980px] px-6 pb-24">
      <CabecalhoPainel painel={painel} />
      <GerarAvaliacao chave={painel.chave} />
      <ListaLideres painel={painel} />
      <MapaTeaser painel={painel} />
    </main>
  );
}

function Boas({ nome }: { nome: string }) {
  return (
    <section className="pt-16 pb-12 md:pt-24">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">
        Diagnóstico de Liderança
      </p>
      <h1 className="mt-5 text-3xl font-semibold leading-tight md:text-[42px] md:leading-[1.15]">
        Olá, <span className="text-primary">{nome}</span>.
        <br />
        Aqui está o seu diagnóstico.
      </h1>
      <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-foreground/60">
        A Korthex preparou este ambiente exclusivo para mapear a liderança da sua
        empresa. As respostas da equipe se transformam em um retrato claro de onde
        a liderança sustenta o negócio — e onde ela precisa de reforço.
      </p>
    </section>
  );
}

/* ─────────────────────────  Etapa 1 — captura do lead  ───────────────────────── */

type CampoLead = "nome" | "cargo" | "email" | "telefone";

/** Máscara de telefone conforme digita: (11) 99999-9999 */
function mascaraTelefone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

function FormLead({ chave }: { chave: string }) {
  const router = useRouter();
  const [form, setForm] = useState({ nome: "", cargo: "", email: "", telefone: "" });
  const [tocado, setTocado] = useState<Partial<Record<CampoLead, boolean>>>({});
  const [erros, setErros] = useState<Partial<Record<CampoLead, string>>>({});
  const [salvando, setSalvando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  // Mesma régua do servidor, aqui só para avisar enquanto digita.
  const local = validaLead(form);
  // (a validação local só alimenta as mensagens; o servidor é quem decide)

  const set = (k: CampoLead) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = k === "telefone" ? mascaraTelefone(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErros((x) => ({ ...x, [k]: undefined }));
  };
  const marcaTocado = (k: CampoLead) => () => setTocado((t) => ({ ...t, [k]: true }));

  /** Só mostra o erro depois que a pessoa saiu do campo ou tentou enviar. */
  const erroDe = (k: CampoLead) => erros[k] ?? (tocado[k] ? local.erros[k] : undefined);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (salvando) return;
    setTocado({ nome: true, cargo: true, email: true, telefone: true });
    setFalha(null);
    if (!local.ok) return;

    setSalvando(true);
    try {
      const r = await publicSalvarLead({ data: { chave, ...form } });
      if (!r.ok) {
        setErros(r.erros);
        return;
      }
      await router.invalidate();
    } catch (err) {
      setFalha(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-card p-7 md:p-10">
      <div className="mb-8 max-w-lg">
        <h2 className="text-lg font-semibold">Antes de começar, quem acompanha por aí?</h2>
        <p className="mt-2 text-sm leading-relaxed text-foreground/55">
          Precisamos de um responsável na empresa para conduzir o processo e receber
          os resultados. Todos os campos são obrigatórios.
        </p>
      </div>

      <form onSubmit={enviar} noValidate className="grid gap-5 md:grid-cols-2">
        <CampoTexto
          id="lead-nome"
          rotulo="Seu nome completo"
          valor={form.nome}
          onChange={set("nome")}
          onBlur={marcaTocado("nome")}
          erro={erroDe("nome")}
          placeholder="Nome e sobrenome"
          autoComplete="name"
        />
        <CampoTexto
          id="lead-cargo"
          rotulo="Cargo"
          valor={form.cargo}
          onChange={set("cargo")}
          onBlur={marcaTocado("cargo")}
          erro={erroDe("cargo")}
          placeholder="Ex.: Diretora de RH"
          autoComplete="organization-title"
        />
        <CampoTexto
          id="lead-email"
          rotulo="E-mail corporativo"
          tipo="email"
          valor={form.email}
          onChange={set("email")}
          onBlur={marcaTocado("email")}
          erro={erroDe("email")}
          placeholder="voce@empresa.com.br"
          autoComplete="email"
        />
        <CampoTexto
          id="lead-telefone"
          rotulo="Telefone / WhatsApp"
          tipo="tel"
          valor={form.telefone}
          onChange={set("telefone")}
          onBlur={marcaTocado("telefone")}
          erro={erroDe("telefone")}
          placeholder="(11) 99999-9999"
          autoComplete="tel"
        />

        {falha ? <p className="md:col-span-2 text-sm text-destructive">{falha}</p> : null}

        <div className="md:col-span-2 flex flex-col gap-3 pt-2 md:flex-row md:items-center md:justify-between">
          <p className="text-[11px] leading-relaxed text-foreground/40">
            Seus dados ficam com a Korthex e são usados apenas para conduzir este diagnóstico.
          </p>
          {/* Botão sempre ativo: quem clica precisa DESCOBRIR o que falta,
              não bater num botão morto. A trava real está no servidor. */}
          <button type="submit" disabled={salvando} className={`${BOTAO} shrink-0`}>
            {salvando ? "Verificando…" : "Acessar painel"}
          </button>
        </div>
      </form>
    </section>
  );
}

function CampoTexto({
  id,
  rotulo,
  valor,
  onChange,
  onBlur,
  erro,
  placeholder,
  tipo = "text",
  autoComplete,
}: {
  id: string;
  rotulo: string;
  valor: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur: () => void;
  erro?: string;
  placeholder?: string;
  tipo?: string;
  autoComplete?: string;
}) {
  return (
    <div>
      <label className={ROTULO} htmlFor={id}>
        {rotulo} <span className="text-primary">*</span>
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={Boolean(erro)}
        aria-describedby={erro ? `${id}-erro` : undefined}
        className={`${CAMPO} ${erro ? "border-destructive focus:border-destructive" : ""}`}
      />
      {erro ? (
        <p id={`${id}-erro`} className="mt-1.5 text-xs text-destructive">
          {erro}
        </p>
      ) : null}
    </div>
  );
}

/* ──────────────────  Etapa 2 — o painel: a empresa gera  ────────────────── */

const CAMPO =
  "w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary";
const ROTULO = "mb-2 block text-[10px] uppercase tracking-[0.2em] text-foreground/50";
const BOTAO =
  "rounded-full bg-primary px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:opacity-40";

function CabecalhoPainel({ painel }: { painel: PainelCliente }) {
  const primeiro = painel.responsavel_nome?.split(" ")[0];
  const lideres = painel.lideres.filter((l) =>
    painel.avaliacoes.some((a) => a.lider_id === l.id),
  ).length;
  const respostas = Object.values(painel.respostasPorAvaliacao).reduce((s, n) => s + n, 0);

  return (
    <section className="pt-14 pb-10">
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">
        Painel de avaliação
      </p>
      <h1 className="mt-4 text-3xl font-semibold leading-tight md:text-[38px]">
        {painel.nome_empresa}
      </h1>
      <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-foreground/60">
        {primeiro ? `${primeiro}, escolha` : "Escolha"} quais avaliações aplicar e em quem.
        Você gera o link de cada questionário aqui e envia para quem vai responder — a
        Korthex recebe apenas os resultados.
      </p>

      <div className="mt-8 flex flex-wrap gap-8">
        <Kpi valor={lideres} rotulo="Líderes em avaliação" />
        <Kpi valor={painel.avaliacoes.length} rotulo="Avaliações geradas" />
        <Kpi valor={respostas} rotulo="Respostas recebidas" />
      </div>
    </section>
  );
}

function Kpi({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold text-foreground">{valor}</p>
      <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-foreground/45">{rotulo}</p>
    </div>
  );
}

function GerarAvaliacao({ chave }: { chave: string }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
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
      const r = await publicCreateAvaliacoes({
        data: {
          chave,
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
      } else {
        setAberto(false);
      }
      await router.invalidate();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao gerar avaliação.");
    } finally {
      setSalvando(false);
    }
  };

  if (!aberto) {
    return (
      <div className="mb-10">
        <button type="button" onClick={() => setAberto(true)} className={BOTAO}>
          + Nova avaliação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={gerar} className="mb-10 rounded-xl border border-border bg-card p-7 md:p-8">
      <div className="mb-7 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Gerar nova avaliação</h2>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-sm text-foreground/40 hover:text-foreground"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="md:col-span-2">
          <label className={ROTULO} htmlFor="lider-nome">Líder a ser avaliado *</label>
          <input
            id="lider-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Marina Prado"
            className={CAMPO}
          />
        </div>
        <div>
          <label className={ROTULO} htmlFor="lider-esperados">Respondentes esperados</label>
          <input
            id="lider-esperados"
            type="number"
            min={0}
            max={200}
            value={esperados}
            onChange={(e) => setEsperados(e.target.value)}
            className={CAMPO}
          />
        </div>
        <div className="md:col-span-3">
          <label className={ROTULO} htmlFor="lider-cargo">Cargo</label>
          <input
            id="lider-cargo"
            value={cargo}
            onChange={(e) => setCargo(e.target.value)}
            placeholder="Ex.: Gerente de Operações"
            className={CAMPO}
          />
        </div>
      </div>

      <p className={`${ROTULO} mt-7`}>Quem vai avaliar este líder?</p>
      <div className="grid gap-3 md:grid-cols-2">
        {CATALOGO.map((c) => {
          const marcado = tipos.includes(c.valor);
          return (
            <label
              key={c.valor}
              className={`flex gap-3 rounded-md border p-4 transition-colors ${
                marcado ? "border-primary bg-primary/5" : "border-border"
              } ${c.disponivel ? "cursor-pointer hover:border-primary/40" : "opacity-50"}`}
            >
              <input
                type="checkbox"
                checked={marcado}
                onChange={() => alternar(c.valor)}
                disabled={!c.disponivel}
                className="mt-0.5 accent-[color:var(--primary)]"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{c.titulo}</span>
                <span className="mt-0.5 block text-xs text-foreground/50">{c.descricao}</span>
              </span>
            </label>
          );
        })}
      </div>

      {erro ? <p className="mt-5 text-sm text-destructive">{erro}</p> : null}
      {aviso ? <p className="mt-5 text-sm text-amber-700">{aviso}</p> : null}

      <div className="mt-7 flex justify-end gap-4">
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-[11px] uppercase tracking-[0.2em] text-foreground/50 hover:text-foreground"
        >
          Cancelar
        </button>
        <button type="submit" disabled={salvando || !nome.trim() || !tipos.length} className={BOTAO}>
          {salvando ? "Gerando…" : "Gerar avaliação"}
        </button>
      </div>
    </form>
  );
}

function ListaLideres({ painel }: { painel: PainelCliente }) {
  const router = useRouter();
  const [copiada, setCopiada] = useState<string | null>(null);

  const copiar = (chaveAv: string) => {
    void navigator.clipboard?.writeText(`${window.location.origin}/avaliacao/${chaveAv}`);
    setCopiada(chaveAv);
    setTimeout(() => setCopiada((k) => (k === chaveAv ? null : k)), 1800);
  };

  const arquivar = async (id: string, rotulo: string) => {
    if (!window.confirm(`Arquivar a avaliação ${rotulo}? O link para de funcionar.`)) return;
    await publicArchiveAvaliacao({ data: { chave: painel.chave, avaliacao_id: id } });
    void router.invalidate();
  };

  const comAvaliacao = painel.lideres.filter((l) =>
    painel.avaliacoes.some((a) => a.lider_id === l.id),
  );

  if (comAvaliacao.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card px-8 py-16 text-center">
        <p className="text-sm font-medium">Nenhuma avaliação ainda</p>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground/55">
          Comece por um líder: clique em "Nova avaliação", diga quem será avaliado e
          quem vai responder. O link do questionário é gerado na hora.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      <h2 className="text-lg font-semibold">Líderes em avaliação</h2>
      {comAvaliacao.map((lider) => {
        const suas = painel.avaliacoes.filter((a) => a.lider_id === lider.id);
        const temResposta = suas.some((a) => (painel.respostasPorAvaliacao[a.id] ?? 0) > 0);
        const completo = suas.every((a) => {
          const got = painel.respostasPorAvaliacao[a.id] ?? 0;
          return a.respondentes_esperados > 0 && got >= a.respondentes_esperados;
        });
        return (
          <section key={lider.id} className="rounded-xl border border-border bg-card p-6">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">{lider.nome}</h3>
                {lider.cargo ? <p className="mt-1 text-xs text-foreground/45">{lider.cargo}</p> : null}
              </div>
              {temResposta ? (
                <a
                  href={`/diagnosticos/${painel.chave}/lider/${lider.id}`}
                  className="shrink-0 rounded-full border border-primary px-5 py-2 text-[10px] uppercase tracking-[0.16em] text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  Ver resultado {completo ? "" : "parcial"}
                </a>
              ) : null}
            </div>

            <div className="grid gap-3">
              {suas.map((a) => {
                const got = painel.respostasPorAvaliacao[a.id] ?? 0;
                const exp = a.respondentes_esperados || 0;
                const pct = exp > 0 ? Math.min(100, Math.round((got / exp) * 100)) : 0;
                const completa = exp > 0 && got >= exp;
                return (
                  <div key={a.id} className="rounded-md border border-border p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] ${
                            completa
                              ? "bg-emerald-500/12 text-emerald-700"
                              : "bg-primary/12 text-primary"
                          }`}
                        >
                          {completa ? "Concluída" : "Aguardando respostas"}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.16em] text-foreground/50">
                          {TIPO_CURTO[a.tipo]}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => copiar(a.chave_avaliacao)}
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

function MapaTeaser({ painel }: { painel: PainelCliente }) {
  const total = painel.avaliacoes.length;
  if (total === 0) return null;

  const concluidas = painel.avaliacoes.filter((a) => {
    const got = painel.respostasPorAvaliacao[a.id] ?? 0;
    return a.respondentes_esperados > 0 && got >= a.respondentes_esperados;
  }).length;
  const respondidas = painel.avaliacoes.filter(
    (a) => (painel.respostasPorAvaliacao[a.id] ?? 0) > 0,
  ).length;
  const liberado = concluidas === total;

  return (
    <section className="mt-10 rounded-xl border border-border bg-[color:var(--surface)] p-7 md:p-8">
      <h3 className="text-base font-semibold">Mapa da liderança da empresa</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/55">
        Quando todas as avaliações forem respondidas, a Korthex consolida o retrato da
        liderança da empresa inteira — a leitura que mostra o que é caso individual e o
        que virou padrão de cultura.
      </p>
      <div className="mt-5 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-foreground/8">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${total ? Math.round((concluidas / total) * 100) : 0}%` }}
          />
        </div>
        <span className="shrink-0 text-[11px] text-foreground/45">
          {concluidas} de {total} concluídas
        </span>
      </div>
      {respondidas > 0 ? (
        <a
          href={`/diagnosticos/${painel.chave}/mapa`}
          className="mt-5 inline-block rounded-full bg-primary px-7 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90"
        >
          {liberado ? "Ver o mapa da liderança" : "Ver o mapa parcial"}
        </a>
      ) : null}
    </section>
  );
}
