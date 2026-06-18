# Active Map Model Usage

Generated from the current `createEmptyGamePackage()` data in `src/schema/game.ts`.

This lists object-library models that are actually used by the current playable Act 1 maps. It includes models assigned to map cells, custom object placements, and container placements. NPC sprites, dialogue portraits, and cutscene backgrounds are not included here because they are entity/dialogue assets rather than map object models.

`map_parish` and `map_town` still exist in the package, but they are legacy/reference maps and are excluded from this pass.

## Summary

- Active maps covered: 14
- Unique map object models used: 96
- Active map placements with missing object-library definitions: none
- Alderamontico procedural mesh overrides used on active maps: 94
- External GLB-backed models used on active maps: 2

## Map Key

| Code | Map ID | Display name |
| --- | --- | --- |
| TSQ | `map_town_square` | Town Square |
| RES | `map_residential` | Residential Quarter |
| TC | `map_temple_cordon` | Temple & Witness Cordon |
| WOOD | `map_old_processional_wood` | Old Processional Wood |
| COPSE | `map_glass_touched_copse` | Glass-Touched Copse |
| CAVE1 | `map_cave_upper` | Eastern Caves |
| CAVE2 | `map_cave_deep` | The Depths |
| RIVER | `map_river_path` | River Path |
| LAZARE | `map_lazare_house` | Lazare's Estate |
| MOUTH | `map_mouthstone_field` | Mouthstone Field |
| GLASS | `map_glassworks` | Abandoned Glassworks |
| GROTTO | `map_cave_grotto` | Crystal Grotto |
| NET1 | `map_network_upper` | The Pagan Network - Upper Level |
| NET2 | `map_network_depths` | The Pagan Network - Depths |

## Hero Setpiece Models

| Model ID | Source | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_bleeding_witness` | `/models/weeping-liberty-witness.glb` | Major Witness statue setpiece for the temple cordon mystery and bleeding-face story beat. | TC | 1 prop |
| `obj_mouthstone_gate` | `/models/golden-hummingbirds-mouthstone.glb` | Exile gate landmark anchoring the Mouthstone Field and town boundary myth. | MOUTH | 1 prop |

## Full Object Model Inventory

`tiles` are models assigned directly to map cells. `props` are custom object placements. `containers` are loot container placements that render with the model ID.

### Ground / Water Tiles

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_floor_dirt` | Processional Earth | Default outdoor and cave ground plane; fills wilderness, yards, ruins, and rough interiors. | TSQ, RES, TC, WOOD, COPSE, CAVE1, CAVE2, RIVER, LAZARE, MOUTH, GLASS, GROTTO | 21,743 tiles |
| `obj_floor_mosaic` | Cella Mosaic | Distinct sacred interior floor marker, currently used for the residential shrine/briefing space. | RES | 9 tiles |
| `obj_floor_stone` | Processional Marble | Main civic paving and worked-stone route surface for town, temple, estate, ruins, and the network entrance. | TSQ, RES, TC, WOOD, COPSE, CAVE2, RIVER, LAZARE, MOUTH, GLASS, NET1 | 8,306 tiles |
| `obj_floor_wood` | Cedar Boards | Raised wooden floors, platforms, bridges, and interior decking. | TSQ, RES, CAVE1, RIVER, LAZARE, GLASS | 2,223 tiles |
| `obj_net_floor_catacomb` | Catacomb Flags | Main walkable floor language for the Pagan Network. | NET1, NET2 | 2,294 tiles |
| `obj_net_floor_ritual` | Rite-Floor Mosaic | Ritual chamber floor accent for network rooms with ceremonial importance. | NET1, NET2 | 869 tiles |
| `obj_net_floor_soil` | Black Ritual Soil | Deep-network sacred/contaminated ground, used sparingly to mark under-rite spaces. | NET2 | 93 tiles |
| `obj_net_water` | Cistern Water | Subterranean water and cistern channels in the Pagan Network. | NET1, NET2 | 554 tiles |
| `obj_p_mud` | River Mud | Wet shoreline and low-bank terrain on the River Path. | RIVER | 136 tiles |
| `obj_water` | The Spoken River | Surface water for the river and crystal grotto. | RIVER, GROTTO | 3,214 tiles |

