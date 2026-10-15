# Arquitectura de /fruit (The Bench)

Octubre 2026. Para Bruno y para el tutor (`/tutor`). Describe cómo está construido el invernadero hoy, por qué, y dónde vive cada cosa. Se actualiza cuando cambia la arquitectura. Lo que es ley de producto está en `fruit-the-bench.md`; lo que está cerrado, en `fruit-the-bench-handoff.md`.

## 1. En una frase

Un invernadero procedural en three.js que se recorre scrolleando. El scroll no mueve la página: mueve un número de 0 a 1 (`progress`), y todo lo demás (cámara, luz, hora del día, chrome DOM, ficha del caso) se deriva de ese número.

## 2. Mapa de archivos

```
app/fruit/
  page.tsx            arma los BenchCase desde content/ en el servidor
  layout.tsx          fruit.css, color scheme
  fruit.css           todo el chrome DOM

components/fruit/
  bench-app.tsx       raíz DOM: compone estado, scroll, teclado, chrome, sheet y canvas; deep links ?frame= ?case=
  use-bench-state.ts  selección, ficha, etapa, lente, visitados, URL; escribe `live`; pinta --bench y data-*
  use-bench-scroll.ts Lenis + ScrollTrigger → progress 0..1; scrollToProgress
  use-bench-keys.ts   Esc, ← →, 1..4, b/e/d
  bench-live.ts       `live`: el puente DOM → canvas
  camera-path.ts      STATIONS, SPECIMENS, spline de cámara, lensAt, splineT
  day.ts              `day`: keyframes de hora del día, evalDay, todAt
  quality.ts          tiers de calidad (dpr, buffers, sombras)
  lookdev.ts          flags por URL: flag, hasFlag, isOn, hiddenCases
  vec.ts              Vec3, vec3()
  world.ts            medidas del invernadero en metros, LAMP_POS, roofY
  build.ts            Builder y QuadBuilder: muchas piezas → un mesh
  textures.ts         texturas canvas deterministas, cache, bake a webp
  baked.ts            generado por el bake: qué texturas hay en public/fruit/tex
  glass.ts            el shader del vidrio encalado
  sharpen.ts          el efecto de nitidez para el composer
  types.ts            BenchCase, BenchStory, BenchCopy
  chrome.tsx sheet.tsx door.tsx fallback.tsx loader.tsx cursor.tsx    piezas DOM (prefijo Fruit…)
  atmosphere.tsx      Sky, Trees, Shafts, Dust
  props.tsx           bandejas, almácigos, cajones, regaderas, manguera, etiquetas
  scene.tsx           el Canvas y la lista de lo que hay adentro (World)
  scene/
    camera-rig.tsx    la cámara sobre el spline
    day-rig.tsx       evalúa `day`, mueve el sol, niebla, hemisferio
    shadow-rig.tsx    congela el shadow map cuando nada se mueve
    shadows.ts        el "buzón" requestShadowUpdate / consumeShadowUpdate
    focus-rig.tsx     foco del DOF y posición del tag DOM
    post.tsx          AO, DOF, bloom, tone mapping, viñeta, sharpen, grano
    quality-rig.tsx   PerformanceMonitor → tier, dpr
    perf-rig.tsx      overlay ?perf
    reflections.tsx   environment map renderizado una vez
    warmup.tsx        compila shaders y recién después muestra la sala
    error-boundary.tsx
  greenhouse.tsx      la lista de piezas del edificio, con un flag ?off= por pieza
  greenhouse/
    frame-geometry.ts pane-geometry.ts masonry-geometry.ts bench-geometry.ts vent.ts   geometría
    frame.tsx panes.tsx masonry.tsx benches.tsx floor.tsx end-door.tsx lantern.tsx entrance-leaves.tsx cut-line.tsx   piezas
  specimens/
    index.tsx         qué componente dibuja cada caso, y los eventos de puntero
    shared.tsx        useSpecimen, Rim, bladeGeometry, openable, hinge…
    bucked.tsx devias.tsx imperio.tsx coopef.tsx
```

