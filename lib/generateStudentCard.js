// /**
//  * generateStudentCard.js
//  *
//  * Generates a printable 54×85 mm double-sided student ID/exam card.
//  * Returns a data-URL PNG (front + back side-by-side on one sheet).
//  */

// // ── Card dimensions @ 300 DPI ─────────────────────────────────────────────
// //   54 mm × (300 / 25.4)  ≈  638 px
// //   85 mm × (300 / 25.4)  ≈ 1004 px
// const CARD_W = 638;
// const CARD_H = 1004;

// // ── Palette ───────────────────────────────────────────────────────────────
// const C = {
//   headerTop: "#0b4444",
//   headerBot: "#0d9488",
//   teal:      "#0d9488",
//   tealAlpha: "rgba(13,148,136,0.11)",
//   tealMuted: "rgba(13,148,136,0.35)",
//   white:     "#ffffff",
//   dark:      "#0f172a",
//   gray:      "#5a6b7e",
//   sheet:     "#f1f5f9",
//   rule:      "#cbd5e1",
// };

// // ── Helpers ───────────────────────────────────────────────────────────────
// function linGrad(ctx, x1, y1, x2, y2, ...stops) {
//   const g = ctx.createLinearGradient(x1, y1, x2, y2);
//   stops.forEach(([p, c]) => g.addColorStop(p, c));
//   return g;
// }

// function roundRect(ctx, x, y, w, h, r) {
//   ctx.beginPath();
//   ctx.moveTo(x + r, y);
//   ctx.lineTo(x + w - r, y);
//   ctx.quadraticCurveTo(x + w, y, x + w, y + r);
//   ctx.lineTo(x + w, y + h - r);
//   ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
//   ctx.lineTo(x + r, y + h);
//   ctx.quadraticCurveTo(x, y + h, x, y + h - r);
//   ctx.lineTo(x, y + r);
//   ctx.quadraticCurveTo(x, y, x + r, y);
//   ctx.closePath();
// }

// function fillRR(ctx, x, y, w, h, r, fill) {
//   ctx.fillStyle = fill;
//   roundRect(ctx, x, y, w, h, r);
//   ctx.fill();
// }

// /** Shrinks font until text fits within maxW.  Returns the final size. */
// function fitFont(ctx, text, maxW, basePx, minPx, weight, family) {
//   let sz = basePx;
//   ctx.font = `${weight} ${sz}px ${family}`;
//   while (ctx.measureText(text).width > maxW && sz > minPx) {
//     sz -= 1;
//     ctx.font = `${weight} ${sz}px ${family}`;
//   }
//   return sz;
// }

// /** Wraps text into multiple lines; returns final Y after last line. */
// function wrapText(ctx, text, x, y, maxW, lineH) {
//   const words = text.split(" ");
//   let line = "";
//   let curY = y;
//   for (const word of words) {
//     const test = line ? `${line} ${word}` : word;
//     if (ctx.measureText(test).width > maxW && line) {
//       ctx.fillText(line, x, curY);
//       line = word;
//       curY += lineH;
//     } else {
//       line = test;
//     }
//   }
//   ctx.fillText(line, x, curY);
//   return curY;
// }

// /** Diagonal stripe texture on a rectangle (very subtle). */
// function stripes(ctx, x, y, w, h) {
//   ctx.save();
//   ctx.beginPath();
//   ctx.rect(x, y, w, h);
//   ctx.clip();
//   ctx.strokeStyle = "rgba(255,255,255,0.045)";
//   ctx.lineWidth = 14;
//   for (let i = x - h; i < x + w + h; i += 28) {
//     ctx.beginPath();
//     ctx.moveTo(i, y);
//     ctx.lineTo(i + h, y + h);
//     ctx.stroke();
//   }
//   ctx.restore();
// }

