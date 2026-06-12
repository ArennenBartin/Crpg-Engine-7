import { Box, Edit3 } from "lucide-react";
import { useMemo, useState } from "react";
import { useEngineStore } from "../store/engineStore";
import { getObjectFootprint } from "../utils/objectFootprint";
import { ObjectSvgThumbnail } from "./ObjectPreviewHelpers";

export function ModelGallery() {
  const { gamePackage, setMode, setSelectedObjectId } = useEngineStore();
  const [categoryFilter, setCategoryFilter] = useState("all");

  const categories = useMemo(
    () =>
      Array.from(
        new Set(gamePackage.object_library.map((object) => object.category)),
      ).sort(),
    [gamePackage.object_library],
  );

  const visibleObjects = useMemo(
    () =>
      categoryFilter === "all"
        ? gamePackage.object_library
        : gamePackage.object_library.filter(
            (object) => object.category === categoryFilter,
          ),
    [categoryFilter, gamePackage.object_library],
  );

  const openModel = (objectId: string) => {
    setSelectedObjectId(objectId);
    setMode("model_maker");
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Model QA
          </h2>
          <p className="text-sm text-neutral-500">
            {visibleObjects.length} / {gamePackage.object_library.length} models
          </p>
        </div>
        <select
          className="bg-neutral-950 border border-neutral-800 text-sm rounded-md px-3 py-2 outline-none text-white w-full sm:w-56"
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
        >
          <option value="all">All Categories</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visibleObjects.map((object) => {
          const footprint = getObjectFootprint(object);
          const collision =
            object.collision?.profile === "none"
              ? "nonblocking"
              : object.collision?.profile || "single";

          return (
            <article
              key={object.id}
              className="bg-neutral-950 border border-neutral-800 rounded-lg overflow-hidden"
            >
              <div className="h-56 bg-[#111] border-b border-neutral-800">
                <ObjectSvgThumbnail object={object} />
              </div>
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-medium text-white truncate">
                      {object.display_name}
                    </h3>
                    <p className="text-xs text-neutral-500 truncate">
                      {object.id}
                    </p>
                  </div>
                  <button
                    onClick={() => openModel(object.id)}
                    className="shrink-0 p-2 rounded-md bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white transition-colors"
                    title="Open in Model Maker"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <Metric label="Parts" value={object.parts.length} />
                  <Metric label="Tiles" value={footprint.length} />
                  <Metric label="Collision" value={collision} />
                  <Metric label="Tags" value={object.tags?.length || 0} />
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {visibleObjects.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 text-center text-neutral-500 border border-neutral-800 rounded-lg bg-neutral-950">
          <Box className="w-8 h-8 mb-3" />
          <p>No models in this category.</p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-md px-2 py-2 min-w-0">
      <div className="text-neutral-500 truncate">{label}</div>
      <div className="text-neutral-200 font-medium truncate">{value}</div>
    </div>
  );
}
