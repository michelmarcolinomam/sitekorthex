import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ContactForm } from "@/components/ContactForm";
import heroImg from "@/assets/hero-korthex.jpg";
import michelImg from "@/assets/michel-marcolino.jpg";
import plataformaImg from "@/assets/plataforma.jpg";
import problemaImg from "@/assets/problema.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Korthex — Desenvolvimento de Líderes e Mentoria Executiva" },
      {
        name: "description",
        content:
          "Mentoria executiva e desenvolvimento de lideranças para fundadores, executivos e equipes. Método Korthex: maturidade que sustenta o crescimento.",
      },
      { property: "og:url", content: "https://korthex.com.br/" },
      { property: "og:title", content: "Korthex — Desenvolvimento de Líderes e Mentoria Executiva" },
      {
        property: "og:description",
        content:
          "Mentoria executiva e desenvolvimento de lideranças para fundadores, executivos e equipes.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://korthex.com.br/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Person",
          "@id": "https://korthex.com.br/#michel-marcolino",
          name: "Michel Marcolino",
          jobTitle: "Fundador e Mentor Executivo",
          worksFor: { "@id": "https://korthex.com.br/#organization" },
          description:
            "Há mais de 15 anos conduz processos privados de desenvolvimento com fundadores, sucessores e executivos.",
          sameAs: [
            "https://www.linkedin.com/company/korthexid/",
            "https://www.instagram.com/korthexid/",
          ],
        }),
      },
    ],
  }),
});

