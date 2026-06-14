import { create } from "zustand";
import {
  GamePackage,
  GamePackageSchema,
  MapData,
  createEmptyGamePackage,
} from "../schema/game";

export type PackageImportResult =
  | {
      ok: true;
      message: string;
      imported: GamePackage;
    }
  | {
      ok: false;
      message: string;
      issues: string[];
    };

export type EditorMode =
  | "home"
  | "play"
  | "map_editor"
  | "model_maker"
  | "model_gallery"
  | "sprite_creator"
  | "dialogue_editor"
  | "quest_editor"
  | "entity_editor"
  | "cutscene_editor"
  | "encounter_editor"
  | "item_editor"
  | "document_editor"
  | "shop_editor"
  | "skill_editor";

interface EditorState {
  // Global Editor State
  mode: EditorMode;
  setMode: (mode: EditorMode) => void;

  // The active game package being edited
  gamePackage: GamePackage;
  setGamePackage: (pkg: GamePackage) => void;

  // State specific to Author Mode
  selectedMapId: string | null;
  setSelectedMapId: (id: string | null) => void;

  // Utilities
  exportPackage: () => string;
  importPackage: (jsonString: string) => PackageImportResult;
  updateMap: (mapId: string, updates: Partial<MapData>) => void;
  addMap: (mapData: MapData) => void;
  addObject: (objData: any) => void;
  updateObject: (objId: string, updates: any) => void;
  replaceObject: (objData: any) => void;
  selectedObjectId: string | null;
  setSelectedObjectId: (id: string | null) => void;
  selectedSpriteId: string | null;
  setSelectedSpriteId: (id: string | null) => void;
  addSprite: (spriteData: any) => void;
  updateSprite: (spriteId: string, updates: any) => void;
  updateSettings: (updates: any) => void;
  addDialogue: (dialogueData: any) => void;
  updateDialogue: (dialogueId: string, updates: any) => void;
  addQuest: (questData: any) => void;
  updateQuest: (questId: string, updates: any) => void;
  selectedDialogueId: string | null;
  setSelectedDialogueId: (id: string | null) => void;
  selectedQuestId: string | null;
  setSelectedQuestId: (id: string | null) => void;
  selectedEntityId: string | null;
  setSelectedEntityId: (id: string | null) => void;
  addEntity: (entityData: any) => void;
  updateEntity: (entityId: string, updates: any) => void;
  selectedItemId: string | null;
  setSelectedItemId: (id: string | null) => void;
  addItem: (itemData: any) => void;
  updateItem: (itemId: string, updates: any) => void;
  selectedDocumentId: string | null;
  setSelectedDocumentId: (id: string | null) => void;
  addDocument: (docData: any) => void;
  updateDocument: (docId: string, updates: any) => void;
  selectedShopId: string | null;
  setSelectedShopId: (id: string | null) => void;
  addShop: (shopData: any) => void;
  updateShop: (shopId: string, updates: any) => void;
  selectedSkillId: string | null;
  setSelectedSkillId: (id: string | null) => void;
  addSkill: (skillData: any) => void;
  updateSkill: (skillId: string, updates: any) => void;
  undoStack: GamePackage[];
  redoStack: GamePackage[];
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
}

const formatPackageIssue = (issue: { path: PropertyKey[]; message: string }) => {
  const path = issue.path.length ? issue.path.map(String).join(".") : "package";
  return `${path}: ${issue.message}`;
};

const keepExistingId = <T extends { id: string }>(items: T[], currentId: string | null) =>
  currentId && items.some((item) => item.id === currentId) ? currentId : null;

const pickSelectedMapId = (pkg: GamePackage, currentId: string | null) => {
  if (currentId && pkg.maps.some((map) => map.id === currentId)) return currentId;
  if (pkg.maps.some((map) => map.id === pkg.metadata.start_map_id)) return pkg.metadata.start_map_id;
  return pkg.maps[0]?.id || null;
};

