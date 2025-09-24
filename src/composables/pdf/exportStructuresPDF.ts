import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type {StructureModel} from "@/models/Structure.model.ts";
import type {AdresseModel} from "@/models/Adresse.model.ts";
import {addPdfHeaderAndFooter} from "@/utils/pdf.ts";

export function exportStructuresPDF(
  structures: StructureModel[],
  filters: Record<string, unknown>
) {
  const doc = new jsPDF('landscape');

  const pageWidth = doc.internal.pageSize.getWidth();

  const logoHeight = 25; // Hauteur du logo
  const logoY = 5; // Position Y du logo
  const headerSpace = logoY + logoHeight + 8; // Espace total pris par le header (logo + marge)

  let y = headerSpace;

  // titre
  doc.setFontSize(18);
  const title = "RESULTATS DE MA RECHERCHE DE STRUCTURE";
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, (pageWidth - titleWidth) / 2, y);
  y += 7;

  // date
  doc.setFontSize(9);
  doc.setTextColor(100);
  const dateText = `Généré le : ${new Date().toLocaleDateString("fr-FR")}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, (pageWidth - dateWidth) / 2, y);
  y += 7;

  // info
  doc.setFontSize(9);
  doc.setTextColor(100);
  const textInfoLines = [
    "Certaines structures ont renseigné les détails de leurs cours (jours, public,...), pour les connaitre, consulter les résultats de 'formations'.",
    "Sinon, contactez les structures directement."
  ];
  let infoY = y;
  textInfoLines.forEach(line => {
    const lineWidth = doc.getTextWidth(line);
    doc.text(line, (pageWidth - lineWidth) / 2, infoY);
    infoY += 6;
  });
  y = infoY;

  // filtres appliqués (en résumé au-dessus du tableau)
  y += 4;
  const filtresActifs = Object.entries(filters)
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
  const resultText = `${structures.length} structures`;
  const resultTextWidth = doc.getTextWidth(resultText);
  doc.text(resultText, (pageWidth - resultTextWidth) / 2, y);
  y += 5;

  // tableau des structures
  autoTable(doc, {
    startY: y, // Position de départ du tableau sur la première page
    head: [["N°", "Structure", "Lieux", "Coordonnées", "Objectifs visés"]],
    body: structures.map((s, i) => [
      i + 1,
      s.nom || "-",
      Array.isArray(s.adresses)
        ? s.adresses
          .map((a: AdresseModel) => {
            const parts: string[] = [];
            if (a.numero) parts.push(a.numero);
            if (a.voie) parts.push(a.voie);
            if (a.ville) parts.push(a.ville);
            return `- ${parts.join(", ")}`;
          })
          .join("\n")
        : "-",
      "", //TODO coordonnées
      Array.isArray(s.activitesFormation)
        ? s.activitesFormation.map(a => `- ${a}`).join("\n")
        : "-"
    ]),
    styles: {fontSize: 9},
    headStyles: {fillColor: [7, 141, 204]},
    columnStyles: {
      0: {cellWidth: 10},
      1: {cellWidth: 50},
    },
    margin: {top: headerSpace, bottom: 20, left: 10, right: 10},
  });

  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // On utilise la fonction pour ajouter le header et le footer
    addPdfHeaderAndFooter(doc, i, totalPages);
  }

  doc.save("structures.pdf");
}
