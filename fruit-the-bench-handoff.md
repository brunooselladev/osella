# Handoff — Fruit / The Bench · arte del invernadero

14 oct 2026 · para Claude (o quien tome el look).  
Bruno Osella. Repo: `osella`. Ruta: `/fruit`.

Leé primero `fruit-the-bench.md`. Ese doc es ley de producto. Este handoff no lo contradice: describe **qué ya corre**, **qué se ve mal**, y **qué tenés que rehacer**.

## 0. El pedido de Bruno, en sus palabras

La interacción está. El concepto es ese: un invernadero, un banco, cuatro especímenes, scroll = caminar.

El look actual **no se parece al dibujo inicial**. Son primitivas geométricas, no un invernadero, no hay ventanas, no hay criterio espacial, y los objetos no se leen como frutas ni plantas. Se ve feo, de nene. Hay que refinar el arte: invernadero de verdad, ventanas, mucho más arte y decoración, especímenes que se reconozcan como organismos.

No tocar `/dev` ni `/gaming`. No reinventar el chrome. No inventar copy.

## 1. Veredicto

| Capa | Estado | Qué hacer |
| --- | --- | --- |
| Concepto | Aprobado | Un cuarto, un spline, cuatro casos, una puerta |
| Scroll / Lenis / ScrollTrigger / HUD | Funciona | No reescribir |
| Chrome DOM, sheet, skip-list, lentes, EN/ES | Funciona | No reescribir salvo bugs de overlay |
| Contrato de progreso `0→1` y `STATIONS` | Cerrado | No cambiar las keys de progreso |
| Cuarto 3D (`greenhouse.tsx`) | Rechazado | **Reemplazar** |
| Especímenes (`specimens.tsx`) | Rechazado | **Reemplazar** |
| Luces / niebla / environment (`scene.tsx`) | Insuficiente | Rehacer look, conservar CameraRig |
| Relación con el tablero original | Rota | El tablero es el norte visual, no el mesh actual |

Si tenés que elegir: **tirá las meshes y conservá el sistema**. Un invernadero nuevo sobre el mismo `live.progress` es el trabajo. Un rewrite de Lenis no lo es.

## 2. Cómo correrlo

```
pnpm run dev
```

- `/fruit` — The Bench
- `/fruit?frame=01` enter · `02` hover Devias ~0.40 · `03` sheet Bucked · `04` puerta
- `/fruit?case=bucked-up` abre el sheet en su estación
- `/dev` no debe cargar `three`, `gsap` ni `lenis`

Stack de esta ruta: Next **16.4.0**, React **19**, three **0.186.1**, R3F **9.8.1**, Drei **10.7.9**, GSAP **3.15.0** + ScrollTrigger, Lenis **1.3.26**. Leer `node_modules/next/dist/docs/` antes de APIs de Next: este Next no es el de training.

Unidades del mundo: **1 unidad ≈ 1 metro**. Cámara a altura de ojos (~1.55–1.65). El pasillo actual mide ~6.3 m de ancho, ~3.85 m de alto, ~20 m de largo. Esas magnitudes están bien; lo que está mal es que el volumen está vacío.

## 3. Qué está cerrado (no negociar)

### Producto

- Inglés por defecto, toggle EN/ES.
- Casos, en este orden: Bucked Up → Devias → Imperio Tickets → COOPEF Gym.
- Copy solo de `content/`. Headline y support de `content/identity.ts`. Sheet Need/Engineering de `sheetFields()`. No nombrar en copy qué fruta es cada cliente.
- Tokens: `--ink #14130F`, `--cream #F7EFE1`, `--rose #E0566B`, `--rose-text #C23F55`, `--clay #B8674A`, `--glass-lime #C4D96B`. Display Cormorant, chrome JetBrains Mono.
- THE BENCH es skip-list: primer click / Enter = `lenis.scrollTo` a la estación (~1.2 s). Segundo = sheet. Click en el mesh = sheet directo.
- Lentes re-iluminan el mismo cuarto. Click en una lente la deja fija hasta recargar.
- Sheet: panel cream 55% derecha, 280 ms in / 180 ms out, `transform`+`opacity`, no oscurece la escena. Scrollear con sheet abierto lo cierra.
- Puerta en `1.00` = `mailto:`.
- DOM over WebGL. Nada de texto horneado en el canvas.
- No importar `three` / `@react-three/*` / `gsap` / `lenis` fuera de `/fruit`.
- Reduced-motion: snap de estación, sin dolly continuo, sin fototropismo.