Convención: lo que es DOM lleva prefijo `Fruit…` (`FruitChrome`); lo 3D no (`Greenhouse`). Todo archivo sigue el estándar de secciones de `CLAUDE.md`.

## 3. Las dos capas y el puente

```
   DOM (React)                              Canvas (R3F, 60 fps)
   ───────────────────────                  ──────────────────────────────
   BenchApp (estado React)                  FruitScene
     ├─ FruitChrome (índice, lentes, HUD)      ├─ QualityRig   (tiers de calidad)
     ├─ FruitSheet  (ficha, 5 etapas)          ├─ DayRig       (hora del día → `day`)
     ├─ FruitDoor, FruitCursor, FruitLoader    ├─ CameraRig    (spline + yaw + sheet)
     └─ useBenchScroll (Lenis + ScrollTrigger) ├─ Greenhouse, Props, Specimens, Sky, Trees, Shafts, Dust
                                               ├─ Post (AO, DOF, bloom, tone, sharpen, grain)
              │                                └─ Warmup (compila shaders, luego fade-in)
              │  escribe                                    ▲  lee en cada useFrame
              ▼                                             │
        ┌──────────────────────────────────────────────────────┐
        │  live  (bench-live.ts)  progress, selectedId, sheetOpen, lens, lensLocked, reading, step, reduce, hoverId
        │  day   (day.ts)         sunDir, sunColor, fog, milk, lamp, night… evaluado una vez por frame
        └──────────────────────────────────────────────────────┘
```

**Por qué dos singletons mutables y no estado de React.** El canvas corre a 60 fps. Si cada scroll disparara `setState`, React re-renderizaría el árbol entero 60 veces por segundo. En cambio, el DOM escribe en `live` (un objeto plano) y cada componente 3D lo lee dentro de su `useFrame`. React solo se entera de lo que necesita pintar en el DOM (lente activa, ficha abierta, caso seleccionado). `day` es el mismo truco para la luz: `DayRig` lo evalúa una vez por frame con prioridad `-2` (corre antes que todos) y el resto lo lee.

Regla: cada campo de `live` se escribe desde un solo lugar (`bench-app.tsx` o `use-bench-scroll.ts`) y se lee en cualquier `useFrame`. `day` lo escribe solo `evalDay()` desde `DayRig`.

## 4. El recorrido: de la rueda del mouse a la cámara

```
wheel/touch → Lenis (scroll suave, lerp 0.075)
           → ScrollTrigger sobre .fruit-pin (scrub 1)
           → self.progress 0..1
           → live.progress, live.velocity
           → BenchApp.applyProgress()
                ├─ paintRoot(): CSS var --bench, data-lens, data-hero, data-door, HUD
                ├─ lensAt(progress) salvo que la lente esté bloqueada
                └─ markVisited(casesVisitedAt(progress))
```

Archivos: `use-bench-scroll.ts` (Lenis + GSAP ticker + ScrollTrigger, y `scrollToProgress` para ir a una estación), `camera-path.ts` (el contrato).

**`STATIONS`** (`camera-path.ts`): seis paradas con su `progress` fijo (`enter 0`, `bucked-up 0.08`, `devias 0.42`, `imperio 0.64`, `coopef 0.84`, `door 1`). Estas keys están cerradas por el handoff: el HUD, los frames de lookdev (`?frame=01..04`) y las URLs `?case=` dependen de ellas.

**`splineT(progress)`** convierte `progress` (no lineal entre estaciones) en el parámetro `t` uniforme de dos curvas Catmull-Rom: `CAMERA_POS` (dónde está la cámara) y `CAMERA_LOOK` (a dónde mira). Así cada estación cae exactamente en un nodo de la curva.

