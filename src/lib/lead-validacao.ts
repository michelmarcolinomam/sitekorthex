/**
 * Validação do cadastro do responsável (o lead).
 *
 * Este cadastro é o preço do diagnóstico: a empresa recebe a avaliação e a
 * Korthex recebe um contato real. Por isso a régua é dura e mora AQUI, não na
 * tela — o mesmo módulo roda no servidor (onde é lei) e no navegador (onde
 * vira aviso na hora de digitar).
 */

export interface ResultadoValidacao {
  ok: boolean;
  /** Mensagem por campo, para destacar o input certo. */
  erros: Partial<Record<"nome" | "cargo" | "email" | "telefone", string>>;
  /** Valores limpos e padronizados, prontos para gravar. */
  limpo: { nome: string; cargo: string; email: string; telefone: string };
}

/** DDDs que existem de verdade no Brasil. */
const DDDS = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19,
  21, 22, 24, 27, 28,
  31, 32, 33, 34, 35, 37, 38,
  41, 42, 43, 44, 45, 46, 47, 48, 49,
  51, 53, 54, 55,
  61, 62, 63, 64, 65, 66, 67, 68, 69,
  71, 73, 74, 75, 77, 79,
  81, 82, 83, 84, 85, 86, 87, 88, 89,
  91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Caixas descartáveis — o oposto de um lead. */
const DOMINIOS_DESCARTAVEIS = new Set([
  "mailinator.com", "yopmail.com", "tempmail.com", "temp-mail.org",
  "guerrillamail.com", "10minutemail.com", "trashmail.com", "sharklasers.com",
  "getnada.com", "dispostable.com", "maildrop.cc", "fakeinbox.com",
  "throwawaymail.com", "mailnesia.com", "spamgourmet.com", "mytemp.email",
  "emailtemporario.com.br", "cortaemail.com.br", "descartavel.com",
]);

