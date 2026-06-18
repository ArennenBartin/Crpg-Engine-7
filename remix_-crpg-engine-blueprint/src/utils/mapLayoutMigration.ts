import { createEmptyGamePackage } from "../schema/game";
import type {
  CellData,
  EntityPlacementData,
  GamePackage,
  ObjectPlacementData,
  TriggerData,
} from "../schema/game";
import { DOOR_OBJECT_ID, doorPlacementKey } from "./doorPlacement";

const RESIDENTIAL_ROOF_IDS = new Set([
  "obj_roof_tile",
  "obj_p_roof_clay_n",
  "obj_p_roof_clay_s",
  "obj_p_roof_clay_e",
  "obj_p_roof_clay_w",
  "obj_p_roof_clay_hip_nw",
  "obj_p_roof_clay_hip_ne",
  "obj_p_roof_clay_hip_se",
  "obj_p_roof_clay_hip_sw",
]);

const CAVE_TEXTURE_MAP_IDS = new Set([
  "map_cave_upper",
  "map_cave_deep",
  "map_cave_grotto",
]);

const isResidentialRoofCell = (cell: CellData) =>
  RESIDENTIAL_ROOF_IDS.has(cell.object_id || "");

const isWallCell = (cell: CellData) =>
  Boolean(cell.object_id?.startsWith("obj_wall"));

const getZBounds = (cells: CellData[]) => {
  if (cells.length === 0) return null;
  return {
    min: Math.min(...cells.map((cell) => cell.z)),
    max: Math.max(...cells.map((cell) => cell.z)),
  };
};

export const refreshResidentialRoofAlignment = (
  gamePackage: GamePackage,
): GamePackage => {
  let changed = false;
  const maps = gamePackage.maps.map((map) => {
    if (map.id !== "map_residential") return map;

    const roofs = map.cells.filter(isResidentialRoofCell);
    const walls = map.cells.filter(isWallCell);
    const roofBounds = getZBounds(roofs);
    const wallBounds = getZBounds(walls);

    if (
      !roofBounds ||
      !wallBounds ||
      roofBounds.min !== wallBounds.min ||
      roofBounds.max !== wallBounds.max
    ) {
      return map;
    }

    changed = true;
    return {
      ...map,
      cells: map.cells.map((cell) =>
        isResidentialRoofCell(cell) ? { ...cell, z: cell.z - 1 } : cell,
      ),
    };
  });

  return changed ? { ...gamePackage, maps } : gamePackage;
};

export const refreshCaveGroundTextureCells = (
  gamePackage: GamePackage,
): GamePackage => {
  let changed = false;
  const maps = gamePackage.maps.map((map) => {
    if (!CAVE_TEXTURE_MAP_IDS.has(map.id)) return map;

    let mapChanged = false;
    const cells = map.cells.map((cell) => {
      if (cell.object_id !== "obj_floor_dirt") return cell;
      mapChanged = true;
      return {
        ...cell,
        object_id: "obj_ald_cave_floor",
        terrain: "stone",
      };
    });

    if (!mapChanged) return map;
    changed = true;
    return { ...map, cells };
  });

  return changed ? { ...gamePackage, maps } : gamePackage;
};

const isDoorPlacement = (placement: ObjectPlacementData) =>
  placement.object_id === DOOR_OBJECT_ID;

const placementCellKey = (placement: ObjectPlacementData) =>
  `${placement.cell[0]}|${placement.cell[1]}`;

const copyPlacement = (placement: ObjectPlacementData): ObjectPlacementData => ({
  ...placement,
  cell: [placement.cell[0], placement.cell[1]],
  facing: [placement.facing[0], placement.facing[1]],
});

const samePlacement = (a: ObjectPlacementData, b: ObjectPlacementData) =>
  a.object_id === b.object_id &&
  a.cell[0] === b.cell[0] &&
  a.cell[1] === b.cell[1] &&
  a.facing[0] === b.facing[0] &&
  a.facing[1] === b.facing[1] &&
  a.dialogue_id === b.dialogue_id;

export const refreshBuildingDoorPlacements = (
  gamePackage: GamePackage,
): GamePackage => {
  const freshPackage = createEmptyGamePackage();
  const freshMapsById = new Map(freshPackage.maps.map((map) => [map.id, map]));
  let changed = false;

  const maps = gamePackage.maps.map((map) => {
    const freshMap = freshMapsById.get(map.id);
    if (!freshMap) return map;

    const freshDoors = (freshMap.custom_object_placements || []).filter(isDoorPlacement);
    if (freshDoors.length === 0) return map;

    let mapChanged = false;
    const freshDoorsByCell = new Map(freshDoors.map((door) => [placementCellKey(door), door]));
    const seenDoorCells = new Set<string>();
    const placements: ObjectPlacementData[] = [];

    (map.custom_object_placements || []).forEach((placement) => {
      if (!isDoorPlacement(placement)) {
        placements.push(placement);
        return;
      }

      const cellKey = placementCellKey(placement);
      if (seenDoorCells.has(cellKey)) {
        mapChanged = true;
        return;
      }
      seenDoorCells.add(cellKey);

      const freshDoor = freshDoorsByCell.get(cellKey);
      if (!freshDoor) {
        placements.push(placement);
        return;
      }

      if (!samePlacement(placement, freshDoor)) mapChanged = true;
      placements.push(copyPlacement(freshDoor));
    });

    freshDoors.forEach((door) => {
      const cellKey = placementCellKey(door);
      if (seenDoorCells.has(cellKey)) return;
      seenDoorCells.add(cellKey);
      placements.push(copyPlacement(door));
      mapChanged = true;
    });

    if (!mapChanged) return map;

    changed = true;
    return {
      ...map,
      custom_object_placements: placements,
    };
  });

  return changed ? { ...gamePackage, maps } : gamePackage;
};

