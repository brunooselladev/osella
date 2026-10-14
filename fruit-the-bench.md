# Fruit — The Bench · plan de implementación

Oct 14, 2026 · @Bruno Osella

## 0. Cómo leer este doc

Este doc reemplaza la versión anterior y es la fuente única para construir `/fruit`. Idioma del doc: español. Idioma del sitio: inglés por defecto, con toggle EN/ES. Referencia visual: el tablero *fruit — The Bench (greenhouse, 4 states)*.

Todo lo de este doc está decidido. No hay puntos abiertos.

Regla para quien implementa: no inventar copy, métricas, clientes ni aportes. Si falta un dato, se deja un TODO visible en código y se pregunta. No asumir: si algo de este doc contradice el repo, parar y reportarlo.

## 1. Estado actual

`/fruit` sigue siendo la página cream con órbita de emojis (`app/fruit/page.tsx`). Se reemplaza entera por The Bench. `/dev` es la home profesional, `/` es el semáforo y `/gaming` no se toca en esta fase.

Contenido reutilizable, sin duplicar:

- `content/identity.ts` — headline, support y email, en EN y ES
- `content/cases/` — Bucked Up, Devias, Imperio Tickets, COOPEF Gym, en ese orden
- `content/types.ts` — lentes `business | engineering | delivery`

Three.js, R3F, Drei y GSAP ya están en `package.json`. Lenis no está y se agrega (ver 7). Antes de escribir código, leer las versiones exactas instaladas de `next`, `react`, `three`, `@react-three/fiber`, `@react-three/drei` y `gsap`, y anotarlas en el PR.

## 2. Concepto

Un invernadero, un banco, cuatro especímenes y una puerta. El visitante no scrollea secciones: camina el cuarto. La única idea fuerte es la caminata por el banco; todo lo demás la sirve.

| Acción | Qué hace |
| --- | --- |
| Scroll / swipe | Dolly de cámara por el pasillo, con inercia |
| Hover o foco en un caso | Selecciona su espécimen (rim light, se eleva, etiqueta) |
| Click / Enter | Abre el sheet de ese caso |
| Lentes Business / Engineering / Delivery | Re-iluminan el mismo cuarto; no navegan |
| Fin del pasillo | La puerta es el contacto |

**Fuente única de verdad: el progreso del scroll (0 → 1).** La cámara, el HUD, la lente automática y el estado visitado se derivan de ese número. Saltar a un caso desde THE BENCH es scrollear hasta su estación, no teletransportar la cámara por fuera del scroll. El sheet es la única excepción: agrega un empuje de cámara encima del spline sin tocar el progreso (ver 8).

Criterio de jurado: Design 40 · Usability 30 · Creativity 20 · Content 10. THE BENCH y el sheet existen para que nadie tenga que terminar la caminata para leer un caso.

## 3. Qué no se hace

- No inventar métricas, KPIs, testimonios, stack de clientes, aportes ni el título “Project Director”.
- No nombrar en copy qué fruta o especie es cada cliente. El caso lo nombran THE BENCH y el sheet.
- No hornear texto en el render. Todo texto es DOM: headline, etiqueta de hover, sheet, puerta.
- No importar `three`, `@react-three/*`, `gsap` ni `lenis` en `/dev`, `/work/*` ni `/`.
- No reemplazar `/dev`. The Bench no es la home profesional.
- No usar “El corte” como concepto del sitio. Solo como efecto local de maduración (9.3).
- No emojis, clip-art, macetas ni follaje de ícono. No cuatro plantas iguales.
- No oscurecer la escena al abrir el sheet. El cuarto sigue iluminado y respirando.
- No apilar efectos. Ante la duda, se recorta una propuesta de la sección 9.
- No Inter, Roboto ni Arial.
- Muere con el reemplazo: cards, harvest track, about y timeline del `/fruit` actual.

## 4. Tokens y chrome

Los tokens viven en `app/fruit/fruit.css` como variables, sin mezclarse con `/dev`.

