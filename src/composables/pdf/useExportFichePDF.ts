import FichePratiquePdf from "@/components/pdf/FichePratiquePdf.vue";
import type {FichePratiqueModel} from "@/models/FichePratique.model.ts";
import {createApp} from "vue";
import {addPdfHeaderAndFooterOnHTML} from "@/utils/pdf.ts";
import {getFichePratiqueBySlug} from "@/services/FichePratique.service.ts";


export function useExportFichePDF() {

  async function generatePdf(slug: string) {
    try {
      const fichePratique: FichePratiqueModel = await getFichePratiqueBySlug(slug);

      // Création du composant Vue
      const app = createApp(FichePratiquePdf, { fichePratique });
      const mountEl = document.createElement("div");
      mountEl.style.position = "absolute";
      mountEl.style.left = "-9999px";
      document.body.appendChild(mountEl);

      const vm = app.mount(mountEl);

      // Récupération du contenu HTML
      const pdfContent = (vm as any).$refs.pdfContent as HTMLElement;
      if (!pdfContent) throw new Error("Conteneur PDF introuvable");

      // Génération du PDF avec header/footer
      await addPdfHeaderAndFooterOnHTML(pdfContent, `${fichePratique.slug}.pdf`);

      // Nettoyage
      app.unmount();
      document.body.removeChild(mountEl);

    } catch {
      alert("Impossible de générer le PDF de la fiche pratique.");
    }
  }
  return { generatePdf };
}
