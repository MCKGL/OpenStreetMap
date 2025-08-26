export const ROUTE_TYPE = {
  SEARCH_FORMATION: 'SearchFormation',
  SEARCH_COORDINATION: 'SearchCoordination',
  DETAIL_MAP_PERMANENCE: 'DetailMapPermanence',
  DETAIL_MAP_STRUCTURE: 'DetailMapStructure',
  DETAIL_MAP_FORMATION: 'DetailMapFormation',
} as const;

export type MapRoute = typeof ROUTE_TYPE[keyof typeof ROUTE_TYPE];
