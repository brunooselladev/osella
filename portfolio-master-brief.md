# Bruno Osella — Portfolio Master Brief

> **Estado:** estrategia y especificación inicial. Todavía no es una orden de implementación.
>
> **Objetivo:** acordar el mensaje, el modelo de contenido y las reglas de evolución del portfolio antes de rediseñar o programar las experiencias.
>
> **Idioma de este brief:** español para reducir ambigüedades de ejecución. **Idioma principal del sitio:** inglés, con soporte en español.

---

## 0. Instrucciones para el agente que ya tiene acceso al repositorio

**Contexto de ejecución:** este brief se entrega a un agente de IA que ya tiene acceso al repositorio existente del portfolio. El portfolio ya está creado y cuenta con una implementación inicial de sus experiencias; este trabajo no empieza desde cero.

Usá el repositorio y la implementación actual como punto de partida real. Leé este brief completo y después inspeccioná el código, las rutas y el contenido existentes para entender qué está implementado, qué funciona, qué está incompleto y qué habría que cambiar para alcanzar la dirección propuesta. Si el código contradice una descripción de este brief, informá la diferencia: no asumas que una descripción, URL, texto o idea refleja exactamente el estado actual.

El objetivo inicial **no es reconstruir ni rediseñar el sitio**, sino comprenderlo y contrastarlo con la estrategia, proponer los cambios adecuados y acordar prioridades. No pidas a Bruno que te comparta archivos o detalles del repositorio a los que ya tenés acceso. No supongas que la arquitectura, las dependencias, los componentes o el contenido mencionados como objetivos ya existen en el proyecto.

### Reglas obligatorias

1. **No implementar todavía.** Esta fase es de estrategia, contenido y propuesta. No editar archivos, instalar dependencias, migrar rutas ni iniciar un rediseño hasta que Bruno apruebe el mensaje, el modelo de contenido y la dirección visual.
2. **Inspeccionar antes de recomendar.** Identificá framework, estructura, rutas, componentes compartidos, estilos, internacionalización, animaciones, estado actual de las tres experiencias y deploy. Informá qué existe realmente. No inventes arquitectura ni dependencias.
3. **No inventar hechos.** No inventes métricas, resultados, responsabilidades, clientes, escala, arquitectura, tecnologías utilizadas, testimonios ni contribuciones personales. Los datos no verificados deben marcarse como `NEEDS_CONFIRMATION` en la documentación interna y quedar fuera del contenido público.
4. **Separar aporte individual y resultado colectivo.** No atribuyas a Bruno el trabajo completo de un equipo ni un resultado del proyecto sin aclarar su contribución comprobable.
5. **Preservar lo que funciona.** No eliminar ni reemplazar experiencias, rutas, traducciones, accesibilidad, SEO, enlaces o interacciones existentes sin documentar primero el motivo y proponer un plan de preservación.
6. **No elegir tecnologías por moda.** No seleccionar librerías, frameworks ni dependencias durante esta fase. Más adelante, inspeccionar primero qué usa el proyecto y justificar cualquier cambio por necesidades concretas.
7. **Evitar el rediseño total como primera acción.** Trabajar por fases con entregables verificables. Una fase no habilita automáticamente la siguiente.
8. **Mantener el contenido independiente de la presentación.** El mensaje y los datos de cada caso deben poder reutilizarse en distintas experiencias sin duplicar ni contradecir información.
9. **Optimizar para personas reales.** La experiencia debe servir en desktop y móvil, tener carga razonable, navegación clara, accesibilidad, texto indexable y una ruta directa a contacto. La experimentación no debe impedir entender qué hace Bruno.
10. **Explicitar incertidumbres.** Cuando falte información, hacer una pregunta concreta o proponer opciones con sus ventajas y riesgos. No llenar los vacíos con suposiciones.

### Entregable de esta primera fase

Preparar una propuesta basada en lo que realmente encontraste en el repositorio, no un plan genérico. Debe incluir:

- mapa breve de la implementación actual: páginas/rutas, experiencias, componentes y contenido relevantes;
- qué conviene conservar, ajustar, reemplazar o investigar, con motivos concretos;
- mensaje principal y alternativas de copy;
- estructura narrativa propuesta para la home profesional;
- modelo de contenido reutilizable para casos de estudio y cómo encajaría en el código actual;
- concepto visual profesional original y diferenciación respecto de gaming y fruit;
- riesgos o impactos potenciales sobre rutas, contenido, responsive, accesibilidad, SEO, traducciones y deploy;
- lista de afirmaciones y datos que requieren verificación;
- etapas siguientes, criterios de aceptación y decisiones que requieren aprobación de Bruno.

