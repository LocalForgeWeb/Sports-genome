/**
 * Uploads a local reference file through the documented two-step flow: ask
 * the platform for a signed ticket (authenticated, on our side), then PUT the
 * bytes to the ticket's storage URL with only the ticket's headers.
 */
import { readFileSync } from "node:fs";
import { extname } from "node:path";
import type { PlatformClient } from "./platform";

const MIME_BY_EXTENSION: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".mp4": "video/mp4",
  ".wav": "audio/wav",
};

export function contentTypeForFile(path: string): string {
  const type = MIME_BY_EXTENSION[extname(path).toLowerCase()];
  if (!type) throw new Error(`Unsupported reference file type: ${path}. Use JPEG, PNG, WebP, GIF, MP4, or WAV.`);
  return type;
}

export async function uploadReferenceFile(client: PlatformClient, path: string): Promise<{ url: string; contentType: string }> {
  const contentType = contentTypeForFile(path);
  const bytes = new Uint8Array(readFileSync(path));
  const ticket = await client.createUpload(contentType);
  const { url } = await client.uploadWithTicket(ticket, bytes);
  return { url, contentType };
}
