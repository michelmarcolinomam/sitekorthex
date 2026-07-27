import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import {
  adminListClientes,
  adminCreateCliente,
  adminArchiveCliente,
  adminLiberarSolicitacao,
  type Cliente,
} from "@/lib/diag-server";
import { AdminNav } from "@/components/admin/AdminNav";
import adminCss from "@/styles/admin-diagnosticos.css?url";

/**
 * Clientes & chaves — onde o diagnóstico NASCE.
 *
 * Duas portas chegam aqui. A Korthex cria a empresa na mão, ou a própria
 * empresa pede o diagnóstico em korthex.com.br/diagnostico. No segundo caso a
 * ficha nasce com a chave gerada e NÃO ENTREGUE: entregar é o ato de liberação,
 * porque quem tem a chave entra. Por isso a fila de solicitações fica no topo.
 *
 * Daí em diante quem manda é a empresa: é ela que cadastra os avaliados e gera
 * as avaliações no painel dela. O que está acontecendo com elas mora em
 * Diagnósticos.
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

function quando(iso: string): string {
  const d = new Date(iso);
  const hoje = new Date();
  const mesmoDia = d.toDateString() === hoje.toDateString();
  const hora = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return mesmoDia ? `hoje, ${hora}` : `${data(iso)}, ${hora}`;
}

function linkDoCliente(c: Cliente): string {
  const base = typeof window === "undefined" ? "https://korthex.com.br" : window.location.origin;
  return `${base}/diagnosticos/${c.chave}`;
}

/** A mensagem que a Korthex manda ao entregar a chave. */
function mensagemDeEntrega(c: Cliente): string {
  const primeiro = (c.responsavel_nome ?? "").split(" ")[0];
  const saudacao = primeiro ? `Olá, ${primeiro}.` : "Olá.";
  return (
    `${saudacao} Aqui é a Korthex. O acesso ao diagnóstico da ${c.nome_empresa} ` +
    `está liberado: ${linkDoCliente(c)} — guarde esse link, é por ele que você ` +
    `conduz o processo.`
  );
}

function IconeZap() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.1c-.2.6-1.2 1.2-1.7 1.2-.5.1-1 .1-1.7-.1a11 11 0 0 1-4.3-2.7 9.7 9.7 0 0 1-2-3.1c-.2-.7-.2-1.3 0-1.8.2-.4.5-.7.8-1 .2-.2.4-.2.6-.2h.5c.2 0 .4 0 .5.4l.8 1.8c.1.2 0 .4-.1.5l-.3.4-.3.3c-.1.2-.2.3 0 .5a7.4 7.4 0 0 0 3.5 3c.2.1.4.1.5-.1l.8-1c.1-.2.3-.2.5-.1l1.8.9c.2.1.3.2.3.3v.5c0 .2 0 .3-.2.4Z" />
    </svg>
  );
}

