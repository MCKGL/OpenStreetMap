import {CoordonneeModel} from "@/models/Coordonnee.model.ts";
const CSV_PATH = 'src/datas/dataStructure.csv';

/**
 * Récupère et parse le CSV pour retourner un tableau de Coordonnee
 */
export function getCoordonnees(): Promise<CoordonneeModel[]> {
  return fetch(CSV_PATH)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      return response.text();
    })
    .then(text => parseCsv(text));
}

/**
 * Transforme le texte CSV en tableau de Coordonnee
 */
function parseCsv(text: string): CoordonneeModel[] {
  // découpe en lignes
  const lines = text.trim().split(/\r?\n/);
  // récupère l'entête
  const headers = lines.shift()!.split(',');

  // returne un tableau de Coordonnee
  return lines.map(line => {
    const cols = line.split(',');
    const item: Record<string,string> = {};

    headers.forEach((h, i) => item[h] = cols[i] ?? '');

    // retourne un objet Coordonnee avec les valeurs parsées
    return {
      id:  Number(item['id']),
      lat: Number(item['latitude']),
      lng: Number(item['longitude']),
      ok:  item['ok'] || undefined,
    };
  });
}