### Walls / Blockers

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_net_wall_catacomb` | Catacomb Wall | Primary collision and enclosure wall for the Pagan Network. | NET1, NET2 | 9,396 tiles |
| `obj_net_wall_ossuary` | Ossuary Course | Bone-lined wall variation for sacred/deeper network chambers. | NET1, NET2 | 812 tiles |
| `obj_wall_brick` | Sun-Clay Wall | Town and industrial masonry wall material; blocks movement and shapes buildings. | TSQ, RES, TC, LAZARE, GLASS | 468 tiles |
| `obj_wall_stone` | Ashlar Marble Wall | Heavier civic, temple, estate, and glassworks stone walls. | RES, TC, LAZARE, GLASS | 626 tiles |

### Roof Tiles

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_p_roof_clay_e` | Clay Roof Slope (east) | Clay roof eave piece for town/residential/industrial buildings. | TSQ, RES, GLASS | 117 tiles |
| `obj_p_roof_clay_flat` | Clay Roof Plateau | Flat clay roof fill for large town and glassworks roof masses. | TSQ, GLASS | 1,686 tiles |
| `obj_p_roof_clay_hip_ne` | Clay Hip (NE) | Clay roof corner cap. | TSQ, RES, GLASS | 7 tiles |
| `obj_p_roof_clay_hip_nw` | Clay Hip (NW) | Clay roof corner cap. | TSQ, RES, GLASS | 7 tiles |
| `obj_p_roof_clay_hip_se` | Clay Hip (SE) | Clay roof corner cap. | TSQ, RES, GLASS | 7 tiles |
| `obj_p_roof_clay_hip_sw` | Clay Hip (SW) | Clay roof corner cap. | TSQ, RES, GLASS | 7 tiles |
| `obj_p_roof_clay_n` | Clay Roof Slope (north) | Clay roof eave piece for town/residential/industrial buildings. | TSQ, RES, GLASS | 93 tiles |
| `obj_p_roof_clay_s` | Clay Roof Slope (south) | Clay roof eave piece for town/residential/industrial buildings. | TSQ, RES, GLASS | 93 tiles |
| `obj_p_roof_clay_w` | Clay Roof Slope (west) | Clay roof eave piece for town/residential/industrial buildings. | TSQ, RES, GLASS | 117 tiles |
| `obj_p_roof_e` | Roof Slope (east eave) | Darker roof eave for temple, estate, and old industrial structures. | TC, LAZARE, GLASS | 141 tiles |
| `obj_p_roof_flat` | Roof Ridge Plateau | Main roof fill for large temple, estate, and glassworks structures. | TC, LAZARE, GLASS | 3,915 tiles |
| `obj_p_roof_hip_ne` | Roof Hip (NE) | Dark roof corner cap. | TC, LAZARE, GLASS | 7 tiles |
| `obj_p_roof_hip_nw` | Roof Hip (NW) | Dark roof corner cap. | TC, LAZARE, GLASS | 7 tiles |
| `obj_p_roof_hip_se` | Roof Hip (SE) | Dark roof corner cap. | TC, LAZARE, GLASS | 7 tiles |
| `obj_p_roof_hip_sw` | Roof Hip (SW) | Dark roof corner cap. | TC, LAZARE, GLASS | 7 tiles |
| `obj_p_roof_n` | Roof Slope (north eave) | Dark roof eave for temple, estate, and old industrial structures. | TC, LAZARE, GLASS | 193 tiles |
| `obj_p_roof_s` | Roof Slope (south eave) | Dark roof eave for temple, estate, and old industrial structures. | TC, LAZARE, GLASS | 193 tiles |
| `obj_p_roof_w` | Roof Slope (west eave) | Dark roof eave for temple, estate, and old industrial structures. | TC, LAZARE, GLASS | 141 tiles |
| `obj_roof_tile` | Terracotta Roof | Residential roof tile variant for the quarter. | RES | 225 tiles |