// /** Fetch image via blob URL to avoid canvas CORS tainting. */
// function fetchImage(url) {
//   return fetch(url)
//     .then((r) => r.blob())
//     .then(
//       (blob) =>
//         new Promise((res, rej) => {
//           const bUrl = URL.createObjectURL(blob);
//           const img = new Image();
//           img.onload = () => {
//             URL.revokeObjectURL(bUrl);
//             res(img);
//           };
//           img.onerror = rej;
//           img.src = bUrl;
//         })
//     );
// }

// // ── FRONT ─────────────────────────────────────────────────────────────────
// function drawFront(student, qrImg, institutionName) {
//   const canvas = document.createElement("canvas");
//   canvas.width  = CARD_W;
//   canvas.height = CARD_H;
//   const ctx = canvas.getContext("2d");
//   const cx  = CARD_W / 2;
//   const FONT = "Arial, sans-serif";

//   // White base
//   ctx.fillStyle = C.white;
//   ctx.fillRect(0, 0, CARD_W, CARD_H);

//   // ── Header ──────────────────────────────────────────────────────────────
//   const HDR = 210;
//   ctx.fillStyle = linGrad(ctx, 0, 0, 0, HDR, [0, C.headerTop], [1, C.headerBot]);
//   ctx.fillRect(0, 0, CARD_W, HDR);
//   stripes(ctx, 0, 0, CARD_W, HDR);

//   // Institution name
//   ctx.fillStyle = C.white;
//   ctx.textAlign = "center";
//   fitFont(ctx, institutionName, CARD_W - 64, 38, 22, "bold", FONT);
//   ctx.fillText(institutionName, cx, 70);

//   // Rule
//   ctx.fillStyle = "rgba(255,255,255,0.22)";
//   ctx.fillRect(56, 86, CARD_W - 112, 1);

//   // Subtitle
//   ctx.fillStyle = "rgba(255,255,255,0.70)";
//   ctx.font = `20px ${FONT}`;
//   ctx.fillText("STUDENT EXAMINATION CARD", cx, 120);

//   // Year pill
// //   fillRR(ctx, cx - 108, 138, 216, 34, 8, "rgba(255,255,255,0.13)");
// //   ctx.fillStyle = "rgba(255,255,255,0.65)";
// //   ctx.font = `bold 16px ${FONT}`;
// //   ctx.fillText("2024 / 2025 ACADEMIC YEAR", cx, 160);

//   // ── QR Code ─────────────────────────────────────────────────────────────
//   const QR_SZ  = 318;
//   const QR_PAD = 18;
//   const QR_X   = cx - QR_SZ / 2;
//   const QR_Y   = HDR + 46;

//   // Shadow + white card
//   ctx.shadowColor   = "rgba(0,0,0,0.13)";
//   ctx.shadowBlur    = 24;
//   ctx.shadowOffsetY = 8;
//   fillRR(ctx, QR_X - QR_PAD, QR_Y - QR_PAD,
//     QR_SZ + QR_PAD * 2, QR_SZ + QR_PAD * 2, 18, C.white);
//   ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

//   ctx.drawImage(qrImg, QR_X, QR_Y, QR_SZ, QR_SZ);

//   // ── Student info ─────────────────────────────────────────────────────────
//   let y = QR_Y + QR_SZ + QR_PAD * 2 + 30;

//   // Teal accent bar
// //   fillRR(ctx, cx - 28, y, 56, 5, 3, C.teal);
//   y += 32;

//   // Full name (wraps if needed)
//   ctx.fillStyle = C.dark;
//   ctx.textAlign = "center";
//   fitFont(ctx, student.full_name, CARD_W - 72, 36, 22, "bold", FONT);
//   y = wrapText(ctx, student.full_name, cx, y, CARD_W - 72, 44) + 16;

//   // Index number pill
//   y += 32;
//   ctx.font = `bold 26px "Courier New", monospace`;
//   const idW = ctx.measureText(student.index_number).width + 44;
//   fillRR(ctx, cx - idW / 2, y - 24, idW, 36, 20, C.white);
//   ctx.fillStyle = C.dark;
//   ctx.fillText(student.index_number, cx, y);
//   y += 22;