### Progreso (fuente de verdad)

```
0.00  enter     Business
0.08  Bucked Up Business   izquierda
0.42  Devias    Engineering derecha   (el frame 02 del tablero está en 0.40)
0.64  Imperio   Engineering izquierda
0.84  COOPEF    Delivery    derecha
1.00  door      Delivery
```

Definido en `components/fruit/camera-path.ts` → `STATIONS`. El HUD, las lentes automáticas y “visitado” salen de ahí.

### Store en vivo (no re-renderizar React por frame)

`components/fruit/bench-live.ts` → objeto mutable `live`:

`progress`, `velocity`, `selectedId`, `sheetOpen`, `lens`, `reduce`, `hoverId`

La escena lee `live` en `useFrame`. El HUD se escribe con `--bench` y `textContent`. No volver a `setState` en cada scroll: eso era el slideshow de SVGs que Bruno rechazó.

### Scroll

`components/fruit/use-bench-scroll.ts`

- Pin de **600vh** desktop / **450vh** móvil (`.fruit-pin`)
- Stage `position: fixed` (`.fruit-stage`)
- Lenis (`lerp` 0.075) + `gsap.ticker` + `lenis.on('scroll', ScrollTrigger.update)`
- Cámara damp exponencial sobre dos `CatmullRomCurve3` (pos + look), muestreadas con `splineT(progress)` — **no** `getPointAt(progress)` crudo, las keys no son uniformes
- Skip-list marca scroll como programático para no cerrar el sheet a mitad del `scrollTo`

## 4. Mapa de archivos

```
app/fruit/page.tsx          server, content → BenchApp. No tocar salvo metadata.
app/fruit/layout.tsx        viewport light, fruit.css
app/fruit/fruit.css         tokens + chrome. Tocar solo si el arte exige overlay.

components/fruit/
  bench-app.tsx             wiring. Conservar.
  bench-live.ts             store. Conservar.
  use-bench-scroll.ts       Lenis+ST. Conservar.
  camera-path.ts            STATIONS locked. Podés retocar CAMERA_* y SPECIMENS.position
                            cuando el cuarto nuevo lo pida. No cambies progress keys.
  chrome.tsx / sheet.tsx / door.tsx / cursor.tsx / fallback.tsx
  scene.tsx                 Canvas + CameraRig + Lights. Rehacer luces/env/DOF.
                            Conservar CameraRig (spline + yaw ±3° + sheet push).
  greenhouse.tsx            TIRAR Y REHACER.
  specimens.tsx             TIRAR Y REHACER.

content/identity.ts, content/cases/*, content/fruit.ts, content/types.ts
  Conservar. TODO abierto: labels cortos Need/Engineering en ES siguen en inglés.

public/fruit/{enter,hover,sheet,door}.svg
  Beauty pass del tablero (fase 1). Referencia visual. El fallback actual los usa
  si no hay WebGL. Cuando el look nuevo cierre, regenerar AVIF ≤ 200 KB.

.fruit-bench/               HTML del tablero Claude (4 estados). Norte visual.
fruit-the-bench.md          Spec de producto. Ley.
```

La escena entra con `next/dynamic(() => import('./scene'), { ssr: false })` desde `bench-app.tsx`. Mantenerlo.

