import fs from 'fs';
let code = fs.readFileSync('src/components/PlayMode.tsx', 'utf8');

// Remove auto-advance for party
code = code.replace(/    } else if \(turnId && turnId !== "player" && \(save\.party_members \|\| \[\]\)\.includes\(turnId\)\) {\n      \/\/ Party member turn: for now, just advance their turn automatically to avoid softlock\n      const timer = setTimeout\(\(\) => {\n        usePlayStore\.getState\(\)\.advanceTurn\(\);\n      }, 250\);\n      return \(\) => clearTimeout\(timer\);\n/g, "");

// Find the origin logic in handleMove
const newOriginLogic = `
      let originCell = currentSave.player.cell;
      let activeEntityKey: string | null = null;
      const isPlayerTurn = !currentSave.in_combat || currentSave.active_turn_id === "player";
      
      if (currentSave.in_combat && !isPlayerTurn) {
         // Find party member cell
         activeMap.entity_placements?.forEach((e, idx) => {
            if (e.entity_id === currentSave.active_turn_id) {
               activeEntityKey = entityStateKey(activeMap.id, e.entity_id, idx);
               const est = (currentSave.entity_states || {})[activeEntityKey];
               originCell = est?.cell || e.cell;
            }
         });
      }

      const newFacing = [dx, dz] as [number, number];
      const nx = originCell[0] + dx;
      const nz = originCell[1] + dz;

      const currentCell = activeMap.cells.find((c) => c.x === originCell[0] && c.z === originCell[1]);
`;

code = code.replace(/      const newFacing = \[dx, dz\] as \[number, number\];\n      const nx = currentSave\.player\.cell\[0\] \+ dx;\n      const nz = currentSave\.player\.cell\[1\] \+ dz;\n\n      const currentCell = activeMap\.cells\.find\(\n        \(c\) =>\n          c\.x === currentSave\.player\.cell\[0\] &&\n          c\.z === currentSave\.player\.cell\[1\],\n      \);/g, newOriginLogic);

// Now find where player is updated
const newMoveExecution = `
      if (!entityPlacement) {
        if (blocked) {
          if (isPlayerTurn) {
            updatePlayer(originCell, newFacing);
          }
        } else {
          if (isPlayerTurn) {
            movePlayer([nx, nz], newFacing, -1000);
          } else if (activeEntityKey) {
             const est = (currentSave.entity_states || {})[activeEntityKey] || { cell: originCell };
             usePlayStore.getState().updateEntityState(activeEntityKey, { ...est, cell: [nx, nz] });
          }
          turnConsumed = true;
          turnEnergyConsumed = true;
`;

code = code.replace(/      if \(!entityPlacement\) {\n        if \(blocked\) {\n          updatePlayer\(currentSave\.player\.cell, newFacing\);\n        } else {\n          movePlayer\(\[nx, nz\], newFacing, -1000\);\n          turnConsumed = true;\n          turnEnergyConsumed = true;/g, newMoveExecution);

// In handleAct
const newActOriginLogic = `
    const isPlayerTurn = !saveData.in_combat || saveData.active_turn_id === "player";
    let originCell = saveData.player.cell;
    let facing = saveData.player.facing;
    let activeEntityKey: string | null = null;
    
    if (saveData.in_combat && !isPlayerTurn) {
       activeMap.entity_placements?.forEach((e, idx) => {
          if (e.entity_id === saveData.active_turn_id) {
             activeEntityKey = entityStateKey(activeMap.id, e.entity_id, idx);
             const est = (saveData.entity_states || {})[activeEntityKey];
             originCell = est?.cell || e.cell;
             facing = [0, -1] as [number, number]; 
          }
       });
    }

    const tx = originCell[0] + facing[0];
    const tz = originCell[1] + facing[1];
`;

code = code.replace(/    const { cell, facing } = saveData\.player;\n    const tx = cell\[0\] \+ facing\[0\];\n    const tz = cell\[1\] \+ facing\[1\];/g, newActOriginLogic);

code = code.replace(/usePlayStore\.getState\(\)\.updatePlayer\(cell, \[eCell\[0\] - cell\[0\], eCell\[1\] - cell\[1\]\]\);/g, "if (isPlayerTurn) usePlayStore.getState().updatePlayer(originCell, [eCell[0] - originCell[0], eCell[1] - originCell[1]]);");
code = code.replace(/const dist = Math\.abs\(eCell\[0\] - cell\[0\]\) \+ Math\.abs\(eCell\[1\] - cell\[1\]\);/g, "const dist = Math.abs(eCell[0] - originCell[0]) + Math.abs(eCell[1] - originCell[1]);");


fs.writeFileSync('src/components/PlayMode.tsx', code);