//   // Programme & Level chips
//   y += 26;
//   const chipFont = `18px ${FONT}`;
// //   const chipFont =`bold 24px "Courier New", monospace`;
//   ctx.font = chipFont;
//   const labels = [student.programme_name, student.level_name];
//   const chipGap = 12;
//   const chipH = 30;
//   const totalChipW = labels.reduce((s, t) => {
//     ctx.font = chipFont;
//     return s + ctx.measureText(t).width + 32;
//   }, 0) + chipGap * (labels.length - 1);
//   let chipX = cx - totalChipW / 2;
//   for (const label of labels) {
//     ctx.font = chipFont;
//     const tw = ctx.measureText(label).width + 32;
//     fillRR(ctx, chipX, y - chipH + 6, tw, chipH, chipH / 2, C.white);
//     ctx.fillStyle = C.dark;
//     ctx.textAlign = "left";
//     ctx.fillText(label, chipX + 16, y);
//     chipX += tw + chipGap;
//   }
//   ctx.textAlign = "center";

//   // ── Footer ──────────────────────────────────────────────────────────────
//   const FTR_Y = CARD_H - 58;
//   ctx.fillStyle = linGrad(ctx, 0, FTR_Y, 0, CARD_H,
//     [0, C.headerBot], [1, C.headerTop]);
//   ctx.fillRect(0, FTR_Y, CARD_W, 58);
//   ctx.fillStyle = C.white;
//   ctx.font = `14px ${FONT}`;
//   ctx.fillText("FOR OFFICIAL EXAMINATION USE ONLY", cx, CARD_H - 20);

//   return canvas;
// }

// // ── BACK ──────────────────────────────────────────────────────────────────
// function drawBack(institutionName, contactPhone, contactEmail) {
//   const canvas = document.createElement("canvas");
//   canvas.width  = CARD_W;
//   canvas.height = CARD_H;
//   const ctx = canvas.getContext("2d");
//   const cx  = CARD_W / 2;
//   const PAD = 48;
//   const FONT = "Arial, sans-serif";

//   // White base
//   ctx.fillStyle = C.white;
//   ctx.fillRect(0, 0, CARD_W, CARD_H);

//   // ── Header ──────────────────────────────────────────────────────────────
//   const HDR = 168;
//   ctx.fillStyle = linGrad(ctx, 0, 0, 0, HDR, [0, C.headerTop], [1, C.headerBot]);
//   ctx.fillRect(0, 0, CARD_W, HDR);
//   stripes(ctx, 0, 0, CARD_W, HDR);

//   ctx.fillStyle = C.white;
//   ctx.textAlign = "center";
//   fitFont(ctx, institutionName, CARD_W - 64, 34, 20, "bold", FONT);
//   ctx.fillText(institutionName, cx, 60);

//   ctx.fillStyle = "rgba(255,255,255,0.22)";
//   ctx.fillRect(56, 74, CARD_W - 112, 1);

//   ctx.fillStyle = "rgba(255,255,255,0.68)";
//   ctx.font = `19px ${FONT}`;
//   ctx.fillText("STUDENT EXAMINATION CARD", cx, 106);
//   ctx.font = `15px ${FONT}`;
//   ctx.fillText("PROPERTY OF THE INSTITUTION", cx, 136);

//   // ── Disclaimer ──────────────────────────────────────────────────────────
//   let y = HDR + 42;
//   ctx.textAlign = "left";

//   // Section heading
//   ctx.fillStyle = C.teal;
//   ctx.font = `bold 19px ${FONT}`;
//   ctx.fillText("IMPORTANT NOTICE", PAD, y);
//   y += 14;
//   ctx.fillStyle = C.teal;
//   ctx.fillRect(PAD, y, CARD_W - PAD * 2, 2);
//   y += 26;

//   const disclaimer = [
//     "This card is the property of",
//     `${institutionName}`,
//     "and must be surrendered upon request by an authorised officer.",
//     "",
//     "This card is strictly non-transferable and is valid only for",
//     "the holder named on the front.",
//     "Misuse of this card may result in disciplinary action,",
//     "including suspension or exclusion from examinations.",
//     "",
//     "If found, please return to the Academic Office.",
//   ];