function KorthexLogo({ className = "h-6" }: { className?: string }) {
  return (
    <svg
      viewBox="40 0 751 168.1"
      fill="currentColor"
      className={className}
      aria-label="Korthex"
      role="img"
      preserveAspectRatio="xMidYMid meet"
    >
      <path d="M188.9,131.8c-28.8,1.8-52.6-22-50.8-50.8,1.5-23.8,20.8-43,44.6-44.6,28.8-1.8,52.6,22,50.8,50.8-1.5,23.8-20.8,43-44.6,44.5ZM157.2,81.2c-1.8,18.1,13.4,33.3,31.4,31.4,13.4-1.3,24.2-12.2,25.6-25.6,1.8-18.1-13.4-33.3-31.4-31.5-13.4,1.3-24.2,12.2-25.6,25.6Z" />
      <path d="M337.3,131.9h-19.9c-.4,0-.8-.2-1-.5l-15.7-24c-.4-.6-1-.9-1.7-.9h-15c-1.1,0-2.1.9-2.1,2.1v22.2c0,.6-.5,1.2-1.2,1.2-3.4,0-13.4,0-16.8,0-.6,0-1.2-.5-1.2-1.2,0-9.7,0-77.9,0-91.8,0-1.4,1.1-2.5,2.5-2.5,7.9,0,34.8,0,34.8,0,19.5,0,36.2,16,35.9,35.5-.2,11.8-6.1,22-15,28.3s-1,1.7-.5,2.6l17.9,27.3c.5.8,0,1.9-1,1.9ZM300.9,87.3c9,0,16.2-7.4,15.9-16.5-.3-8.6-7.7-15.4-16.3-15.4h-18.4c-.3,0-.3,0-.3,0v31.8s0,0,0,0h19.1Z" />
      <path d="M542.2,38.3v91.6c0,1.1-.9,2-2,2h-15.1c-1.1,0-2-.9-2-2v-34c0-1.1-.9-2-2-2h-36.9c-1.1,0-2,.9-2,2v34c0,1.1-.9,2-2,2h-15.1c-1.1,0-2-.9-2-2V38.3c0-1.1.9-2,2-2h15.1c1.1,0,2,.9,2,2v34.5c0,1.1.9,2,2,2h36.9c1.1,0,2-.9,2-2v-34.5c0-1.1.9-2,2-2h15.1c1.1,0,2,.9,2,2Z" />
      <path d="M635.1,108.8c-.5-.7-1.4-.9-2.2-.5-4.4,2.8-9.7,4.5-15.3,4.5-11.9,0-22-7.3-26.4-17.6-.4-.8.3-1.8,1.2-1.8h38.1s32.9,0,32.9,0c.6,0,1.2-.4,1.3-1.1.5-2.7.7-5.4.7-8.2,0-27.1-22.6-49-50-47.7-24.5,1.1-44.3,21-45.4,45.4-1.3,27.4,20.6,50,47.7,50s18.2-2.8,25.6-7.5c.7-.5,1-1.5.5-2.2l-8.6-13.4ZM617.7,55.5c11.9,0,22,7.3,26.4,17.6s-.3,1.8-1.2,1.8h-50.4c-.9,0-1.5-.9-1.2-1.8,4.3-10.3,14.5-17.6,26.4-17.6Z" />
      <path d="M360.7,36.3h71.9c1,0,1.9.8,1.9,1.9v15.3c0,1-.8,1.9-1.9,1.9h-24.5c-1,0-1.9.8-1.9,1.9v72.6c0,1-.8,1.9-1.9,1.9h-15.3c-1,0-1.9-.8-1.9-1.9V57.3c0-1-.8-1.9-1.9-1.9h-24.5c-1,0-1.9-.8-1.9-1.9v-15.3c0-1,.8-1.9,1.9-1.9Z" />
      <rect x="40.1" y="36.1" width="19.2" height="96.5" rx="1.5" ry="1.5" />
      <path d="M118.6,36.3h-17.8c-.8,0-1.5.4-1.9,1l-29.4,45c-.8,1.2-.8,2.8,0,4l29.4,45c.4.6,1.1,1,1.9,1h17.8c1.8,0,2.8-2,1.9-3.5l-28.3-43.4c-.5-.7-.5-1.7,0-2.4l28.3-43.4c1-1.5,0-3.5-1.9-3.5Z" />
      <path d="M737.8,102.1v-35.4c0-.9.4-1.8,1-2.4l28.5-28.5c.8-.8,2.1-.8,2.8,0l10.5,10.5c.8.8.8,2.1,0,2.8l-21.9,21.9c-.6.6-1,1.5-1,2.4v21.7c0,.9.4,1.7,1,2.4l21.9,21.9c.8.8.8,2.1,0,2.8l-10.5,10.5c-.8.8-2.1.8-2.8,0l-28.5-28.5c-.6-.6-1-1.5-1-2.4Z" />
      <path d="M682.6,119.6l21.9-21.9c.6-.6,1-1.5,1-2.4v-21.7c0-.9-.4-1.7-1-2.4l-21.9-21.9c-.8-.8-.8-2.1,0-2.8l10.5-10.5c.8-.8,2.1-.8,2.8,0l28.5,28.5c.6.6,1,1.5,1,2.4v35.4c0,.9-.4,1.8-1,2.4l-28.5,28.5c-.8.8-2.1.8-2.8,0l-10.5-10.5c-.8-.8-.8-2.1,0-2.8Z" />
    </svg>
  );
}

