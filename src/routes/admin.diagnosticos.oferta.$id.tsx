import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { adminOfertaDoCliente, adminSalvarOferta, type ItemDaOferta } from "@/lib/crm-server";
import { MontarOferta } from "@/components/diagnosticos/MontarOferta";
import ofertaCss from "@/styles/montar-oferta.css?url";

/**
 * Montar oferta — a ponte entre o diagnóstico e o funil.
 *
 * A evidência que o vendedor está vendo é a que fica gravada na oportunidade:
 * o diagnóstico segue recebendo resposta, mas a oferta guarda o número que a
 * sustentou no dia em que foi montada.
 */
export const Route = createFileRoute("/admin/diagnosticos/oferta/$id")({
  loader: ({ params }) => adminOfertaDoCliente({ data: params.id }),
  head: () => ({
    meta: [
      { title: "Montar oferta — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: ofertaCss }],
  }),
  component: Oferta,
});

function Oferta() {
  const dados = Route.useLoaderData();
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!dados) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--surface)] px-6">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold">Cliente não encontrado</h1>
          <a
            href="/admin/diagnosticos"
            className="mt-6 inline-block text-[10px] uppercase tracking-[0.2em] text-primary hover:underline"
          >
            ← Diagnósticos
          </a>
        </div>
      </div>
    );
  }

  async function salvar(itens: ItemDaOferta[]) {
    if (!dados) return;
    setSalvando(true);
    setErro(null);
    setAviso(null);
    try {
      const r = await adminSalvarOferta({ data: { clienteId: dados.cliente.id, itens } });
      setAviso(
        r.criadas
          ? `${r.criadas} ${r.criadas === 1 ? "oportunidade criada" : "oportunidades criadas"} no funil${r.jaExistiam ? ` · ${r.jaExistiam} já existia${r.jaExistiam === 1 ? "" : "m"} em aberto` : ""}.`
          : "Nada a criar: tudo que estava marcado já existe em aberto.",
      );
      await router.invalidate();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não deu para gravar a oferta.");
    } finally {
      setSalvando(false);
    }
  }

  const abertas = dados.existentes.filter(
    (o) => o.estagio !== "ganha" && o.estagio !== "perdida",
  ).length;

  return (
    <>
      <div className="border-b border-border bg-background px-6 py-3">
        <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-between gap-4">
          <a
            href="/admin/diagnosticos"
            className="text-[10px] uppercase tracking-[0.2em] text-primary hover:underline"
          >
            ← Diagnósticos
          </a>
          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">
            Montar oferta · {dados.cliente.chave}
            {abertas > 0 && ` · ${abertas} no funil`}
          </span>
        </div>
      </div>

      {(aviso || erro) && (
        <div
          className={`px-6 py-3 text-sm ${erro ? "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300" : "bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"}`}
        >
          <div className="mx-auto max-w-[1120px]">{erro ?? aviso}</div>
        </div>
      )}

      <MontarOferta dados={dados} salvando={salvando} onSalvar={salvar} />
    </>
  );
}