**`CameraRig`** (`scene.tsx`): cada frame amortigua `t` hacia `splineT(live.progress)` con `damp` (factor 4.2), suma un yaw chico hacia el espécimen seleccionado, y si la ficha está abierta se corre al pasillo y encuadra el espécimen en el 45 % libre de la pantalla. Con reduced-motion, salta a la estación más cercana sin dolly.

## 5. El día: la luz sigue la caminata

`day.ts` tiene cuatro keyframes de "hora del día" (`tod`): `0` mañana (Negocio), `1` mediodía (Ingeniería), `1.5` atardecer, `2` noche (Entrega). Cada keyframe fija sol, cielo, niebla, color de la cal del vidrio, intensidad de rayos y polvo, lámpara.

- `todAt(progress)` mapea la caminata a `tod` con tres `smoothstep`: el paseo es un día entero.
- `evalDay(tod)` interpola entre keyframes y escribe el resultado en `day`.
- Hacer click en una lente fija `live.lensLocked = true` y `DayRig` apunta a `LENS_TOD[lens]` en vez de seguir el scroll: toda la sala cambia de luz y queda así hasta recargar. Esa "luz total que cambia" es una decisión de Bruno.

`DayRig` además mueve la `directionalLight` (sol) para que su target siga a la cámara (`camera.z + 5`), y ajusta `fog`, `clearColor`, `environmentIntensity`, `hemisphereLight`.

## 6. La escena (`scene.tsx`)

Orden de montaje dentro del `Canvas`, y qué hace cada rig:

| Componente | Qué hace | Lee / escribe |
| --- | --- | --- |
| `FrameRateRig` | El Canvas tiene `frameloop="never"`; este rig llama `advance()` en cada animation frame mientras pasa algo (scroll, puntero, teclado, o algo que se mueve y pidió sombras) y solo 30 veces por segundo en reposo. Siembra el reloj en el primer tick para que el primer `dt` no sea enorme. | `scene/activity.ts` |
| `QualityRig` | `PerformanceMonitor` de drei: baja o sube el tier cuando los fps caen o se recuperan. Aplica el `dpr`. Se desmonta en reposo, porque el reposo es lento a propósito. | `quality.ts` |
| `PerfRig` | Solo con `?perf`: overlay con fps, ms de CPU, draw calls, triángulos, programs, tier, dpr y cuántos shadow maps se renderizaron (y quién los pidió). | — |
| `DayRig` | Evalúa `day` (prioridad `-2`), mueve el sol, niebla, hemisferio, tamaño del shadow map por tier. Avisa a `shadows.ts` cuando el sol se movió. | escribe `day` |
| `ShadowRig` | Prioridad `-1`: `gl.shadowMap.autoUpdate = false`; pide un render del shadow map solo si la cámara se movió o alguien llamó `requestShadowUpdate` (el sol, un espécimen que madura o gira, un cambio de tier). Quieto, cero renders de sombra. | lee `shadows.ts` |
| `Reflections` | `Environment` renderizado una sola vez (`frames={1}`): una sala cálida para reflejos y para el vidrio. | — |
| `CameraRig` | Ver §4. | lee `live` |
| `Sky`, `Trees` | Cúpula con shader de cielo que sigue a la cámara; 27 cartas de árboles con alpha afuera del vidrio. | lee `day` |
| `Greenhouse` | El edificio (§7). | lee `day`, `live` |
| `Props` | Bandejas, almácigos, cajones, regaderas, manguera, etiquetas. Todo fusionado en pocos draw calls. | — |
| `Specimens` | Las cuatro frutas (§9) con sus eventos de puntero. | lee `live` |
| `Shafts`, `Dust` | Rayos de luz (quads orientados al sol) y 1300 motas aditivas. | lee `day` |
| `Post` | `EffectComposer`: N8AO, DepthOfField (foco en el espécimen), Bloom (solo fuentes reales de luz), ToneMapping neutral, Vignette, Sharpen propio y Noise (estos dos fusionados en un solo pass). El canvas no pide antialias: el MSAA (2x en desktop) lo hace el composer. | lee tier |
| `Warmup` | Espera las texturas, `compileAsync` contra un render target HDR, renderiza 3 frames ocultos y recién entonces deja entrar (`frameloop` pasa de `never` a `always`, el canvas hace fade-in). | — |

