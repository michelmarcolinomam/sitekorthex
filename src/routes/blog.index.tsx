import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Header, Footer, SectionLabel } from "@/components/blog/Chrome";
import { listPosts } from "@/lib/blog-server";
import { CATEGORIES, SITE_URL, formatDate, type PostWithAuthor } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/")({
  loader: () => listPosts(),
  head: () => ({
    meta: [
      { title: "Blog Korthex — Identidade Executiva, Liderança e Decisão" },
      {
        name: "description",
        content:
          "Textos sobre identidade executiva, arquitetura de decisão e desenvolvimento de lideranças. Sem motivação, sem atalho.",
      },
      { property: "og:title", content: "Blog Korthex" },
      {
        property: "og:description",
        content:
          "Textos sobre identidade executiva, arquitetura de decisão e desenvolvimento de lideranças.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/blog` },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/blog` }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          "@id": `${SITE_URL}/blog#blog`,
          url: `${SITE_URL}/blog`,
          name: "Blog Korthex",
          inLanguage: "pt-BR",
          publisher: { "@id": `${SITE_URL}/#organization` },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Início", item: `${SITE_URL}/` },
            { "@type": "ListItem", position: 2, name: "Blog", item: `${SITE_URL}/blog` },
          ],
        }),
      },
    ],
  }),
  component: BlogIndex,
});

function Meta({ post }: { post: PostWithAuthor }) {
  return (
    <div className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.2em] text-foreground/50">
      <span className="text-primary">{post.category}</span>
      <span className="h-[3px] w-[3px] rounded-full bg-foreground/25" />
      <span>{formatDate(post.published_at)}</span>
      <span className="h-[3px] w-[3px] rounded-full bg-foreground/25" />
      <span>{post.read_minutes} min</span>
    </div>
  );
}

function BlogIndex() {
  const posts = Route.useLoaderData();
  const [filtro, setFiltro] = useState<string>("Todos");

  const visiveis = useMemo(
    () => (filtro === "Todos" ? posts : posts.filter((p) => p.category === filtro)),
    [posts, filtro],
  );

  const destaque = filtro === "Todos" ? visiveis.find((p) => p.featured === 1) : undefined;
  const lista = destaque ? visiveis.filter((p) => p.id !== destaque.id) : visiveis;

  const usadas = ["Todos", ...CATEGORIES.filter((c) => posts.some((p) => p.category === c))];

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <section className="px-6 md:px-12 pt-40 md:pt-52 pb-16 md:pb-20">
        <div className="mx-auto max-w-[1500px]">
          <SectionLabel index="01" label="Blog" />
          <h1 className="mt-10 text-display text-[clamp(3rem,8vw,7rem)] text-foreground leading-[0.95]">
            Pensar antes
            <br />
            de <span className="italic font-serif font-normal text-primary">decidir.</span>
          </h1>
          <p className="mt-8 max-w-[620px] text-foreground/65 text-base md:text-lg leading-relaxed font-light">
            Textos sobre identidade executiva, arquitetura de decisão e o desconforto necessário do
            desenvolvimento. Sem motivação. Sem atalho.
          </p>
        </div>
      </section>

      {usadas.length > 1 && (
        <div className="px-6 md:px-12">
          <div className="mx-auto max-w-[1500px] border-y border-border/60 py-5 flex flex-wrap gap-2">
            {usadas.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setFiltro(c)}
                className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.16em] transition-colors ${
                  filtro === c
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-foreground/60 hover:border-foreground hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}

      {posts.length === 0 && (
        <section className="px-6 md:px-12 py-32">
          <div className="mx-auto max-w-[820px] text-center">
            <p className="text-foreground/50 text-sm uppercase tracking-[0.25em]">
              Em breve, os primeiros textos.
            </p>
          </div>
        </section>
      )}

      {destaque && (
        <section className="px-6 md:px-12 py-16 md:py-24 border-b border-border/60">
          <div className="mx-auto max-w-[1500px]">
            <Link
              to="/blog/$slug"
              params={{ slug: destaque.slug }}
              className="group grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 items-center"
            >
              <div className="md:col-span-7">
                <div className="aspect-[4/3] overflow-hidden bg-primary/10">
                  {destaque.cover_url ? (
                    <img
                      src={destaque.cover_url}
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      loading="eager"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-primary to-[color:var(--primary-deep)]" />
                  )}
                </div>
              </div>
              <div className="md:col-span-5">
                <Meta post={destaque} />
                <h2 className="mt-6 text-display text-[clamp(1.9rem,3.4vw,2.9rem)] leading-[1.08] text-foreground group-hover:text-primary transition-colors">
                  {destaque.title}
                </h2>
                <p className="mt-5 text-foreground/60 leading-relaxed font-light">{destaque.dek}</p>
                <span className="mt-8 inline-block border-b border-primary pb-1 text-[10px] uppercase tracking-[0.2em] text-primary">
                  Ler artigo →
                </span>
              </div>
            </Link>
          </div>
        </section>
      )}

      {lista.length > 0 && (
        <section className="px-6 md:px-12 py-16 md:py-24">
          <div className="mx-auto max-w-[1500px]">
            <SectionLabel index="02" label="Todos os artigos" />
            <div className="mt-12">
              {lista.map((p, i) => (
                <Link
                  key={p.id}
                  to="/blog/$slug"
                  params={{ slug: p.slug }}
                  className={`group grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-10 py-10 md:py-11 items-start transition-colors hover:bg-primary/[0.02] ${
                    i === lista.length - 1 ? "" : "border-b border-border/60"
                  }`}
                >
                  <div className="md:col-span-2 pt-1 text-xs text-foreground/45 tracking-wide">
                    {formatDate(p.published_at)}
                  </div>
                  <div className="md:col-span-8">
                    <span className="block text-[10px] uppercase tracking-[0.2em] text-primary">
                      {p.category}
                    </span>
                    <h3 className="mt-3 text-display text-2xl md:text-[1.65rem] leading-[1.2] text-foreground group-hover:text-primary transition-colors">
                      {p.title}
                    </h3>
                    <p className="mt-3 max-w-[560px] text-sm text-foreground/55 leading-relaxed font-light">
                      {p.dek}
                    </p>
                  </div>
                  <div className="md:col-span-2 md:text-right pt-1 text-[10px] uppercase tracking-[0.14em] text-foreground/45">
                    {p.read_minutes} min
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="bg-primary px-6 md:px-12 py-24 md:py-32 text-center">
        <div className="mx-auto max-w-[1100px]">
          <h2 className="text-display text-[clamp(2rem,4.2vw,3.4rem)] leading-[1.08] text-white">
            Desenvolvimento não é estilo.
            <br />É arquitetura.
          </h2>
          <p className="mx-auto mt-6 max-w-[520px] text-white/80 leading-relaxed font-light">
            Agende um diagnóstico e entenda onde sua liderança está travando o crescimento.
          </p>
          <a
            href="/#cta"
            className="mt-11 inline-block bg-white px-11 py-5 text-[11px] uppercase tracking-[0.22em] text-primary hover:bg-white/90 transition-colors"
          >
            Falar com a Korthex
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
