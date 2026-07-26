import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { adminListOportunidades, adminMoverEstagio, type OportunidadeNoFunil } from "@/lib/crm-server";
import {
  ESTAGIOS,
  PUBLICOS,
  ROTULO_ESTAGIO,
  ROTULO_FORCA,
  type EstagioFunil,
  type ForcaEvidencia,
  type ProgramaChave,
} from "@/lib/oportunidades";
import { AdminNav } from "@/components/admin/AdminNav";
import adminCss from "@/styles/admin-diagnosticos.css?url";
import crmCss from "@/styles/crm-funil.css?url";

/**
 * CRM — o funil de oportunidades.
 *
 * Cada linha é uma empresa e um treinamento. É esse recorte que permite
 * escolher um programa, filtrar quem tem o mesmo problema e agir sobre todos
 * de uma vez.
 *
 * A tela carrega o funil inteiro e filtra em memória: o volume é de dezenas e
 * assim o filtro é instantâneo.
 */
export const Route = createFileRoute("/admin/crm")({
  loader: () =>
    adminListOportunidades({
      data: { estagios: ESTAGIOS.map((e) => e.chave) },
    }),
  head: () => ({
    meta: [{ title: "CRM — Korthex" }, { name: "robots", content: "noindex, nofollow" }],
    links: [
      { rel: "stylesheet", href: adminCss },
      { rel: "stylesheet", href: crmCss },
    ],
  }),
  component: Crm,
});

const CLASSE_PROGRAMA: Record<ProgramaChave, string> = {
  executivo: "g-exec",
  lideranca: "g-lid",
  performance: "g-perf",
};

const CURTO_PROGRAMA: Record<ProgramaChave, string> = {
  executivo: "Executivo",
  lideranca: "Liderança",
  performance: "Performance",
};

/** "Abertas" nunca traz encerrada — ganha e perdida são etapas próprias. */
type Aba = "abertas" | EstagioFunil;

function diasTexto(n: number) {
  if (n === 0) return "parada desde hoje";
  if (n === 1) return "parada há 1 dia";
  return `parada há ${n} dias`;
}

