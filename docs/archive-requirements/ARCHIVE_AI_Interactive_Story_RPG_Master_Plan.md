# AI Interactive Story RPG Web Game
## Master Design Document / Complete Flow / Technical Blueprint

> **Version:** 0.1  
> **Goal:** Build a browser-based interactive role-playing game where player choices permanently influence the story, characters, world state, quests, relationships, and endings.  
> **Core principle:** **AI is the storyteller, not the game engine.**

---

# TABLE OF CONTENTS

1. Vision
2. Product Goals
3. Core Gameplay Loop
4. Player Journey
5. Complete Application Flow
6. New Game Flow
7. Character Creation Flow
8. World Selection Flow
9. Story Turn Flow
10. Choice and Free Input System
11. Game State Architecture
12. RPG System
13. Consequence System
14. Relationship System
15. Quest System
16. Inventory System
17. Memory System
18. Story Branching System
19. AI Architecture
20. AI Request / Response Contract
21. Prompt Architecture
22. State Validation
23. Turn Resolution Pipeline
24. Failure, Death and Permanent Consequences
25. Save / Load System
26. Frontend Architecture
27. Backend Architecture
28. Database Design
29. API Design
30. Folder Structure
31. MVP Scope
32. Development Phases
33. Testing Strategy
34. Anti-Patterns
35. Future Expansion
36. Deployment
37. Security and API Key Protection
38. Recommended Development Order
39. Detailed User Flows
40. Example Complete Gameplay
41. Definition of Done

---

# 1. VISION

The game should feel like a combination of:

- Interactive fiction
- Text RPG
- Visual novel
- Tabletop RPG / Game Master
- AI-generated storytelling

The player should never feel that they are simply chatting with an AI.

The player is playing a **game**.

The AI provides dynamic narrative, NPC reactions, atmosphere, dialogue, and possible developments.

The deterministic game engine owns:

- Character stats
- HP / resources
- Inventory
- Quests
- Relationships
- World flags
- Important events
- Random checks
- Death / victory
- Permanent consequences

## Core Design Principle

```text
PLAYER
   |
   v
ACTION
   |
   v
GAME ENGINE --------------------------+
   |                                  |
   | validates action                 |
   | calculates rules                 |
   | updates deterministic state      |
   v                                  |
AI STORY ENGINE <---------------------+
   |
   | receives controlled context
   v
NARRATIVE + NPC RESPONSE + OPTIONS
   |
   v
PLAYER
```

The AI must not become the single source of truth.

---

# 2. PRODUCT GOALS

## Primary goals

1. Player can create a character.
2. Player can select a world or scenario.
3. AI generates the opening scene.
4. Player can either:
   - select suggested choices
   - write a completely custom action
5. Every action can create consequences.
6. Consequences can appear immediately or much later.
7. NPCs remember important interactions.
8. Quests can succeed or fail.
9. Characters can die.
10. The story can reach different endings.
11. The game can save and load progress.

## Non-goals for MVP

Do NOT initially build:

- Multiplayer
- Complex 3D graphics
- Open world map
- Voice acting
- Real-time combat
- Hundreds of worlds
- Social network features
- Marketplace
- User-generated public scenarios

The first version should prove one thing:

> **Is the AI-driven gameplay actually fun?**

---

# 3. CORE GAMEPLAY LOOP

```text
+----------------+
|  STORY SCENE   |
+--------+-------+
         |
         v
+----------------+
| PLAYER DECISION|
|                |
| A/B/C choice   |
| OR free input  |
+--------+-------+
         |
         v
+----------------+
| ACTION PARSER  |
+--------+-------+
         |
         v
+----------------+
| GAME ENGINE    |
|                |
| Rule check     |
| Skill check    |
| State check    |
+--------+-------+
         |
         v
+----------------+
| STATE UPDATE   |
+--------+-------+
         |
         v
+----------------+
| AI STORY ENGINE|
+--------+-------+
         |
         v
+----------------+
| NEW NARRATIVE  |
| NPC RESPONSE   |
| NEW OPTIONS    |
+--------+-------+
         |
         +--------------------> LOOP
```

Every turn should follow this general pipeline.

---

# 4. PLAYER JOURNEY