//   ctx.fillStyle = C.gray;
//   ctx.font = `20px ${FONT}`;
//   for (const line of disclaimer) {
//     if (line === "") { y += 10; continue; }
//     ctx.fillText(line, PAD, y);
//     y += 32;
//   }

//   // ── Contact box ─────────────────────────────────────────────────────────
//   y += 20;
//   const BOX_H = 130;
//   fillRR(ctx, PAD - 10, y - 10, CARD_W - PAD * 2 + 20, BOX_H, 10, C.tealAlpha);

//   ctx.fillStyle = C.teal;
//   ctx.font = `bold 18px ${FONT}`;
//   ctx.fillText("CONTACT", PAD, y + 18);

//   ctx.fillStyle = C.tealMuted;
//   ctx.fillRect(PAD, y + 26, CARD_W - PAD * 2, 1);

//   ctx.fillStyle = C.gray;
//   ctx.font = `19px ${FONT}`;
//   ctx.fillText(`📞  ${contactPhone}`, PAD, y + 62);
//   ctx.fillText(`✉   ${contactEmail}`, PAD, y + 96);

//   // ── Footer ──────────────────────────────────────────────────────────────
//   const FTR_Y = CARD_H - 58;
//   ctx.fillStyle = linGrad(ctx, 0, FTR_Y, 0, CARD_H,
//     [0, C.headerBot], [1, C.headerTop]);
//   ctx.fillRect(0, FTR_Y, CARD_W, 58);
//   ctx.fillStyle = C.white;
//   ctx.font = `13px ${FONT}`;
//   ctx.textAlign = "center";
//   // Truncate long footer text
//   const footerText = `${institutionName.toUpperCase()} · EXAMINATIONS OFFICE`;
//   fitFont(ctx, footerText, CARD_W - 40, 13, 10, "normal", FONT);
//   ctx.fillText(footerText, cx, CARD_H - 20);

//   return canvas;
// }

// // ── Public API ────────────────────────────────────────────────────────────
// /**
//  * @param {object} student         – { index_number, full_name, programme_name, level_name }
//  * @param {string} qrUrl           – URL of the QR code image
//  * @param {object} [options]
//  * @param {string} options.institutionName
//  * @param {string} options.contactPhone
//  * @param {string} options.contactEmail
//  * @returns {Promise<string>}       – PNG data-URL (front + back on one sheet)
//  */
// export async function generateStudentCard(student, qrUrl, options = {}) {
//   const {
//     institutionName = "YOUR INSTITUTION",
//     contactPhone    = "+233 XX XXX XXXX",
//     contactEmail    = "exams@institution.edu.gh",
//   } = options;

//   const qrImg = await fetchImage(qrUrl);

//   const front = drawFront(student, qrImg, institutionName);
//   const back  = drawBack(institutionName, contactPhone, contactEmail);

//   // ── Combine: front | gap | back on one printable sheet ──────────────────
//   const GAP    = 50;
//   const MARGIN = 44;
//   const LABEL  = 34;

//   const sheet = document.createElement("canvas");
//   sheet.width  = MARGIN * 2 + CARD_W * 2 + GAP;
//   sheet.height = MARGIN * 2 + LABEL + CARD_H;
//   const ctx = sheet.getContext("2d");

//   // Sheet background
//   ctx.fillStyle = C.sheet;
//   ctx.fillRect(0, 0, sheet.width, sheet.height);

//   // Column labels
//   ctx.fillStyle = "#94a3b8";
//   ctx.font      = "bold 18px Arial, sans-serif";
//   ctx.textAlign = "center";
//   ctx.fillText("◀ FRONT ▶", MARGIN + CARD_W / 2, MARGIN + 22);
//   ctx.fillText("◀  BACK  ▶", MARGIN + CARD_W + GAP + CARD_W / 2, MARGIN + 22);

