import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  publicGetPainel,
  publicSalvarLead,
  publicCreateAvaliacoes,
  TIPOS_POR_PAPEL,
  publicArchiveAvaliacao,
  type AvaliacaoTipo,
  type PapelAvaliado,
  type Lider,
  type PainelCliente,
} from "@/lib/diag-server";
import { CAMPO, ROTULO, BOTAO } from "@/components/diagnosticos/estilos-painel";
import { BoasVindas } from "@/components/diagnosticos/BoasVindas";
import boasVindasCss from "@/styles/boas-vindas.css?url";
import { validaLead, mascaraTelefone } from "@/lib/lead-validacao";
import { KorthexLogo } from "@/components/blog/Chrome";

export const Route = createFileRoute("/diagnosticos/$chave")({
  loader: ({ params }) => publicGetPainel({ data: params.chave }),
  head: () => ({
    meta: [
      { title: "Diagnóstico Korthex — uma leitura real do seu time" },
      { name: "robots", content: "noindex, nofollow" },
      /*
       * Este é o link que a Korthex manda pelo WhatsApp. Sem og:image e
       * og:description próprios ele herdava o cartão genérico do site, sem
       * dizer que era um diagnóstico. A imagem é do diagnóstico, não a do site.
       *
       * A descrição NÃO cita a chave nem o nome da empresa: a prévia é gerada
       * por servidor de terceiro e pode ser vista por quem só recebeu o link
       * encaminhado.
       */
      { property: "og:title", content: "Diagnóstico Korthex — uma leitura real do seu time" },
      {
        property: "og:description",
        content:
          "Seu acesso está liberado. Escolha o que diagnosticar, distribua os questionários e receba o mapa da empresa.",
      },
      { property: "og:image", content: "https://korthex.com.br/assets/og-diagnostico.jpg" },
      { name: "twitter:image", content: "https://korthex.com.br/assets/og-diagnostico.jpg" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "stylesheet", href: boasVindasCss }],
  }),
  component: PainelDoCliente,
});

/**
 * O que a empresa pode diagnosticar. Cada papel abre as óticas que fazem
 * sentido para ele — ninguém gera "o time avalia" para uma equipe, nem
 * "a liderança avalia o executivo" para um líder.
 */
function PainelDoCliente() {
  const painel = Route.useLoaderData();

  // Depois do cadastro, a tela de boas-vindas assume a página inteira: ela tem
  // cabeçalho e rodapé próprios, e a moldura do painel duplicaria os dois.
  if (painel?.lead_preenchido) {
    return (
      <BoasVindas
        empresa={painel.nome_empresa}
        nome={(painel.responsavel_nome ?? "").split(" ")[0] ?? ""}
        hrefPainel={`/diagnosticos/${painel.chave}/painel`}
      />
    );
  }

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

  // Sem cadastro não há painel — este componente só existe para esse caso.
  return null;
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