```text
LANDING PAGE
      |
      +----------------+
      |                |
      v                v
 NEW GAME          CONTINUE
      |                |
      v                v
CREATE CHARACTER   LOAD SAVE
      |
      v
SELECT WORLD
      |
      v
WORLD INTRODUCTION
      |
      v
FIRST STORY SCENE
      |
      v
PLAYER ACTION
      |
      v
TURN RESOLUTION
      |
      +--> STATE CHANGES
      |
      +--> AI NARRATIVE
      |
      +--> MEMORY UPDATE
      |
      v
NEXT SCENE
      |
      v
...
      |
      v
ENDING / DEATH / VICTORY
```

---

# 5. COMPLETE APPLICATION FLOW

## Main screens

```text
/
├── Home
│   ├── New Game
│   ├── Continue
│   ├── Settings
│   └── About
│
├── /new-game
│   ├── Character Creation
│   └── World Selection
│
├── /game/:saveId
│   ├── Story Panel
│   ├── Player Status
│   ├── Inventory
│   ├── Quest Log
│   ├── Character Relations
│   ├── Memory / Journal
│   └── Action Input
│
├── /saves
│   └── Save Management
│
└── /settings
```

---

# 6. NEW GAME FLOW

```text
PLAYER CLICKS NEW GAME
        |
        v
CHECK LOCAL SAVE LIMIT / LOGIN
        |
        v
CREATE CHARACTER
        |
        v
VALIDATE CHARACTER
        |
        v
SELECT WORLD
        |
        v
CREATE INITIAL GAME STATE
        |
        v
CREATE SAVE
        |
        v
GENERATE OPENING CONTEXT
        |
        v
CALL AI
        |
        v
VALIDATE AI RESPONSE
        |
        v
DISPLAY FIRST SCENE
```

## Initial game creation object

```json
{
  "saveId": "uuid",
  "worldId": "zombie_city",
  "chapter": 1,
  "turn": 1,
  "player": {},
  "worldState": {},
  "relationships": {},
  "inventory": [],
  "quests": [],
  "flags": {},
  "memory": [],
  "history": []
}
```

---

# 7. CHARACTER CREATION FLOW

## Step 1: Identity

```text
Name
Age
Gender / optional identity presentation
Background
```

## Step 2: Archetype

Example:

```text
[ Survivor ]
[ Detective ]
[ Soldier ]
[ Doctor ]
[ Hacker ]
[ Merchant ]
```

Archetype should provide initial tendencies, not permanently lock the player.

Example:

```json
{
  "archetype": "detective",
  "bonuses": {
    "intelligence": 2,
    "perception": 2
  },
  "startingItems": [
    "notebook",
    "flashlight"
  ]
}
```

## Step 3: Stats

Initial example:

```text
STR  Strength
INT  Intelligence
AGI  Agility
CHA  Charisma
LCK  Luck
PER  Perception
```

Example allocation:

```text
Total points: 30

STR [ 6 ]
INT [ 8 ]
AGI [ 5 ]
CHA [ 4 ]
LCK [ 3 ]
PER [ 4 ]
```

Validation:

```text
MIN STAT = 1
MAX STAT = 10
TOTAL POINTS = 30
```

---

# 8. WORLD SELECTION FLOW

For MVP, use only ONE world.

Recommended first world:

# THE LAST NIGHT

Genre:

- Survival
- Horror
- Mystery
- Zombie apocalypse

Initial premise:

> The player wakes up after a city-wide emergency.
> Communication networks are collapsing.
> The military has sealed parts of the city.
> Something is spreading.

## World Definition

Each world should be defined independently.

```json
{
  "id": "zombie_city",
  "name": "The Last Night",
  "genre": [
    "survival",
    "horror",
    "mystery"
  ],
  "rules": [],
  "factions": [],
  "majorCharacters": [],
  "locations": [],
  "possibleEndings": []
}
```

This makes future worlds possible without rewriting the engine.

---

# 9. STORY TURN FLOW

This is the most important flow in the entire game.

```text
CURRENT GAME STATE
        |
        v
PLAYER ACTION
        |
        v
ACTION CLASSIFICATION
        |
        +--------------------------+
        |                          |
        v                          v
Simple Action                Complex Action
        |                          |
        v                          v
Direct Resolution            Skill / Rule Check
        |                          |
        +------------+-------------+
                     |
                     v
              PRE-AI STATE
                     |
                     v
              BUILD AI CONTEXT
                     |
                     v
                  CALL AI
                     |
                     v
             AI RETURNS JSON
                     |
                     v
              VALIDATE RESPONSE
                     |
          +----------+----------+
          |                     |
          v                     v
         VALID                 INVALID
          |                     |
          v                     v
      APPLY ALLOWED          RETRY / FALLBACK
      STORY CHANGES
          |
          v
      UPDATE MEMORY
          |
          v
      SAVE GAME
          |
          v
      RENDER NEW SCENE
```

