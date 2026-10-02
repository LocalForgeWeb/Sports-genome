import { PdfDocument, measureText, wrapText, type PdfImage, type PdfPage, type Rgb } from "@/lib/pdf/pdfWriter";
import { exportContextLine, exportCountLine, exportTitle, pad2, type WorkoutExport, type WorkoutExportExercise } from "@/lib/workoutExport";

/**
 * The training day as a document (Oct 2 brief §8–12): a light page designed to
 * be read on a phone, printed, or handed to a coach - not the dark app printed.
 *
 * Page one opens with what a thumbnail needs to say: Sports Genome, the day,
 * the sport and goal, how many exercises. Each exercise is one block that
 * never splits across a page: its number, name, movement and muscles, the
 * prescription, a line per set to fill in, and its coach note. Pages hold only
 * content; the footer is our own (brand, date, page n of N), never a browser's.
 */

const PAGE_W = 612; // US Letter, points
const PAGE_H = 792;
const M = 40; // side margin
const TOP = 40;
const FOOTER_RULE = PAGE_H - 40; // footer sits below this line
const CONTENT_BOTTOM = FOOTER_RULE - 14;

const NAVY: Rgb = [11, 34, 64];
const INK: Rgb = [16, 41, 71];
const SECONDARY: Rgb = [53, 87, 116];
const MUTED: Rgb = [93, 113, 134];
const ORANGE: Rgb = [214, 70, 31]; // deeper than the app's #e4512e so small type clears 4.5:1 on white
const RULE: Rgb = [217, 227, 238];
const FAINT: Rgb = [235, 241, 247];
const NOTE: Rgb = [138, 58, 34];
const WRITE_LINE: Rgb = [165, 183, 201];

const NUMBER_X = M;
const BODY_X = M + 34;
const DOSE_X = 380;
const DOSE_COL = (PAGE_W - M - DOSE_X) / 3;
const BODY_W = DOSE_X - BODY_X - 14;
const FULL_W = PAGE_W - M - BODY_X;

export type WorkoutPdfOptions = { logo?: Omit<PdfImage, "name"> | null; weightUnit?: "lb" | "kg" };

type DoseCell = { lines: string[]; size: number };
type Block = { exercise: WorkoutExportExercise; nameLines: string[]; metaLines: string[]; noteLines: string[]; dose: DoseCell[]; setRows: number; height: number };