| Token | Valor | Uso |
| --- | --- | --- |
| `--ink` | `#14130F` | Texto sobre cream, sombras |
| `--cream` | `#F7EFE1` | Fondo del sheet, texto de noche |
| `--rose` | `#E0566B` | Puntos, líneas, subrayados, cursor. No para texto chico |
| `--rose-text` | `#C23F55` | Texto chico en rosa sobre cream (numerales activos, “Since 2022”) |
| `--ink-2` | `#5A5446` | Texto secundario de día |
| `--cream-2` | `#B8AE9C` | Texto secundario de noche |
| `--rose-night-hover` | `#F2A0AC` | Hover de links de noche |
| `--clay` | `#B8674A` | Material del espécimen de arcilla |
| `--glass-lime` | `#C4D96B` | Material del espécimen de vidrio |

`#E0566B` sobre cream no llega a 4.5:1 en texto chico; por eso existe `--rose-text`.

Tipografía: Cormorant Garamond para display (h1 de Enter \~68px, título del sheet \~104px, puerta \~88px, cuerpo del sheet \~34px). JetBrains Mono para todo el chrome: índice, lentes, HUD, caption, etiquetas, mail. Cargar con `next/font/google`, solo en `/fruit`.

Chrome HTML, siempre encima del canvas, idéntico en los cuatro estados:

- Header izquierda: `bruno.osella` → `/`
- Header derecha: marca `Fruit`, toggle `EN / ES`, semáforo de tres puntos (Dev, Fruit actual en rosa, Gaming). El semáforo está en el tablero y en el brief: se queda.
- Índice a la izquierda: título `THE BENCH` y `01 Bucked Up · 02 Devias · 03 Imperio Tickets · 04 COOPEF Gym`. Siempre visible, siempre en el DOM.
- Lentes debajo del índice: `Business · Engineering · Delivery`, con `aria-pressed`.
- HUD abajo, a todo el ancho: línea fina, relleno rosa hasta el progreso, ticks en las estaciones y `0.00 / bench` en mono con `tabular-nums`.
- Caption técnico abajo a la izquierda, solo en Enter: `Next.js 16 · React 19 · Three.js · GSAP ScrollTrigger · Lenis · DOM over WebGL`. No reescribir.
- Cursor custom: cruz de líneas finas con punto rosa. Solo con `(hover: hover) and (pointer: fine)`; el cursor nativo vuelve con reduced-motion y en campos de foco.

## 5. El cuarto y los especímenes

El cuarto es un invernadero de vidrio con estructura de pórticos: paredes y techo a dos aguas de vidrio, pórticos que se repiten a lo largo del pasillo, piso de baldosa cálida, un banco largo de madera y una pared final con la puerta. Todo tiene escala real; la cámara camina a altura de ojos.

Cuatro formas, cuatro materiales, cuatro estaciones a lo largo del banco, de cerca a lejos:

| # | Caso | Forma | Material | Flor | Lado del banco |
| --- | --- | --- | --- | --- | --- |
| 01 | Bucked Up | Fruto redondo de vidrio verde lima | Transmisión + cáusticas internas | Flor de vidrio translúcido junto al tallo | Izquierda |
| 02 | Devias | Fruto achatado de piel de arcilla | Subsurface scattering cálido | Pétalos de arcilla que se abren desde la base | Derecha |
| 03 | Imperio Tickets | Vaina de semillas alargada y fibrosa | Fibra opaca, costillas, costura abierta | La vaina se abre en una flor seca de fibra | Izquierda |
| 04 | COOPEF Gym | Enredadera con hojas sobre un trellis | Hojas translúcidas a contraluz | Flores rosas (`--rose`) a lo largo de la enredadera | Derecha |

El lado alternado es lo que hace que, al avanzar, Bucked Up salga de cuadro por la izquierda (fotograma 02).

Maduración en tres etapas por espécimen: cerrado → maduro → abierto. La etapa sube con la cercanía de la cámara (9.3) y abrir el sheet suma una etapa. La flor acompaña la maduración: cerrada en la primera etapa, en capullo en la segunda y abierta en la tercera. Cada flor es del mismo material que su espécimen y se modela con geometría real, nunca como clip-art ni ícono. En el tablero, Bucked Up abierto muestra una costura que brilla y un rubor cálido en la base; su flor de vidrio se suma a ese estado.

Estado seleccionado (hover o foco): rim light rosa, elevación de unos centímetros con la sombra quedando en el banco, y una etiqueta DOM proyectada al costado del mesh con número y nombre (`02 · Devias`) y una línea guía. Nada más en la etiqueta.