---

# 10. CHOICE AND FREE INPUT SYSTEM

The player must have two ways to act.

## Suggested choices

Example:

```text
1. Ask the woman who she is.
2. Drive around her.
3. Leave the car and inspect the area.
```

## Free input

```text
What do you do?

> I turn off the headlights and observe her from inside the car.
```

The free input is not an optional gimmick.

It is a core feature.

## Action object

Every action becomes normalized.

```json
{
  "type": "custom",
  "rawInput": "I turn off the headlights and observe her.",
  "selectedChoiceId": null
}
```

Suggested choice:

```json
{
  "type": "suggested",
  "rawInput": null,
  "selectedChoiceId": "choice_02"
}
```

---

# 11. GAME STATE ARCHITECTURE

The game state is the single source of truth.

```json
{
  "meta": {
    "saveId": "uuid",
    "worldId": "zombie_city",
    "chapter": 2,
    "turn": 17,
    "createdAt": "",
    "updatedAt": ""
  },

  "player": {
    "name": "Minh",
    "hp": 80,
    "maxHp": 100,
    "stats": {
      "strength": 7,
      "intelligence": 8,
      "agility": 6,
      "charisma": 5,
      "luck": 4,
      "perception": 7
    }
  },

  "location": {
    "id": "mountain_road",
    "name": "Old Mountain Road"
  },

  "inventory": [],

  "relationships": {},

  "quests": {},

  "flags": {},

  "memory": {
    "shortTerm": [],
    "longTerm": [],
    "worldFacts": []
  },

  "recentHistory": []
}
```

---

# 12. RPG SYSTEM

## Stats

Suggested MVP stats:

```text
STR - Strength
INT - Intelligence
AGI - Agility
CHA - Charisma
LCK - Luck
PER - Perception
```

## Skill check

Example:

```text
Player tries to force a locked door.

Difficulty: 12

Strength: 7
Random roll: 1 - 10

Result:
7 + roll >= 12
```

Pseudo-code:

```ts
function skillCheck(stat: number, difficulty: number) {
  const roll = randomInt(1, 10)
  const total = stat + roll

  return {
    roll,
    total,
    success: total >= difficulty
  }
}
```

The AI should receive the result:

```json
{
  "action": "force_door",
  "result": "success",
  "roll": 8,
  "total": 15
}
```

Then AI narrates the result.

---

# 13. CONSEQUENCE SYSTEM

Every meaningful action can create:

```text
Immediate consequence
Short-term consequence
Long-term consequence
Hidden consequence
Permanent consequence
```

## Example

Player steals medicine.

Immediate:

```text
inventory.medicine += 1
```

Short-term:

```text
hospital_security_suspicion += 10
```

Long-term:

```text
hospital_faction_relationship -= 20
```

Hidden:

```text
flag.security_camera_recorded_player = true
```

Permanent:

```text
possible peaceful ending with hospital faction is locked
```

## Delayed consequence scheduler

```json
{
  "eventId": "hospital_revenge",
  "trigger": {
    "afterTurns": 15
  },
  "condition": {
    "flag": "security_camera_recorded_player",
    "equals": true
  }
}
```

The game engine checks scheduled events every turn.

---

# 14. RELATIONSHIP SYSTEM

Each important NPC has a relationship state.

```json
{
  "anna": {
    "trust": 40,
    "fear": 10,
    "respect": 20,
    "affection": 0,
    "lastInteraction": 15,
    "knownFacts": []
  }
}
```

Do not reduce relationships to only:

```text
Anna +50
```

Better dimensions:

- Trust
- Fear
- Respect
- Affection
- Suspicion

## Example

Player threatens Anna:

```text
Trust -20
Fear +30
Respect +5
```

This can create very different NPC behavior.

---

# 15. QUEST SYSTEM

Quest object:

```json
{
  "id": "find_radio",
  "title": "Find a Working Radio",
  "status": "active",
  "objectives": [
    {
      "id": "find_radio",
      "description": "Find a working radio",
      "completed": false
    }
  ],
  "failureConditions": [],
  "rewards": []
}
```