function Header() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const nav = [
    { label: "Manifesto", href: "#manifesto" },
    { label: "Método", href: "#metodologia" },
    { label: "Programas", href: "#solucoes" },
    { label: "Blog", href: "/blog" },
    { label: "Fundador", href: "#michel" },
    { label: "Plataforma", href: "#plataforma" },
    { label: "Contato", href: "#cta" },
  ];
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-background border-b border-border/60"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-[1500px] px-6 md:px-12 h-20 flex items-center justify-between gap-8">
        <a href="#top" className="block text-foreground">
          <KorthexLogo className="h-6 md:h-7 w-auto" />
        </a>
        <nav className="hidden md:flex items-center gap-10 lg:gap-14">
          {nav.map((n) => (
            <a
              key={n.label}
              href={n.href}
              className="group relative text-display text-[11px] md:text-xs tracking-[0.08em] text-foreground/75 hover:text-primary transition-colors"
            >
              {n.label}
              <span className="absolute -bottom-1 left-0 h-px w-0 bg-primary transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section id="top" className="relative h-screen min-h-[680px] overflow-hidden">
      {/* Background gradient — vertical suave */}
      <div className="absolute inset-0">
        <div
          className="w-full h-full"
          style={{
            background:
              "linear-gradient(180deg, var(--background) 0%, var(--background) 40%, var(--surface) 100%)",
          }}
        />
        <div className="absolute inset-0 grain" />
      </div>

      {/* Hero copy + action chips */}
      <div className="absolute inset-0 z-10 flex items-center px-6 md:px-12 pt-20">
        <div className="mx-auto max-w-[1400px] w-full">
          <h1
            className="text-display text-foreground max-w-[16ch]"
            style={{
              fontSize: "clamp(2.25rem, 5.4vw, 5.5rem)",
              letterSpacing: "-0.045em",
              lineHeight: 0.95,
            }}
          >
            Ninguém coloca<br />
            no mundo aquilo<br />
            que não tem{" "}
            <span className="italic font-serif normal-case text-primary">
              dentro de si.
            </span>
          </h1>

          <div className="mt-10 flex flex-wrap gap-3">
            {[
              { label: "15 Anos Atuando", href: "#michel" },
              { label: "80+ Empresas", href: "#michel" },
              { label: "Metodologia", href: "#metodologia" },
              { label: "Autoridade", href: "#michel" },
            ].map((b) => (
              <a
                key={b.label}
                href={b.href}
                className="group inline-flex items-center gap-2 rounded-full pl-5 pr-1.5 py-1.5 text-[13px] text-foreground border border-foreground/20 bg-background/40 backdrop-blur-sm hover:border-foreground/40 hover:bg-background/60 transition-all"
              >
                {b.label}
                <span
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full text-primary-foreground transition-transform group-hover:translate-x-0.5"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  →
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>

    </section>
  );
}

function SectionLabel({
  index,
  label,
  variant = "default",
}: {
  index: string;
  label: string;
  variant?: "default" | "light";
}) {
  const isLight = variant === "light";
  return (
    <div
      className={`flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] ${
        isLight ? "text-primary-foreground/70" : "text-foreground/55"
      }`}
    >
      <span className={isLight ? "text-primary-foreground" : "text-primary"}>
        {index}
      </span>
      <span
        className={isLight ? "w-8 h-px bg-primary-foreground/35" : "w-8 hairline"}
      />
      <span>{label}</span>
    </div>
  );
}

function Manifesto() {
  return (
    <section id="manifesto" className="relative py-32 md:py-48 px-6 md:px-12">
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel index="01" label="Manifesto" />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-8 md:col-start-3">
            <p className="text-display text-[clamp(2rem,4.6vw,4.5rem)] text-foreground leading-[1.05]">
              Existe um ponto em que a empresa para de crescer apenas pela energia do
              fundador — e passa a depender da{" "}
              <span className="italic text-primary">qualidade da decisão</span> que
              é tomada quando ninguém está olhando.
            </p>
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-12 text-foreground/75 text-base leading-relaxed">
              <p>
                Korthex não é palestra, não é coaching de palco e não vende motivação.
                É um trabalho sério, técnico e desconfortável. Feito para pessoas que
                já entenderam que desenvolvimento não é estilo — é arquitetura
                comportamental estratégica.
              </p>
              <p>
                Levamos clareza onde há ruído. Construímos método onde havia
                hábito. Modelamos executivos para se anteciparem. Formamos equipes
                que advogam para a cultura e sustentam crescimento.
              </p>
            </div>
            <div className="mt-12">
              <Link
                to="/manifesto"
                className="group inline-flex items-center gap-3 rounded-full pl-7 pr-2 py-2.5 text-[12px] font-medium tracking-widest uppercase text-foreground border border-foreground/25 bg-background/50 backdrop-blur-sm hover:border-primary/50 hover:bg-background/70 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300"
              >
                CONHECER O MANIFESTO KORTHEX COMPLETO
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full text-primary-foreground transition-transform duration-300 group-hover:translate-x-1 group-hover:scale-105"
                  style={{ backgroundColor: "var(--primary)" }}
                >
                  →
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Problema() {
  const pontos = [
    "Líderes que decidem por exaustão, não por estratégia.",
    "Times que executam o que entenderam, não o que foi pedido.",
    "Conversas circulares que nunca viram fluxo de trabalho.",
    "Crescimento que esconde dependência do fundador.",
    "Cultura confundida com tolerância.",
    "Maturidade adiada em nome do faturamento.",
    "Comunicação distorcida e agressiva.",
    "Líderes emocionalmente desequilibrados.",
  ];
  return (
    <section className="relative py-32 md:py-48 px-6 md:px-12 overflow-hidden bg-[color:var(--surface)]">
      <div className="absolute inset-0 -z-10">
        <img
          src={problemaImg}
          alt=""
          loading="lazy"
          width={1920}
          height={1080}
          className="w-full h-full object-cover opacity-25"
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, var(--surface) 0%, color-mix(in oklab, var(--surface) 80%, transparent) 50%, var(--surface) 100%)",
          }}
        />
      </div>
      <div className="mx-auto max-w-[1400px]">
        <SectionLabel index="02" label="O Problema" />
        <div className="mt-12 grid grid-cols-1 md:grid-cols-12 gap-12">
          <div className="md:col-span-5">
            <h2 className="text-display text-[clamp(2.5rem,5vw,5rem)] text-foreground">
              Há uma <span className="italic text-primary">tensão</span> que nenhum
              relatório mostra.
            </h2>
            <div className="mt-10 inline-flex items-start gap-4">
              <span className="block w-10 h-px bg-primary mt-3" />
              <p className="text-display text-2xl md:text-3xl uppercase tracking-[0.18em] text-primary leading-[1.15]">
                Arquitetura<br />
                Comportamental<br />
                Estratégica
              </p>
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="text-foreground/75 text-base leading-relaxed mb-10">
              Empresas chegam até nós no mesmo ponto: a força de trabalho aguenta,
              mas a estrutura emocional interna não. O fundador virou gargalo no
              processo. O time virou plateia. E as decisões importantes voltam
              sempre para a mesma cadeira. A comunicação é destrutiva. O ambiente
              não é saudável e produtivo.
            </p>
            <ul>
              {pontos.map((p, i) => (
                <li
                  key={p}
                  className="group flex items-start gap-6 py-5 border-t border-border last:border-b"
                >
                  <span className="text-[10px] tracking-[0.25em] text-foreground/40 pt-1.5 w-8">
                    /{String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="text-foreground/90 text-lg leading-snug group-hover:text-primary transition-colors">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

function Metodologia() {
  const etapas = [
    {
      t: "Diagnóstico Estrutural",
      d: "Mapeamento dos padrões organizacionais, gaps de liderança e oportunidades de desenvolvimento que impactam a performance e a dinâmica da empresa.",
    },
    {
      t: "Arquitetura de Abordagem",
      d: "Estruturação de uma estratégia de desenvolvimento alinhada à cultura, aos desafios e aos objetivos organizacionais da empresa.",
    },
    {
      t: "Programa de Desenvolvimento",
      d: "Aplicação de treinamentos, mentorias e experiências voltadas ao fortalecimento da liderança, comunicação e maturidade organizacional.",
    },
    {
      t: "Implementação Estratégica",
      d: "Integração prática dos aprendizados à rotina organizacional, fortalecendo comportamento, cultura e tomada de decisão.",
    },
    {
      t: "Mapeamento de Resultados",
      d: "Análise da evolução comportamental, maturidade organizacional e impactos gerados pelo desenvolvimento aplicado.",
    },
    {
      t: "Evolução Contínua",
      d: "Desenvolvimento contínuo das capacidades humanas, lideranças e estruturas organizacionais de forma sustentável e progressiva.",
    },
  ];
  return (
    <section id="metodologia" className="relative py-32 md:py-48 px-6 md:px-12">
      <div className="mx-auto max-w-[1500px]">
        <SectionLabel index="03" label="Metodologia · 6 Etapas" />
        <h2 className="mt-12 text-display text-[clamp(2.5rem,6vw,6rem)] text-foreground max-w-5xl">
          O método <span className="italic text-primary">Korthex</span>.
        </h2>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {etapas.map((e, i) => (
            <article
              key={e.t}
              className="group relative p-8 md:p-10 md:pl-12 before:content-[''] before:absolute before:left-4 md:before:left-6 before:top-1/2 before:-translate-y-1/2 before:h-[60%] before:w-px before:bg-foreground/15 group-hover:before:bg-primary before:transition-colors"
            >
              <div className="flex items-start justify-between mb-12">
                <span className="text-display text-7xl text-primary/30 group-hover:text-primary transition-colors">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-foreground/40 mt-3">
                  Etapa
                </span>
              </div>
              <h3 className="text-display text-3xl text-foreground mb-4">{e.t}</h3>
              <p className="text-foreground/65 text-sm leading-relaxed max-w-xs">
                {e.d}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-20 flex justify-center">
          <Link
            to="/metodo"
            className="group inline-flex items-center gap-4 rounded-full border border-foreground/20 px-8 py-5 text-foreground hover:border-primary hover:bg-primary hover:text-primary-foreground transition-all"
          >
            <span className="text-sm uppercase tracking-[0.25em]">
              Saiba mais sobre o método Korthex
            </span>
            <span className="w-8 h-8 rounded-full bg-foreground/10 group-hover:bg-primary-foreground/15 flex items-center justify-center transition-all group-hover:translate-x-0.5">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Solucoes() {
  const programas = [
    {
      n: "I",
      t: "Korthex Executivo",
      r: "Individual",
      d: "Mentoria direta e privada com o fundador ou C-Level. Identidade, decisão, postura, sucessão e brand persona.",
      link: "/korthex-executivo",
    },
    {
      n: "II",
      t: "Korthex Liderança",
      r: "Individual / Grupos",
      d: "Desenvolvimento de lideranças capazes de sustentar cultura, formar autonomia e transformar responsabilidade individual em capacidade organizacional.",
      link: "/lideranca",
    },
    {
      n: "III",
      t: "Korthex Performance",
      r: "Times / Setores",
      d: "Desenvolvimento de equipes, setores e profissionais através da comunicação, gestão das emoções e alinhamento comportamental que sustentam performance consistente.",
      link: "/performance",
    },
  ];

  return (
    <section id="solucoes" className="relative py-32 md:py-48 px-6 md:px-12 bg-[color:var(--surface)]">
      <div className="mx-auto max-w-[1500px]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
          <div className="md:col-span-7">
            <SectionLabel index="04" label="Soluções · Ecossistema" />
            <h2 className="mt-12 text-display text-[clamp(2.5rem,6vw,6rem)] text-foreground">
              Três programas.<br />
              <span className="italic text-primary">Uma única exigência.</span>
            </h2>
          </div>
          <p className="md:col-span-4 md:col-start-9 text-foreground/70 text-base leading-relaxed">
            Cada programa Korthex parte da mesma premissa: crescimento
            sustentável exige maturidade suficiente para deixar de ser o gargalo
            da própria organização.
          </p>
        </div>

        <div className="mt-20 border-t border-border">
          {programas.map((p) => (
            <div
              key={p.t}
              className="group grid grid-cols-12 gap-6 py-8 md:py-10 border-b border-border items-baseline hover:bg-background/60 transition-colors px-2 md:px-6"
            >
              <div className="col-span-1 text-display text-2xl text-primary/70 group-hover:text-primary transition-colors">
                {p.n}
              </div>
              <h3 className="col-span-12 md:col-span-3 text-display text-3xl md:text-4xl text-foreground group-hover:italic transition-all">
                {p.t}
              </h3>
              <p className="col-span-12 md:col-span-4 text-foreground/70 text-sm md:text-base leading-relaxed">
                {p.d}
              </p>
              <div className="col-span-12 md:col-span-2 text-[10px] uppercase tracking-[0.25em] text-foreground/50 md:text-right">
                {p.r}
              </div>
              <div className="col-span-12 md:col-span-2 md:text-right">
                <a
                  href={p.link}
                  className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-foreground/70 hover:text-primary transition-colors border-b border-foreground/20 hover:border-primary pb-1"
                >
                  Conheça o programa
                  <span className="transition-transform group-hover:translate-x-0.5">→</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Michel() {
  return (
    <section id="michel" className="relative py-32 md:py-48 px-6 md:px-12">
      <div className="mx-auto max-w-[1500px]">
        <SectionLabel index="05" label="Quem conduz" />
        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-5">
            <div className="relative aspect-[3/4] overflow-hidden grain">
              <img
                src={michelImg}
                alt="Michel Marcolino"
                loading="lazy"
                width={1080}
                height={1440}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
          <div className="md:col-span-6 md:col-start-7">
            <p className="text-[10px] uppercase tracking-[0.3em] text-primary mb-6">
              Michel Marcolino · Fundador
            </p>
            <h2 className="text-display text-[clamp(2.5rem,5vw,5rem)] text-foreground leading-[1]">
              Trabalho com pessoas que <span className="italic text-primary">já não cabem</span> no
              próprio script.
            </h2>
            <div className="mt-10 space-y-6 text-foreground/75 text-base leading-relaxed">
              <p>
                Há mais de uma década, conduzo processos privados de desenvolvimento
                com fundadores, sucessores e executivos inseridos em contextos de
                crescimento, pressão e transição organizacional.
              </p>
              <p>
                Minha atuação acontece de forma silenciosa por princípio: sem palco
                e distante da lógica superficial que transformou desenvolvimento
                humano em espetáculo.
              </p>
              <p>
                A Korthex nasce dessa trajetória — da compreensão de que liderança
                madura não é construída através de fórmulas rápidas, mas por meio de
                estrutura, consciência, tensão e desenvolvimento contínuo.
              </p>
              <p className="italic text-foreground/90">
                Porque toda organização cresce até o limite da maturidade das
                pessoas que a conduzem.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border pt-8">
              {[
                ["15+", "Anos de prática"],
                ["+1000", "Mentes formadas"],
                ["+100", "Negócios modelados"],
              ].map(([k, v]) => (
                <div key={k}>
                  <div className="text-display text-3xl text-foreground">{k}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-[0.2em] text-foreground/55">
                    {v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Plataforma() {
  return (
    <section
      id="plataforma"
      className="relative py-32 md:py-48 px-6 md:px-12 overflow-hidden bg-primary"
      style={{ backgroundColor: "var(--primary)" }}
    >
      <div className="mx-auto max-w-[1500px] grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        <div className="md:col-span-6 order-2 md:order-1">
          <SectionLabel index="06" label="Plataforma Korthex" variant="light" />
          <h2 className="mt-12 text-display text-[clamp(2.5rem,5.5vw,5.5rem)] text-primary-foreground">
            Um <span className="italic text-black underline">ambiente fechado</span> para a
            inteligência continuar depois da sala.
          </h2>
          <p className="mt-10 text-primary-foreground/80 text-base leading-relaxed max-w-xl">
            Acesso vitalício a sessões privadas, protocolos de decisão, biblioteca
            de casos reais e comunidade fechada de fundadores e sucessores em
            processo Korthex. Sem feed. Sem ruído. Apenas conteúdo que sustenta a
            próxima decisão.
          </p>
          <ul className="mt-10 space-y-4">
            {[
              "Sessões privadas mensais com Michel Marcolino",
              "Biblioteca de protocolos e cartas executivas",
              "Comunidade fechada — entrada por convite",
              "Arquivo vivo de diagnósticos anonimizados",
            ].map((i) => (
              <li
                key={i}
                className="flex items-start gap-4 text-primary-foreground/90 text-[15px]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-primary-foreground mt-2.5 shrink-0" />
                {i}
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-6 order-1 md:order-2">
          <div className="relative aspect-[4/3] overflow-hidden grain">
            <img
              src={plataformaImg}
              alt="Plataforma Korthex"
              loading="lazy"
              width={1600}
              height={1000}
              className="w-full h-full object-cover"
            />
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between text-primary-foreground">
              <div className="text-[10px] uppercase tracking-[0.3em] opacity-80">
                KX · Plataforma Privada
              </div>
              <div className="text-display text-4xl">v.MMXXVI</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="cta" className="relative py-32 md:py-56 px-6 md:px-12">
      <div className="mx-auto max-w-[1500px]">
        <SectionLabel index="07" label="Próximo passo" />
        <h2 className="mt-12 text-display text-[clamp(3rem,9vw,10rem)] text-foreground leading-[0.95]">
          Não vendemos pressa.<br />
          <span className="italic text-primary">Vendemos maturidade.</span>
        </h2>
        <div className="mt-16 grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5">
            <p className="text-foreground/75 text-base leading-relaxed">
              O processo Korthex começa por uma conversa privada de diagnóstico.
              Sem proposta pronta, sem script. Apenas escuta — e a leitura honesta
              de se faz sentido continuar.
            </p>
            <a
              href="mailto:contato@korthexid.com.br"
              className="mt-8 inline-flex items-center gap-3 text-foreground/70 hover:text-primary transition-colors"
            >
              <span className="text-[11px] uppercase tracking-[0.25em]">
                contato@korthexid.com.br
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
    { label: "Manifesto", href: "#manifesto" },
    { label: "Método", href: "#metodologia" },
    { label: "Programas", href: "#solucoes" },
    { label: "Blog", href: "/blog" },
    { label: "Fundador", href: "#michel" },
    { label: "Plataforma", href: "#plataforma" },
    { label: "Contato", href: "#cta" },
  ];

  const sociais = [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/company/korthexid/?viewAsMember=true",
      icon: (
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
      ),
    },
    {
      label: "Instagram",
      href: "https://www.instagram.com/korthexid/",
      icon: (
        <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.7 3.7 0 0 1-1.38-.9 3.7 3.7 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23-.06-1.27-.07-1.65-.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16zM12 0C8.74 0 8.33.01 7.05.07c-1.28.06-2.15.26-2.91.56-.79.3-1.46.72-2.12 1.38A5.86 5.86 0 0 0 .63 4.14c-.3.76-.5 1.63-.56 2.91C.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.28.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.63.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.28-.06 2.15-.26 2.91-.56a5.86 5.86 0 0 0 2.12-1.38 5.86 5.86 0 0 0 1.38-2.12c.3-.76.5-1.63.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.28-.26-2.15-.56-2.91a5.86 5.86 0 0 0-1.38-2.12A5.86 5.86 0 0 0 19.86.63c-.76-.3-1.63-.5-2.91-.56C15.67.01 15.26 0 12 0zm0 5.84a6.16 6.16 0 1 0 0 12.32 6.16 6.16 0 0 0 0-12.32zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.41-10.85a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
      ),
    },
    {
      label: "YouTube",
      href: "#",
      icon: (
        <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
      ),
    },
    {
      label: "Spotify",
      href: "#",
      icon: (
        <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.5 17.31a.75.75 0 0 1-1.03.25c-2.82-1.72-6.37-2.11-10.56-1.16a.75.75 0 1 1-.33-1.46c4.58-1.05 8.51-.6 11.67 1.34.35.21.46.67.25 1.03zm1.47-3.27a.94.94 0 0 1-1.29.31c-3.23-1.98-8.15-2.56-11.97-1.4a.94.94 0 1 1-.54-1.8c4.36-1.32 9.78-.68 13.49 1.6.44.27.58.85.31 1.29zm.13-3.4C15.73 8.26 8.4 8.03 4.62 9.18a1.12 1.12 0 1 1-.65-2.15c4.34-1.32 12.43-1.06 16.55 1.38a1.12 1.12 0 1 1-1.15 1.93z" />
      ),
    },
    {
      label: "WhatsApp",
      href: "#",
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
            <div className="text-foreground">
              <KorthexLogo className="h-8 w-auto" />
            </div>
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
                href="mailto:contato@korthexid.com.br"
                className="hover:text-primary transition-colors"
              >
                contato@korthexid.com.br
              </a>
              <div className="pt-2">
                <p className="text-[10px] uppercase tracking-[0.25em] text-foreground/45 mb-1.5">
                  CEO
                </p>
                <a
                  href="mailto:aline@korthexid.com.br"
                  className="hover:text-primary transition-colors"
                >
                  aline@korthexid.com.br
                </a>
              </div>
            </div>

            <p className="text-[10px] uppercase tracking-[0.3em] text-foreground/45 mt-8 mb-3">
              Localização
            </p>
            <span className="text-sm text-foreground/70">Maringá · Brasil</span>
          </div>
        </div>

        {/* Linha inferior */}
        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[11px] uppercase tracking-[0.25em] text-foreground/50">
          <span>© MMXXVI Korthex</span>
          <span>Todos os direitos reservados</span>
        </div>
      </div>
    </footer>
  );
}

export function Index() {
  return (
    <main className="bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground">
      <Header />
      <Hero />
      <Manifesto />
      <Problema />
      <Metodologia />
      <Solucoes />
      <Michel />
      <Plataforma />
      <CTA />
      <Footer />
    </main>
  );
}
