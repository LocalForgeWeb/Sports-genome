/**
 * A small, deterministic PDF 1.4 writer for documents Sports Genome generates itself
 * (Oct 2 brief §8): text in the standard Helvetica faces, filled and stroked
 * rectangles, lines, and JPEG images. No DOM, no screenshot, no browser print
 * pipeline - so no viewport-height shells, no app chrome, no browser headers or
 * footers, and the same input always yields the same bytes.
 *
 * Coordinates are in points from the TOP-LEFT of the page, the way layout code
 * thinks; the writer flips them into PDF space. Text is encoded as WinAnsi (the
 * standard 14 fonts' encoding), with the few Unicode characters the app prints
 * (× – — · ’ “ ” • …) mapped to their WinAnsi codes.
 */

export type Rgb = readonly [number, number, number];
export type FontName = "regular" | "bold" | "italic";

const FONT_RESOURCE: Record<FontName, string> = { regular: "F1", bold: "F2", italic: "F3" };
const BASE_FONT: Record<FontName, string> = { regular: "Helvetica", bold: "Helvetica-Bold", italic: "Helvetica-Oblique" };

/* ── Metrics: Adobe's Helvetica / Helvetica-Bold AFM advance widths (1/1000 em) ── */
// Codes 32–126.
const HELVETICA_ASCII = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667, 722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556, 222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334, 260, 334, 584];
const HELVETICA_BOLD_ASCII = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722, 722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667, 944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278, 278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280, 389, 584];
// WinAnsi codes above 126 that the app can print, [regular, bold].
const EXTENDED: Record<number, [number, number]> = {
  0x80: [556, 556], 0x85: [1000, 1000], 0x91: [222, 278], 0x92: [222, 278], 0x93: [333, 500], 0x94: [333, 500], 0x95: [350, 350], 0x96: [556, 556], 0x97: [1000, 1000], 0x99: [1000, 1000],
  0xa0: [278, 278], 0xa9: [737, 737], 0xae: [737, 737], 0xb0: [400, 400], 0xb1: [584, 584], 0xb7: [278, 278], 0xbd: [834, 834], 0xd7: [584, 584], 0xf7: [584, 584],
};
// Latin-1 letters take their base letter's width (é as e, Ü as U, ...).
const LATIN1_BASE = "AAAAAAACEEEEIIIIDNOOOOO OUUUUYPsaaaaaaaceeeeiiiidnooooo ouuuuypy";

/** Unicode → WinAnsi byte (cp1252), or null when the face has no glyph for it. */
const CP1252: Record<number, number> = { 0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a, 0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98, 0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f };
/** Characters with no WinAnsi glyph, spelled with ones that have. */
const SUBSTITUTE: Record<string, string> = { "−": "-", "‐": "-", "‑": "-", " ": " ", " ": " ", "​": "", "≥": ">=", "≤": "<=", "→": "->", "←": "<-", "✓": "", "✕": "x" };

export function toWinAnsi(text: string): number[] {
  const out: number[] = [];
  for (const ch of text.normalize("NFC")) {
    const sub = SUBSTITUTE[ch];
    if (sub !== undefined) { for (const c of sub) out.push(c.charCodeAt(0)); continue; }
    const cp = ch.codePointAt(0)!;
    if (cp === 0x0a || cp === 0x0d || cp === 0x09) { out.push(0x20); continue; }
    if (cp >= 0x20 && cp <= 0x7e) out.push(cp);
    else if (cp >= 0xa0 && cp <= 0xff) out.push(cp);
    else if (CP1252[cp] !== undefined) out.push(CP1252[cp]);
    else out.push(0x3f); // "?"
  }
  return out;
}

function glyphWidth(code: number, font: FontName): number {
  const bold = font === "bold";
  if (code >= 32 && code <= 126) return (bold ? HELVETICA_BOLD_ASCII : HELVETICA_ASCII)[code - 32];
  const ext = EXTENDED[code];
  if (ext) return bold ? ext[1] : ext[0];
  if (code >= 0xc0 && code <= 0xff) {
    const base = LATIN1_BASE[code - 0xc0];
    if (base && base !== " ") return glyphWidth(base.charCodeAt(0), font);
    return 584; // × and ÷
  }
  return 556;
}

