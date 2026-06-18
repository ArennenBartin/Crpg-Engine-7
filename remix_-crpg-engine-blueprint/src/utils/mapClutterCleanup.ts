import type {
  GamePackage,
  MapData,
  ObjectData,
  ObjectPlacementData,
} from "../schema/game";

const ACTIVE_MAP_IDS = new Set([
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

const HERO_OBJECT_IDS = new Set([
  "obj_bleeding_witness",
  "obj_mouthstone_gate",
]);

const STORY_OBJECT_IDS = new Set([
  ...HERO_OBJECT_IDS,
  "obj_ald_lazare_license_threshold",
  "obj_ald_river_votive_landing",
  "obj_ald_civic_route_board",
  "obj_ald_market_ledger_stall",
  "obj_ald_residential_well_shrine",
  "obj_ald_cave_evidence_shrine",
  "obj_ald_witness_votive_bank",
  "obj_ald_processional_marker",
  "obj_ald_mouthstone_field_marker",
  "obj_ald_glassworks_furnace_bank",
  "obj_ald_smokestack_cluster",
  "obj_ald_network_family_altar",
  "obj_ald_network_omphalos_ring",
  "obj_p_desk",
  "obj_p_headstone",
  "obj_net_arch_sigil",
  "obj_net_glass_growth",
  "obj_net_glass_kneeler",
  "obj_net_krater",
  "obj_net_omphalos",
  "obj_net_rite_circle",
  "obj_net_shrine_family",
  "obj_net_stele",
]);

const STRUCTURAL_STORY_OBJECT_IDS = new Set([
  "obj_cell_bars",
  "obj_ald_cordon_corner_standard",
  "obj_ald_cordon_viewing_rail",
]);

const STRUCTURAL_TAGS = new Set(["door", "wall", "roof", "floor", "ground"]);

const isStructuralObject = (object: ObjectData | undefined, objectId: string) => {
  const tags = object?.tags || [];
  return (
    objectId.startsWith("obj_wall") ||
    objectId.startsWith("obj_p_wall") ||
    objectId.startsWith("obj_roof") ||
    objectId.startsWith("obj_p_roof") ||
    tags.some((tag) => STRUCTURAL_TAGS.has(tag))
  );
};

const isLightObject = (object: ObjectData | undefined, objectId: string) => {
  const tags = object?.tags || [];
  return (
    tags.some((tag) => tag === "light" || tag === "light_source" || tag.startsWith("light_")) ||
    objectId.includes("lantern") ||
    objectId.includes("brazier") ||
    objectId.includes("votive_light") ||
    objectId.includes("arc_lamp")
  );
};

const isNatureObject = (object: ObjectData | undefined, objectId: string) => {
  const tags = object?.tags || [];
  return (
    tags.includes("tree") ||
    objectId.includes("tree") ||
    objectId.includes("pine") ||
    objectId.includes("cypress") ||
    objectId.includes("fig") ||
    objectId.includes("oak") ||
    objectId.includes("yew")
  );
};

const shouldKeepPlacement = (
  placement: ObjectPlacementData,
  object: ObjectData | undefined,
) =>
  Boolean(placement.dialogue_id) ||
  STORY_OBJECT_IDS.has(placement.object_id) ||
  STRUCTURAL_STORY_OBJECT_IDS.has(placement.object_id) ||
  isStructuralObject(object, placement.object_id) ||
  isLightObject(object, placement.object_id) ||
  isNatureObject(object, placement.object_id);

const pruneMap = (
  map: MapData,
  objectById: Map<string, ObjectData>,
  options: { staleOnly?: boolean } = {},
): { map: MapData; removed: number } => {
  if (!ACTIVE_MAP_IDS.has(map.id)) return { map, removed: 0 };
  let removed = 0;
  const customObjectPlacements = (map.custom_object_placements || []).filter(
    (placement) => {
      const object = objectById.get(placement.object_id);
      if (shouldKeepPlacement(placement, object)) return true;
      removed += 1;
      return false;
    },
  );

  if (removed === 0 || (options.staleOnly && removed < 3)) {
    return { map, removed: 0 };
  }

  return {
    map: {
      ...map,
      custom_object_placements: customObjectPlacements,
    },
    removed,
  };
};

export const removeNonStoryMapClutter = (
  gamePackage: GamePackage,
  options: { staleOnly?: boolean } = {},
): GamePackage => {
  const objectById = new Map(gamePackage.object_library.map((object) => [object.id, object]));
  let changed = false;
  const maps = gamePackage.maps.map((map) => {
    const result = pruneMap(map, objectById, options);
    if (result.removed > 0) changed = true;
    return result.map;
  });

  return changed ? { ...gamePackage, maps } : gamePackage;
};
