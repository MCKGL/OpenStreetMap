import jsPDF from "jspdf";
import logoRA from "/images/header.png";

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
export const addPdfHeaderAndFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
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


export const addPdfHeaderAndFooterFirstPage = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  // HEADER uniquement sur la première page
  if (pageNumber === 1) {
    const logoHeight = 25; // Hauteur du logo
    const logoY = 5; // Position Y du logo
    doc.addImage(logoRA, 'PNG', (pageWidth - 120) / 2, logoY, 130, logoHeight);
  }

  // FOOTER sur toutes les pages
  doc.setFontSize(8);
  doc.setTextColor(150);
  const footerText = `Page ${pageNumber} sur ${totalPages}`;
  const footerWidth = doc.getTextWidth(footerText);
  doc.text(footerText, pageWidth - footerWidth - margin, pageHeight - margin);

  // Texte à gauche
  const siteUrl = "https://www.reseau-alpha.org";
  doc.text(siteUrl, margin, pageHeight - margin);
};
