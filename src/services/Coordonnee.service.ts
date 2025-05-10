import {CoordonneeModel} from "@/models/Coordonnee.model.ts";

const CSV_PATH = 'src/datas/dataStructure.csv';
const ILE_DE_FRANCE_BOUNDS = {
  minLat: 48.0,
  maxLat: 49.1,
  minLng: 1.6,
  maxLng: 3.6,
};

/**
 * Récupère et parse le CSV pour retourner un tableau de Coordonnees
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
 * Récupère et parse le CSV pour retourner une Coordonnee
 */
export function getCoordonnee(id: number): Promise<CoordonneeModel> {
  return fetch(CSV_PATH)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Erreur ${response.status}`);
      }
      return response.text();
    })
    .then(text => parseCsv(text))
    .then(coordonnees => {
      const coord = coordonnees.find(coord => coord.id === id);
      if (!coord) {
        throw new Error(`Coordonnée avec l'ID ${id} introuvable`);
      }
      return coord;
    });
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
  return lines
    .map(line => {
      const cols = line.split(',');
      const item: Record<string, string> = {};

      headers.forEach((h, i) => item[h] = cols[i] ?? '');

      // Retourne un objet Coordonnee avec les valeurs parsées
      const coord: CoordonneeModel = {
        id: Number(item['id']),
        lat: Number(item['latitude']),
        lng: Number(item['longitude']),
        ok: item['ok'] || undefined,
      };

      // Vérification si la coordonnée est dans les bornes de l'Île-de-France
      if (coord.lat >= ILE_DE_FRANCE_BOUNDS.minLat && coord.lat <= ILE_DE_FRANCE_BOUNDS.maxLat &&
        coord.lng >= ILE_DE_FRANCE_BOUNDS.minLng && coord.lng <= ILE_DE_FRANCE_BOUNDS.maxLng) {
        return coord;
      }
      return null;
    })
    .filter(coord => coord !== null) as CoordonneeModel[];
}