Separá claramente **hallazgos del repositorio**, **recomendaciones** y **preguntas pendientes**. Cuando sea útil, citá rutas y archivos existentes para que Bruno pueda verificar a qué te referís. Evitá auditorías enormes: priorizá lo que cambia las decisiones de posicionamiento, contenido y experiencia.

**No editar archivos, implementar cambios, instalar dependencias ni abrir una PR en esta fase.** Esperá aprobación expresa antes de pasar a implementación.

---

## 1. Objetivo de posicionamiento

### La identidad que debe quedar

Bruno es un **builder y líder que conecta problemas de negocio, criterio técnico y personas para convertir necesidades reales en soluciones de software**. No se presenta como una lista de cargos ni como alguien definido por una sola tecnología. Puede comprender un problema, traducirlo a decisiones de producto e ingeniería, colaborar con un equipo y participar de la construcción y entrega.

El portfolio debe transmitir en conjunto:

- **Traducción negocio → tecnología:** entender qué necesita un cliente o negocio antes de elegir una solución.
- **Profundidad técnica:** experiencia práctica para evaluar opciones, tomar decisiones informadas y construir software; no solo coordinar tareas.
- **Liderazgo y delivery:** comunicación, coordinación, criterio, alineación de expectativas y avance hacia producción.
- **Relaciones interpersonales:** hacer de puente entre personas con necesidades, conocimientos y prioridades distintas.
- **Curiosidad e innovación:** explorar nuevas herramientas y enfoques —incluida IA cuando realmente aporta valor— sin confundir novedad con resultado.
- **Ownership:** capacidad de asumir responsabilidad, resolver problemas y sacar trabajo adelante; también a través de productos propios.

### Qué no debe comunicar

- “Soy solamente frontend developer”.
- “Soy un PM que delega todo lo técnico”.
- “Puedo hacer cualquier cosa” como promesa vacía.
- Una enumeración genérica de frameworks, cargos o buzzwords.
- Que la tecnología por sí sola resuelve un problema sin entender el contexto.
- Que Bruno hizo individualmente todo lo que produjo un equipo.
- Que todos los proyectos tienen métricas espectaculares, aunque no haya evidencia.

### Principio de marca

**La tecnología es una capacidad diferencial, no la propuesta de valor completa.** El visitante debe ver criterio para elegir qué construir, capacidad para construirlo y habilidad para ayudar a las personas a entregarlo.

### Audiencias principales

1. **Clientes y compradores de servicios**, incluidos los que encuentran a Bruno mediante Upwork: necesitan confiar en la comunicación, la comprensión del problema, la capacidad de ejecución y la previsibilidad del trabajo.
2. **Equipos de contratación:** buscan un perfil que conecte delivery, liderazgo técnico y construcción de producto.
3. **Founders y socios potenciales:** buscan alguien que pueda pensar un problema y convertirlo en algo real.

El portfolio no debe intentar hablarles a todos con un mensaje distinto. Debe presentar la misma identidad y facilitar que cada audiencia encuentre la información que necesita.

---

## 2. Mensaje principal: propuesta para validar

### Dirección recomendada

**Headline de trabajo:**

> I turn business problems into software that works.

**Supporting copy de trabajo:**

> I connect business goals, technical decisions, and the people building the product — from the first conversation to production. I bring hands-on engineering experience, project leadership, and a practical approach to emerging technology.

**Línea de apoyo opcional:**

> From understanding the problem to shipping the solution.

Estas frases son una propuesta estratégica, no copy final aprobado. Se deben probar contra las audiencias y ajustar para sonar natural, específico y creíble. Evitar claims grandilocuentes y fórmulas que podrían pertenecer a cualquier consultora.

### Por qué esta dirección

- Empieza con el problema del negocio, no con un cargo.
- Afirma que el resultado esperado es software útil y entregado.
- Deja espacio para demostrar habilidades técnicas sin convertir el hero en un inventario de tecnologías.
- Incluye personas y liderazgo en la propuesta, no como un agregado posterior.
- Es compatible con servicios freelance, oportunidades laborales y proyectos propios.

### El tono

- Directo, curioso, cálido y seguro sin arrogancia.
- Técnico cuando aporta claridad; comprensible para alguien no técnico.
- Orientado a decisiones, contribuciones y resultados.
- Con personalidad y humor sutil cuando el formato lo permite.
- Nunca lleno de frases vacías como “passionate innovator”, “digital ninja”, “rockstar developer” o “I bring ideas to life” sin una explicación concreta.

### CTA principal y alternativas

El copy final debe contemplar al menos dos siguientes pasos:

- **Explore my work** / **See how I work** para quienes quieren evaluar la experiencia.
- **Discuss a project** / **Get in touch** para clientes y oportunidades de colaboración.

La versión profesional debe permitir llegar a los proyectos y al contacto rápidamente. No exigir que el visitante explore un juego, una animación o un modo alternativo para entender a Bruno.

### Upwork

El sitio debe servir como prueba complementaria al perfil de Upwork. Priorizar señales que reducen el riesgo percibido por un cliente:

- comprensión del problema y buenas preguntas;
- alcance, restricciones y trade-offs;
- comunicación y colaboración;
- contribución personal claramente delimitada;
- evidencia verificable del trabajo;
- ejemplos de cómo Bruno trabaja, no solo qué tecnologías conoce;
- invitación concreta a conversar sobre el problema.

No afirmar que el sitio garantiza conversiones o trabajo en Upwork. El objetivo es mejorar la claridad, confianza y coherencia del perfil profesional.

---

## 3. Sistema de experiencias: una identidad, múltiples expresiones

### Regla central

Las experiencias son **distintas formas de explorar el mismo perfil**, no tres marcas personales con mensajes incompatibles. La identidad, los hechos, los proyectos y las contribuciones deben tener una fuente compartida. Cada experiencia puede cambiar el lenguaje visual, el ritmo, la navegación, la densidad de información y las interacciones.

### Experiencia 1 — Professional / principal

**Rol:** entrada por defecto, experiencia más clara y confiable para clientes, recruiters y Upwork.

**No queremos:** otra landing genérica de fondo oscuro, slogan grande, tres cards y una lista de tecnologías.

**Concepto creativo a explorar: “The Translation Engine”**

Una experiencia editorial e interactiva que hace visible el proceso de Bruno:

`Business problem → Product framing → Technical decisions → People & delivery → Shipped software`

La interfaz podría permitir explorar un mismo caso desde diferentes lentes —problema de negocio, decisiones de producto, ingeniería y delivery— sin convertirse en un dashboard genérico. La interacción debe explicar cómo piensa Bruno, no existir solo para impresionar.

Posibles recursos visuales a prototipar en diseño antes de programar:

- una frase o necesidad de negocio que se descompone visualmente en restricciones, decisiones y solución;
- una narrativa de proyecto donde el usuario cambia de perspectiva sin perder el hilo;
- un diagrama vivo o mapa de decisiones que se vincula a casos reales;
- transiciones y microinteracciones con propósito, con una alternativa estática accesible;
- tipografía editorial y composición propia, sin depender de la estética típica de portfolio SaaS.

Estas son direcciones de exploración, no una especificación visual cerrada. El equipo debe presentar 2–3 propuestas y explicar qué parte del posicionamiento hace visible cada una.

**Criterio de éxito:** en pocos segundos se entiende qué hace Bruno; en poco más de un minuto se encuentran pruebas de su aporte técnico, liderazgo y capacidad de traducir problemas en soluciones.

### Experiencia 2 — Fruit / experimental 3D

**Rol:** exploración sensorial y memorable, con una experiencia 3D interactiva como elemento distintivo.

**Dirección deseada:** un entorno orgánico, lúdico y vivo; no una versión profesional con imágenes de frutas pegadas encima. Puede usar crecimiento, transformación, capas, cosecha o ecosistemas como metáforas de construir productos y hacerlos evolucionar.

La interacción 3D debe tener un propósito dentro de la navegación o la historia, no ser solamente una escena decorativa. Los proyectos y el mensaje deben seguir siendo accesibles si el usuario no interactúa con la escena o si el dispositivo no puede renderizarla adecuadamente.

Antes de cualquier implementación, definir:

- qué puede explorar o modificar la persona;
- cómo la interacción conduce a proyectos, contribuciones o contacto;
- qué contenido es visible sin interactuar;
- cómo se comporta en móvil y con movimiento reducido;
- qué presupuesto de rendimiento y carga es aceptable;
- qué alternativa 2D o estática existe.

### Experiencia 3 — Gaming / interactiva

**Rol:** presentar el portfolio como una experiencia jugable, sin que el juego oculte la trayectoria profesional.

**Dirección deseada:** más interactiva que una página que simplemente se parece a una pantalla de videojuego. La exploración puede desbloquear secciones, permitir elegir misiones/casos o revelar decisiones y contribuciones. La interacción debe ser comprensible sin instrucciones extensas y tener una vía rápida hacia el contenido principal.

Requisitos:

- el visitante no debe verse obligado a completar un flujo largo para ver los proyectos;
- proporcionar navegación directa y controles accesibles;
- conservar una salida visible hacia contacto y una lectura convencional;
- evitar interacciones que fallen en teclado, táctil o móvil;
- mantener los mismos hechos y contribuciones que la versión profesional.