/** Width of `text` in points, with `tracking` points added between characters. */
export function measureText(text: string, font: FontName, size: number, tracking = 0): number {
  const codes = toWinAnsi(text);
  const em = codes.reduce((sum, code) => sum + glyphWidth(code, font), 0);
  return (em / 1000) * size + Math.max(0, codes.length - 1) * tracking;
}

/** Greedy word wrap to `maxWidth`; a word longer than a line is broken where it must be. */
export function wrapText(text: string, font: FontName, size: number, maxWidth: number, tracking = 0): string[] {
  const words = text.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  const lines: string[] = [];
  let line = "";
  const fits = (value: string) => measureText(value, font, size, tracking) <= maxWidth;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (fits(candidate)) { line = candidate; continue; }
    if (line) lines.push(line);
    if (fits(word)) { line = word; continue; }
    // Break an over-long word into pieces that fit.
    let piece = "";
    for (const ch of word) {
      if (fits(piece + ch)) piece += ch;
      else { if (piece) lines.push(piece); piece = ch; }
    }
    line = piece;
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

const num = (value: number) => (Math.round(value * 100) / 100).toString();
const color = ([r, g, b]: Rgb) => `${num(r / 255)} ${num(g / 255)} ${num(b / 255)}`;
const pdfString = (codes: number[]) => "(" + codes.map((c) => (c === 0x28 || c === 0x29 || c === 0x5c ? "\\" + String.fromCharCode(c) : c < 0x20 || c > 0x7e ? "\\" + c.toString(8).padStart(3, "0") : String.fromCharCode(c))).join("") + ")";

export type PdfImage = { name: string; jpeg: Uint8Array; width: number; height: number };

export class PdfPage {
  readonly ops: string[] = [];
  readonly images = new Set<string>();
  constructor(readonly width: number, readonly height: number) {}

  rect(x: number, y: number, w: number, h: number, { fill, stroke, lineWidth = 1 }: { fill?: Rgb; stroke?: Rgb; lineWidth?: number }) {
    const parts = [`${num(x)} ${num(this.height - y - h)} ${num(w)} ${num(h)} re`];
    if (fill) this.ops.push(`${color(fill)} rg`);
    if (stroke) this.ops.push(`${color(stroke)} RG ${num(lineWidth)} w`);
    this.ops.push(`${parts[0]} ${fill && stroke ? "B" : fill ? "f" : "S"}`);
  }

  line(x1: number, y1: number, x2: number, y2: number, { color: c, width = 1, dash }: { color: Rgb; width?: number; dash?: [number, number] }) {
    this.ops.push(`${color(c)} RG ${num(width)} w ${dash ? `[${dash.map(num).join(" ")}] 0 d` : "[] 0 d"} ${num(x1)} ${num(this.height - y1)} m ${num(x2)} ${num(this.height - y2)} l S`);
  }

  /** Draws one line of text with its baseline at `y`. Returns the drawn width. */
  text(value: string, x: number, y: number, { font = "regular", size, color: c, tracking = 0, align = "left" }: { font?: FontName; size: number; color: Rgb; tracking?: number; align?: "left" | "right" | "center" }) {
    const width = measureText(value, font, size, tracking);
    const left = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
    this.ops.push(`BT /${FONT_RESOURCE[font]} ${num(size)} Tf ${num(tracking)} Tc ${color(c)} rg ${num(left)} ${num(this.height - y)} Td ${pdfString(toWinAnsi(value))} Tj ET`);
    return width;
  }

  image(image: PdfImage, x: number, y: number, w: number, h: number) {
    this.images.add(image.name);
    this.ops.push(`q ${num(w)} 0 0 ${num(h)} ${num(x)} ${num(this.height - y - h)} cm /${image.name} Do Q`);
  }
}

export type PdfInfo = { title: string; author?: string; subject?: string; creator?: string; creationDate?: Date };

/** A text string in the document information dictionary: UTF-16BE with a byte-order mark. */
function infoString(value: string): string {
  let hex = "FEFF";
  for (let i = 0; i < value.length; i++) hex += value.charCodeAt(i).toString(16).padStart(4, "0").toUpperCase();
  return `<${hex}>`;
}

function pdfDate(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `(D:${date.getUTCFullYear()}${p(date.getUTCMonth() + 1)}${p(date.getUTCDate())}${p(date.getUTCHours())}${p(date.getUTCMinutes())}${p(date.getUTCSeconds())}Z)`;
}

export class PdfDocument {
  readonly pages: PdfPage[] = [];
  private readonly imageList: PdfImage[] = [];
  constructor(readonly pageWidth = 612, readonly pageHeight = 792) {}

  addPage(): PdfPage {
    const page = new PdfPage(this.pageWidth, this.pageHeight);
    this.pages.push(page);
    return page;
  }

  addImage(image: Omit<PdfImage, "name">): PdfImage {
    const registered = { ...image, name: `Im${this.imageList.length + 1}` };
    this.imageList.push(registered);
    return registered;
  }

  toBytes(info: PdfInfo): Uint8Array {
    const chunks: Uint8Array[] = [];
    let length = 0;
    const offsets: number[] = [];
    const push = (bytes: Uint8Array) => { chunks.push(bytes); length += bytes.length; };
    const ascii = (text: string) => { const bytes = new Uint8Array(text.length); for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i) & 0xff; return bytes; };
    const object = (id: number, body: string | Uint8Array[]) => {
      offsets[id] = length;
      if (typeof body === "string") push(ascii(`${id} 0 obj\n${body}\nendobj\n`));
      else { push(ascii(`${id} 0 obj\n`)); body.forEach(push); push(ascii("\nendobj\n")); }
    };

    // Object numbers: 1 catalog, 2 pages, 3–5 fonts, then images, then a page + content pair per page, then info.
    const fontIds = { regular: 3, bold: 4, italic: 5 } as const;
    const imageIds = new Map<string, number>();
    let next = 6;
    for (const image of this.imageList) imageIds.set(image.name, next++);
    const pageIds = this.pages.map(() => { const page = next++; const content = next++; return { page, content }; });
    const infoId = next++;

    push(ascii("%PDF-1.4\n%\xe2\xe3\xcf\xd3\n"));
    object(1, "<< /Type /Catalog /Pages 2 0 R /ViewerPreferences << /DisplayDocTitle true >> >>");
    object(2, `<< /Type /Pages /Kids [${pageIds.map(({ page }) => `${page} 0 R`).join(" ")}] /Count ${this.pages.length} >>`);
    (Object.keys(fontIds) as FontName[]).forEach((font) => object(fontIds[font], `<< /Type /Font /Subtype /Type1 /BaseFont /${BASE_FONT[font]} /Encoding /WinAnsiEncoding >>`));
    for (const image of this.imageList) {
      object(imageIds.get(image.name)!, [ascii(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.jpeg.length} >>\nstream\n`), image.jpeg, ascii("\nendstream")]);
    }
    const fonts = `/Font << /F1 ${fontIds.regular} 0 R /F2 ${fontIds.bold} 0 R /F3 ${fontIds.italic} 0 R >>`;
    this.pages.forEach((page, index) => {
      const { page: pageId, content } = pageIds[index];
      const xobjects = page.images.size ? ` /XObject << ${Array.from(page.images, (name) => `/${name} ${imageIds.get(name)} 0 R`).join(" ")} >>` : "";
      object(pageId, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Resources << ${fonts}${xobjects} >> /Contents ${content} 0 R >>`);
      const stream = page.ops.join("\n");
      object(content, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    });
    const created = info.creationDate ?? new Date();
    object(infoId, `<< /Title ${infoString(info.title)} /Author ${infoString(info.author ?? "Sports Genome")}${info.subject ? ` /Subject ${infoString(info.subject)}` : ""} /Creator ${infoString(info.creator ?? "Sports Genome")} /Producer ${infoString("Sports Genome")} /CreationDate ${pdfDate(created)} >>`);

    const xrefAt = length;
    const total = infoId + 1;
    let xref = `xref\n0 ${total}\n0000000000 65535 f \n`;
    for (let id = 1; id < total; id++) xref += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
    push(ascii(`${xref}trailer\n<< /Size ${total} /Root 1 0 R /Info ${infoId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`));

    const out = new Uint8Array(length);
    let at = 0;
    for (const chunk of chunks) { out.set(chunk, at); at += chunk.length; }
    return out;
  }
}
