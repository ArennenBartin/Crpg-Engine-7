import type { ObjectData, ObjectPlacementData } from "../schema/game";

type FootprintOffset = [number, number];

const rotateOffset = (
  [x, z]: FootprintOffset,
  facing: [number, number] = [0, 1],
): FootprintOffset => {
  const [fx, fz] = facing;

  if (Math.abs(fx) > Math.abs(fz)) {
    return fx > 0 ? [z, -x] : [-z, x];
  }

  return fz < 0 ? [-x, -z] : [x, z];
};

export const getObjectFootprint = (
  objectDef?: ObjectData,
): FootprintOffset[] => {
  const footprint = objectDef?.collision?.footprint;
  if (!footprint || footprint.length === 0) return [[0, 0]];

  return footprint.map((offset) => [
    Number(offset[0] || 0),
    Number(offset[1] || 0),
  ]);
};

export const getPlacementFootprint = (
  placement: ObjectPlacementData,
  objectDef?: ObjectData,
): FootprintOffset[] => {
  const seen = new Set<string>();
  const cells: FootprintOffset[] = [];
  const facing: FootprintOffset = [
    Number(placement.facing?.[0] ?? 0),
    Number(placement.facing?.[1] ?? 1),
  ];

  for (const offset of getObjectFootprint(objectDef)) {
    const [rx, rz] = rotateOffset(offset, facing);
    const cell: FootprintOffset = [placement.cell[0] + rx, placement.cell[1] + rz];
    const key = `${cell[0]},${cell[1]}`;

    if (!seen.has(key)) {
      seen.add(key);
      cells.push(cell);
    }
  }

  return cells;
};

export const placementOccupiesCell = (
  placement: ObjectPlacementData,
  objectDef: ObjectData | undefined,
  x: number,
  z: number,
) => getPlacementFootprint(placement, objectDef).some(([cx, cz]) => cx === x && cz === z);

export const placementBlocksCell = (
  placement: ObjectPlacementData,
  objectDef: ObjectData | undefined,
  x: number,
  z: number,
) => {
  if (!objectDef || objectDef.collision?.profile === "none") return false;
  return placementOccupiesCell(placement, objectDef, x, z);
};