//   // Dashed cut-line borders
//   const cardY = MARGIN + LABEL;
//   function dashedBorder(x, y, w, h) {
//     ctx.setLineDash([8, 5]);
//     ctx.strokeStyle = C.rule;
//     ctx.lineWidth   = 1.5;
//     ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
//     ctx.setLineDash([]);
//   }
//   dashedBorder(MARGIN, cardY, CARD_W, CARD_H);
//   dashedBorder(MARGIN + CARD_W + GAP, cardY, CARD_W, CARD_H);

//   // Draw front and back
//   ctx.drawImage(front, MARGIN, cardY);
//   ctx.drawImage(back,  MARGIN + CARD_W + GAP, cardY);

//   // Cut-line label between the two cards
//   ctx.save();
//   ctx.translate(MARGIN + CARD_W + GAP / 2, cardY + CARD_H / 2);
//   ctx.rotate(-Math.PI / 2);
//   ctx.fillStyle = "#94a3b8";
//   ctx.font      = "12px Arial, sans-serif";
//   ctx.textAlign = "center";
//   ctx.fillText("✂  CUT LINE", 0, 0);
//   ctx.restore();

//   return sheet.toDataURL("image/png");
// }

/**
 * generateStudentCard.js
 *
 * Generates a printable 54×85 mm double-sided student ID/exam card.
 * Returns a data-URL PNG (front + back side-by-side on one sheet).
 *
 * Internal drawing helpers are exported so generateBulkStudentCards.js
 * can reuse them without duplicating any rendering logic.
 */

// ── Card dimensions @ 300 DPI ─────────────────────────────────────────────
//   54 mm × (300 / 25.4)  ≈  638 px
//   85 mm × (300 / 25.4)  ≈ 1004 px
export const CARD_W = 638;
export const CARD_H = 1004;

// ── Palette ───────────────────────────────────────────────────────────────
export const C = {
  headerTop: "#0b4444",
  headerBot: "#0d9488",
  teal: "#0d9488",
  tealAlpha: "rgba(13,148,136,0.11)",
  tealMuted: "rgba(13,148,136,0.35)",
  white: "#ffffff",
  dark: "#0f172a",
  gray: "#5a6b7e",
  sheet: "#f1f5f9",
  rule: "#cbd5e1",
};

// ── Helpers ───────────────────────────────────────────────────────────────
export function linGrad(ctx, x1, y1, x2, y2, ...stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(([p, c]) => g.addColorStop(p, c));
  return g;
}

export function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

export function fillRR(ctx, x, y, w, h, r, fill) {
  ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
}

/** Shrinks font until text fits within maxW. Returns the final size. */
export function fitFont(ctx, text, maxW, basePx, minPx, weight, family) {
  let sz = basePx;
  ctx.font = `${weight} ${sz}px ${family}`;
  while (ctx.measureText(text).width > maxW && sz > minPx) {
    sz -= 1;
    ctx.font = `${weight} ${sz}px ${family}`;
  }
  return sz;
}

/** Wraps text into multiple lines; returns final Y after last line. */
export function wrapText(ctx, text, x, y, maxW, lineH) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, curY);
      line = word;
      curY += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, curY);
  return curY;
}

/** Diagonal stripe texture on a rectangle (very subtle). */
export function stripes(ctx, x, y, w, h) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.strokeStyle = "rgba(255,255,255,0.045)";
  ctx.lineWidth = 14;
  for (let i = x - h; i < x + w + h; i += 28) {
    ctx.beginPath();
    ctx.moveTo(i, y);
    ctx.lineTo(i + h, y + h);
    ctx.stroke();
  }
  ctx.restore();
}

/** Fetch image via blob URL to avoid canvas CORS tainting. */
export function fetchImage(url) {
  return fetch(url)
    .then((r) => r.blob())
    .then(
      (blob) =>
        new Promise((res, rej) => {
          const bUrl = URL.createObjectURL(blob);
          const img = new Image();
          img.onload = () => {
            URL.revokeObjectURL(bUrl);
            res(img);
          };
          img.onerror = rej;
          img.src = bUrl;
        }),
    );
}