## 5. Por qué se ve mal (diagnóstico, no estilo)

El screenshot actual es un **túnel de pórticos huecos** con cuatro primitivas. Falla en cinco ejes a la vez.

### 5.1 No es un invernadero

`greenhouse.tsx` instancia 11 grupos de palitos (`box` 0.07×3.85×0.07) y tira **un solo plano de vidrio por pared** (22 m de largo). No hay:

- módulos de ventana (montante + travesaño + paño)
- vidrio dividido en cuadros
- umbral, canaleta, cumbrera, cabios que se lean como techo a dos aguas
- juntas, tornillos, óxido, pintura descascarada, putty
- exterior visible a través del vidrio (cielo, árboles, suelo). Afuera es el clear color cream, entonces el “vidrio” se lee como pared opaca beige
- condensación, suciedad, musgo en las juntas
- nada vivo que no sea “el caso”

El techo es dos `box` rotados 0.34 rad más una X de barras al fondo. No hay penal, no hay lucernario, no hay sombra de listón sobre el banco.

### 5.2 No hay criterio espacial

- El banco son 9 listones infinitos (16.4 m) y dos rieles. Sin patas, sin canto, sin encuentro con el piso, sin tierra debajo.
- El piso es un plano `#c79e78`. El tablero pide baldosa cálida.
- Los especímenes flotan a alturas arbitrarias (`y` 0.92–1.34) sobre un banco en `y=0.92`. No hay maceta, plato, suelo, ni sombra anclada.
- FOV 42 + pórticos idénticos cada 1.85 m = perspectiva de pasillo infinito, no de cuarto. Falta **algo entre los pórticos** (paños, plantas de fondo, mesas, mangueras, etiquetas de vivero, cajas) para que el ojo mida distancia.
- La cámara en enter (`z=0.15`) está **dentro** del primer vano, pegada al fruto de vidrio, así que el primer plano es una esfera de ~80 cm que se come el headline. El tablero pide plano **ancho** desde la puerta de entrada, Bucked cerca pero no tapando el cuarto.
- En `0.40` Bucked debería salir **por la izquierda**, desenfocado y gigante. Hoy la esfera verde se queda a la derecha porque el look-at tira hacia Devias y no hay DOF.

### 5.3 No son plantas

| Caso | Spec | Qué hay hoy |
| --- | --- | --- |
| Bucked Up | Fruto de vidrio lima, transmisión, flor de vidrio al tallo, costura y rubor al madurar | `sphereGeometry` 0.42 + esfera chica. Se lee “bola de gelatina” |
| Devias | Fruto achatado de arcilla, SSS, pétalos que se abren de la base | Esfera scale Y 0.72 + bulge. Se lee “papa” |
| Imperio | Vaina fibrosa, costillas, costura, flor seca | `capsuleGeometry` + 3 toros. Se lee “suplemento” |
| COOPEF | Enredadera sobre trellis, hojas a contraluz, flores `--rose` | Un `box` vertical y seis esferas verdes. Se lee “tablero con pelotas” |

Maduración (`ripen` 0–2) solo escala o abre un ángulo. No hay morph, no hay interior, no hay flor real.

### 5.4 Materiales de demo

- Vidrio de Bucked: `meshPhysicalMaterial` transmission ~0.62 **sin environment map**. Transmission sin IBL = plástico verde.
- Arcilla: `sheen` en physical, sin SSS de verdad.
- Pórticos: un `meshStandardMaterial` `#2e2a22` en todo. Un solo roughness para hierro, madera y vidrio.
- Luces: ambient + un directional + hemisphere. Sin HDRI. Sin lightmap. Sin shafts. Niebla `FogExp2` 0.01 que no da bruma de invernadero, solo destiñe.
- Engineering: una `LineDashed` rosa en L. No es la línea de corte del tablero (sobre banco **y** pórtico, a la estación activa).

