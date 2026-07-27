import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { publicSolicitarDiagnostico } from "@/lib/diag-server";
import {
  validaSolicitacao,
  mascaraTelefone,
  TAMANHOS_EMPRESA,
  type ResultadoSolicitacao,
} from "@/lib/lead-validacao";
import { CAMPO, ROTULO } from "@/components/diagnosticos/estilos-painel";
import { KorthexLogo } from "@/components/blog/Chrome";

/**
 * A porta de entrada do diagnóstico gratuito — o destino de todos os botões
 * "Faça um diagnóstico gratuito" do site.
 *
 * O acesso NÃO é automático: a solicitação nasce com a chave gerada e não
 * entregue, e a Korthex libera. A tela é honesta sobre isso, porque prometer
 * acesso imediato e não entregar é pior do que avisar que há uma conferência.
 */
export const Route = createFileRoute("/diagnostico")({
  head: () => ({
    meta: [
      { title: "Diagnóstico gratuito de liderança — Korthex" },
      {
        name: "description",
        content:
          "Solicite o diagnóstico Korthex e descubra onde a sua empresa trava: cada camada é lida por quem depende dela, e a distância entre as leituras mostra o problema.",
      },
      { property: "og:title", content: "Diagnóstico Korthex — uma leitura real do seu time" },
      {
        property: "og:description",
        content:
          "Pare de discutir o que trava por opinião. Peça o diagnóstico gratuito da sua empresa.",
      },
      { property: "og:url", content: "https://korthex.com.br/diagnostico" },
      { property: "og:image", content: "https://korthex.com.br/assets/og-diagnostico.jpg" },
      { name: "twitter:image", content: "https://korthex.com.br/assets/og-diagnostico.jpg" },
    ],
    links: [{ rel: "canonical", href: "https://korthex.com.br/diagnostico" }],
  }),
  component: PaginaDiagnostico,
});

type Campo = "empresa" | "nome" | "cargo" | "email" | "telefone" | "tamanho";

const VAZIO = { empresa: "", nome: "", cargo: "", email: "", telefone: "", tamanho: "" };

/** O que a empresa ganha. Texto alinhado com a tela de boas-vindas do painel. */
const VALOR = [
  {
    titulo: "Separa problema de pessoa de problema de cultura",
    texto:
      "Uma fragilidade que aparece num líder é caso individual. A mesma repetida em vários é padrão da casa — e a resposta para cada uma tem custo diferente.",
  },
  {
    titulo: "Mostra o custo escondido da condução",
    texto:
      "Retrabalho por ordem mal entendida, decisão que volta atrás, gente boa que pede demissão. O diagnóstico diz em que ponto da liderança isso nasce.",
  },
  {
    titulo: "Expõe a dependência do topo",
    texto:
      "O crescimento para no tamanho da agenda de uma pessoa. Medir isso é o começo de qualquer conversa séria sobre sucessão e autonomia.",
  },
  {
    titulo: "Relatórios prontos para decidir",
    texto:
      "Leitura por dimensão, mapa da liderança da empresa e ranking — não planilha de respostas.",
  },
];