// ── FRONT ─────────────────────────────────────────────────────────────────
export function drawFront(student, qrImg, institutionName) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  const cx = CARD_W / 2;
  const FONT = "Arial, sans-serif";

  // White base
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ── Header ──────────────────────────────────────────────────────────────
  const HDR = 210;
  ctx.fillStyle = linGrad(
    ctx,
    0,
    0,
    0,
    HDR,
    [0, C.headerTop],
    [1, C.headerBot],
  );
  ctx.fillRect(0, 0, CARD_W, HDR);
  stripes(ctx, 0, 0, CARD_W, HDR);

  // Institution name
  ctx.fillStyle = C.white;
  ctx.textAlign = "center";
  fitFont(ctx, institutionName, CARD_W - 64, 38, 22, "bold", FONT);
  ctx.fillText(institutionName, cx, 70);

  // Rule
  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(56, 86, CARD_W - 112, 1);

  // Subtitle
  ctx.fillStyle = "rgba(255,255,255,0.70)";
  ctx.font = `20px ${FONT}`;
  ctx.fillText("STUDENT EXAMINATION CARD", cx, 120);

  // Year pill (commented out as per user's styling)
  //   fillRR(ctx, cx - 108, 138, 216, 34, 8, "rgba(255,255,255,0.13)");
  //   ctx.fillStyle = "rgba(255,255,255,0.65)";
  //   ctx.font = `bold 16px ${FONT}`;
  //   ctx.fillText("2024 / 2025 ACADEMIC YEAR", cx, 160);

  // ── QR Code ─────────────────────────────────────────────────────────────
  const QR_SZ = 318;
  const QR_PAD = 18;
  const QR_X = cx - QR_SZ / 2;
  const QR_Y = HDR + 46;

  // Shadow + white card
  ctx.shadowColor = "rgba(0,0,0,0.13)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  fillRR(
    ctx,
    QR_X - QR_PAD,
    QR_Y - QR_PAD,
    QR_SZ + QR_PAD * 2,
    QR_SZ + QR_PAD * 2,
    18,
    C.white,
  );
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.drawImage(qrImg, QR_X, QR_Y, QR_SZ, QR_SZ);

  // ── Student info ─────────────────────────────────────────────────────────
  let y = QR_Y + QR_SZ + QR_PAD * 2 + 30;

  // Teal accent bar (commented out as per user's styling)
  //   fillRR(ctx, cx - 28, y, 56, 5, 3, C.teal);
  y += 32;

  // Full name (wraps if needed)
  ctx.fillStyle = C.dark;
  ctx.textAlign = "center";
  fitFont(ctx, student.full_name, CARD_W - 72, 36, 22, "bold", FONT);
  y = wrapText(ctx, student.full_name, cx, y, CARD_W - 72, 44) + 16;

  // Index number pill
  y += 32;
  // ctx.font = `bold 32px "Courier New", monospace`;
  ctx.font = `32px ${FONT}`;
  const idW = ctx.measureText(student.index_number).width + 44;
  fillRR(ctx, cx - idW / 2, y - 24, idW, 36, 20, C.white);
  ctx.fillStyle = C.dark;
  ctx.fillText(student.index_number, cx, y);
  y += 22;

  // Programme & Level chips
  y += 26;
  const chipFont = `32px ${FONT}`;
  // const chipFont = `bold 32px "Courier New", monospace`;
  ctx.font = chipFont;
  const labels = [student.programme_name, student.level_name];
  const chipGap = 12;
  const chipH = 30;
  const totalChipW =
    labels.reduce((s, t) => {
      ctx.font = chipFont;
      return s + ctx.measureText(t).width + 32;
    }, 0) +
    chipGap * (labels.length - 1);
  let chipX = cx - totalChipW / 2;
  for (const label of labels) {
    ctx.font = chipFont;
    const tw = ctx.measureText(label).width + 32;
    fillRR(ctx, chipX, y - chipH + 6, tw, chipH, chipH / 2, C.white);
    ctx.fillStyle = C.dark;
    ctx.textAlign = "left";
    ctx.fillText(label, chipX + 16, y);
    chipX += tw + chipGap;
  }
  ctx.textAlign = "center";

  // ── Footer ──────────────────────────────────────────────────────────────
  const FTR_Y = CARD_H - 58;
  ctx.fillStyle = linGrad(
    ctx,
    0,
    FTR_Y,
    0,
    CARD_H,
    [0, C.headerBot],
    [1, C.headerTop],
  );
  ctx.fillRect(0, FTR_Y, CARD_W, 58);
  ctx.fillStyle = C.white;
  ctx.font = `14px ${FONT}`;
  ctx.fillText("FOR OFFICIAL EXAMINATION USE ONLY", cx, CARD_H - 20);

  return canvas;
}

