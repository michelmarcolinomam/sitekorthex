import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  adminListClientes,
  adminCreateCliente,
  adminArchiveCliente,
  type Cliente,
} from "@/lib/diag-server";
import { AdminNav } from "@/components/admin/AdminNav";
import adminCss from "@/styles/admin-diagnosticos.css?url";

/**
 * Clientes & chaves — onde o diagnóstico NASCE.
 *
 * A Korthex cria a empresa, o banco gera a chave KX- e ela é entregue ao
 * cliente. Daí em diante quem manda é a empresa: é ela que cadastra os
 * líderes e gera as avaliações no painel dela. Aqui é só o cadastro e o
 * histórico das chaves — o que está acontecendo com elas mora em Diagnósticos.
 */
export const Route = createFileRoute("/admin/diagnosticos/clientes")({
  loader: () => adminListClientes(),
  head: () => ({
    meta: [
      { title: "Clientes & chaves — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: adminCss }],
  }),
  component: Clientes,
});

const ROTULO_STATUS: Record<string, { texto: string; classe: string }> = {
  criado: { texto: "Chave entregue", classe: "espera" },
  lead: { texto: "Lead captado", classe: "ok" },
  ativo: { texto: "Ativo", classe: "ok" },
  arquivado: { texto: "Arquivado", classe: "" },
};

function data(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function Clientes() {
  const clientes = Route.useLoaderData();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const ativos = clientes.filter((c) => c.status !== "arquivado");

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    const n = nome.trim();
    if (!n || criando) return;
    setCriando(true);
    try {
      await adminCreateCliente({ data: { nome_empresa: n } });
      setNome("");
      await router.invalidate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao criar cliente.");
    } finally {
      setCriando(false);
    }
  }

  function copiar(c: Cliente) {
    void navigator.clipboard?.writeText(`${window.location.origin}/diagnosticos/${c.chave}`);
    setCopiado(c.id);
    setTimeout(() => setCopiado((k) => (k === c.id ? null : k)), 1800);
  }

  async function arquivar(c: Cliente) {
    if (!window.confirm(`Arquivar "${c.nome_empresa}"? Some da lista, sem apagar os dados.`)) return;
    await adminArchiveCliente({ data: c.id });
    void router.invalidate();
  }

  return (
    <div className="kx-admin">
      <AdminNav ativa="clientes" />

      <div className="wrap">
        <header className="head">
          <div>
            <div className="tag">Cadastro</div>
            <h1>Clientes & chaves</h1>
          </div>
        </header>

        <form onSubmit={criar} className="novo-cliente">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da empresa"
            aria-label="Nome da empresa"
          />
          <button type="submit" className="btn" disabled={criando || !nome.trim()}>
            {criando ? "Gerando…" : "Gerar chave"}
          </button>
        </form>

        <p className="tag" style={{ marginTop: 14 }}>
          A chave é a credencial do cliente: com ela a empresa abre o painel dela, cadastra os líderes e
          gera as próprias avaliações.
        </p>

        <div className="tabela" style={{ marginTop: 22 }}>
          <div className="trow cab">
            <div>Empresa</div>
            <div>Chave</div>
            <div>Criada em</div>
            <div>Lead em</div>
            <div />
          </div>

          {ativos.length === 0 ? (
            <div className="trow">
              <div className="quando" style={{ gridColumn: "1 / -1" }}>
                Nenhum cliente ainda. Crie o primeiro acima.
              </div>
            </div>
          ) : (
            ativos.map((c) => {
              const st = ROTULO_STATUS[c.status] ?? { texto: c.status, classe: "" };
              return (
                <div className="trow" key={c.id}>
                  <div className="emp">
                    {c.nome_empresa}
                    {c.responsavel_nome ? <small>{c.responsavel_nome} · {c.responsavel_email}</small> : null}
                  </div>
                  <div>
                    <span className="chave">{c.chave}</span>
                    <div style={{ marginTop: 6 }}>
                      <span className={`pill ${st.classe}`}>{st.texto}</span>
                    </div>
                  </div>
                  <div className="quando">{data(c.created_at)}</div>
                  <div className="quando">{data(c.lead_preenchido_em)}</div>
                  <div className="acoes-linha">
                    <button type="button" onClick={() => copiar(c)}>
                      {copiado === c.id ? "Copiado ✓" : "Copiar link"}
                    </button>
                    <a href={`/admin/diagnosticos/${c.id}`}>Acompanhar</a>
                    <button type="button" className="sec" onClick={() => arquivar(c)}>
                      Arquivar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
