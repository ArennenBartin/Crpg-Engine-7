import { z } from "zod";
import { objectLibraryPresets, spriteLibraryPresets } from "./presets";
import { generateTownCells, TOWN_W, TOWN_H } from "./town_gen";
import { generateParishCells, PARISH_W, PARISH_H } from "./parish_gen";
import { generateNetworkCells } from "./network_gen";
import { generateNetworkDepthsCells } from "./network_depths_gen";
import { generateResidentialBlockCells, BLOCK_W, BLOCK_H } from "./residential_block_gen";
import { generateTownSquareCells, SQUARE_W, SQUARE_H } from "./town_square_gen";
import { generateTempleCordonCells, TEMPLE_W, TEMPLE_H } from "./temple_cordon_gen";
import { generateCaveUpperCells, CAVE_UPPER_W, CAVE_UPPER_H } from "./cave_upper_gen";
import { generateCaveDeepCells, CAVE_DEEP_W, CAVE_DEEP_H } from "./cave_deep_gen";
import { generateRiverPathCells, RIVER_W, RIVER_H } from "./river_path_gen";
import { generateLazareHouseCells, LAZARE_W, LAZARE_H } from "./lazare_house_gen";
import { generateMouthstoneFieldCells, MOUTHSTONE_W, MOUTHSTONE_H } from "./mouthstone_field_gen";
import { generateGlassworksCells, GLASS_W, GLASS_H } from "./glassworks_gen";
import { generateCaveGrottoCells, GROTTO_W, GROTTO_H } from "./cave_grotto_gen";
import { generateOldProcessionalWoodCells, OLD_WOOD_W, OLD_WOOD_H } from "./old_processional_wood_gen";
import { generateGlassTouchedCopseCells, GLASS_COPSE_W, GLASS_COPSE_H } from "./glass_touched_copse_gen";
import { removeNonStoryMapClutter } from "../utils/mapClutterCleanup";
import { pruneObjectLibraryToAct1Usage } from "../utils/objectLibraryPrune";
import {
  FD_CUTSCENES,
  FD_DIALOGUE,
  FD_DOCUMENTS,
  FD_ENTITIES,
  FD_ITEMS,
  FD_QUESTS,
  FD_SHOPS,
} from "./familiar_dark_content";

export const GameMetadataSchema = z.object({
  title: z.string(),
  version: z.string(),
  start_map_id: z.string(),
  start_spawn_id: z.string(),
});

// ── Condition query layer ───────────────────────────────────────────────────
// One declarative condition shape evaluated everywhere game logic gates on
// world state: dialogue options, triggers, cutscene branches, shop stock and
// prices. Predicates within a single node are ANDed; `all` / `any` / `not`
// compose nodes. Evaluation lives in src/utils/conditions.ts.
export interface ConditionData {
  // Switch flag matches (switch_value defaults to true).
  switch?: string;
  switch_value?: boolean;
  // Quest is in a specific state.
  quest?: string;
  quest_state?: string;
  // Inventory holds at least item_count (default 1) of the item.
  has_item?: string;
  item_count?: number;
  // Entity id is in the party.
  party_contains?: string;
  // Faction reputation bounds (missing rep counts as 0).
  faction?: string;
  rep_gte?: number;
  rep_lte?: number;
  // Clock phase id(s): witching_hour | night | dawn | day | dusk.
  // "night" also matches the witching hour.
  time_of_day?: string | string[];
  // Hour-of-day range [hour_gte, hour_lt), wrapping past midnight when
  // hour_gte > hour_lt (e.g. 22 → 5).
  hour_gte?: number;
  hour_lt?: number;
  // Combinators.
  not?: ConditionData;
  all?: ConditionData[];
  any?: ConditionData[];
}

export const ConditionSchema: z.ZodType<ConditionData> = z.lazy(() =>
  z.object({
    switch: z.string().optional(),
    switch_value: z.boolean().optional(),
    quest: z.string().optional(),
    quest_state: z.string().optional(),
    has_item: z.string().optional(),
    item_count: z.number().optional(),
    party_contains: z.string().optional(),
    faction: z.string().optional(),
    rep_gte: z.number().optional(),
    rep_lte: z.number().optional(),
    time_of_day: z.union([z.string(), z.array(z.string())]).optional(),
    hour_gte: z.number().optional(),
    hour_lt: z.number().optional(),
    not: ConditionSchema.optional(),
    all: z.array(ConditionSchema).optional(),
    any: z.array(ConditionSchema).optional(),
  }),
);

export const CellSchema = z.object({
  x: z.number(),
  y: z.number().default(0),
  z: z.number(),
  active: z.boolean(),
  walkable: z.boolean(),
  blocks_los: z.boolean(),
  height: z.number(),
  visual_height: z.number(),
  terrain: z.string().optional(),
  object_id: z.string().optional(),
  region_id: z.string().optional(),
  room_id: z.string().optional(),
  tag: z.string().optional(),
  hazard: z.string().optional(),
  infection: z.string().optional(),
  portal_id: z.string().optional(),
  surface_tag: z
    .enum(["none", "water", "oil", "blood", "poison", "firehazard", "ice"])
    .default("none"),
});

export const ObjectPlacementSchema = z.object({
  object_id: z.string(),
  cell: z.tuple([z.number(), z.number()]),
  facing: z.tuple([z.number(), z.number()]),
  dialogue_id: z.string().optional(),
});

export const SkillSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  description: z.string().optional(),
  ap_cost: z.number().default(1000),
  mp_cost: z.number().default(0),
  element: z
    .enum(["none", "fire", "shock", "water", "cold", "poison", "physical"])
    .default("none"),
  targeting: z
    .enum(["single", "line", "cone", "cross", "block"])
    .default("single"),
  range: z.number().default(1),
  payloads: z
    .array(
      z.object({
        type: z.enum(["damage", "heal", "status", "summon"]),
        value: z.number().optional(), // e.g., damage/heal amount or duration
        target_tags: z.array(z.string()).optional(), // filter payload to certain surface tags
        status_effect: z.string().optional(),
        entity_id: z.string().optional(), // for summons
      }),
    )
    .default([]),
});