// ── BACK ──────────────────────────────────────────────────────────────────
export function drawBack(institutionName, contactPhone, contactEmail) {
  const canvas = document.createElement("canvas");
  canvas.width = CARD_W;
  canvas.height = CARD_H;
  const ctx = canvas.getContext("2d");
  const cx = CARD_W / 2;
  const PAD = 48;
  const FONT = "Arial, sans-serif";

  // White base
  ctx.fillStyle = C.white;
  ctx.fillRect(0, 0, CARD_W, CARD_H);

  // ── Header ──────────────────────────────────────────────────────────────
  const HDR = 168;
  ctx.fillStyle = linGrad(
    ctx,
    0,
    0,
    0,
    HDR,
    [0, C.headerTop],
    [1, C.headerBot],
  );
  ctx.fillRect(0, 0, CARD_W, HDR);
  stripes(ctx, 0, 0, CARD_W, HDR);

  ctx.fillStyle = C.white;
  ctx.textAlign = "center";
  fitFont(ctx, institutionName, CARD_W - 64, 34, 20, "bold", FONT);
  ctx.fillText(institutionName, cx, 60);

  ctx.fillStyle = "rgba(255,255,255,0.22)";
  ctx.fillRect(56, 74, CARD_W - 112, 1);

  ctx.fillStyle = "rgba(255,255,255,0.68)";
  ctx.font = `19px ${FONT}`;
  ctx.fillText("STUDENT EXAMINATION CARD", cx, 106);
  ctx.font = `15px ${FONT}`;
  ctx.fillText("PROPERTY OF THE INSTITUTION", cx, 136);

  // ── Disclaimer ──────────────────────────────────────────────────────────
  let y = HDR + 42;
  ctx.textAlign = "left";

  // Section heading
  ctx.fillStyle = C.teal;
  ctx.font = `bold 19px ${FONT}`;
  ctx.fillText("IMPORTANT NOTICE", PAD, y);
  y += 14;
  ctx.fillStyle = C.teal;
  ctx.fillRect(PAD, y, CARD_W - PAD * 2, 2);
  y += 26;

  const disclaimer = [
    "This card is the property of",
    `${institutionName}`,
    "and must be surrendered upon request by an authorised officer.",
    "",
    "This card is strictly non-transferable and is valid only for",
    "the holder named on the front.",
    "Misuse of this card may result in disciplinary action,",
    "including suspension or exclusion from examinations.",
    "",
    "If found, please return to the Academic Office.",
  ];

  ctx.fillStyle = C.gray;
  ctx.font = `20px ${FONT}`;
  for (const line of disclaimer) {
    if (line === "") {
      y += 10;
      continue;
    }
    ctx.fillText(line, PAD, y);
    y += 32;
  }

  // ── Contact box ─────────────────────────────────────────────────────────
  y += 20;
  const BOX_H = 130;
  fillRR(ctx, PAD - 10, y - 10, CARD_W - PAD * 2 + 20, BOX_H, 10, C.tealAlpha);

  ctx.fillStyle = C.teal;
  ctx.font = `bold 18px ${FONT}`;
  ctx.fillText("CONTACT", PAD, y + 18);

  ctx.fillStyle = C.tealMuted;
  ctx.fillRect(PAD, y + 26, CARD_W - PAD * 2, 1);

  ctx.fillStyle = C.gray;
  ctx.font = `19px ${FONT}`;
  ctx.fillText(`📞  ${contactPhone}`, PAD, y + 62);
  ctx.fillText(`✉   ${contactEmail}`, PAD, y + 96);

  // ── Footer ──────────────────────────────────────────────────────────────
  const FTR_Y = CARD_H - 58;
  ctx.fillStyle = linGrad(
    ctx,
    0,
    FTR_Y,
    0,
    CARD_H,
    [0, C.headerBot],
    [1, C.headerTop],
  );
  ctx.fillRect(0, FTR_Y, CARD_W, 58);
  ctx.fillStyle = C.white;
  ctx.font = `13px ${FONT}`;
  ctx.textAlign = "center";
  const footerText = `${institutionName.toUpperCase()} · EXAMINATIONS OFFICE`;
  fitFont(ctx, footerText, CARD_W - 40, 13, 10, "normal", FONT);
  ctx.fillText(footerText, cx, CARD_H - 20);

  return canvas;
}

