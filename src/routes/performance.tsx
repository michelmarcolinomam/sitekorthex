import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ContactForm } from "@/components/ContactForm";

// ⚠️ TROCAR pelo ID real do vídeo do YouTube quando disponível.
// Ex.: para https://www.youtube.com/watch?v=ABC123xyz  →  YOUTUBE_ID = "ABC123xyz"
const YOUTUBE_ID = "dQw4w9WgXcQ";

export const Route = createFileRoute("/performance")({
  head: () => ({
    meta: [
      { title: "Korthex Performance — Korthex" },
      {
        name: "description",
        content:
          "Korthex Performance: seis treinamentos que desenvolvem capacidades emocionais, comportamentais e relacionais para fortalecer pessoas, equipes e resultados.",
      },
      { property: "og:title", content: "Korthex Performance — Korthex" },
      {
        property: "og:description",
        content:
          "Seis treinamentos. Seis transformações. Capacidades humanas que impactam diretamente a produtividade e a cultura das equipes.",
      },
      { property: "og:type", content: "article" },
    ],
  }),
  component: PerformancePage,
});

/* ─────────────────────────────────────────────────────────────
   COMPONENTES COMPARTILHADOS (mesmo padrão de /manifesto e /metodo)
   ───────────────────────────────────────────────────────────── */

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? "backdrop-blur-md bg-background/70 border-b border-border/40"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1800px] px-6 md:px-12 h-20 flex items-center justify-between gap-8">
        <Link to="/">
          <span className="text-sm md:text-base font-semibold tracking-[0.2em] uppercase text-foreground">
            Korthex
          </span>
        </Link>
        <Link
          to="/"
          className="text-[13px] text-foreground/85 hover:text-foreground transition-colors"
        >
          ← Voltar
        </Link>
      </div>
    </header>
  );
}

function SectionLabel({ index, label }: { index: string; label: string }) {
  return (
    <div className="flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-foreground/55">
      <span className="text-primary">{index}</span>
      <span className="w-8 hairline" />
      <span>{label}</span>
    </div>
  );
}

function Dash() {
  return <span className="block w-3 h-px bg-primary mt-2.5 shrink-0" />;
}

function ModalidadeIcon({ tipo }: { tipo: "presencial" | "online" | "hibrida" }) {
  if (tipo === "presencial") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <circle cx="8" cy="8" r="2.4" />
        <circle cx="16" cy="8" r="2.4" />
        <path d="M3.5 19c0-2.6 2-4.4 4.5-4.4s4.5 1.8 4.5 4.4" />
        <path d="M14 14.8c2.2-.3 4.5 1.5 4.5 4.2" />
      </svg>
    );
  }
  if (tipo === "online") {
    return (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <rect x="3" y="4.5" width="18" height="12" rx="1.6" />
        <path d="M9 20h6M12 16.5V20" />
        <path d="M9.2 10.4a4 4 0 0 1 5.6 0" />
        <path d="M11 12.2a1.6 1.6 0 0 1 2 0" />
      </svg>
    );
  }
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="9" cy="12" r="5.2" />
      <circle cx="15" cy="12" r="5.2" />
    </svg>
  );
}

