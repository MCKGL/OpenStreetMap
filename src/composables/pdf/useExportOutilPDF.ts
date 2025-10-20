import { createApp } from "vue";
import { getOutilBySlug } from "@/services/Outil.service";
import type { OutilModel } from "@/models/Outil.model";
import OutilPdf from "@/components/pdf/OutilPdf.vue";
import { addPdfHeaderAndFooterOnHTML } from "@/utils/pdf";

export function useExportOutilPDF() {

  async function generatePdf(slug: string) {
    try {
      const outil: OutilModel = await getOutilBySlug(slug);

      // Création du composant Vue
      const app = createApp(OutilPdf, { outil });
      const mountEl = document.createElement("div");
      mountEl.style.position = "absolute";
      mountEl.style.left = "-9999px";
      document.body.appendChild(mountEl);

      const vm = app.mount(mountEl);

      // Récupération du contenu HTML
      const pdfContent = (vm as any).$refs.pdfContent as HTMLElement;
      if (!pdfContent) throw new Error("Conteneur PDF introuvable");

      // Génération du PDF avec header/footer
      await addPdfHeaderAndFooterOnHTML(pdfContent, `${outil.slug}.pdf`);

      // Nettoyage
      app.unmount();
      document.body.removeChild(mountEl);

    } catch {
      alert("Impossible de générer le PDF de l'outil.");
    }
  }
  return { generatePdf };
}
