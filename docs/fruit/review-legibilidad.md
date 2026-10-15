# Revisión de legibilidad de /fruit, y plan de refactor y performance

15 oct 2026. Para Bruno. Diagnóstico del 15 oct por la mañana; abajo queda tal cual se escribió. Lo aprobado se ejecutó el mismo día: ver "Resultado".

## Resultado (15 oct, tarde)

**Hecho.** Etapas 1 a 5 del refactor, el arreglo de `onFail` y la parte invisible de performance (A y B menos un ítem). El look y el comportamiento no cambiaron: capturas de `?frame=01..04` antes y después comparadas píxel a píxel quedan dentro del ruido entre dos capturas del mismo código (el vidrio de Bucked tiene distorsión temporal y el grano es aleatorio). `tsc` y `pnpm build` limpios. Mismos 63 shader programs antes y después.

**Estructura nueva.** `scene/` (ocho rigs, cada uno en su archivo), `greenhouse/` (geometría en `*-geometry.ts`, una pieza por archivo, la ventilación compartida en `vent.ts`), `use-bench-state.ts` y `use-bench-keys.ts` sacados de `bench-app.tsx`, `lookdev.ts` (una sola implementación de los flags) y `vec.ts`. Mapa completo en `ARCHITECTURE.md` §2.

**Performance aplicada (invisible, verificada por diff).**
- Shadow map bajo demanda (`scene/shadows.ts` + `ShadowRig`): quieto, cero renders de sombra por frame; en el frame 04 los draw calls por frame pasan de 154 a 123 y los triángulos de 108k a 45k una vez que todo se asienta (unos 3 s, lo que tardan los especímenes en madurar). Caminando se comporta igual que antes.
- Sin sombra proyectada en almácigos, etiquetas, flores de COOPEF y la flor seca de Imperio.
- `antialias: false` en el canvas (el MSAA 4x lo hace el composer): sin diferencia visible, una resolución de framebuffer menos por frame.
- Overlay `?perf`: fps, ms de CPU, draw calls, triángulos, programs, tier, dpr y shadow maps renderizados por intervalo, con quién los pidió. También `window.__benchStats`.
- Las allocaciones por frame de `atmosphere.tsx` se fueron en el refactor.

**Descartado, con motivo.**
- Fusionar Sharpen con Noise en un pass: ahorra un pass pero cambia los bordes (el recorte ampliado muestra la imagen más blanda). Queda como decisión de look, no como optimización.
- Hornear el ruido del vidrio en una textura: el shader cuesta menos de lo que estimé (32 hashes por píxel es poco para una GTX) y la equivalencia no sería exacta. No vale el riesgo.

**Recortes visibles, aplicados con tu OK (15 oct, noche).** Cada uno vive en una constante o en un valor de tier, para revertirlo solo.
- Tasa de reposo: `scene/frame-rate-rig.tsx` (`IDLE_FPS = 30`) y `scene/activity.ts`. Medido en headless a 75 Hz: 55 a 72 fps mientras pasa algo (asentarse, mouse, scroll), 25 fps quieto (30 en un monitor de 60 Hz). Es el que más baja la GPU en reposo: la mitad de frames, y cada frame sin shadow map.
- `quality.ts` tier 0: dpr 1.5 (era 2), transmisión de Bucked 512 (era 768), AO a media resolución (era completa). Tier 1: dpr 1.25, transmisión 384.
- `scene/post.tsx`: `MSAA_SAMPLES = 2` (era 4).
- Diff contra la versión solo-invisible: 0.4 % de píxeles en los frames 01 y 04, 5 a 7 % en 02 y 03 (vidrio incluido). En el recorte ampliado de las barras del techo la diferencia entre MSAA 4x y 2x es apenas perceptible. En headless el dpr es 1, así que el cambio de dpr no está medido en capturas: en tu monitor se ve en `?perf`.
- `scripts/fruit-shots.mjs` y `scripts/fruit-diff.mjs` quedan en el repo para repetir cualquier antes/después.

---

## Diagnóstico original (15 oct, mañana)

## Veredicto en cinco líneas

