import type { GamePackage, ObjectData } from "../schema/game";

export const ACT_1_MAP_IDS = new Set([
  "map_town_square",
  "map_residential",
  "map_temple_cordon",
  "map_old_processional_wood",
  "map_glass_touched_copse",
  "map_cave_upper",
  "map_cave_deep",
  "map_river_path",
  "map_lazare_house",
  "map_mouthstone_field",
  "map_glassworks",
  "map_cave_grotto",
  "map_network_upper",
  "map_network_depths",
]);

const collectObjectIdsFromUnknown = (value: unknown, objectIds: Set<string>) => {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item) => collectObjectIdsFromUnknown(item, objectIds));
    return;
  }

  const record = value as Record<string, unknown>;
  if (typeof record.object_id === "string") objectIds.add(record.object_id);
  Object.values(record).forEach((item) =>
    collectObjectIdsFromUnknown(item, objectIds),
  );
};

export const collectAct1ObjectIds = (
  gamePackage: Pick<GamePackage, "maps">,
) => {
  const objectIds = new Set<string>();

  gamePackage.maps.forEach((map) => {
    if (!ACT_1_MAP_IDS.has(map.id)) return;

    map.cells.forEach((cell) => {
      if (cell.object_id) objectIds.add(cell.object_id);
    });
    map.custom_object_placements.forEach((placement) =>
      objectIds.add(placement.object_id),
    );
    map.container_placements.forEach((placement) =>
      objectIds.add(placement.object_id),
    );
    collectObjectIdsFromUnknown(map.props, objectIds);
  });

  return objectIds;
};

export const pruneObjectLibraryToAct1Usage = (
  gamePackage: GamePackage,
): GamePackage => {
  const objectIds = collectAct1ObjectIds(gamePackage);
  const objectLibrary = gamePackage.object_library.filter((object: ObjectData) =>
    objectIds.has(object.id),
  );

  if (objectLibrary.length === gamePackage.object_library.length) {
    return gamePackage;
  }

  return {
    ...gamePackage,
    object_library: objectLibrary,
  };
};
