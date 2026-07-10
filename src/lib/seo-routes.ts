/**
 * Rotas de SEO servidas diretamente pelo Worker, antes do roteador React.
 * Chamado de src/server.ts. Retorna null quando o path não é um dos dois.
 */

const SITE_URL = "https://korthex.com.br";

interface Env {
  BLOG_DB?: D1Database;
}

const ESTATICAS = [
  { loc: "/", priority: "1.0", changefreq: "monthly" },
  { loc: "/manifesto", priority: "0.8", changefreq: "yearly" },
  { loc: "/metodo", priority: "0.8", changefreq: "yearly" },
  { loc: "/lideranca", priority: "0.8", changefreq: "yearly" },
  { loc: "/korthex-executivo", priority: "0.8", changefreq: "yearly" },
  { loc: "/performance", priority: "0.8", changefreq: "yearly" },
  { loc: "/blog", priority: "0.9", changefreq: "weekly" },
];

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const ROBOTS = [
  "User-agent: *",
  "Allow: /",
  "Disallow: /admin",
  "",
  `Sitemap: ${SITE_URL}/sitemap.xml`,
  "",
].join("\n");

export async function handleSeoRoute(request: Request, env: unknown): Promise<Response | null> {
  const { pathname } = new URL(request.url);

  if (pathname === "/robots.txt") {
    return new Response(ROBOTS, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "public, max-age=86400",
      },
    });
  }

  if (pathname !== "/sitemap.xml") return null;

  const hoje = new Date().toISOString().slice(0, 10);
  const partes = ESTATICAS.map(
    (p) =>
      `<url><loc>${SITE_URL}${p.loc}</loc><lastmod>${hoje}</lastmod>` +
      `<changefreq>${p.changefreq}</changefreq><priority>${p.priority}</priority></url>`,
  );

  // Se o D1 falhar, ainda servimos as páginas estáticas — nunca um 500 no sitemap.
  try {
    const db = (env as Env)?.BLOG_DB;
    if (db) {
      const { results } = await db
        .prepare(
          `SELECT slug, updated_at FROM posts
           WHERE status = 'published'
           ORDER BY published_at DESC`,
        )
        .all<{ slug: string; updated_at: string }>();

      for (const p of results ?? []) {
        partes.push(
          `<url><loc>${SITE_URL}/blog/${esc(p.slug)}</loc>` +
            `<lastmod>${p.updated_at.slice(0, 10)}</lastmod>` +
            `<changefreq>monthly</changefreq><priority>0.7</priority></url>`,
        );
      }
    }
  } catch (error) {
    console.error("sitemap: falha ao ler posts do D1", error);
  }

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${partes.join("")}</urlset>`;

  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