Quest status:

```text
LOCKED
AVAILABLE
ACTIVE
COMPLETED
FAILED
ABANDONED
```

Important rule:

> A failed quest should not necessarily mean game over.

Failure should create a new story.

Example:

```text
FAILED:
Rescue Anna

NEW QUEST:
Escape the military zone

NEW WORLD STATE:
Anna may now be infected
```

---

# 16. INVENTORY SYSTEM

```json
{
  "items": [
    {
      "id": "medkit",
      "quantity": 2
    },
    {
      "id": "old_key",
      "quantity": 1
    }
  ]
}
```

Items should support:

```text
usable
key item
quest item
weapon
consumable
evidence
```

The AI can suggest an item use, but the game engine validates it.

---

# 17. MEMORY SYSTEM

The AI cannot reliably receive the entire history forever.

Use layers.

```text
MEMORY
|
+-- Recent Context
|
+-- Long-Term Memory
|
+-- NPC Memory
|
+-- World Facts
|
+-- Quest Facts
|
+-- Hidden Flags
```

## Short-term memory

Last 5-10 turns.

```json
[
  {
    "turn": 15,
    "summary": "Player met Anna in the hospital."
  }
]
```

## Long-term memory

Important facts.

```json
[
  "Player saved Anna from zombies.",
  "Player lied to police officer David.",
  "Player possesses the black key.",
  "Anna suspects the military caused the outbreak."
]
```

## NPC memory

```json
{
  "anna": [
    "Player saved me.",
    "Player lied about knowing David."
  ]
}
```

## Memory promotion

After every turn:

```text
NEW EVENT
   |
   v
IS IT IMPORTANT?
   |
   +-- NO --> recent history only
   |
   +-- YES --> long-term memory
                 |
                 +--> NPC memory
                 |
                 +--> world fact
```

Use either:

- deterministic rules
- AI summarization
- hybrid approach

For MVP, use a hybrid approach.

---

# 18. STORY BRANCHING SYSTEM

Avoid pre-writing every branch.

Instead, use:

```text
AUTHORED STRUCTURE
        +
DYNAMIC AI EVENTS
```

## Authored structure

Define:

- Major chapters
- Major locations
- Major NPCs
- Major factions
- Critical secrets
- Possible endings

Example:

```text
CHAPTER 1
Escape the city

CHAPTER 2
Discover the military experiment

CHAPTER 3
Choose a faction

CHAPTER 4
Find the origin

CHAPTER 5
Final decision
```

AI dynamically creates the path between these milestones.

## World graph

```text
                    START
                      |
                      v
                 CITY ESCAPE
                  /       \
                 v         v
            HOSPITAL     SUBWAY
                |           |
                +-----+-----+
                      v
                MILITARY BASE
                 /     |     \
                v      v      v
             JOIN A  JOIN B  ESCAPE
```

The player can move in unexpected directions, but major state transitions remain controlled.

---

# 19. AI ARCHITECTURE

The AI layer should be abstracted.

```text
AIProvider
    |
    +-- GeminiProvider
    |
    +-- CloudflareAIProvider
    |
    +-- FutureProvider
```

Interface:

```ts
interface StoryAIProvider {
  generateTurn(context: StoryContext): Promise<AIStoryResponse>
}
```

Never let the frontend call the AI directly with a secret key.

---

# 20. AI REQUEST / RESPONSE CONTRACT

## Request

```json
{
  "world": {},
  "player": {},
  "location": {},
  "relationships": {},
  "quests": {},
  "inventory": [],
  "importantMemory": [],
  "recentEvents": [],
  "action": {},
  "ruleResults": {}
}
```

## Response

```json
{
  "narrative": "The woman slowly turns toward the car...",

  "dialogue": [],

  "suggestedChoices": [
    {
      "id": "choice_1",
      "text": "Ask her what happened."
    }
  ],

  "proposedChanges": {
    "flags": [],
    "relationships": [],
    "quests": [],
    "inventory": []
  },

  "memoryCandidates": [],

  "scene": {
    "locationId": "mountain_road",
    "mood": "tense"
  }
}
```

The word **proposedChanges** is intentional.

The AI proposes.

The engine decides.

---

# 21. PROMPT ARCHITECTURE

System prompt:

```text
You are the narrative engine for an interactive RPG.

Your responsibility is to create:
- atmospheric narrative
- NPC reactions
- dialogue
- possible actions

You must NOT:
- decide actions for the player
- overwrite authoritative game state
- invent important items without permission
- resurrect dead characters
- contradict established facts
- guarantee player success
- reveal hidden information without an in-game reason

The game state supplied by the engine is authoritative.
```

Then inject structured context.

```text
WORLD
...

PLAYER
...

CURRENT LOCATION
...

IMPORTANT MEMORY
...

NPC STATE
...

ACTIVE QUESTS
...

RECENT EVENTS
...

PLAYER ACTION
...

RULE RESULTS
...
```

---

# 22. STATE VALIDATION

AI output must be validated.

Example dangerous output:

```json
{
  "player": {
    "hp": 9999
  }
}
```

Reject.

Example:

```json
{
  "addItem": "legendary_sword"
}
```

Reject unless the game rules allow it.

## Validation layers

```text
AI RESPONSE
     |
     v
JSON VALID?
     |
     +-- NO --> retry
     |
     v
SCHEMA VALID?
     |
     +-- NO --> retry
     |
     v
GAME RULE VALID?
     |
     +-- NO --> reject changes
     |
     v
APPLY SAFE CHANGES
```

---

# 23. TURN RESOLUTION PIPELINE

Detailed implementation:

```text
1. Player submits action

2. Frontend disables input

3. Backend receives:
   - saveId
   - action

4. Backend loads current state

5. Validate:
   - game exists
   - player alive
   - action length
   - action allowed

6. Classify action

7. Resolve deterministic mechanics:
   - stat checks
   - item use
   - combat
   - movement

8. Update preliminary state

9. Build AI context

10. Call AI

11. Parse AI JSON

12. Validate AI response

13. Apply allowed narrative proposals

14. Update:
   - recent history
   - memory
   - quests
   - relationships
   - flags

15. Trigger delayed events

16. Check:
   - death
   - victory
   - ending
   - chapter transition

17. Save state

18. Return scene to frontend

19. Frontend renders scene

20. Enable next action
```

---

# 24. FAILURE, DEATH AND PERMANENT CONSEQUENCES

The game should allow failure.

Bad design:

```text
Player fails
|
v
AI magically saves player
```

Better:

```text
FAIL
 |
 +--> HP loss
 |
 +--> Lose item
 |
 +--> NPC distrust
 |
 +--> Quest failure
 |
 +--> New route
 |
 +--> Capture
 |
 +--> Death
```

Death screen:

```text
YOU DIED

Cause:
You trusted the wrong person.

Final turn: 47

[ Reload Last Save ]
[ Return Home ]
```

Optional future feature:

```text
Ironman Mode
```

No manual reload.

---

# 25. SAVE / LOAD SYSTEM

## MVP

Use LocalStorage.

Key:

```text
ai-rpg-save:{saveId}
```

Save object:

```json
{
  "version": 1,
  "gameState": {},
  "lastScene": {},
  "updatedAt": ""
}
```

## Auto-save

Save after:

- every completed turn
- chapter transition
- major decision

## Future cloud save

```text
User
 |
 +--> Save 1
 +--> Save 2
 +--> Save 3
```

---

# 26. FRONTEND ARCHITECTURE

Recommended:

```text
React
Vite
TypeScript
Tailwind
Zustand
```

## Component tree

```text
App
|
+-- Router
|
+-- HomePage
|
+-- NewGamePage
|    |
|    +-- CharacterCreator
|    +-- WorldSelector
|
+-- GamePage
     |
     +-- StoryPanel
     |
     +-- ActionPanel
     |
     +-- CharacterPanel
     |
     +-- InventoryPanel
     |
     +-- QuestPanel
     |
     +-- RelationshipPanel
```

---

# 27. BACKEND ARCHITECTURE

Recommended MVP:

```text
Cloudflare Worker
```

Responsibilities:

```text
/api/game/create
/api/game/turn
/api/game/save
/api/game/load
/api/worlds
```

The Worker handles:

- API key protection
- AI provider calls
- validation
- rate limiting
- game state processing

---

# 28. DATABASE DESIGN

## MVP

No remote database required.

```text
Browser
  |
  +--> LocalStorage
```

## Version 2

```text
User
 |
 v
Cloudflare Worker
 |
 +-- D1 / other DB
 |
 +-- Object storage if needed
```

Suggested tables:

```text
users
worlds
saves
game_events
memories
```

### saves

```text
id
user_id
world_id
game_state_json
created_at
updated_at
```

### game_events

```text
id
save_id
turn
player_action
result_json
created_at
```

Event logs are useful for debugging AI behavior.

---

# 29. API DESIGN

## Create game

```text
POST /api/game/create
```

Request:

```json
{
  "character": {},
  "worldId": "zombie_city"
}
```

Response:

```json
{
  "saveId": "uuid",
  "scene": {}
}
```

## Submit turn

```text
POST /api/game/turn
```

Request:

```json
{
  "saveId": "uuid",
  "action": {
    "type": "custom",
    "text": "I hide behind the car."
  }
}
```

Response:

```json
{
  "scene": {},
  "stateSummary": {},
  "turn": 2
}
```

---

# 30. FOLDER STRUCTURE

```text
ai-rpg-game/
|
+-- apps/
|   |
|   +-- web/
|   |   |
|   |   +-- src/
|   |       |
|   |       +-- components/
|   |       +-- pages/
|   |       +-- features/
|   |       |   +-- game/
|   |       |   +-- character/
|   |       |   +-- inventory/
|   |       |   +-- quests/
|   |       |
|   |       +-- stores/
|   |       +-- services/
|   |       +-- types/
|   |
|   +-- worker/
|       |
|       +-- src/
|           +-- api/
|           +-- engine/
|           +-- ai/
|           +-- validation/
|           +-- memory/
|           +-- worlds/
|
+-- packages/
|   |
|   +-- shared/
|       |
|       +-- types/
|       +-- schemas/
|       +-- constants/
|
+-- docs/
    |
    +-- game-design.md
    +-- architecture.md
    +-- prompt-design.md
    +-- worlds.md
```

---

# 31. MVP SCOPE

The MVP should contain:

## One world

```text
The Last Night
```

## Character

- Name
- 6 stats
- HP

## Gameplay

- AI opening scene
- Suggested choices
- Free input
- Skill checks
- Inventory
- 5 NPCs
- Relationships
- 3 quests
- Memory
- Save/load

## Endings

At least 3:

```text
Escape
Join the survivors
Discover the truth
```

---

# 32. DEVELOPMENT PHASES

## Phase 0 - Project Setup

```text
Create repository
Create React project
Configure TypeScript
Configure Tailwind
Create Cloudflare Worker
```

## Phase 1 - Static Prototype

Build UI without AI.

```text
Home
New Game
Character Creation
Game Screen
Fake Story
Fake Choices
```

Goal:

> Validate UI and UX.

## Phase 2 - Local Game Engine

Implement:

```text
GameState
Stats
Skill checks
Inventory
Quests
Relationships
Flags
```

No AI yet.

Goal:

> Make the deterministic game engine work.

## Phase 3 - AI Integration

Add:

```text
AI provider
Prompt builder
JSON schema
Response validator
Fallback handling
```

## Phase 4 - Memory

Add:

```text
Recent history
Long-term memory
NPC memory
World facts
```

## Phase 5 - Consequences

Add:

```text
Delayed events
Permanent flags
Quest failures
Relationship effects
```

## Phase 6 - Save / Load

Start with:

```text
LocalStorage
```

## Phase 7 - Polish

Add:

```text
Loading animation
Typing effect
Scene transitions
Journal
Character panel
Better mobile layout
```

## Phase 8 - Online

Add:

```text
Authentication
Cloud save
Database
Rate limiting
Analytics
```

---

# 33. TESTING STRATEGY

## Unit tests

Test:

```text
Skill check
State reducer
Inventory operations
Quest transitions
Relationship calculations
Delayed event triggers
```

## AI contract tests

Test malformed responses:

```text
Invalid JSON
Missing narrative
Unknown item
Impossible stat change
Invalid quest ID
Contradictory location
```

## Regression tests

Create fixed scenarios:

```text
Scenario A:
Player saves Anna

Expected:
Anna trust > 50

Scenario B:
Player attacks Anna

Expected:
Anna fear increases
Anna trust decreases
```

## Manual playtesting

Ask:

- Is the story coherent?
- Does the AI remember important events?
- Do choices feel meaningful?
- Can the player exploit the system?
- Does failure create interesting outcomes?

---

# 34. ANTI-PATTERNS

## DO NOT: Let AI own all state

Bad:

```text
Player action
   |
   v
AI invents everything
```