El código está bien pensado y bastante bien comentado en las decisiones grandes (singletons `live` y `day`, warmup, texturas bakeadas, `openable` con morph targets). Lo que lo hace difícil de leer para otro dev es lo pequeño y repetido: nombres de una letra (`b`, `q`, `s`, `k`, `t`, `m`, `V`), listas largas de números mágicos sin unidad, nueve componentes en un solo archivo (`scene.tsx`), el mismo bloque de "cerrar ficha" copiado tres veces en `bench-app.tsx`, y cuatro copias del helper de flags por URL. Ningún archivo es ilegible; varios piden diez minutos de contexto que no deberían pedir.

## Lo que está bien y no hay que tocar

- La separación DOM / canvas con `live` y `day` como puente. Es la mejor decisión del proyecto y está explicada en los comentarios de `bench-live.ts` y `day.ts`.
- `camera-path.ts`: el contrato de estaciones y el spline están claros y cortos.
- `use-bench-scroll.ts`: una sola responsabilidad, limpio.
- `quality.ts`, `world.ts`, `types.ts`, `fallback.tsx`, `loader.tsx`, `cursor.tsx`, `door.tsx`: cortos y entendibles.
- Los comentarios de cabecera de cada espécimen ("Glass fruit, lime. A lit core and five seeds…") son exactamente el tono que conviene mantener.
- `useSpecimen`, `openable`, `fixNormals`, `Builder`: tienen docblock y nombre que dice lo que hacen.

## Hallazgos transversales

1. **Nombres de una letra.** `b` (Builder), `q` (QuadBuilder), `r` (rng), `s` (side), `t` (parámetro o tray), `k` (factor de damp o índice), `m/q/p/s` (scratch), `V` (Vector3), `C` (keyframes precomputados), `L/R/H/W` (constantes de forma). En GLSL es normal; en TypeScript obliga a leer hacia arriba cada vez. Propuesta: `builder`, `quads`, `random`, `side`, `tray`, `lerpK`, `scratchMatrix`, `vec3`, `KEYFRAMES`, `POD_LENGTH`…
2. **Números mágicos sin unidad.** `greenhouse.tsx` es el caso extremo: `b.box(0.13, 0.11, LENGTH + 0.3, [s * HALF, EAVE, LENGTH / 2])` con un comentario cada cuatro líneas. Propuesta: comentario por línea con qué pieza es y su medida ("gutter beam, 13 × 11 cm"), y constantes para lo que se repite (`GLAZING_BAR`, `TILE_WOOD = 0.6`).
3. **Código duplicado.**
   - Cerrar la ficha: el mismo bloque de seis líneas en `onUserScroll`, `closeSheet` y parte en `openSheet` (`bench-app.tsx:125-134`, `139-148`, `151-166`).
   - `setSelectedId(id); live.selectedId = id` seis veces.
   - Bloquear lente: dos veces (teclado y click).
   - `nearestStation` / `nearestCaseStation`: el mismo loop dos veces (`camera-path.ts:44-68`).
   - `const V = (x, y, z) => new THREE.Vector3(...)` en `greenhouse.tsx:34` y `props.tsx:10`.
   - `type Vec3` en `camera-path.ts:70` y `specimens/shared.tsx:9`.
   - Flags por URL: `flag()`/`fx()` en `scene.tsx:22-29`, `on()` en `greenhouse.tsx:558-562`, `hide` en `specimens/index.tsx:18`, `baking` en `textures.ts:10`. Cuatro implementaciones de lo mismo.
   - La geometría de la ventilación (bisagra y rotación) calculada dos veces: `greenhouse.tsx:116-123` y `188-191`.
