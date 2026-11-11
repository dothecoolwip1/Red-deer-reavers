import { qrBadge, qrRuns } from "./qr-svg";

/**
 * A one-page vector PDF of a QR code, for Illustrator and print shops: the squares are real vector shapes, so it
 * scales to any size without blurring. The crest is placed as an image. Loads jsPDF only when someone asks for one.
 */
export async function qrPdf(text: string, { logo, transparent = false, inches = 4 }: { logo: string | null; transparent?: boolean; inches?: number }): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const { size, runs } = qrRuns(text, { logo: Boolean(logo) });
  const page = inches * 72;
  const m = page / size; // points per module
  const doc = new jsPDF({ unit: "pt", format: [page, page], compress: true });
  if (!transparent) { doc.setFillColor(255, 255, 255); doc.rect(0, 0, page, page, "F"); }
  doc.setFillColor(0, 0, 0);
  for (const [x, y, w] of runs) doc.rect(x * m, y * m, w * m, m, "F");
  if (logo) {
    const { badge, at, pad } = qrBadge(size);
    if (!transparent) { doc.setFillColor(255, 255, 255); doc.roundedRect(at * m, at * m, badge * m, badge * m, badge * m * 0.18, badge * m * 0.18, "F"); }
    doc.addImage(logo, "PNG", (at + pad) * m, (at + pad) * m, (badge - 2 * pad) * m, (badge - 2 * pad) * m);
  }
  return doc.output("blob");
}
