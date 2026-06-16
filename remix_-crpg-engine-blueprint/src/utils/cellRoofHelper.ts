// Hipped-roof helper for cell-based map generators (not the DSL).
//
// Each gen file uses its own setTile/wallCell pattern; this just pushes
// roof cells at y=2.1 with the correct parishKit clay-roof piece per edge
// so any rectangular building footprint reads as a clean hipped roof from
// above (and the engine fades it when the player is inside, since y >= 1.5
// is treated as overhead geometry).

import type { CellData } from "../schema/game";

export type RoofStyle = "clay" | "slate";

const PIECES = {
  clay: {
    n: "obj_p_roof_clay_n",  s: "obj_p_roof_clay_s",
    e: "obj_p_roof_clay_e",  w: "obj_p_roof_clay_w",
    nw: "obj_p_roof_clay_hip_nw", ne: "obj_p_roof_clay_hip_ne",
    se: "obj_p_roof_clay_hip_se", sw: "obj_p_roof_clay_hip_sw",
    flat: "obj_p_roof_clay_flat",
  },
  slate: {
    n: "obj_p_roof_n",  s: "obj_p_roof_s",
    e: "obj_p_roof_e",  w: "obj_p_roof_w",
    nw: "obj_p_roof_hip_nw", ne: "obj_p_roof_hip_ne",
    se: "obj_p_roof_hip_se", sw: "obj_p_roof_hip_sw",
    flat: "obj_p_roof_flat",
  },
} as const;

// Push roof cells covering the rect [x0..x1, z0..z1] at y=2.1.
// `cells` is the same array the gen file is filling.
export function addHippedRoof(
  cells: CellData[],
  x0: number, z0: number,
  x1: number, z1: number,
  style: RoofStyle = "clay",
): void {
  const p = PIECES[style];
  for (let x = x0; x <= x1; x++) {
    for (let z = z0; z <= z1; z++) {
      const edgeN = z === z0, edgeS = z === z1, edgeW = x === x0, edgeE = x === x1;
      let id: string = p.flat;
      if (edgeN && edgeW) id = p.nw;
      else if (edgeN && edgeE) id = p.ne;
      else if (edgeS && edgeE) id = p.se;
      else if (edgeS && edgeW) id = p.sw;
      else if (edgeN) id = p.n;
      else if (edgeS) id = p.s;
      else if (edgeW) id = p.w;
      else if (edgeE) id = p.e;
      cells.push({
        x, y: 2.1, z,
        active: true, walkable: false, blocks_los: true,
        height: 0, visual_height: 0,
        terrain: "stone", surface_tag: "none",
        object_id: id,
      });
    }
  }
}