**`FocusRig`** (dentro de `Post`): mueve el foco del DOF hacia el espécimen seleccionado o el más cercano, y proyecta su posición para ubicar el tag DOM (`--tag-x/--tag-y`), ocultándolo si un poste o pared lo tapa (raycast cada 6 frames contra meshes marcadas `userData.occluder`).

**Tiers** (`quality.ts`): `0` (dpr 1.5, vidrio 512, AO a media resolución, DOF 1.1, sombras 2048) → `1` (dpr 1.25, vidrio 384) → `2` (dpr 1, vidrio 320, sin DOF, sombras 1024). El tier 0 era dpr 2, vidrio 768 y AO completa; se bajó el 15 oct 2026 porque una GTX no lo sostenía. Los teléfonos arrancan en tier 1 y sin sombras ni DOF. Un `useSyncExternalStore` minúsculo publica el tier a quien lo necesita.

## 7. El invernadero (`greenhouse.tsx`, `greenhouse/`, `build.ts`, `world.ts`, `glass.ts`)

Todo es geometría procedural. No hay modelos externos ni Blender. Las medidas viven en `world.ts` (1 unidad = 1 metro: pasillo de 5.9 m de ancho, 20 m de largo, alero a 2.8 m, cumbrera a 4.35 m, bancos a 0.86 m).

- **`Builder`** (`build.ts`) acumula cajas, vigas (`beam` entre dos puntos) y geometrías sueltas con una transformación, y las fusiona con `mergeGeometries` en un solo mesh. Un draw call para toda la estructura metálica; otro para los bancos; otro para los ladrillos. Con `colors = true` guarda un tinte por pieza en `vertexColors` para variar la madera.
- **`QuadBuilder`** genera quads planos con UV 0..1 y un `aSeed` por quad: con eso el vidrio sabe dónde empieza y termina cada paño.
- **Piezas** (una por archivo en `greenhouse/`, la geometría pesada en `*-geometry.ts`): `Frame` (postes, cabios, ménsulas extruidas, tensores, cumbrera, cresta, hastiales, ventilación abierta), `Panes` (paños laterales, techo solapado, hastiales), `Masonry` (zócalo y muro del fondo con ladrillo y cal), `Benches`, `Floor` (espina de pez en el pasillo, grava a los lados, suelo exterior con bump), `EntranceLeaves` (las dos hojas de la entrada), `EndDoor` (puerta de madera con vidrios emisivos, luz que se cuela por el marco, abanico en el piso y spot), `Lantern` (farol sobre el banco, se enciende de noche), `CutLine` (línea de corte punteada en rosa que aparece en la lente Ingeniería).
- **El vidrio** (`glass.ts`) es un `ShaderMaterial` propio: cal pintada a brochazos (fbm por posición de mundo), masilla en los bordes, algas abajo, sombra del follaje exterior (textura), y de noche espejo oscuro con el reflejo del farol. `syncGlass()` copia cada frame lo que necesita de `day`.

## 8. Texturas (`textures.ts`, `baked.ts`, `scripts/bake-fruit-textures.mjs`)

Todas las texturas son canvas 2D generados por código con un RNG determinista (`rng(seed)`): ladrillo, espina de pez, madera, tierra, musgo, bump, fibra, arcilla, hoja, follaje, árboles.

Generarlas cuesta cientos de ms en el hilo principal, así que:

1. `?bake=1` las genera y las deja en `window.__bake` como data URLs.
2. `scripts/bake-fruit-textures.mjs` abre esa URL con Playwright, las guarda en `public/fruit/tex/*.webp` y escribe `baked.ts` con la lista.
3. En producción `once(key, make)` ve que `key` está en `BAKED` y la carga con `ImageBitmapLoader` (decodifica fuera del hilo principal). Si el webp falla, cae al generador. `texturesReady()` es la promesa que `Warmup` espera.

