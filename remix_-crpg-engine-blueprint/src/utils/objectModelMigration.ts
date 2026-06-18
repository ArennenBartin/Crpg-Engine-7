import type { GamePackage, ObjectData } from "../schema/game";
import { objectLibraryPresets } from "../schema/presets";
import { collectAct1ObjectIds } from "./objectLibraryPrune";

const HERO_OBJECT_IDS = new Set(["obj_bleeding_witness", "obj_mouthstone_gate"]);
const REPLACEMENT_ASSET_OBJECT_IDS = new Set([
  "obj_p_desk",
  "obj_p_headstone",
  "obj_ald_market_ledger_stall",
  "obj_lantern_post",
  "obj_ald_civic_lantern_post",
  "obj_ald_river_fog_lantern",
  "obj_ald_glassworks_arc_lamp",
  "obj_p_candles",
  "obj_net_candle_cluster",
  "obj_ald_votive_light_cluster",
  "obj_ald_witness_votive_bank",
  "obj_tree",
  "obj_pine",
  "obj_pine_large",
  "obj_dead_tree",
  "obj_cypress",
  "obj_fig_tree",
  "obj_p_oak",
  "obj_p_yew",
]);

const isPreservedBuildingShell = (id: string) =>
  id.startsWith("obj_wall") ||
  id.startsWith("obj_roof") ||
  id.startsWith("obj_p_wall") ||
  id.startsWith("obj_p_roof");

const shouldRefreshObject = (object: ObjectData) =>
  REPLACEMENT_ASSET_OBJECT_IDS.has(object.id) ||
  (
    !HERO_OBJECT_IDS.has(object.id) &&
    !object.id.startsWith("obj_net_") &&
    !isPreservedBuildingShell(object.id) &&
    (object.model_kind === "mesh" || object.model_kind === "hybrid")
  );

const refreshedPresetById = new Map(
  objectLibraryPresets
    .filter((object) => shouldRefreshObject(object as ObjectData))
    .map((object) => [object.id, object as ObjectData]),
);

const modelSignature = (object: ObjectData) =>
  JSON.stringify({
    bounds: object.bounds,
    collision: object.collision,
    materials: object.materials,
    material_settings: object.material_settings,
    mesh: object.mesh,
    model_kind: object.model_kind,
    origin: object.origin,
    parts: object.parts,
    tags: object.tags,
    asset: object.asset,
  });

const shouldReplaceWithPreset = (object: ObjectData, preset: ObjectData) =>
  modelSignature(object) !== modelSignature(preset);

export const refreshAlderamonticoObjectModels = (
  gamePackage: GamePackage,
): GamePackage => {
  let changed = false;
  const referencedObjectIds = collectAct1ObjectIds(gamePackage);
  const seenIds = new Set<string>();

  const objectLibrary = gamePackage.object_library.map((object) => {
    seenIds.add(object.id);
    const preset = refreshedPresetById.get(object.id);
    if (!preset || !shouldReplaceWithPreset(object as ObjectData, preset)) {
      return object;
    }

    changed = true;
    return preset;
  });

  refreshedPresetById.forEach((preset, id) => {
    if (seenIds.has(id)) return;
    if (!referencedObjectIds.has(id)) return;
    objectLibrary.push(preset);
    changed = true;
  });

  return changed ? { ...gamePackage, object_library: objectLibrary } : gamePackage;
};
