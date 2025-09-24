import jsPDF from "jspdf";
import logoRA from "/images/header.png";

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
  doc.addImage(logoRA, 'PNG', (pageWidth - 120) / 2, logoY, 120, logoHeight);

  // FOOTER - Numéro de page
  doc.setFontSize(8);
  doc.setTextColor(150);
  const footerText = `Page ${pageNumber} sur ${totalPages}`;
  const footerWidth = doc.getTextWidth(footerText);
  const margin = 10;
  doc.text(footerText, pageWidth - footerWidth - margin, pageHeight - margin);
};