### Futuras experiencias

El sistema debe permitir agregar nuevas expresiones —por ejemplo, visualizaciones basadas en datos, una experiencia terminal, una narrativa tipo blueprint u otra idea futura— sin rediseñar el contenido central ni copiar todos los casos.

No se debe crear un framework de experiencias sobredimensionado antes de demostrar una necesidad real. Extensibilidad sí; abstracción prematura no.

---

## 4. Modelo de contenido: primero mi aporte, después la descripción del proyecto

### Principio editorial

Cada caso de estudio debe responder primero: **“What did Bruno contribute here?”** La empresa, el producto, el stack y la complejidad importan como contexto y evidencia; no deben desplazar la contribución individual.

La información de cada caso debe ser relativa al trabajo de Bruno: qué problema encontró, cuál era su responsabilidad, qué decisiones tomó, cómo colaboró, qué construyó o habilitó y qué cambió. Evitar descripciones que solo expliquen qué hace el producto.

### Orden narrativo recomendado para los casos

1. **Project / context** — una explicación breve y entendible del producto o cliente.
2. **The challenge** — el problema de negocio, usuario, equipo o ingeniería que necesitaba resolverse.
3. **My role** — el papel específico de Bruno, su alcance y límites.
4. **My contribution** — acciones concretas que realizó o decisiones en las que tuvo responsabilidad directa.
5. **Key decisions** — opciones, restricciones, trade-offs y razones para elegir una solución.
6. **Engineering & execution** — qué implementó técnicamente, cómo trabajó con otras personas y cómo se llevó a la práctica.
7. **Outcome / evidence** — impacto confirmado, evidencia o aprendizaje. Sin métrica verificable, usar una descripción cualitativa honesta o no publicar un resultado.
8. **Technology used** — stack relevante, con contexto sobre para qué se usó.
9. **Confidentiality note** si corresponde — explicar que algunos detalles, imágenes o datos se omiten por confidencialidad.

No todos los casos tienen que mostrar los nueve bloques con igual extensión. El modelo es común; la cantidad de detalle depende del caso, la evidencia disponible y el objetivo de mostrarlo.

### Ficha maestra por proyecto

Cada caso debe poder representarse con campos equivalentes a los siguientes. Los nombres son conceptuales; no presuponen formato ni tecnología de implementación.

| Campo | Propósito | Regla |
|---|---|---|
| `id` | Identificador estable | No depende del título o la URL visible. |
| `title` | Nombre público | Usar nombre real solo cuando esté permitido. |
| `client_or_product` | Cliente, empresa o producto | Respetar confidencialidad y permisos. |
| `project_type` | Categoría del trabajo | Ej.: e-commerce, ticketing, internal tooling. |
| `context` | Qué es y para quién | Máximo contexto necesario para entender el aporte. |
| `business_problem` | Necesidad o problema | Evitar una descripción puramente tecnológica. |
| `constraints` | Restricciones relevantes | Incluir solo las que puedan divulgarse. |
| `bruno_role` | Rol y responsabilidad | No elevar ni ampliar el cargo artificialmente. |
| `contribution` | Aportes personales concretos | Distinguir “I built/led/decided” de “we delivered”. |
| `decisions` | Decisiones y trade-offs | Explicar criterio; no inventar deliberaciones. |
| `collaboration` | Trabajo con equipo/cliente | Mostrar comunicación y liderazgo cuando corresponda. |
| `technical_work` | Trabajo técnico personal | Precisar qué hizo Bruno y qué hizo el resto del equipo. |
| `technologies` | Stack relevante | Incluir solo tecnologías realmente usadas en el caso. |
| `outcomes` | Cambios o resultados | Cada afirmación necesita validación y contexto. |
| `evidence` | Cómo se comprueba | Datos, artefactos, capturas autorizadas o evidencia descriptiva. |
| `confidentiality` | Límites de divulgación | Define nombres, datos, imágenes y detalles que pueden mostrarse. |
| `links` | Enlaces relacionados | Verificar URL y permiso antes de publicar. |
| `featured_lenses` | Perspectivas pertinentes | Ej.: engineering, delivery, innovation. No inventar lentes sin contenido. |
| `status` | Estado editorial | `draft`, `needs-confirmation`, `approved`, `published`. |
| `last_verified` | Última validación | Registrar cuándo se comprobaron los hechos. |

### Regla para las métricas

Las cifras que hoy aparezcan en una versión del sitio —por ejemplo, porcentajes de conversión, capacidad de tráfico o reducción de tiempo— **no se consideran verificadas por el hecho de estar publicadas**. Deben comprobarse antes de reutilizarlas.