Al cambiar un generador hay que volver a correr el bake.

## 9. Los especímenes (`specimens/`)

Cada fruta es un componente con su geometría procedural y comparte `useSpecimen(id, position)` (`shared.tsx`), que cada frame calcula:

- `ripen` 0..2: sube con la cercanía de la cámara; la ficha abierta suma una etapa; leer el caso lo lleva a 2.
- `open` 0..1: al leer el caso, el espécimen se abre un poco más por etapa de crecimiento (`live.step`).
- `spin` (inercia con la velocidad del scroll), `lean` (fototropismo hacia la cámara cuando está seleccionado), `lift` (se eleva al seleccionar).

Para "abrirse" sin duplicar materiales, `openable(parts, pose)` fusiona las partes cerradas y guarda la pose abierta como **morph target 0**; el componente anima `morphTargetInfluences[0] = open`. `hinge()` rota una parte alrededor de un pivote para construir esa pose.

| Espécimen | Forma | Material | Cómo se abre |
| --- | --- | --- | --- |
| Bucked Up | Fruta de vidrio lima con núcleo iluminado y semillas | `MeshTransmissionMaterial` (drei): re-renderiza la sala a un buffer propio cada frame; se apaga cuando sale del frustum. En móvil, `meshPhysicalMaterial` con transmisión. | Dos mitades de torno con tapa plana, bisagra en la base |
| Devias | Calabaza de arcilla acostillada | `meshPhysicalMaterial` con sheen, textura de arcilla y bump | Cinco gajos paramétricos que se pelan hacia afuera |
| Imperio Tickets | Vaina fibrosa alta | `meshStandardMaterial` con fibra como bump | Dos valvas rotan; sale la seda y las semillas |
| COOPEF Gym | Enredadera sobre un enrejado | Hojas, pétalos y centros en `InstancedMesh` | Crece a lo largo de las curvas (`setDrawRange`) y florece |

`Rim` es una `pointLight` rosa por espécimen que se enciende al seleccionar o hacer hover.

## 10. El sheet y el chrome (DOM)

- `FruitChrome`: header, índice THE BENCH (skip-list: primer click scrollea a la estación, segundo abre la ficha), lentes, hero con velo esmerilado, tag flotante del espécimen, HUD de progreso.
- `FruitSheet`: un `aside` con un viewport sobre una pista horizontal: la ficha y cinco etapas (Semilla, Raíces, Tallo, Flor, Fruto), construidas solo con `content/cases`. Con la ficha en modo lectura, la rueda del mouse lee la ficha en vez de caminar (`data-lenis-prevent`). Flechas izquierda/derecha cambian de etapa; Esc cierra.
- `useBenchState` es el dueño del estado: `selectedId`, `sheetOpen`, `step`, `lens` (y su bloqueo), `visited` (persistido en `sessionStorage`), y sincroniza `?case=` en la URL. `useBenchKeys` tiene los atajos. `BenchApp` solo compone y resuelve los deep links: `?frame=01..04` reproduce los cuatro estados del tablero original para capturas.
- Accesibilidad: canvas `aria-hidden`, descripción de la sala en `sr-only`, foco devuelto al botón que abrió la ficha, `inert` en los paneles no activos, atajos `1..4` en el índice y `b/e/d` en las lentes.

## 11. Arranque, fallbacks y lookdev

- `FruitLoader`: dibujo lineal del invernadero en SVG (server-rendered) que se "boceta" mientras compilan los shaders; la sala real hace fade-in encima.
- Sin WebGL: `FruitFallback` muestra uno de cuatro SVG estáticos según `progress`.
- `SceneErrorBoundary` guarda el error en `window.__benchErr` para depurar.
- Flags por URL: `?off=ao,dof,bloom,sharpen,env,sky,trees,house,props,specimens,shafts,dust` apaga capas; `?off=floor,masonry,frame,benches,glass,leaves,door,lantern,cut` apaga piezas del invernadero; `?hide=<caseId>` esconde un espécimen; `?post=0` saca el composer; `?perf` muestra el overlay de PerfRig y expone `__benchGl`, `__benchScene`, `__benchTier`, `__benchStats`; `?bake=1` genera texturas. Todos pasan por `lookdev.ts`.

