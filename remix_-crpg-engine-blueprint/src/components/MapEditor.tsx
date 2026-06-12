import React, { useState, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEngineStore } from "../store/engineStore";
import { usePlayStore } from "../store/playStore";
import { GameRenderer } from "./GameRenderer";
import {
  MapData,
  CellData,
  ContainerPlacementData,
  EntityPlacementData,
  MapExitData,
  TriggerData,
  WorldItemPlacementData,
} from "../schema/game";
import {
  placementBlocksCell,
  placementOccupiesCell,
} from "../utils/objectFootprint";
import {
  Plus,
  Play,
  MousePointer,
  Mountain,
  ArrowDownToLine,
  Move,
  CheckCircle,
  GripHorizontal,
  MessageSquare,
  Box,
  Swords,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { AIGenerationModal } from "./AIGenerationModal";
import { ConditionEditor } from "./ConditionEditor";

type InspectorSelection =
  | { kind: "entity"; index: number }
  | { kind: "trigger"; index: number }
  | { kind: "exit"; index: number }
  | { kind: "item"; index: number }
  | { kind: "container"; index: number }
  | null;

export function MapEditor() {
  const {
    gamePackage,
    addMap,
    updateMap,
    setMode,
    selectedMapId,
    setSelectedMapId,
  } = useEngineStore();
  const { resetRun } = usePlayStore();

  const [activeMapId, setActiveMapId] = useState<string | null>(
    selectedMapId || gamePackage.maps[0]?.id || null,
  );
  const [activeMap, setActiveMap] = useState<MapData | null>(null);

  useEffect(() => {
    setActiveMap(gamePackage.maps.find((m) => m.id === activeMapId) || null);
  }, [gamePackage.maps, activeMapId]);

  // Sync to global selection
  useEffect(() => {
    if (activeMapId && activeMapId !== selectedMapId) {
      setSelectedMapId(activeMapId);
    }
  }, [activeMapId, selectedMapId, setSelectedMapId]);

  type EditTool =
    | "walkable"
    | "blocked"
    | "height_up"
    | "height_down"
    | "spawn"
    | "object"
    | "tile"
    | "interact"
    | "enemy"
    | "trigger";
  const [currentTool, setCurrentTool] = useState<EditTool>("walkable");
  const [placementObjectId, setPlacementObjectId] = useState<string | null>(
    gamePackage.object_library[0]?.id || null,
  );
  const [assignDialogueId, setAssignDialogueId] = useState<string | null>(
    gamePackage.dialogue[0]?.id || null,
  );
  const [placementEntityId, setPlacementEntityId] = useState<string | null>(
    gamePackage.entities[0]?.id || null,
  );
  const [triggerCutsceneId, setTriggerCutsceneId] = useState<string | null>(
    gamePackage.cutscenes[0]?.id || null,
  );
  const [triggerType, setTriggerType] = useState<
    "step" | "interact" | "on_load" | "switch_change"
  >("step");
  const [showAIModal, setShowAIModal] = useState(false);
  const [editLayerY, setEditLayerY] = useState(0);
  const [selection, setSelection] = useState<InspectorSelection>(null);
  const [inspectorOpen, setInspectorOpen] = useState(false);

  useEffect(() => {
    if (
      gamePackage.entities.length > 0 &&
      !gamePackage.entities.find((e) => e.id === placementEntityId)
    ) {
      setPlacementEntityId(gamePackage.entities[0].id);
    }
  }, [gamePackage.entities, placementEntityId]);

  useEffect(() => {
    if (currentTool === "object" || currentTool === "tile") {
      const filteredOptions = gamePackage.object_library.filter((o) => {
        if (currentTool === "tile") return o.tags?.includes("tile");
        return !o.tags?.includes("tile");
      });
      // if current placement object isn't in the filtered list, pick the first
      if (!filteredOptions.find((o) => o.id === placementObjectId)) {
        setPlacementObjectId(filteredOptions[0]?.id || null);
      }
    }
  }, [currentTool, gamePackage.object_library, placementObjectId]);

  useEffect(() => {
    if (
      gamePackage.dialogue.length > 0 &&
      !gamePackage.dialogue.find((d) => d.id === assignDialogueId)
    ) {
      setAssignDialogueId(gamePackage.dialogue[0].id);
    }
  }, [gamePackage.dialogue, assignDialogueId]);

  const handleCreateMap = () => {
    const id = `map_${Date.now()}`;
    const newMap: MapData = {
      id,
      display_name: "New Map",
      width: 10,
      height: 10,
      spawns: [],
      cells: [],
      props: [],
      custom_object_placements: [],
      entity_placements: [],
      item_placements: [],
      container_placements: [],
      triggers: [],
      exits: [],
    };

    // fill cells
    for (let x = -4; x <= 4; x++) {
      for (let z = -4; z <= 4; z++) {
        newMap.cells.push({
          x,
          y: 0,
          z,
          active: true,
          walkable: true,
          blocks_los: false,
          height: 0,
          visual_height: 0,
          terrain: "default",
          surface_tag: "none",
        });
      }
    }
    // Default spawn
    newMap.spawns.push({ id: "start", cell: [0, 0], facing: [0, 1] });

    addMap(newMap);
    setActiveMapId(id);
  };

  const handleResizeMap = (newWidth: number, newHeight: number) => {
    if (!activeMap) return;
    const cw = Math.max(1, newWidth);
    const ch = Math.max(1, newHeight);

    const newCells = [...activeMap.cells];
    const minX = -Math.floor(cw / 2);
    const maxX = Math.floor((cw - 1) / 2);
    const minZ = -Math.floor(ch / 2);
    const maxZ = Math.floor((ch - 1) / 2);

    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        if (
          !newCells.find((c) => c.x === x && c.z === z && c.y === editLayerY)
        ) {
          newCells.push({
            x,
            y: editLayerY,
            z,
            active: true,
            walkable: true,
            blocks_los: false,
            height: 0,
            visual_height: 0,
            terrain: "default",
            surface_tag: "none",
          });
        }
      }
    }

    updateMap(activeMap.id, { width: cw, height: ch, cells: newCells });
  };

  const handleCellClick = (x: number, z: number) => {
    if (!activeMap) return;

    const newCells = [...activeMap.cells];
    const idx = newCells.findIndex(
      (c) => c.x === x && c.z === z && c.y === editLayerY,
    );

    let cell: CellData;
    if (idx === -1) {
      if (
        currentTool === "blocked" ||
        currentTool === "interact" ||
        currentTool === "enemy" ||
        currentTool === "trigger"
      ) {
        // for objects and entities, we can just let it create a floor if none exists at this layer
      }
      cell = {
        x,
        y: editLayerY,
        z,
        active: true,
        walkable: true,
        blocks_los: false,
        height: 0,
        visual_height: 0,
        terrain: "default",
        surface_tag: "none",
      };
      newCells.push(cell);
    } else {
      cell = { ...newCells[idx] };
      newCells[idx] = cell;
    }

    let spawns = [...activeMap.spawns];

    switch (currentTool) {
      case "walkable":
        cell.walkable = true;
        cell.blocks_los = false;
        cell.visual_height = 0;
        break;
      case "blocked":
        cell.walkable = false;
        cell.blocks_los = true;
        cell.visual_height = 2; // quick visual block
        break;
      case "height_up":
        cell.visual_height += 1;
        break;
      case "height_down":
        cell.visual_height = Math.max(0, cell.visual_height - 1);
        break;
      case "spawn":
        spawns = [{ id: "start", cell: [x, z], facing: [0, 1] }]; // only support one for now
        break;
      case "tile":
        if (placementObjectId) {
          if (cell.object_id === placementObjectId) {
            cell.object_id = undefined;
          } else {
            cell.object_id = placementObjectId;
          }
        }
        break;
      case "object":
        if (placementObjectId) {
          const newPlacements = [...activeMap.custom_object_placements];
          const objectLibrary = gamePackage.object_library;
          const existingIdx = newPlacements.findIndex(
            (p) =>
              placementOccupiesCell(
                p,
                objectLibrary.find((o) => o.id === p.object_id),
                x,
                z,
              ),
          );
          if (existingIdx !== -1) {
            newPlacements.splice(existingIdx, 1); // toggle: remove if already exists
          } else {
            newPlacements.push({
              object_id: placementObjectId,
              cell: [x, z],
              facing: [0, 1],
            });
          }
          updateMap(activeMap.id, { custom_object_placements: newPlacements });
        }
        return; // We handled it, don't just update raw map cells
      case "enemy":
        if (placementEntityId) {
          const newEntities = [...(activeMap.entity_placements || [])];
          const existingIdx = newEntities.findIndex(
            (e) => e.cell[0] === x && e.cell[1] === z,
          );
          if (existingIdx !== -1) {
            newEntities.splice(existingIdx, 1);
            setSelection(null);
          } else {
            newEntities.push({ entity_id: placementEntityId, cell: [x, z] });
            setSelection({ kind: "entity", index: newEntities.length - 1 });
          }
          updateMap(activeMap.id, { entity_placements: newEntities });
        }
        return;
      case "trigger":
        if (triggerCutsceneId) {
          const newTriggers = [...(activeMap.triggers || [])];
          const existingIdx =
            triggerType === "on_load"
              ? -1
              : newTriggers.findIndex(
                  (t) =>
                    t.cell?.[0] === x &&
                    t.cell?.[1] === z &&
                    t.type === triggerType,
                );
          if (existingIdx !== -1) {
            newTriggers.splice(existingIdx, 1);
            setSelection(null);
          } else {
            newTriggers.push({
              id: `trig_${Date.now()}`,
              cell: triggerType === "on_load" ? undefined : [x, z],
              type: triggerType,
              cutscene_id: triggerCutsceneId,
              conditions: [],
              once: triggerType !== "on_load",
            });
            setSelection({ kind: "trigger", index: newTriggers.length - 1 });
          }
          updateMap(activeMap.id, { triggers: newTriggers });
        }
        return;
      case "interact":
        if (assignDialogueId) {
          const newPlacements = [...activeMap.custom_object_placements];
          const objectLibrary = gamePackage.object_library;
          const existingIdx = newPlacements.findIndex(
            (p) =>
              placementOccupiesCell(
                p,
                objectLibrary.find((o) => o.id === p.object_id),
                x,
                z,
              ),
          );
          if (existingIdx !== -1) {
            // Toggle dialogue assignment
            if (newPlacements[existingIdx].dialogue_id === assignDialogueId) {
              newPlacements[existingIdx] = {
                ...newPlacements[existingIdx],
                dialogue_id: undefined,
              };
            } else {
              newPlacements[existingIdx] = {
                ...newPlacements[existingIdx],
                dialogue_id: assignDialogueId,
              };
            }
            updateMap(activeMap.id, {
              custom_object_placements: newPlacements,
            });
          } else {
            // Inform user they must click an Object
            alert(
              "You can only assign dialogue to an object placed with the Object tool.",
            );
          }
        }
        return;
    }

    updateMap(activeMap.id, { cells: newCells, spawns });
  };

  const handleTestPlay = () => {
    if (!activeMap) return;
    resetRun();
    setMode("play");
  };

  const handleValidateReachability = () => {
    if (!activeMap) return;
    if (activeMap.spawns.length === 0) {
      alert("Validation Failed: No spawn point set.");
      return;
    }

    const { cell } = activeMap.spawns[0];

    const visited = new Set<string>();
    const queue: [number, number][] = [[cell[0], cell[1]]];

    const isWalkable = (x: number, z: number) => {
      const c = activeMap.cells.find((c) => c.x === x && c.z === z);
      if (!c || !c.walkable) return false;

      if (c.object_id) {
        const cellObjDef = gamePackage.object_library.find(
          (o) => o.id === c.object_id,
        );
        if (cellObjDef && cellObjDef.collision?.profile !== "none") {
          return false;
        }
      }

      return !activeMap.custom_object_placements.some((placement) =>
        placementBlocksCell(
          placement,
          gamePackage.object_library.find((o) => o.id === placement.object_id),
          x,
          z,
        ),
      );
    };

    while (queue.length > 0) {
      const [cx, cz] = queue.shift()!;
      const key = `${cx}_${cz}`;

      if (!visited.has(key)) {
        visited.add(key);

        const neighbors = [
          [cx + 1, cz],
          [cx - 1, cz],
          [cx, cz + 1],
          [cx, cz - 1],
        ];
        for (const [nx, nz] of neighbors) {
          if (isWalkable(nx, nz) && !visited.has(`${nx}_${nz}`)) {
            queue.push([nx, nz]);
          }
        }
      }
    }

    const walkableCells = activeMap.cells.filter((c) => c.walkable);
    const unreachableCells = walkableCells.filter(
      (c) => !visited.has(`${c.x}_${c.z}`),
    );

    if (unreachableCells.length > 0) {
      alert(
        `Validation Failed: ${unreachableCells.length} walkable cells are unreachable from spawn.`,
      );
    } else {
      alert("Validation Passed: All walkable cells are reachable!");
    }
  };

  if (!activeMap) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="bg-neutral-800 p-6 rounded-full inline-block mb-2">
          <Mountain className="w-8 h-8 text-neutral-400" />
        </div>
        <div>
          <h2 className="text-xl font-medium">No Map Selected</h2>
          <p className="text-neutral-400 text-sm mt-1">
            Create a new map to start building your world.
          </p>
        </div>
        <button
          onClick={handleCreateMap}
          className="bg-neutral-100 hover:bg-white text-neutral-900 font-medium px-6 py-2.5 rounded-lg flex items-center gap-2 mt-4 transition-transform active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Create First Map
        </button>
      </div>
    );
  }

  const tools: { id: EditTool; label: string; icon: React.ReactNode }[] = [
    {
      id: "walkable",
      label: "Walkable",
      icon: <MousePointer className="w-4 h-4" />,
    },
    { id: "blocked", label: "Wall", icon: <Box className="w-4 h-4" /> },
    { id: "height_up", label: "Raise", icon: <Mountain className="w-4 h-4" /> },
    {
      id: "height_down",
      label: "Lower",
      icon: <ArrowDownToLine className="w-4 h-4" />,
    },
    { id: "spawn", label: "Spawn", icon: <Move className="w-4 h-4" /> },
    { id: "tile", label: "Tile", icon: <GripHorizontal className="w-4 h-4" /> },
    { id: "object", label: "Object", icon: <Plus className="w-4 h-4" /> },
    {
      id: "interact",
      label: "Interact",
      icon: <MessageSquare className="w-4 h-4" />,
    },
    { id: "enemy", label: "Entity", icon: <Swords className="w-4 h-4" /> },
    { id: "trigger", label: "Trigger", icon: <Box className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-950 relative">
      {/* Editor Header */}
      <div className="h-14 bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-800 flex items-center justify-between px-4 z-10">
        <div className="flex items-center gap-4">
          <select
            className="bg-neutral-800 border border-neutral-700 text-sm rounded-md px-2 py-1 max-w-[150px] outline-none"
            value={activeMapId || ""}
            onChange={(e) => setActiveMapId(e.target.value)}
          >
            {gamePackage.maps.map((m) => (
              <option key={m.id} value={m.id}>
                {m.display_name || m.id}
              </option>
            ))}
          </select>
          {activeMap && (
            <div className="hidden md:flex items-center gap-2 text-sm">
              <label className="text-neutral-400">W:</label>
              <input
                type="number"
                className="w-16 bg-neutral-800 border border-neutral-700 rounded px-1 min-h-[28px]"
                value={activeMap.width || 10}
                onChange={(e) =>
                  handleResizeMap(
                    parseInt(e.target.value) || 1,
                    activeMap.height || 10,
                  )
                }
              />
              <label className="text-neutral-400 ml-2">H:</label>
              <input
                type="number"
                className="w-16 bg-neutral-800 border border-neutral-700 rounded px-1 min-h-[28px]"
                value={activeMap.height || 10}
                onChange={(e) =>
                  handleResizeMap(
                    activeMap.width || 10,
                    parseInt(e.target.value) || 1,
                  )
                }
              />
            </div>
          )}
          <div className="hidden md:flex items-center gap-2 text-sm ml-4 border-l border-neutral-700 pl-4">
            <label className="text-neutral-400">Y Layer:</label>
            <button
              onClick={() => setEditLayerY((y) => y - 1)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <span className="w-6 text-center">{editLayerY}</span>
            <button
              onClick={() => setEditLayerY((y) => y + 1)}
              className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAIModal(true)}
            className="p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md transition-colors flex items-center gap-1.5 px-3"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline text-sm font-medium">
              Generate
            </span>
          </button>
          <button
            onClick={handleValidateReachability}
            title="Validate Reachability"
            className="p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-md transition-colors"
          >
            <CheckCircle className="w-4 h-4" />
          </button>
          <button
            onClick={handleCreateMap}
            className="p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white rounded-md transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          {/* Inspector toggle — mobile only */}
          <button
            onClick={() => setInspectorOpen((v) => !v)}
            className={`sm:hidden p-2 rounded-md transition-colors flex items-center gap-1.5 px-3 text-sm font-medium ${inspectorOpen ? "bg-neutral-700 text-white" : "text-neutral-400 hover:bg-neutral-800 hover:text-white"}`}
            title="Toggle Inspector"
          >
            <GripHorizontal className="w-4 h-4" />
            <span>Inspector</span>
          </button>
          <button
            onClick={handleTestPlay}
            className="flex items-center gap-2 bg-green-600/20 text-green-400 hover:bg-green-600/30 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            <Play className="w-4 h-4 fill-current" />
            <span className="hidden sm:inline">Play map</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative min-h-0">
        <Canvas
          camera={{ position: [0, 10, 10], fov: 45 }}
          dpr={[1, 1.5]}
          frameloop="demand"
          gl={{ antialias: false, powerPreference: "high-performance" }}
        >
          <color attach="background" args={["#111111"]} />
          <ambientLight intensity={0.5} />
          <directionalLight position={[10, 20, 10]} intensity={1} castShadow />
          <GameRenderer
            map={activeMap}
            // We can preview the spawn point using the player marker concept
            playerPos={
              activeMap.spawns[0]?.cell as [number, number] | undefined
            }
            playerFacing={
              activeMap.spawns[0]?.facing as [number, number] | undefined
            }
            onCellClick={handleCellClick}
            editLayerY={editLayerY}
          />
          <OrbitControls
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 2.2}
            minDistance={2}
            maxDistance={30}
          />
        </Canvas>
        <MapPlacementInspector
          map={activeMap}
          gamePackage={gamePackage}
          selection={selection}
          setSelection={setSelection}
          updateMap={(updates) => updateMap(activeMap.id, updates)}
          isOpen={inspectorOpen}
          onClose={() => setInspectorOpen(false)}
        />
      </div>

      {/* Mobile-Friendly Bottom Tool Palette */}
      <div className="shrink-0 bg-neutral-900 border-t border-neutral-800 p-2 sm:p-4 pb-[env(safe-area-inset-bottom)] sm:pb-4 flex justify-between items-center z-10 overflow-x-auto custom-scrollbar">
        <div className="flex gap-2">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => setCurrentTool(tool.id)}
              className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                currentTool === tool.id
                  ? "bg-neutral-100 text-neutral-900 shadow-sm"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-neutral-200"
              }`}
            >
              {tool.icon}
              <span>{tool.label}</span>
            </button>
          ))}
        </div>
        {(currentTool === "object" || currentTool === "tile") &&
          (() => {
            const filteredOptions = gamePackage.object_library.filter((o) => {
              if (currentTool === "tile") return o.tags?.includes("tile");
              return !o.tags?.includes("tile");
            });
            return (
              <select
                className="bg-neutral-800 border border-neutral-700 text-sm rounded-md px-2 py-2 outline-none text-white ml-4 flex-shrink-0"
                value={placementObjectId || ""}
                onChange={(e) => setPlacementObjectId(e.target.value)}
              >
                {filteredOptions.length > 0 ? (
                  filteredOptions.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.display_name || o.id}
                    </option>
                  ))
                ) : (
                  <option value="" disabled>
                    No available items
                  </option>
                )}
              </select>
            );
          })()}
        {currentTool === "interact" && (
          <div className="flex items-center gap-3 ml-4">
            <select
              className="bg-neutral-800 border border-neutral-700 text-sm rounded-md px-2 py-2 outline-none text-white flex-shrink-0"
              value={assignDialogueId || ""}
              onChange={(e) => setAssignDialogueId(e.target.value)}
            >
              {gamePackage.dialogue.length > 0 ? (
                gamePackage.dialogue.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.display_name || d.id}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No dialogues available
                </option>
              )}
            </select>
            <span className="text-xs text-neutral-400 hidden sm:inline">
              Click a placed object to assign dialogue.
            </span>
          </div>
        )}
        {currentTool === "enemy" && (
          <div className="flex items-center gap-3 ml-4">
            <select
              className="bg-neutral-800 border border-neutral-700 text-sm rounded-md px-2 py-2 outline-none text-white flex-shrink-0"
              value={placementEntityId || ""}
              onChange={(e) => setPlacementEntityId(e.target.value)}
            >
              {gamePackage.entities.length > 0 ? (
                gamePackage.entities.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.display_name || e.id}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No entities available
                </option>
              )}
            </select>
            <span className="text-xs text-neutral-400 hidden sm:inline">
              Click a floor tile to place enemy.
            </span>
          </div>
        )}
        {currentTool === "trigger" && (
          <div className="flex items-center gap-3 ml-4">
            <select
              className="bg-neutral-800 border border-neutral-700 text-sm rounded-md px-2 py-2 outline-none text-white flex-shrink-0"
              value={triggerType}
              onChange={(e) => setTriggerType(e.target.value as any)}
            >
              <option value="step">Step On</option>
              <option value="interact">Interact</option>
              <option value="on_load">On Load</option>
            </select>
            <select
              className="bg-neutral-800 border border-neutral-700 text-sm rounded-md px-2 py-2 outline-none text-white flex-shrink-0"
              value={triggerCutsceneId || ""}
              onChange={(e) => setTriggerCutsceneId(e.target.value)}
            >
              {gamePackage.cutscenes.length > 0 ? (
                gamePackage.cutscenes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name || c.id}
                  </option>
                ))
              ) : (
                <option value="" disabled>
                  No cutscenes available
                </option>
              )}
            </select>
            <span className="text-xs text-neutral-400 hidden sm:inline">
              Click a cell to toggle trigger. On-load creates a map-level trigger.
            </span>
          </div>
        )}
      </div>

      {showAIModal && (
        <AIGenerationModal
          title="Generate Map"
          placeholder="e.g. Generate a small 16x16 dungeon room with some obstacles..."
          context={`Available Object Library:\n${JSON.stringify(gamePackage.object_library.map((o) => ({ id: o.id, name: o.display_name, category: o.category })))}\nAvailable Entities:\n${JSON.stringify(gamePackage.entities.map((e) => ({ id: e.id, name: e.display_name })))}`}
          schema={{
            type: "OBJECT",
            properties: {
              id: { type: "STRING" },
              display_name: { type: "STRING" },
              width: { type: "NUMBER" },
              height: { type: "NUMBER" },
              spawns: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    cell: { type: "ARRAY", items: { type: "NUMBER" } },
                    facing: { type: "ARRAY", items: { type: "NUMBER" } },
                  },
                },
              },
              cells: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    x: { type: "NUMBER" },
                    z: { type: "NUMBER" },
                    active: { type: "BOOLEAN" },
                    walkable: { type: "BOOLEAN" },
                    blocks_los: { type: "BOOLEAN" },
                    visual_height: { type: "NUMBER" },
                    object_id: {
                      type: "STRING",
                      description:
                        "Optional object ID for tile replacement (e.g., specific ground texture)",
                    },
                  },
                },
              },
              custom_object_placements: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    object_id: {
                      type: "STRING",
                      description: "Must exactly match an available object ID",
                    },
                    cell: { type: "ARRAY", items: { type: "NUMBER" } },
                    facing: { type: "ARRAY", items: { type: "NUMBER" } },
                  },
                },
              },
              entity_placements: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    entity_id: {
                      type: "STRING",
                      description: "Must exactly match an available entity ID",
                    },
                    cell: { type: "ARRAY", items: { type: "NUMBER" } },
                    schedule: { type: "ARRAY", items: { type: "OBJECT" } },
                  },
                },
              },
              item_placements: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    item_id: { type: "STRING" },
                    cell: { type: "ARRAY", items: { type: "NUMBER" } },
                    count: { type: "NUMBER" },
                  },
                },
              },
              container_placements: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    object_id: { type: "STRING" },
                    cell: { type: "ARRAY", items: { type: "NUMBER" } },
                    facing: { type: "ARRAY", items: { type: "NUMBER" } },
                    display_name: { type: "STRING" },
                    locked: { type: "BOOLEAN" },
                    key_item_id: { type: "STRING" },
                    consume_key: { type: "BOOLEAN" },
                    items: { type: "ARRAY", items: { type: "OBJECT" } },
                  },
                },
              },
              triggers: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    cell: { type: "ARRAY", items: { type: "NUMBER" } },
                    type: { type: "STRING", description: "step, interact, or on_load" },
                    cutscene_id: { type: "STRING" },
                    once: { type: "BOOLEAN" },
                    condition: { type: "OBJECT" },
                  },
                },
              },
              exits: {
                type: "ARRAY",
                items: {
                  type: "OBJECT",
                  properties: {
                    id: { type: "STRING" },
                    cell: { type: "ARRAY", items: { type: "NUMBER" } },
                    target_map_id: { type: "STRING" },
                    target_spawn_id: { type: "STRING" },
                    facing: { type: "ARRAY", items: { type: "NUMBER" } },
                    condition: { type: "OBJECT" },
                  },
                },
              },
            },
            required: [
              "id",
              "display_name",
              "width",
              "height",
              "spawns",
              "cells",
            ],
          }}
          onGenerate={(data) => {
            const cw = data.width || 10;
            const ch = data.height || 10;
            const newCells: CellData[] = [];

            const minX = -Math.floor(cw / 2);
            const maxX = Math.floor((cw - 1) / 2);
            const minZ = -Math.floor(ch / 2);
            const maxZ = Math.floor((ch - 1) / 2);

            const genCells = data.cells || [];
            for (let x = minX; x <= maxX; x++) {
              for (let z = minZ; z <= maxZ; z++) {
                const existing = genCells.find(
                  (c: any) => c.x === x && c.z === z,
                );
                if (existing) {
                  newCells.push({
                    ...existing,
                    active: existing.active ?? true,
                    walkable: existing.walkable ?? true,
                    blocks_los: existing.blocks_los ?? false,
                    height: existing.height || 0,
                    visual_height: existing.visual_height || 0,
                    terrain: existing.terrain || "default",
                  });
                } else {
                  newCells.push({
                    x,
                    y: 0,
                    z,
                    active: true,
                    walkable: true,
                    blocks_los: false,
                    height: 0,
                    visual_height: 0,
                    terrain: "default",
                    surface_tag: "none",
                  });
                }
              }
            }

            const newMap: MapData = {
              id: `map_${Date.now()}`,
              display_name: data.display_name || "Generated Map",
              width: cw,
              height: ch,
              spawns: data.spawns || [],
              cells: newCells,
              props: [],
              custom_object_placements: data.custom_object_placements || [],
              entity_placements: data.entity_placements || [],
              item_placements: data.item_placements || [],
              container_placements: data.container_placements || [],
              triggers: data.triggers || [],
              exits: data.exits || [],
            };
            addMap(newMap);
            setActiveMapId(newMap.id);
          }}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
}

function MapPlacementInspector({
  map,
  gamePackage,
  selection,
  setSelection,
  updateMap,
  isOpen,
  onClose,
}: {
  map: MapData;
  gamePackage: any;
  selection: InspectorSelection;
  setSelection: (selection: InspectorSelection) => void;
  updateMap: (updates: Partial<MapData>) => void;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const defaultCell = (map.spawns[0]?.cell || [0, 0]) as [number, number];
  const targetMap = gamePackage.maps.find((candidate: MapData) => candidate.id !== map.id) || gamePackage.maps[0] || map;

  const replaceInArray = <T,>(key: keyof MapData, index: number, next: T) => {
    const current = ([...(((map as any)[key] || []) as T[])] as T[]);
    current[index] = next;
    updateMap({ [key]: current } as Partial<MapData>);
  };

  const removeFromArray = (key: keyof MapData, index: number) => {
    const current = [...(((map as any)[key] || []) as any[])];
    current.splice(index, 1);
    updateMap({ [key]: current } as Partial<MapData>);
    setSelection(null);
  };

  const addEntity = () => {
    const entity_id = gamePackage.entities[0]?.id;
    if (!entity_id) return;
    const entity_placements = [
      ...(map.entity_placements || []),
      { entity_id, cell: defaultCell } as EntityPlacementData,
    ];
    updateMap({ entity_placements });
    setSelection({ kind: "entity", index: entity_placements.length - 1 });
  };

  const addTrigger = () => {
    const cutscene_id = gamePackage.cutscenes[0]?.id;
    if (!cutscene_id) return;
    const triggers = [
      ...(map.triggers || []),
      {
        id: `trig_${Date.now()}`,
        cell: defaultCell,
        type: "step",
        cutscene_id,
        conditions: [],
        once: true,
      } as TriggerData,
    ];
    updateMap({ triggers });
    setSelection({ kind: "trigger", index: triggers.length - 1 });
  };

  const addExit = () => {
    const exits = [
      ...(map.exits || []),
      {
        id: `exit_${Date.now()}`,
        cell: defaultCell,
        target_map_id: targetMap.id,
        target_spawn_id: targetMap.spawns?.[0]?.id,
        facing: [0, 1],
      } as MapExitData,
    ];
    updateMap({ exits });
    setSelection({ kind: "exit", index: exits.length - 1 });
  };

  const addItem = () => {
    const item_id = gamePackage.items?.[0]?.id;
    if (!item_id) return;
    const item_placements = [
      ...(map.item_placements || []),
      { id: `witem_${Date.now()}`, item_id, cell: defaultCell, count: 1 } as WorldItemPlacementData,
    ];
    updateMap({ item_placements });
    setSelection({ kind: "item", index: item_placements.length - 1 });
  };

  const addContainer = () => {
    const object_id =
      gamePackage.object_library.find((object: any) => !object.tags?.includes("tile"))?.id ||
      gamePackage.object_library[0]?.id;
    if (!object_id) return;
    const container_placements = [
      ...(map.container_placements || []),
      {
        id: `cont_${Date.now()}`,
        object_id,
        cell: defaultCell,
        facing: [0, 1],
        display_name: "Container",
        locked: false,
        consume_key: false,
        items: [],
      } as ContainerPlacementData,
    ];
    updateMap({ container_placements });
    setSelection({ kind: "container", index: container_placements.length - 1 });
  };

  const selectedData = selection ? ((map as any)[selection.kind === "entity"
    ? "entity_placements"
    : selection.kind === "trigger"
      ? "triggers"
      : selection.kind === "exit"
        ? "exits"
        : selection.kind === "item"
          ? "item_placements"
          : "container_placements"] || [])[selection.index] : null;

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="sm:hidden absolute inset-0 bg-black/50 z-20"
          onClick={onClose}
        />
      )}
      <aside className={`
        sm:absolute sm:right-0 sm:top-0 sm:bottom-0 sm:w-80 sm:border-l sm:border-neutral-800 sm:bg-neutral-950/95 sm:backdrop-blur sm:overflow-y-auto sm:shadow-2xl sm:translate-y-0
        fixed bottom-0 left-0 right-0 max-h-[65vh] border-t border-neutral-800 bg-neutral-950 overflow-y-auto shadow-2xl z-30 transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full sm:translate-y-0'}
      `}>
      <div className="sticky top-0 z-10 border-b border-neutral-800 bg-neutral-950 p-3">
        {/* Mobile drag handle */}
        <div className="sm:hidden flex justify-center mb-2">
          <div className="w-10 h-1 rounded-full bg-neutral-600" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-neutral-100">Map Inspector</h3>
            <p className="text-[11px] text-neutral-500">{map.display_name || map.id}</p>
          </div>
          {/* Close button — mobile only */}
          <button
            className="sm:hidden p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <MiniButton onClick={addEntity} disabled={gamePackage.entities.length === 0}>Entity</MiniButton>
          <MiniButton onClick={addTrigger} disabled={gamePackage.cutscenes.length === 0}>Trigger</MiniButton>
          <MiniButton onClick={addExit} disabled={gamePackage.maps.length === 0}>Exit</MiniButton>
          <MiniButton onClick={addItem} disabled={!gamePackage.items?.length}>Item</MiniButton>
          <MiniButton onClick={addContainer} disabled={!gamePackage.object_library?.length}>Container</MiniButton>
        </div>
      </div>

      <div className="p-3 space-y-4">
        <InspectorList
          title="Entities"
          count={map.entity_placements?.length || 0}
          selected={selection}
          kind="entity"
          getLabel={(index) => {
            const placement = map.entity_placements[index];
            const entity = gamePackage.entities.find((candidate: any) => candidate.id === placement.entity_id);
            return `${entity?.display_name || placement.entity_id} @ ${placement.cell.join(",")}`;
          }}
          setSelection={setSelection}
        />
        <InspectorList
          title="Triggers"
          count={map.triggers?.length || 0}
          selected={selection}
          kind="trigger"
          getLabel={(index) => {
            const trigger = map.triggers[index];
            return `${trigger.type} -> ${trigger.cutscene_id}`;
          }}
          setSelection={setSelection}
        />
        <InspectorList
          title="Exits"
          count={map.exits?.length || 0}
          selected={selection}
          kind="exit"
          getLabel={(index) => {
            const exit = map.exits[index];
            return `${exit.cell.join(",")} -> ${exit.target_map_id}`;
          }}
          setSelection={setSelection}
        />
        <InspectorList
          title="World Items"
          count={map.item_placements?.length || 0}
          selected={selection}
          kind="item"
          getLabel={(index) => {
            const item = map.item_placements[index];
            return `${item.item_id} x${item.count}`;
          }}
          setSelection={setSelection}
        />
        <InspectorList
          title="Containers"
          count={map.container_placements?.length || 0}
          selected={selection}
          kind="container"
          getLabel={(index) => {
            const container = map.container_placements[index];
            return container.display_name || container.id;
          }}
          setSelection={setSelection}
        />

        <div className="border-t border-neutral-800 pt-4">
          {!selection || !selectedData ? (
            <p className="rounded border border-dashed border-neutral-800 p-3 text-xs text-neutral-500">
              Select a placement above or add a new one.
            </p>
          ) : selection.kind === "entity" ? (
            <EntityPlacementEditor
              map={map}
              gamePackage={gamePackage}
              placement={selectedData as EntityPlacementData}
              onChange={(next) => replaceInArray("entity_placements", selection.index, next)}
              onDelete={() => removeFromArray("entity_placements", selection.index)}
            />
          ) : selection.kind === "trigger" ? (
            <TriggerEditor
              gamePackage={gamePackage}
              trigger={selectedData as TriggerData}
              onChange={(next) => replaceInArray("triggers", selection.index, next)}
              onDelete={() => removeFromArray("triggers", selection.index)}
            />
          ) : selection.kind === "exit" ? (
            <ExitEditor
              gamePackage={gamePackage}
              exit={selectedData as MapExitData}
              onChange={(next) => replaceInArray("exits", selection.index, next)}
              onDelete={() => removeFromArray("exits", selection.index)}
            />
          ) : selection.kind === "item" ? (
            <WorldItemEditor
              gamePackage={gamePackage}
              item={selectedData as WorldItemPlacementData}
              onChange={(next) => replaceInArray("item_placements", selection.index, next)}
              onDelete={() => removeFromArray("item_placements", selection.index)}
            />
          ) : (
            <ContainerEditor
              gamePackage={gamePackage}
              container={selectedData as ContainerPlacementData}
              onChange={(next) => replaceInArray("container_placements", selection.index, next)}
              onDelete={() => removeFromArray("container_placements", selection.index)}
            />
          )}
        </div>
      </div>
      </aside>
    </>
  );
}

function InspectorList({
  title,
  count,
  kind,
  selected,
  getLabel,
  setSelection,
}: {
  title: string;
  count: number;
  kind: NonNullable<InspectorSelection>["kind"];
  selected: InspectorSelection;
  getLabel: (index: number) => string;
  setSelection: (selection: InspectorSelection) => void;
}) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{title}</h4>
        <span className="text-[10px] text-neutral-600">{count}</span>
      </div>
      {Array.from({ length: count }).map((_, index) => (
        <button
          key={index}
          onClick={() => setSelection({ kind, index } as InspectorSelection)}
          className={`w-full rounded px-2 py-1.5 text-left text-xs transition-colors ${
            selected?.kind === kind && selected.index === index
              ? "bg-neutral-800 text-white"
              : "bg-neutral-900/70 text-neutral-400 hover:bg-neutral-800/70 hover:text-neutral-200"
          }`}
        >
          <span className="font-mono text-neutral-600 mr-2">{index + 1}</span>
          {getLabel(index)}
        </button>
      ))}
      {count === 0 && <p className="text-xs text-neutral-700">None.</p>}
    </div>
  );
}

const asCell = (cell: unknown, fallback: [number, number] = [0, 0]): [number, number] => {
  const value = Array.isArray(cell) ? cell : fallback;
  return [
    Number(value[0] ?? fallback[0]),
    Number(value[1] ?? fallback[1]),
  ];
};

function EntityPlacementEditor({
  map,
  gamePackage,
  placement,
  onChange,
  onDelete,
}: {
  map: MapData;
  gamePackage: any;
  placement: EntityPlacementData;
  onChange: (placement: EntityPlacementData) => void;
  onDelete: () => void;
}) {
  const updateSchedule = (index: number, updates: any) => {
    const schedule = [...(placement.schedule || [])];
    schedule[index] = { ...schedule[index], ...updates };
    schedule.sort((a, b) => a.hour - b.hour);
    onChange({ ...placement, schedule });
  };

  return (
    <div className="space-y-3">
      <InspectorHeader title="Entity Placement" onDelete={onDelete} />
      <InspectorSelect label="Entity" value={placement.entity_id} onChange={(entity_id) => onChange({ ...placement, entity_id })}>
        {gamePackage.entities.map((entity: any) => (
          <option key={entity.id} value={entity.id}>{entity.display_name || entity.id}</option>
        ))}
      </InspectorSelect>
      <CellInputs cell={asCell(placement.cell)} onChange={(cell) => onChange({ ...placement, cell })} />

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold text-neutral-300">NPC Schedule</h5>
          <button
            onClick={() => {
              const schedule = [...(placement.schedule || []), { hour: 8, cell: asCell(placement.cell) }];
              schedule.sort((a, b) => a.hour - b.hour);
              onChange({ ...placement, schedule });
            }}
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            + Add
          </button>
        </div>
        {(placement.schedule || []).map((entry, index) => {
          const reachable = isReachable(map, asCell(placement.cell), asCell(entry.cell), gamePackage);
          return (
            <div key={index} className="rounded border border-neutral-800 bg-neutral-900/70 p-2 space-y-2">
              <div className="flex gap-2 items-end">
                <InspectorNumber label="Hour" value={entry.hour} min={0} max={23} onChange={(hour) => updateSchedule(index, { hour })} />
                <CellInputs cell={asCell(entry.cell)} onChange={(cell) => updateSchedule(index, { cell })} compact />
                <button
                  onClick={() => onChange({ ...placement, schedule: (placement.schedule || []).filter((_, i) => i !== index) })}
                  className="mb-1 rounded p-1 text-rose-400 hover:bg-rose-500/10"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {!reachable && (
                <div className="flex items-center gap-2 text-[11px] text-amber-300">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Target is not reachable from this placement.
                </div>
              )}
            </div>
          );
        })}
        {(placement.schedule || []).length === 0 && (
          <p className="text-xs text-neutral-600">No schedule. Friendly NPCs stay near their placement unless moved by cutscene.</p>
        )}
      </div>
    </div>
  );
}

function TriggerEditor({
  gamePackage,
  trigger,
  onChange,
  onDelete,
}: {
  gamePackage: any;
  trigger: TriggerData;
  onChange: (trigger: TriggerData) => void;
  onDelete: () => void;
}) {
  const unsupported = trigger.type === "switch_change";
  return (
    <div className="space-y-3">
      <InspectorHeader title="Trigger" onDelete={onDelete} />
      {unsupported && (
        <div className="rounded border border-amber-700/50 bg-amber-950/20 p-2 text-xs text-amber-200">
          switch_change is schema-only in the current runtime.
        </div>
      )}
      <InspectorText label="ID" value={trigger.id} onChange={(id) => onChange({ ...trigger, id })} />
      <InspectorSelect label="Type" value={trigger.type} onChange={(type) => onChange({ ...trigger, type: type as TriggerData["type"], cell: type === "on_load" ? undefined : trigger.cell || [0, 0] })}>
        <option value="step">Step</option>
        <option value="interact">Interact</option>
        <option value="on_load">On Load</option>
        <option value="switch_change" disabled={trigger.type !== "switch_change"}>Switch Change (unsupported)</option>
      </InspectorSelect>
      {trigger.type !== "on_load" && (
        <CellInputs cell={(trigger.cell || [0, 0]) as [number, number]} onChange={(cell) => onChange({ ...trigger, cell })} />
      )}
      <InspectorSelect label="Cutscene" value={trigger.cutscene_id} onChange={(cutscene_id) => onChange({ ...trigger, cutscene_id })}>
        {gamePackage.cutscenes.map((cutscene: any) => (
          <option key={cutscene.id} value={cutscene.id}>{cutscene.display_name || cutscene.id}</option>
        ))}
      </InspectorSelect>
      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <input type="checkbox" checked={trigger.once} onChange={(event) => onChange({ ...trigger, once: event.target.checked })} />
        Run once
      </label>
      <ConditionEditor compact label="Trigger Condition" value={trigger.condition} onChange={(condition) => onChange({ ...trigger, condition })} />
    </div>
  );
}

function ExitEditor({
  gamePackage,
  exit,
  onChange,
  onDelete,
}: {
  gamePackage: any;
  exit: MapExitData;
  onChange: (exit: MapExitData) => void;
  onDelete: () => void;
}) {
  const targetMap = gamePackage.maps.find((map: MapData) => map.id === exit.target_map_id);
  return (
    <div className="space-y-3">
      <InspectorHeader title="Map Exit" onDelete={onDelete} />
      <InspectorText label="ID" value={exit.id || ""} onChange={(id) => onChange({ ...exit, id: id || undefined })} />
      <CellInputs cell={asCell(exit.cell)} onChange={(cell) => onChange({ ...exit, cell })} />
      <InspectorSelect label="Target Map" value={exit.target_map_id} onChange={(target_map_id) => onChange({ ...exit, target_map_id, target_spawn_id: gamePackage.maps.find((map: MapData) => map.id === target_map_id)?.spawns?.[0]?.id })}>
        {gamePackage.maps.map((map: MapData) => (
          <option key={map.id} value={map.id}>{map.display_name || map.id}</option>
        ))}
      </InspectorSelect>
      <InspectorSelect label="Target Spawn" value={exit.target_spawn_id || ""} onChange={(target_spawn_id) => onChange({ ...exit, target_spawn_id: target_spawn_id || undefined })}>
        <option value="">First spawn</option>
        {targetMap?.spawns.map((spawn) => (
          <option key={spawn.id} value={spawn.id}>{spawn.id}</option>
        ))}
      </InspectorSelect>
      <FacingInputs facing={(exit.facing || [0, 1]) as [number, number]} onChange={(facing) => onChange({ ...exit, facing })} />
      <ConditionEditor compact label="Exit Condition" value={exit.condition} onChange={(condition) => onChange({ ...exit, condition })} />
    </div>
  );
}

function WorldItemEditor({
  gamePackage,
  item,
  onChange,
  onDelete,
}: {
  gamePackage: any;
  item: WorldItemPlacementData;
  onChange: (item: WorldItemPlacementData) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3">
      <InspectorHeader title="World Item" onDelete={onDelete} />
      <InspectorText label="ID" value={item.id} onChange={(id) => onChange({ ...item, id })} />
      <InspectorSelect label="Item" value={item.item_id} onChange={(item_id) => onChange({ ...item, item_id })}>
        {gamePackage.items?.map((candidate: any) => (
          <option key={candidate.id} value={candidate.id}>{candidate.display_name || candidate.id}</option>
        ))}
      </InspectorSelect>
      <CellInputs cell={asCell(item.cell)} onChange={(cell) => onChange({ ...item, cell })} />
      <InspectorNumber label="Count" value={item.count || 1} min={1} onChange={(count) => onChange({ ...item, count })} />
    </div>
  );
}

function ContainerEditor({
  gamePackage,
  container,
  onChange,
  onDelete,
}: {
  gamePackage: any;
  container: ContainerPlacementData;
  onChange: (container: ContainerPlacementData) => void;
  onDelete: () => void;
}) {
  const updateItem = (index: number, updates: any) => {
    const items = [...(container.items || [])];
    items[index] = { ...items[index], ...updates };
    onChange({ ...container, items });
  };

  return (
    <div className="space-y-3">
      <InspectorHeader title="Container" onDelete={onDelete} />
      <InspectorText label="ID" value={container.id} onChange={(id) => onChange({ ...container, id })} />
      <InspectorText label="Display Name" value={container.display_name || ""} onChange={(display_name) => onChange({ ...container, display_name: display_name || undefined })} />
      <InspectorSelect label="Object" value={container.object_id} onChange={(object_id) => onChange({ ...container, object_id })}>
        {gamePackage.object_library.map((object: any) => (
          <option key={object.id} value={object.id}>{object.display_name || object.id}</option>
        ))}
      </InspectorSelect>
      <CellInputs cell={asCell(container.cell)} onChange={(cell) => onChange({ ...container, cell })} />
      <FacingInputs facing={(container.facing || [0, 1]) as [number, number]} onChange={(facing) => onChange({ ...container, facing })} />
      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <input type="checkbox" checked={container.locked || false} onChange={(event) => onChange({ ...container, locked: event.target.checked })} />
        Locked
      </label>
      <InspectorSelect label="Key Item" value={container.key_item_id || ""} onChange={(key_item_id) => onChange({ ...container, key_item_id: key_item_id || undefined })}>
        <option value="">No key</option>
        {gamePackage.items?.map((item: any) => (
          <option key={item.id} value={item.id}>{item.display_name || item.id}</option>
        ))}
      </InspectorSelect>
      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <input type="checkbox" checked={container.consume_key || false} onChange={(event) => onChange({ ...container, consume_key: event.target.checked })} />
        Consume key on unlock
      </label>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-semibold text-neutral-300">Contents</h5>
          <button
            onClick={() => onChange({ ...container, items: [...(container.items || []), { item_id: gamePackage.items?.[0]?.id || "", count: 1 }] })}
            className="text-xs text-emerald-300 hover:text-emerald-200"
          >
            + Add
          </button>
        </div>
        {(container.items || []).map((entry, index) => (
          <div key={index} className="flex gap-2 items-end">
            <InspectorSelect label="Item" value={entry.item_id} onChange={(item_id) => updateItem(index, { item_id })}>
              {gamePackage.items?.map((item: any) => (
                <option key={item.id} value={item.id}>{item.display_name || item.id}</option>
              ))}
            </InspectorSelect>
            <InspectorNumber label="Count" value={entry.count || 1} min={1} onChange={(count) => updateItem(index, { count })} />
            <button
              onClick={() => onChange({ ...container, items: (container.items || []).filter((_, i) => i !== index) })}
              className="mb-1 rounded p-1 text-rose-400 hover:bg-rose-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function isReachable(map: MapData, from: [number, number], to: [number, number], gamePackage: any) {
  const key = (x: number, z: number) => `${x}_${z}`;
  const walkable = new Set<string>();
  map.cells.forEach((cell) => {
    if (!cell.walkable) return;
    if (cell.object_id) {
      const object = gamePackage.object_library.find((candidate: any) => candidate.id === cell.object_id);
      if (object?.collision?.profile !== "none") return;
    }
    walkable.add(key(cell.x, cell.z));
  });
  map.custom_object_placements.forEach((placement) => {
    const object = gamePackage.object_library.find((candidate: any) => candidate.id === placement.object_id);
    if (!object || object.collision?.profile === "none") return;
    const cells = object.collision?.footprint?.length
      ? object.collision.footprint.map(([dx, dz]: [number, number]) => [placement.cell[0] + dx, placement.cell[1] + dz])
      : [placement.cell];
    cells.forEach(([x, z]: [number, number]) => walkable.delete(key(x, z)));
  });
  map.container_placements?.forEach((container) => walkable.delete(key(container.cell[0], container.cell[1])));

  const start = key(from[0], from[1]);
  const goal = key(to[0], to[1]);
  if (!walkable.has(start) || !walkable.has(goal)) return false;
  const visited = new Set<string>([start]);
  const queue: [number, number][] = [from];
  while (queue.length) {
    const [x, z] = queue.shift()!;
    if (x === to[0] && z === to[1]) return true;
    for (const [nx, nz] of [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]] as [number, number][]) {
      const nextKey = key(nx, nz);
      if (!walkable.has(nextKey) || visited.has(nextKey)) continue;
      visited.add(nextKey);
      queue.push([nx, nz]);
    }
  }
  return false;
}

function InspectorHeader({ title, onDelete }: { title: string; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h4 className="text-sm font-semibold text-neutral-100">{title}</h4>
      <button onClick={onDelete} className="rounded p-1 text-rose-400 hover:bg-rose-500/10">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

function MiniButton({ children, onClick, disabled = false }: { children: React.ReactNode; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded bg-neutral-800 px-2 py-1.5 text-xs text-neutral-200 hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function InspectorText({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-neutral-800 bg-black px-2 py-1.5 text-xs text-white" />
    </label>
  );
}

function InspectorNumber({ label, value, onChange, min, max }: { label: string; value: number; onChange: (value: number) => void; min?: number; max?: number }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <input
        type="number"
        min={min}
        max={max}
        value={Number.isFinite(value) ? value : 0}
        onChange={(event) => onChange(Number(event.target.value) || 0)}
        className="w-full rounded border border-neutral-800 bg-black px-2 py-1.5 text-xs text-white"
      />
    </label>
  );
}

function InspectorSelect({ label, value, onChange, children }: { label: string; value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <label className="block space-y-1 flex-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-neutral-500">{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)} className="w-full rounded border border-neutral-800 bg-black px-2 py-1.5 text-xs text-white">
        {children}
      </select>
    </label>
  );
}

function CellInputs({ cell, onChange, compact = false }: { cell: [number, number]; onChange: (cell: [number, number]) => void; compact?: boolean }) {
  return (
    <div className={`grid ${compact ? "grid-cols-2 flex-1" : "grid-cols-2"} gap-2`}>
      <InspectorNumber label="X" value={cell[0]} onChange={(x) => onChange([x, cell[1]])} />
      <InspectorNumber label="Z" value={cell[1]} onChange={(z) => onChange([cell[0], z])} />
    </div>
  );
}

function FacingInputs({ facing, onChange }: { facing: [number, number]; onChange: (facing: [number, number]) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <InspectorNumber label="Facing X" value={facing[0]} onChange={(x) => onChange([x, facing[1]])} />
      <InspectorNumber label="Facing Z" value={facing[1]} onChange={(z) => onChange([facing[0], z])} />
    </div>
  );
}
