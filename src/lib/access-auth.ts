import { createRemoteJWKSet, jwtVerify } from "jose";
import { getRequestHeader, getCookie, setResponseStatus } from "@tanstack/react-start/server";
import { env } from "cloudflare:workers";

/**
 * Valida a sessão do Cloudflare Access dentro das server functions.
 *
 * Por que isso existe: o Access protege o caminho /admin, mas as server
 * functions do TanStack respondem em /_serverFn/<hash>, que fica fora dessa
 * regra. Sem esta checagem, savePost/deletePost/uploadImage ficariam abertas
 * a qualquer um que descobrisse o endpoint.
 *
 * A proteção é LIGADA POR PADRÃO. Só é desligada quando a variável
 * DISABLE_ACCESS_AUTH está presente — o que nunca deve acontecer em produção.
 * Se alguém apagar uma variável por engano, o resultado é o painel travado,
 * não o painel aberto.
 */

const TEAM_DOMAIN = "https://morning-frog-be18.cloudflareaccess.com";
const AUD = "b35d184a93ef89b6fc17086c15bd10d754045bca9df380eeb5b4aab63b305b76";

// createRemoteJWKSet cacheia e rotaciona as chaves sozinho.
const JWKS = createRemoteJWKSet(new URL(`${TEAM_DOMAIN}/cdn-cgi/access/certs`));

function unauthorized(motivo: string): never {
  console.warn(`[access-auth] recusado: ${motivo}`);
  setResponseStatus(401);
  throw new Error("Unauthorized");
}

export async function requireAdmin(): Promise<void> {
  // Escape hatch de desenvolvimento. Ausente em produção.
  const bypass = (env as unknown as { DISABLE_ACCESS_AUTH?: string })?.DISABLE_ACCESS_AUTH;
  if (bypass === "true") return;

  // Em produção o Access injeta o header nas rotas protegidas; em /_serverFn/*
  // o que chega é o cookie de domínio.
  const token = getRequestHeader("cf-access-jwt-assertion") ?? getCookie("CF_Authorization");

  if (!token) unauthorized("sem token");

  try {
    // jwtVerify já valida assinatura RS256, exp, nbf, iss e aud.
    await jwtVerify(token, JWKS, {
      issuer: TEAM_DOMAIN,
      audience: AUD,
    });
  } catch (erro) {
    unauthorized(erro instanceof Error ? erro.message : "token inválido");
  }
}