4. **Archivos que hacen demasiado.** `scene.tsx` (433 líneas) tiene `SceneErrorBoundary`, `CameraRig`, `DayRig`, `Reflections`, `FocusRig`, `Post`, `QualityRig`, `Warmup`, `World` y `FruitScene`. `bench-app.tsx` (322) mezcla estado, sincronización de URL, teclado y render.
5. **Sin secciones consistentes.** Tres archivos usan `/* ---- nombre */`, el resto nada. Tu estándar (`// ===== Sección =====`) todavía no existe en ningún archivo.
6. **`function` en vez de `const`.** Todos los componentes y helpers son `function name()`. Pasan a `const name = () =>`.
7. **Shadowing y variables con doble vida.** En `bucked.tsx:84` y `:92` hay dos `const open` distintos en el mismo `useFrame` (uno es `state.open`, el otro un `smoothstep` de `ripen`). En `devias.tsx` hay una función `body()` y un ref `bodyMesh`. En `imperio.tsx` los refs de las valvas se llaman `a` y `b`.
8. **Allocaciones dentro de `useFrame`.** `new THREE.Color('#5d5a45')` en `atmosphere.tsx:96` y `new THREE.Color('#ffc98e')` en `:266`, cada frame. Es estilo (va contra "nada se aloca en el frame") y además es basura para el GC.
9. **Estilos inline en el chrome.** `style={{ color: 'var(--fg-2)' }}` y `style={{ display: 'contents' }}` en `chrome.tsx:59,107,108`. Van a clases en `fruit.css`.

## Bugs y código muerto encontrados de paso

- **`onFail` nunca se llama.** `FruitScene` recibe `onFail` y hace `void onFail` (`scene.tsx:425`). `SceneErrorBoundary` atrapa el error y renderiza `null`, pero no avisa. Resultado: si un shader falla, la pantalla queda en blanco y el fallback SVG nunca aparece. Arreglo: el boundary recibe `onError` y `FruitScene` lo conecta a `onFail`. Es un cambio de comportamiento solo en el caso de error; lo marco aparte para que lo apruebes.
- **Exports muertos.** `progressToScroll` y `scrollToProgress` en `camera-path.ts:111-118` no se usan en ningún lado (el `scrollToProgress` que sí se usa es el del hook, y hace lo inverso: mismo nombre, semántica opuesta). Se borran.
- **`velocity` en `onProgress`.** El hook pasa `velocity` como segundo argumento y `applyProgress` lo ignora; `live.velocity` ya lo escribe el hook. Se saca del tipo.
- **`mobile` se recalcula en cada render** de `FruitScene` con `matchMedia` (`scene.tsx:393`). No es bug, pero va a un `useState` inicial.

## Por archivo

