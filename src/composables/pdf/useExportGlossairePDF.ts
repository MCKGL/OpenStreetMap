import { createApp } from "vue";
import { getGlossaire } from "@/services/Glossaire.service";
import GlossairePdf from "@/components/pdf/GlossairePdf.vue";
import { addPdfHeaderAndFooterOnHTML } from "@/utils/pdf";

export function useExportGlossairePDF() {
  async function generatePdf() {
    try {
      const glossaire = await getGlossaire();

      // Création du composant Vue
      const app = createApp(GlossairePdf, { glossaire });
      const mountEl = document.createElement("div");
      mountEl.style.position = "absolute";
      mountEl.style.left = "-9999px";
      document.body.appendChild(mountEl);

      const vm = app.mount(mountEl);

      // Récupération du contenu HTML
      const pdfContent = (vm as any).$refs.pdfContent as HTMLElement;
      if (!pdfContent) throw new Error("Conteneur PDF introuvable");

      // Génération du PDF avec header/footer
      await addPdfHeaderAndFooterOnHTML(pdfContent, `glossaire.pdf`);

      // Nettoyage
      app.unmount();
      document.body.removeChild(mountEl);

    } catch {
      alert("Impossible de générer le PDF du glossaire.");
    }
  }
  return { generatePdf };
}