## 6. Los cuatro fotogramas

No son páginas: son cuatro muestras del mismo estado (progreso, lente, selección, sheet). Si el estado se reproduce, el fotograma tiene que salir igual. Sirven como tests visuales de la fase 6.

| Fotograma | Progreso | Lente | Selección | Sheet | Qué se ve |
| --- | --- | --- | --- | --- | --- |
| 01 Enter | `0.00` | Business / mañana | Ninguna | Cerrado | Plano ancho desde la puerta de entrada. Bucked Up cerca, en foco, rotando por inercia. Los otros tres se pierden en profundidad y bruma. h1 + support arriba a la derecha. Caption técnico visible |
| 02 Hover + scroll | `0.40` | Engineering / mediodía | Devias (hover en el índice) | Cerrado | Bucked Up gigante y desenfocado saliendo por la izquierda. Devias elevado con rim light y etiqueta. Sombras duras de los listones cruzando el banco. Línea de corte rosa punteada a la altura de Devias. Sin headline ni caption |
| 03 Sheet | `0.08` | Business / mañana | Bucked Up | Abierto | Sheet cream sobre el 55% derecho. A la izquierda, cámara empujada hacia Bucked Up, una etapa más maduro. Índice, lentes y HUD siguen vivos |
| 04 Door | `1.00` | Delivery / noche | Puerta (hover) | Cerrado | Pared final con la puerta, luz filtrándose por los bordes y abanico de luz en el piso. Un farol chico sobre el banco. `Walk out →` y el mail a la derecha de la puerta. Los cuatro casos marcados como visitados |

El fotograma 03 fija la regla: el sheet es ortogonal al scroll. Se abre en cualquier progreso.

## 7. Spline, estaciones y scroll

Un pin, un scroll, un path. La cámara recorre una `CatmullRomCurve3` de posición y mira a lo largo de una segunda curva de objetivo, ambas muestreadas con el progreso 0 → 1.

| Progreso | Estación | Lente automática | Qué se ve |
| --- | --- | --- | --- |
| `0.00` | Entrada | Business | Plano ancho, headline |
| `0.08` | 01 Bucked Up | Business | Primer espécimen en cuadro, el más cercano |
| `0.42` | 02 Devias | Engineering | Mediodía, sombras duras |
| `0.64` | 03 Imperio Tickets | Engineering | Vaina en primer plano |
| `0.84` | 04 COOPEF Gym | Delivery | La luz cae, aparece el farol |
| `1.00` | Puerta | Delivery | Noche, mail |

Las estaciones viven en una sola constante (`STATIONS` en `camera-path.ts`) y de ahí salen también los ticks del HUD. En el tablero el fotograma 02 está a `0.40`: es la cámara llegando a Devias.

Scroll:

- Lenis para el suavizado, sincronizado con ScrollTrigger: `lenis.on('scroll', ScrollTrigger.update)` y Lenis movido por `gsap.ticker`. Se agrega Lenis porque el caption del sitio lo nombra y ese caption no se reescribe. Instancia creada y destruida dentro de `/fruit`.
- ScrollTrigger con un solo pin y `scrub` entre 0.8 y 1.2. Alto del recorrido: \~600vh en desktop, \~450vh en móvil. `ScrollTrigger.refresh()` después de cargar fuentes y modelos.
- Inercia: la cámara no sigue el progreso crudo; se amortigua hacia él cada frame (damp exponencial). El espécimen activo gira con una velocidad angular que toma la velocidad del scroll y se frena sola.
- Click en un nombre de THE BENCH: `lenis.scrollTo` hasta la estación de ese caso (\~1.2s). No abre el sheet; el sheet lo abre un segundo click o Enter.
- Deep link: `/fruit?case=bucked-up` posiciona el scroll en la estación y abre el sheet. Abrir y cerrar el sheet actualiza la URL con `history.replaceState`, sin navegar.

## 8. Interacción

**Selección.** Hay un solo caso seleccionado a la vez. Lo setean, en este orden de prioridad: el sheet abierto, el hover o foco en un nombre de THE BENCH, el hover sobre el mesh. Índice y mesh muestran el mismo estado: numeral en `--rose-text`, línea rosa delante del nombre, y en el mesh rim light, elevación y etiqueta. Hover sobre el mesh cambia el cursor y nada más.

