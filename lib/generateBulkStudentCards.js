/**
 *
 * Builds a print-ready A4 PDF containing every student's exam card.
 *
 * Layout per A4 page (portrait, 210 × 297 mm):
 *   • 3 rows of front + back pairs
 *   • Each card is exactly 54 × 85 mm
 *   • 5 mm gap between front and back within a pair
 *   • 6 mm gap between rows
 *   • Dashed cut-lines around every card
 *   • Header on every page: institution name + page counter
 *
 * Requires:  npm install jspdf
 */

import { jsPDF } from "jspdf";
import {
  drawFront,
  drawBack,
  fetchImage,
} from "@/lib/generateStudentCard";

// ── PDF / card constants ──────────────────────────────────────────────────
const PAGE_W_MM   = 210;          // A4 portrait
const PAGE_H_MM   = 297;

const CARD_W_MM   = 54;           // exact card size
const CARD_H_MM   = 85;

const PAIR_GAP_MM = 5;            // gap between front & back in a pair
const ROW_GAP_MM  = 6;            // vertical gap between rows
const MARGIN_T_MM = 14;           // top margin (space for page header)
const MARGIN_B_MM = 8;            // bottom margin

// Derived
const PAIR_W_MM   = CARD_W_MM * 2 + PAIR_GAP_MM;          // 113 mm
const LEFT_MM     = (PAGE_W_MM - PAIR_W_MM) / 2;           // ≈ 48.5 mm (centred)

// How many rows fit on one page
const USABLE_H_MM = PAGE_H_MM - MARGIN_T_MM - MARGIN_B_MM; // 275 mm
const ROWS_PER_PAGE = Math.floor(
  (USABLE_H_MM + ROW_GAP_MM) / (CARD_H_MM + ROW_GAP_MM)   // = 3
);

// ── Helpers ───────────────────────────────────────────────────────────────

/** Convert a canvas element to a JPEG data-URL at the given quality. */
function canvasToJpeg(canvas, quality = 0.92) {
  return canvas.toDataURL("image/jpeg", quality);
}

/**
 * Draw dashed cut-line guides around a card position (in mm).
 * jsPDF exposes setLineDashPattern in newer builds; we fall back to
 * a simple solid hairline if the method is absent.
 */
function cutLine(pdf, x, y, w, h) {
  pdf.saveGraphicsState();
  pdf.setDrawColor(180, 180, 180);
  pdf.setLineWidth(0.2);
  if (typeof pdf.setLineDashPattern === "function") {
    pdf.setLineDashPattern([1.5, 1], 0);
  }
  pdf.rect(x, y, w, h, "S");
  if (typeof pdf.setLineDashPattern === "function") {
    pdf.setLineDashPattern([], 0);     // reset
  }
  pdf.restoreGraphicsState();
}

/**
 * Draw a subtle scissors icon (✂) in the gap between two cards.
 * Falls back silently if the font can't render the glyph.
 */
function scissorMark(pdf, x, midY) {
  try {
    pdf.saveGraphicsState();
    pdf.setFontSize(5);
    pdf.setTextColor(180, 180, 180);
    pdf.text("✂", x, midY, { align: "center", baseline: "middle" });
    pdf.restoreGraphicsState();
  } catch (_) { /* non-critical */ }
}

/** Draw the per-page header: institution name (left) + page indicator (right). */
function pageHeader(pdf, institutionName, pageNum, totalPages) {
  const y = 7;
  pdf.saveGraphicsState();

  // Teal thin rule
  pdf.setDrawColor(13, 148, 136);
  pdf.setLineWidth(0.4);
  pdf.line(8, y + 3.5, PAGE_W_MM - 8, y + 3.5);

  // Institution name (left)
  pdf.setFontSize(6.5);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(11, 68, 68);
  pdf.text(institutionName.toUpperCase(), 8, y, { baseline: "bottom" });

  // Page counter (right)
  pdf.setFont("helvetica", "normal");
  pdf.setTextColor(120, 120, 120);
  pdf.text(`Page ${pageNum} / ${totalPages}`, PAGE_W_MM - 8, y, {
    align: "right",
    baseline: "bottom",
  });

  // Sub-label centred
  pdf.setFontSize(5.5);
  pdf.setTextColor(150, 150, 150);
  pdf.text("STUDENT EXAMINATION CARDS — PRINT & CUT", PAGE_W_MM / 2, y, {
    align: "center",
    baseline: "bottom",
  });

  pdf.restoreGraphicsState();
}

