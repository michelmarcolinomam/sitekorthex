import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * O menu de navegação no celular.
 *
 * As seis páginas do site tinham a navegação em `hidden md:flex` e nenhum
 * botão para abri-la: abaixo de 768px sobrava só o logotipo e não havia como
 * navegar. O blog já resolvia isso (components/blog/Chrome.tsx) — este
 * componente é aquele mesmo desenho, extraído para as páginas usarem um só,
 * porque seis cópias de um menu com estado dessincronizam na primeira mudança.
 *
 * O painel vai por PORTAL para o body em vez de ficar dentro do cabeçalho: o
 * header é `fixed z-50`, ou seja, cria contexto de empilhamento, e um painel
 * nascido lá dentro nunca conseguiria ficar atrás do logotipo e do próprio
 * botão de fechar.
 */

export interface ItemNav {
  label: string;
  href: string;
}

export function MenuMobile({ nav }: { nav: ItemNav[] }) {
  const [aberto, setAberto] = useState(false);
  const [montado, setMontado] = useState(false);

  // O portal precisa do document, que não existe no SSR.
  useEffect(() => setMontado(true), []);

  // Fecha no Esc e trava a rolagem do fundo enquanto está aberto — painel de
  // tela cheia com a página rolando atrás é desorientador no celular.
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    const antes = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = antes;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  const painel = (
    <div
      className={`md:hidden fixed inset-0 z-40 bg-background transition-opacity duration-300 ${
        aberto ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!aberto}
    >
      <nav className="flex h-full flex-col justify-center gap-6 px-8">
        {nav.map((n, i) => (
          <a
            key={n.label}
            href={n.href}
            onClick={() => setAberto(false)}
            tabIndex={aberto ? 0 : -1}
            style={{ transitionDelay: aberto ? `${i * 55 + 90}ms` : "0ms" }}
            className={`text-display text-4xl text-foreground hover:text-primary transition-all duration-500 ${
              aberto ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
          >
            {n.label}
          </a>
        ))}
      </nav>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        className="md:hidden flex flex-col justify-center gap-[5px] w-8 h-8 text-foreground"
      >
        <span
          className={`block h-px w-6 bg-current transition-transform duration-300 ${
            aberto ? "translate-y-[6px] rotate-45" : ""
          }`}
        />
        <span
          className={`block h-px w-6 bg-current transition-opacity duration-200 ${
            aberto ? "opacity-0" : ""
          }`}
        />
        <span
          className={`block h-px w-6 bg-current transition-transform duration-300 ${
            aberto ? "-translate-y-[6px] -rotate-45" : ""
          }`}
        />
      </button>

      {montado ? createPortal(painel, document.body) : null}
    </>
  );
}
