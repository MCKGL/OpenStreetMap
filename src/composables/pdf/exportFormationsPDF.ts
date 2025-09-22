import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { formatDate } from "@/utils/formatText";
import type { FormationModel } from "@/models/Formation.model";

export function exportFormationsPDF(
  formations: FormationModel[],
  filters: Record<string, unknown>
) {
  const doc = new jsPDF();

  // titre
  doc.setFontSize(18);
  doc.text("Résultats de recherche - Formations", 14, 15);

  // date
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Généré le : ${new Date().toLocaleDateString("fr-FR")}`, 14, 22);

  // filtres appliqués (en résumé au-dessus du tableau)
  let y = 30;
  const filtresActifs = Object.entries(filters)
    .filter(([ v]) => v && (Array.isArray(v) ? v.length > 0 : true))
    .map(([k, v]) => `- ${k} : ${Array.isArray(v) ? v.join(", ") : v}`);

  if (filtresActifs.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(50);
    doc.text("Critères de recherche sélectionnés :", 14, y);
    y += 7;
    filtresActifs.forEach(f => {
      doc.text(f, 16, y);
      y += 6;
    });
    y += 8; // un petit espace avant le tableau
  }

  // tableau des formations
  autoTable(doc, {
    startY: y,
    head: [["Nom", "Publics", "Niveaux", "Places", "Dates"]],
    body: formations.map(f => [
      f.nom || "-",
      Array.isArray(f.publicsSpecifiques)
        ? f.publicsSpecifiques.map(p => p.publicSpecifique).join(", ")
        : "-",
      Array.isArray(f.competencesLinguistiquesVisees)
        ? f.competencesLinguistiquesVisees.join(", ")
        : "-",
      f.placeDisponible ? "Oui" : "Non",
      `${formatDate(f.dateDebut) || "-"} - ${formatDate(f.dateFin) || "-"}`,
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 185] },
    columnStyles: {
      0: { cellWidth: 40 }, // Nom
      2: { cellWidth: 40 }, // Publics
      3: { cellWidth: 15 }, // Niveaux
      4: { cellWidth: 15 }, // Places
      5: { cellWidth: 40 }, // Dates
    },
  });

  // téléchargement
  doc.save("formations.pdf");
}