### 5.5 Lo que el tablero sí tiene y el mesh no

Referencias, en este orden:

1. `.fruit-bench/01-enter.html` … `04-door.html` (tablero Claude, 1440×900)
2. `public/fruit/enter.svg` `hover.svg` `sheet.svg` `door.svg` (extraídos de ese tablero)
3. `fruit-the-bench.md` §5, §6, §9

Ahí hay: cielo crema a través del vidrio, paños, listones que proyectan, fruto de vidrio con núcleo luminoso y hoja, fruto de arcilla con piel y pétalos, vaina con costilla, enredadera que sube un marco, farol, puerta con luz en el piso, polvo, viñeta. El mesh actual no cita ninguna de esas formas. Cita `boxGeometry`.

## 6. Qué construir (arte)

El trabajo es **lookdev de un invernadero caminable**, no un nuevo producto.

### Cuarto

Un invernadero victoriano/utilitario, no un shader toy y no un conservatory de stock Unreal.

- Módulo de vano: poste + dintel + dos o tres paños de vidrio con montantes. **Instancing** de ese módulo a lo largo de Z (presupuesto §12: ≤ 100 draw calls desktop).
- Techo a dos aguas de verdad: cabios, cumbrera, vidrio en pendiente, un poco de cielo (`Environment` HDRI o sky procedural). El visitante tiene que **ver afuera**.
- Piso: baldosa o ladrillo de canto, junta oscura, variación. No un plane.
- Banco: una pieza de ebanistería. Canto, patas, tierra o greda en bandejas, manchas de riego. Los cuatro especímenes **se sientan** en él, lado intercalado I–D–I–D.
- Decoración que dé escala, no clutter: manguera enrollada, etiquetas de alambre, una regadera, cajones, una paleta, musgo en la base de un poste, condensación en el paño más cercano. Todo geométrico o texturado, nada de emoji, nada de “planta genérica de asset store” clonada cuatro veces.
- Pared final: muro ciego, puerta, vidrios chicos que filtran, farol sobre el banco. En Delivery la luz tiene que **dibujar** la puerta, no apagar el world a negro.

### Especímenes

Cuatro seres, cuatro materiales. Geometría real (glTF o procedural denso), no primitivas sueltas.

- Bucked: volumen cerrado de vidrio lima, thickness, IOR ~1.5, **IBL obligatorio**, flor de vidrio al pecíolo. `MeshTransmissionMaterial` (Drei) en desktop; env-map fake en móvil. Al madurar: costura, rubor cálido en la base.
- Devias: achatado, piel de arcilla, SSS o sheen+thickness creíble, pétalos que nacen abajo y se abren con `ripen`.
- Imperio: vaina, fibra, costillas, costura que se abre a flor seca.
- COOPEF: trellis + guía + hojas con transmisión barata a contraluz + flores `--rose` a lo largo. Que se lea enredadera a 8 metros.

`ripen` ya existe en `userData` (0–2 por distancia +1 si sheet). Úsalo de verdad (morph / blend shapes / visibilidad de flor). No más `scale.lerp`.

Seleccionado: rim `--rose`, se alza ~5–8 cm, la sombra queda en el banco, etiqueta DOM al costado. El fototropismo (±6° planta, ±3° cámara) ya está en `useSpecimen` / `CameraRig`; que sobreviva.

### Cámara y lente (retocar, no rediseñar)

Podés mover `CAMERA_POS`, `CAMERA_LOOK` y `SPECIMENS[].position` para que el enter sea un plano ancho y el 0.40 deje a Bucked saliendo por la izquierda. No cambies `STATIONS[].progress`.

Lentes, lerp ~400 ms:

| Lente | Qué se tiene que sentir |
| --- | --- |
| Business | Mañana, sol bajo a la izquierda, polvo, sombras blandas |
| Engineering | Mediodía cenital, sombras duras de listón, corte rosa en la estación |
| Delivery | Noche, farol, luz por la puerta, vidrio oscuro con reflejo |