| Archivo | Claridad (1 a 5) | Qué cuesta leer | Qué haría |
| --- | --- | --- | --- |
| `bench-app.tsx` | 3 | Estado + URL + teclado + render en un componente; bloques repetidos | Extraer `useBenchState` (selección, ficha, lente, visitados, URL) y `useBenchKeys`; `BenchApp` queda en ~120 líneas de composición |
| `scene.tsx` | 2 | Nueve componentes; hay que scrollear para saber qué corre primero | Partir en `scene/` con `camera-rig.tsx`, `day-rig.tsx`, `focus-rig.tsx`, `post.tsx`, `quality-rig.tsx`, `warmup.tsx`, `error-boundary.tsx`; `scene.tsx` queda como la composición del `Canvas` y el `World` |
| `greenhouse.tsx` | 2 | 260 líneas de `b.box(...)` con números sin unidad; la ventilación calculada dos veces | Comentario por pieza con medida, constantes para medidas repetidas, helper `ventTransform()`, partir en `greenhouse/` (`frame.ts`, `glass-panes.ts`, `masonry.ts`, `benches.ts`, componentes) si aprobás el split |
| `props.tsx` | 3 | `Flats` con loops anidados y letras (`a`, `b`, `c`, `lx`, `lz`); `V` duplicado | Nombres (`row`, `col`, `localX`), `vec3` compartido |
| `textures.ts` | 4 | `once()` es la pieza clave y el nombre esconde que también carga el webp | Renombrar a `cachedTexture()` o documentarlo arriba; secciones |
| `glass.ts` | 3 | Shader denso con `P`, `e`, `L`, `d`, `H` | Comentario por bloque (brochazos, masilla, algas, follaje, noche); nombres en GLSL quedan, es la convención |
| `atmosphere.tsx` | 3 | `Sky` declara el ref después de usarlo; GLSL inline sin `/* glsl */`; colores alocados por frame | Orden, tags, `scratchColor` |
| `day.ts` | 4 | `C` y `KEYS` | `KEYFRAMES` y `KEYFRAMES_RAW`; una línea sobre quién escribe `day` ya está |
| `camera-path.ts` | 4 | Dos loops iguales; exports muertos | Un `nearest(list, progress)`; borrar muertos |
| `use-bench-scroll.ts` | 4 | Nombre `scrollToProgress` choca con el muerto de camera-path | Queda; se borra el otro |
| `build.ts` | 4 | `M Q E S P` scratch | `scratchMatrix`… ; secciones |
| `specimens/shared.tsx` | 4 | Bien documentado; `Vec3` duplicado | Importar `Vec3` de un solo lugar |
| `specimens/bucked.tsx` | 3 | Doble `open`; `glass as never`; `ref={r === 0 ? seam : undefined}` | `openAmount` vs `petalOpen`; tipar el ref de `MeshTransmissionMaterial`; el seam con ref en un map explícito |
| `specimens/devias.tsx` | 3 | `body()` / `bodyMesh` / `solid()` | `wedgeSurface()`, `splitBody()`, `bodyRef` |
| `specimens/imperio.tsx` | 3 | refs `a`, `b` | `leftValve`, `rightValve` |
| `specimens/coopef.tsx` | 3 | `tmp` scratch; el truco de `key` para no recomputar instancias no tiene comentario | `scratch`, comentario del early-return |
| `sheet.tsx` | 4 | Los `n === 1..5` en línea | Queda; un comentario por etapa |
| `chrome.tsx` | 4 | Inline styles | Clases |
| `quality.ts` | 4 | `glass` no dice que es la resolución del buffer de transmisión | `transmissionRes` |
| resto | 5 | — | Solo secciones y `const` |

## Propuesta de estructura de archivos

Solo si aprobás el split. Si preferís mantener los archivos como están, el refactor aplica igual dentro de cada uno.

```
components/fruit/
  bench-app.tsx            composición DOM (chrome, sheet, scene, cursor)
  use-bench-state.ts       selección, ficha, lente, visitados, URL   (nuevo, sale de bench-app)
  use-bench-keys.ts        atajos de teclado                          (nuevo, sale de bench-app)
  use-bench-scroll.ts
  bench-live.ts
  lookdev.ts               flag(), isOn(), hiddenCases()              (nuevo, reemplaza 4 copias)
  vec.ts                   type Vec3, vec3()                           (nuevo, reemplaza 2 copias)
  scene.tsx                Canvas + World
  scene/
    camera-rig.tsx  day-rig.tsx  focus-rig.tsx  post.tsx  quality-rig.tsx  warmup.tsx  error-boundary.tsx  reflections.tsx
  greenhouse.tsx           composición de piezas
  greenhouse/
    frame.ts  glass-panes.ts  masonry.ts  benches.ts  floor.tsx  end-door.tsx  lantern.tsx  entrance.tsx  cut-line.tsx
  (el resto queda donde está)
```

## Plan de refactor por etapas

Cada etapa compila (`pnpm build`) y se verifica con `/fruit?frame=01..04` antes de seguir. Ninguna cambia lo que se ve.

1. **Base**: `lookdev.ts`, `vec.ts`, borrar exports muertos, arreglar `onFail` (si lo aprobás). Riesgo bajo.
2. **Secciones y `const`** en todos los archivos, sin mover lógica. Riesgo bajo, diff grande.
3. **Nombres y comentarios con unidad**: hallazgos 1, 2, 7, 8, 9. Riesgo bajo.
4. **Dedupe en `bench-app.tsx`**: `useBenchState`, `useBenchKeys`. Riesgo medio (es la lógica de interacción; se prueba click, doble click, Esc, flechas, scroll con ficha abierta, `?case=`, `?frame=`).
5. **Split de `scene.tsx` y `greenhouse.tsx`**. Riesgo bajo (solo mover), diff grande.
6. **`ARCHITECTURE.md`** se actualiza con las rutas nuevas.