// ── Main export ───────────────────────────────────────────────────────────
/**
 * @param {object[]} students       – array of student objects from the API
 * @param {function} getQRCodeUrl   – (indexNumber, size) => string
 * @param {object}   options
 * @param {string}   options.institutionName
 * @param {string}   options.contactPhone
 * @param {string}   options.contactEmail
 * @param {string}   [options.filename]     – PDF filename (no extension)
 * @param {function} [options.onProgress]   – (done: number, total: number) => void
 */
export async function generateBulkStudentCards(students, getQRCodeUrl, options = {}) {
  const {
    institutionName = "YOUR INSTITUTION",
    contactPhone    = "+233 XX XXX XXXX",
    contactEmail    = "exams@institution.edu.gh",
    filename        = "student_exam_cards",
    onProgress      = () => {},
  } = options;

  if (!students || students.length === 0) {
    throw new Error("No students provided.");
  }

  const total       = students.length;
  const totalPages  = Math.ceil(total / ROWS_PER_PAGE);

  // ── Pre-render the back card ONCE (identical for every student) ──────────
  const backCanvas  = drawBack(institutionName, contactPhone, contactEmail);
  const backDataUrl = canvasToJpeg(backCanvas);

  // ── Set up jsPDF ─────────────────────────────────────────────────────────
  const pdf = new jsPDF({
    orientation: "portrait",
    unit:        "mm",
    format:      "a4",
    compress:    true,
  });

  // ── Process each student ──────────────────────────────────────────────────
  for (let i = 0; i < total; i++) {
    const student  = students[i];
    const rowOnPage = i % ROWS_PER_PAGE;   // 0 | 1 | 2
    const isNewPage = rowOnPage === 0;
    const pageNum   = Math.floor(i / ROWS_PER_PAGE) + 1;

    // Add a new PDF page (except before the very first card)
    if (isNewPage) {
      if (i > 0) pdf.addPage();
      pageHeader(pdf, institutionName, pageNum, totalPages);
    }

    // Y position of this row's top edge (mm)
    const rowY = MARGIN_T_MM + rowOnPage * (CARD_H_MM + ROW_GAP_MM);

    // ── Render front canvas for this student ───────────────────────────────
    const qrUrl    = getQRCodeUrl(student.index_number, 600);
    const qrImg    = await fetchImage(qrUrl);
    const frontCanvas = drawFront(student, qrImg, institutionName);
    const frontDataUrl = canvasToJpeg(frontCanvas);

    // ── Place front card ───────────────────────────────────────────────────
    const frontX = LEFT_MM;
    pdf.addImage(frontDataUrl, "JPEG", frontX, rowY, CARD_W_MM, CARD_H_MM);
    cutLine(pdf, frontX, rowY, CARD_W_MM, CARD_H_MM);

    // ── Place back card ────────────────────────────────────────────────────
    const backX = LEFT_MM + CARD_W_MM + PAIR_GAP_MM;
    pdf.addImage(backDataUrl, "JPEG", backX, rowY, CARD_W_MM, CARD_H_MM);
    cutLine(pdf, backX, rowY, CARD_W_MM, CARD_H_MM);

    // ── Scissors mark in the gap ───────────────────────────────────────────
    scissorMark(pdf, LEFT_MM + CARD_W_MM + PAIR_GAP_MM / 2, rowY + CARD_H_MM / 2);

    // ── Horizontal cut line between rows (not after the last row on page) ──
    const isLastRowOnPage = rowOnPage === ROWS_PER_PAGE - 1;
    const isLastStudent   = i === total - 1;
    if (!isLastRowOnPage && !isLastStudent) {
      const lineY = rowY + CARD_H_MM + ROW_GAP_MM / 2;
      pdf.saveGraphicsState();
      pdf.setDrawColor(200, 200, 200);
      pdf.setLineWidth(0.15);
      if (typeof pdf.setLineDashPattern === "function") {
        pdf.setLineDashPattern([1, 1], 0);
      }
      pdf.line(LEFT_MM - 2, lineY, LEFT_MM + PAIR_W_MM + 2, lineY);
      if (typeof pdf.setLineDashPattern === "function") {
        pdf.setLineDashPattern([], 0);
      }
      pdf.restoreGraphicsState();
    }

    // Report progress after each student
    onProgress(i + 1, total);

    // Yield to the browser so the UI stays responsive
    await new Promise((r) => setTimeout(r, 0));
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  pdf.save(`${filename}.pdf`);
}