Problem:

- contradictions
- forgotten items
- random stats
- impossible events

## DO NOT: Send the entire story every turn

Problem:

- token growth
- slower response
- higher cost
- context overload

Use memory layers.

## DO NOT: Trust AI JSON blindly

Always validate.

## DO NOT: Build 10 worlds first

Build one excellent world.

## DO NOT: Make every choice successful

Failure creates gameplay.

---

# 35. FUTURE EXPANSION

After MVP:

## Multiple worlds

```text
Fantasy
Cyberpunk
Detective
Horror
Romance
Historical
Wuxia
Cultivation
```

## User-created worlds

World template:

```json
{
  "name": "",
  "genre": [],
  "rules": [],
  "characters": [],
  "locations": [],
  "majorEvents": []
}
```

## AI-generated world creation

User:

```text
Create a world where ancient Rome discovers alien technology.
```

System:

```text
Generate:
- lore
- factions
- NPCs
- locations
- conflicts
- endings
```

## Community scenarios

Future:

```text
Creator
  |
  +--> World A
  +--> World B
  +--> World C
```

---

# 36. DEPLOYMENT

Suggested architecture:

```text
GitHub
   |
   +----------------------+
   |                      |
   v                      v
Frontend               Backend
Cloudflare Pages       Cloudflare Worker
                            |
                            v
                         AI API
```

Environment variables:

```text
AI_API_KEY
AI_PROVIDER
ENVIRONMENT
```

Never expose API keys in frontend code.

---

# 37. SECURITY AND API KEY PROTECTION

Wrong:

```text
React frontend
    |
    +--> Gemini API key
```

Anyone can inspect the browser and steal the key.

Correct:

```text
Browser
   |
   v
Your Backend / Worker
   |
   | secret API key
   v
AI Provider
```

Also implement:

```text
Rate limiting
Input length limits
Save ownership checks
Basic abuse protection
```

---

# 38. RECOMMENDED DEVELOPMENT ORDER

This is the exact order recommended.

```text
STEP 1
Create repository

STEP 2
Create React + TypeScript + Vite

STEP 3
Create Home page

STEP 4
Create Character Creator

STEP 5
Create World Selection

STEP 6
Create Game Screen

STEP 7
Create GameState type

STEP 8
Create Zustand store

STEP 9
Create deterministic turn engine

STEP 10
Implement stats and skill checks

STEP 11
Implement flags

STEP 12
Implement quests

STEP 13
Implement relationships

STEP 14
Implement LocalStorage save

STEP 15
Create AI backend

STEP 16
Create AI provider abstraction

STEP 17
Create prompt builder

STEP 18
Create response schema

STEP 19
Integrate AI turn generation

STEP 20
Implement memory

STEP 21
Implement delayed consequences

STEP 22
Implement death / ending

STEP 23
Test complete gameplay

STEP 24
Deploy prototype

STEP 25
Collect feedback

STEP 26
Improve gameplay before adding features
```

---

# 39. DETAILED USER FLOWS

## FLOW A - New Game

```text
HOME
 |
 |-- Click NEW GAME
 |
 v
CHARACTER CREATION
 |
 |-- Enter name
 |-- Choose archetype
 |-- Allocate stats
 |
 v
VALIDATE
 |
 +-- Invalid --> Show error
 |
 +-- Valid
       |
       v
WORLD SELECTION
       |
       v
CREATE GAME STATE
       |
       v
GENERATE OPENING SCENE
       |
       v
GAME SCREEN
```

## FLOW B - Player Turn

```text
READ SCENE
     |
     v
CHOOSE OPTION OR WRITE ACTION
     |
     v
SUBMIT
     |
     v
VALIDATE ACTION
     |
     +-- Invalid --> Error
     |
     v
RESOLVE GAME RULES
     |
     v
CALL AI
     |
     +-- AI ERROR
     |     |
     |     +--> Retry
     |     |
     |     +--> Fallback narrative
     |
     v
VALIDATE RESPONSE
     |
     v
UPDATE STATE
     |
     v
SAVE
     |
     v
DISPLAY NEXT SCENE
```

## FLOW C - Death

```text
ACTION
  |
  v
RESOLUTION
  |
  v
HP <= 0?
  |
  +-- NO --> Continue
  |
  +-- YES
        |
        v
     DEATH EVENT
        |
        v
     FINAL SUMMARY
        |
        +--> Reload
        |
        +--> New Game
```