function Clientes() {
  const clientes = Route.useLoaderData();
  const router = useRouter();
  const [nome, setNome] = useState("");
  const [criando, setCriando] = useState(false);
  const [copiado, setCopiado] = useState<string | null>(null);

  const naoArquivados = clientes.filter((c) => c.status !== "arquivado");

  /**
   * Pediu pelo site e ainda não recebeu a chave DEPOIS desse pedido.
   *
   * A comparação de datas é o que faz uma empresa que já é cliente reaparecer
   * quando pede um ciclo novo. A versão anterior olhava só "liberado_em é
   * nulo", e por isso o pedido de quem já estava na base sumia do painel.
   */
  const pendente = (c: Cliente) =>
    Boolean(c.solicitado_em) &&
    (!c.liberado_em || new Date(c.liberado_em) < new Date(c.solicitado_em as string));

  const pendentes = naoArquivados.filter(pendente);
  const liberados = naoArquivados.filter((c) => !pendente(c) && c.liberado_em);

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

  function copiar(c: Cliente, texto?: string) {
    void navigator.clipboard?.writeText(texto ?? linkDoCliente(c));
    setCopiado(c.id);
    setTimeout(() => setCopiado((k) => (k === c.id ? null : k)), 1800);
  }

  async function arquivar(c: Cliente) {
    if (!window.confirm(`Arquivar "${c.nome_empresa}"? Some da lista, sem apagar os dados.`)) return;
    await adminArchiveCliente({ data: c.id });
    void router.invalidate();
  }

  /**
   * Abre o canal com a mensagem pronta e SÓ DEPOIS pergunta se saiu. A janela
   * é aberta antes de qualquer await de propósito: navegador bloqueia popup
   * aberto depois de uma resposta assíncrona.
   */
  async function entregar(c: Cliente, canal: "whatsapp" | "email") {
    const msg = mensagemDeEntrega(c);
    const url =
      canal === "whatsapp"
        ? `https://wa.me/55${(c.responsavel_telefone ?? "").replace(/\D/g, "")}?text=${encodeURIComponent(msg)}`
        : `mailto:${c.responsavel_email ?? ""}?subject=${encodeURIComponent(
            `Seu acesso ao diagnóstico Korthex — ${c.nome_empresa}`,
          )}&body=${encodeURIComponent(msg)}`;

    window.open(url, "_blank", "noopener,noreferrer");

    if (
      !window.confirm(
        `Marcar "${c.nome_empresa}" como entregue? Ela sai da fila de solicitações.\n\n` +
          `Cancele se a mensagem não foi enviada.`,
      )
    )
      return;

    try {
      await adminLiberarSolicitacao({ data: c.id });
      await router.invalidate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao liberar.");
    }
  }

  /**
   * Encerra o pedido de quem já é cliente sem arquivar a ficha: carimba a data
   * de entrega e a empresa sai da fila, continuando na lista de clientes.
   */
  async function encerrar(c: Cliente) {
    if (
      !window.confirm(
        `Encerrar o pedido da "${c.nome_empresa}" sem reenviar?\n\n` +
          `A ficha continua na lista de clientes com a chave ${c.chave}. Só sai da fila.`,
      )
    )
      return;
    try {
      await adminLiberarSolicitacao({ data: c.id });
      await router.invalidate();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : "Erro ao encerrar.");
    }
  }

  async function recusar(c: Cliente) {
    if (
      !window.confirm(
        `Recusar a solicitação da "${c.nome_empresa}"? A chave não é entregue e a ficha é arquivada.`,
      )
    )
      return;
    await adminArchiveCliente({ data: c.id });
    void router.invalidate();
  }

  return (
    <div className="kx-admin">
      <AdminNav ativa="clientes" solicitacoes={pendentes.length} />

      <div className="wrap">
        <header className="head">
          <div>
            <div className="tag">Cadastro</div>
            <h1>Clientes & chaves</h1>
          </div>
        </header>

        {pendentes.length > 0 ? (
          <section style={{ padding: 0, marginTop: 0, borderTop: "none" }}>
            <div className="sub-head">
              <div>
                <h2>Solicitações do site</h2>
                <p>
                  Chegaram por korthex.com.br/diagnostico e aguardam você entregar a chave.
                </p>
              </div>
              <span className="pill espera">
                {pendentes.length} aguardando
              </span>
            </div>

            <div className="pedidos">
              {pendentes.map((c) => (
                <article className="pedido" key={c.id}>
                  <div className="topo">
                    <div>
                      <h3>
                        {c.nome_empresa}
                        {c.liberado_em ? (
                          <span className="pill espera">já era cliente · pediu de novo</span>
                        ) : (
                          <span className="pill">do site</span>
                        )}
                      </h3>
                      <p className="quem">
                        {[c.responsavel_nome, c.responsavel_cargo, c.tamanho_empresa]
                          .filter(Boolean)
                          .join(" · ") || "Sem dados do responsável"}
                      </p>
                    </div>
                    <span className="quando">{quando(c.solicitado_em ?? c.created_at)}</span>
                  </div>

                  <div className="dados">
                    <div className="dado">
                      <span className="rot">E-mail</span>
                      <span className="val mono">{c.responsavel_email ?? "—"}</span>
                    </div>
                    <div className="dado">
                      <span className="rot">WhatsApp</span>
                      <span className="val mono">{c.responsavel_telefone ?? "—"}</span>
                    </div>
                  </div>

                  <div className="chave-caixa">
                    <div>
                      <span className="rot" style={{ fontSize: 9, letterSpacing: ".14em" }}>
                        {c.liberado_em ? "Chave desta empresa" : "Chave já gerada"}
                      </span>
                      <div className="kx">{c.chave}</div>
                    </div>
                    <span className="aviso">
                      {c.liberado_em
                        ? `Já foi entregue em ${data(c.liberado_em)} — é a mesma chave, reenvie.`
                        : "Ainda não entregue — quem tem a chave entra."}
                    </span>
                  </div>

                  <div className="msg">
                    <span className="rot">Mensagem que vai no WhatsApp ou no e-mail</span>
                    {mensagemDeEntrega(c)}
                  </div>

                  <div className="acoes">
                    <button
                      type="button"
                      className="bt zap"
                      onClick={() => void entregar(c, "whatsapp")}
                      disabled={!c.responsavel_telefone}
                      title={c.responsavel_telefone ? undefined : "Sem telefone cadastrado"}
                    >
                      <IconeZap />
                      Enviar no WhatsApp
                    </button>
                    <button
                      type="button"
                      className="bt"
                      onClick={() => void entregar(c, "email")}
                      disabled={!c.responsavel_email}
                      title={c.responsavel_email ? undefined : "Sem e-mail cadastrado"}
                    >
                      Enviar por e-mail
                    </button>
                    <button type="button" className="bt" onClick={() => copiar(c, mensagemDeEntrega(c))}>
                      {copiado === c.id ? "Copiado ✓" : "Copiar mensagem"}
                    </button>
                    {/*
                      Para quem JÁ É CLIENTE, recusar não pode arquivar a ficha:
                      um clique errado apagaria um cliente real da lista. Nesse
                      caso a saída é só encerrar o pedido.
                    */}
                    {c.liberado_em ? (
                      <button type="button" className="bt fantasma" onClick={() => void encerrar(c)}>
                        Já resolvi
                      </button>
                    ) : (
                      <button type="button" className="bt fantasma" onClick={() => void recusar(c)}>
                        Recusar
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}

        <section
          style={
            pendentes.length > 0
              ? undefined
              : { padding: 0, marginTop: 0, borderTop: "none" }
          }
        >
          <div className="sub-head">
            <div>
              <h2>Cadastrar empresa</h2>
              <p>
                Para quem você prospectou. A chave é gerada e já sai daqui marcada como entregue.
              </p>
            </div>
          </div>

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
            A chave é a credencial do cliente: com ela a empresa abre o painel dela, cadastra os
            líderes e gera as próprias avaliações.
          </p>

          <div className="tabela" style={{ marginTop: 22 }}>
            <div className="trow cab">
              <div>Empresa</div>
              <div>Chave</div>
              <div>Criada em</div>
              <div>Lead em</div>
              <div />
            </div>

            {liberados.length === 0 ? (
              <div className="trow">
                <div className="quando" style={{ gridColumn: "1 / -1" }}>
                  Nenhum cliente com chave entregue ainda.
                </div>
              </div>
            ) : (
              liberados.map((c) => {
                const st = ROTULO_STATUS[c.status] ?? { texto: c.status, classe: "" };
                return (
                  <div className="trow" key={c.id}>
                    <div className="emp">
                      {c.nome_empresa}
                      {c.responsavel_nome ? (
                        <small>
                          {c.responsavel_nome} · {c.responsavel_email}
                        </small>
                      ) : null}
                    </div>
                    <div>
                      <span className="chave">{c.chave}</span>
                      <div style={{ marginTop: 6 }}>
                        <span className={`pill ${st.classe}`}>{st.texto}</span>
                        {c.origem === "site" ? (
                          <span className="pill" style={{ marginLeft: 6 }}>
                            do site
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="quando">{data(c.created_at)}</div>
                    <div className="quando">{data(c.lead_preenchido_em)}</div>
                    <div className="acoes-linha">
                      <button type="button" onClick={() => copiar(c)}>
                        {copiado === c.id ? "Copiado ✓" : "Copiar link"}
                      </button>
                      <a href={`/admin/diagnosticos/${c.id}`}>Acompanhar</a>
                      <button type="button" className="sec" onClick={() => void arquivar(c)}>
                        Arquivar
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
