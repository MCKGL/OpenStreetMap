import jsPDF from "jspdf";
import logoRA from "/images/header.png";
import html2pdf from "html2pdf.js";

interface PDFData {
  title: string;
  infoLines: string[];
  resultCount: number;
  filters: Record<string, unknown>;
  extraLabel?: string;
}

/**
 * Crée un document PDF de base "recherche" avec un en-tête, un titre, des informations,
 * les filtres appliqués et le nombre de résultats.
 * @param data
 */
export function createBasePDF(data: PDFData) {
  const doc = new jsPDF('landscape');
  const pageWidth = doc.internal.pageSize.getWidth();

  const logoHeight = 25;
  const logoY = 5;
  let y = logoY + logoHeight + 8;

  // Titre
  doc.setFontSize(18);
  const titleWidth = doc.getTextWidth(data.title);
  doc.text(data.title, (pageWidth - titleWidth) / 2, y);
  y += 7;

  // Date
  doc.setFontSize(9);
  doc.setTextColor(100);
  const dateText = `Généré le : ${new Date().toLocaleDateString("fr-FR")}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, (pageWidth - dateWidth) / 2, y);
  y += 7;

  // Info
  doc.setFontSize(9);
  doc.setTextColor(100);
  let infoY = y;
  data.infoLines.forEach(line => {
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, (pageWidth - lineWidth) / 2, infoY);
    infoY += 6;
  });
  y = infoY;

  // Filtres appliqués
  y += 4;
  const filtresActifs = Object.entries(data.filters)
    .filter(([v]) => v && (Array.isArray(v) ? v.length > 0 : true))
    .map(([k, v]) => `- ${k} : ${Array.isArray(v) ? v.join(", ") : v}`);

  if (filtresActifs.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(50);
    doc.text("Critères de recherche sélectionnés :", 14, y);
    y += 7;
    filtresActifs.forEach(f => {
      doc.text(f, 16, y);
      y += 6;
    });
    y += 5;
  }

  // Nombre de résultats
  doc.setFontSize(14);
  doc.setTextColor(50);
  const label = data.resultCount > 1
    ? data.title.toLowerCase().split(' ').pop() + 's'
    : data.title.toLowerCase().split(' ').pop();

  const resultText = `${data.resultCount} ${label}${data.extraLabel ? " " + data.extraLabel : ""}`;
  const resultTextWidth = doc.getTextWidth(resultText);
  doc.text(resultText, (pageWidth - resultTextWidth) / 2, y);
  y += 5;

  return { doc, startY: y };
}

/**
 * Ajoute un en-tête et un pied de page à chaque page du PDF.
 * @param doc
 * @param pageNumber
 * @param totalPages
 */
export const addPdfHeaderAndFooterOnTab = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const logoHeight = 25; // Hauteur du logo
  const logoY = 5; // Position Y du logo

  // HEADER
  doc.addImage(logoRA, 'PNG', (pageWidth - 120) / 2, logoY, 130, logoHeight);

  // FOOTER - Numéro de page
  doc.setFontSize(8);
  doc.setTextColor(150);
  const footerText = `Page ${pageNumber} sur ${totalPages}`;
  const footerWidth = doc.getTextWidth(footerText);
  const margin = 10;
  doc.text(footerText, pageWidth - footerWidth - margin, pageHeight - margin);

  // Texte à gauche
  const siteUrl = "https://www.reseau-alpha.org";
  doc.text(siteUrl, margin, pageHeight - margin);
};

/**
 * Génère un PDF à partir d'un élément HTML avec un en-tête et un pied de page sur chaque page.
 * Méthode pour les contenus HTML complexes (hors tabeaux pour carto).
 * @param element L'élément HTML à convertir en PDF.
 * @param filename Le nom du fichier PDF généré.
 * @param headerOffset
 */
export async function addPdfHeaderAndFooterOnHTML(
  element: HTMLElement,
  filename: string,
  headerOffset = 10 // espace sous le logo
) {
  const opt = {
    margin: [30 + headerOffset, 10, 20, 10],
    filename,
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    pagebreak: { mode: ["avoid-all", "css", "legacy"] },
  };

  // Génération PDF et récupération de l'instance jsPDF
  const pdf = await html2pdf().set(opt as any).from(element).toPdf().get("pdf");

  const totalPages = pdf.getNumberOfPages();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const logoHeight = 25;

  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);

    // HEADER : logo centré
    pdf.addImage(logoRA, "PNG", (pageWidth - 130) / 2, 5, 130, logoHeight);

    // FOOTER : numéro de page
    pdf.setFontSize(8);
    pdf.setTextColor(150);
    const footerText = `Page ${i} sur ${totalPages}`;
    pdf.text(footerText, pageWidth - pdf.getTextWidth(footerText) - margin, pageHeight - margin);

    // FOOTER : site web
    pdf.text("https://www.reseau-alpha.org", margin, pageHeight - margin);
  }

  pdf.save(filename);
}