const sameTriggerPlacement = (a: TriggerData, b: TriggerData) =>
  a.cell?.[0] === b.cell?.[0] &&
  a.cell?.[1] === b.cell?.[1] &&
  a.type === b.type &&
  a.cutscene_id === b.cutscene_id &&
  a.once === b.once;

const sameCell = (a: CellData, b: CellData) =>
  a.x === b.x &&
  a.y === b.y &&
  a.z === b.z &&
  a.active === b.active &&
  a.walkable === b.walkable &&
  a.blocks_los === b.blocks_los &&
  a.height === b.height &&
  a.visual_height === b.visual_height &&
  a.terrain === b.terrain &&
  a.surface_tag === b.surface_tag &&
  a.object_id === b.object_id;

const sameCellData = (a: CellData[], b: CellData[]) =>
  a.length === b.length && a.every((cell, index) => sameCell(cell, b[index]));

const sameObjectPlacements = (
  a: ObjectPlacementData[] = [],
  b: ObjectPlacementData[] = [],
) => a.length === b.length && a.every((placement, index) => samePlacement(placement, b[index]));

const sameEntityPlacements = (
  a: EntityPlacementData[] = [],
  b: EntityPlacementData[] = [],
) => JSON.stringify(a) === JSON.stringify(b);

const sameTriggers = (a: TriggerData[] = [], b: TriggerData[] = []) =>
  JSON.stringify(a) === JSON.stringify(b);

const sameTempleCordonGeneratedLayout = (
  map: GamePackage["maps"][number],
  freshMap: GamePackage["maps"][number],
) =>
  sameCellData(map.cells || [], freshMap.cells || []) &&
  sameObjectPlacements(map.custom_object_placements || [], freshMap.custom_object_placements || []) &&
  sameEntityPlacements(map.entity_placements || [], freshMap.entity_placements || []) &&
  JSON.stringify(map.item_placements || []) === JSON.stringify(freshMap.item_placements || []) &&
  JSON.stringify(map.container_placements || []) ===
    JSON.stringify(freshMap.container_placements || []) &&
  sameTriggers(map.triggers || [], freshMap.triggers || []);

export const refreshTempleCordonGeneratedLayout = (
  gamePackage: GamePackage,
): GamePackage => {
  const freshMap = createEmptyGamePackage().maps.find((map) => map.id === "map_temple_cordon");
  if (!freshMap) return gamePackage;

  let changed = false;
  const maps = gamePackage.maps.map((map) => {
    if (map.id !== "map_temple_cordon") return map;
    if (sameTempleCordonGeneratedLayout(map, freshMap)) return map;

    changed = true;
    return {
      ...map,
      cells: freshMap.cells,
      custom_object_placements: freshMap.custom_object_placements,
      item_placements: freshMap.item_placements,
      container_placements: freshMap.container_placements,
      entity_placements: freshMap.entity_placements,
      triggers: freshMap.triggers,
    };
  });

  return changed ? { ...gamePackage, maps } : gamePackage;
};

export const refreshLazareEstateStoryLayout = (
  gamePackage: GamePackage,
): GamePackage => {
  const freshMap = createEmptyGamePackage().maps.find((map) => map.id === "map_lazare_house");
  if (!freshMap) return gamePackage;

  let changed = false;
  const maps = gamePackage.maps.map((map) => {
    if (map.id !== "map_lazare_house") return map;

    let mapChanged = false;
    const freshThresholdPlacements = (freshMap.custom_object_placements || []).filter(
      (placement) => placement.dialogue_id === "dia_lazare_threshold",
    );
    const thresholdKeys = new Set(
      freshThresholdPlacements.map((placement) => doorPlacementKey(placement)),
    );
    const placements = (map.custom_object_placements || []).filter((placement) => {
      if (placement.dialogue_id !== "dia_lazare_threshold") return true;
      const keep = thresholdKeys.has(doorPlacementKey(placement));
      if (!keep) mapChanged = true;
      return keep;
    });

    const existingThresholdKeys = new Set(placements.map((placement) => doorPlacementKey(placement)));
    freshThresholdPlacements.forEach((placement) => {
      if (existingThresholdKeys.has(doorPlacementKey(placement))) return;
      placements.push(copyPlacement(placement));
      mapChanged = true;
    });

    const entityPlacements = (map.entity_placements || []).filter(
      (placement: EntityPlacementData) => placement.entity_id !== "ent_lazare_vampire",
    );
    if (entityPlacements.length !== (map.entity_placements || []).length) {
      mapChanged = true;
    }

    const freshAfterVerdict = freshMap.triggers?.find(
      (trigger) => trigger.id === "trg_lazare_after_verdict",
    );
    let sawAfterVerdict = false;
    const triggers = (map.triggers || []).map((trigger) => {
      if (trigger.id !== "trg_lazare_after_verdict" || !freshAfterVerdict) {
        return trigger;
      }
      sawAfterVerdict = true;
      if (!sameTriggerPlacement(trigger, freshAfterVerdict)) {
        mapChanged = true;
        return freshAfterVerdict;
      }
      return trigger;
    });
    if (freshAfterVerdict && !sawAfterVerdict) {
      triggers.push(freshAfterVerdict);
      mapChanged = true;
    }

    if (!mapChanged) return map;
    changed = true;
    return {
      ...map,
      custom_object_placements: placements,
      entity_placements: entityPlacements,
      triggers,
    };
  });

  return changed ? { ...gamePackage, maps } : gamePackage;
};