### Architecture / Boundaries

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_cell_bars` | Bronze Custody Bars | Temple-cordon custody barriers and prison imagery. | TC | 11 props |
| `obj_column` | Doric Column | Formal architecture rhythm for civic, estate, industrial, and network spaces. | RES, TC, LAZARE, GLASS, NET1 | 24 props |
| `obj_column_broken` | Broken Column | Ruin language for damaged civic structures, the exile field, and glassworks collapse. | RES, MOUTH, GLASS | 7 props |
| `obj_fence_stone` | Marble Balustrade | Low civic boundary and route edge marker. | TSQ, RIVER | 20 props |
| `obj_p_dock` | River Dock | River landing marker and shoreline dressing. | RIVER | 1 prop |
| `obj_p_iron_fence` | Iron Railing | Property and estate boundary, especially around controlled or noble spaces. | RES, LAZARE | 8 props |
| `obj_p_lych_gate` | Lych-Gate | Sacred threshold and town-square landmark. | TSQ | 1 prop |
| `obj_p_trapdoor` | Cellar Trapdoor | Interactable hidden entry point for the cellar/network route. | TSQ | 1 prop |

### Civic / Furnishing Props

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_amphora` | Amphora | Storage clutter for domestic and industrial interiors. | RES, GLASS | 14 props |
| `obj_barrel` | Pithos Jar | Storage and market-route dressing. | TSQ, RES, RIVER, GLASS | 10 props |
| `obj_chest` | Cedar Reliquary Chest | Lootable container model and reliquary-style storage prop. | TSQ, RES, TC, RIVER, LAZARE, MOUTH, GLASS, NET1, NET2 | 20 props + 14 containers |
| `obj_iron_maiden` | Bronze Maiden | Punitive temple-cordon prop reinforcing institutional cruelty. | TC | 1 prop |
| `obj_lantern_post` | Tripod Brazier | Lighting marker, route guidance, and nighttime sacred mood. | TSQ, RES, TC, WOOD, COPSE, RIVER, LAZARE, MOUTH, GLASS, NET1 | 40 props |
| `obj_notice_board` | Proclamation Stele | Civic notice/interactable reading surface for public information. | TSQ, RES | 5 props |
| `obj_p_cart` | Handcart | Workaday residential clutter and implied labor traffic. | RES | 1 prop |
| `obj_p_crate` | Crate & Sacks | Small-scale storage and work clutter. | RES | 1 prop |
| `obj_p_desk` | Writ Desk | Aldric/scriptorium-style investigation furniture and interactable writing surface. | RES | 1 prop |
| `obj_p_inn_sign` | Hanging Inn Sign | Town-square business identity and readable civic landmark. | TSQ | 1 prop |
| `obj_p_shelf` | Archive Shelf | Investigation/archive dressing. | RES | 1 prop |
| `obj_p_stall` | Market Stall | Public market dressing and interactable square prop. | TSQ | 2 props |
| `obj_pallet_bed` | Kline Bed | Living quarters, infirmary, and custody sleeping surface. | RES, TC, LAZARE | 17 props |
| `obj_pew` | Exedra Bench | Seating for civic, religious, estate, and waiting areas. | TSQ, RES, TC, RIVER, LAZARE, GLASS | 52 props |
| `obj_pillory` | Wooden Pillory | Public punishment prop for the temple-cordon authority theme. | TC | 1 prop |
| `obj_podium` | Bema Lectern | Public speaking, ritual address, and proclamation point. | TSQ, TC | 2 props |
| `obj_table` | Trapeza Table | Work, dining, market, and investigation surface. | TSQ, RES, TC, LAZARE, GLASS | 38 props |
| `obj_well` | Fountain of First Water | Civic water landmark and interactable environmental anchor. | TSQ, RES, TC, LAZARE, GLASS | 6 props |

### Ritual / Story Props

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_altar` | Votive Altar | Shrine/interactable altar for sacred interiors and network-adjacent ritual spaces. | RES, TC, LAZARE, NET1 | 5 props |
| `obj_bleeding_witness` | Witness of the Dark Lights | Central bleeding Witness setpiece for the temple cordon. | TC | 1 prop |
| `obj_mouthstone_gate` | Mouthstone Exile Gate | Landmark gate for exile, boundaries, and the mouthstone myth. | MOUTH | 1 prop |
| `obj_p_candles` | Prayer Candles | Shrine lighting and prayer evidence. | RES, TC, RIVER, LAZARE | 6 props |
| `obj_p_cordon_post` | Cordon Post | Physical police line around the Witness scene. | TC | 24 props |
| `obj_p_grave_cross` | Grave Cross | Graveyard marker for the lower temple/cemetery area. | TC | 6 props |
| `obj_p_headstone` | Headstone | Graveyard density and death-cult context. | TC | 20 props |
| `obj_p_placard` | Church Warning Placard | Interactable warning/signage for church control and route direction. | TSQ, TC, WOOD | 4 props |
| `obj_p_shrine_stone` | Family Shrine Stone | Small household/wayside sacred marker. | RES, RIVER | 3 props |
| `obj_p_votive_token` | Votive Offering | Evidence-like offerings around ritual and river sites. | TC, RIVER | 7 props |
| `obj_statue_votary` | Votary Statue | Repeated sacred statue language tying town, estate, woods, and Mouthstone Field together. | TSQ, RES, TC, WOOD, LAZARE, MOUTH | 40 props |

### Glassworks / Industrial Props

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_c_glass_dome` | Glass Conservatory | Large industrial landmark for the abandoned glassworks. | GLASS | 1 prop |
| `obj_p_furnace` | Glass Furnace | Core glassworks machinery and interactable industrial clue surface. | GLASS | 11 props |
| `obj_p_railcart` | Rail Tipper Cart | Factory transport clutter and abandoned-worksite storytelling. | GLASS | 3 props |
| `obj_p_smokestack` | Glassworks Smokestack | Exterior industrial skyline marker for the glassworks. | GLASS | 11 props |

