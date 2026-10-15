# osella — project instructions

Portfolio 2026 by Bruno Osella. A Next 16 app with three skins: `/dev` (professional), `/fruit` (The Bench, a three.js greenhouse you walk through by scrolling) and `/gaming`.

## Read first

- `fruit-the-bench.md` is product law for `/fruit`. `fruit-the-bench-handoff.md` lists what is closed and must not be renegotiated.
- `docs/fruit/ARCHITECTURE.md` explains how `/fruit` is built. Update it whenever the architecture changes.
- This Next.js is newer than training data. Read `node_modules/next/dist/docs/` before touching a Next API.
- three.js skills are native under `.claude/skills/threejs-*` (from `alton47/threejs-skills`). `.agents/skills/` is where their installer writes them (`skills-lock.json`); after an update, re-copy with `cp -r .agents/skills/threejs-* .claude/skills/`. See "three.js skills" below for which ones apply to this repo.

## three.js skills: what applies here

They are generic vanilla-three references. This repo wins when they disagree.

| Skill | Use for | Notes for this repo |
| --- | --- | --- |
| `threejs-react` (+ FIBER.md) | Canvas props, `useFrame` priorities, `useThree`, events, `frameloop` | Primary reference for everything in `scene.tsx` and the rigs |
| `threejs-performance` (+ PROFILING.md) | `gl.info`, Stats, instancing, merging, disposal, dpr caps | `frameloop="demand"` does not fit: dust and shafts are time-driven |
| `threejs-shaders` (+ GLSL.md) | ShaderMaterial, uniforms, value noise / fbm, fresnel, `onBeforeCompile`, shader chunks | `glass.ts`, `atmosphere.tsx`, `sharpen.ts` follow these patterns |
| `threejs-lighting` (+ SHADOWS.md) | Light types, shadow camera bounds, bias, `shadowMap.autoUpdate = false` for static frames | Repo uses `PCFShadowMap` on purpose (three 0.186 dropped PCFSoft; see `scene.tsx`). `useLegacyLights` no longer exists |
| `threejs-materials` (+ MAPS.md) | Standard/Physical props, colour spaces per map, transmission, sheen, clearcoat | Textures are canvas-generated, not loaded; colour space is set in `textures.ts` |
| `threejs-postprocessing` | Effect list and pmndrs usage | Repo uses `@react-three/postprocessing` (pmndrs), not `three/addons` EffectComposer. `OutputPass` advice does not apply |
| `threejs-geometry` | BufferGeometry, attributes, merging, bounding spheres, disposal | `build.ts`, `specimens/shared.tsx` |
| `threejs-camera` | PerspectiveCamera, fov, near/far ratio | No OrbitControls here: the camera follows a spline in `CameraRig` |
| `threejs-animation` | Morph targets, GSAP | Repo animates morph targets by hand in `useFrame`; GSAP is only the ScrollTrigger ticker |
| `threejs-core` | Renderer flags, tone mapping names, shadow map types | R3F creates the renderer; tone mapping is the NEUTRAL effect in `Post`, not ACES |
| `threejs-loaders`, `threejs-audio`, `threejs-physics`, `threejs-xr` | Not used by `/fruit` | Only if a new feature needs them |

## Roles in this repo

- `web3d-dev` agent (`.claude/agents/web3d-dev.md`): 3D web development, UX and interface work on `/fruit`.
- `/tutor` skill (`.claude/skills/tutor/SKILL.md`): explains three.js and the `/fruit` architecture to Bruno, in Spanish.

## Hard rules (from the handoff)

- Never import `three`, `@react-three/*`, `gsap` or `lenis` outside `/fruit`.
- Copy comes only from `content/`. Do not invent copy.
- Do not change the `STATIONS` progress keys in `components/fruit/camera-path.ts`.
- DOM over WebGL: no text baked into the canvas.
- Do not touch `/dev` or `/gaming` unless asked.

## Writing standard

Applies to `components/fruit/**` and `app/fruit/**`. Bruno wants to read and eventually own this code, so optimise for a second developer reading it cold.

### File layout

Every file follows this order. Sections are marked with `// ===== Name =====`. Omit a section when it is empty; never reorder.

1. `'use client'` when needed.
2. `// ===== External modules =====` — packages (react, three, drei, next…).
3. `// ===== Internal modules =====` — `@/…` and relative imports, `import type` included.
4. `// ===== Types =====`
5. `// ===== Constants =====` — module-level constants. Each gets a one-line comment with what it is and its unit.
6. `// ===== Shaders =====` — GLSL as `/* glsl */` template strings, one comment per block of the shader.
7. `// ===== Helpers =====` — pure functions used below.
8. `// ===== Component: Name =====` (or `// ===== Hook: useName =====`, `// ===== Class: Name =====`, `// ===== Builder =====` for a geometry builder, `// ===== Generators =====` for a family of helpers) — one block per unit.
9. `// ===== Export =====` only when the public surface is assembled at the end (an index, a composed root).

Inside a component or hook, sub-sections use `// --- Name ---` in this order: `Refs & state`, `Derived`, `Effects`, `Methods`, `Frame` (useFrame), `Render`.

### Declarations

- Prefer `const name = () => {}` over `function name() {}` for components, hooks and helpers. Use `function` only when hoisting is genuinely needed, and say why in a comment.
- Named exports only. Default exports only in Next route files (`page.tsx`, `layout.tsx`).
- No single-letter names outside loop indices, GLSL, and scratch vectors. `b`, `q`, `s`, `t`, `k`, `m` become words.
- A magic number gets a named constant or an inline comment with its unit (metres, seconds, 0..1).
- Objects reused across frames to avoid allocation are named `scratchSomething` and live under Constants.

### Comments

- One short orienting comment at the top of each file: what it draws or decides, who writes it, who reads it.
- A one-liner under each section header when its purpose is not obvious from the name.
- Comments say why and what for, in English, in the existing plain voice. They do not restate the line.

### Conventions already in place (keep them)

- DOM components are prefixed `Fruit…` (`FruitChrome`, `FruitSheet`). 3D components are not (`Greenhouse`, `Props`, `Specimens`).
- `live` (`bench-live.ts`) and `day` (`day.ts`) are the two mutable singletons shared between DOM and canvas. Each field is written from one place and read anywhere inside `useFrame`.
- World units: 1 unit = 1 metre. Camera at eye height.
- Lookdev URL flags (`?off=`, `?hide=`, `?post=0`, `?perf`, `?frame=`, `?bake=1`) stay, through `components/fruit/lookdev.ts` only.
- Anything that moves a shadow caster (or the sun) calls `requestShadowUpdate` from `components/fruit/scene/shadows.ts`; the shadow map is not redrawn otherwise, and the call also keeps the loop at full rate.
- The render loop is driven by `scene/frame-rate-rig.tsx` (`frameloop="never"` + `advance`): full rate while there is input or motion, `IDLE_FPS` otherwise. Never switch the Canvas back to `always` or `demand`, and never start a second loop.
- Quality knobs live in `quality.ts` (tiers) and `scene/post.tsx` (`MSAA_SAMPLES`). Change them there, with a before/after from `scripts/fruit-shots.mjs` + `scripts/fruit-diff.mjs`.
- Nothing allocates inside `useFrame`: scratch vectors and colours live under Constants or in refs.

## Workflow Bruno asked for

- Ask before assuming. Present a diagnosis before a refactor and wait for the OK.
- Refactors change neither behaviour nor look. Say so in the commit message.
- Performance: invisible optimisations first. Visible trade-offs are proposed with before/after and wait for the OK.
- Commit only when asked.
