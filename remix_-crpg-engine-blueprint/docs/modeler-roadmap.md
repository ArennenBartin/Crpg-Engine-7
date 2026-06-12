# Modeler Roadmap

Goal: evolve the current primitive object editor into a low-poly CRPG asset modeler for Alderamontico, while preserving the existing object library and map data.

## Implemented This Pass

- Added Model QA gallery in the editor sidebar.
- Added model preview cards with shared lighting, footprint overlays, player-scale references, and metadata.
- Added direct "open in Model Maker" action from each gallery card.
- Added player-scale reference and footprint overlay inside Model Maker.
- Added named Alderamontico material presets to Model Maker.
- Replaced Model QA's many live WebGL previews with reliable SVG model thumbnails.
- Added mesh-backed object schema with vertices, faces, face normals, material slots, and groups.
- Added primitive-to-mesh conversion in Model Maker.
- Added mesh face and vertex selection in Model Maker, including face material assignment.
- Added shared object rendering for both legacy primitive objects and mesh objects.
- Added object and edge selection in Model Maker.
- Added transform gizmo handles and numeric move controls for mesh selections.
- Added movement for selected vertices, edges, faces, and whole mesh objects.
- Added rotate and scale transform modes for mesh selections.
- Added grid, angle, and scale-step controls plus snap-selected-to-grid.
- Added nearest-vertex snapping and tile-origin snapping.
- Added face extrude, face inset, and face delete operations.
- Added selected vertex delete, selected edge delete, nearest-vertex merge, and selected-edge merge.
- Added selected-edge bevel, selection normal push/pull, and recalculate-normals controls.
- Added selected-edge split, larger vertex/edge selection hit targets, and midpoint edge handles.
- Added stored/live bounds preview, origin marker overlay, and Sync Bounds/Origin action.
- Added additive multi-select, duplicate selection, and mirror selection on X/Z controls.
- Added face group/ungroup controls that work from face, edge, vertex, or object selections.
- Added selection-centered sculpting with grab, smooth, inflate, pinch, flatten, noise, X symmetry, falloff controls, and low-poly remesh/simplify.
- Added active-model JSON import/export and exact active-model undo/redo in Model Maker.
- Added persisted front/side/top reference images with orthographic views, opacity, visibility, lock, placement controls, and silhouette trace overlay.
- Added material settings for color, emissive intensity, transparency, roughness, and metalness.
- Added procedural decal overlays for blood, cracks, marble veins, inscriptions, Grid-glow lines, and custom marks.
- Added material/decal budget warnings in Model Maker.
- Added GLB/GLTF import into editable mesh-backed objects with preserved material settings and collision footprint from imported bounds.
- Added active-model GLB/GLTF export from engine mesh data.
- Added procedural starters for monoliths, statues, shrines, church walls, marble paths, river altars, glass growths, and basement clutter.

## Phase 1: Visual QA And Scale

- [x] Model QA gallery that renders every object outside the map.
- [x] Quick open/edit action from each gallery card.
- [x] Player-scale reference beside model previews.
- [x] Footprint/collision overlay in previews.
- [x] Object metadata in previews: parts, bounds, footprint, collision, dialogue readiness.

## Phase 2: Better Authoring Feedback

- [x] Player-scale reference in Model Maker.
- [x] Footprint overlay in Model Maker.
- [x] Named Alderamontico material presets.
- [x] Collision profile and footprint controls that are visible while editing.
- [x] Bounds and origin preview.

## Phase 3: Runtime Object Format

- [x] Preserve existing primitive-part objects as legacy/simple objects.
- [x] Add mesh-backed model assets with vertices, faces, normals, material slots, and named groups.
- [x] Render primitive objects and mesh objects through one object renderer.
- [x] Import/export model JSON.

## Phase 4: Real Model Editor Basics

- [x] Selection modes: part, vertex, face.
- [x] Selection modes: object and edge.
- [x] Larger vertex/edge hit targets for easier selection.
- [x] Transform gizmo for move.
- [x] Transform gizmos for rotate and scale.
- [x] Grid and angle snapping controls.
- [x] Vertex and tile-origin snapping.
- [x] Multi-select.
- [x] Duplicate selection.
- [x] Mirror X/Z.
- [x] Group/ungroup.

## Phase 5: Mesh Modeling Tools

- [x] Vertex moving.
- [x] Edge and face moving.
- [x] Face extrude.
- [x] Face inset.
- [x] Edge bevel.
- [x] Delete face.
- [x] Delete edge/vertex.
- [x] Merge vertices.
- [x] Knife/split edge.
- [x] Push/pull along normal.
- [x] Recalculate normals.
- [x] Recompute bounds and origin.

## Phase 6: Sculpting Tools

- [x] Brush mode with radius, strength, and falloff.
- [x] Grab brush.
- [x] Smooth brush.
- [x] Inflate brush.
- [x] Pinch brush.
- [x] Flatten brush.
- [x] Noise/detail brush.
- [x] Symmetry sculpting.
- [x] Low-poly remesh/simplify.

## Phase 7: Materials And Decals

- [x] Face/submesh material slots.
- [x] Emissive material flag.
- [x] Transparent material flag.
- [x] Decals for blood, cracks, marble veins, inscriptions, and Grid-glow lines.
- [x] Material budget warnings.

## Phase 8: Reference And Blueprint Workflow

- [x] Load front/side/top reference images.
- [x] Orthographic front/side/top views.
- [x] Reference opacity and lock controls.
- [x] Silhouette tracing helper.

## Phase 9: GLB Workflow

- [x] Import `.glb` / `.gltf`.
- [x] Convert imported meshes into engine assets.
- [x] Preserve materials where possible.
- [x] Generate collision footprint from imported bounds.
- [x] Export edited models as `.glb`.

## Phase 10: Procedural Starters

- [x] Monolith generator.
- [x] Statue generator.
- [x] Shrine generator.
- [x] Church wall generator.
- [x] Marble path generator.
- [x] River altar generator.
- [x] Glass growth generator.
- [x] Pagan basement clutter generator.

## Phase 11: Workflow Polish

- [x] Per-operation undo/redo in Model Maker.
- [ ] Duplicate model variant.
- [ ] Named model versions.
- [ ] Collision preview in every object editing surface.
- [ ] Dialogue marker preview.
- [ ] Asset budget warnings: vertex count, draw calls, material count.
