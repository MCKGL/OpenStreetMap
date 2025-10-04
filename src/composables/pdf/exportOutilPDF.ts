import { jsPDF } from 'jspdf';
import type { OutilModel } from '@/models/Outil.model.ts';
import { getOutilBySlug } from '@/services/Outil.service.ts';
import { addPdfHeaderAndFooterFirstPage } from "@/utils/pdf.ts";

export function exportOutilPDF() {
  async function generatePdf(slug: string) {
    try {
      const outil: OutilModel = await getOutilBySlug(slug);
      const doc = new jsPDF('p', 'mm', 'a4');
      const margin = 10;
      const pageWidth = doc.internal.pageSize.getWidth() - 2 * margin;

      // --- Conteneur HTML complet ---
      const container = document.createElement('div');
      container.style.width = `${pageWidth}px`;       // toute la largeur utilisable du PDF
      container.style.boxSizing = "border-box";
      container.style.fontSize = '5px';
      container.style.lineHeight = '1.4';


      // Titre
      const title = document.createElement('h1');
      title.textContent = outil.titre;
      title.style.fontSize = '8px';
      container.appendChild(title);

      // Structures
      if (outil.nomsStructures.length > 0) {
        const struct = document.createElement('p');
        struct.innerHTML = `<strong>Structures :</strong> ${outil.nomsStructures.join(', ')}`;
        container.appendChild(struct);
      }

      // Résumé
      if (outil.resume) {
        const resumeDiv = document.createElement('div');
        resumeDiv.innerHTML = outil.resume;

        // Les images prennent toute la largeur disponible du container
        resumeDiv.querySelectorAll('img').forEach(img => {
          img.style.width = '30%';
          img.style.height = 'auto';
          img.style.display = 'block';
          img.style.margin = 'auto';
        });

        container.appendChild(resumeDiv);
      }

      // Thématiques
      if (outil.thematiques.length > 0) {
        const thematiques = document.createElement('p');
        thematiques.innerHTML = `<strong>Thématiques :</strong> ${outil.thematiques.join(', ')}`;
        container.appendChild(thematiques);
      }

      // Type + Auteur
      const typePub = document.createElement('p');
      typePub.innerHTML = `<strong>Type de publication :</strong> ${outil.typePublication}`;
      container.appendChild(typePub);

      const auteur = document.createElement('p');
      auteur.innerHTML = `<strong>Auteur :</strong> ${outil.auteur}`;
      container.appendChild(auteur);

      // --- Génération PDF ---
      await doc.html(container, {
        x: margin,
        y: 30, // marge pour header
        width: pageWidth,
        html2canvas: { allowTaint: true, scale: 1 }, // scale = 1 pour remplir la page
        callback: () => {
          const totalPages = (doc.internal as any).getNumberOfPages();
          for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            addPdfHeaderAndFooterFirstPage(doc, i, totalPages);
          }
          doc.save(`${outil.slug}.pdf`);
        }
      });

    } catch (err: any) {
      console.error(err);
      alert('Impossible de générer le PDF.');
    }
  }

  return { generatePdf };
}
