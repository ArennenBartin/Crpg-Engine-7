import { create } from "zustand";
import {
  GamePackage,
  GamePackageSchema,
  MapData,
  createEmptyGamePackage,
} from "../schema/game";

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
  importPackage: (jsonString: string) => void;
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
    return JSON.stringify(get().gamePackage, null, 2);
  },
  importPackage: (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      const result = GamePackageSchema.safeParse(parsed);
      if (result.success) {
        // Schema parse also fills in any missing defaulted fields.
        set({ gamePackage: result.data });
        return;
      }
      // Import anyway so older/hand-edited packages aren't bricked, but
      // surface exactly what failed validation.
      console.warn(
        "Imported package has schema issues:",
        result.error.issues.slice(0, 25),
      );
      alert(
        `Package imported with ${result.error.issues.length} schema issue(s) — see console for details.`,
      );
      set({ gamePackage: parsed });
    } catch (err) {
      console.error("Failed to import package", err);
      alert("Invalid game package JSON");
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
