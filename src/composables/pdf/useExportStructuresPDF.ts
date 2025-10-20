import autoTable from "jspdf-autotable";
import type { StructureModel } from "@/models/Structure.model.ts";
import type { AdresseModel } from "@/models/Adresse.model.ts";
import { addPdfHeaderAndFooterOnTab, createBasePDF } from "@/utils/pdf.ts";
import type { ContactModel } from "@/models/Contact.model.ts";

// -----------------------
// Format helpers
// -----------------------

function formatAdresses(structure: StructureModel): string {
  return Array.isArray(structure.adresses) && structure.adresses.length > 0
    ? structure.adresses
      .map((a: AdresseModel) => {
        const parts = [a.numero, a.voie, a.ville, a.codePostal].filter(Boolean);
        return `- ${parts.join(", ")}`;
      })
      .join("\n")
    : "-";
}

function formatContacts(structure: StructureModel): string {
  const contacts = structure.lieux?.contacts ?? [];
  if (!Array.isArray(contacts) || contacts.length === 0) {
    return "-";
  }

  return contacts
    .map((c: ContactModel) => {
      const parts: string[] = [];
      if (c.civilite || c.nom || c.prenom) {
        parts.push([c.civilite, c.nom, c.prenom].filter(Boolean).join(" "));
      }
      if (c.telephone1 || c.telephone2) {
        parts.push([c.telephone1, c.telephone2].filter(Boolean).join(" / "));
      }
      if (c.email) parts.push(c.email);
      return `- ${parts.join("\n ")}`;
    })
    .join("\n");
}

function formatObjectifs(structure: StructureModel): string {
  return Array.isArray(structure.activitesFormation) && structure.activitesFormation.length > 0
    ? structure.activitesFormation.map(a => `- ${a}`).join("\n")
    : "-";
}

// -----------------------
// Main export function
// -----------------------

export function useExportStructuresPDF(structures: StructureModel[], filters: Record<string, unknown>) {
  const { doc, startY } = createBasePDF({
    title: "RESULTATS DE MA RECHERCHE DE STRUCTURE",
    infoLines: [
      "Certaines structures ont renseigné les détails de leurs cours (jours, public,...), pour les connaitre, consulter les résultats de 'formations'.",
      "Sinon, contactez les structures directement.",
    ],
    resultCount: structures.length,
    filters,
  });

  autoTable(doc, {
    startY,
    head: [["N°", "Structure", "Lieux", "Coordonnées", "Objectifs visés"]],
    body: structures.map((s, i) => [
      i + 1,
      s.nom || "-",
      formatAdresses(s),
      formatContacts(s),
      formatObjectifs(s),
    ]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [7, 141, 204] },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 50 },
      2: { cellWidth: 80 },
      3: { cellWidth: 70 },
    },
    margin: { top: 35, bottom: 20, left: 10, right: 10 },
  });

  const totalPages = (doc.internal as any).getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addPdfHeaderAndFooterOnTab(doc, i, totalPages);
  }

  doc.save("structures.pdf");
}