Para cada métrica propuesta, registrar:

- valor, unidad, periodo y situación de comparación;
- fuente de evidencia y quién puede confirmarla;
- qué contribución hizo Bruno;
- qué parte corresponde al equipo, cliente, plataforma u otros factores;
- permiso para divulgarla, cuando sea necesario.

Si no puede verificarse, retirarla del copy público o reemplazarla por una descripción cualitativa sustentada. No estimar valores para que el portfolio parezca más fuerte.

### Selección inicial de casos

El núcleo inicial propuesto incluye:

- **Bucked Up:** caso de trabajo con cliente y liderazgo/delivery. Antes de redactar el contenido público, validar el rol, el alcance divulgable, la atribución y la autorización para mostrar nombre, capturas o detalles técnicos.
- **Imperio Tickets:** producto propio, útil para mostrar ownership, decisiones de producto, ingeniería y evolución. Distinguir claramente las contribuciones individuales de las de otros socios o colaboradores.
- **Trabajos freelance seleccionados:** incluir solo los que permitan explicar de forma concreta qué aportó Bruno. No es necesario mostrar todos los proyectos; seleccionar por fuerza de evidencia y variedad de capacidades.

No presentar “Internal Platform” ni ningún caso que no se haya confirmado como trabajo real y publicable. El repositorio o el contenido existente pueden incluir material de ejemplo: comprobar su autenticidad antes de convertirlo en una afirmación pública.

### Lentes reutilizables

Los casos pueden mostrarse desde distintas perspectivas, siempre que tengan contenido real para hacerlo:

- **Business:** objetivo, usuarios, restricciones y contexto.
- **Engineering:** decisiones técnicas, implementación, arquitectura y trade-offs.
- **Delivery:** planificación, coordinación, comunicación y entrega.
- **Innovation:** experimentación, IA, automatización o enfoque novedoso, cuando corresponda.

Las lentes son vistas editoriales del mismo caso, no cuatro relatos independientes con hechos inconsistentes. No todos los casos requieren las cuatro perspectivas.

---

## 5. Arquitectura conceptual escalable

Esta sección define principios y límites; no determina librerías, framework ni arquitectura de código. La propuesta técnica deberá basarse en una auditoría del proyecto real.

### Separaciones deseadas

1. **Identidad y mensaje:** descripción central, headline, CTA, biografía y datos profesionales.
2. **Contenido de proyectos:** casos, contribuciones, evidencia, enlaces, permisos y estado editorial.
3. **Idiomas:** textos equivalentes en inglés y español, sin duplicar la estructura de los casos.
4. **Definición de experiencias:** nombre, objetivo, identidad visual, interacciones, capacidades y requisitos propios de cada modo.
5. **Componentes o layouts compartidos:** navegación global, contacto, contenido común y utilidades que verdaderamente deban compartirse.
6. **Presentación específica del modo:** cada experiencia puede componer el contenido de manera diferente sin convertirse en la fuente de los hechos.

### Contrato de una experiencia

Cada modo futuro debería declarar, de una forma adecuada a la arquitectura real:

- identificador y nombre visible;
- propósito de la experiencia y audiencia principal;
- cómo se accede y cómo volver al modo principal;
- componentes visuales/interacciones propios;
- contenido común que consume;
- alternativa accesible y comportamiento en móvil;
- límites de rendimiento, movimiento y carga;
- estado de desarrollo: prototipo, experimental o publicado.

No todas las experiencias necesitan los mismos componentes. El objetivo es compartir contenido y reglas editoriales, no forzar todos los diseños dentro de una plantilla genérica.

### Navegación y descubrimiento

- La versión profesional es la entrada predeterminada.
- Los modos experimentales son visibles y fáciles de encontrar, pero no compiten con el mensaje inicial.
- La navegación entre experiencias debe ser clara y permitir volver al modo profesional en cualquier momento.
- Las URLs actuales y los enlaces compartidos deben auditarse antes de cualquier cambio. Proponer redirecciones o compatibilidad si se modifican rutas; no romper URLs existentes sin motivo.
- El contenido esencial —headline, descripción, proyectos y contacto— debe poder entenderse sin ejecutar interacciones complejas.

### Independencia tecnológica

El brief no prescribe Three.js, una librería de animación, un CMS, un framework ni un nuevo sistema de contenido. Primero se debe identificar la solución existente y evaluar si satisface las necesidades. Cualquier tecnología nueva requiere un motivo, alternativas, coste de mantenimiento y plan de fallback.

---

## 6. Requisitos no funcionales