## 12. Decisiones de arquitectura y por qué

1. **Contrato `progress` 0..1 con estaciones fijas.** Todo (cámara, luz, DOM, URLs, capturas) se engancha a un número. Cambiar la escena no rompe el chrome, y viceversa. Alternativa descartada: posiciones en píxeles de scroll, que dependen del alto de ventana.
2. **Singletons mutables (`live`, `day`) en vez de estado React o Zustand.** Cero re-renders por frame y cero suscripciones; el precio es disciplina: un escritor por campo. Zustand con `subscribe` habría servido igual, pero agrega una capa que no hacía falta para doce campos.
3. **DOM sobre WebGL.** Texto, botones y ficha son HTML real: accesibles, seleccionables, traducibles. El canvas solo dibuja la sala. El tag del espécimen se posiciona proyectando su posición 3D a pantalla.
4. **Todo procedural, nada horneado en Blender.** Bruno lo pidió explícito: el repo se entiende leyendo código. El costo es más geometría generada en el cliente y texturas que hay que bakear a webp para que la carga no se sienta.
5. **Un día entero en una caminata, con snap por lente.** La luz es la narrativa (Negocio = mañana, Ingeniería = mediodía, Entrega = noche). La lente da control total al visitante y queda bloqueada.
6. **Calidad adaptativa por tiers, sin tocar el look de los shaders.** Solo cambia resolución, buffers y sombras. Lo que se ve es lo mismo, más o menos nítido.
7. **Shadow map bajo demanda.** three.js redibuja las sombras en cada frame; acá solo cuando algo que proyecta sombra se movió (`scene/shadows.ts`). En reposo la GPU se ahorra una pasada completa por frame sin que cambie un píxel. El costo es disciplina: lo que mueva un caster tiene que avisar.
8. **Loop bajo demanda con tasa de reposo.** R3F renderizaría 60 veces por segundo aunque nadie toque nada. `FrameRateRig` decide cada frame: tasa completa mientras hay input o movimiento, 30 fps en reposo (el polvo y los rayos siguen fluidos; nada más se mueve). Se usa `frameloop="never"` y `advance()` en vez de `"demand"` porque con `demand` R3F cancela su rAF tras cada frame y el pedido siguiente cae un tick después: termina renderizando tick por medio.
9. **Warmup antes de mostrar.** Compilar shaders en el primer frame visible produce un tirón de un segundo; se compila contra un target HDR igual al del composer y se renderizan tres frames ocultos.

## 13. Glosario mínimo

- **useFrame**: hook de R3F que corre tu función en cada frame del render loop. Prioridad negativa = corre antes.
- **damp(a, b, lambda, dt)**: mueve `a` hacia `b` de forma exponencial independiente del frame rate. Es el "lerp bueno".
- **draw call**: una orden de dibujo a la GPU. Menos es mejor; fusionar geometrías y usar instancias los reduce.
- **InstancedMesh**: una geometría dibujada N veces con matrices distintas en un solo draw call (hojas, almácigos).
- **morph target**: una segunda posición por vértice guardada en la geometría; `morphTargetInfluences` mezcla entre ambas.
- **FBO / render target**: una textura a la que se renderiza la escena en vez de la pantalla (lo usan la transmisión, el AO y el DOF).
- **dpr**: device pixel ratio. A dpr 2 se dibujan cuatro veces más píxeles que a dpr 1.
- **MSAA**: antialiasing por multimuestreo. 4x cuadruplica el costo de rasterizar bordes.
- **transmission**: vidrio físico que refracta lo que hay detrás; necesita renderizar la escena a un buffer primero.
