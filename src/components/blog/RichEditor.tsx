import { useEffect, useRef, useState } from "react";
import { uploadImage } from "@/lib/blog-server";

/**
 * Editor rich text mínimo, sem dependências.
 * Usa contentEditable + document.execCommand — depreciado, porém universalmente
 * suportado e suficiente para o escopo (negrito, itálico, H2/H3, listas, citação,
 * link e imagem). O HTML gerado é normalizado antes de sair daqui e sanitizado
 * novamente na renderização (sanitizeHtml).
 */

type Cmd = { label: string; title: string; run: () => void; active?: string };

/**
 * O contentEditable do Chrome cria <div> ao pressionar Enter e <b> em vez de
 * <strong>. Como <div> não está na allowlist do sanitizeHtml, os parágrafos
 * eram achatados e o texto colava. Aqui convertemos para o HTML que queremos.
 */
function normalize(root: HTMLElement): string {
  const doc = root.ownerDocument;
  const tmp = doc.createElement("div");
  tmp.innerHTML = root.innerHTML;

  // <div> solto vira <p>. Preserva <div> internos a listas/figuras trocando também.
  tmp.querySelectorAll("div").forEach((div) => {
    const p = doc.createElement("p");
    p.innerHTML = div.innerHTML;
    div.replaceWith(p);
  });

  // <b>/<i> herdados do execCommand → <strong>/<em>.
  tmp.querySelectorAll("b").forEach((b) => {
    const s = doc.createElement("strong");
    s.innerHTML = b.innerHTML;
    b.replaceWith(s);
  });
  tmp.querySelectorAll("i").forEach((i) => {
    const em = doc.createElement("em");
    em.innerHTML = i.innerHTML;
    i.replaceWith(em);
  });

  // Um <strong>/<em> que envolve TODO o conteúdo de um bloco é herança de estado
  // do contentEditable (o "bold ao iniciar"), não intenção do autor. Desembrulha
  // em headings E parágrafos — negrito real fica em trechos, não no bloco inteiro.
  tmp.querySelectorAll("h2, h3, h4, p, li, blockquote").forEach((bloco) => {
    let only = bloco.children.length === 1 ? bloco.firstElementChild : null;
    while (
      only &&
      (only.tagName === "STRONG" || only.tagName === "EM") &&
      only.textContent === bloco.textContent
    ) {
      bloco.innerHTML = only.innerHTML;
      only = bloco.children.length === 1 ? bloco.firstElementChild : null;
    }
  });

  // Remove atributos de estilo que o navegador injeta.
  tmp.querySelectorAll("[style], [class], [id]").forEach((el) => {
    el.removeAttribute("style");
    el.removeAttribute("class");
    el.removeAttribute("id");
  });

  // Parágrafos vazios no fim (o <p><br></p> que o Enter deixa).
  tmp.querySelectorAll("p").forEach((p) => {
    if (!p.textContent?.trim() && !p.querySelector("img")) p.remove();
  });

  return tmp.innerHTML;
}

export function RichEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [, force] = useState(0);

  // Faz o Enter criar <p> em vez de <div>. Precisa rodar antes da primeira edição.
  useEffect(() => {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {
      /* navegador não suporta — normalize() cobre o caso */
    }
  }, []);

  // Semeia o conteúdo inicial. Um <p> vazio garante que o primeiro Enter já
  // tenha um bloco pai, evitando texto solto na raiz.
  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    if (el.innerHTML !== value) {
      el.innerHTML = value || "<p><br></p>";
    }
  }, [value]);

  const emit = () => {
    if (ref.current) onChange(normalize(ref.current));
    force((n) => n + 1);
  };

  const exec = (cmd: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    emit();
  };

  const isOn = (cmd: string) => {
    try {
      return document.queryCommandState(cmd);
    } catch {
      return false;
    }
  };

  /**
   * Antes de virar heading ou citação, zera a formatação inline da seleção.
   * Sem isso, um <b> ativo é preservado dentro do <h2>.
   */
  const bloco = (tag: string) => {
    ref.current?.focus();
    document.execCommand("removeFormat", false);
    document.execCommand("formatBlock", false, tag);
    emit();
  };

  const insertLink = () => {
    const url = window.prompt("URL do link:");
    if (url) exec("createLink", url);
  };

  const insertImage = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set("file", file);
      const { url } = await uploadImage({ data: fd });
      exec("insertHTML", `<figure><img src="${url}" alt="" /></figure><p><br/></p>`);
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Falha ao enviar a imagem.");
    } finally {
      setUploading(false);
    }
  };

  const cmds: Cmd[] = [
    { label: "B", title: "Negrito", run: () => exec("bold"), active: "bold" },
    { label: "I", title: "Itálico", run: () => exec("italic"), active: "italic" },
    { label: "H2", title: "Título", run: () => bloco("<h2>") },
    { label: "H3", title: "Subtítulo", run: () => bloco("<h3>") },
    { label: "¶", title: "Parágrafo", run: () => bloco("<p>") },
    { label: "“”", title: "Citação", run: () => bloco("<blockquote>") },
    { label: "•", title: "Lista", run: () => exec("insertUnorderedList") },
    { label: "1.", title: "Lista numerada", run: () => exec("insertOrderedList") },
    { label: "🔗", title: "Link", run: insertLink },
    { label: "⟲", title: "Desfazer", run: () => exec("undo") },
    { label: "✕", title: "Limpar formatação", run: () => exec("removeFormat") },
  ];

  return (
    <div className="rounded-md border border-border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        {cmds.map((c) => (
          <button
            key={c.label}
            type="button"
            title={c.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={c.run}
            className={`min-w-[34px] rounded px-2 py-1.5 text-xs transition-colors ${
              c.active && isOn(c.active)
                ? "bg-primary text-white"
                : "text-foreground/70 hover:bg-[color:var(--surface)]"
            }`}
          >
            {c.label}
          </button>
        ))}

        <label className="ml-auto cursor-pointer rounded px-3 py-1.5 text-xs text-foreground/70 hover:bg-[color:var(--surface)]">
          {uploading ? "Enviando…" : "🖼 Inserir imagem"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void insertImage(f);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => {
          // Mata o "bold ao iniciar": o contentEditable herda estado de formatação
          // e aplica <b> ao primeiro texto digitado num editor vazio. Se qualquer
          // comando inline estiver ativo sem seleção, desliga antes da digitação.
          try {
            const sel = window.getSelection();
            const vazio = !ref.current?.textContent?.trim();
            if (vazio && sel?.isCollapsed) {
              if (document.queryCommandState("bold")) document.execCommand("bold");
              if (document.queryCommandState("italic")) document.execCommand("italic");
              if (document.queryCommandState("underline")) document.execCommand("underline");
            }
          } catch {
            /* navegador sem queryCommandState — normalize() cobre */
          }
        }}
        onInput={emit}
        onBlur={emit}
        onPaste={(e) => {
          // Cola como texto puro — evita trazer estilos do Word/Docs.
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          emit();
        }}
        className="blog-body min-h-[460px] px-6 py-6 outline-none"
        data-placeholder="Escreva aqui…"
      />
    </div>
  );
}
