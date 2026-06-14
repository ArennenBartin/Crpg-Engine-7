// Parish theme — binds abstract roles to the concrete parishKit object_ids.
//
// Authoring code refers to roles ("floor.cobble", "wall.timber",
// "roof.slate", "nature.tree.dark", "grave.headstone"); switching theme
// re-skins a whole map without touching layout code.

import type { RoofSet, Theme } from "./mapAuthoring";

const SIMPLE: Record<string, string> = {
  // Floors / ground
  "floor.turf": "obj_p_turf",
  "floor.road": "obj_p_road",
  "floor.cobble": "obj_p_cobble",
  "floor.flagstone": "obj_p_flagstone",
  "floor.boards": "obj_p_boards",
  "floor.grave_earth": "obj_p_grave_earth",
  "floor.tilled": "obj_p_plot",
  "floor.mud": "obj_p_mud",
  "floor.river": "obj_p_river",

  // Walls
  "wall.fieldstone": "obj_p_wall_fieldstone",
  "wall.timber": "obj_p_wall_timber",
  "wall.church": "obj_p_wall_church",
  "wall.low": "obj_p_wall_low",
  "wall.cell_bars": "obj_p_cell_bars",

  // Doors / openings
  "door": "obj_p_door",
  "fence.iron": "obj_p_iron_fence",
  "fence.cordon": "obj_p_cordon_post",

  // Lights / shrines
  "lantern": "obj_p_lantern",
  "candles": "obj_p_candles",
  "well": "obj_p_well",
  "notice": "obj_p_notice",
  "placard": "obj_p_placard",
  "stocks": "obj_p_stocks",
  "stall": "obj_p_stall",
  "inn_sign": "obj_p_inn_sign",
  "cart": "obj_p_cart",
  "barrel": "obj_p_barrel",
  "crate": "obj_p_crate",
  "trapdoor": "obj_p_trapdoor",
  "shrine_stone": "obj_p_shrine_stone",
  "votive_token": "obj_p_votive_token",
  "stairs": "obj_p_stairs",

  // Roof ornaments
  "chimney": "obj_p_chimney",
  "spire": "obj_p_spire",

  // Landmarks
  "church.front": "obj_p_church_front",
  "bell_tower": "obj_p_bell_tower",
  "rotunda": "obj_p_rotunda",
  "lych_gate": "obj_p_lych_gate",
  "market_cross": "obj_p_market_cross",
  "gibbet": "obj_p_gibbet",
  "monolith": "obj_p_monolith",
  "arch": "obj_p_arch",
  "glass_figure": "obj_p_glass_figure",
  "witness_statue": "obj_bleeding_witness",

  // Interior props
  "desk": "obj_p_desk",
  "shelf": "obj_p_shelf",
  "pallet_bed": "obj_pallet_bed",

  // Graves
  "grave.headstone": "obj_p_headstone",
  "grave.tomb": "obj_p_tomb",
  "grave.cross": "obj_p_grave_cross",

  // Industrial
  "industrial.smokestack": "obj_p_smokestack",
  "industrial.furnace": "obj_p_furnace",
  "industrial.pipes": "obj_p_pipes",
  "industrial.railcart": "obj_p_railcart",

  // River
  "river.bridge": "obj_p_bridge",
  "river.dock": "obj_p_dock",
  "river.reeds": "obj_p_reeds",

  // Nature
  "nature.tree": "obj_p_oak",
  "nature.tree.dark": "obj_p_yew",
  "nature.shrub": "obj_p_shrub",
};

const ROOFS: Record<string, RoofSet> = {
  slate: {
    n: "obj_p_roof_n", s: "obj_p_roof_s", e: "obj_p_roof_e", w: "obj_p_roof_w",
    flat: "obj_p_roof_flat",
    nw: "obj_p_roof_hip_nw", ne: "obj_p_roof_hip_ne",
    se: "obj_p_roof_hip_se", sw: "obj_p_roof_hip_sw",
  },
  clay: {
    n: "obj_p_roof_clay_n", s: "obj_p_roof_clay_s",
    e: "obj_p_roof_clay_e", w: "obj_p_roof_clay_w",
    flat: "obj_p_roof_clay_flat",
    nw: "obj_p_roof_clay_hip_nw", ne: "obj_p_roof_clay_hip_ne",
    se: "obj_p_roof_clay_hip_se", sw: "obj_p_roof_clay_hip_sw",
  },
};

export const parishTheme: Theme = {
  resolve(role: string): string {
    const id = SIMPLE[role];
    if (!id) throw new Error(`parishTheme: unknown role "${role}"`);
    return id;
  },
  resolveRoof(name: string): RoofSet {
    const set = ROOFS[name];
    if (!set) throw new Error(`parishTheme: unknown roof "${name}"`);
    return set;
  },
};
