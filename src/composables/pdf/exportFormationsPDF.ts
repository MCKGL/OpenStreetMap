import autoTable from "jspdf-autotable";
import {formatDate} from "@/utils/formatText";
import type {FormationModel} from "@/models/Formation.model";
import type {AdresseModel} from "@/models/Adresse.model.ts";
import {addPdfHeaderAndFooter, createBasePDF} from "@/utils/pdf";

export function exportFormationsPDF(
  formations: FormationModel[],
  filters: Record<string, unknown>
) {

  const { doc, startY } = createBasePDF({
    title: "RESULTATS DE MA RECHERCHE DE FORMATION",
    infoLines: [
      "Certaines structures interviennent sur ce territoire mais n'ont pas détaillé leurs cours. Vous pouvez trouver leurs coordonnées dans les résultats de 'structures'.",
      "La disponibilité des formations est mise à jour régulièrement par les stryctures membres de Réseau Alpha, n'hésitez pas à consulter le site prochainement."
    ],
    resultCount: formations.length,
    filters: filters,
  });

  // tableau des formations
  autoTable(doc, {
    startY: startY, // Position de départ du tableau sur la première page
    head: [["N°", "Formation", "Objectifs visés", "Profils et prérequis", "Type de public", "Lieux et horaires", "Contact inscription & Coût"]],
    body: formations.map((f, i) => [
      i + 1,
      [
        `Formation :\n${f.nom || "-"}`,
        `Proposer par :\n${f.structure?.nom || ""}`,
      ].join("\n\n"),
      Array.isArray(f.objectifsVises) && f.objectifsVises.length > 0
        ? f.objectifsVises.map(o => `- ${o.objectifVise}`).join("\n")
        : "-",
      Array.isArray(f.criteresScolarisation)
        ? f.criteresScolarisation.map(c => `- ${c}`).join("\n")
        : "-",
      Array.isArray(f.publicsSpecifiques)
        ? f.publicsSpecifiques.map(p => p.publicSpecifique).join("\n")
        : "-",
      [
        Array.isArray(f.adresses)
          ? f.adresses
            .map((a: AdresseModel) => {
              const parts: string[] = [];
              if (a.numero) parts.push(a.numero);
              if (a.voie) parts.push(a.voie);
              if (a.ville) parts.push(a.ville);
              return `- ${parts.join(", ")}`;
            })
            .join("\n")
          : "-",
        `${formatDate(f.dateDebut) || ""} - ${formatDate(f.dateFin) || ""}`,
        Array.isArray(f.joursHoraires)
          ? f.joursHoraires.map(j => `- ${j}`).join("\n")
          : "-",
      ].join("\n\n"),
      "" //TODO contact & coût
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

  doc.save("formations.pdf");
}
