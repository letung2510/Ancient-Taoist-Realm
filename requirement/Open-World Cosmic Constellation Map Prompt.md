## OPEN-WORLD COSMIC CONSTELLATION WORLD MAP

Redesign the current world map into an **interactive open-world cosmic constellation map**.

The map must NOT visually behave like a flowchart, dependency graph, tree, dungeon graph, or traditional node-link diagram.

The underlying world data remains unchanged.

The visualization layer should make the player feel like they are looking at an ancient celestial map where the geography of the world is represented by stars and constellations.

### CORE PRINCIPLE

Think:

WORLD DATA → SPATIAL WORLD → CELESTIAL MAP → CONSTELLATIONS

NOT:

WORLD DATA → HIERARCHY → NODE GRAPH

The world may contain hierarchical data internally:

World → Region → Area → Location

but this hierarchy must NOT determine the visual layout.

A location's parent/child relationship must not automatically place it above, below, left, or right of another location.

The visual map must be spatial, organic, exploratory, and open-ended.

---

## 1. OPEN-WORLD SPATIAL CANVAS

The map represents a world significantly larger than the viewport.

The viewport is only a camera window into the world.

Implement:

- infinite or very large pannable canvas
- zoom in / zoom out
- smooth camera movement
- drag-to-pan
- smooth focus on selected location
- center-on-player
- optional minimap
- meaningful empty space
- large distances between major regions

Do NOT automatically fit all locations into the viewport.

Do NOT force every location to remain visible simultaneously.

The player should feel that the world is much larger than what is currently visible.

---

## 2. WORLD REGIONS

Examples:

- Mortal Realm
- Eastern Continent
- Western Wilderness
- Northern Snowlands
- Southern Ancient Forest
- Central Immortal Region
- Demon Territory
- Forbidden Zone

Regions should occupy large spatial areas.

Do NOT render regions as rectangles, cards, panels, or bordered boxes.

Instead represent regions using:

- subtle nebula clouds
- radial atmospheric glow
- slightly different star density
- subtle color atmosphere
- faint region title
- organic constellation clusters

Region boundaries must feel atmospheric rather than geometric.

---

## 3. CONSTELLATION CLUSTERS

Locations belonging to the same geographic or conceptual area should naturally form constellation clusters.

Example:

        ★
       / \
      ★───★
       \ /
        ★

However, constellation shapes must NOT be generated as rigid graphs.

Use deterministic handcrafted positions or stable seeded spatial positions.

Avoid:

- grids
- rows
- columns
- equal spacing
- tree layouts
- radial menus
- dense force-directed graph layouts

Each region should have its own organic constellation structure.

---

## 4. LOCATIONS ARE STARS

Do NOT use large rectangular cards as map nodes.

Location representations:

Normal location:
- small star
- subtle glow

Important location:
- larger brighter star

Major city:
- large unique star

Sect:
- distinctive star/orbit symbol

Dungeon:
- darker special star

Forbidden area:
- ominous dark/red/purple celestial object

Special location:
- unique visual treatment

Player location:
- brightest star
- pulsing halo
- subtle radial glow

The star itself is the primary visual representation.

---

## 5. LOCATION LABELS

Do not permanently display large labels for every location.

Show labels when:

- hovered
- selected
- discovered
- nearby
- important
- currently occupied by player

At far zoom levels, hide most labels.

At medium zoom, show important locations.

At close zoom, reveal local labels and details.

This prevents label overlap and preserves the feeling of a starfield.

---

## 6. CONNECTIONS

Connections should look like constellation lines.

Use:

- thin lines
- low opacity
- subtle glow
- slight blur
- no thick borders
- no arrows unless direction is gameplay-critical

Connections are secondary visual elements.

Never make connections visually stronger than the stars.

At far zoom levels, hide most connections.

At medium zoom, show connections within the current region.

At close zoom, show nearby discovered connections.

---

## 7. DISCOVERY / FOG OF WORLD

Implement multiple visual discovery states.

### UNEXPLORED

- very dim star
- low opacity
- no label
- weak or hidden connection
- mysterious appearance

### DISCOVERED

- brighter star
- visible label when appropriate
- visible local constellation connections

### VISITED

- stronger star
- persistent discovery state
- subtle visual marker

### CURRENT LOCATION

- strongest glow
- pulsing halo
- highlighted local constellation
- camera focus

### IMPORTANT LOCATION

- larger star
- unique glow
- subtle particle effect

### LOCKED

- dark/faded star
- hidden or extremely faint connection
- optional lock symbol

---

## 8. DISCOVERY SHOULD FEEL LIKE REVEALING A CONSTELLATION

Do not simply "unlock another node".

When a player discovers locations, gradually reveal the constellation.

Example:

