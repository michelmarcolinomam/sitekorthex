import { KorthexLogo } from "@/components/blog/Chrome";

/**
 * A barra do painel interno.
 *
 * O admin tem três lugares diferentes e eles não podem viver na mesma tela:
 * onde se CRIA a chave do diagnóstico, onde se ACOMPANHA o que está
 * acontecendo, e onde se VENDE. O blog fica à parte, no fim.
 *
 * Visual em src/styles/admin-diagnosticos.css (escopo .kx-admin).
 */

export type SecaoAdmin = "clientes" | "diagnosticos" | "crm" | "blog";

const SECOES: { chave: SecaoAdmin; rotulo: string; href: string }[] = [
  { chave: "clientes", rotulo: "Clientes & chaves", href: "/admin/diagnosticos/clientes" },
  { chave: "diagnosticos", rotulo: "Diagnósticos", href: "/admin/diagnosticos" },
  { chave: "crm", rotulo: "CRM", href: "/admin/crm" },
  { chave: "blog", rotulo: "Blog", href: "/admin" },
];

/**
 * `solicitacoes` é a fila de quem pediu o diagnóstico pelo site e ainda não
 * recebeu a chave. Vira um contador em Clientes & chaves — sem isso a
 * solicitação fica esperando alguém lembrar de abrir a tela.
 */
export function AdminNav({
  ativa,
  solicitacoes = 0,
}: {
  ativa: SecaoAdmin;
  solicitacoes?: number;
}) {
  return (
    <div className="topbar">
      <div className="wrap">
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <KorthexLogo className="h-6 w-auto" />
          <span className="tag">Painel interno</span>
        </div>
        <nav className="nav">
          {SECOES.map((s) => (
            <a key={s.chave} href={s.href} aria-current={s.chave === ativa ? "page" : undefined}>
              {s.rotulo}
              {s.chave === "clientes" && solicitacoes > 0 ? (
                <span
                  className="contador"
                  title={`${solicitacoes} solicitação(ões) do site aguardando liberação`}
                >
                  {solicitacoes}
                </span>
              ) : null}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
}