export const EntitySchema = z.object({
  id: z.string(),
  display_name: z.string(),
  sprite_id: z.string().optional(),
  dialogue_id: z.string().optional(),
  // Optional dialogue used when this entity is in the party and the player
  // uses "Talk to Party". Falls back to dialogue_id when unset.
  party_dialogue_id: z.string().optional(),
  is_npc: z.boolean().default(false),
  max_hp: z.number().default(10),
  max_mp: z.number().default(0),
  attack: z.number().default(2),
  defense: z.number().default(1),
  speed: z.number().default(10),
  xp_reward: z.number().optional(),
  // Ability ids this entity can use. Party members cast these on their
  // combat turns (the player picks the target).
  skills: z.array(z.string()).optional(),
});

// One waypoint of an NPC's daily routine. At `hour` (0-23) the NPC starts
// walking toward `cell` and stays there until the next entry takes over
// (entries wrap around midnight). Only friendly NPCs (is_npc) follow
// schedules; hostiles keep their chase AI.
export const ScheduleEntrySchema = z.object({
  hour: z.number(),
  cell: z.tuple([z.number(), z.number()]),
});

export const EntityPlacementSchema = z.object({
  entity_id: z.string(),
  cell: z.tuple([z.number(), z.number()]),
  schedule: z.array(ScheduleEntrySchema).optional(),
});

// A physical item lying on the ground. Picked up with Act; removal is
// tracked per save in map_deltas so the world stays looted.
export const WorldItemPlacementSchema = z.object({
  id: z.string(), // unique within the map
  item_id: z.string(),
  cell: z.tuple([z.number(), z.number()]),
  count: z.number().default(1),
});

// A lootable container. Rendered with `object_id` from the object library,
// blocks its cell, and persists its inventory per save in map_deltas.
export const ContainerPlacementSchema = z.object({
  id: z.string(), // unique within the map
  object_id: z.string(),
  cell: z.tuple([z.number(), z.number()]),
  facing: z.tuple([z.number(), z.number()]).default([0, 1]),
  display_name: z.string().optional(),
  locked: z.boolean().default(false),
  key_item_id: z.string().optional(), // item that unlocks it
  consume_key: z.boolean().default(false),
  items: z
    .array(
      z.object({
        item_id: z.string(),
        count: z.number().default(1),
      }),
    )
    .default([]),
});

export const ItemSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  description: z.string().optional(),
  icon: z.string().optional(), // Emoji, string
  sprite_id: z.string().optional(), // Sprite ID from Sprite Library
  category: z
    .enum(["consumable", "weapon", "armor", "key"])
    .default("consumable"),
  effects: z
    .object({
      heal: z.number().optional(),
      mp_restore: z.number().optional(),
      energy_restore: z.number().optional(),
      max_hp_bonus: z.number().optional(),
      damage: z.number().optional(),
      attack_bonus: z.number().optional(),
      defense_bonus: z.number().optional(),
      speed_bonus: z.number().optional(),
    })
    .optional(),
});

export const EventActionSchema = z.object({
  type: z.enum([
    "move_player",
    "move_entity",
    "show_dialogue",
    "set_switch",
    "wait",
    "teleport_player",
    "play_sound",
    "start_combat",
    "give_item",
    "remove_item",
    "set_player_sprite",
    "read_document",
    "heal_player",
    "open_shop",
    "give_currency",
    "remove_currency",
    "add_party_member",
    "remove_party_member",
    // Control flow: `label` is a no-op jump target; `branch` jumps to
    // `target_label` when `condition` passes (or unconditionally if absent).
    "label",
    "branch",
    // Staging verbs.
    "play_music", // music_url or music_id (settings.music_tracks); omit both to stop
    "screen_fade", // fade: "out" | "in", color, duration
    "camera_pan", // cell + duration to pan there; omit cell to return to player
    "adjust_faction_rep", // faction_id + amount (can be negative)
    "open_save_menu", // opens the save/load slots panel
    "advance_clock", // amount = game minutes (inn rest, act time-jumps)
    "modify_player_stats", // stats = deltas, e.g. { max_hp: 6, attack: 2 }
    "learn_skill", // skill_id added to known_skills
    "set_entity_hidden", // entity_id + hidden — despawn/respawn an entity
    "game_end", // ends the playthrough and shows the end screen (Act finale)
    "custom",
  ]),
  entity_id: z.string().optional(),
  cell: z.tuple([z.number(), z.number()]).optional(),
  facing: z.tuple([z.number(), z.number()]).optional(),
  dialogue_id: z.string().optional(),
  node_id: z.string().optional(),
  switch_id: z.string().optional(),
  switch_value: z.boolean().optional(),
  duration: z.number().optional(),
  map_id: z.string().optional(), // for teleport
  item_id: z.string().optional(), // for give/remove
  amount: z.number().optional(), // for items, currency, heal, or faction rep
  sprite_id: z.string().optional(), // for set_player_sprite
  document_id: z.string().optional(), // for read_document
  shop_id: z.string().optional(), // for open_shop
  label: z.string().optional(), // for label
  target_label: z.string().optional(), // for branch
  condition: ConditionSchema.optional(), // for branch
  music_id: z.string().optional(), // for play_music (settings.music_tracks key)
  music_url: z.string().optional(), // for play_music (direct URL / data URL)
  sound_id: z.string().optional(), // for play_sound (settings.sound_effects key)
  volume: z.number().optional(), // for play_music (0..1)
  fade: z.enum(["in", "out"]).optional(), // for screen_fade
  color: z.string().optional(), // for screen_fade
  faction_id: z.string().optional(), // for adjust_faction_rep
  stats: z.record(z.string(), z.number()).optional(), // for modify_player_stats
  skill_id: z.string().optional(), // for learn_skill
  hidden: z.boolean().optional(), // for set_entity_hidden
});

export const CutsceneSchema = z.object({
  id: z.string(),
  display_name: z.string().optional(),
  is_blocking: z.boolean().default(true),
  actions: z.array(EventActionSchema).default([]),
});

export const TriggerSchema = z.object({
  id: z.string(),
  cell: z.tuple([z.number(), z.number()]).optional(),
  type: z.enum(["step", "interact", "on_load", "switch_change"]),
  // Legacy switch-only conditions (still honored, ANDed with `condition`).
  conditions: z
    .array(
      z.object({
        switch_id: z.string(),
        expected_value: z.boolean(),
      }),
    )
    .default([]),
  // General gate — see ConditionSchema.
  condition: ConditionSchema.optional(),
  cutscene_id: z.string(),
  once: z.boolean().default(false),
});