**Lentes.** La lente sigue las zonas de la tabla de la sección 7. Cuando el usuario toca una lente, esa lente queda fija hasta recargar. El cambio es un lerp de luces, exposición y niebla de \~400ms. No navega ni cambia la URL.

| Lente | Luz | Rasgos |
| --- | --- | --- |
| Business | Mañana cálida desde arriba a la izquierda | Haces volumétricos suaves, polvo, sombras blandas |
| Engineering | Mediodía cenital | Sombras duras de listones sobre el banco, línea de corte rosa en la estación activa |
| Delivery | Noche | Farol del banco, luz filtrándose por la puerta, vidrio oscuro con reflejos |

**Sheet: panel cream plano.** El tablero muestra un panel sólido `--cream`, no un vidrio esmerilado; `backdrop-filter` sobre un canvas WebGL cuesta caro en móvil.

- Desktop: panel a la derecha, 55% del ancho, alto completo. Móvil: bottom sheet de \~88% del alto.
- Entrada \~280ms ease-out con `transform` desde el lado del espécimen; salida \~180ms. Sin animar `width`.
- Contenido, nada más: `Esc / ×`, título, nota, línea, una fila Need + Engineering y `Read the case →` a `/work/[slug]`.
- Es un diálogo no modal: `role="dialog"`, `aria-labelledby` al título, foco al título al abrir, foco de vuelta al disparador al cerrar. Índice, lentes y HUD siguen operables.
- Cierra con Esc, con `×` o con click en la escena.
- La cámara se empuja hacia el espécimen con un offset que se suma al spline. El progreso no cambia y el cuarto no se oscurece.
- Scrollear con el sheet abierto lo cierra.

**Visitado.** Un caso queda visitado cuando se abre su sheet o cuando el progreso pasa su estación. Se guarda en `sessionStorage`. En el índice se marca con un punto chico; en la puerta los cuatro aparecen visitados.

**Puerta.** A `1.00`, `Walk out →` y el mail son links `mailto:`. Hover en la puerta: la luz de los bordes sube y aparece un contorno rosa fino. No hay card “Want to talk?”.

## 9. Craft del paseo

Las seis propuestas van, en la fase 5. THE BENCH como skip-list y la puerta como CTA están cerradas en la sección 8.

| # | Propuesta | Cómo se implementa | Decisión |
| --- | --- | --- | --- |
| 9.1 | Tipo world-locked | El h1 y el support siguen siendo DOM. Un `matrix3d` sincronizado con la cámara los ancla al vidrio del fondo; al avanzar, el visitante los atraviesa y se desvanecen hacia `0.18`. Nunca texto en el canvas | Sí |
| 9.2 | Fototropismo | Con hover, la planta se inclina hasta 6° hacia la cámara y la cámara gira hasta 3° hacia ella. Spring interrumpible. Solo con puntero fino | Sí, con esos topes |
| 9.3 | Maduración por cercanía | Un uniform `ripen` de 0 a 2 por espécimen, según la distancia a la cámara; el sheet suma 1. Se hace con morph targets o shader, no con clipping plane (un corte necesita tapa interior) | Sí: el brief lo pide |
| 9.4 | Línea de corte en Engineering | Línea rosa punteada sobre el banco y el pórtico en la estación activa, solo con esa lente. Está en el fotograma 02 | Sí |
| 9.5 | GPU visible y barata | Polvo como `Points` (≤ 1.500), condensación como normal map solo en los paneles cercanos, tierra húmeda en el banco. Se apaga lo que haga falta bajo 30 fps (sección 12) | Sí, recortado |
| 9.6 | Un solo gesto de entrada | Niebla que se aclara en \~1s en el primer paint. Ningún fade-slide en el chrome | Sí |

## 10. Copy y contenido

Todo texto sale de `content/`. No hay placeholders en producción: el support del tablero era un placeholder y se reemplaza por el real.

| Superficie | Fuente EN | Fuente ES |
| --- | --- | --- |
| h1 | `identity.en.headline` | `identity.es.headline` |
| Support | `identity.en.support` | `identity.es.support` |
| Mail | `identity.email` | `identity.email` |
| THE BENCH | `publishedCases[].cardTitle` | igual |
| Sheet título / nota / línea | `cardTitle` / `note` / `cardLine` | versión ES del caso |
| Sheet etiquetas | `Need` / `Engineering` | Tomar de `content/` si existen; si no, TODO y preguntar |
| Sheet CTA | `Read the case →` | `Ver el caso →` |
| Puerta | `Walk out →` + mail | `Salir →` + mail |

