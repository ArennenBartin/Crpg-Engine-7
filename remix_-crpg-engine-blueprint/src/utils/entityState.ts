// Entity runtime state (hp, death, position) is stored in the save under a
// string key. The key must be unique per map: two maps can both place the same
// entity definition at placement index 0, and without the map id those
// placements would silently share state across maps.
export const entityStateKey = (
  mapId: string,
  entityId: string,
  placementIndex: number,
) => `ent_${mapId}_${entityId}_${placementIndex}`;
