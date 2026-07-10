import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { adminGetPost, listAuthors } from "@/lib/blog-server";
import { PostForm } from "@/components/blog/PostForm";
import { KorthexLogo } from "@/components/blog/Chrome";

export const Route = createFileRoute("/admin/$id")({
  loader: async ({ params }) => {
    const [post, authors] = await Promise.all([adminGetPost({ data: params.id }), listAuthors()]);
    if (!post) throw notFound();
    return { post, authors };
  },
  head: () => ({
    meta: [{ title: "Editar post — Korthex" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: EditarPost,
});

function EditarPost() {
  const { post, authors } = Route.useLoaderData();

  return (
    <div className="min-h-screen bg-[color:var(--surface)]">
      <header className="border-b border-border bg-background">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 py-6">
          <Link to="/admin" className="flex items-center gap-4 text-foreground">
            <KorthexLogo className="h-6 w-auto" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/45">
              ← Painel
            </span>
          </Link>
          <span className="truncate pl-6 text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            {post.status === "published" ? "Publicado" : "Rascunho"}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-12">
        <PostForm post={post} authors={authors} />
      </main>
    </div>
  );
}