// Walking onto an exit cell moves the player to another map. This is the
// primary authoring path for zone travel (town -> dungeon etc.); cutscene
// teleport_player actions remain available for scripted transitions.
export const MapExitSchema = z.object({
  id: z.string().optional(),
  cell: z.tuple([z.number(), z.number()]),
  target_map_id: z.string(),
  // Spawn on the target map. Falls back to the target map's first spawn.
  target_spawn_id: z.string().optional(),
  facing: z.tuple([z.number(), z.number()]).optional(),
  condition: ConditionSchema.optional(),
});

export const MapDataSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  width: z.number(),
  height: z.number(),
  spawns: z.array(
    z.object({
      id: z.string(),
      cell: z.tuple([z.number(), z.number()]),
      facing: z.tuple([z.number(), z.number()]),
    }),
  ),
  cells: z.array(CellSchema).default([]),
  props: z.array(z.any()).default([]),
  custom_object_placements: z.array(ObjectPlacementSchema).default([]),
  entity_placements: z.array(EntityPlacementSchema).default([]),
  item_placements: z.array(WorldItemPlacementSchema).default([]),
  container_placements: z.array(ContainerPlacementSchema).default([]),
  triggers: z.array(TriggerSchema).default([]),
  exits: z.array(MapExitSchema).default([]),
});

export const ObjectPartSchema = z.object({
  shape: z.enum([
    "box",
    "slab",
    "cylinder",
    "cone",
    "sphere",
    "arch",
    "column",
    "stair",
    "plane",
    "rib",
    "ring",
  ]),
  name: z.string(),
  position: z.tuple([z.number(), z.number(), z.number()]),
  rotation: z.tuple([z.number(), z.number(), z.number()]),
  size: z.tuple([z.number(), z.number(), z.number()]),
  segments: z.number().optional(),
  material: z.string().optional(),
});

export const ObjectMeshFaceSchema = z.object({
  name: z.string().optional(),
  vertices: z.array(z.number()).min(3),
  material: z.string().optional(),
  normal: z.tuple([z.number(), z.number(), z.number()]).optional(),
  group: z.string().optional(),
});

export const ObjectMeshSchema = z.object({
  vertices: z.array(z.tuple([z.number(), z.number(), z.number()])).default([]),
  faces: z.array(ObjectMeshFaceSchema).default([]),
  material_slots: z.array(z.string()).default([]),
  groups: z.array(z.string()).default([]),
});

export const ObjectAssetSchema = z.object({
  data_url: z.string(),
  filename: z.string(),
  source_type: z.enum(["glb", "gltf"]),
  offset: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  rotation: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  scale: z.tuple([z.number(), z.number(), z.number()]).default([1, 1, 1]),
  source_min: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  source_center: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
  source_bounds: z.tuple([z.number(), z.number(), z.number()]).default([1, 1, 1]),
  material_names: z.array(z.string()).default([]),
  stats: z
    .object({
      meshes: z.number().default(0),
      vertices: z.number().default(0),
      triangles: z.number().default(0),
      materials: z.number().default(0),
      textures: z.number().default(0),
      bytes: z.number().default(0),
    })
    .default({
      meshes: 0,
      vertices: 0,
      triangles: 0,
      materials: 0,
      textures: 0,
      bytes: 0,
    }),
});

export const MaterialTextureKindSchema = z
  .enum([
    "none",
    "stone_grain",
    "marble_veins",
    "wood_grain",
    "metal_scratches",
    "cloth_weave",
    "paper_fiber",
    "soil_grit",
    "water_shimmer",
    "glass_facets",
    "blood_sheen",
    "bone_pores",
  ])
  .default("none");

export const ObjectMaterialSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  color: z.string().default("#A3BE8C"),
  emissive: z.string().default("#000000"),
  emissive_intensity: z.number().default(0),
  opacity: z.number().default(1),
  transparent: z.boolean().default(false),
  roughness: z.number().default(0.7),
  metalness: z.number().default(0.02),
  texture_kind: MaterialTextureKindSchema,
  texture_scale: z.number().default(1),
  texture_strength: z.number().default(0.45),
  texture_image_url: z.string().optional(),
});

export const ObjectDecalSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  kind: z
    .enum(["blood", "crack", "marble_vein", "inscription", "grid_glow", "custom"])
    .default("crack"),
  position: z.tuple([z.number(), z.number(), z.number()]).default([0, 0.02, 0]),
  rotation: z.tuple([z.number(), z.number(), z.number()]).default([-Math.PI / 2, 0, 0]),
  size: z.tuple([z.number(), z.number()]).default([0.5, 0.5]),
  color: z.string().default("#E5E9F0"),
  opacity: z.number().default(0.75),
  emissive: z.boolean().default(false),
  target_face: z.number().optional(),
});

export const ObjectReferenceImageSchema = z.object({
  id: z.string(),
  view: z.enum(["front", "side", "top"]),
  name: z.string(),
  data_url: z.string(),
  opacity: z.number().default(0.45),
  locked: z.boolean().default(true),
  visible: z.boolean().default(true),
  scale: z.number().default(1),
  offset: z.tuple([z.number(), z.number(), z.number()]).default([0, 0, 0]),
});

export const ObjectSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  category: z.string(),
  tags: z.array(z.string()).default([]),
  origin: z.string().default("center_floor"),
  bounds: z.tuple([z.number(), z.number(), z.number()]),
  materials: z.array(z.string()).default([]),
  material_settings: z.array(ObjectMaterialSchema).default([]),
  model_kind: z.enum(["parts", "mesh", "hybrid", "asset"]).default("parts"),
  parts: z.array(ObjectPartSchema).default([]),
  mesh: ObjectMeshSchema.optional(),
  asset: ObjectAssetSchema.optional(),
  decals: z.array(ObjectDecalSchema).default([]),
  reference_images: z.array(ObjectReferenceImageSchema).default([]),
  collision: z.object({
    profile: z
      .enum([
        "none",
        "single",
        "line",
        "rect",
        "custom_footprint",
        "walkable_support",
      ])
      .default("single"),
    footprint: z.array(z.tuple([z.number(), z.number()])).default([[0, 0]]),
  }),
});

export const SpriteSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const sprite = value as Record<string, unknown>;
    if (!Array.isArray(sprite.data_url)) return value;
    const pixels = Array.isArray(sprite.pixels) && sprite.pixels.length ? sprite.pixels : sprite.data_url;
    return { ...sprite, data_url: undefined, pixels };
  },
  z.object({
    id: z.string(),
    display_name: z.string(),
    width: z.number().default(128),
    height: z.number().default(128),
    pixels: z.array(z.string()).default([]),
    data_url: z.string().optional(),
  }),
);