El tablero de Bucked Up tomó Need de `rows[1]` (*A large shared codebase where mistakes reach customers.*) y Engineering de `rows[0]` (*Ecommerce frontend and backend*). Ese texto está aprobado.

**Fila del sheet:** agregar a cada caso un campo opcional `sheet: { needRow: number; engineeringRow: number }`. Si falta, se usa `rows[0]` para las dos. Bucked Up lleva `{ needRow: 1, engineeringRow: 0 }`, así el sheet queda idéntico al tablero sin inventar texto.

La lente activa no reescribe el sheet en esta versión. Las otras lentes del caso se leen en `/work/[slug]`.

Los `aria-label` del chrome (semáforo, cerrar sheet, lentes) también van en EN y ES.

## 11. Accesibilidad, móvil, reduced-motion y fallback

**Teclado.**

- `Tab` recorre el chrome real en orden: header, THE BENCH, lentes, sheet si está abierto, puerta. Foco visible de 2px en `--ink` de día y `--cream` de noche.
- Foco en un nombre de THE BENCH = mismo efecto que el hover. `Enter` sobre el nombre lleva a la estación; un segundo `Enter` abre el sheet.
- `Esc` cierra el sheet desde cualquier lugar.
- Atajos de una tecla (`1`–`4` casos, `B` / `E` / `D` lentes) solo funcionan con el foco dentro de THE BENCH o del grupo de lentes. Así no chocan con lectores de pantalla (WCAG 2.1.4).

**Lectores de pantalla.** El canvas lleva `aria-hidden="true"`: todo el contenido ya está en el DOM. Al lado, un párrafo visualmente oculto describe el cuarto en una frase. Cambiar de lente se anuncia por `aria-pressed`, no por live regions.

**Móvil (375px), layout propio, no un recorte.**

- Header compacto con `bruno.osella`, `EN / ES` y el semáforo; `Fruit` se esconde.
- THE BENCH pasa a una fila horizontal arriba del HUD, con los cuatro nombres siempre visibles y objetivos de ≥ 44px.
- Lentes como control segmentado de tres botones de ≥ 44px.
- h1 de \~40px. La cámara abre el FOV en vertical para que el banco entre en cuadro.
- Swipe vertical = dolly. Tap en un nombre = ir a la estación y seleccionar; segundo tap = sheet. Tap en el mesh = sheet directo.
- Sin cáusticas, menos partículas, DPR máximo 1.5.

**`prefers-reduced-motion`.** La cámara salta de estación a estación sin dolly continuo; el scroll sigue moviendo el progreso y el HUD. Sin fototropismo, sin rotación por inercia, sin niebla de entrada. Las lentes cambian con un fundido de 150ms. Hover, sheet y teclado siguen iguales.

**Sin WebGL o falla de carga.** Una imagen estática por lente (beauty pass, AVIF, ≤ 200 KB cada una) detrás del mismo chrome, THE BENCH y sheets. El contenido nunca depende del canvas. El fallback también se usa si el primer segundo corre a menos de 20 fps.

## 12. Renderer y presupuesto

El 3D tiene que verse caro y correr barato: 60 fps en un teléfono de gama media y menos de 8 MB de escena.

**Renderer: `WebGLRenderer` (WebGL 2) vía R3F.** Corre en todos los teléfonos y con todo Drei, incluido `MeshTransmissionMaterial` para el vidrio de Bucked Up. WebGPU no agrega nada visible en esta escena y sumaría riesgo de compatibilidad.

| Recurso | Desktop | Móvil |
| --- | --- | --- |
| Descarga total de la escena (modelos + texturas + HDRI) | ≤ 8 MB | ≤ 5 MB |
| Draw calls | ≤ 100 | ≤ 60 |
| Triángulos en cuadro | ≤ 300k | ≤ 150k |
| Texturas | KTX2, ≤ 2048px | KTX2, ≤ 1024px |
| DPR | 1–2 | máx. 1.5 |
| Luces con sombra en tiempo real | 1, solo mediodía, mapa de 1024 | 0, sombras de contacto |

