/**
 * Where the Higgsfield key comes from: the server-only `HF_API_KEY` variable,
 * holding the complete key as copied from open.higgsfield.ai/api-keys.
 *
 * This is an agent tool run from a shell, so there is no key dialog, no cookie
 * and no browser. The value is read once per process, checked for the shape a
 * pasted key has, and handed to the platform client - never printed, never
 * written to a file, never returned in a result object.
 */
export const HF_API_KEY_VARIABLE = "HF_API_KEY";
export const HF_API_BASE_URL_VARIABLE = "HF_API_BASE_URL";
export const DEFAULT_BASE_URL = "https://api.higgsfield.ai";

export class MissingCredentialsError extends Error {
  constructor() {
    super(
      `Set ${HF_API_KEY_VARIABLE} to the complete API key copied from open.higgsfield.ai/api-keys (server-side only; never commit it).`,
    );
    this.name = "MissingCredentialsError";
  }
}

export function requireApiKey(raw: string | undefined): string {
  const key = raw?.trim() ?? "";
  if (!key) throw new MissingCredentialsError();
  if (/^key\s/i.test(key)) {
    throw new Error(`${HF_API_KEY_VARIABLE} holds the key alone; the "Key " authorization scheme is added by the client.`);
  }
  if (/[^\x21-\x7E]/.test(key)) {
    throw new Error(`${HF_API_KEY_VARIABLE} must be the key exactly as copied from open.higgsfield.ai; it contains characters a key cannot have.`);
  }
  return key;
}

/** The `Authorization` header value: the documented `Key` scheme plus the key as copied. */
export function toAuthorizationHeader(apiKey: string): string {
  return `Key ${requireApiKey(apiKey)}`;
}

export function readCredentials(env: NodeJS.ProcessEnv = process.env): { apiKey: string; baseUrl: string } {
  const apiKey = requireApiKey(env[HF_API_KEY_VARIABLE]);
  const configured = env[HF_API_BASE_URL_VARIABLE]?.trim();
  const baseUrl = (configured || DEFAULT_BASE_URL).replace(/\/+$/, "");
  if (!/^https:\/\//.test(baseUrl)) throw new Error(`${HF_API_BASE_URL_VARIABLE} must be an https URL.`);
  return { apiKey, baseUrl };
}