function PaginaDiagnostico() {
  const [pronto, setPronto] = useState<{ empresa: string; email: string; telefone: string } | null>(
    null,
  );

  return (
    <main className="min-h-screen bg-background">
      <header className="px-6 md:px-12 py-7">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between gap-6">
          <Link to="/" aria-label="Korthex — página inicial">
            <KorthexLogo className="h-6 w-auto text-foreground" />
          </Link>
          <Link
            to="/"
            className="text-[11px] uppercase tracking-[0.2em] text-foreground/50 hover:text-primary transition-colors"
          >
            ← Voltar ao site
          </Link>
        </div>
      </header>

      <div className="px-6 md:px-12 pb-28">
        <div className="mx-auto max-w-[1200px]">
          {pronto ? (
            <Confirmacao {...pronto} />
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-20 items-start pt-8">
              <Argumento />
              <Formulario onPronto={setPronto} />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Argumento() {
  return (
    <section>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">
        Diagnóstico gratuito
      </p>

      <h1
        className="mt-5 text-display text-foreground"
        style={{ fontSize: "clamp(2rem,4.4vw,3.4rem)", lineHeight: 0.95 }}
      >
        Sua empresa discute o que trava{" "}
        <span className="italic font-serif normal-case text-primary">em opinião.</span>
      </h1>

      <p className="mt-6 max-w-[46ch] text-foreground/70 leading-relaxed">
        O diagnóstico Korthex transforma percepção em dado. Ninguém se avalia sozinho: cada camada
        é lida por quem depende dela — e é a distância entre as leituras que mostra onde está o
        problema.
      </p>

      <ul className="mt-10 border-t border-border">
        {VALOR.map((v, i) => (
          <li key={v.titulo} className="grid grid-cols-[2rem_1fr] gap-3 py-5 border-b border-border">
            <span className="pt-0.5 text-[11px] font-bold tabular-nums text-foreground/40">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div>
              <h2 className="text-sm font-semibold tracking-tight">{v.titulo}</h2>
              <p className="mt-1 text-[13px] leading-relaxed text-foreground/65">{v.texto}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Formulario({
  onPronto,
}: {
  onPronto: (v: { empresa: string; email: string; telefone: string }) => void;
}) {
  const [form, setForm] = useState(VAZIO);
  const [tocado, setTocado] = useState<Partial<Record<Campo, boolean>>>({});
  const [erros, setErros] = useState<ResultadoSolicitacao["erros"]>({});
  const [enviando, setEnviando] = useState(false);
  const [falha, setFalha] = useState<string | null>(null);

  // Mesma régua do servidor; aqui só para avisar enquanto digita.
  const local = validaSolicitacao(form);

  const set = (k: Campo) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const v = k === "telefone" ? mascaraTelefone(e.target.value) : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErros((x) => ({ ...x, [k]: undefined }));
  };
  const marcaTocado = (k: Campo) => () => setTocado((t) => ({ ...t, [k]: true }));

  /** Só mostra o erro depois que a pessoa saiu do campo ou tentou enviar. */
  const erroDe = (k: Campo) => erros[k] ?? (tocado[k] ? local.erros[k] : undefined);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    setTocado({ empresa: true, nome: true, cargo: true, email: true, telefone: true, tamanho: true });
    setFalha(null);
    if (!local.ok) return;

    setEnviando(true);
    try {
      const r = await publicSolicitarDiagnostico({ data: form });
      if (!r.ok) {
        setErros(r.erros);
        return;
      }
      // Conversão real, igual ao formulário de contato: alimenta GA4 e Ads.
      if (typeof window !== "undefined") {
        const w = window as unknown as { gtag?: (...a: unknown[]) => void };
        w.gtag?.("event", "generate_lead", { event_category: "diagnostico" });
      }
      onPronto({ empresa: r.empresa, email: r.email, telefone: r.telefone });
    } catch (err) {
      setFalha(
        err instanceof Error ? err.message : "Não foi possível enviar. Tente novamente.",
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card p-7 md:p-9">
      <h2 className="text-lg font-semibold tracking-tight">Solicite o seu acesso</h2>
      <p className="mt-1.5 text-sm text-foreground/60">
        Todos os campos são obrigatórios. Você recebe o link de acesso da sua empresa por WhatsApp
        ou e-mail.
      </p>

      <form onSubmit={enviar} noValidate className="mt-7 grid gap-5">
        <CampoTexto
          id="sol-empresa"
          rotulo="Empresa"
          valor={form.empresa}
          onChange={set("empresa")}
          onBlur={marcaTocado("empresa")}
          erro={erroDe("empresa")}
          placeholder="Razão social ou nome fantasia"
          autoComplete="organization"
        />
        <CampoTexto
          id="sol-nome"
          rotulo="Seu nome completo"
          valor={form.nome}
          onChange={set("nome")}
          onBlur={marcaTocado("nome")}
          erro={erroDe("nome")}
          placeholder="Nome e sobrenome"
          autoComplete="name"
        />
        <CampoTexto
          id="sol-cargo"
          rotulo="Seu cargo"
          valor={form.cargo}
          onChange={set("cargo")}
          onBlur={marcaTocado("cargo")}
          erro={erroDe("cargo")}
          placeholder="Diretor, RH, sócio…"
          autoComplete="organization-title"
        />
        <CampoTexto
          id="sol-email"
          rotulo="E-mail corporativo"
          valor={form.email}
          onChange={set("email")}
          onBlur={marcaTocado("email")}
          erro={erroDe("email")}
          placeholder="voce@suaempresa.com.br"
          tipo="email"
          autoComplete="email"
          dica="Conferimos se o domínio recebe e-mail antes de aceitar."
        />
        <CampoTexto
          id="sol-telefone"
          rotulo="WhatsApp"
          valor={form.telefone}
          onChange={set("telefone")}
          onBlur={marcaTocado("telefone")}
          erro={erroDe("telefone")}
          placeholder="(44) 99999-9999"
          tipo="tel"
          autoComplete="tel"
        />

        <div>
          <label className={ROTULO} htmlFor="sol-tamanho">
            Tamanho da empresa <span className="text-primary">*</span>
          </label>
          <select
            id="sol-tamanho"
            value={form.tamanho}
            onChange={set("tamanho")}
            onBlur={marcaTocado("tamanho")}
            aria-invalid={Boolean(erroDe("tamanho"))}
            aria-describedby={erroDe("tamanho") ? "sol-tamanho-erro" : undefined}
            className={`${CAMPO} ${erroDe("tamanho") ? "border-destructive focus:border-destructive" : ""} ${
              form.tamanho ? "" : "text-foreground/40"
            }`}
          >
            <option value="">Escolha uma faixa</option>
            {TAMANHOS_EMPRESA.map((t) => (
              <option key={t} value={t} className="text-foreground">
                {t}
              </option>
            ))}
          </select>
          {erroDe("tamanho") ? (
            <p id="sol-tamanho-erro" className="mt-1.5 text-xs text-destructive">
              {erroDe("tamanho")}
            </p>
          ) : null}
        </div>

        {falha ? <p className="text-xs text-destructive">{falha}</p> : null}

        <button
          type="submit"
          disabled={enviando}
          className="group mt-1 inline-flex w-full items-center justify-center gap-3 rounded-full bg-foreground px-8 py-5 text-white transition-colors hover:bg-foreground/85 disabled:opacity-50"
        >
          <span className="text-[12px] font-bold uppercase tracking-[0.2em]">
            {enviando ? "Enviando…" : "Solicitar diagnóstico"}
          </span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15 transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </button>
      </form>

      <p className="mt-4 text-[11.5px] leading-relaxed text-foreground/45">
        O acesso não é automático: a Korthex confere cada solicitação antes de liberar. Seus dados
        servem para entregar o acesso e falar com você — nada além disso.
      </p>
    </section>
  );
}

function Confirmacao({
  empresa,
  email,
  telefone,
}: {
  empresa: string;
  email: string;
  telefone: string;
}) {
  return (
    <section className="mx-auto max-w-[62ch] pt-10 pb-4">
      <div
        className="flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold text-primary"
        style={{ backgroundColor: "color-mix(in oklab, var(--primary) 14%, transparent)" }}
        aria-hidden="true"
      >
        ✓
      </div>

      <h1
        className="mt-6 text-display text-foreground"
        style={{ fontSize: "clamp(1.75rem,3.4vw,2.6rem)", lineHeight: 1 }}
      >
        Solicitação registrada.
      </h1>

      <p className="mt-5 text-foreground/70 leading-relaxed">
        Recebemos o pedido da <strong className="text-foreground">{empresa}</strong>. O acesso não é
        automático: a Korthex confere cada solicitação antes de liberar.
      </p>

      <ol className="mt-9 grid gap-5">
        {[
          "Nós conferimos os dados e liberamos o acesso da sua empresa.",
          `Você recebe o link com a sua chave no WhatsApp ${telefone} ou no e-mail ${email}.`,
          "Pelo link, você escolhe o que diagnosticar, cadastra quem será avaliado e distribui os questionários. Quem responde nunca vê resultado.",
        ].map((passo, i) => (
          <li key={i} className="grid grid-cols-[1.5rem_1fr] gap-3.5 text-[14px] text-foreground/70">
            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-border text-[11px] font-bold text-foreground/50">
              {i + 1}
            </span>
            <span className="leading-relaxed">{passo}</span>
          </li>
        ))}
      </ol>

      <Link
        to="/"
        className="mt-11 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/50 hover:text-primary transition-colors"
      >
        ← Voltar ao site
      </Link>
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
  dica,
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
  dica?: string;
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
        aria-describedby={erro ? `${id}-erro` : dica ? `${id}-dica` : undefined}
        className={`${CAMPO} ${erro ? "border-destructive focus:border-destructive" : ""}`}
      />
      {erro ? (
        <p id={`${id}-erro`} className="mt-1.5 text-xs text-destructive">
          {erro}
        </p>
      ) : dica ? (
        <p id={`${id}-dica`} className="mt-1.5 text-[11.5px] text-foreground/40">
          {dica}
        </p>
      ) : null}
    </div>
  );
}
