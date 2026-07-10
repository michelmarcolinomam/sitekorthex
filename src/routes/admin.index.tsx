import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { adminListPosts, deletePost } from "@/lib/blog-server";
import { KorthexLogo } from "@/components/blog/Chrome";
import { formatDate } from "@/lib/blog-types";

export const Route = createFileRoute("/admin/")({
  loader: () => adminListPosts(),
  head: () => ({
    meta: [{ title: "Painel — Korthex" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: AdminList,
});

function AdminList() {
  const posts = Route.useLoaderData();
  const router = useRouter();

  const remover = async (id: string, title: string) => {
    if (!window.confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    await deletePost({ data: id });
    void router.invalidate();
  };

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1100px] items-center justify-between px-6 py-6">
          <div className="flex items-center gap-4 text-foreground">
            <KorthexLogo className="h-6 w-auto" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">
              Painel
            </span>
          </div>
          <Link
            to="/admin/novo"
            className="rounded-full bg-primary px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-white hover:bg-primary/90 transition-colors"
          >
            Novo post
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-[1100px] px-6 py-12">
        {posts.length === 0 ? (
          <div className="rounded-md border border-dashed border-border bg-background py-24 text-center">
            <p className="text-sm text-foreground/50">Nenhum post ainda.</p>
            <Link
              to="/admin/novo"
              className="mt-6 inline-block text-[11px] uppercase tracking-[0.2em] text-primary hover:underline"
            >
              Escrever o primeiro →
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-md border border-border bg-background">
            {posts.map((p, i) => (
              <div
                key={p.id}
                className={`flex flex-col gap-3 px-6 py-5 md:flex-row md:items-center md:gap-6 ${
                  i === posts.length - 1 ? "" : "border-b border-border"
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.16em] ${
                        p.status === "published"
                          ? "bg-primary/10 text-primary"
                          : "bg-foreground/8 text-foreground/50"
                      }`}
                    >
                      {p.status === "published" ? "Publicado" : "Rascunho"}
                    </span>
                    {p.featured === 1 && (
                      <span className="text-[9px] uppercase tracking-[0.16em] text-foreground/40">
                        Destaque
                      </span>
                    )}
                  </div>
                  <h2 className="mt-2 truncate text-base font-semibold text-foreground">
                    {p.title || "(sem título)"}
                  </h2>
                  <p className="mt-1 text-xs text-foreground/45">
                    {p.category || "Sem categoria"}
                    {p.published_at ? ` · ${formatDate(p.published_at)}` : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-4">
                  {p.status === "published" && (
                    <a
                      href={`/blog/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] uppercase tracking-[0.16em] text-foreground/50 hover:text-primary"
                    >
                      Ver
                    </a>
                  )}
                  <Link
                    to="/admin/$id"
                    params={{ id: p.id }}
                    className="text-[10px] uppercase tracking-[0.16em] text-primary hover:underline"
                  >
                    Editar
                  </Link>
                  <button
                    type="button"
                    onClick={() => void remover(p.id, p.title)}
                    className="text-[10px] uppercase tracking-[0.16em] text-foreground/40 hover:text-destructive"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