## Performance: diagnóstico

Corrijo algo que te dije en la primera pregunta: **solo Bucked usa `MeshTransmissionMaterial`**, no los cuatro. Devias es arcilla, Imperio fibra y COOPEF hojas instanciadas. Es un solo re-render de la sala por frame, y ya se apaga cuando la fruta sale del frustum.

Por qué la GPU va al palo aun quieto: el loop corre siempre (`frameloop="always"` después del warmup) y cada frame hace, a dpr 2 con MSAA 4x:

| Costo por frame | Dónde | Peso estimado en una GTX |
| --- | --- | --- |
| Render principal a dpr 2 + MSAA 4x | `Canvas` + `EffectComposer multisampling={4}` | el mayor: 4 muestras de 4 veces los píxeles |
| Shadow map 2048 re-renderizado cada frame (el sol se mueve con el scroll) con casi todo como caster, incluidos cientos de almácigos y hojas instanciadas | `DayRig`, `castShadow` por todos lados | alto |
| Vidrio: shader con dos fbm de 4 octavas por píxel, doble cara, transparente, cubriendo gran parte de la pantalla | `glass.ts` | alto |
| N8AO full-res, calidad `medium` | `Post` | medio-alto |
| Transmisión de Bucked a 768 px (cuando está en cuadro) | `bucked.tsx` | medio |
| DepthOfField + Bloom mipmap + pass de Sharpen aparte + Noise + Vignette | `Post` | medio |
| Polvo (1300 puntos aditivos) y rayos (14 quads aditivos) | `atmosphere.tsx` | bajo |

## Performance: plan

**A. Medir (invisible).** Con `?perf` mostrar en pantalla fps, ms de frame, draw calls, triángulos y tier (`gl.info` + `Stats` de drei). Hoy `?perf` solo expone objetos en `window`. Con esto vos mismo ves el antes/después de cada paso.

**B. Invisibles (no cambian ni un píxel).**

1. Shadow map solo cuando cambia algo: `shadow.autoUpdate = false` y `needsUpdate = true` cuando el sol se movió más de un umbral o el target avanzó más de medio metro. Quieto: cero renders de sombra.
2. Dejar de proyectar sombra lo que no se nota: almácigos instanciados, hojas de COOPEF, cresta de la cumbrera, etiquetas. Las sombras que se ven (estructura, bancos, frutas) quedan.
3. Fusionar el pass de Sharpen con Noise en un solo `EffectPass` (el orden dentro del pass se respeta, así que el resultado es idéntico).
4. Sacar las allocaciones por frame y los `find` por frame (CPU, no GPU, pero suma en el hilo principal).
5. Hornear el ruido del vidrio (`strokes` y `patches`) en una textura precomputada en vez de 8 llamadas de `vnoise` por píxel. El patrón depende solo de la posición de mundo y de `aSeed`, así que se ve igual. Lo verifico con capturas A/B antes de dejarlo.

**C. Con tu OK (cambian algo, poco).**

6. Throttle en reposo: cuando no hay scroll, hover ni transiciones durante un segundo, renderizar a 30 fps. Lo único que se mueve en reposo es el polvo y el parpadeo de los rayos; a 30 fps se siguen viendo fluidos. Es el que más baja la GPU quieta.
7. `dpr` tope 1.5 en tier 0 (hoy 2). En un monitor 1080p sin HiDPI no cambia nada porque el dpr ya es 1; en uno HiDPI se nota apenas.
8. MSAA 2x en vez de 4x. El sharpen y el DOF esconden la diferencia.
9. N8AO a media resolución en tier 0 (hoy solo en tiers 1 y 2).
10. Transmisión de Bucked a 512 en tier 0 (hoy 768).

Te propongo: hago A y B, te paso números, y elegís cuáles de C probar.

## Lo que necesito de vos

1. OK al refactor (etapas 1 a 4) tal cual, o con recortes.
2. ¿Split de archivos (etapa 5) sí o no?
3. ¿Arreglo `onFail` (el fallback SVG cuando falla el canvas)?
4. OK a performance A y B.