/** A prescription column: 11pt, smaller for a long value, and wrapped only if it still does not fit. */
function fitDose(value: string): DoseCell {
  const room = DOSE_COL - 8;
  let size = 11;
  while (size > 8.5 && measureText(value, "bold", size) > room) size -= 0.5;
  return { lines: measureText(value, "bold", size) > room ? wrapText(value.replace(/\//g, "/ "), "bold", size, room).map((line) => line.replace(/\/ /g, "/")) : [value], size };
}

const NAME = { font: "bold" as const, size: 12.5, lead: 15 };
const META = { font: "regular" as const, size: 8.5, lead: 11 };
const NOTE_TEXT = { font: "italic" as const, size: 8.5, lead: 11 };
const SET_ROW = 21;

function layoutBlock(exercise: WorkoutExportExercise): Block {
  const nameLines = wrapText(exercise.name, NAME.font, NAME.size, BODY_W);
  const meta = [exercise.movement, ...exercise.muscles].filter(Boolean).join(" · ");
  const metaLines = meta ? wrapText(meta, META.font, META.size, BODY_W) : [];
  const noteLines = exercise.notes ? wrapText(`Coach note: ${exercise.notes}`, NOTE_TEXT.font, NOTE_TEXT.size, FULL_W) : [];
  const setRows = Math.ceil(exercise.tracking.length / 2);
  const dose = [exercise.prescription, exercise.rpe, exercise.rest].map(fitDose);
  const doseHeight = Math.max(...dose.map((cell) => cell.lines.length * (cell.size + 3)));
  const head = Math.max(nameLines.length * NAME.lead + metaLines.length * META.lead, doseHeight + 6, 34);
  const height = 12 + head + 8 + setRows * SET_ROW + (noteLines.length ? 4 + noteLines.length * NOTE_TEXT.lead : 0) + 12;
  return { exercise, nameLines, metaLines, noteLines, dose, setRows, height };
}

function drawHeader(page: PdfPage, plan: WorkoutExport, logo: PdfImage | null | undefined): number {
  let brandX = M;
  if (logo) {
    const h = 34;
    const w = Math.min(68, (logo.width / logo.height) * h);
    page.image(logo, M, TOP - 4, w, h);
    brandX = M + w + 10;
  }
  page.text("SPORTS GENOME", brandX, TOP + 9, { font: "bold", size: 10, color: NAVY, tracking: 0.6 });
  page.text("TRAINING PLAN", brandX, TOP + 22, { font: "bold", size: 8, color: ORANGE, tracking: 0.48 });
  page.text(`WEEK ${plan.week} · ${plan.dayOrdinal.toUpperCase()}`, PAGE_W - M, TOP + 9, { font: "bold", size: 8.5, color: SECONDARY, tracking: 0.51, align: "right" });
  page.text("Date  ________________", PAGE_W - M, TOP + 22, { size: 8, color: MUTED, align: "right" });

  // The day, big, then what it is for.
  const titleSize = measureText(plan.dayName.toUpperCase(), "bold", 30, 0.5) > PAGE_W - 2 * M ? 22 : 30;
  page.text(plan.dayName.toUpperCase(), M, TOP + 66, { font: "bold", size: titleSize, color: NAVY, tracking: 0.5 });
  const facts = [exportContextLine(plan), exportCountLine(plan)].filter(Boolean).join(" · ").toUpperCase();
  page.text(facts, M, TOP + 84, { font: "bold", size: 8.5, color: SECONDARY, tracking: 0.51 });
  page.rect(M, TOP + 94, 44, 3, { fill: ORANGE });
  page.line(M + 48, TOP + 95.5, PAGE_W - M, TOP + 95.5, { color: RULE, width: 0.75 });

  // Column captions for the prescription, once.
  const capY = TOP + 112;
  page.text("EXERCISE", BODY_X, capY, { font: "bold", size: 6.5, color: MUTED, tracking: 0.39 });
  ["SETS × REPS", "EFFORT", "REST"].forEach((label, index) => page.text(label, DOSE_X + index * DOSE_COL, capY, { font: "bold", size: 6.5, color: MUTED, tracking: 0.39 }));
  return capY + 6;
}

function drawContinuation(page: PdfPage, plan: WorkoutExport): number {
  page.text("SPORTS GENOME", M, TOP + 9, { font: "bold", size: 8, color: NAVY, tracking: 0.48 });
  page.text(`WEEK ${plan.week} · ${plan.dayOrdinal.toUpperCase()} · ${plan.dayName.toUpperCase()}  (CONTINUED)`, PAGE_W - M, TOP + 9, { font: "bold", size: 7.5, color: SECONDARY, tracking: 0.45, align: "right" });
  page.line(M, TOP + 17, PAGE_W - M, TOP + 17, { color: RULE, width: 0.75 });
  return TOP + 22;
}

function drawBlock(page: PdfPage, block: Block, top: number, weightUnit: "lb" | "kg") {
  const { exercise } = block;
  let y = top + 12;
  page.text(pad2(exercise.order), NUMBER_X, y + 11, { font: "bold", size: 15, color: ORANGE });
  // Name and what it trains.
  let lineY = y + 11;
  block.nameLines.forEach((line) => { page.text(line, BODY_X, lineY, { font: NAME.font, size: NAME.size, color: INK }); lineY += NAME.lead; });
  lineY -= 3;
  block.metaLines.forEach((line) => { lineY += META.lead - 2; page.text(line, BODY_X, lineY, { font: META.font, size: META.size, color: SECONDARY }); lineY += 2; });
  // The prescription, in the three captioned columns.
  block.dose.forEach((cell, index) => {
    cell.lines.forEach((line, lineIndex) => { if (line) page.text(line, DOSE_X + index * DOSE_COL, y + 11 + lineIndex * (cell.size + 3), { font: "bold", size: cell.size, color: NAVY }); });
  });
  const doseHeight = Math.max(...block.dose.map((cell) => cell.lines.length * (cell.size + 3)));
  const head = Math.max(block.nameLines.length * NAME.lead + block.metaLines.length * META.lead, doseHeight + 6, 34);
  y += head + 8;
  // A line per set to write on, two to a row.
  const colW = FULL_W / 2;
  exercise.tracking.forEach((set, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = BODY_X + col * colW;
    const base = y + row * SET_ROW + 12;
    const label = set.target ? `${set.label} (${set.target})` : set.label;
    page.text(label, x, base, { font: "bold", size: 8, color: SECONDARY });
    const fieldX = x + Math.max(52, measureText(label, "bold", 8) + 8);
    const fieldW = colW - (fieldX - x) - 18;
    if (set.timed) {
      const half = (fieldW - 10) / 2;
      page.line(fieldX, base + 1, fieldX + half, base + 1, { color: WRITE_LINE, width: 0.6 });
      page.line(fieldX + half + 10, base + 1, fieldX + fieldW, base + 1, { color: WRITE_LINE, width: 0.6 });
      page.text("time", fieldX, base + 8, { size: 5.5, color: MUTED });
      page.text("quality", fieldX + half + 10, base + 8, { size: 5.5, color: MUTED });
    } else {
      const loadW = fieldW * 0.55;
      page.line(fieldX, base + 1, fieldX + loadW, base + 1, { color: WRITE_LINE, width: 0.6 });
      page.text("×", fieldX + loadW + 4, base, { size: 8, color: MUTED });
      page.line(fieldX + loadW + 14, base + 1, fieldX + fieldW, base + 1, { color: WRITE_LINE, width: 0.6 });
      page.text(`load (${weightUnit})`, fieldX, base + 8, { size: 5.5, color: MUTED });
      page.text("reps", fieldX + loadW + 14, base + 8, { size: 5.5, color: MUTED });
    }
  });
  y += block.setRows * SET_ROW;
  if (block.noteLines.length) {
    y += 4;
    block.noteLines.forEach((line) => { y += NOTE_TEXT.lead; page.text(line, BODY_X, y - 2, { font: NOTE_TEXT.font, size: NOTE_TEXT.size, color: NOTE }); });
  }
  page.line(M, top + block.height, PAGE_W - M, top + block.height, { color: RULE, width: 0.6 });
}

function drawFooter(page: PdfPage, plan: WorkoutExport, index: number, total: number) {
  page.line(M, FOOTER_RULE, PAGE_W - M, FOOTER_RULE, { color: RULE, width: 0.6 });
  const y = FOOTER_RULE + 14;
  page.text("SPORTS GENOME", M, y, { font: "bold", size: 7, color: NAVY, tracking: 0.42 });
  const generated = plan.generatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  page.text(`Week ${plan.week} · ${plan.dayName}  ·  Generated ${generated}`, PAGE_W / 2, y, { size: 7, color: MUTED, align: "center" });
  page.text(`Page ${index + 1} of ${total}`, PAGE_W - M, y, { size: 7, color: MUTED, align: "right" });
}

/** Lays the day out and returns the PDF's bytes. Pure: the same plan gives the same document. */
export function buildWorkoutPdf(plan: WorkoutExport, { logo = null, weightUnit = "lb" }: WorkoutPdfOptions = {}): Uint8Array {
  const doc = new PdfDocument(PAGE_W, PAGE_H);
  const mark = logo ? doc.addImage({ jpeg: logo.jpeg, width: logo.width, height: logo.height }) : null;
  let page = doc.addPage();
  let y = drawHeader(page, plan, mark);
  for (const exercise of plan.exercises) {
    const block = layoutBlock(exercise);
    // A block that would cross the footer starts the next page instead (§10: no split exercises).
    if (y + block.height > CONTENT_BOTTOM && y > TOP + 140) {
      page = doc.addPage();
      y = drawContinuation(page, plan);
    }
    drawBlock(page, block, y, weightUnit);
    y += block.height;
  }
  // Space for the session's own notes, only where the last page has room for it - never a page of its own.
  const notesHeight = 84;
  if (CONTENT_BOTTOM - y >= notesHeight + 16) {
    const top = y + 16;
    page.text("SESSION NOTES", M, top + 8, { font: "bold", size: 6.5, color: MUTED, tracking: 0.39 });
    for (let line = 0; line < 3; line++) page.line(M, top + 30 + line * 18, PAGE_W - M, top + 30 + line * 18, { color: FAINT, width: 0.8 });
    page.text("A session aid. Adjust loading and exercise choice to your readiness and your coach's advice.", M, top + notesHeight, { size: 6.5, color: MUTED });
  }
  doc.pages.forEach((p, index) => drawFooter(p, plan, index, doc.pages.length));
  return doc.toBytes({ title: exportTitle(plan), subject: `${exportCountLine(plan)}${exportContextLine(plan) ? ` · ${exportContextLine(plan)}` : ""}`, creationDate: plan.generatedAt });
}
