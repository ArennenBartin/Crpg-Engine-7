import type { GamePackage, ObjectData } from "../schema/game";
import { objectLibraryPresets } from "../schema/presets";

const TEXTURED_BUILDING_OBJECT_IDS = new Set([
  "obj_floor_stone",
  "obj_floor_dirt",
  "obj_floor_wood",
  "obj_floor_mosaic",
  "obj_water",
  "obj_p_mud",
  "obj_ald_cave_floor",
  "obj_net_floor_catacomb",
  "obj_net_floor_soil",
  "obj_net_floor_ritual",
  "obj_net_water",
  "obj_wall_stone",
  "obj_wall_brick",
  "obj_p_wall_fieldstone",
  "obj_p_wall_timber",
  "obj_p_wall_church",
  "obj_p_wall_low",
  "obj_net_wall_catacomb",
  "obj_net_wall_ossuary",
  "obj_roof_tile",
  "obj_p_roof_s",
  "obj_p_roof_n",
  "obj_p_roof_e",
  "obj_p_roof_w",
  "obj_p_roof_flat",
  "obj_p_roof_hip_ne",
  "obj_p_roof_hip_nw",
  "obj_p_roof_hip_se",
  "obj_p_roof_hip_sw",
  "obj_p_roof_clay_s",
  "obj_p_roof_clay_n",
  "obj_p_roof_clay_e",
  "obj_p_roof_clay_w",
  "obj_p_roof_clay_flat",
  "obj_p_roof_clay_hip_ne",
  "obj_p_roof_clay_hip_nw",
  "obj_p_roof_clay_hip_se",
  "obj_p_roof_clay_hip_sw",
]);

const texturedPresetById = new Map(
  objectLibraryPresets
    .filter((object) => TEXTURED_BUILDING_OBJECT_IDS.has(object.id))
    .map((object) => [object.id, object as ObjectData]),
);

const hasImageTexture = (object: ObjectData) =>
  (object.material_settings || []).some((material) =>
    Boolean(material.texture_image_url?.trim()),
  );

const getTextureUrls = (object: ObjectData) =>
  (object.material_settings || [])
    .map((material) => material.texture_image_url?.trim())
    .filter((url): url is string => Boolean(url));

const hasSameTags = (object: ObjectData, preset: ObjectData) =>
  (object.tags || []).join("|") === (preset.tags || []).join("|");

const hasSameCollision = (object: ObjectData, preset: ObjectData) =>
  object.collision.profile === preset.collision.profile &&
  JSON.stringify(object.collision.footprint || []) ===
    JSON.stringify(preset.collision.footprint || []);

const shouldRefreshFromPreset = (object: ObjectData, preset: ObjectData) => {
  if (!hasImageTexture(preset)) return false;
  if (!hasImageTexture(object)) return true;

  const currentUrls = getTextureUrls(object).join("|");
  const presetUrls = getTextureUrls(preset).join("|");
  if (currentUrls !== presetUrls) return true;
  if (!hasSameTags(object, preset) || !hasSameCollision(object, preset)) {
    return true;
  }

  return (
    object.model_kind !== preset.model_kind ||
    (object.mesh?.faces.length || 0) !== (preset.mesh?.faces.length || 0) ||
    (object.mesh?.vertices.length || 0) !== (preset.mesh?.vertices.length || 0)
  );
};

export const refreshTexturedBuildingObjects = (
  gamePackage: GamePackage,
): GamePackage => {
  let changed = false;
  const objectLibrary = gamePackage.object_library.map((object) => {
    if (!TEXTURED_BUILDING_OBJECT_IDS.has(object.id)) {
      return object;
    }

    const preset = texturedPresetById.get(object.id);
    if (!preset || !shouldRefreshFromPreset(object, preset)) return object;

    changed = true;
    return preset;
  });

  return changed ? { ...gamePackage, object_library: objectLibrary } : gamePackage;
};
