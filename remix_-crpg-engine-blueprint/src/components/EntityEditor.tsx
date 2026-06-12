import React, { useState } from "react";
import { useEngineStore } from "../store/engineStore";
import { EntityData } from "../schema/game";
import { Plus, Skull, Trash2, ChevronLeft, Sparkles } from "lucide-react";
import { AIGenerationModal } from "./AIGenerationModal";

const statFields: { key: keyof EntityData; label: string; fallback: number }[] = [
  { key: "max_hp", label: "Max HP", fallback: 10 },
  { key: "max_mp", label: "Max MP", fallback: 0 },
  { key: "attack", label: "Attack", fallback: 2 },
  { key: "defense", label: "Defense", fallback: 1 },
  { key: "speed", label: "Speed", fallback: 10 },
];

export function EntityEditor() {
  const {
    gamePackage,
    selectedEntityId,
    setSelectedEntityId,
    addEntity,
    updateEntity,
  } = useEngineStore();
  const [showAIModal, setShowAIModal] = useState(false);

  const activeEntity =
    gamePackage.entities.find((entity) => entity.id === selectedEntityId) || null;

  const handleCreateEntity = () => {
    const id = `entity_${Date.now()}`;
    const newEntity: EntityData = {
      id,
      display_name: "New Entity",
      is_npc: false,
      max_hp: 10,
      max_mp: 0,
      attack: 2,
      defense: 1,
      speed: 10,
      skills: [],
    };
    addEntity(newEntity);
    setSelectedEntityId(id);
  };

  const handleUpdate = (updates: Partial<EntityData>) => {
    if (!activeEntity) return;
    updateEntity(activeEntity.id, updates);
  };

  const toggleSkill = (skillId: string, enabled: boolean) => {
    if (!activeEntity) return;
    const current = activeEntity.skills || [];
    const skills = enabled
      ? Array.from(new Set([...current, skillId]))
      : current.filter((id) => id !== skillId);
    handleUpdate({ skills });
  };

  return (
    <div className="flex h-full w-full relative">
      <div className={`${activeEntity ? "hidden lg:flex" : "flex"} w-full lg:w-64 bg-neutral-900 border-r border-neutral-800 flex-col h-full z-10 shrink-0`}>
        <div className="p-4 border-b border-neutral-800 flex justify-between items-center bg-neutral-950">
          <h2 className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Entities</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowAIModal(true)}
              title="Generate Entity"
              className="p-1.5 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 rounded-md transition-colors"
            >
              <Sparkles className="w-4 h-4" />
            </button>
            <button
              onClick={handleCreateEntity}
              title="Create Entity"
              className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {gamePackage.entities.map((entity) => (
            <button
              key={entity.id}
              onClick={() => setSelectedEntityId(entity.id)}
              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center justify-between group ${
                selectedEntityId === entity.id
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <Skull className={`w-4 h-4 shrink-0 ${selectedEntityId === entity.id ? "text-emerald-500" : "text-neutral-600"}`} />
                <span className="truncate">{entity.display_name || "Unnamed Entity"}</span>
              </div>
              <span className="ml-2 text-[10px] uppercase text-neutral-600">
                {entity.is_npc ? "NPC" : "Hostile"}
              </span>
            </button>
          ))}
          {gamePackage.entities.length === 0 && (
            <div className="text-center text-xs text-neutral-600 mt-8">
              No entities created yet.
            </div>
          )}
        </div>
      </div>

      {activeEntity ? (
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 bg-neutral-950 w-full block">
          <div className="lg:hidden mb-4 flex items-center gap-2">
            <button
              onClick={() => setSelectedEntityId(null)}
              className="p-1.5 -ml-1.5 text-neutral-400 hover:text-white bg-neutral-900 rounded-md"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-sm font-medium text-neutral-300">Back to Entities</span>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Edit Entity</h2>
                <p className="text-xs text-neutral-500 font-mono">{activeEntity.id}</p>
              </div>
              <button
                type="button"
                title="Delete is not implemented yet"
                className="p-2 text-neutral-600 rounded-md cursor-not-allowed"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <section className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="ID">
                  <input
                    type="text"
                    value={activeEntity.id}
                    disabled
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-sm text-neutral-500 cursor-not-allowed"
                  />
                </Field>
                <Field label="Display Name">
                  <input
                    type="text"
                    value={activeEntity.display_name || ""}
                    onChange={(event) => handleUpdate({ display_name: event.target.value })}
                    placeholder="e.g. Aldric"
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm text-neutral-300">
                <input
                  type="checkbox"
                  checked={activeEntity.is_npc || false}
                  onChange={(event) => handleUpdate({ is_npc: event.target.checked })}
                  className="rounded bg-neutral-900 border-neutral-700"
                />
                Friendly NPC / talkable entity
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="World Dialogue">
                  <select
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={activeEntity.dialogue_id || ""}
                    onChange={(event) => handleUpdate({ dialogue_id: event.target.value || undefined })}
                  >
                    <option value="">-- None --</option>
                    {gamePackage.dialogue.map((dialogue) => (
                      <option key={dialogue.id} value={dialogue.id}>
                        {dialogue.display_name || dialogue.id}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Party Dialogue">
                  <select
                    className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    value={activeEntity.party_dialogue_id || ""}
                    onChange={(event) => handleUpdate({ party_dialogue_id: event.target.value || undefined })}
                  >
                    <option value="">Fallback to world dialogue</option>
                    {gamePackage.dialogue.map((dialogue) => (
                      <option key={dialogue.id} value={dialogue.id}>
                        {dialogue.display_name || dialogue.id}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Entity Sprite">
                <select
                  className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  value={activeEntity.sprite_id || ""}
                  onChange={(event) => handleUpdate({ sprite_id: event.target.value || undefined })}
                >
                  <option value="">-- None (Simple Box) --</option>
                  {gamePackage.sprite_library.map((sprite) => (
                    <option key={sprite.id} value={sprite.id}>{sprite.display_name || sprite.id}</option>
                  ))}
                </select>
              </Field>
            </section>

            <section className="space-y-4 border-t border-neutral-800 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-300">Combat Stats</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Used by hostiles and by party members when a cutscene adds this entity to the party.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {statFields.map((field) => (
                  <Field key={String(field.key)} label={field.label}>
                    <input
                      type="number"
                      value={(activeEntity[field.key] as number | undefined) ?? field.fallback}
                      onChange={(event) =>
                        handleUpdate({ [field.key]: parseInt(event.target.value, 10) || 0 } as Partial<EntityData>)
                      }
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    />
                  </Field>
                ))}
              </div>
            </section>

            <section className="space-y-4 border-t border-neutral-800 pt-6">
              <div>
                <h3 className="text-sm font-semibold text-neutral-300">Skills</h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Party members can use these on their combat turns. Hostiles keep their normal melee/chase behavior.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {(gamePackage.abilities || []).map((skill) => (
                  <label
                    key={skill.id}
                    className="flex items-start gap-3 rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 text-sm text-neutral-300"
                  >
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={(activeEntity.skills || []).includes(skill.id)}
                      onChange={(event) => toggleSkill(skill.id, event.target.checked)}
                    />
                    <span className="min-w-0">
                      <span className="block font-medium text-neutral-100">{skill.display_name || skill.id}</span>
                      <span className="block truncate text-xs text-neutral-500">
                        {skill.element} / {skill.targeting} / AP {skill.ap_cost}
                      </span>
                    </span>
                  </label>
                ))}
                {(gamePackage.abilities || []).length === 0 && (
                  <p className="rounded-lg border border-dashed border-neutral-800 p-4 text-sm text-neutral-500">
                    No skills exist yet. Create them in the Skills editor first.
                  </p>
                )}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-neutral-400 bg-neutral-950">
          <Skull className="w-12 h-12 mb-4 opacity-20" />
          <h2 className="text-xl font-medium">No Entity Selected</h2>
          <p className="text-sm mt-1 opacity-70">Create or select an entity to define its behavior.</p>
        </div>
      )}

      {showAIModal && (
        <AIGenerationModal
          title="Generate Entities"
          placeholder="e.g. Generate a priest NPC, a river spirit enemy, and a party companion..."
          schema={{
            type: "ARRAY",
            items: {
              type: "OBJECT",
              properties: {
                id: { type: "STRING" },
                display_name: { type: "STRING" },
                is_npc: { type: "BOOLEAN" },
                sprite_id: { type: "STRING" },
                dialogue_id: { type: "STRING" },
                party_dialogue_id: { type: "STRING" },
                max_hp: { type: "NUMBER" },
                max_mp: { type: "NUMBER" },
                attack: { type: "NUMBER" },
                defense: { type: "NUMBER" },
                speed: { type: "NUMBER" },
                skills: { type: "ARRAY", items: { type: "STRING" } },
              },
              required: ["id", "display_name", "is_npc"],
            },
          }}
          onGenerate={(data) => {
            const entities = Array.isArray(data) ? data : [data];
            entities.forEach((entity) => addEntity(entity));
            if (entities.length > 0) setSelectedEntityId(entities[0].id);
          }}
          onClose={() => setShowAIModal(false)}
        />
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs text-neutral-500 font-medium tracking-wide">{label}</span>
      {children}
    </label>
  );
}