const DialogueOptionSchema = z.preprocess(
  (value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return value;
    const option = value as Record<string, unknown>;
    if (option.next_node_id !== null) return value;
    const { next_node_id: _nextNodeId, ...rest } = option;
    return rest;
  },
  z.object({
    text: z.string(),
    next_node_id: z.string().optional(), // if undefined, ends dialogue
    required_quest: z.string().optional(),
    required_quest_state: z.string().optional(),
    // Option is hidden unless the switch matches. required_switch_value
    // defaults to true, so `required_switch: "x"` means "x must be on".
    required_switch: z.string().optional(),
    required_switch_value: z.boolean().optional(),
    // General gate — see ConditionSchema. Combined (AND) with the
    // legacy required_* fields above.
    condition: ConditionSchema.optional(),
    trigger_quest: z.string().optional(),
    trigger_quest_state: z.string().optional(),
    // Choosing this option sets a switch. set_switch_value defaults true.
    set_switch: z.string().optional(),
    set_switch_value: z.boolean().optional(),
    // For choices that need to mark multiple story facts at once.
    set_switches: z
      .array(
        z.object({
          switch_id: z.string(),
          switch_value: z.boolean().optional(),
        }),
      )
      .optional(),
    trigger_cutscene: z.string().optional(),
  }),
);

export const DialogueNodeSchema = z.object({
  id: z.string(),
  speaker: z.string(),
  text: z.string(),
  scene_image_url: z.string().optional(),
  scene_image_alt: z.string().optional(),
  options: z.array(DialogueOptionSchema).default([]),
});

export const DialogueSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  nodes: z.array(DialogueNodeSchema).default([]),
});

export const QuestObjectiveSchema = z.object({
  id: z.string(),
  description: z.string(),
  type: z.enum(["talk", "kill", "collect", "explore", "interact", "custom"]),
  target_id: z.string(),
  count: z.number().default(1),
});

export const QuestSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  description: z.string(),
  objectives: z.array(QuestObjectiveSchema).default([]),
});

export const DocumentSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  content: z.string(),
});

// Conditional price adjustment, applied in order: price * multiplier + delta.
export const ShopPriceModifierSchema = z.object({
  condition: ConditionSchema.optional(),
  multiplier: z.number().default(1),
  delta: z.number().default(0),
});

export const ShopItemSchema = z.object({
  item_id: z.string(),
  price: z.number(),
  // Item is hidden from stock unless the condition passes.
  condition: ConditionSchema.optional(),
  price_modifiers: z.array(ShopPriceModifierSchema).default([]),
});

export const ShopSchema = z.object({
  id: z.string(),
  display_name: z.string(),
  items: z.array(ShopItemSchema).default([]),
});

export const GamePackageSchema = z.object({
  schema: z.literal("familiar_dark_game_package_v1"),
  metadata: GameMetadataSchema,
  settings: z.record(z.string(), z.any()).default({}),
  maps: z.array(MapDataSchema).default([]),
  object_library: z.array(ObjectSchema).default([]),
  sprite_library: z.array(SpriteSchema).default([]),
  entities: z.array(EntitySchema).default([]),
  dialogue: z.array(DialogueSchema).default([]),
  documents: z.array(DocumentSchema).default([]),
  quests: z.array(QuestSchema).default([]),
  cutscenes: z.array(CutsceneSchema).default([]),
  switches: z.record(z.string(), z.boolean()).default({}),
  items: z.array(ItemSchema).default([]),
  abilities: z.array(SkillSchema).default([]),
  encounters: z.array(z.any()).default([]),
  shops: z.array(ShopSchema).default([]),
  factions: z.array(z.any()).default([]),
  endings: z.array(z.any()).default([]),
  validators: z.record(z.string(), z.any()).default({}),
});

export type GamePackage = z.infer<typeof GamePackageSchema>;
export type MapData = z.infer<typeof MapDataSchema>;
export type MapExitData = z.infer<typeof MapExitSchema>;
export type WorldItemPlacementData = z.infer<typeof WorldItemPlacementSchema>;
export type ContainerPlacementData = z.infer<typeof ContainerPlacementSchema>;
export type ScheduleEntryData = z.infer<typeof ScheduleEntrySchema>;
export type CellData = z.infer<typeof CellSchema>;
export type ObjectData = z.infer<typeof ObjectSchema>;
export type ObjectPart = z.infer<typeof ObjectPartSchema>;
export type ObjectMeshFace = z.infer<typeof ObjectMeshFaceSchema>;
export type ObjectMeshData = z.infer<typeof ObjectMeshSchema>;
export type ObjectAssetData = z.infer<typeof ObjectAssetSchema>;
export type ObjectMaterialData = z.infer<typeof ObjectMaterialSchema>;
export type ObjectDecalData = z.infer<typeof ObjectDecalSchema>;
export type ObjectReferenceImageData = z.infer<typeof ObjectReferenceImageSchema>;
export type SpriteData = z.infer<typeof SpriteSchema>;
export type DialogueData = z.infer<typeof DialogueSchema>;
export type DialogueNodeData = z.infer<typeof DialogueNodeSchema>;
export type QuestData = z.infer<typeof QuestSchema>;
export type QuestObjectiveData = z.infer<typeof QuestObjectiveSchema>;
export type EntityData = z.infer<typeof EntitySchema>;
export type EntityPlacementData = z.infer<typeof EntityPlacementSchema>;
export type ObjectPlacementData = z.infer<typeof ObjectPlacementSchema>;
export type ItemData = z.infer<typeof ItemSchema>;
export type SkillData = z.infer<typeof SkillSchema>;
export type DocumentData = z.infer<typeof DocumentSchema>;

export type TriggerData = z.infer<typeof TriggerSchema>;
export type EventActionData = z.infer<typeof EventActionSchema>;
export type CutsceneData = z.infer<typeof CutsceneSchema>;
export type ShopData = z.infer<typeof ShopSchema>;
export type ShopItemData = z.infer<typeof ShopItemSchema>;
export type ShopPriceModifierData = z.infer<typeof ShopPriceModifierSchema>;