function CTA() {
  return (
    <section id="cta" className="relative py-32 md:py-56 px-6 md:px-12">
      <div className="mx-auto max-w-[1500px]">
        <SectionLabel index="06" label="Próximo passo" />
        <h2 className="mt-12 text-display text-[clamp(3rem,9vw,10rem)] text-foreground leading-[0.95]">
          Não treinamos por treinar.<br />
          <span className="italic text-primary">Desenvolvemos pessoas.</span>
        </h2>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5">
            <p className="text-foreground/75 text-base leading-relaxed">
              O Korthex Performance começa por uma conversa privada de
              diagnóstico. Sem proposta pronta, sem script. Apenas escuta — e a
              leitura honesta de quais treinamentos fazem sentido para o momento
              da sua equipe.
            </p>
            <a
              href="mailto:contato@korthex.com"
              className="mt-8 inline-flex items-center gap-3 text-foreground/70 hover:text-primary transition-colors"
            >
              <span className="text-[11px] uppercase tracking-[0.25em]">
                contato@korthex.com
              </span>
            </a>
            <div className="mt-8">
              <a
                href="#cta"
                className="group inline-flex items-center gap-4 rounded-full bg-black px-8 py-5 text-white hover:bg-black/85 transition-colors"
              >
                <span className="text-sm uppercase tracking-[0.25em]">
                  Faça um diagnóstico gratuito
                </span>
                <span className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </a>
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <ContactForm />
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const menu = [
    { label: "Método", href: "/#metodologia" },
    { label: "Mentorias", href: "/#michel" },
    { label: "Programas", href: "/#solucoes" },
    { label: "Treinamentos", href: "/#plataforma" },
    { label: "Contato", href: "#cta" },
  ];

  const sociais = [
    {
      label: "LinkedIn",
      href: "https://linkedin.com",
      icon: (
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      ),
    },
    {
      label: "Instagram",
      href: "https://instagram.com",
      icon: (
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.3-1.46.72-2.12 1.38A5.86 5.86 0 0 0 .63 4.14c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.12-1.38 5.86 5.86 0 0 0 1.38-2.12c.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.12A5.86 5.86 0 0 0 19.86.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
      ),
    },
    {
      label: "YouTube",
      href: "https://youtube.com",
      icon: (
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
      ),
    },
    {
      label: "Spotify",
      href: "https://spotify.com",
      icon: (
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.31a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.56-1.16a.75.75 0 1 1-.33-1.46c4.58-1.05 8.51-.6 11.67 1.34.35.21.46.67.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 1 1-.54-1.8c4.36-1.32 9.78-.68 13.49 1.6.44.27.58.85.31 1.29zm.13-3.4C15.73 8.26 8.4 8.03 4.62 9.18a1.12 1.12 0 1 1-.65-2.15c4.34-1.32 12.43-1.06 16.55 1.38a1.12 1.12 0 1 1-1.15 1.93z" />
      ),
    },
    {
      label: "WhatsApp",
      href: "https://wa.me/",
      icon: (
        <path d="M.06 24l1.69-6.16a11.87 11.87 0 0 1-1.59-5.95C.16 5.34 5.5 0 12.06 0a11.82 11.82 0 0 1 8.41 3.49 11.82 11.82 0 0 1 3.48 8.41c0 6.56-5.34 11.9-11.9 11.9a11.9 11.9 0 0 1-5.69-1.45L.06 24zM6.6 20.13c1.68.99 3.28 1.59 5.45 1.59 5.45 0 9.89-4.43 9.89-9.88a9.83 9.83 0 0 0-2.9-7A9.82 9.82 0 0 0 12.06 1.99c-5.46 0-9.9 4.43-9.9 9.89 0 2.22.65 3.89 1.74 5.63l-1 3.65 3.7-1.03zm10.86-5.6c-.07-.12-.27-.2-.56-.34-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.48 0 1.46 1.06 2.87 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2-1.42.25-.69.25-1.29.18-1.41z" />
      ),
    },
  ];

  return (
    <footer className="bg-[color:var(--surface)] px-6 md:px-12 py-20 md:py-24">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Marca */}
          <div className="md:col-span-4">
            <span className="text-display text-3xl text-foreground">Korthex</span>
            <p className="mt-4 text-foreground/60 text-sm leading-relaxed max-w-xs">
              Inteligência & Desenvolvimento. Uma metodologia silenciosa para
              transformar comportamento, decisão e estrutura organizacional.
            </p>
            <div className="mt-8 flex items-center gap-3">
              {sociais.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="group flex h-10 w-10 items-center justify-center rounded-full border border-foreground/15 bg-background/50 text-foreground/70 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                >
                  <svg
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="h-4 w-4"
                    aria-hidden="true"
                  >
                    {s.icon}
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* Menu destacado */}
          <div className="md:col-span-4 md:col-start-6">
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 mb-6">
              Navegação
            </p>
            <nav className="flex flex-col gap-3">
              {menu.map((m) => (
                <a
                  key={m.label}
                  href={m.href}
                  className="text-display text-xl text-foreground hover:text-primary hover:translate-x-1 transition-all w-fit"
                >
                  {m.label}
                </a>
              ))}
            </nav>
          </div>

          {/* Contato / dados */}
          <div className="md:col-span-3">
            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 mb-6">
              Contato
            </p>
            <div className="flex flex-col gap-3 text-sm text-foreground/70">
              <a
                href="mailto:contato@korthex.com"
                className="hover:text-primary transition-colors"
              >
                contato@korthex.com
              </a>
              <span>São Paulo · Brasil</span>
              <span>Acesso por convite</span>
            </div>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[11px] uppercase tracking-[0.25em] text-foreground/50">
          <span>© MMXXVI Korthex</span>
          <span>Todos os direitos reservados</span>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────────────────────
   DADOS
   ───────────────────────────────────────────────────────────── */

const treinamentos = [
  {
    n: "01",
    titulo: "Gestão das Emoções & Autopercepção",
    texto:
      "Desenvolvimento da consciência emocional, da capacidade de compreender comportamentos, reconhecer padrões e ampliar a responsabilidade sobre escolhas, atitudes e resultados.",
    impactos: [
      "Maior equilíbrio emocional",
      "Redução da reatividade",
      "Melhor adaptação às mudanças",
      "Maior maturidade profissional",
    ],
  },
  {
    n: "02",
    titulo: "Comunicação & Relacionamentos Produtivos",
    texto:
      "Fortalecimento da comunicação interpessoal, da qualidade das relações profissionais e da capacidade de construir ambientes mais colaborativos e produtivos.",
    impactos: [
      "Comunicação mais eficiente",
      "Redução de conflitos desnecessários",
      "Relacionamentos mais saudáveis",
      "Maior integração entre equipes",
    ],
  },
  {
    n: "03",
    titulo: "Autorresponsabilidade & Protagonismo",
    texto:
      "Desenvolvimento da consciência sobre responsabilidade individual, iniciativa, comprometimento e participação ativa na construção dos resultados.",
    impactos: [
      "Maior senso de responsabilidade",
      "Desenvolvimento da autonomia",
      "Aumento do comprometimento",
      "Redução da cultura de dependência",
    ],
  },
  {
    n: "04",
    titulo: "Identidade Profissional & Posicionamento",
    texto:
      "Construção de uma postura profissional mais consistente, fortalecendo credibilidade, presença, comprometimento e percepção de valor.",
    impactos: [
      "Fortalecimento da postura profissional",
      "Maior credibilidade",
      "Desenvolvimento da presença profissional",
      "Melhoria da imagem profissional",
    ],
  },
  {
    n: "05",
    titulo: "Colaboração & Trabalho em Equipe",
    texto:
      "Desenvolvimento da capacidade de cooperar, contribuir para objetivos coletivos e fortalecer relações de confiança dentro da organização.",
    impactos: [
      "Equipes mais alinhadas",
      "Maior cooperação",
      "Fortalecimento da confiança",
      "Melhoria do clima organizacional",
    ],
  },
  {
    n: "06",
    titulo: "Projeto de Vida & Produtividade",
    texto:
      "Desenvolvimento de clareza sobre objetivos pessoais e profissionais, fortalecendo organização, disciplina, planejamento e execução.",
    impactos: [
      "Maior foco e direcionamento",
      "Aumento da produtividade",
      "Melhor gestão do tempo",
      "Clareza sobre metas e próximos passos",
    ],
  },
];

const modalidades = [
  {
    tipo: "presencial" as const,
    titulo: "Presencial",
    texto:
      "Experiência imersiva realizada dentro da organização, conectando conteúdo, prática e realidade operacional.",
  },
  {
    tipo: "online" as const,
    titulo: "Online",
    texto:
      "Treinamentos realizados ao vivo em ambiente digital, mantendo interação, participação e aplicação prática.",
  },
  {
    tipo: "hibrida" as const,
    titulo: "Híbrida",
    texto:
      "Integração entre momentos presenciais e digitais, ampliando flexibilidade, alcance e continuidade do aprendizado.",
  },
];

/* ─────────────────────────────────────────────────────────────
   PÁGINA
   ───────────────────────────────────────────────────────────── */

function PerformancePage() {
  return (
    <main className="bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground min-h-screen">
      <Header />

      {/* ░░ HERO ░░ */}
      <section className="relative overflow-hidden px-6 md:px-12 pt-40 pb-20 md:pt-56 md:pb-28">
        <div className="absolute inset-0 grain pointer-events-none" />
        <div className="relative mx-auto max-w-[1100px]">
          <SectionLabel index="III" label="Korthex Performance · Equipes & Organizações" />
          <h1
            className="text-display text-foreground mt-10 max-w-[18ch]"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5.5rem)",
              letterSpacing: "-0.045em",
              lineHeight: 0.98,
            }}
          >
            Arquitetura de performance{" "}
            <span className="italic font-serif normal-case text-primary">
              organizacional.
            </span>
          </h1>
          <p className="mt-10 max-w-[60ch] text-foreground/75 text-lg md:text-xl leading-relaxed">
            Resultados raramente são limitados pela capacidade técnica.
            Normalmente são limitados pela capacidade comportamental.
          </p>
        </div>
      </section>

      {/* ░░ VÍDEO ░░ */}
      <section className="px-6 md:px-12 pb-20 md:pb-28">
        <div className="mx-auto max-w-[1100px]">
          <div className="relative w-full overflow-hidden rounded-2xl border border-border/60 bg-foreground/[0.03] shadow-xl shadow-primary/5">
            <div className="relative w-full" style={{ aspectRatio: "16 / 9" }}>
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube-nocookie.com/embed/${YOUTUBE_ID}?rel=0&modestbranding=1`}
                title="Korthex Performance"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
          <p className="mt-4 text-[11px] uppercase tracking-[0.25em] text-foreground/40">
            Korthex Performance · Michel Marcolino
          </p>
        </div>
      </section>

      {/* ░░ ABERTURA CONCEITUAL ░░ */}
      <section className="px-6 md:px-12 py-20 md:py-28 bg-[color:var(--surface)]">
        <div className="mx-auto max-w-[820px]">
          <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-8">
            O que desenvolvemos
          </p>
          <p
            className="text-display text-foreground leading-[1.1] mb-14"
            style={{ fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)" }}
          >
            Nenhuma empresa colhe aquilo que seus colaboradores ainda não
            aprenderam a{" "}
            <span className="italic text-primary">construir dentro de si.</span>
          </p>
          <div className="space-y-8 text-foreground/85 text-lg md:text-xl leading-relaxed">
            <p>
              O Korthex Performance foi criado para desenvolver capacidades
              humanas que impactam diretamente a forma como as pessoas se
              relacionam, se posicionam, assumem responsabilidades e produzem
              resultados dentro das organizações.
            </p>
            <p>
              Mais do que formar profissionais melhores, o objetivo é desenvolver
              pessoas mais conscientes, preparadas e comprometidas com a
              construção da própria trajetória.
            </p>
          </div>
        </div>
      </section>

      {/* ░░ 01 · PREMISSA ░░ */}
      <section className="relative px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <SectionLabel index="01" label="Premissa" />
          <h2
            className="text-display text-foreground mt-10 leading-[1.05] max-w-[20ch]"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 3rem)" }}
          >
            A empresa oferece a oportunidade. A transformação acontece quando a
            pessoa{" "}
            <span className="italic text-primary">
              decide construir algo a partir dela.
            </span>
          </h2>
          <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16">
            <div className="md:col-span-7">
              <div className="space-y-6 text-foreground/75 text-base md:text-lg leading-loose">
                <p>
                  O lugar onde alguém deseja chegar amanhã depende diretamente da
                  forma como decide atuar no lugar onde está hoje.
                </p>
                <p>
                  Quando um colaborador amplia sua consciência, fortalece sua
                  responsabilidade e assume o protagonismo da própria trajetória,
                  a empresa passa a colher os resultados desse movimento.
                </p>
              </div>
            </div>
            <div className="md:col-span-4 md:col-start-9">
              <div className="inline-flex items-start gap-4">
                <span className="block w-8 h-px bg-primary mt-3 shrink-0" />
                <p className="text-foreground/90 text-sm md:text-base leading-relaxed italic max-w-sm">
                  Crescimento profissional e crescimento pessoal caminham na mesma
                  direção.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ░░ 02 · TREINAMENTOS ░░ */}
      <section
        id="treinamentos"
        className="px-6 md:px-12 py-24 md:py-32 bg-[color:var(--surface)]"
      >
        <div className="mx-auto max-w-[1100px]">
          <SectionLabel index="02" label="Treinamentos de Performance" />
          <h2
            className="text-display text-foreground mt-10 mb-6"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 3rem)", lineHeight: 1.05 }}
          >
            Seis treinamentos.{" "}
            <span className="italic text-primary">Seis transformações.</span>
          </h2>
          <p className="max-w-[62ch] text-foreground/70 text-base md:text-lg leading-relaxed mb-16">
            Programas desenvolvidos para fortalecer capacidades emocionais,
            comportamentais e relacionais que impactam diretamente a
            produtividade, a cultura organizacional e os resultados das equipes.
            Todos podem ser realizados nas modalidades presencial, online ou
            híbrida.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {treinamentos.map((t) => (
              <article
                key={t.n}
                className="group flex flex-col rounded-2xl border border-border bg-card p-10 md:p-12 hover:border-primary/50 hover:shadow-lg transition-all"
              >
                <div className="flex items-baseline gap-5 mb-6">
                  <span className="text-display text-4xl md:text-5xl text-primary leading-none tabular-nums shrink-0">
                    {t.n}
                  </span>
                  <h3 className="text-display text-xl md:text-2xl text-foreground leading-snug">
                    {t.titulo}
                  </h3>
                </div>
                <p className="text-foreground/70 text-base leading-relaxed">
                  {t.texto}
                </p>
                <div className="mt-auto pt-10">
                  <div className="hairline h-px w-full mb-6" />
                  <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-5">
                    Impactos
                  </p>
                  <ul className="space-y-3">
                    {t.impactos.map((imp) => (
                      <li key={imp} className="flex items-baseline gap-3">
                        <Dash />
                        <span className="text-foreground/85 text-sm leading-relaxed">
                          {imp}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ░░ 03 · MODALIDADES ░░ */}
      <section className="px-6 md:px-12 py-24 md:py-32">
        <div className="mx-auto max-w-[1100px]">
          <SectionLabel index="03" label="Modalidades" />
          <h2
            className="text-display text-foreground mt-10 mb-14"
            style={{ fontSize: "clamp(1.75rem, 3.5vw, 3rem)", lineHeight: 1.05 }}
          >
            Aplicado ao{" "}
            <span className="italic text-primary">contexto da sua equipe.</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {modalidades.map((m) => (
              <div
                key={m.titulo}
                className="rounded-2xl border border-border bg-background/40 p-8"
              >
                <div className="flex items-center justify-center rounded-full border border-primary/30 text-primary mb-6 w-12 h-12">
                  <ModalidadeIcon tipo={m.tipo} />
                </div>
                <h4 className="text-display text-xl text-foreground mb-3">
                  {m.titulo}
                </h4>
                <p className="text-foreground/65 text-sm leading-relaxed">
                  {m.texto}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ░░ 04 · TRANSFORMAÇÃO ESPERADA ░░ */}
      <section className="px-6 md:px-12 py-24 md:py-32 bg-[color:var(--surface)]">
        <div className="mx-auto max-w-[1100px]">
          <SectionLabel index="04" label="Transformação esperada" />
          <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-16 items-start">
            <div className="md:col-span-7">
              <h2
                className="text-display text-foreground leading-[1.05]"
                style={{ fontSize: "clamp(1.75rem, 3.6vw, 3.25rem)" }}
              >
                Pessoas mais conscientes. Equipes mais comprometidas.{" "}
                <span className="italic text-primary">
                  Organizações mais fortes.
                </span>
              </h2>
            </div>
            <div className="md:col-span-4 md:col-start-9">
              <p className="text-foreground/75 text-base md:text-lg leading-relaxed">
                Quando colaboradores compreendem seu papel, assumem
                responsabilidade pela própria trajetória e transformam
                oportunidades em crescimento, a produtividade deixa de ser uma
                cobrança externa e passa a ser consequência natural de quem
                decidiu construir algo maior para si mesmo.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ░░ FECHO ░░ */}
      <section className="px-6 md:px-12 py-24 md:py-36 bg-primary">
        <div className="mx-auto max-w-[1000px] text-center">
          <p
            className="text-display text-primary-foreground leading-tight"
            style={{ fontSize: "clamp(1.75rem, 4vw, 3.25rem)" }}
          >
            A produtividade deixa de ser cobrança e passa a ser{" "}
            <span className="italic underline decoration-primary-foreground/40 underline-offset-8">
              consequência
            </span>{" "}
            de quem decidiu crescer.
          </p>
          <div className="mt-14">
            <Link
              to="/"
              className="group inline-flex items-center gap-3 rounded-full pl-7 pr-2 py-2.5 text-[12px] font-medium tracking-widest uppercase text-primary-foreground border border-primary-foreground/30 bg-primary-foreground/5 backdrop-blur-sm hover:bg-primary-foreground/10 transition-all duration-300"
            >
              VOLTAR PARA KORTHEX
              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary-foreground text-primary transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ░░ Contato (mesmo da home) ░░ */}
      <CTA />

      {/* ░░ Rodapé (mesmo da home) ░░ */}
      <Footer />
    </main>
  );
}