const normalizeImportedPackage = (pkg: GamePackage): GamePackage => {
  const startMap = pkg.maps.find((map) => map.id === pkg.metadata.start_map_id) || pkg.maps[0];
  if (!startMap) return pkg;

  const startSpawn =
    startMap.spawns.find((spawn) => spawn.id === pkg.metadata.start_spawn_id) ||
    startMap.spawns[0];

  return {
    ...pkg,
    metadata: {
      ...pkg.metadata,
      start_map_id: startMap.id,
      start_spawn_id: startSpawn?.id || pkg.metadata.start_spawn_id,
    },
  };
};

export const useEngineStore = create<EditorState>((set, get) => ({
  mode: "home",
  setMode: (mode) => set({ mode }),

  gamePackage: createEmptyGamePackage(),
  setGamePackage: (pkg) => set((state) => ({ 
    undoStack: [...state.undoStack, state.gamePackage].slice(-50),
    redoStack: [],
    gamePackage: pkg 
  })),

  undoStack: [],
  redoStack: [],
  pushHistory: () => set((state) => ({
    undoStack: [...state.undoStack, state.gamePackage].slice(-50),
    redoStack: []
  })),
  undo: () => set((state) => {
    if (state.undoStack.length === 0) return state;
    const previous = state.undoStack[state.undoStack.length - 1];
    return {
      gamePackage: previous,
      undoStack: state.undoStack.slice(0, -1),
      redoStack: [state.gamePackage, ...state.redoStack].slice(0, 50)
    };
  }),
  redo: () => set((state) => {
    if (state.redoStack.length === 0) return state;
    const next = state.redoStack[0];
    return {
      gamePackage: next,
      undoStack: [...state.undoStack, state.gamePackage].slice(-50),
      redoStack: state.redoStack.slice(1)
    };
  }),

  selectedMapId: null,
  setSelectedMapId: (id) => set({ selectedMapId: id }),

  selectedObjectId: null,
  setSelectedObjectId: (id) => set({ selectedObjectId: id }),

  selectedSpriteId: null,
  setSelectedSpriteId: (id) => set({ selectedSpriteId: id }),

  selectedDialogueId: null,
  setSelectedDialogueId: (id) => set({ selectedDialogueId: id }),

  selectedQuestId: null,
  setSelectedQuestId: (id) => set({ selectedQuestId: id }),

  selectedEntityId: null,
  setSelectedEntityId: (id) => set({ selectedEntityId: id }),

  selectedItemId: null,
  setSelectedItemId: (id) => set({ selectedItemId: id }),
  selectedDocumentId: null,
  setSelectedDocumentId: (id) => set({ selectedDocumentId: id }),
  selectedShopId: null,
  setSelectedShopId: (id) => set({ selectedShopId: id }),
  selectedSkillId: null,
  setSelectedSkillId: (id) => set({ selectedSkillId: id }),

  exportPackage: () => {
    const result = GamePackageSchema.safeParse(get().gamePackage);
    if (!result.success) {
      const issues = result.error.issues
        .slice(0, 5)
        .map(formatPackageIssue)
        .join("; ");
      throw new Error(`Current package is not exportable: ${issues}`);
    }
    return JSON.stringify(result.data, null, 2);
  },
  importPackage: (jsonString) => {
    const previous = get().gamePackage;
    const trimmed = jsonString.trim();
    if (!trimmed) {
      return {
        ok: false,
        message: "Import failed: no JSON was provided.",
        issues: ["The import payload is empty."],
      };
    }

    try {
      const parsed = JSON.parse(trimmed);
      const result = GamePackageSchema.safeParse(parsed);
      if (result.success) {
        const imported = normalizeImportedPackage(result.data);
        set((state) => ({
          undoStack: [...state.undoStack, previous].slice(-50),
          redoStack: [],
          gamePackage: imported,
          selectedMapId: pickSelectedMapId(imported, state.selectedMapId),
          selectedObjectId: keepExistingId(imported.object_library, state.selectedObjectId),
          selectedSpriteId: keepExistingId(imported.sprite_library, state.selectedSpriteId),
          selectedDialogueId: keepExistingId(imported.dialogue, state.selectedDialogueId),
          selectedQuestId: keepExistingId(imported.quests, state.selectedQuestId),
          selectedEntityId: keepExistingId(imported.entities, state.selectedEntityId),
          selectedItemId: keepExistingId(imported.items, state.selectedItemId),
          selectedDocumentId: keepExistingId(imported.documents, state.selectedDocumentId),
          selectedShopId: keepExistingId(imported.shops || [], state.selectedShopId),
          selectedSkillId: keepExistingId(imported.abilities || [], state.selectedSkillId),
        }));
        return {
          ok: true,
          message: `Imported ${imported.metadata.title} (${imported.maps.length} maps, ${imported.object_library.length} objects).`,
          imported,
        };
      }

      const issues = result.error.issues.slice(0, 25).map(formatPackageIssue);
      console.warn(
        "Rejected package import with schema issues:",
        result.error.issues.slice(0, 25),
      );
      return {
        ok: false,
        message: `Import failed: ${result.error.issues.length} schema issue(s).`,
        issues,
      };
    } catch (err) {
      return {
        ok: false,
        message: "Import failed: invalid JSON.",
        issues: [err instanceof Error ? err.message : "The file could not be parsed as JSON."],
      };
    }
  },
  updateMap: (mapId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        maps: state.gamePackage.maps.map(m => m.id === mapId ? { ...m, ...updates } : m)
      }
    }));
  },
  addMap: (mapData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        maps: [...state.gamePackage.maps, mapData]
      }
    }));
  },
  addObject: (objData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        object_library: [...state.gamePackage.object_library, objData]
      }
    }));
  },
  updateObject: (objId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        object_library: state.gamePackage.object_library.map(o => o.id === objId ? { ...o, ...updates } : o)
      }
    }));
  },
  replaceObject: (objData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        object_library: state.gamePackage.object_library.map(o => o.id === objData.id ? objData : o)
      }
    }));
  },
  addSprite: (spriteData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        sprite_library: [...state.gamePackage.sprite_library, spriteData]
      }
    }));
  },
  updateSprite: (spriteId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        sprite_library: state.gamePackage.sprite_library.map(s => s.id === spriteId ? { ...s, ...updates } : s)
      }
    }));
  },
  updateSettings: (updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        settings: { ...state.gamePackage.settings, ...updates }
      }
    }));
  },
  addDialogue: (dialogueData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        dialogue: [...state.gamePackage.dialogue, dialogueData]
      }
    }));
  },
  updateDialogue: (dialogueId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        dialogue: state.gamePackage.dialogue.map(d => d.id === dialogueId ? { ...d, ...updates } : d)
      }
    }));
  },
  addQuest: (questData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        quests: [...state.gamePackage.quests, questData]
      }
    }));
  },
  updateQuest: (questId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        quests: state.gamePackage.quests.map(q => q.id === questId ? { ...q, ...updates } : q)
      }
    }));
  },
  addEntity: (entityData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        entities: [...state.gamePackage.entities, entityData]
      }
    }));
  },
  updateEntity: (entityId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        entities: state.gamePackage.entities.map(e => e.id === entityId ? { ...e, ...updates } : e)
      }
    }));
  },
  addItem: (itemData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        items: [...state.gamePackage.items, itemData]
      }
    }));
  },
  updateItem: (itemId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        items: state.gamePackage.items.map(i => i.id === itemId ? { ...i, ...updates } : i)
      }
    }));
  },
  addDocument: (docData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        documents: [...(state.gamePackage.documents || []), docData]
      }
    }));
  },
  updateDocument: (docId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        documents: (state.gamePackage.documents || []).map(d => d.id === docId ? { ...d, ...updates } : d)
      }
    }));
  },
  addShop: (shopData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        shops: [...(state.gamePackage.shops || []), shopData]
      }
    }));
  },
  updateShop: (shopId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        shops: (state.gamePackage.shops || []).map(s => s.id === shopId ? { ...s, ...updates } : s)
      }
    }));
  },
  addSkill: (skillData) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        abilities: [...(state.gamePackage.abilities || []), skillData]
      }
    }));
  },
  updateSkill: (skillId, updates) => {
    get().pushHistory();
    set((state) => ({
      gamePackage: {
        ...state.gamePackage,
        abilities: (state.gamePackage.abilities || []).map(a => a.id === skillId ? { ...a, ...updates } : a)
      }
    }));
  }
}));