DOF: en hover/estación, el espécimen activo nítido, el resto un poco fuera. Reduced-motion: sin DOF.

### Presupuesto (spec §12)

60 fps teléfono medio. Escena ≤ 8 MB. Transmisión real solo Bucked. Una sombra realtime en desktop, ninguna en móvil (`ContactShadows` o lightmap). Si hace falta, glTF + meshopt/Draco. Instancing para vanos y baldosas. Nada se re-renderiza en React por frame.

## 7. Cómo trabajar sin romper la caminata

1. Dejá `bench-app`, `use-bench-scroll`, `bench-live`, `chrome`, `sheet`, `door` en paz.
2. Reemplazá `greenhouse.tsx` y `specimens.tsx`. Si el archivo se parte en `specimens/bucked.tsx` etc., bien: el spec ya lo dibujaba así.
3. En `scene.tsx`: conservá `CameraRig` (spline, yaw, sheet push). Reemplazá `Lights` por un rig con Environment / lightmaps. El canvas sigue `antialias: true`, `alpha: false`, `aria-hidden`, tamaño del contenedor, `next/dynamic` `ssr: false`.
4. Verificá **scrolleando**, no con un screenshot: `0.00` → `0.40` → `0.64` → `0.84` → `1.00`, skip-list, sheet, `?case=`, EN/ES, 1440 y 375.
5. `/dev` bundle: grep o Network, cero `three`/`gsap`/`lenis`.
6. Cuando el look cierre, regenerá beauty passes del fallback.

El chrome (headline, THE BENCH, HUD) es correcto. Si el h1 tapa el fruto, **alejá la cámara de enter**; no agrandes el tipo.

## 8. TODOs abiertos (no los “resuelvas” inventando)

- Labels cortos del sheet en ES: `content/fruit.ts` todavía dice `Need` / `Engineering`. Preguntar a Bruno.
- Beauty pass AVIF del fallback: los SVG actuales son el tablero, no el WebGL. Actualizar después del look.
- `window.__benchLenis` es debug. Se puede sacar.
- Craft del spec §9 (world-locked type, cáusticas, normal map de condensación) **después** de que el cuarto se lea. No apilar efectos sobre primitivas.

## 9. Prompt para pegarle a Claude

> Repo `osella`, Next 16.4. Leé `fruit-the-bench.md` (ley) y `fruit-the-bench-handoff.md` (estado).  
> `/fruit` ya camina: Lenis + ScrollTrigger + spline + chrome DOM. Bruno aprobó la interacción y rechazó el arte.  
> Reemplazá `components/fruit/greenhouse.tsx` y `specimens.tsx`, y el lighting de `scene.tsx`. Conservá CameraRig, `live`, `STATIONS` (las keys de progreso), skip-list y el sheet.  
> El cuarto tiene que ser un invernadero de verdad: vanos con ventanas, techo a dos aguas, vidrio por el que se ve el cielo, banco de madera, baldosa, decoración de vivero, escala de ojo. Cuatro especímenes distintos (vidrio lima, arcilla SSS, vaina fibrosa, enredadera), no primitivas. Norte visual: `.fruit-bench/*.html` y `public/fruit/*.svg`.  
> No toques `/dev` ni `/gaming`. No inventes copy. No importes three fuera de `/fruit`. Verificá scrolleando 0→1, sheet, skip-list, 1440 y 375.  
> Si una decisión de arte choca con el spec, paramos y preguntamos. No hay puntos abiertos de producto.

## 10. Criterio para decir “listo”

Bruno tiene que reconocer el tablero **en movimiento**: mismo cuarto, misma luz, mismos cuatro seres, no cuatro artboards. Si apagás el chrome y sacás un still en `0.00` y `0.40`, tiene que parecer un invernadero con plantas, no un demo de `boxGeometry`.
