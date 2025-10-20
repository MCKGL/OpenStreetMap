import { useExportOutilPDF } from "@/composables/pdf/useExportOutilPDF.ts";
import {useExportGlossairePDF} from "@/composables/pdf/useExportGlossairePDF.ts";

export function useExportPDF() {
  const { generatePdf: generateOutilPdf } = useExportOutilPDF();
  const { generatePdf: generateGlossairePdf } = useExportGlossairePDF();

  async function generate(type: "outil" | "glossaire", slug?: string) {
    switch (type) {
      case "outil":
        if (!slug) throw new Error("Slug requis pour le PDF outil");
        await generateOutilPdf(slug);
        break;
      case "glossaire":
        await generateGlossairePdf();
        break;
      default:
        throw new Error("Type de PDF inconnu");
    }
  }

  return { generate };
}
