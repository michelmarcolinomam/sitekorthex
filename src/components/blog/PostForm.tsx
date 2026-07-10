import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { RichEditor } from "./RichEditor";
import { savePost, uploadImage, type PostInput } from "@/lib/blog-server";
import { CATEGORIES, slugify, type Author, type Post } from "@/lib/blog-types";

function Campo({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/55">{label}</span>
      {hint && <span className="mt-1 block text-xs text-foreground/40">{hint}</span>}
      <div className="mt-2">{children}</div>
    </label>
  );
}

const input =
  "w-full rounded-md border border-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary transition-colors";

export function PostForm({ post, authors }: { post: Post | null; authors: Author[] }) {
  const router = useRouter();
  const [salvando, setSalvando] = useState(false);
  const [enviandoCapa, setEnviandoCapa] = useState(false);
  const [erro, setErro] = useState("");
  const [slugTocado, setSlugTocado] = useState(Boolean(post?.slug));

  const [f, setF] = useState<PostInput>({
    id: post?.id,
    title: post?.title ?? "",
    slug: post?.slug ?? "",
    dek: post?.dek ?? "",
    body_html: post?.body_html ?? "",
    category: post?.category ?? CATEGORIES[0],
    tags: post?.tags ?? "",
    cover_url: post?.cover_url ?? "",
    og_image_url: post?.og_image_url ?? "",
    meta_desc: post?.meta_desc ?? "",
    author_id: post?.author_id || authors[0]?.id || "",
    status: post?.status ?? "draft",
    featured: post?.featured === 1,
    published_at: post?.published_at ?? null,
  });

  const set = <K extends keyof PostInput>(k: K, v: PostInput[K]) =>
    setF((prev) => ({ ...prev, [k]: v }));

  const onTitulo = (v: string) => {
    setF((prev) => ({ ...prev, title: v, slug: slugTocado ? prev.slug : slugify(v) }));
  };

  const enviarCapa = async (file: File) => {
    setEnviandoCapa(true);
    setErro("");
    try {
      const fd = new FormData();
      fd.set("file", file);
      const { url } = await uploadImage({ data: fd });
      set("cover_url", url);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha ao enviar a capa.");
    } finally {
      setEnviandoCapa(false);
    }
  };

  const salvar = async (status: "draft" | "published") => {
    setErro("");
    if (!f.title.trim()) return setErro("O título é obrigatório.");
    if (status === "published" && !f.body_html.trim()) {
      return setErro("Escreva o corpo do texto antes de publicar.");
    }

    setSalvando(true);
    try {
      await savePost({ data: { ...f, status } });
      void router.navigate({ to: "/admin" });
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível salvar.");
      setSalvando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
      {/* Coluna principal */}
      <div className="space-y-7 lg:col-span-8">
        <Campo label="Título">
          <input
            className={`${input} text-lg font-semibold`}
            value={f.title}
            onChange={(e) => onTitulo(e.target.value)}
            placeholder="O fundador que virou gargalo da própria empresa"
          />
        </Campo>

        <Campo label="Subtítulo" hint="Uma ou duas frases. Aparece na lista e no topo do post.">
          <textarea
            className={`${input} min-h-[90px] resize-y leading-relaxed`}
            value={f.dek}
            onChange={(e) => set("dek", e.target.value)}
          />
        </Campo>

        <Campo label="Texto">
          <RichEditor value={f.body_html} onChange={(html) => set("body_html", html)} />
        </Campo>
      </div>

      {/* Coluna lateral */}
      <aside className="space-y-7 lg:col-span-4">
        <div className="space-y-5 rounded-md border border-border bg-background p-6">
          <Campo label="Categoria">
            <select
              className={input}
              value={f.category}
              onChange={(e) => set("category", e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Autor">
            <select
              className={input}
              value={f.author_id}
              onChange={(e) => set("author_id", e.target.value)}
            >
              {authors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Campo>

          <Campo label="Tags" hint="Separadas por vírgula.">
            <input
              className={input}
              value={f.tags}
              onChange={(e) => set("tags", e.target.value)}
              placeholder="fundador, escala, decisão"
            />
          </Campo>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={f.featured}
              onChange={(e) => set("featured", e.target.checked)}
              className="h-4 w-4 accent-[color:var(--primary)]"
            />
            <span className="text-sm text-foreground/70">Fixar como destaque</span>
          </label>
        </div>

        <div className="space-y-4 rounded-md border border-border bg-background p-6">
          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/55">
            Imagem de capa
          </span>

          {f.cover_url ? (
            <div className="space-y-3">
              <img src={f.cover_url} alt="" className="aspect-[16/9] w-full rounded object-cover" />
              <button
                type="button"
                onClick={() => set("cover_url", "")}
                className="text-[10px] uppercase tracking-[0.16em] text-foreground/45 hover:text-destructive"
              >
                Remover
              </button>
            </div>
          ) : (
            <label className="grid aspect-[16/9] cursor-pointer place-items-center rounded border border-dashed border-border text-xs text-foreground/45 hover:border-primary hover:text-primary transition-colors">
              {enviandoCapa ? "Enviando…" : "Escolher arquivo"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={enviandoCapa}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void enviarCapa(file);
                  e.target.value = "";
                }}
              />
            </label>
          )}
        </div>

        <details className="rounded-md border border-border bg-background p-6">
          <summary className="cursor-pointer text-[10px] uppercase tracking-[0.2em] text-foreground/55">
            SEO (opcional)
          </summary>
          <div className="mt-5 space-y-5">
            <Campo label="Endereço do post" hint="Aparece na URL. Gerado do título.">
              <input
                className={`${input} font-mono text-xs`}
                value={f.slug}
                onChange={(e) => {
                  setSlugTocado(true);
                  set("slug", e.target.value);
                }}
              />
            </Campo>
            <Campo label="Descrição no Google" hint="Se vazio, usa o subtítulo.">
              <textarea
                className={`${input} min-h-[80px] resize-y`}
                value={f.meta_desc}
                onChange={(e) => set("meta_desc", e.target.value)}
              />
            </Campo>
            <Campo label="Imagem de compartilhamento" hint="Se vazio, usa a capa.">
              <input
                className={`${input} text-xs`}
                value={f.og_image_url}
                onChange={(e) => set("og_image_url", e.target.value)}
                placeholder="https://…"
              />
            </Campo>
          </div>
        </details>

        {erro && (
          <p className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {erro}
          </p>
        )}

        <div className="sticky bottom-6 space-y-3">
          <button
            type="button"
            disabled={salvando}
            onClick={() => void salvar("published")}
            className="w-full rounded-full bg-primary py-4 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {salvando ? "Salvando…" : "Publicar"}
          </button>
          <button
            type="button"
            disabled={salvando}
            onClick={() => void salvar("draft")}
            className="w-full rounded-full border border-border bg-background py-4 text-[11px] uppercase tracking-[0.2em] text-foreground/70 hover:border-foreground disabled:opacity-50 transition-colors"
          >
            Salvar rascunho
          </button>
        </div>
      </aside>
    </div>
  );
}