- **Claridad:** el propósito y la identidad de Bruno se entienden en los primeros segundos.
- **Rendimiento:** priorizar una carga rápida; cargar escenas o recursos pesados solo cuando aporten valor y según el modo.
- **Accesibilidad:** navegación por teclado, foco visible, etiquetas comprensibles, contraste suficiente, alternativa a interacciones no convencionales y respeto por preferencias de movimiento reducido.
- **Responsive:** cada experiencia se diseña conscientemente para móvil y desktop, no solo se comprime.
- **Fallback:** si una interacción 3D o jugable no puede ejecutarse, el contenido principal permanece disponible.
- **SEO y compartibilidad:** títulos, descripciones, metadatos, URLs, textos indexables y previews coherentes con la versión profesional. Auditar la solución actual antes de modificarla.
- **Internacionalización:** inglés principal y español consistente. No traducir literalmente si se pierde naturalidad.
- **Privacidad y confidencialidad:** no publicar datos de clientes, código, capturas, números o información interna sin autorización.
- **Mantenibilidad:** la personalización visual puede crecer, pero debe seguir siendo posible actualizar un caso sin corregir manualmente todas las experiencias.
- **Honestidad:** no publicar resultados o afirmaciones que no puedan sostenerse.

---

## 7. Dirección de contenido del sitio

La jerarquía definitiva se valida después de aprobar el copy, pero debería responder a esta secuencia narrativa:

1. **Positioning:** qué problema ayuda a resolver Bruno y cómo combina negocio, tecnología y liderazgo.
2. **Proof:** casos de estudio donde su contribución queda clara desde el principio.
3. **How I work:** proceso de comprensión, framing, decisiones, colaboración y delivery; usar ejemplos, no solo valores declarados.
4. **Capabilities:** capacidades agrupadas por problemas que puede resolver, con tecnologías relevantes como prueba contextual.
5. **About:** experiencia, trayectoria y formación en Publicidad/comunicación solo con datos confirmados y en relación con el posicionamiento.
6. **Contact:** una invitación concreta y accesible para hablar de un proyecto o una oportunidad.

El contenido no necesita ocupar siempre estas secciones literales ni seguir el mismo orden en las tres experiencias. La versión profesional debe respetar el orden lógico de claridad → evidencia → confianza → contacto. Los modos alternativos pueden contar la misma historia de forma distinta.

---

## 8. Fases de trabajo y gates de aprobación

### Fase 0 — Inspección del portfolio existente y mapa de hechos

**Objetivo:** comprender la implementación que ya existe y detectar las diferencias entre el estado actual y el rumbo propuesto, sin cambiar código.

Tareas:

- inspeccionar el repositorio disponible: estructura, scripts, rutas, componentes, estilos, traducciones, SEO, responsive, interacciones y deploy según lo que realmente exista;
- revisar las versiones actuales professional/dev, fruit y gaming directamente en el código y en la experiencia renderizada, cuando sea posible;
- distinguir lo que ya funciona de lo que es placeholder, prototipo, inconsistente o está pendiente;
- identificar qué puede reutilizarse y qué parece acoplado a una sola experiencia;
- inventariar textos, métricas, títulos, fechas, tecnologías, enlaces y afirmaciones; indicar dónde aparecen y si requieren validación;
- clasificar los hechos como confirmados por Bruno, visibles pero no confirmados, sensibles o pendientes;
- detectar dependencias y riesgos de preservar o cambiar rutas, metadatos, navegación, traducciones y comportamiento responsive;
- formular solo las preguntas personales o de negocio que no se puedan responder inspeccionando el repositorio.

**Entregable:** diagnóstico conciso y específico del repositorio, con referencias a rutas/archivos existentes, recomendaciones priorizadas y preguntas que necesitan a Bruno.

**Gate:** Bruno valida los hechos personales y las restricciones de divulgación. La inspección no autoriza automáticamente el rediseño ni la implementación.

### Fase 1 — Estrategia y copy

**Objetivo:** cerrar el mensaje antes del diseño.

Tareas:

- proponer 2–3 variantes de headline, supporting copy y CTA en inglés;
- explicar qué audiencia atrae cada variante, qué enfatiza y qué sacrifica;
- definir la narrativa principal y el tono;
- alinear la presentación para clientes, contratación y Upwork sin crear tres identidades separadas;
- revisar el copy en español para que resulte natural;
- decidir qué información necesita estar visible de inmediato y qué puede quedar como detalle.

**Entregable:** documento de posicionamiento y copy aprobado.

**Gate:** no comenzar diseño de alta fidelidad hasta aprobar el mensaje central y la jerarquía narrativa.

### Fase 2 — Modelo y edición de casos

**Objetivo:** construir evidencia fiable del posicionamiento.