function Crm() {
  const funil = Route.useLoaderData();
  const router = useRouter();

  const [aba, setAba] = useState<Aba>("abertas");
  const [programa, setPrograma] = useState<"" | ProgramaChave>("");
  const [treinamento, setTreinamento] = useState("");
  const [forca, setForca] = useState<"" | ForcaEvidencia>("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; ruim?: boolean } | null>(null);

  const todas = funil.itens;

  /* O recorte que NÃO depende da aba — é sobre ele que as contagens são feitas. */
  const base = useMemo(
    () =>
      todas.filter(
        (o) =>
          (!programa || o.programa === programa) &&
          (!treinamento || o.treinamento === treinamento) &&
          (!forca || o.forca_evidencia === forca),
      ),
    [todas, programa, treinamento, forca],
  );

  const contagem = useMemo(() => {
    const c: Record<Aba, number> = {
      abertas: 0, nova: 0, apresentacao: 0, proposta: 0, ganha: 0, perdida: 0,
    };
    for (const o of base) {
      c[o.estagio] += 1;
      if (o.estagio !== "ganha" && o.estagio !== "perdida") c.abertas += 1;
    }
    return c;
  }, [base]);

  const itens = useMemo(
    () =>
      base
        .filter((o) =>
          aba === "abertas" ? o.estagio !== "ganha" && o.estagio !== "perdida" : o.estagio === aba,
        )
        .sort((a, b) => b.diasParado - a.diasParado),
    [base, aba],
  );

  /* O filtro de treinamento acompanha o programa escolhido. */
  const treinamentos = useMemo(
    () =>
      funil.treinamentos.filter((t) => !programa || t.programa === programa).map((t) => t.nome),
    [funil.treinamentos, programa],
  );

  const selecionadas = itens.filter((o) => sel.has(o.id));
  const empresas = new Set(selecionadas.map((o) => o.cliente_id)).size;

  function alterna(id: string) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function marcarTodas() {
    const todasMarcadas = itens.length > 0 && itens.every((o) => sel.has(o.id));
    setSel(todasMarcadas ? new Set() : new Set(itens.map((o) => o.id)));
  }

  function limpar() {
    setPrograma("");
    setTreinamento("");
    setForca("");
  }

  async function mover(estagio: EstagioFunil) {
    if (!selecionadas.length || ocupado) return;
    let motivo: string | null = null;
    if (estagio === "perdida") {
      motivo = window.prompt("Por que perdeu? (some no relatório se ficar em branco)");
      if (!motivo?.trim()) return;
    }
    setOcupado(true);
    setAviso(null);
    try {
      const r = await adminMoverEstagio({
        data: { ids: selecionadas.map((o) => o.id), estagio, motivo },
      });
      setSel(new Set());
      setAviso({
        texto: `${r.movidas} ${r.movidas === 1 ? "oportunidade movida" : "oportunidades movidas"} para ${ROTULO_ESTAGIO[estagio]}.`,
      });
      await router.invalidate();
    } catch (e) {
      setAviso({ texto: e instanceof Error ? e.message : "Não deu para mover.", ruim: true });
    } finally {
      setOcupado(false);
    }
  }

  const ABAS: { chave: Aba; rotulo: string }[] = [
    { chave: "abertas", rotulo: "Abertas" },
    ...ESTAGIOS.map((e) => ({ chave: e.chave as Aba, rotulo: e.rotulo })),
  ];

  return (
    <>
      <div className="kx-admin">
        <AdminNav ativa="crm" />
      </div>

      <div className="kx-crm">
        <div className="wrap">
          <header className="head">
            <div className="tag">Comercial</div>
            <h1>Funil de oportunidades</h1>
            <p>
              Cada oportunidade é <b>uma empresa e um treinamento</b>. É isso que permite escolher um
              público, um programa e falar com todo mundo que tem o mesmo problema.
            </p>
          </header>

          <div className="estagios" role="group" aria-label="Estágios — clique para filtrar">
            {ABAS.map((a) => (
              <button
                key={a.chave}
                type="button"
                className="est"
                aria-pressed={aba === a.chave}
                onClick={() => setAba(a.chave)}
              >
                <div className="v num">{contagem[a.chave]}</div>
                <div className="k">{a.rotulo}</div>
              </button>
            ))}
          </div>

          <div className="filtros">
            <div className="campo">
              <label htmlFor="f-prog">Programa</label>
              <select
                id="f-prog"
                value={programa}
                onChange={(e) => {
                  setPrograma(e.target.value as "" | ProgramaChave);
                  setTreinamento("");
                }}
              >
                <option value="">Todos os programas</option>
                {(Object.keys(PUBLICOS) as ProgramaChave[]).map((p) => (
                  <option key={p} value={p}>
                    {PUBLICOS[p].nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo">
              <label htmlFor="f-trein">Treinamento</label>
              <select id="f-trein" value={treinamento} onChange={(e) => setTreinamento(e.target.value)}>
                <option value="">Todos os treinamentos</option>
                {treinamentos.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="campo" style={{ maxWidth: 210 }}>
              <label htmlFor="f-forca">Força da evidência</label>
              <select id="f-forca" value={forca} onChange={(e) => setForca(e.target.value as "" | ForcaEvidencia)}>
                <option value="">Qualquer</option>
                <option value="forte">Evidência forte</option>
                <option value="atencao">Ponto de atenção</option>
                <option value="hipotese">Hipótese</option>
              </select>
            </div>

            <button type="button" className="limpar" onClick={limpar}>
              Limpar filtros
            </button>
          </div>

          {aviso ? <div className={`aviso ${aviso.ruim ? "ruim" : ""}`}>{aviso.texto}</div> : null}

          <div className="resultado">
            <div className="conta">
              {itens.length ? (
                <>
                  <b>{itens.length}</b> {itens.length === 1 ? "oportunidade" : "oportunidades"}
                </>
              ) : todas.length ? (
                "Nenhuma oportunidade com esses filtros"
              ) : (
                "Nada no funil ainda"
              )}
            </div>
            {itens.length ? (
              <button type="button" className="todos" onClick={marcarTodas}>
                {itens.every((o) => sel.has(o.id)) ? "Desmarcar todas" : "Selecionar todas"}
              </button>
            ) : null}
          </div>

          <div className="lista">
            {itens.length ? (
              itens.map((o) => <Linha key={o.id} o={o} marcada={sel.has(o.id)} onToggle={() => alterna(o.id)} />)
            ) : todas.length ? (
              <div className="vazio">Nenhuma oportunidade combina com esses filtros. Tente afrouxar um deles.</div>
            ) : (
              <div className="vazio">
                O funil está vazio.
                <br />
                As oportunidades nascem do diagnóstico: abra um cliente concluído em{" "}
                <a href="/admin/diagnosticos">Diagnósticos</a> e monte a oferta.
              </div>
            )}
          </div>
        </div>

        <div className="barra">
          <div className="wrap">
            <div className="quantos">
              {selecionadas.length
                ? `${selecionadas.length} ${selecionadas.length === 1 ? "oportunidade selecionada" : "oportunidades selecionadas"}`
                : "Nenhuma selecionada"}
              <small>
                {selecionadas.length
                  ? `${empresas} ${empresas === 1 ? "empresa" : "empresas"} · a ação vale para todas de uma vez`
                  : "Marque oportunidades para mover várias de uma vez"}
              </small>
            </div>
            <div className="acoes">
              <button
                type="button"
                className="btn ghost"
                disabled={!selecionadas.length || ocupado}
                onClick={() => mover("apresentacao")}
              >
                Apresentação enviada
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={!selecionadas.length || ocupado}
                onClick={() => mover("proposta")}
              >
                Proposta enviada
              </button>
              <button
                type="button"
                className="btn ghost"
                disabled={!selecionadas.length || ocupado}
                onClick={() => mover("perdida")}
              >
                Perdida
              </button>
              <button
                type="button"
                className="btn"
                disabled={!selecionadas.length || ocupado}
                onClick={() => mover("ganha")}
              >
                Ganha ✓
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function Linha({
  o,
  marcada,
  onToggle,
}: {
  o: OportunidadeNoFunil;
  marcada: boolean;
  onToggle: () => void;
}) {
  const encerrada = o.estagio === "ganha" || o.estagio === "perdida";
  return (
    <label className="op" data-sel={marcada ? "1" : ""}>
      <input type="checkbox" checked={marcada} onChange={onToggle} />
      <span>
        <span className="empresa">{o.empresa}</span>
        <span className="produto">
          <b>{o.titulo}</b>
        </span>
        <span className="evid">
          {o.evidencia_resumo ?? ROTULO_FORCA[o.forca_evidencia]}
          {o.responsavel?.nome ? ` · ${o.responsavel.nome}` : ""}
          {o.diasSemContato !== null ? ` · ${o.diasSemContato}d sem contato` : ""}
        </span>
      </span>
      <span className="dir">
        <span className={`selo ${CLASSE_PROGRAMA[o.programa]}`}>{CURTO_PROGRAMA[o.programa]}</span>
        <span
          className={`est-chip ${o.estagio === "ganha" ? "e-ganha" : o.estagio === "perdida" ? "e-perdida" : ""}`}
        >
          {ROTULO_ESTAGIO[o.estagio]}
        </span>
        <span className="dias">
          {encerrada ? (o.motivo_perda ? `perdida: ${o.motivo_perda}` : "encerrada") : diasTexto(o.diasParado)}
        </span>
      </span>
    </label>
  );
}