### Natural Props

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_cypress` | Cypress | Graveyard/river sacred landscape accent. | RES, RIVER | 4 props |
| `obj_dead_tree` | Bleached Tree | Blighted woodland, cordon, and estate atmosphere. | TC, WOOD, COPSE, LAZARE | 72 props |
| `obj_fig_tree` | Fig Tree | Domestic residential greenery. | RES | 1 prop |
| `obj_flower_bush` | Flowering Bush | Estate, residential, and river softening detail. | RES, RIVER, LAZARE | 41 props |
| `obj_grass_tuft` | Dry Grass | Small ground breakup on residential, river, and mouthstone maps. | RES, RIVER, MOUTH | 16 props |
| `obj_pine` | Pine Tree | Processional wood and outskirts tree dressing. | RES, WOOD, COPSE, MOUTH | 42 props |
| `obj_pine_large` | Large Pine Tree | Major woodland massing and estate edge cover. | RES, WOOD, COPSE, RIVER, LAZARE | 80 props |

### Network / Cave Ritual Props

| Model ID | Display name | Purpose | Used in | Footprint |
| --- | --- | --- | --- | --- |
| `obj_net_arch_sigil` | Sigil Threshold | Doorway/threshold marker for hidden network access and ritual boundaries. | COPSE, GLASS, NET1, NET2 | 8 props |
| `obj_net_bone_pile` | Bone Pile | Death evidence and occult ruin dressing. | CAVE2, NET1, NET2 | 13 props |
| `obj_net_brazier_cold` | Cold Brazier | Extinguished ritual lighting across caves and the Pagan Network. | COPSE, CAVE1, CAVE2, GROTTO, NET1, NET2 | 27 props |
| `obj_net_candle_cluster` | Candle Cluster | Active/prior under-rite prayer evidence and small shrine lighting. | WOOD, CAVE1, GROTTO, NET1, NET2 | 12 props |
| `obj_net_column_root` | Root-Bound Column | Buried-architecture support and root-invaded network identity. | CAVE1, CAVE2, NET1, NET2 | 55 props |
| `obj_net_glass_growth` | Grid Intrusion | Glass/Grid corruption marker linking copse, grotto, and network. | COPSE, GROTTO, NET1, NET2 | 17 props |
| `obj_net_glass_kneeler` | Glass Kneeler | Human conversion/rite aftermath setpiece. | CAVE2, NET1, NET2 | 12 props |
| `obj_net_krater` | Rite Krater | Ritual vessel for network chambers. | NET1, NET2 | 5 props |
| `obj_net_omphalos` | Omphalos of the Network | Major sacred focal object in upper/deep network spaces. | NET1, NET2 | 2 props |
| `obj_net_rite_circle` | Under-Rite Circle | Ritual site marker for deeper plot beats and conversion spaces. | CAVE2, NET1, NET2 | 4 props |
| `obj_net_root_curtain` | Root Curtain | Organic boundary/veil tying caves to the network. | COPSE, CAVE1, NET1, NET2 | 7 props |
| `obj_net_rubble` | Vault Collapse | Blockage, ruin texture, and collapsed-vault storytelling. | CAVE1, CAVE2, NET2 | 35 props |
| `obj_net_shrine_family` | Family Shrine | Domestic/familial shrine evidence inside the under-network. | CAVE1, NET1, NET2 | 7 props |
| `obj_net_stele` | Boundary Stele | Route marker and threshold omen from woods into caves/network. | WOOD, COPSE, CAVE1, GROTTO, NET1, NET2 | 10 props |
| `obj_net_votive_heap` | Votive Heap | Accumulated prayer/offering evidence for the hidden cult infrastructure. | WOOD, CAVE1, NET1, NET2 | 6 props |
