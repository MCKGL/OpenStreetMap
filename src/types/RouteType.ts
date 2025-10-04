export const ROUTE_TYPE = {
  SEARCH_FORMATION: 'SearchFormation',
  SEARCH_COORDINATION: 'SearchCoordination',
  DETAIL_MAP_COORDINATION: 'DetailMapCoordination',
  DETAIL_MAP_STRUCTURE_LEARNING: 'DetailMapStructure',
  DETAIL_MAP_STRUCTURE_ACTOR: 'DetailMapActor',
  DETAIL_MAP_FORMATION: 'DetailMapFormation',
  PDF_OUTIL_GENERATOR: 'PdfOutilGenerator',
} as const;

export type MapRoute = typeof ROUTE_TYPE[keyof typeof ROUTE_TYPE];
