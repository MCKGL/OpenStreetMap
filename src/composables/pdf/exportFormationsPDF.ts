import autoTable from "jspdf-autotable";
import { formatDate } from "@/utils/formatText";
import type { FormationModel } from "@/models/Formation.model";
import type { AdresseModel } from "@/models/Adresse.model.ts";
import { addPdfHeaderAndFooter, createBasePDF } from "@/utils/pdf";
import type { ContactModel } from "@/models/Contact.model.ts";

// -----------------------
// Format helpers
// -----------------------

function formatObjectifs(f: FormationModel): string {
  const objectifs =
    Array.isArray(f.objectifsVises) && f.objectifsVises.length > 0
      ? f.objectifsVises.map(o => `- ${o.objectifVise}`).join("\n")
      : "-";

  const competences =
    Array.isArray(f.competencesLinguistiquesVisees) && f.competencesLinguistiquesVisees.length > 0
      ? f.competencesLinguistiquesVisees.map(c => `- ${c}`).join("\n")
      : "-";

  return [
    `Objectifs visés :\n${objectifs}`,
    `Niveau de langue et de compétences visé :\n${competences}`,
  ].join("\n\n");
}

function formatProfils(f: FormationModel): string {
  const scolarisation =
    Array.isArray(f.criteresScolarisation) && f.criteresScolarisation.length > 0
      ? f.criteresScolarisation.map(c => `- ${c}`).join("\n")
      : "-";

  const savoirBase =
    f.criteresSavoirBase
      ? `- ${f.criteresSavoirBase}`
      : "-";

  const oral =
    Array.isArray(f.criteresLinguistiqueOral) && f.criteresLinguistiqueOral.length > 0
      ? f.criteresLinguistiqueOral.join(", ")
      : "-";

  const ecrit =
    Array.isArray(f.criteresLinguistiqueEcrit) && f.criteresLinguistiqueEcrit.length > 0
      ? f.criteresLinguistiqueEcrit.join(", ")
      : "-";

  return [
    `Critères de scolarisation :\n${scolarisation}`,
    `Niveau de scolarisation et maîtrise des savoirs de base :\n${savoirBase}`,
    `Compétences linguistiques à l'entrée de la formation (CECRL) :\n  • Oral : ${oral}\n  • Ecrit : ${ecrit}`,
  ].join("\n\n");
}

function formatPublics(f: FormationModel): string {
  return Array.isArray(f.publicsSpecifiques)
    ? f.publicsSpecifiques.map(p => p.publicSpecifique).join("\n")
    : "-";
}

function formatAdressesEtHoraires(f: FormationModel): string {
  const adresses = Array.isArray(f.adresses)
    ? f.adresses
      .map((a: AdresseModel) => {
        const parts = [a.numero, a.voie, a.ville, a.codePostal].filter(Boolean);
        return `- ${parts.join(", ")}`;
      })
      .join("\n")
    : "-";

  const horaires = Array.isArray(f.joursHorairesDetails) && f.joursHorairesDetails.length > 0
    ? f.joursHorairesDetails
      .map(j => {
        const start = j.dateDebut ? new Date(j.dateDebut) : null;
        const end = j.dateFin ? new Date(j.dateFin) : null;

        const startStr = start
          ? `${start.getHours().toString().padStart(2, "0")}:${start.getMinutes().toString().padStart(2, "0")}`
          : "?";
        const endStr = end
          ? `${end.getHours().toString().padStart(2, "0")}:${end.getMinutes().toString().padStart(2, "0")}`
          : "?";

        return `- ${j.jour} de ${startStr} à ${endStr}`;
      })
      .join("\n")
    : "-";

  return [adresses, horaires].join("\n\n");
}

function formatContactEtCout(f: FormationModel): string {
  const c = f.contact;
  const contacts = c
    ? (() => {
      const parts: string[] = [];
      if (c.civilite || c.nom || c.prenom) {
        parts.push([c.civilite, c.nom, c.prenom].filter(Boolean).join(" "));
      }
      if (c.telephone1 || c.telephone2) {
        parts.push([c.telephone1, c.telephone2].filter(Boolean).join(" / "));
      }
      if (c.email) parts.push(c.email);
      return `- ${parts.join("\n ")}`;
    })()
    : "-";

  return [`Coût :\n${f.cout || "-"}`, `Contacter la structure :\n${contacts}`].join("\n\n");
}

function formatFormationInfos(f: FormationModel): string {
  return [
    `Formation :\n${f.nom || "-"}`,
    `Dates :\n${formatDate(f.dateDebut) || ""} - ${formatDate(f.dateFin) || ""}`,
    `Proposée par :\n${f.structure?.nom || ""}`,
  ].join("\n\n");
}

// -----------------------
// Main export function
// -----------------------

export function exportFormationsPDF(formations: FormationModel[], filters: Record<string, unknown>) {
  const { doc, startY } = createBasePDF({
    title: "RESULTATS DE MA RECHERCHE DE FORMATION",
    infoLines: [
      "Certaines structures interviennent sur ce territoire mais n'ont pas détaillé leurs cours. Vous pouvez trouver leurs coordonnées dans les résultats de 'structures'.",
      "La disponibilité des formations est mise à jour régulièrement par les structures membres de Réseau Alpha, n'hésitez pas à consulter le site prochainement.",
    ],
    resultCount: formations.length,
    filters,
    extraLabel: "avec places disponibles",
  });

  autoTable(doc, {
    startY,
    head: [["N°", "Formation", "Objectifs visés", "Profils et prérequis", "Type de public", "Lieux et horaires", "Contact & coût"]],
    body: formations.map((f, i) => [
      i + 1,
      formatFormationInfos(f),
      formatObjectifs(f),
      formatProfils(f),
      formatPublics(f),
      formatAdressesEtHoraires(f),
      formatContactEtCout(f),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [7, 141, 204] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 50 },
      3: { cellWidth: 50 },
      4: { cellWidth: 40 },
      5: { cellWidth: 40 },
      6: { cellWidth: 40 },
    },
    margin: { top: 35, bottom: 20, left: 10, right: 10 },
  });

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPdfHeaderAndFooter(doc, i, totalPages);
  }

  doc.save("formations.pdf");
}
