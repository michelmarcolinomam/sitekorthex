import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Header, Footer, SectionLabel } from "@/components/blog/Chrome";
import { getPost, getRelated } from "@/lib/blog-server";
import { SITE_URL, formatDate, sanitizeHtml, tagList } from "@/lib/blog-types";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params }) => {
    const post = await getPost({ data: params.slug });
    if (!post) throw notFound();
    const related = await getRelated({ data: { slug: post.slug, category: post.category } });
    return { post, related };
  },

  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { post } = loaderData;
    const url = `${SITE_URL}/blog/${post.slug}`;
    const desc = post.meta_desc || post.dek;
    const img = post.og_image_url || post.cover_url || `${SITE_URL}/assets/og-korthex.jpg`;

    return {
      meta: [
        { title: `${post.title} — Korthex` },
        { name: "description", content: desc },
        { name: "author", content: post.author_name || "Korthex" },
        { property: "og:title", content: post.title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:image", content: img },
        { property: "article:published_time", content: post.published_at ?? "" },
        { property: "article:modified_time", content: post.updated_at },
        { property: "article:section", content: post.category },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: post.title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "@id": `${url}#article`,
            headline: post.title,
            description: desc,
            image: [img],
            datePublished: post.published_at,
            dateModified: post.updated_at,
            inLanguage: "pt-BR",
            articleSection: post.category,
            keywords: tagList(post.tags).join(", "),
            author: {
              "@type": "Person",
              name: post.author_name || "Korthex",
              jobTitle: post.author_role || undefined,
            },
            publisher: { "@id": `${SITE_URL}/#organization` },
            mainEntityOfPage: { "@type": "WebPage", "@id": url },
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
              { "@type": "ListItem", position: 3, name: post.title, item: url },
            ],
          }),
        },
      ],
    };
  },

  component: PostPage,
});

function PostPage() {
  const { post, related } = Route.useLoaderData();
  const tags = tagList(post.tags);
  const url = `${SITE_URL}/blog/${post.slug}`;

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <article>
        <header className="px-6 md:px-12 pt-36 md:pt-44">
          <div className="mx-auto max-w-[820px]">
            <nav className="text-[10px] uppercase tracking-[0.2em] text-foreground/45">
              <Link to="/blog" className="text-primary hover:underline">
                Blog
              </Link>
              <span className="mx-3">/</span>
              <span>{post.category}</span>
            </nav>

            <h1 className="mt-10 text-display text-[clamp(2.2rem,5vw,3.9rem)] leading-[1.05] text-foreground">
              {post.title}
            </h1>

            {post.dek && (
              <p className="mt-7 text-lg md:text-xl text-foreground/60 leading-relaxed font-light">
                {post.dek}
              </p>
            )}

            <div className="mt-11 flex items-center gap-4 border-y border-border/60 py-6">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-[color:var(--primary-deep)]">
                {post.author_avatar && (
                  <img src={post.author_avatar} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{post.author_name}</p>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-foreground/50">
                  {formatDate(post.published_at)} · {post.read_minutes} min de leitura
                </p>
              </div>
              <div className="ml-auto flex gap-2">
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Compartilhar no LinkedIn"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground/55 hover:border-primary hover:text-primary transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
                  </svg>
                </a>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${post.title} — ${url}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Compartilhar no WhatsApp"
                  className="grid h-9 w-9 place-items-center rounded-full border border-border text-foreground/55 hover:border-primary hover:text-primary transition-colors"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M.06 24l1.69-6.16a11.87 11.87 0 0 1-1.59-5.95C.16 5.34 5.5 0 12.06 0a11.82 11.82 0 0 1 8.41 3.49 11.82 11.82 0 0 1 3.48 8.41c0 6.56-5.34 11.9-11.9 11.9a11.9 11.9 0 0 1-5.69-1.45L.06 24zM6.6 20.13c1.68.99 3.28 1.59 5.45 1.59 5.45 0 9.89-4.43 9.89-9.88a9.83 9.83 0 0 0-2.9-7A9.82 9.82 0 0 0 12.06 1.99c-5.46 0-9.9 4.43-9.9 9.89 0 2.22.65 3.89 1.74 5.63l-1 3.65 3.7-1.03z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </header>

        {post.cover_url && (
          <div className="px-6 md:px-12 mt-14">
            <div className="mx-auto max-w-[1100px]">
              <div className="aspect-[16/8] overflow-hidden">
                <img src={post.cover_url} alt="" className="h-full w-full object-cover" />
              </div>
            </div>
          </div>
        )}

        <div className="px-6 md:px-12 py-16 md:py-20">
          <div
            className="mx-auto max-w-[820px] blog-body"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(post.body_html) }}
          />

          {tags.length > 0 && (
            <div className="mx-auto mt-14 max-w-[820px] border-t border-border/60 pt-10 flex flex-wrap items-center gap-2">
              <span className="mr-3 text-[10px] uppercase tracking-[0.24em] text-foreground/45">
                Tags
              </span>
              {tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[color:var(--surface)] px-4 py-2 text-[10px] uppercase tracking-[0.1em] text-foreground/55"
                >
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        {post.author_bio && (
          <div className="px-6 md:px-12 pb-24">
            <div className="mx-auto max-w-[820px] flex flex-col md:flex-row gap-7 border border-border/60 bg-[color:var(--surface)] p-8 md:p-11">
              <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary to-[color:var(--primary-deep)]">
                {post.author_avatar && (
                  <img src={post.author_avatar} alt="" className="h-full w-full object-cover" />
                )}
              </div>
              <div>
                <h4 className="text-base font-semibold text-foreground">{post.author_name}</h4>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-primary">
                  {post.author_role}
                </p>
                <p className="mt-4 text-sm text-foreground/60 leading-relaxed font-light">
                  {post.author_bio}
                </p>
              </div>
            </div>
          </div>
        )}
      </article>

      {related.length > 0 && (
        <section className="bg-[color:var(--surface)] border-t border-border/60 px-6 md:px-12 py-20 md:py-24">
          <div className="mx-auto max-w-[1500px]">
            <SectionLabel index="03" label="Continue lendo" />
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to="/blog/$slug"
                  params={{ slug: r.slug }}
                  className="group border border-border bg-background p-8 transition-all hover:-translate-y-0.5 hover:border-primary"
                >
                  <span className="block text-[10px] uppercase tracking-[0.2em] text-primary">
                    {r.category}
                  </span>
                  <h4 className="mt-4 text-display text-lg leading-[1.28] text-foreground group-hover:text-primary transition-colors">
                    {r.title}
                  </h4>
                  <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-foreground/45">
                    {r.read_minutes} min
                  </p>
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