---

# 40. EXAMPLE COMPLETE GAMEPLAY

## Turn 1

Story:

> You wake inside an abandoned ambulance.
> Outside, the city is silent.

Player:

```text
I search the ambulance for supplies.
```

Engine:

```text
PER check
```

Result:

```text
SUCCESS
```

AI:

> Under the driver's seat, you find a blood-stained first aid kit.

State:

```json
{
  "inventory": [
    {
      "id": "medkit",
      "quantity": 1
    }
  ]
}
```

---

## Turn 2

Player:

```text
I turn on the ambulance radio.
```

AI:

> Static fills the cabin. Then a woman's voice whispers:
> "If anyone can hear this... don't go to the hospital."

Memory:

```text
longTermMemory +=
"Unknown woman warned player not to go to hospital."
```

Quest:

```text
Find the source of the radio transmission.
```

---

## Turn 10

Player ignores warning and enters hospital.

Delayed consequence:

```text
flag.entered_hospital_after_warning = true
```

AI generates different narrative because the game context knows the player deliberately ignored the warning.

This is the desired behavior:

> The story reacts not only to the current action, but also to the player's history.

---

# 41. DEFINITION OF DONE

The MVP is complete when a player can:

- [ ] Open the website
- [ ] Start a new game
- [ ] Create a character
- [ ] Allocate stats
- [ ] Select a world
- [ ] Receive an AI-generated opening scene
- [ ] Select suggested choices
- [ ] Enter custom actions
- [ ] Perform skill checks
- [ ] Gain and lose items
- [ ] Meet NPCs
- [ ] Change relationships
- [ ] Start and fail quests
- [ ] Create permanent consequences
- [ ] Trigger delayed events
- [ ] Have important events remembered
- [ ] Save the game
- [ ] Reload the game
- [ ] Die
- [ ] Reach multiple endings

If all items above work coherently, the MVP is successful.

---

# FINAL ARCHITECTURE SUMMARY

```text
                     +------------------+
                     |      PLAYER      |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     |    WEB CLIENT    |
                     | React / Zustand  |
                     +--------+---------+
                              |
                              v
                     +------------------+
                     |   GAME BACKEND   |
                     | Cloudflare Worker|
                     +--------+---------+
                              |
              +---------------+---------------+
              |                               |
              v                               v
     +------------------+          +------------------+
     |   GAME ENGINE    |          |    AI PROVIDER   |
     |                  |          |                  |
     | Stats            |          | Narrative        |
     | Inventory        |          | Dialogue         |
     | Quest            |          | NPC reaction     |
     | Relationships    |          | Suggestions      |
     | Flags            |          +------------------+
     | Random checks    |
     | Consequences     |
     +--------+---------+
              |
              v
     +------------------+
     |    GAME STATE    |
     +--------+---------+
              |
              +-------------------+
              |                   |
              v                   v
     +------------------+   +------------------+
     | MEMORY SYSTEM    |   | SAVE SYSTEM      |
     +------------------+   +------------------+
```

# GOLDEN RULES

1. **AI tells the story.**
2. **The game engine controls the rules.**
3. **Game state is authoritative.**
4. **Player actions must matter.**
5. **Failure is part of gameplay.**
6. **Important events must be remembered.**
7. **AI output is never trusted without validation.**
8. **Build one good world before building many worlds.**
9. **Prototype gameplay before scaling infrastructure.**
10. **Never expose AI API keys in the frontend.**

---

# NEXT IMPLEMENTATION MILESTONE

The recommended immediate next task is:

```text
Create the project skeleton:

ai-rpg-game/
    web/
    worker/
    shared/
    docs/
```

Then implement, in this exact order:

```text
1. GameState TypeScript interfaces
2. Character Creation UI
3. Game Screen UI
4. Zustand game store
5. Local deterministic game engine
6. LocalStorage save/load
7. Cloudflare Worker
8. AI provider
9. Prompt + JSON schema
10. Full turn pipeline
```

This document should be treated as the initial master blueprint. As development begins, split it into smaller documents:

```text
docs/
├── 00-master-plan.md
├── 01-game-design.md
├── 02-architecture.md
├── 03-game-state.md
├── 04-ai-prompt.md
├── 05-memory-system.md
├── 06-api-contract.md
├── 07-world-the-last-night.md
└── 08-development-roadmap.md
```