export const createEmptyGamePackage = (): GamePackage => {
  const town = generateTownCells();
  const parish = generateParishCells();
  const network = generateNetworkCells();
  const depths = generateNetworkDepthsCells();
  const residentialBlock = generateResidentialBlockCells();
  const townSquare = generateTownSquareCells();
  const templeCordon = generateTempleCordonCells();
  const caveUpper = generateCaveUpperCells();
  const caveDeep = generateCaveDeepCells();
  const riverPath = generateRiverPathCells();
  const lazareHouse = generateLazareHouseCells();
  const mouthstoneField = generateMouthstoneFieldCells();
  const glassworks = generateGlassworksCells();
  const caveGrotto = generateCaveGrottoCells();
  const oldProcessionalWood = generateOldProcessionalWoodCells();
  const glassTouchedCopse = generateGlassTouchedCopseCells();
  const gamePackage: GamePackage = {
    schema: "familiar_dark_game_package_v1",
    metadata: {
      title: "The Familiar Dark",
      version: "1.0.0",
      // Act 1: multi-map architecture, ceremony starts in Town Square.
      start_map_id: "map_town_square",
      start_spawn_id: "spawn_ceremony",
    },
    // The story opens at night beneath the black stars.
    settings: {
      clock_start_hour: 21,
      minutes_per_turn: 2,
      player_sprite_id: "spr_hero",
      music_tracks: {
        title: "/music/rain-on-the-ledger.mp3",
        town: "/music/l-ombre-des-bles.mp3",
        network: "/music/Pagan Network.wav",
        river: "/music/River.wav",
        combat: "/music/le-verre-en-spleen.mp3",
      },
      sound_effects: {
        ui_click: "/sfx/ui-click.wav",
        ui_back: "/sfx/ui-back.wav",
        dialogue_open: "/sfx/dialogue-open.wav",
        dialogue_next: "/sfx/dialogue-next.wav",
        document_open: "/sfx/document-open.wav",
        item_pickup: "/sfx/item-pickup.wav",
        coin: "/sfx/coin.wav",
        save_candle: "/sfx/save-candle.wav",
        shop_open: "/sfx/shop-open.wav",
        door_transition: "/sfx/door-transition.wav",
        footstep_stone: "/sfx/footstep-stone.wav",
        bump: "/sfx/bump.wav",
        melee_swing: "/sfx/melee-swing.wav",
        melee_hit: "/sfx/melee-hit.wav",
        melee_crit: "/sfx/melee-crit.wav",
        enemy_defeat: "/sfx/enemy-defeat.wav",
        spell_cast: "/sfx/spell-cast.wav",
        spell_hit: "/sfx/spell-hit.wav",
        heal: "/sfx/heal.wav",
        level_up: "/sfx/level-up.wav",
        warning: "/sfx/warning.wav",
      },
      map_music: {
        map_town_square: "town",
        map_residential: "town",
        map_temple_cordon: "town",
        map_old_processional_wood: "town",
        map_glass_touched_copse: "network",
        map_cave_upper: "network",
        map_cave_deep: "network",
        map_river_path: "river",
        map_lazare_house: "town",
        map_mouthstone_field: "town",
        map_glassworks: "network",
        map_cave_grotto: "network",
        map_parish: "town",
        map_town: "town",
        map_network_upper: "network",
        map_network_depths: "network",
      },
    },
    maps: [
      // ════════════════════════════════════════════════════════════════════
      // ACT 1: Multi-map architecture (12 maps, hub-and-spoke)
      // ════════════════════════════════════════════════════════════════════
      {
        id: "map_town_square",
        display_name: "Town Square",
        width: SQUARE_W,
        height: SQUARE_H,
        spawns: [
          { id: "spawn_ceremony", cell: [0, -12], facing: [0, 1] },
          { id: "spawn_from_south", cell: [0, 19], facing: [0, -1] },
          { id: "spawn_from_east", cell: [19, 0], facing: [-1, 0] },
          { id: "spawn_from_north", cell: [0, -19], facing: [0, 1] },
          { id: "spawn_from_cellar", cell: [-11, 13], facing: [-1, 0] },
        ],
        cells: townSquare.cells,
        props: [],
        custom_object_placements: townSquare.custom_object_placements,
        item_placements: townSquare.item_placements,
        container_placements: townSquare.container_placements,
        entity_placements: townSquare.entity_placements,
        triggers: townSquare.triggers,
        exits: [
          // South edge → Residential
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(x => ({
            cell: [x, 20] as [number, number],
            target_map_id: "map_residential",
            target_spawn_id: "spawn_from_north",
            facing: [0, 1] as [number, number],
          })),
          // East edge → Temple/Cordon
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(z => ({
            cell: [20, z] as [number, number],
            target_map_id: "map_temple_cordon",
            target_spawn_id: "spawn_from_town_square_west",
            facing: [1, 0] as [number, number],
          })),
          // North edge → Mouthstone Field
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(x => ({
            cell: [x, -20] as [number, number],
            target_map_id: "map_mouthstone_field",
            target_spawn_id: "spawn_from_south",
            facing: [0, -1] as [number, number],
          })),
        ],
      },
      {
        id: "map_residential",
        display_name: "Residential Quarter",
        width: BLOCK_W,
        height: BLOCK_H,
        spawns: [
          { id: "spawn_from_north", cell: [0, -19], facing: [0, 1] },
          { id: "spawn_from_east", cell: [19, 0], facing: [-1, 0] },
          { id: "spawn_from_south", cell: [0, 19], facing: [0, -1] },
          { id: "spawn_from_west", cell: [-19, 0], facing: [1, 0] },
          { id: "spawn_from_lazare", cell: [-10, 19], facing: [0, -1] },
        ],
        cells: residentialBlock.cells,
        props: [],
        custom_object_placements: residentialBlock.custom_object_placements,
        item_placements: residentialBlock.item_placements,
        container_placements: residentialBlock.container_placements,
        entity_placements: [
          ...residentialBlock.entity_placements,
          // Townsfolk who hang around the residential streets.
          // (ent_ferryman lives at the river path; ent_merchant and
          // ent_innkeep live in the town square social/market hub.)
          { entity_id: "ent_mother", cell: [-12, 7], schedule: [
            { hour: 8, cell: [-12, 7] },
            { hour: 18, cell: [-6, 4] },
            { hour: 22, cell: [-14, 12] },
          ] },   // outside the pilgrim's shrine
        ],
        triggers: [
          ...residentialBlock.triggers,
          // Town music
          { id: "trg_res_music", type: "on_load" as const, conditions: [], cutscene_id: "cut_town_music", once: false },
          // Cave gate: can't go south without testimony + lazare
          ...([- 3, -2, -1, 0, 1, 2, 3] as number[]).map((x, i) => ({
            id: `trg_gate_cave_${i}`,
            cell: [x, 19] as [number, number],
            type: "step" as const,
            conditions: [] as any[],
            condition: { not: { all: [{ switch: "lazare_talked" }, { switch: "testimonies_gathered" }] } },
            cutscene_id: "cut_gate_blocked_cave",
            once: false,
          })),
          ...([- 3, -2, -1, 0, 1, 2, 3] as number[]).map((x, i) => ({
            id: `trg_gate_cave_exit_${i}`,
            cell: [x, 20] as [number, number],
            type: "step" as const,
            conditions: [] as any[],
            condition: { not: { all: [{ switch: "lazare_talked" }, { switch: "testimonies_gathered" }] } },
            cutscene_id: "cut_gate_blocked_cave",
            once: false,
          })),
        ],
        exits: [
          // North edge → Town Square
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(x => ({
            cell: [x, -20] as [number, number],
            target_map_id: "map_town_square",
            target_spawn_id: "spawn_from_south",
            facing: [0, -1] as [number, number],
          })),
          // East edge → Lazare's Estate
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(z => ({
            cell: [20, z] as [number, number],
            target_map_id: "map_lazare_house",
            target_spawn_id: "spawn_from_west",
            facing: [1, 0] as [number, number],
          })),
          // South edge → Old Processional Wood (only works when gate conditions met)
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(x => ({
            cell: [x, 20] as [number, number],
            target_map_id: "map_old_processional_wood",
            target_spawn_id: "spawn_from_north",
            facing: [0, 1] as [number, number],
            condition: { all: [{ switch: "lazare_talked" }, { switch: "testimonies_gathered" }] },
          })),
          // West edge → River Path
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(z => ({
            cell: [-20, z] as [number, number],
            target_map_id: "map_river_path",
            target_spawn_id: "spawn_from_east",
            facing: [-1, 0] as [number, number],
          })),
        ],
      },
      {
        id: "map_temple_cordon",
        display_name: "Temple & Witness Cordon",
        width: TEMPLE_W,
        height: TEMPLE_H,
        spawns: [
          { id: "spawn_from_town_square_west", cell: [-39, -20], facing: [1, 0] },
          { id: "spawn_from_east", cell: [39, 0], facing: [-1, 0] },
        ],
        cells: templeCordon.cells,
        props: [],
        custom_object_placements: templeCordon.custom_object_placements,
        item_placements: templeCordon.item_placements,
        container_placements: templeCordon.container_placements,
        entity_placements: templeCordon.entity_placements,
        triggers: templeCordon.triggers,
        exits: [
          // West edge (Upper) → Town Square
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(z => ({
            cell: [-40, -20 + z] as [number, number],
            target_map_id: "map_town_square",
            target_spawn_id: "spawn_from_east",
            facing: [-1, 0] as [number, number],
          })),
          // East edge → Glassworks
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(z => ({
            cell: [40, z] as [number, number],
            target_map_id: "map_glassworks",
            target_spawn_id: "spawn_from_west",
            facing: [1, 0] as [number, number],
            condition: { switch: "orin_public_accusation_seen" },
          })),
        ],
      },
      {
        id: "map_old_processional_wood",
        display_name: "Old Processional Wood",
        width: OLD_WOOD_W,
        height: OLD_WOOD_H,
        spawns: [
          { id: "spawn_from_north", cell: [0, -19], facing: [0, 1] },
          { id: "spawn_from_south", cell: [0, 19], facing: [0, -1] },
        ],
        cells: oldProcessionalWood.cells,
        props: [],
        custom_object_placements: oldProcessionalWood.custom_object_placements,
        item_placements: oldProcessionalWood.item_placements,
        container_placements: oldProcessionalWood.container_placements,
        entity_placements: oldProcessionalWood.entity_placements,
        triggers: oldProcessionalWood.triggers,
        exits: [
          // North edge → Residential Quarter
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(x => ({
            cell: [x, -20] as [number, number],
            target_map_id: "map_residential",
            target_spawn_id: "spawn_from_south",
            facing: [0, -1] as [number, number],
          })),
          // South edge → Glass-Touched Copse
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(x => ({
            cell: [x, 20] as [number, number],
            target_map_id: "map_glass_touched_copse",
            target_spawn_id: "spawn_from_north",
            facing: [0, 1] as [number, number],
          })),
        ],
      },
      {
        id: "map_glass_touched_copse",
        display_name: "Glass-Touched Copse",
        width: GLASS_COPSE_W,
        height: GLASS_COPSE_H,
        spawns: [
          { id: "spawn_from_north", cell: [0, -19], facing: [0, 1] },
          { id: "spawn_from_south", cell: [7, 19], facing: [0, -1] },
        ],
        cells: glassTouchedCopse.cells,
        props: [],
        custom_object_placements: glassTouchedCopse.custom_object_placements,
        item_placements: glassTouchedCopse.item_placements,
        container_placements: glassTouchedCopse.container_placements,
        entity_placements: glassTouchedCopse.entity_placements,
        triggers: glassTouchedCopse.triggers,
        exits: [
          // North edge → Old Processional Wood
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(x => ({
            cell: [x, -20] as [number, number],
            target_map_id: "map_old_processional_wood",
            target_spawn_id: "spawn_from_south",
            facing: [0, -1] as [number, number],
          })),
          // South edge → Eastern Caves
          ...([4, 5, 6, 7, 8, 9, 10] as number[]).map(x => ({
            cell: [x, 20] as [number, number],
            target_map_id: "map_cave_upper",
            target_spawn_id: "spawn_from_north",
            facing: [0, 1] as [number, number],
          })),
        ],
      },
      {
        id: "map_cave_upper",
        display_name: "Eastern Caves",
        width: CAVE_UPPER_W,
        height: CAVE_UPPER_H,
        spawns: [
          { id: "spawn_from_north", cell: [0, -39], facing: [0, 1] },
          { id: "spawn_from_south", cell: [0, 39], facing: [0, -1] },
          { id: "spawn_from_east", cell: [39, -12], facing: [-1, 0] },
        ],
        cells: caveUpper.cells,
        props: [],
        custom_object_placements: caveUpper.custom_object_placements,
        item_placements: caveUpper.item_placements,
        container_placements: caveUpper.container_placements,
        entity_placements: caveUpper.entity_placements,
        triggers: caveUpper.triggers,
        exits: [
          // North edge → Glass-Touched Copse (surface return)
          ...([-2, -1, 0, 1, 2] as number[]).map(x => ({
            cell: [x, -40] as [number, number],
            target_map_id: "map_glass_touched_copse",
            target_spawn_id: "spawn_from_south",
            facing: [0, -1] as [number, number],
          })),
          // South edge → Cave Deep
          ...([-2, -1, 0, 1, 2] as number[]).map(x => ({
            cell: [x, 40] as [number, number],
            target_map_id: "map_cave_deep",
            target_spawn_id: "spawn_from_north",
            facing: [0, 1] as [number, number],
          })),
          // East edge → Cave Grotto
          ...([-14, -13, -12, -11, -10] as number[]).map(z => ({
            cell: [40, z] as [number, number],
            target_map_id: "map_cave_grotto",
            target_spawn_id: "spawn_from_west",
            facing: [1, 0] as [number, number],
          })),
        ],
      },
      {
        id: "map_cave_deep",
        display_name: "The Depths",
        width: CAVE_DEEP_W,
        height: CAVE_DEEP_H,
        spawns: [
          { id: "spawn_from_north", cell: [0, -39], facing: [0, 1] },
        ],
        cells: caveDeep.cells,
        props: [],
        custom_object_placements: caveDeep.custom_object_placements,
        item_placements: caveDeep.item_placements,
        container_placements: caveDeep.container_placements,
        entity_placements: caveDeep.entity_placements,
        triggers: caveDeep.triggers,
        exits: [
          // North edge → Cave Upper (return)
          ...([-2, -1, 0, 1, 2] as number[]).map(x => ({
            cell: [x, -40] as [number, number],
            target_map_id: "map_cave_upper",
            target_spawn_id: "spawn_from_south",
            facing: [0, -1] as [number, number],
          })),
        ],
      },
      // ── New spoke maps (dead-ends, single exit each) ───────────────────
      {
        id: "map_river_path",
        display_name: "River Path",
        width: RIVER_W,
        height: RIVER_H,
        spawns: [
          { id: "spawn_from_east", cell: [19, 0], facing: [-1, 0] },
        ],
        cells: riverPath.cells,
        props: [],
        custom_object_placements: riverPath.custom_object_placements,
        item_placements: riverPath.item_placements,
        container_placements: riverPath.container_placements,
        entity_placements: riverPath.entity_placements,
        triggers: riverPath.triggers,
        exits: [
          // East edge → Residential (only exit)
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(z => ({
            cell: [20, z] as [number, number],
            target_map_id: "map_residential",
            target_spawn_id: "spawn_from_west",
            facing: [1, 0] as [number, number],
          })),
        ],
      },
      {
        id: "map_lazare_house",
        display_name: "Lazare's Estate",
        width: LAZARE_W,
        height: LAZARE_H,
        spawns: [
          { id: "spawn_from_west", cell: [-39, 10], facing: [1, 0] },
        ],
        cells: lazareHouse.cells,
        props: [],
        custom_object_placements: lazareHouse.custom_object_placements,
        item_placements: lazareHouse.item_placements,
        container_placements: lazareHouse.container_placements,
        entity_placements: lazareHouse.entity_placements,
        triggers: lazareHouse.triggers,
        exits: [
          // West edge → Residential (only exit)
          ...([-2, -1, 0, 1, 2] as number[]).map(z => ({
            cell: [-40, 10 + z] as [number, number],
            target_map_id: "map_residential",
            target_spawn_id: "spawn_from_east",
            facing: [-1, 0] as [number, number],
          })),
        ],
      },
      {
        id: "map_mouthstone_field",
        display_name: "Mouthstone Field",
        width: MOUTHSTONE_W,
        height: MOUTHSTONE_H,
        spawns: [
          { id: "spawn_from_south", cell: [0, 19], facing: [0, -1] },
        ],
        cells: mouthstoneField.cells,
        props: [],
        custom_object_placements: mouthstoneField.custom_object_placements,
        item_placements: mouthstoneField.item_placements,
        container_placements: mouthstoneField.container_placements,
        entity_placements: mouthstoneField.entity_placements,
        triggers: mouthstoneField.triggers,
        exits: [
          // South edge → Town Square (only exit)
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(x => ({
            cell: [x, 20] as [number, number],
            target_map_id: "map_town_square",
            target_spawn_id: "spawn_from_north",
            facing: [0, 1] as [number, number],
          })),
        ],
      },
      {
        id: "map_glassworks",
        display_name: "Abandoned Glassworks",
        width: GLASS_W,
        height: GLASS_H,
        spawns: [
          { id: "spawn_from_west", cell: [-39, 0], facing: [1, 0] },
        ],
        cells: glassworks.cells,
        props: [],
        custom_object_placements: glassworks.custom_object_placements,
        item_placements: glassworks.item_placements,
        container_placements: glassworks.container_placements,
        entity_placements: glassworks.entity_placements,
        triggers: glassworks.triggers,
        exits: [
          // West edge → Temple Cordon (only exit)
          ...([-3, -2, -1, 0, 1, 2, 3] as number[]).map(z => ({
            cell: [-40, z] as [number, number],
            target_map_id: "map_temple_cordon",
            target_spawn_id: "spawn_from_east",
            facing: [-1, 0] as [number, number],
          })),
        ],
      },
      {
        id: "map_cave_grotto",
        display_name: "Crystal Grotto",
        width: GROTTO_W,
        height: GROTTO_H,
        spawns: [
          { id: "spawn_from_west", cell: [-39, 0], facing: [1, 0] },
        ],
        cells: caveGrotto.cells,
        props: [],
        custom_object_placements: caveGrotto.custom_object_placements,
        item_placements: caveGrotto.item_placements,
        container_placements: caveGrotto.container_placements,
        entity_placements: caveGrotto.entity_placements,
        triggers: caveGrotto.triggers,
        exits: [
          // West edge → Cave Upper (only exit)
          ...([-2, -1, 0, 1, 2] as number[]).map(z => ({
            cell: [-40, z] as [number, number],
            target_map_id: "map_cave_upper",
            target_spawn_id: "spawn_from_east",
            facing: [-1, 0] as [number, number],
          })),
        ],
      },
      // ════════════════════════════════════════════════════════════════════
      // LEGACY MAPS (kept for reference/tooling, not used in Act 1 start)
      // ════════════════════════════════════════════════════════════════════
      {
        id: "map_network_upper",
        display_name: "The Pagan Network - Upper Level",
        width: 122,
        height: 102,
        spawns: [
          {
            id: "spawn_cellar_entry",
            cell: [0, -17],
            facing: [0, 1],
          },
          {
            id: "spawn_from_depths",
            cell: [0, 73],
            facing: [0, -1],
          },
        ],
        cells: network.cells,
        props: [],
        custom_object_placements: network.custom_object_placements,
        item_placements: network.item_placements,
        container_placements: network.container_placements,
        entity_placements: network.entity_placements,
        triggers: network.triggers,
        exits: [
          // South throat, past the antechamber: down to the Depths.
          {
            cell: [0, 75],
            target_map_id: "map_network_depths",
            target_spawn_id: "spawn_from_upper",
            facing: [0, 1],
          },
          // North end of the Surface Seam: the ladder back up to the cellar.
          {
            cell: [0, -19],
            target_map_id: "map_town_square",
            target_spawn_id: "spawn_from_cellar",
            facing: [0, 1],
          },
          {
            cell: [-1, -19],
            target_map_id: "map_town_square",
            target_spawn_id: "spawn_from_cellar",
            facing: [0, 1],
          },
        ],
      },
      {
        id: "map_network_depths",
        display_name: "The Pagan Network - Depths",
        width: 47,
        height: 41,
        spawns: [
          {
            id: "spawn_from_upper",
            cell: [0, -17],
            facing: [0, 1],
          },
        ],
        cells: depths.cells,
        props: [],
        custom_object_placements: depths.custom_object_placements,
        item_placements: depths.item_placements,
        container_placements: depths.container_placements,
        entity_placements: depths.entity_placements,
        triggers: depths.triggers,
        exits: [
          {
            cell: [0, -19],
            target_map_id: "map_network_upper",
            target_spawn_id: "spawn_from_depths",
            facing: [0, -1],
          },
        ],
      },
      {
        id: "map_parish",
        display_name: "Alderamontico Parish",
        width: PARISH_W,
        height: PARISH_H,
        // Spawns + exits now flow out of parish_gen via the DSL; the layout
        // file owns its own anchors so game.ts doesn't drift out of sync.
        spawns: parish.spawns,
        cells: parish.cells,
        props: [],
        custom_object_placements: parish.custom_object_placements,
        item_placements: parish.item_placements,
        container_placements: parish.container_placements,
        entity_placements: parish.entity_placements,
        triggers: parish.triggers,
        exits: parish.exits,
      },
      {
        id: "map_town",
        display_name: "The Town of the Witness",
        width: TOWN_W,
        height: TOWN_H,
        spawns: [
          {
            id: "spawn_intercessor",
            cell: [0, -63],
            facing: [0, 1],
          },
          {
            id: "spawn_from_network",
            cell: [-18, -12],
            facing: [0, 1],
          },
        ],
        cells: town.cells,
        props: [],
        custom_object_placements: town.custom_object_placements,
        item_placements: town.item_placements,
        container_placements: town.container_placements,
        entity_placements: town.entity_placements,
        triggers: town.triggers,
        exits: [],
      },

    ],
    object_library: objectLibraryPresets as any,
    sprite_library: spriteLibraryPresets as any,
    documents: FD_DOCUMENTS,
    entities: FD_ENTITIES,
    dialogue: FD_DIALOGUE,
    quests: FD_QUESTS,
    cutscenes: FD_CUTSCENES,
    switches: {},
    items: FD_ITEMS,
    abilities: [
      {
        id: "skl_investigate",
        display_name: "Examine",
        description: "Search for traces of the Grid or pagan work.",
        ap_cost: 100,
        mp_cost: 0,
        element: "none",
        targeting: "single",
        range: 1,
        payloads: [],
      },
      {
        id: "skl_sacred_line",
        display_name: "Sacred Line",
        description:
          "Scholar's rite: a read verse pressed flat into the world, striking everything along it.",
        ap_cost: 1000,
        mp_cost: 3,
        element: "shock",
        targeting: "line",
        range: 4,
        payloads: [{ type: "damage", value: 4 }],
      },
      {
        id: "skl_candle_mend",
        display_name: "Candle Mend",
        description: "Scholar's rite: borrowed warmth, returned to a body.",
        ap_cost: 1000,
        mp_cost: 2,
        element: "fire",
        targeting: "single",
        range: 1,
        payloads: [{ type: "heal", value: 5 }],
      },
      {
        id: "skl_cleave",
        display_name: "Cleave",
        description:
          "Warrior's art: church steel swung through everything adjacent at once.",
        ap_cost: 1000,
        mp_cost: 0,
        element: "physical",
        targeting: "cross",
        range: 1,
        payloads: [{ type: "damage", value: 5 }],
      },
      {
        id: "skl_witness_flame",
        display_name: "Witness Flame",
        description:
          "Mystic's rite: a votive flame that remembers being seen, cast at what should not be.",
        ap_cost: 1000,
        mp_cost: 2,
        element: "fire",
        targeting: "single",
        range: 3,
        payloads: [{ type: "damage", value: 3 }],
      },
      {
        id: "skl_still_echo",
        display_name: "Still the Echo",
        description:
          "Mystic's rite: quiet what lingers — knit a nearby body back toward itself.",
        ap_cost: 1000,
        mp_cost: 2,
        element: "none",
        targeting: "single",
        range: 2,
        payloads: [{ type: "heal", value: 4 }],
      },
      // ── Aldric's rites — usable only on his combat turns ──
      {
        id: "skl_censer_arc",
        display_name: "Censer Arc",
        description:
          "Aldric: the burning censer swung in a wide arc — sanctified fire across a cone of ground.",
        ap_cost: 1000,
        mp_cost: 2,
        element: "fire",
        targeting: "cone",
        range: 2,
        payloads: [{ type: "damage", value: 4 }],
      },
      {
        id: "skl_censure",
        display_name: "Censure",
        description:
          "Aldric: a verdict pronounced aloud. The word lands harder than the staff.",
        ap_cost: 1000,
        mp_cost: 3,
        element: "shock",
        targeting: "single",
        range: 3,
        payloads: [{ type: "damage", value: 5 }],
      },
      {
        id: "skl_brothers_oath",
        display_name: "Brother's Oath",
        description:
          "Aldric: an oath remembered aloud — it mends an ally's wounds whether or not they believe it.",
        ap_cost: 1000,
        mp_cost: 2,
        element: "none",
        targeting: "single",
        range: 2,
        payloads: [{ type: "heal", value: 6 }],
      },
    ],
    encounters: [],
    shops: FD_SHOPS,
    factions: [],
    endings: [],
    validators: {},
  };

  return pruneObjectLibraryToAct1Usage(removeNonStoryMapClutter(gamePackage));
};
