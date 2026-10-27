import * as client from "openid-client";
import type { Config } from "../config";

export interface LoginChecks {
  state: string;
  nonce: string;
  codeVerifier: string;
}

export interface OidcClaims {
  sub: string;
  name: string;
  email: string | null;
}

/** Schnittstelle zum Identity Provider; in Tests durch eine Attrappe ersetzt. */
export interface OidcClient {
  start(redirectUri: string): Promise<{ url: URL; checks: LoginChecks }>;
  finish(currentUrl: URL, checks: LoginChecks): Promise<OidcClaims>;
}

const SCOPE = "openid profile email";

/**
 * Leitet Server-Anfragen an Dex auf eine interne Adresse um, wenn der Server Dex
 * nicht unter der öffentlichen Issuer-URL erreicht (z. B. im Docker-Netz).
 * Der Issuer im Token bleibt dabei die öffentliche URL.
 */
function rewritingFetch(publicIssuer: string, internalUrl: string): client.CustomFetch {
  const from = new URL(publicIssuer).origin;
  const to = new URL(internalUrl).origin;
  return (url, options) => {
    const target = url.startsWith(from) ? to + url.slice(from.length) : url;
    return fetch(target, options as RequestInit);
  };
}

export async function createDexClient(config: Config): Promise<OidcClient> {
  const issuer = new URL(config.DEX_ISSUER);
  const options: client.DiscoveryRequestOptions = {};
  if (issuer.protocol === "http:") options.execute = [client.allowInsecureRequests];
  if (config.DEX_INTERNAL_URL) {
    options[client.customFetch] = rewritingFetch(config.DEX_ISSUER, config.DEX_INTERNAL_URL);
  }

  const oidc = await client.discovery(issuer, config.OIDC_CLIENT_ID, config.OIDC_CLIENT_SECRET, undefined, options);
  if (config.DEX_INTERNAL_URL) {
    oidc[client.customFetch] = rewritingFetch(config.DEX_ISSUER, config.DEX_INTERNAL_URL);
  }

  return {
    async start(redirectUri) {
      const checks: LoginChecks = {
        state: client.randomState(),
        nonce: client.randomNonce(),
        codeVerifier: client.randomPKCECodeVerifier(),
      };
      const url = client.buildAuthorizationUrl(oidc, {
        redirect_uri: redirectUri,
        scope: SCOPE,
        state: checks.state,
        nonce: checks.nonce,
        code_challenge: await client.calculatePKCECodeChallenge(checks.codeVerifier),
        code_challenge_method: "S256",
      });
      return { url, checks };
    },

    async finish(currentUrl, checks) {
      const tokens = await client.authorizationCodeGrant(oidc, currentUrl, {
        expectedState: checks.state,
        expectedNonce: checks.nonce,
        pkceCodeVerifier: checks.codeVerifier,
        idTokenExpected: true,
      });
      const claims = tokens.claims();
      if (!claims) throw new Error("Kein ID-Token erhalten.");
      const email = typeof claims.email === "string" ? claims.email : null;
      const name =
        (typeof claims.name === "string" && claims.name) ||
        (typeof claims.preferred_username === "string" && claims.preferred_username) ||
        email ||
        claims.sub;
      return { sub: claims.sub, name, email };
    },
  };
}
