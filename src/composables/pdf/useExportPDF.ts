import { useExportOutilPDF } from "@/composables/pdf/useExportOutilPDF.ts";
import {useExportGlossairePDF} from "@/composables/pdf/useExportGlossairePDF.ts";
import {useExportFichePDF} from "@/composables/pdf/useExportFichePDF.ts";

export function useExportPDF() {
  const { generatePdf: generateOutilPdf } = useExportOutilPDF();
  const { generatePdf: generateGlossairePdf } = useExportGlossairePDF();
  const { generatePdf: generateFichePdf } = useExportFichePDF();

  async function generate(type: "outil" | "glossaire" | "fiche", slug?: string) {
    switch (type) {
      case "outil":
        if (!slug) throw new Error("Slug requis pour le PDF outil");
        await generateOutilPdf(slug);
        break;
      case "glossaire":
        await generateGlossairePdf();
        break;
      case "fiche":
        if (!slug) throw new Error("Slug requis pour le PDF la fiche");
        await generateFichePdf(slug)
        break;
      default:
        throw new Error("Type de PDF inconnu");
    }
  }

  return { generate };
}