Tareas:

- completar las fichas de Bucked Up, Imperio Tickets y los trabajos freelance seleccionados;
- identificar aportes personales, tareas compartidas y resultados colectivos;
- verificar tecnologías, decisiones, métricas, links, nombres y permisos;
- redactar versiones corta y extendida de cada caso;
- seleccionar lentes relevantes por proyecto;
- eliminar o marcar los datos no verificados.

**Entregable:** contenido aprobado, reutilizable y con estado editorial registrado.

**Gate:** ningún caso se considera listo para publicar sin validar sus afirmaciones y revisar confidencialidad.

### Fase 3 — Dirección visual profesional

**Objetivo:** encontrar una experiencia profesional original, no una landing genérica.

Tareas:

- presentar 2–3 conceptos visuales distintos, incluidos una exploración de “The Translation Engine” y al menos una alternativa inesperada;
- demostrar cómo cada concepto convierte el mensaje en interacción y cómo destaca la contribución de Bruno;
- prototipar el hero, el paso a los proyectos y un caso de estudio;
- mostrar versión desktop y móvil;
- documentar accesibilidad, legibilidad, rendimiento y fallback;
- no elegir tecnología ni instalar paquetes en esta fase.

**Entregable:** concepto aprobado con prototipo o especificación visual suficiente para estimar implementación.

**Gate:** aprobar una dirección visual antes de desarrollar la experiencia profesional.

### Fase 4 — Plan técnico de evolución

**Objetivo:** elegir la forma menos compleja y más sostenible de implementarla.

Tareas:

- comparar el diseño aprobado con la arquitectura existente;
- proponer cómo separar contenido y experiencias;
- revisar si las dependencias actuales bastan;
- justificar toda nueva dependencia con alternativas, coste, rendimiento, mantenimiento y fallback;
- detallar impacto en rutas, SEO, internacionalización, accesibilidad y deploy;
- dividir el trabajo en entregas pequeñas.

**Entregable:** plan técnico con decisiones documentadas, riesgos, estimación relativa y criterios de aceptación.

**Gate:** aprobación antes de realizar cambios estructurales.

### Fase 5 — Implementación incremental de la experiencia profesional

**Objetivo:** publicar primero una experiencia sólida y coherente.

Orden recomendado:

1. preparar contenido aprobado y navegación;
2. implementar hero, proyectos y contacto;
3. construir la presentación detallada de un caso;
4. validar responsive, accesibilidad, rendimiento, idioma y SEO;
5. migrar los casos restantes;
6. comprobar enlaces, analítica disponible y comportamiento de deploy.

No usar placeholders o métricas ficticias en producción. Si falta contenido, ocultar el bloque o marcarlo como pendiente fuera de la vista pública.

**Gate:** revisión de Bruno en staging antes de publicar.

### Fase 6 — Experiencias experimentales

**Objetivo:** desarrollar fruit 3D y gaming sin degradar la versión principal.

- crear una prueba de concepto acotada para validar el concepto y los riesgos técnicos;
- definir interacción, controles, fallback y presupuesto de rendimiento antes de construir toda la experiencia;
- reutilizar las fichas de proyectos y la identidad central;
- no cargar recursos experimentales cuando el usuario está en el modo profesional y no los necesita;
- mantener links directos a casos y contacto;
- etiquetar las experiencias como experimentales si todavía no ofrecen una experiencia completa.

**Gate:** cada modo debe demostrar valor distintivo, funcionamiento en móvil y salida accesible antes de considerarse terminado.

### Fase 7 — Nuevas versiones y mantenimiento

**Objetivo:** habilitar evolución sin sobreestimulación ni deuda innecesaria.

Antes de agregar una experiencia, definir en una ficha breve:

- qué idea nueva explora;
- a quién sirve;
- qué aspecto del perfil demuestra;
- qué la hace diferente de los modos existentes;
- coste de creación y mantenimiento;
- criterio para conservarla, archivarla o eliminarla.

Agregar nuevas experiencias solo si ofrecen una forma genuinamente distinta de explorar la identidad común. No hace falta convertir cada idea en otro portfolio publicado.

---

## 9. Criterios generales de aceptación

La iniciativa avanza si se cumplen estos criterios, aunque cada fase tenga sus propios controles:

- el titular no reduce la identidad a frontend o a un cargo aislado;
- en pocos segundos se entiende que Bruno traduce problemas de negocio en soluciones técnicas y puede liderar la ejecución;
- los conocimientos técnicos aparecen en contexto y se pueden demostrar;
- los casos dan prioridad al aporte personal y separan con claridad contribución, colaboración y resultado colectivo;
- las métricas están verificadas o no aparecen;
- Bucked Up y cualquier proyecto de cliente respetan la confidencialidad;
- Imperio Tickets comunica claramente el rol real de Bruno y el trabajo compartido;
- la versión profesional funciona como experiencia completa sin explorar los otros modos;
- gaming y fruit tienen personalidad e interacción propias, pero no alteran los hechos;
- se puede agregar o actualizar un caso sin duplicar manualmente la información por cada modo;
- una nueva experiencia puede añadirse de forma acotada, sin construir prematuramente una plataforma compleja;
- en desktop y móvil, el contenido principal, los proyectos y el contacto siguen siendo accesibles;
- se preservan o migran de manera intencional las rutas, traducciones, metadatos y funcionalidades existentes.

---

## 10. Hechos pendientes de validar antes de publicar

El agente de contenido debe mantener una lista explícita —no resolverla adivinando— que incluya al menos:

- título profesional actual más representativo y fecha/alcance real del rol en Devias;
- descripción exacta de la responsabilidad de Bruno en la cuenta Bucked Up;
- qué trabajo implementó personalmente, qué lideró y qué realizó el equipo;
- permiso para nombrar clientes, mostrar capturas, arquitectura o detalles internos;
- rol de Bruno en Imperio Tickets frente al rol de socios y colaboradores;
- proyectos freelance que pueden hacerse públicos;
- autenticidad y fuente de cada métrica o afirmación de impacto publicada;
- tecnologías que se usaron realmente en cada caso;
- enlaces, demos y repositorios autorizados;
- datos biográficos, fechas y formación que se quieran incluir;
- vigencia del email de contacto, enlaces de perfil y opciones de idioma.

El hecho de que un dato aparezca actualmente en el sitio no implica que esté confirmado.

---

## 11. Observaciones del estado público actual

Auditoría inicial realizada el **13 de octubre de 2026**, basada en contenido públicamente visible. Debe contrastarse con el repositorio y con Bruno antes de modificarlo.

- Home: <https://osella.vercel.app/> — actualmente presenta las alternativas gaming, fruit y dev bajo la idea “Same portfolio. Three ways to see it”.
- Gaming: <https://osella.vercel.app/gaming> — utiliza una metáfora de videojuego y presenta casos con etiquetas de “loot” y métricas.
- Fruit: <https://osella.vercel.app/fruit> — utiliza una narrativa de crecimiento y presenta casos, biografía y timeline.
- Dev: <https://osella.vercel.app/dev> — incluye el headline “I turn complex problems into shipped products.”, proyectos, tecnología y trayectoria.
- LinkedIn: <https://www.linkedin.com/in/bruno-osella-051114133/> — la página no pudo inspeccionarse por completo en la auditoría inicial; no afirmar que su contenido haya sido revisado.

El contenido público actual incluye métricas, fechas, títulos y casos que no deben reutilizarse automáticamente. Verificarlos con el propietario antes de tratarlos como hechos.

---

## 12. Decisiones tomadas y decisiones abiertas

### Decidido por Bruno

- Audiencia: clientes y oportunidades laborales.
- Identidad: builder y líder.
- Mensaje central: traducir problemas de negocio en soluciones técnicas.
- Diferenciadores que se desean demostrar: experiencia técnica, delivery, innovación, liderazgo y relaciones interpersonales.
- Casos iniciales: Bucked Up, Imperio Tickets y trabajos freelance seleccionados.
- Idioma principal: inglés, con español disponible.
- Estrategia: una experiencia principal y versiones experimentales controladas.
- Fruit debe evolucionar hacia una experiencia 3D interactiva.
- Gaming debe incorporar interactividad más sustancial.
- La experiencia profesional necesita una idea visual más interesante que una landing convencional.
- Los casos deben destacar el aporte de Bruno, no limitarse a describir el producto o enumerar tecnologías.
- El portfolio también debe ser útil como material de apoyo para Upwork.

### Pendiente de aprobación

- Headline y supporting copy finales.
- Nombre y concepto visual de la experiencia profesional.
- Jerarquía definitiva de secciones.
- Copy y alcance público de cada caso.
- Qué métricas, capturas, nombres y datos pueden publicarse.
- Plan técnico derivado de una auditoría real.
- Implementación e introducción de dependencias, si fueran necesarias.

---

## Instrucción final para el agente coordinador

**Empezá por la Fase 0 y entregá diagnóstico, preguntas factuales y propuestas de copy. No implementes.** Luego presentá las decisiones pendientes en un formato breve, con recomendación y trade-offs. No adelantes fases por iniciativa propia. La prioridad es afinar el mensaje y el modelo de contenido; el diseño y la tecnología vienen después.
