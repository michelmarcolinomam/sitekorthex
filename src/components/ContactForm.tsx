import { useState } from "react";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

/**
 * Formulário de contato — Korthex
 *
 * Envio real via Web3Forms (https://web3forms.com).
 * Os leads são entregues no e-mail associado à access_key abaixo.
 * No envio bem-sucedido, dispara o evento de conversão `generate_lead`
 * (GA4 + Google Ads via gtag) para medição de leads reais.
 */

const schema = z.object({
  nome: z.string().min(2, "Informe seu nome completo."),
  email: z.string().email("Informe um e-mail válido."),
  empresa: z.string().min(2, "Informe sua empresa e cargo."),
  telefone: z.string().optional(),
  mensagem: z.string().min(10, "Conte um pouco do seu momento atual (mín. 10 caracteres)."),
});

type FormData = z.infer<typeof schema>;
type Campos = keyof FormData;

const VAZIO: FormData = {
  nome: "",
  email: "",
  empresa: "",
  telefone: "",
  mensagem: "",
};

// Chave de acesso do Web3Forms — entrega os leads por e-mail.
const WEB3FORMS_ACCESS_KEY = "af71bff1-67bb-4d4d-bbc0-2449dcf1516f";

// ─────────────────────────────────────────────────────────────
// ENVIO REAL via Web3Forms
async function enviarContato(dados: FormData): Promise<void> {
  const res = await fetch("https://api.web3forms.com/submit", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      access_key: WEB3FORMS_ACCESS_KEY,
      subject: "Novo diagnóstico solicitado — Korthex",
      from_name: "Site Korthex",
      nome: dados.nome,
      email: dados.email,
      empresa: dados.empresa,
      telefone: dados.telefone || "",
      mensagem: dados.mensagem,
    }),
  });
  const json = await res.json().catch(() => ({ success: false }));
  if (!res.ok || !json.success) {
    throw new Error(json.message || "Falha no envio");
  }
}
// ─────────────────────────────────────────────────────────────

// Dispara o evento de conversão (lead) para GA4 + Google Ads.
function registrarConversao() {
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("event", "generate_lead", {
      event_category: "formulario",
      event_label: "diagnostico_gratuito",
    });
  }
}

export function ContactForm() {
  const [data, setData] = useState<FormData>(VAZIO);
  const [erros, setErros] = useState<Partial<Record<Campos, string>>>({});
  const [status, setStatus] = useState<"idle" | "enviando" | "ok" | "erro">("idle");

  function setField(campo: Campos, valor: string) {
    setData((d) => ({ ...d, [campo]: valor }));
    if (erros[campo]) setErros((e) => ({ ...e, [campo]: undefined }));
  }

  async function handleSubmit() {
    const parsed = schema.safeParse(data);
    if (!parsed.success) {
      const novos: Partial<Record<Campos, string>> = {};
      for (const issue of parsed.error.issues) {
        const campo = issue.path[0] as Campos;
        if (!novos[campo]) novos[campo] = issue.message;
      }
      setErros(novos);
      setStatus("idle");
      return;
    }

    setStatus("enviando");
    setErros({});
    try {
      await enviarContato(parsed.data);
      registrarConversao();
      setStatus("ok");
      setData(VAZIO);
    } catch (err) {
      console.error(err);
      setStatus("erro");
    }
  }

  // Tela de sucesso
  if (status === "ok") {
    return (
      <div className="rounded-2xl border border-primary/30 bg-background/60 backdrop-blur-sm p-10 md:p-14 text-center">
        <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl">
          ✓
        </div>
        <h3 className="text-display text-2xl md:text-3xl text-foreground">
          Recebido. Entraremos em contato.
        </h3>
        <p className="mt-4 text-foreground/65 text-sm leading-relaxed max-w-md mx-auto">
          Sua solicitação de diagnóstico foi registrada. Em breve você receberá um
          retorno privado para agendarmos a conversa inicial.
        </p>
        <button
          onClick={() => setStatus("idle")}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-foreground/25 px-6 py-2.5 text-[12px] uppercase tracking-[0.2em] text-foreground hover:border-primary hover:text-primary transition-colors"
        >
          Enviar outra mensagem
        </button>
      </div>
    );
  }

  const enviando = status === "enviando";

  return (
    <div className="rounded-2xl border border-foreground/15 bg-background/50 backdrop-blur-sm p-8 md:p-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Field
          label="Nome"
          campo="nome"
          value={data.nome}
          erro={erros.nome}
          onChange={setField}
          placeholder="Seu nome completo"
          disabled={enviando}
        />
        <Field
          label="E-mail"
          campo="email"
          type="email"
          value={data.email}
          erro={erros.email}
          onChange={setField}
          placeholder="voce@empresa.com"
          disabled={enviando}
        />
        <Field
          label="Empresa / Cargo"
          campo="empresa"
          value={data.empresa}
          erro={erros.empresa}
          onChange={setField}
          placeholder="Ex.: Fundador · Empresa X"
          disabled={enviando}
        />
        <Field
          label="Telefone (opcional)"
          campo="telefone"
          type="tel"
          value={data.telefone ?? ""}
          erro={erros.telefone}
          onChange={setField}
          placeholder="(00) 00000-0000"
          disabled={enviando}
        />
      </div>

      <div className="mt-5">
        <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/55 mb-2">
          Seu momento atual
        </label>
        <Textarea
          value={data.mensagem}
          onChange={(e) => setField("mensagem", e.target.value)}
          placeholder="Conte, em poucas linhas, onde a empresa está hoje e o que te trouxe até aqui."
          disabled={enviando}
          className="min-h-[120px] bg-background/60 border-foreground/20 focus-visible:ring-primary"
        />
        {erros.mensagem && (
          <p className="mt-2 text-[12px] text-destructive">{erros.mensagem}</p>
        )}
      </div>

      {status === "erro" && (
        <p className="mt-5 text-[13px] text-destructive">
          Não foi possível enviar agora. Tente novamente em instantes.
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={enviando}
        className="mt-8 inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full bg-primary px-[1.4rem] py-[0.875rem] text-primary-foreground hover:bg-primary-deep transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <span className="text-[0.6rem] uppercase tracking-[0.2em]">
          {enviando ? "Enviando…" : "Solicitar Contato"}
        </span>
        {!enviando && (
          <span className="w-[1.4rem] h-[1.4rem] rounded-full bg-primary-foreground/15 flex items-center justify-center text-xs">
            →
          </span>
        )}
      </button>
    </div>
  );
}

function Field({
  label,
  campo,
  value,
  erro,
  onChange,
  placeholder,
  type = "text",
  disabled,
}: {
  label: string;
  campo: Campos;
  value: string;
  erro?: string;
  onChange: (campo: Campos, valor: string) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="block text-[10px] uppercase tracking-[0.25em] text-foreground/55 mb-2">
        {label}
      </label>
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(campo, e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="h-11 bg-background/60 border-foreground/20 focus-visible:ring-primary"
      />
      {erro && <p className="mt-1.5 text-[12px] text-destructive">{erro}</p>}
    </div>
  );
}