// ── Public API ────────────────────────────────────────────────────────────
/**
 * @param {object} student         – { index_number, full_name, programme_name, level_name }
 * @param {string} qrUrl           – URL of the QR code image
 * @param {object} [options]
 * @param {string} options.institutionName
 * @param {string} options.contactPhone
 * @param {string} options.contactEmail
 * @returns {Promise<string>}       – PNG data-URL (front + back on one sheet)
 */
export async function generateStudentCard(student, qrUrl, options = {}) {
  const {
    institutionName = "COLLEGE OF NURSING AND MIDWIFERY, TANOSO-AHAFO",
    contactPhone = "+233 123 456 789",
    contactEmail = "exams@institution.edu.gh",
  } = options;

  const qrImg = await fetchImage(qrUrl);

  const front = drawFront(student, qrImg, institutionName);
  const back = drawBack(institutionName, contactPhone, contactEmail);

  // ── Combine: front | gap | back on one printable sheet ──────────────────
  const GAP = 50;
  const MARGIN = 44;
  const LABEL = 34;

  const sheet = document.createElement("canvas");
  sheet.width = MARGIN * 2 + CARD_W * 2 + GAP;
  sheet.height = MARGIN * 2 + LABEL + CARD_H;
  const ctx = sheet.getContext("2d");

  // Sheet background
  ctx.fillStyle = C.sheet;
  ctx.fillRect(0, 0, sheet.width, sheet.height);

  // Column labels
  ctx.fillStyle = "#94a3b8";
  ctx.font = "bold 18px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("◀ FRONT ▶", MARGIN + CARD_W / 2, MARGIN + 22);
  ctx.fillText("◀  BACK  ▶", MARGIN + CARD_W + GAP + CARD_W / 2, MARGIN + 22);

  // Dashed cut-line borders
  const cardY = MARGIN + LABEL;
  function dashedBorder(x, y, w, h) {
    ctx.setLineDash([8, 5]);
    ctx.strokeStyle = C.rule;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x - 3, y - 3, w + 6, h + 6);
    ctx.setLineDash([]);
  }
  dashedBorder(MARGIN, cardY, CARD_W, CARD_H);
  dashedBorder(MARGIN + CARD_W + GAP, cardY, CARD_W, CARD_H);

  // Draw front and back
  ctx.drawImage(front, MARGIN, cardY);
  ctx.drawImage(back, MARGIN + CARD_W + GAP, cardY);

  // Cut-line label between the two cards
  ctx.save();
  ctx.translate(MARGIN + CARD_W + GAP / 2, cardY + CARD_H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillStyle = "#94a3b8";
  ctx.font = "12px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✂  CUT LINE", 0, 0);
  ctx.restore();

  return sheet.toDataURL("image/png");
}
