import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  publicGetAvaliacao,
  publicSalvarResposta,
  type AvaliacaoPublica,
} from "@/lib/diag-server";
import {
  BLOCOS_TIME,
  BLOCOS_EXECUTIVO,
  flex,
  totalItens,
  type Bloco,
  type Genero,
  type Pergunta,
} from "@/lib/diagnosticos-dados";
import { KorthexLogo } from "@/components/blog/Chrome";

export const Route = createFileRoute("/avaliacao/$chave")({
  loader: ({ params }) => publicGetAvaliacao({ data: params.chave }),
  head: () => ({
    meta: [
      { title: "Avaliação — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: Questionario,
});

/** Uma resposta dada: o valor cru da tela + a nota 0-4 que vale para o cálculo. */
interface Resposta {
  valor: number;
  score: number;
  theme: string;
  facet: string;
}

/** Cada tela do fluxo: intro → gênero → (bloco → perguntas)* → envio. */
type Tela =
  | { t: "intro" }
  | { t: "genero" }
  | { t: "bloco"; bi: number }
  | { t: "pergunta"; bi: number; qi: number }
  | { t: "fim" };

function blocosDe(tipo: AvaliacaoPublica["tipo"]): Bloco[] | null {
  if (tipo === "lideranca_time") return BLOCOS_TIME;
  if (tipo === "lideranca_executivo") return BLOCOS_EXECUTIVO;
  return null;
}

function Questionario() {
  const av = Route.useLoaderData();

  if (!av) return <Moldura><Aviso titulo="Link não encontrado" texto="Confira o endereço que você recebeu ou peça um novo para quem enviou." /></Moldura>;
  if (av.encerrada) return <Moldura><Aviso titulo="Avaliação encerrada" texto="Esta avaliação não está mais recebendo respostas." /></Moldura>;

  const blocos = blocosDe(av.tipo);
  if (!blocos)
    return <Moldura><Aviso titulo="Questionário em preparação" texto="Este diagnóstico ainda não está disponível para resposta." /></Moldura>;

  return <Fluxo av={av} blocos={blocos} />;
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-[720px] items-center justify-between px-6 py-5">
          <KorthexLogo className="h-6 w-auto" />
          <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">
            Avaliação
          </span>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-[720px] flex-1 flex-col px-6">{children}</main>
    </div>
  );
}

function Aviso({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center py-28 text-center">
      <h1 className="text-2xl font-semibold">{titulo}</h1>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/55">{texto}</p>
    </div>
  );
}

function Fluxo({ av, blocos }: { av: AvaliacaoPublica; blocos: Bloco[] }) {
  const telas = useMemo<Tela[]>(() => {
    const t: Tela[] = [{ t: "intro" }, { t: "genero" }];
    blocos.forEach((b, bi) => {
      t.push({ t: "bloco", bi });
      b.questions.forEach((_, qi) => t.push({ t: "pergunta", bi, qi }));
    });
    t.push({ t: "fim" });
    return t;
  }, [blocos]);

  const total = useMemo(() => totalItens(blocos), [blocos]);

  const [i, setI] = useState(0);
  const [genero, setGenero] = useState<Genero>("m");
  const [respostas, setRespostas] = useState<Record<string, Resposta>>({});
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const g = (s: string) => flex(s, genero);
  const tela = telas[i];
  const respondidas = Object.keys(respostas).length;

  const responder = (chave: string, r: Resposta) =>
    setRespostas((x) => ({ ...x, [chave]: r }));

  /** A tela atual está completa? Bateria exige todas as linhas. */
  const podeAvancar = (() => {
    if (tela.t !== "pergunta") return true;
    const q = blocos[tela.bi].questions[tela.qi];
    if (q.type === "battery")
      return q.rows.every((_, ri) => respostas[`${tela.bi}.${tela.qi}.${ri}`]);
    return Boolean(respostas[`${tela.bi}.${tela.qi}`]);
  })();

  const enviar = async () => {
    if (enviando) return;
    setEnviando(true);
    setErro(null);
    try {
      await publicSalvarResposta({ data: { chave: av.chave_avaliacao, genero, respostas } });
      setEnviado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível enviar. Tente de novo.");
    } finally {
      setEnviando(false);
    }
  };

  if (enviado)
    return (
      <Moldura>
        <div className="flex flex-1 flex-col items-center justify-center py-28 text-center">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-2xl text-primary">
            ✓
          </div>
          <h1 className="text-2xl font-semibold">Obrigado!</h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-foreground/55">
            Suas respostas foram registradas. Elas entram no conjunto com as das outras
            pessoas — ninguém consegue identificar o que foi você que respondeu.
          </p>
          <p className="mt-6 text-[10px] uppercase tracking-[0.2em] text-foreground/35">
            Você já pode fechar esta página
          </p>
        </div>
      </Moldura>
    );

  return (
    <Moldura>
      {tela.t !== "intro" && tela.t !== "fim" ? (
        <div className="pt-6">
          <div className="h-1 overflow-hidden rounded-full bg-foreground/8">
            <div
              className="h-full rounded-full bg-primary transition-all duration-300"
              style={{ width: `${Math.round((respondidas / total) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-foreground/35">
            {respondidas} de {total}
          </p>
        </div>
      ) : null}

      <div className="flex flex-1 flex-col justify-center py-12">
        {tela.t === "intro" ? <Intro av={av} total={total} /> : null}
        {tela.t === "genero" ? (
          <EscolhaGenero nome={av.lider_nome} valor={genero} onEscolhe={setGenero} />
        ) : null}
        {tela.t === "bloco" ? (
          <AberturaBloco bloco={blocos[tela.bi]} indice={tela.bi} total={blocos.length} g={g} />
        ) : null}
        {tela.t === "pergunta" ? (
          <TelaPergunta
            key={`${tela.bi}.${tela.qi}`}
            pergunta={blocos[tela.bi].questions[tela.qi]}
            base={`${tela.bi}.${tela.qi}`}
            respostas={respostas}
            onResponde={responder}
            g={g}
          />
        ) : null}
        {tela.t === "fim" ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Terminou.</h2>
            <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-foreground/55">
              Você respondeu {respondidas} de {total} itens. É só enviar — suas respostas
              são anônimas e vão direto para o conjunto.
            </p>
            {erro ? <p className="mt-5 text-sm text-destructive">{erro}</p> : null}
          </div>
        ) : null}
      </div>

      <div className="sticky bottom-0 flex items-center justify-between gap-4 border-t border-border bg-background/90 py-5 backdrop-blur">
        <button
          type="button"
          onClick={() => setI((x) => Math.max(0, x - 1))}
          disabled={i === 0}
          className="text-[11px] uppercase tracking-[0.2em] text-foreground/45 hover:text-foreground disabled:opacity-0"
        >
          ← Voltar
        </button>

        {tela.t === "fim" ? (
          <button
            type="button"
            onClick={() => void enviar()}
            disabled={enviando}
            className="rounded-full bg-primary px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:opacity-40"
          >
            {enviando ? "Enviando…" : "Enviar respostas"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setI((x) => Math.min(telas.length - 1, x + 1))}
            disabled={!podeAvancar}
            className="rounded-full bg-primary px-8 py-3.5 text-[11px] uppercase tracking-[0.2em] text-white transition-colors hover:bg-primary/90 disabled:opacity-30"
          >
            {tela.t === "intro" ? "Começar" : "Continuar"}
          </button>
        )}
      </div>
    </Moldura>
  );
}

function Intro({ av, total }: { av: AvaliacaoPublica; total: number }) {
  const otica =
    av.tipo === "lideranca_executivo"
      ? "Você vai avaliar como executivo — a leitura de cima."
      : "Você vai avaliar como parte da equipe — a leitura de quem convive no dia a dia.";

  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">{av.nome_empresa}</p>
      <h1 className="mt-5 text-3xl font-semibold leading-tight md:text-[38px]">
        {av.lider_nome ? (
          <>
            Como é trabalhar com
            <br />
            <span className="text-primary">{av.lider_nome}</span>?
          </>
        ) : (
          "Sobre a liderança aqui"
        )}
      </h1>
      {av.lider_cargo ? (
        <p className="mt-2 text-sm text-foreground/45">{av.lider_cargo}</p>
      ) : null}

      <p className="mt-7 text-[15px] leading-relaxed text-foreground/65">{otica}</p>

      <ul className="mt-8 grid gap-3 text-sm text-foreground/60">
        <li className="flex gap-3">
          <span className="text-primary">·</span>
          São {total} itens rápidos — leva de 5 a 8 minutos.
        </li>
        <li className="flex gap-3">
          <span className="text-primary">·</span>
          <span>
            <strong className="font-medium text-foreground">É anônimo.</strong> Sua resposta entra
            somada com as das outras pessoas. Ninguém vê o que foi você que respondeu.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="text-primary">·</span>
          Não existe resposta certa. O que ajuda é a sua percepção honesta.
        </li>
      </ul>
    </div>
  );
}

function EscolhaGenero({
  nome,
  valor,
  onEscolhe,
}: {
  nome: string | null;
  valor: Genero;
  onEscolhe: (g: Genero) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-semibold leading-snug">
        {nome ? `${nome} é...` : "A pessoa que você vai avaliar é..."}
      </h2>
      <p className="mt-3 text-sm text-foreground/55">
        Só para as perguntas ficarem escritas do jeito certo.
      </p>
      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {(
          [
            ["m", "Um homem"],
            ["f", "Uma mulher"],
          ] as const
        ).map(([v, rotulo]) => (
          <button
            key={v}
            type="button"
            onClick={() => onEscolhe(v)}
            className={`rounded-xl border p-5 text-left text-sm transition-colors ${
              valor === v
                ? "border-primary bg-primary/5 font-medium"
                : "border-border hover:border-primary/40"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>
    </div>
  );
}

function AberturaBloco({
  bloco,
  indice,
  total,
  g,
}: {
  bloco: Bloco;
  indice: number;
  total: number;
  g: (s: string) => string;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.3em] text-primary">
        Parte {indice + 1} de {total}
      </p>
      <h2 className="mt-5 text-3xl font-semibold leading-tight">{g(bloco.name)}</h2>
      <p className="mt-5 text-[15px] leading-relaxed text-foreground/60">{g(bloco.kicker)}</p>
    </div>
  );
}

/* ─────────────────────────  As perguntas  ───────────────────────── */

const CORES_ROSTO = ["#D65A47", "#E08A3A", "#C6A22E", "#5FA556", "#2F9E78"];
const BOCAS = [
  "M16 30 Q22 24 28 30",
  "M16 29 Q22 26 28 29",
  "M16 28 L28 28",
  "M16 27 Q22 31 28 27",
  "M15 26 Q22 34 29 26",
];

function Rosto({ nivel, ativo }: { nivel: number; ativo: boolean }) {
  const c = CORES_ROSTO[nivel];
  const olhoY = nivel === 4 ? 17 : 18;
  return (
    <svg viewBox="0 0 44 44" className="h-11 w-11" style={{ opacity: ativo ? 1 : 0.75 }}>
      <circle cx="22" cy="22" r="20" stroke={c} strokeWidth="2" fill={`${c}22`} />
      <circle cx="16" cy={olhoY} r="2" fill={c} />
      <circle cx="28" cy={olhoY} r="2" fill={c} />
      <path d={BOCAS[nivel]} stroke={c} strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function Enunciado({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-8 text-xl font-semibold leading-snug md:text-2xl">{children}</h2>;
}

function TelaPergunta({
  pergunta,
  base,
  respostas,
  onResponde,
  g,
}: {
  pergunta: Pergunta;
  base: string;
  respostas: Record<string, Resposta>;
  onResponde: (chave: string, r: Resposta) => void;
  g: (s: string) => string;
}) {
  const q = pergunta;
  const atual = respostas[base];

  const marca = (valor: number, score: number, facet?: string) =>
    onResponde(base, { valor, score, theme: q.theme, facet: facet ?? ("facet" in q ? q.facet : "") });

  if (q.type === "faces")
    return (
      <div>
        <Enunciado>{g(q.text)}</Enunciado>
        <p className="mb-6 text-xs text-foreground/45">Toque no rosto que mais tem a ver.</p>
        <div className="grid grid-cols-5 gap-2">
          {q.labels.map((rotulo, i) => (
            <button
              key={i}
              type="button"
              onClick={() => marca(i, i)}
              className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-colors ${
                atual?.valor === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <Rosto nivel={i} ativo={atual?.valor === i} />
              <span className="text-center text-[11px] leading-tight text-foreground/60">
                {g(rotulo)}
              </span>
            </button>
          ))}
        </div>
      </div>
    );

  if (q.type === "polarity")
    return (
      <div>
        <Enunciado>{g(q.text)}</Enunciado>
        <div className="mb-5 grid gap-3 sm:grid-cols-2">
          {[q.left, q.right].map((lado, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <p className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
                {g(lado.tag)}
              </p>
              <p className="mt-2 text-sm leading-relaxed">{g(lado.t)}</p>
            </div>
          ))}
        </div>
        <Escala valor={atual?.valor} onEscolhe={(i) => marca(i, i)} />
      </div>
    );

  if (q.type === "relevance")
    return (
      <div>
        <Enunciado>{g(q.text)}</Enunciado>
        <Escala valor={atual?.valor} onEscolhe={(i) => marca(i, i)} lo={g(q.lo)} hi={g(q.hi)} />
      </div>
    );

  if (q.type === "agree" || q.type === "freq")
    return (
      <div>
        <Enunciado>{g(q.text)}</Enunciado>
        <Escala
          valor={atual?.valor}
          onEscolhe={(i) => marca(i, i)}
          lo={g(q.poles[0])}
          hi={g(q.poles[1])}
        />
      </div>
    );

  if (q.type === "scenario")
    return (
      <div>
        <Enunciado>{g(q.text)}</Enunciado>
        <div className="grid gap-3">
          {q.options.map((o, i) => (
            <button
              key={i}
              type="button"
              onClick={() => marca(i, o.s)}
              className={`rounded-xl border p-4 text-left text-sm leading-relaxed transition-colors ${
                atual?.valor === i ? "border-primary bg-primary/5 font-medium" : "border-border hover:border-primary/40"
              }`}
            >
              {g(o.t)}
            </button>
          ))}
        </div>
      </div>
    );

  if (q.type === "level")
    return (
      <div>
        <Enunciado>{g(q.text)}</Enunciado>
        <div className="grid gap-3">
          {q.options.map((o, i) => (
            <button
              key={i}
              type="button"
              onClick={() => marca(i, i)}
              className={`flex gap-4 rounded-xl border p-4 text-left transition-colors ${
                atual?.valor === i ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
              }`}
            >
              <span
                className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] ${
                  atual?.valor === i ? "bg-primary text-white" : "bg-foreground/8 text-foreground/50"
                }`}
              >
                {i + 1}
              </span>
              <span className="text-sm leading-relaxed">{g(o)}</span>
            </button>
          ))}
        </div>
      </div>
    );

  // battery: várias afirmações na mesma escala.
  return (
    <div>
      <Enunciado>Com que frequência isso acontece?</Enunciado>
      <div className="grid gap-5">
        {q.rows.map((linha, ri) => {
          const chave = `${base}.${ri}`;
          const r = respostas[chave];
          return (
            <div key={ri} className="rounded-xl border border-border p-4">
              <p className="mb-4 text-sm leading-relaxed">{g(linha.text)}</p>
              <Escala
                valor={r?.valor}
                lo={g(q.poles[0])}
                hi={g(q.poles[1])}
                onEscolhe={(i) =>
                  onResponde(chave, {
                    valor: i,
                    // Afirmação negativa vale ao contrário no cálculo.
                    score: linha.reverse ? 4 - i : i,
                    theme: q.theme,
                    facet: linha.facet,
                  })
                }
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** Escala de 5 pontos, usada por quase todos os tipos. */
function Escala({
  valor,
  onEscolhe,
  lo,
  hi,
}: {
  valor?: number;
  onEscolhe: (i: number) => void;
  lo?: string;
  hi?: string;
}) {
  return (
    <div>
      <div className="flex gap-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <button
            key={i}
            type="button"
            aria-label={`Nível ${i + 1} de 5`}
            aria-pressed={valor === i}
            onClick={() => onEscolhe(i)}
            className={`h-12 flex-1 rounded-lg border transition-colors ${
              valor === i
                ? "border-primary bg-primary"
                : "border-border bg-transparent hover:border-primary/40"
            }`}
          />
        ))}
      </div>
      {lo || hi ? (
        <div className="mt-2 flex justify-between text-[11px] text-foreground/45">
          <span>{lo}</span>
          <span>{hi}</span>
        </div>
      ) : null}
    </div>
  );
}
