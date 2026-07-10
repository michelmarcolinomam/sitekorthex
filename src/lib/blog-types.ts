// Tipos e utilidades compartilhadas do blog.
// Este arquivo roda tanto no servidor quanto no cliente — não importe nada do Worker aqui.

export const SITE_URL = "https://korthex.com.br";

export const CATEGORIES = [
  "Identidade Executiva",
  "Liderança",
  "Decisão",
  "Sucessão",
  "Cultura",
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface Author {
  id: string;
  name: string;
  role: string;
  bio: string;
  avatar_url: string;
}

export interface Post {
  id: string;
  slug: string;
  title: string;
  dek: string;
  body_html: string;
  category: string;
  tags: string;
  cover_url: string;
  og_image_url: string;
  meta_desc: string;
  author_id: string;
  status: "draft" | "published";
  featured: number;
  read_minutes: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostWithAuthor extends Post {
  author_name: string;
  author_role: string;
  author_bio: string;
  author_avatar: string;
}

/** Gera slug a partir do título: acentos removidos, minúsculas, hífens. */
export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** Estimativa de leitura a partir do HTML do corpo (200 palavras/min). */
export function readMinutes(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

/** 12 Jul 2026 */
export function formatDate(iso: string | null): string {
  if (!iso) return "";
  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return `${String(d.getUTCDate()).padStart(2, "0")} ${meses[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

export function tagList(tags: string): string[] {
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}

/**
 * Sanitiza o HTML vindo do editor antes de renderizar.
 * O painel é protegido por Cloudflare Access, mas nunca confiamos
 * cegamente em HTML armazenado — defesa em profundidade.
 */
const ALLOWED_TAGS =
  /^(p|br|strong|em|b|i|u|h2|h3|h4|ul|ol|li|blockquote|a|img|figure|figcaption|hr|code|pre)$/i;

export function sanitizeHtml(html: string): string {
  return (
    html
      // remove script/style/iframe/object e conteúdo
      .replace(/<(script|style|iframe|object|embed|form)[\s\S]*?<\/\1>/gi, "")
      .replace(/<(script|style|iframe|object|embed|form)\b[^>]*\/?>/gi, "")
      // remove handlers inline (onclick, onerror, ...)
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "")
      // remove javascript: em href/src
      .replace(/(href|src)\s*=\s*("|')\s*javascript:[^"']*\2/gi, '$1="#"')
      // <div> do contentEditable vira <p>: descartá-lo achataria os parágrafos.
      .replace(/<div\b[^>]*>/gi, "<p>")
      .replace(/<\/div>/gi, "</p>")
      // remove tags não permitidas, preservando o texto interno
      .replace(/<\/?([a-zA-Z0-9]+)\b[^>]*>/g, (match, tag: string) =>
        ALLOWED_TAGS.test(tag) ? match : "",
      )
  );
}
