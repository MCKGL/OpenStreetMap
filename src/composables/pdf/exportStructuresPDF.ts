import autoTable from "jspdf-autotable";
import type {StructureModel} from "@/models/Structure.model.ts";
import type {AdresseModel} from "@/models/Adresse.model.ts";
import {addPdfHeaderAndFooter, createBasePDF} from "@/utils/pdf.ts";

export function exportStructuresPDF(
  structures: StructureModel[],
  filters: Record<string, unknown>
) {

  const { doc, startY } = createBasePDF({
    title: "RESULTATS DE MA RECHERCHE DE STRUCTURE",
    infoLines: [
      "Certaines structures ont renseigné les détails de leurs cours (jours, public,...), pour les connaitre, consulter les résultats de 'formations'.",
      "Sinon, contactez les structures directement."
    ],
    resultCount: structures.length,
    filters: filters,
  });

  // tableau des structures
  autoTable(doc, {
    startY: startY, // Position de départ du tableau sur la première page
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
    margin: {top: 35, bottom: 20, left: 10, right: 10},
  });

  const totalPages = (doc.internal as any).getNumberOfPages();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    // On utilise la fonction pour ajouter le header et le footer
    addPdfHeaderAndFooter(doc, i, totalPages);
  }

  doc.save("structures.pdf");
}
