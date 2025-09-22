import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { StructureModel } from "@/models/Structure.model.ts";
import type {AdresseModel} from "@/models/Adresse.model.ts";

export function exportStructuresPDF(
  formations: StructureModel[],
  filters: Record<string, unknown>
) {
  const doc = new jsPDF();

  // titre
  doc.setFontSize(18);
  doc.text("Résultats de recherche - Structures", 14, 15);

  // date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Généré le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 22);

  // filtres appliqués (en résumé au-dessus du tableau)
  let y = 30;
  const filtresActifs = Object.entries(filters)
    .filter(([v]) => v && (Array.isArray(v) ? v.length > 0 : true))
    .map(([k, v]) => `- ${k} : ${Array.isArray(v) ? v.join(", ") : v}`);

  if (filtresActifs.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text("Critères de recherche sélectionnés :", 14, y);
    y += 7;
    filtresActifs.forEach((f) => {
      doc.text(f, 16, y);
      y += 6;
    });
    y += 8; // un petit espace avant le tableau
  }

  // tableau des formations
  autoTable(doc, {
    startY: y,
    head: [["Nom", "l'activité de la formation", "adresses"]],
    body: formations.map((s) => [
      s.nom || "-",
      Array.isArray(s.activitesFormation) ? s.activitesFormation.join(", ") : "-",
      Array.isArray(s.adresses)
        ? s.adresses
          .map((a: AdresseModel) => {
            const parts = [];
            if (a.numero) parts.push(a.numero);
            if (a.voie) parts.push(a.voie);
            if (a.ville) parts.push(a.ville);
            return parts.join(", ");
          })
          .join("\n")
        : "-",
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 35 }, // Nom
      2: { cellWidth: 40 }, // L'activité de la formation
      3: { cellWidth: 40 }, // Adresses
    },
  });

  // téléchargement
  doc.save("structures.pdf");
}