Before discovery:

        ·        ·

              ⋄

    ·                    ·


After discovery:

        ★─────★
             \
              ✦
             /
        ★───★


The player should feel that they are gradually reconstructing the celestial map of the world.

---

## 9. ZOOM LEVELS

Implement at least four conceptual zoom levels.

### COSMIC VIEW

Shows:

- major regions
- major constellation clusters
- important world landmarks
- very few labels

### REGION VIEW

Shows:

- regional constellation
- cities
- sects
- major landmarks
- discovered paths

### LOCAL VIEW

Shows:

- towns
- villages
- dungeons
- forests
- caves
- NPC-related locations

### CLOSE VIEW

Shows:

- detailed local locations
- more labels
- nearby connections
- detailed interaction information

Do not attempt to display all world information at every zoom level.

---

## 10. CAMERA BEHAVIOR

Camera movement must feel like exploration.

When selecting or traveling toward a location:

- smoothly pan toward target
- optionally zoom slightly
- highlight target star
- reveal nearby constellation
- avoid aggressive snapping

When the player moves:

- smoothly follow the player
- preserve surrounding context
- avoid constantly recentering unless necessary

---

## 11. OPEN-WORLD NAVIGATION

The map should not feel like selecting the next node in a linear graph.

A player should be able to:

- explore nearby areas
- select discovered locations
- travel between locations
- inspect distant regions
- discover unknown locations
- return to previously visited locations
- zoom out and understand the larger world
- zoom in and inspect local areas

The map represents geography and exploration, not progression order.

---

## 12. PLAYER LOCATION

The player should appear as a special celestial marker.

Example:

          ★────★
         /      \
        ★   ◎────★
         \ /
          ★

            ◎ = PLAYER

Use:

- bright central glow
- pulsing halo
- subtle particles
- nearby constellation highlighting

The player should visually feel like a moving celestial point inside the world.

---

## 13. CULTIVATION / FANTASY ATMOSPHERE

The visual style should feel like:

"An ancient cultivator looking toward the heavens and seeing the entire world represented as celestial constellations."

Avoid:

- spaceship HUD
- futuristic sci-fi panels
- technical dashboards
- excessive neon
- cyberpunk UI

Prefer:

- dark navy-black sky
- blue-white stars
- gold celestial landmarks
- purple/red dangerous regions
- green mysterious locations
- subtle nebula
- ancient celestial atmosphere
- restrained fantasy effects

---

## 14. SPECIAL WORLD PHENOMENA

The map may visually represent world phenomena.

Examples:

High spiritual energy:
- denser stars
- brighter constellation
- soft cyan/gold nebula

Demonic region:
- sparse stars
- dark red/purple atmosphere
- distorted constellation

Forbidden zone:
- almost empty space
- faint stars
- strange celestial distortion

Ancient ruins:
- broken constellation lines
- partially missing stars

Immortal region:
- extremely bright constellation
- rare golden stars
- celestial glow

These effects should remain subtle and should not reduce map readability.

---

## 15. DATA COMPATIBILITY

DO NOT modify the underlying world/map data model.

Preserve:

- location IDs
- region IDs
- connections
- discovery state
- visited state
- locked state
- player position
- navigation logic
- action logic
- travel logic
- interaction logic

Only redesign the visualization/layout/rendering layer.

The existing game logic must continue to work.

---

## 16. PERFORMANCE

The world may contain hundreds or thousands of locations.

Prefer:

- Canvas
- optimized SVG
- WebGL when necessary

Avoid thousands of heavy DOM elements.

Separate:

1. decorative background stars
2. region atmosphere
3. constellation lines
4. interactive gameplay stars
5. labels / overlays

Use level-of-detail rendering based on zoom level.

Far away locations should be rendered more cheaply.

---

## 17. FINAL EXPERIENCE

The final map should feel like:

"An enormous celestial world waiting to be explored."

The player should not think:

"I am looking at nodes."

The player should think:

"I am looking at the heavens, and those stars are places I can travel to."

The map should communicate:

WORLD → DISTANCE → MYSTERY → DISCOVERY → EXPLORATION

rather than:

NODE → EDGE → PATH → DESTINATION.

The final visual target is:

**OPEN-WORLD CELESTIAL ATLAS / COSMIC CONSTELLATION MAP**
for a dark-fantasy cultivation RPG.
---

## IMPLEMENTATION UPDATE 2026-09-16

Visualization layer đã được wire mà không đổi world data model: World Map dùng constellation/star treatment, atmospheric background, subdued connections, current-region pulse, zoom controls, wheel zoom và drag camera. Local Map dùng discovery/fog level 0–3 và chỉ hiện label/chi tiết theo mức khám phá. Các resolver Map V2 giữ toàn bộ travel, discovery, influence và interaction logic ở runtime.
