import { createServerFn } from "@tanstack/react-start";
import { env } from "cloudflare:workers";
import { requireAdmin } from "./access-auth";
import {
  readMinutes,
  slugify,
  type Author,
  type Post,
  type PostWithAuthor,
} from "./blog-types";

// Bindings declarados em wrangler.jsonc
interface Env {
  BLOG_DB: D1Database;
  BLOG_MEDIA: R2Bucket;
  MEDIA_PUBLIC_URL: string;
}

function db(): D1Database {
  return (env as unknown as Env).BLOG_DB;
}

const SELECT_WITH_AUTHOR = `
  SELECT p.*,
         COALESCE(a.name, '')       AS author_name,
         COALESCE(a.role, '')       AS author_role,
         COALESCE(a.bio, '')        AS author_bio,
         COALESCE(a.avatar_url, '') AS author_avatar
  FROM posts p
  LEFT JOIN authors a ON a.id = p.author_id
`;

/* ────────────────────────  LEITURA (público)  ──────────────────────── */

/** Posts publicados, mais recentes primeiro. */
export const listPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<PostWithAuthor[]> => {
    const { results } = await db()
      .prepare(
        `${SELECT_WITH_AUTHOR}
         WHERE p.status = 'published'
         ORDER BY p.featured DESC, p.published_at DESC`,
      )
      .all<PostWithAuthor>();
    return results ?? [];
  },
);

/** Um post publicado pelo slug. Retorna null se não existir. */
export const getPost = createServerFn({ method: "GET" })
  .inputValidator((slug: string) => slug)
  .handler(async ({ data: slug }): Promise<PostWithAuthor | null> => {
    const row = await db()
      .prepare(`${SELECT_WITH_AUTHOR} WHERE p.slug = ?1 AND p.status = 'published'`)
      .bind(slug)
      .first<PostWithAuthor>();
    return row ?? null;
  });

/** Até 3 posts relacionados (mesma categoria, excluindo o atual). */
export const getRelated = createServerFn({ method: "GET" })
  .inputValidator((input: { slug: string; category: string }) => input)
  .handler(async ({ data }): Promise<PostWithAuthor[]> => {
    const { results } = await db()
      .prepare(
        `${SELECT_WITH_AUTHOR}
         WHERE p.status = 'published' AND p.slug != ?1
         ORDER BY CASE WHEN p.category = ?2 THEN 0 ELSE 1 END,
                  p.published_at DESC
         LIMIT 3`,
      )
      .bind(data.slug, data.category)
      .all<PostWithAuthor>();
    return results ?? [];
  });

/* ────────────────────────  ADMIN (atrás do Access)  ──────────────────────── */

/** Todos os posts, inclusive rascunhos. */
export const adminListPosts = createServerFn({ method: "GET" }).handler(
  async (): Promise<Post[]> => {
    const { results } = await db()
      .prepare(`SELECT * FROM posts ORDER BY updated_at DESC`)
      .all<Post>();
    return results ?? [];
  },
);

export const adminGetPost = createServerFn({ method: "GET" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<Post | null> => {
    const row = await db().prepare(`SELECT * FROM posts WHERE id = ?1`).bind(id).first<Post>();
    return row ?? null;
  });

export const listAuthors = createServerFn({ method: "GET" }).handler(
  async (): Promise<Author[]> => {
    const { results } = await db().prepare(`SELECT * FROM authors ORDER BY name`).all<Author>();
    return results ?? [];
  },
);

export interface PostInput {
  id?: string;
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
  featured: boolean;
  published_at: string | null;
}

/** Cria ou atualiza um post. Retorna o id. */
export const savePost = createServerFn({ method: "POST" })
  .inputValidator((p: PostInput) => p)
  .handler(async ({ data: p }): Promise<{ id: string; slug: string }> => {
    await requireAdmin();

    const now = new Date().toISOString();
    const id = p.id || crypto.randomUUID();
    const slug = slugify(p.slug || p.title);
    const mins = readMinutes(p.body_html);

    // Quando publica pela primeira vez sem data, carimba agora.
    const publishedAt =
      p.status === "published" ? (p.published_at || now) : (p.published_at || null);

    const exists = p.id
      ? await db().prepare(`SELECT id FROM posts WHERE id = ?1`).bind(p.id).first()
      : null;

    if (exists) {
      await db()
        .prepare(
          `UPDATE posts SET
             slug=?2, title=?3, dek=?4, body_html=?5, category=?6, tags=?7,
             cover_url=?8, og_image_url=?9, meta_desc=?10, author_id=?11,
             status=?12, featured=?13, read_minutes=?14, published_at=?15, updated_at=?16
           WHERE id=?1`,
        )
        .bind(
          id, slug, p.title, p.dek, p.body_html, p.category, p.tags,
          p.cover_url, p.og_image_url, p.meta_desc, p.author_id,
          p.status, p.featured ? 1 : 0, mins, publishedAt, now,
        )
        .run();
    } else {
      await db()
        .prepare(
          `INSERT INTO posts
             (id, slug, title, dek, body_html, category, tags, cover_url, og_image_url,
              meta_desc, author_id, status, featured, read_minutes, published_at,
              created_at, updated_at)
           VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?16)`,
        )
        .bind(
          id, slug, p.title, p.dek, p.body_html, p.category, p.tags,
          p.cover_url, p.og_image_url, p.meta_desc, p.author_id,
          p.status, p.featured ? 1 : 0, mins, publishedAt, now,
        )
        .run();
    }

    return { id, slug };
  });

export const deletePost = createServerFn({ method: "POST" })
  .inputValidator((id: string) => id)
  .handler(async ({ data: id }): Promise<{ ok: true }> => {
    await requireAdmin();

    await db().prepare(`DELETE FROM posts WHERE id = ?1`).bind(id).run();
    return { ok: true };
  });

/* ────────────────────────  UPLOAD DE IMAGEM (R2)  ──────────────────────── */

export const uploadImage = createServerFn({ method: "POST" })
  .inputValidator((data: FormData) => data)
  .handler(async ({ data }): Promise<{ url: string }> => {
    await requireAdmin();

    const file = data.get("file");
    if (!(file instanceof File)) throw new Error("Arquivo ausente.");

    const MAX = 8 * 1024 * 1024;
    if (file.size > MAX) throw new Error("Imagem acima de 8 MB.");

    const okTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!okTypes.includes(file.type)) throw new Error("Formato não suportado.");

    const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `blog/${new Date().getUTCFullYear()}/${crypto.randomUUID()}.${ext}`;

    const e = env as unknown as Env;
    await e.BLOG_MEDIA.put(key, await file.arrayBuffer(), {
      httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    });

    const base = e.MEDIA_PUBLIC_URL.replace(/\/+$/, "");
    return { url: `${base}/${key}` };
  });
