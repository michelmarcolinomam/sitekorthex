import { createFileRoute, Link } from "@tanstack/react-router";
import { listAuthors } from "@/lib/blog-server";
import { PostForm } from "@/components/blog/PostForm";
import { KorthexLogo } from "@/components/blog/Chrome";

export const Route = createFileRoute("/admin/novo")({
  loader: () => listAuthors(),
  head: () => ({
    meta: [{ title: "Novo post — Korthex" }, { name: "robots", content: "noindex, nofollow" }],
  }),
  component: NovoPost,
});

function NovoPost() {
  const authors = Route.useLoaderData();

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
          <span className="text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            Novo post
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-6 py-12">
        <PostForm post={null} authors={authors} />
      </main>
    </div>
  );
}