const SO_LETRAS = /^[\p{L}][\p{L}'.-]*$/u;

/** Sequências de teclado e palavras de teste que aparecem quando é migué. */
const MIGUE = new Set([
  "asd", "asdf", "asdfg", "sdf", "dfg", "qwe", "qwer", "qwerty", "wer", "ert",
  "zxc", "zxcv", "xcv", "jkl", "hjk", "poi", "lkj", "abc", "abcd",
  "teste", "testes", "test", "tester", "fulano", "beltrano", "sicrano",
  "ninguem", "ninguém", "nada", "aaa", "xxx", "zzz",
]);

/** Partículas que ficam minúsculas no meio do nome. */
const PARTICULAS = new Set(["de", "da", "do", "das", "dos", "e", "di", "del", "van", "von"]);

const VOGAIS = /[aeiouáàâãéêíóôõúü]/i;

function tituloNome(v: string): string {
  return v
    .split(" ")
    .map((p, i) => {
      const b = p.toLowerCase();
      if (i > 0 && PARTICULAS.has(b)) return b;
      return b.charAt(0).toUpperCase() + b.slice(1);
    })
    .join(" ");
}

/** Nome tem que ter nome e sobrenome de gente, não "asd asd". */
function validaNome(bruto: string): { erro?: string; limpo: string } {
  const v = bruto.trim().replace(/\s+/g, " ");
  if (!v) return { erro: "Informe o seu nome completo.", limpo: "" };

  const partes = v.split(" ");
  if (partes.length < 2) return { erro: "Informe nome e sobrenome.", limpo: v };
  if (!partes.every((p) => SO_LETRAS.test(p)))
    return { erro: "Use apenas letras no nome.", limpo: v };
  if (v.replace(/\s/g, "").length < 5)
    return { erro: "Nome muito curto — escreva o nome completo.", limpo: v };

  const migue = "Informe o seu nome real.";
  // "aaa aaa": uma letra só repetida não é nome.
  if (partes.some((p) => new Set(p.toLowerCase()).size === 1 && p.length > 1))
    return { erro: migue, limpo: v };
  // "asd asd", "teste teste": nome e sobrenome idênticos.
  const significativas = partes.filter((p) => !PARTICULAS.has(p.toLowerCase()));
  if (significativas.length >= 2 && new Set(significativas.map((p) => p.toLowerCase())).size === 1)
    return { erro: migue, limpo: v };
  // "asd", "qwe", "teste": tecladada ou palavra de teste.
  if (partes.some((p) => MIGUE.has(p.toLowerCase()))) return { erro: migue, limpo: v };
  // Nome de gente tem vogal.
  if (!partes.every((p) => VOGAIS.test(p))) return { erro: migue, limpo: v };

  return { limpo: tituloNome(v) };
}

function validaCargo(bruto: string): { erro?: string; limpo: string } {
  const v = bruto.trim().replace(/\s+/g, " ");
  if (!v) return { erro: "Informe o seu cargo.", limpo: "" };
  // 2 letras já basta: "RH", "TI", "CEO" são cargos legítimos.
  if (!/^[\p{L}][\p{L}\s.&/'-]*$/u.test(v) || v.replace(/[^\p{L}]/gu, "").length < 2)
    return { erro: "Informe um cargo válido.", limpo: v };
  if (MIGUE.has(v.toLowerCase())) return { erro: "Informe o seu cargo real.", limpo: v };
  return { limpo: v };
}

/** Formato do e-mail + bloqueio de caixa descartável. O domínio é conferido à parte. */
function validaEmail(bruto: string): { erro?: string; limpo: string; dominio: string } {
  const v = bruto.trim().toLowerCase();
  if (!v) return { erro: "Informe o seu e-mail.", limpo: "", dominio: "" };

  const m = /^[^\s@]+@([^\s@]+\.[^\s@]{2,})$/.exec(v);
  if (!m) return { erro: "E-mail inválido.", limpo: v, dominio: "" };

  const dominio = m[1];
  if (DOMINIOS_DESCARTAVEIS.has(dominio))
    return { erro: "Use um e-mail permanente, não um temporário.", limpo: v, dominio };

  return { limpo: v, dominio };
}

/** Celular ou fixo brasileiro, com DDD que existe. */
function validaTelefone(bruto: string): { erro?: string; limpo: string } {
  const d = (bruto ?? "").replace(/\D/g, "");
  if (!d) return { erro: "Informe o seu telefone.", limpo: "" };

  // Aceita quem digitou o 55 do país na frente.
  const n = d.length > 11 && d.startsWith("55") ? d.slice(2) : d;

  if (n.length < 10 || n.length > 11)
    return { erro: "Telefone deve ter DDD + número.", limpo: bruto };
  if (!DDDS.has(Number(n.slice(0, 2))))
    return { erro: "DDD inexistente.", limpo: bruto };
  // Antes das regras de formato: 11111111111 é migué, não erro de dígito.
  if (new Set(n.slice(2)).size === 1)
    return { erro: "Informe um telefone real.", limpo: bruto };
  if (n.length === 11 && n[2] !== "9")
    return { erro: "Celular com 9 dígitos deve começar com 9.", limpo: bruto };
  if (n.length === 10 && !"2345".includes(n[2]))
    return { erro: "Número fixo inválido.", limpo: bruto };

  const ddd = n.slice(0, 2);
  const corpo = n.slice(2);
  const meio = corpo.length === 9 ? corpo.slice(0, 5) : corpo.slice(0, 4);
  const fim = corpo.length === 9 ? corpo.slice(5) : corpo.slice(4);
  return { limpo: `(${ddd}) ${meio}-${fim}` };
}

/** Valida os quatro campos. Todos são obrigatórios. */
export function validaLead(entrada: {
  nome?: string;
  cargo?: string;
  email?: string;
  telefone?: string;
}): ResultadoValidacao & { dominioEmail: string } {
  const nome = validaNome(entrada.nome ?? "");
  const cargo = validaCargo(entrada.cargo ?? "");
  const email = validaEmail(entrada.email ?? "");
  const telefone = validaTelefone(entrada.telefone ?? "");

  const erros: ResultadoValidacao["erros"] = {};
  if (nome.erro) erros.nome = nome.erro;
  if (cargo.erro) erros.cargo = cargo.erro;
  if (email.erro) erros.email = email.erro;
  if (telefone.erro) erros.telefone = telefone.erro;

  return {
    ok: Object.keys(erros).length === 0,
    erros,
    limpo: {
      nome: nome.limpo,
      cargo: cargo.limpo,
      email: email.limpo,
      telefone: telefone.limpo,
    },
    dominioEmail: email.dominio,
  };
}

/**
 * Confere no DNS se o domínio do e-mail aceita mensagem — pega tanto o erro
 * de digitação ("gmial.com") quanto o domínio que não recebe e-mail nenhum.
 *
 * Falha para o lado de aceitar: se a consulta cair, o cadastro passa. Perder
 * um lead real por instabilidade de rede é pior do que deixar um errado entrar.
 */
export async function dominioRecebeEmail(dominio: string): Promise<boolean> {
  if (!dominio) return false;
  const consulta = async (tipo: "MX" | "A") => {
    const r = await fetch(
      `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(dominio)}&type=${tipo}`,
      { headers: { accept: "application/dns-json" } },
    );
    if (!r.ok) throw new Error(`DNS ${r.status}`);
    return (await r.json()) as { Answer?: { data: string }[] };
  };

  try {
    const mx = await consulta("MX");
    const registros = (mx.Answer ?? []).map((a) => a.data.trim());
    if (registros.length) {
      // "0 ." é o MX nulo: o domínio declara que NÃO recebe e-mail.
      const nulo = registros.every((d) => /\s\.$/.test(d) || d === ".");
      return !nulo;
    }
    // Sem MX, um A/AAAA ainda permite entrega (RFC 5321).
    const a = await consulta("A");
    return (a.Answer ?? []).length > 0;
  } catch {
    return true;
  }
}
