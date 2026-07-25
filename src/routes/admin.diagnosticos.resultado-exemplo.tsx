import { createFileRoute } from "@tanstack/react-router";
import { ResultadoLider } from "@/components/diagnosticos/ResultadoLider";
import { RESULTADO_EXEMPLO } from "@/lib/resultado-exemplo";
import resultadoCss from "@/styles/resultado-lider.css?url";

/**
 * Prévia da tela de resultado do líder, com dados de exemplo.
 *
 * Fica dentro de /admin (portanto atrás do Cloudflare Access) porque ainda não
 * lê o banco: enquanto o motor de cálculo não existir, ela serve para ajustar
 * o layout, não para mostrar a cliente. Quando o motor entrar, esta tela passa
 * a receber os dados reais e ganha um endereço por líder.
 */
export const Route = createFileRoute("/admin/diagnosticos/resultado-exemplo")({
  head: () => ({
    meta: [
      { title: "Resultado do líder (exemplo) — Korthex" },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "stylesheet", href: resultadoCss }],
  }),
  component: Previa,
});

function Previa() {
  return (
    <>
      <div className="border-b border-border bg-background px-6 py-3">
        <div className="mx-auto flex max-w-[1060px] items-center justify-between gap-4">
          <span className="text-[10px] uppercase tracking-[0.2em] text-amber-700">
            Prévia · dados de exemplo, ainda não vem do banco
          </span>
          <a
            href="/admin/diagnosticos"
            className="text-[10px] uppercase tracking-[0.2em] text-foreground/50 hover:text-primary"
          >
            ← Diagnósticos
          </a>
        </div>
      </div>
      <ResultadoLider dados={RESULTADO_EXEMPLO} />
    </>
  );
}
