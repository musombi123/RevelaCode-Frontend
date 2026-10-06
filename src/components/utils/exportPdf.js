// Turns a markdown answer into a clean, multi-page A4 PDF.

const clean = (value = "") =>
  String(value)
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/[\u2192\u21D2]/g, "->")
    .replace(/\t/g, "    ")
    // Standard PDF fonts only cover Latin text; drop what they can't draw
    .replace(/[^\n\x20-\x7E\xA0-\xFF\u2022]/g, "");

// Remove inline markdown so the PDF doesn't show raw ** or ` marks
const plain = (line) =>
  clean(line)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/__([^_]+)__/g, "$1")
    .replace(/(^|\s)\*([^*\n]+)\*(?=\s|$|[.,;:!?])/g, "$1$2")
    .replace(/`([^`]+)`/g, "$1");

const slug = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "response";

export async function downloadAsPdf(markdown, { filename } = {}) {
  const { jsPDF } = await import("jspdf");

  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 54;
  const contentW = pageW - margin * 2;

  let y = margin;

  const ensureSpace = (height) => {
    if (y + height > pageH - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const write = (
    text,
    { size = 11, style = "normal", font = "helvetica", indent = 0, color = [30, 30, 30], after = 4 } = {}
  ) => {
    doc.setFont(font, style);
    doc.setFontSize(size);
    doc.setTextColor(...color);

    const lineHeight = size * 1.45;
    const lines = doc.splitTextToSize(text, contentW - indent);

    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, margin + indent, y + size);
      y += lineHeight;
    }

    y += after;
  };

  /* ---------- Header ---------- */

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(10, 116, 218); // Revela Blue
  doc.text("Revela", margin, y + 14);

  const revelaWidth = doc.getTextWidth("Revela");
  doc.setTextColor(46, 139, 87); // Emerald
  doc.text("AI", margin + revelaWidth + 1, y + 14);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(
    new Date().toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }),
    pageW - margin,
    y + 14,
    { align: "right" }
  );

  y += 26;
  doc.setDrawColor(220, 220, 220);
  doc.line(margin, y, pageW - margin, y);
  y += 16;

  /* ---------- Body ---------- */

  const lines = String(markdown || "").replace(/\r\n/g, "\n").split("\n");
  let inCode = false;
  let firstHeading = "";

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");

    // Code fences
    if (/^```/.test(line.trim())) {
      inCode = !inCode;
      if (!inCode) y += 6;
      continue;
    }

    if (inCode) {
      const size = 9;
      const height = size * 1.45;
      const wrapped = doc.splitTextToSize(clean(line) || " ", contentW - 16);

      doc.setFont("courier", "normal");
      doc.setFontSize(size);

      for (const part of wrapped) {
        ensureSpace(height);
        doc.setFillColor(243, 244, 246);
        doc.rect(margin, y, contentW, height, "F");
        doc.setTextColor(40, 40, 40);
        doc.text(part, margin + 8, y + size);
        y += height;
      }
      continue;
    }

    if (!line.trim()) {
      y += 6;
      continue;
    }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      ensureSpace(12);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y + 4, pageW - margin, y + 4);
      y += 12;
      continue;
    }

    // Headings
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      const level = heading[1].length;
      const size = level === 1 ? 18 : level === 2 ? 15 : 12.5;
      const text = plain(heading[2]);
      if (!firstHeading) firstHeading = text;

      y += level === 1 ? 6 : 4;
      write(text, { size, style: "bold", color: [15, 27, 45], after: 4 });
      continue;
    }

    // Table separator rows (| --- | --- |)
    if (/^\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?$/.test(line.trim())) {
      continue;
    }

    // Table rows
    if (/^\|.*\|$/.test(line.trim())) {
      const cells = line.trim().slice(1, -1).split("|").map((cell) => plain(cell.trim()));
      write(cells.join("   |   "), { size: 10, font: "courier", after: 2 });
      continue;
    }

    // Blockquote
    const quote = /^>\s?(.*)$/.exec(line);
    if (quote) {
      write(plain(quote[1]), { style: "italic", color: [90, 90, 90], indent: 12, after: 3 });
      continue;
    }

    // Bullets
    const bullet = /^(\s*)[-*+]\s+(.*)$/.exec(line);
    if (bullet) {
      const depth = Math.min(Math.floor(bullet[1].length / 2), 3);
      write(`\u2022  ${plain(bullet[2])}`, { indent: 12 + depth * 14, after: 2 });
      continue;
    }

    // Numbered list
    const numbered = /^(\s*)(\d+)[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      const depth = Math.min(Math.floor(numbered[1].length / 2), 3);
      write(`${numbered[2]}.  ${plain(numbered[3])}`, { indent: 12 + depth * 14, after: 2 });
      continue;
    }

    // Normal paragraph
    write(plain(line), { after: 4 });
  }

  /* ---------- Footer: page numbers ---------- */

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text("Generated by RevelaAI", margin, pageH - 26);
    doc.text(`Page ${page} of ${pages}`, pageW - margin, pageH - 26, { align: "right" });
  }

  doc.save(`${filename || `revelaai-${slug(firstHeading)}`}.pdf`);
}