Reglas de render:

- Iluminación del cuarto horneada: un lightmap por lente, cruzado en el cambio de lente. Solo los especímenes reciben luz dinámica.
- Transmisión real solo en Bucked Up. En móvil, refracción falsa con env map.
- Instancing para listones, pórticos y baldosas. Polvo como un solo `Points`.
- Modelos glTF con meshopt o Draco.
- Degradación por FPS: si cae debajo de 30 durante 2s, bajar DPR; después apagar cáusticas; después partículas; al final pasar al fallback estático.
- Nada se re-renderiza en React por frame. Cámara, HUD y etiqueta proyectada se actualizan por refs dentro de `useFrame`; el número del HUD se escribe en `textContent`.

## 13. Arquitectura

```
app/fruit/page.tsx               server: lee content/ y renderiza el chrome en el HTML inicial
app/fruit/fruit.css              tokens de The Bench
components/fruit/
  bench-app.tsx                  client: estado (progreso, selección, lente, sheet, visitados)
  chrome.tsx                     header, semáforo, THE BENCH, lentes, HUD, caption, cursor
  sheet.tsx                      diálogo no modal del caso
  door.tsx                       Walk out + mail
  scene.tsx                      canvas R3F, cargado con next/dynamic y ssr: false
  specimens/                     un archivo por espécimen + material
  lens-rigs.ts                   luces, exposición, niebla y lightmap por lente
  camera-path.ts                 curvas, STATIONS, zonas de lente
  use-bench-scroll.ts            Lenis + ScrollTrigger, un pin, progreso 0→1
  fallback.tsx                   beauty pass estático por lente
```

Reglas:

- El chrome, THE BENCH y los sheets están en el HTML del servidor. La escena llega después y nunca bloquea leer un caso.
- Estado en un solo store chico (contexto o zustand si ya está en el repo). La escena lee el store por refs; no se suscribe a re-renders.
- Canvas del tamaño de su contenedor (`clientWidth` / `clientHeight`), no de `window`.
- En el DOM solo se animan `transform` y `opacity`.
- Al salir de `/fruit` se destruyen Lenis, ScrollTrigger y el renderer, y se liberan geometrías y texturas.
- No crear un framework de “experiencias”. Esto es código de `/fruit`.

## 14. Fases y criterios de aceptación

Una fase se cierra cuando cumple su criterio y Bruno la revisa. No se pasa a la siguiente antes.

| Fase | Entrega | Se acepta cuando |
| --- | --- | --- |
| 1. Chrome estático | DOM de los cuatro estados con copy real, sin WebGL, sobre el beauty pass | Los cuatro estados se ven a 375, 768 y 1440; el sheet y la puerta funcionan con teclado; EN/ES cambia todo el texto |
| 2. Cuarto + spline | Invernadero, banco, cuatro mesh, cámara 0→1, HUD, lentes automáticas | El scroll lleva de `0.00` a `1.00` con inercia y el HUD coincide con las estaciones |
| 3. Selección | Hover en índice y mesh, foco, atajos, skip-list, deep link | `?case=devias` abre el sheet de Devias en su estación; índice y mesh nunca se desincronizan |
| 4. Sheet + puerta | Diálogo, empuje de cámara, `/work/[slug]`, `mailto:`, noche en `1.00`, visitados | Reproducir el estado de cada fotograma da una imagen equivalente al tablero |
| 5. Craft | Las seis propuestas de la sección 9 | Cada una se puede apagar con un flag y el presupuesto de la sección 12 se sigue cumpliendo |
| 6. Piso | Reduced-motion, fallback, degradación por FPS, foco, `aria-*` | 60 fps sostenidos en un teléfono de gama media; Lighthouse accesibilidad ≥ 95; `/dev`, `/work/[slug]` y `/` no cargan `three`, `gsap` ni `lenis` (verificado en el bundle) |

## 15. Referencias

- Tablero visual: *fruit — The Bench (greenhouse, 4 states)*, cuatro artboards de 1440×900
- Brief maestro: `portfolio-master-brief.md`, sección Experiencia 2
- Contenido: `content/identity.ts`, `content/cases/`, `content/types.ts`
- Destino: `app/fruit/page.tsx`
