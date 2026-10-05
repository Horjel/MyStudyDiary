# Plan técnico: mapa de calor

Documento de planificación; no contiene implementación. Referencias: constitución y especificación aprobada de esta funcionalidad. Los archivos de aplicación y tests enumerados aquí se crearán o modificarán en la fase de implementación, no al redactar este plan.

## 1. Estado actual y límites
- La aplicación usa scripts clásicos y funciona mediante file://. Se conservarán esa ejecución, el diseño de cuaderno y el formato de sesiones existente. [RF-1 a RF-7]
- Los cálculos de fechas y estadísticas están en app.js, junto con DOM, eventos y almacenamiento. Se extraerán los cálculos necesarios sin duplicar reglas. [RF-1, RF-2, RF-5, RF-6]
- loadSessions actualmente devuelve una colección vacía tanto ante ausencia de datos como ante un error. Esto deberá cambiar: un error de lectura no puede permitir guardar sobre un historial desconocido. [RF-7]
- El formulario admite decimales positivos sin límite de cifras: no se limitará silenciosamente la precisión ni se migrarán los registros. [RF-2, RF-4, RF-7]
- Identificadores en inglés; comentarios, mensajes y documentación en español. Sin frameworks, instalación de dependencias, servidor obligatorio, módulos ES ni build. [Transversal]

## 2. Archivos y responsabilidades
| Archivo | Operación prevista | Responsabilidad | Cobertura |
| --- | --- | --- | --- |
| study-logic.js | Crear | Fechas locales, validación, cálculos existentes extraídos y lógica pura del mapa, decimales y navegación. Sin DOM, almacenamiento, temporizadores ni lectura del reloj actual. | RF-1 a RF-7 |
| app.js | Modificar | Lectura y escritura protegidas, estado de aplicación, reloj, eventos, actualización de indicadores, pintado del mapa y gestión real del foco. | RF-4 a RF-7; integración RF-1 a RF-3 |
| index.html | Modificar | Cargar study-logic.js antes de app.js mediante scripts clásicos con defer; sección del mapa, leyenda, detalle y estado de error. | RF-1, RF-3 a RF-7 |
| styles.css | Modificar | Rejilla, cinco intensidades, días futuros, foco, selección y contenedor desplazable en móvil; selectores propios del mapa. | RF-1, RF-3 a RF-5, RF-7 |
| tests/study-logic.test.cjs | Crear | Casos de calendario, sumas, límites, formato, validación y selección; regresiones de rachas e indicadores. | RF-1 a RF-7 |
| tests/app.test.cjs | Crear | Integración acotada con reloj, almacenamiento y DOM mínimos simulados; errores, guardado y eventos. | RF-4, RF-6, RF-7 |
| AGENTS.md | Modificar | Documentar el archivo de lógica, node --test y la política de pruebas alineada con la constitución; conservar comprobación real mediante file://. | Transversal |
| MEMORY.md | Modificar | Resumir decisiones, resultados reales y pendientes; máximo aproximado de 50 líneas. | Transversal |

La constitución y la spec se mantienen como referencia, sin reescribir requisitos durante la implementación. El archivo adicional de lógica tiene una responsabilidad concreta; no se introducen capas de servicios ni directorios de componentes.

## 3. Contratos de lógica pura
Toda función dependiente del calendario recibirá today explícitamente: una fecha local de referencia suministrada por app.js. Las auxiliares que solo transforman valores recibirán esos valores, sin añadir un parámetro de hoy que no utilizan. No habrá valores por defecto que consulten el reloj. Ninguna función modificará las sesiones ni el objeto today recibido.

| Función prevista | Entradas y resultado | Cobertura |
| --- | --- | --- |
| localDateKey / parseLocalDate | Fecha local ↔ clave de calendario; reutilizar las reglas existentes. El analizador partirá de una fecha base fija y mediodía local, no del reloj actual; conservará el tratamiento correcto de años de cuatro cifras. | RF-1, RF-2, RF-5 |
| isValidSession / validateSessions | Registro o colección; resultado válido/inválido. Validar toda la colección, incluidos registros antiguos y futuros. | RF-2, RF-7 |
| decodeSessions | Texto guardado o ausencia; resultado discriminado ready con sesiones o read-error. Capturar JSON malformado aquí, y errores de acceso en app.js. | RF-7 |
| getHeatMapRange | today → lunes inicial, domingo final y clave de hoy, sin alterar today. | RF-1, RF-5 |
| toExactMinutes / addExactMinutes / compareExactMinutes | Valores decimales → representación exacta; suma y comparación sin redondeo binario intermedio. | RF-2, RF-3, RF-7 |
| sumDailyMinutes | Sesiones válidas y today → totales exactos de días visibles no futuros; conservar registros repetidos. | RF-2, RF-5 |
| getHeatLevel | Total exacto → nivel 0–4 conforme a los umbrales fijos. | RF-3 |
| formatHeatMinutes | Total exacto → texto español y descripción accesible; truncamiento, aproximación o menos de 0,001. | RF-4 |
| buildHeatMap | Sesiones y today → resultado ready u overflow; en ready, 84 días, doce semanas, referencias de meses y estado sin actividad hasta hoy. | RF-1 a RF-5, RF-7 |
| getNextHeatMapDate | Fecha enfocada, dirección y today → destino disponible o fecha original; desplazamientos de uno o siete días. | RF-4, RF-5 |
| resolveHeatMapInteraction | Selección, fecha enfocada, ubicación previa del foco, estado previo/actual del mapa y today → selección y destino de foco solicitado, sin tocar el DOM. | RF-4, RF-6, RF-7 |
| calculateStreak / calculateBestStreak / calculateWeeklyMinutes / calculateMonthlyStudyDays | Sesiones válidas y today explícito → cifras existentes; conservar reglas y detectar cuando el total semanal no es representable. | RF-6, RF-7 y regresión |

Modelo de día: fecha, semana y fila, condición de hoy/futuro, total exacto y nivel para días disponibles. Un futuro no tendrá un total cero ficticio ni un nivel de actividad. Un resultado de error no contendrá un mapa parcial utilizable.

### Precisión decimal y límites [RF-2, RF-3, RF-4, RF-7]
- Interpretar cada Number guardado mediante su representación decimal canónica, incluida la notación exponencial. No es posible recuperar cifras originales que nunca quedaron guardadas.
- Representar un decimal con coeficiente entero BigInt y escala decimal; al sumar, igualar escalas y sumar coeficientes. Mantener estas operaciones en auxiliares pequeñas, documentadas con ejemplos de décimas y milésimas.
- Comparar los umbrales contra el total exacto. Para presentación, truncar mediante cociente y resto a milésimas, sin convertir el total de nuevo a Number; agrupar la parte entera con formato español y quitar ceros fraccionarios finales.
- El máximo finito admitido será Number.MAX_VALUE. Comparar con su valor entero exacto convertido a BigInt, no con una conversión redondeada del total acumulado. Un exceso en cualquier día visible no futuro invalida el mapa completo.
- Evaluar el total semanal por separado con el mismo mecanismo exacto para detectar exceso: puede desbordarse al sumar varios días aunque ninguno invalide el mapa. Las rachas y el número de días continúan disponibles con historial válido. Conservar la presentación habitual del indicador semanal para valores representables.
- Esta representación es transitoria: nunca guardar BigInt ni modificar date, topic o minutes en localStorage.
- Ajuste de presentación solicitado por el usuario: desde 10⁹ minutos, formatHeatMinutes devuelve notación científica de cuatro cifras significativas y un texto decimal exacto adicional. El redondeo se hace con las cifras del coeficiente, sin convertir el total a Number. Descartado mostrar cientos de cifras por defecto: se consultan bajo un details nativo «Ver total completo», fuera de la región viva y cerrado al cambiar de selección. Los totales normales mantienen su formato.

## 4. Algoritmo en pseudocódigo
Este bloque expresa pasos de planificación, no código ejecutable.

### Construcción del mapa [RF-1, RF-2, RF-3, RF-5, RF-7]
1. Recibir historial validado y una única referencia de hoy.
2. Copiar hoy como día local a mediodía; retroceder hasta el lunes de su semana.
3. Retroceder once semanas de calendario para obtener el primer lunes; avanzar seis días desde el lunes actual para obtener el domingo final.
4. Preparar 84 fechas consecutivas, avanzando con operaciones de calendario local, nunca con bloques de milisegundos.
5. Para cada sesión válida, si su fecha está entre el primer lunes y hoy, añadir sus minutos exactos al acumulador de esa fecha. No eliminar sesiones iguales.
6. Si algún acumulador diario supera el máximo admitido, devolver estado de exceso sin casillas.
7. Para cada fecha: marcar hoy y futuro; para una fecha no futura, usar su acumulador o cero, calcular nivel y texto de consulta.
8. Agrupar en doce columnas de siete días. Identificar el mes inicial y cada primer día de mes; mantener todas las referencias de meses que correspondan a una misma columna.
9. Determinar si todos los días hasta hoy tienen total cero, ignorando sesiones futuras y exteriores.
10. Devolver intervalo completo, referencia de hoy, columnas, etiquetas y condición de vacío. La selección se resuelve por separado.

### Carga y guardado [RF-6, RF-7]
1. Al cargar, intentar leer la clave existente sin escribir ni eliminar nada.
2. Si no existe, aceptar historial vacío. Si falla el acceso, el análisis o la validación global, entrar en error de lectura y bloquear el registro tanto visualmente como en el manejador de envío.
3. Con historial válido, conservar las sesiones originales y calcular mapa e indicadores; distinguir error de cálculo de error de lectura.
4. Para guardar, verificar primero que la lectura fue válida; validar la nueva sesión y preparar una colección candidata sin mutar la actual.
5. Intentar guardar la candidata con el mismo formato. Solo después de éxito, convertirla en el historial en memoria y confirmar el guardado.
6. Ante fallo de escritura, conservar la colección anterior y el formulario; mostrar el fallo.
7. Tras finalizar cualquiera de los dos resultados de escritura, capturar hoy una sola vez, actualizar el periodo e indicadores con el historial efectivamente guardado y resolver selección/foco.
8. Si aparece exceso diario tras un guardado correcto, conservar su confirmación junto al error del mapa. No revertir datos ni bloquear nuevos registros por ese error de cálculo.

### Selección, reloj y recuperación [RF-4, RF-5, RF-6, RF-7]
1. Capturar selección y ubicación del foco antes de actualizar.
2. Si el nuevo mapa es válido: seleccionar hoy en carga/recuperación; en otros casos conservar la selección disponible o sustituirla por hoy.
3. Conservar el foco en su fecha si sigue disponible. Si desaparece o pasa a futura, llevarlo a hoy solo si estaba dentro del mapa. Al recuperarse de error, llevarlo a hoy solo si estaba en el mensaje de error.
4. Si el mapa entra en error: retirar selección y detalle, y trasladar el foco al mensaje solo si antes estaba en el mapa.
5. Comprobar el día con temporizador y con eventos de visibilidad, foco y retorno a la página. Antes de cualquier interacción del mapa, comprobar de nuevo el día para cubrir reanudaciones sin evento fiable.
6. Si cambia el día local en cualquier dirección, reconstruir el periodo; no modificar fechas guardadas ni volver a leer automáticamente un historial con error.

## 5. Interfaz y accesibilidad
### Estructura y pintado [RF-1, RF-3, RF-4, RF-5]
- Sección «Actividad de las últimas semanas» en la hoja principal, después del formulario y antes del historial; conserva el registro como primera tarea y da al mapa más ancho que la columna de indicadores.
- Encabezado con intervalo completo y «Actividad hasta hoy»; referencias de meses, siete filas con nombres de días, leyenda con los cinco rangos exactos y detalle persistente debajo.
- Usar una tabla con cabeceras de días y columnas de semanas: siete filas de datos y doce columnas de casillas. Las cabeceras semanales identificarán su fecha inicial para lectores de pantalla; las referencias visibles de meses podrán tener varias líneas.
- Cada fecha no futura contendrá un botón nativo con nombre accesible completo, estado de selección mediante aria-pressed y condición de hoy mediante aria-current. Las futuras mostrarán texto accesible de fecha y futuro, sin botón activable, con un tratamiento diferente de cero.
- Pintar a partir del modelo mediante creación de elementos y textContent, nunca interpolando datos del usuario como HTML. Asignar clases de nivel; el DOM no calcula fechas ni suma minutos.
- Mantener un único punto de entrada con Tab. Las flechas desplazan el foco sin cambiar selección; Enter/Espacio usan activación nativa. Al salir del mapa, el siguiente ingreso por Tab debe apuntar a la selección, aunque antes se hubieran recorrido otras fechas con flechas.
- Actualizar el detalle con región viva discreta; anunciar valor aproximado con palabras, no solo con el símbolo. No anunciar los 84 días cada vez que se guarda o cambia una selección.
- Antes de sustituir casillas, guardar fecha enfocada; restaurarla solo cuando corresponda. La casilla enfocada se hará visible dentro del contenedor desplazable sin desplazar innecesariamente toda la página.

### Estilos y móvil [RF-3, RF-4, RF-5 y requisitos no funcionales]
- Cinco tonos azules coherentes con el diario, con luminosidad decreciente. Verificar matemáticamente contraste mínimo 1,2:1 entre tonos contiguos antes de fijar la paleta.
- Texto fuera de las casillas con contraste ≥4,5:1. Hoy tendrá marca independiente; selección y foco tendrán contornos diferenciados, medidos contra cada fondo adyacente, con contraste ≥3:1.
- Casillas seleccionables de al menos 24 × 24 px, separación suficiente y rejilla de ancho intrínseco. A 375 px, desplazamiento horizontal solo en el contenedor del mapa; leyenda flexible y detalle con ajuste de líneas, incluidos totales muy largos.
- No usar selectores globales button para el mapa: acotar los estilos actuales del botón de guardar al formulario y definir los de casillas por su propia clase. Evitar que hereden márgenes, anchura completa o rellenos del formulario.
- Sin animaciones automáticas; respetar movimiento reducido en cualquier desplazamiento programático.

### Estados de error [RF-6, RF-7]
- Mantener separados el mensaje del formulario y el estado del mapa para permitir «Sesión guardada» junto a un error de cálculo.
- Error de lectura: formulario deshabilitado y envío rechazado incluso si se invoca programáticamente; listado e indicadores no muestran un vacío o cero engañoso. Mostrar «No disponible» y el mensaje literal de RF-7.
- Exceso diario: ocultar mapa, leyenda de actividad y detalle; mantener sesiones, formulario y estadísticas representables. Un exceso semanal independiente afecta únicamente a ese indicador.
- El mensaje de error del mapa será enfocable programáticamente y anunciado; no se insertará en el recorrido normal de Tab como si fuera una acción.
- Solo la recarga reintenta leer tras error de lectura. El exceso diario se reevalúa al actualizar datos o periodo y puede desaparecer al salir el día afectado del intervalo.

## 6. Decisiones técnicas y alternativas descartadas
| Decisión | Justificación y alternativa descartada | Cobertura |
| --- | --- | --- |
| Archivo pequeño de lógica compartida, script clásico | Permite tests directos sin DOM. Exposición de funciones al navegador y exportación CommonJS condicionada para Node; Node no es requisito de ejecución de la web. Descartados módulos ES/build por file:// y copiar las funciones en los tests porque dejarían de probar producción. | Todos los RF |
| Reutilizar helpers locales y extraer cálculos existentes | Un único criterio de fechas. Descartado crear otra familia de utilidades para el mapa o convertir fechas a UTC. | RF-1, RF-2, RF-5, RF-6 |
| today explícito en lógica; reloj solo en app.js | Pruebas deterministas y referencia coherente. Descartado consultar la hora dentro de cada renderizador/cálculo. | RF-1, RF-5, RF-6 |
| Aritmética decimal exacta con BigInt | La spec admite decimales arbitrarios y comparación exacta de umbrales. Descartados Number con tolerancia, redondeo a milésimas por sesión y librerías decimales: alteran reglas o añaden dependencias. | RF-2, RF-3, RF-4, RF-7 |
| Resultado de lectura discriminado, sin recuperación destructiva | Distingue ausencia legítima de historial desconocido. Descartado devolver [] ante todos los fallos, filtrar registros inválidos o sobrescribir para «reparar». | RF-7 |
| Reconstruir como máximo 84 días y preservar foco por fecha | Es pequeño, fácil de entender y estable ante cambios de semana. Descartados virtualización y actualizaciones diferenciales complejas. | RF-1, RF-4, RF-6 |
| Tabla y botones nativos, estado mínimo de selección/foco | Conserva relaciones de calendario y activación nativa. Descartados canvas y tooltip exclusivo de ratón por accesibilidad y mantenimiento. | RF-1, RF-4, RF-5 |
| Intervalo de comprobación de 15 segundos más eventos y comprobación previa a interacción | Deja margen operativo bajo el límite de 30 segundos cuando la página ejecuta tareas. Durante suspensión no hay garantía de temporizadores; se comprueba antes de consultar al reanudar. Descartado confiar solo en setInterval o solo en foco. | RF-6 |

No se añadirá una arquitectura de plugins, un controlador por requisito ni un formato nuevo de persistencia. La complejidad decimal responde a una exigencia explícita; se aislará y explicará para mantener el resto del proyecto comprensible.

## 7. Estrategia de pruebas sin dependencias
Comando único desde la raíz: `node --test`. Usar node:test y node:assert/strict; node:child_process para procesos con zona horaria fija y node:vm únicamente para integración del script de interfaz. No crear package.json ni instalar herramientas por esta funcionalidad.

### Pruebas unitarias de producción [RF-1 a RF-7]
- Importar las funciones exportadas por study-logic.js en tests .cjs. Verificar entradas sin mutación, resultados esperados y ausencia de dependencia del DOM o del reloj real.
- RF-1: exactamente doce semanas/84 días; lunes y domingo de los extremos, orden de filas/columnas, año visible, mes inicial y cambios de mes compartiendo semana.
- RF-2: vacío, repetidas, múltiples sesiones, registro a posteriori, exclusión exterior; diez veces 0,1 da 1; decimales en notación exponencial, valores muy pequeños y orden de sumandos distinto con igual resultado.
- RF-3: 0; 0,5; 29,999; 30; 59,999; 60; 119,999; 120; monotonicidad al sumar minutos. Resultados esperados fijados por criterios, no recalculados con la función que se prueba.
- RF-4: detalle entero/decimal, ≈29,999 para 29,9999, menos de 0,001, ceros finales, total enorme; destinos de las cuatro flechas y permanencia en límites/futuros; selección separada del foco.
- RF-5: hoy único, futuras sin nivel ni selección; sesión adelantada que cuenta cuando llega su fecha; actividad exclusivamente futura produce vacío hasta hoy.
- RF-6: domingo→lunes, cambio de mes/año, salto y retroceso de fechas, selección que sale del intervalo o se vuelve futura; referencia compartida sin mutar today.
- RF-7: texto malformado, colección inválida, fecha imposible, tema vacío, duración inválida; registro inválido exterior/futuro; ausencia de clave y colección vacía válidas; máximo exacto, exceso diario y exceso solo semanal; recuperación al salir el día desbordado del periodo.
- Regresión: racha viva desde ayer, varias sesiones por día, mejor racha antigua, futuras excluidas, semana de lunes a hoy y días únicos del mes.
- Ejecutar casos de calendario en procesos separados con TZ Europe/Madrid, America/New_York y Pacific/Auckland; fechas locales a las 00:30, cambios estacionales y febrero bisiesto. No cambiar TZ concurrentemente dentro del mismo proceso.

### Integración acotada con node --test [RF-4, RF-6, RF-7]
- Evaluar los scripts de producción con un DOM mínimo que represente solo los elementos usados, almacenamiento en memoria y reloj controlable; no recrear un navegador ni duplicar cálculos de producción.
- Acceso/JSON/validación fallidos: estado correcto y cero llamadas de escritura aunque se dispare un envío; contenido original intacto. Reintento solo al simular una nueva carga.
- Escritura rechazada: sesiones previas intactas, formulario conservado, mensaje de fallo y periodo actualizado con la referencia posterior al intento.
- Escritura correcta: datos con el formato original, render inmediato, confirmación independiente del exceso diario posterior y registro aún permitido cuando la lectura era válida.
- Reloj controlado cruzando medianoche durante intento de guardado: fecha de estudio conservada y una sola referencia posterior compartida por mapa e indicadores.
- Temporizador, visibilidad, foco, retorno a página y consulta tras reanudación: actualización previa a interacción y ausencia de relectura automática tras error.
- Foco externo no robado; foco interno válido conservado; fecha desaparecida→hoy; error→mensaje; recuperación→hoy solo cuando el foco estaba en el error.
- Estos dobles verifican coordinación y protección de datos, no semántica real de teclado, layout ni comportamiento del navegador.

### Verificación real en Chrome DevTools [RF-1 a RF-7]
- Abrir index.html por file:// en contexto aislado, sin borrar datos personales; probar sesiones hoy/ayer/anteayer, repetidas y a posteriori; recargar para confirmar persistencia.
- Inspeccionar tabla y nombres accesibles; probar Tab/Mayús+Tab, cuatro flechas, Enter/Espacio, ratón y toque; confirmar anuncios de detalle, aproximación y error.
- Capturas en escritorio y a 375 px; medir áreas de toque, ancho de documento y contrastes de todos los niveles, texto, foco y selección. Verificar acceso a las doce semanas y meses sin recortes.
- Usar datos aislados de exceso y de lectura inválida para comprobar mensajes, bloqueo, conservación, ausencia de resultados parciales y recuperación tras recarga con datos válidos.
- Revisar consola y peticiones: no recursos remotos requeridos; investigar cualquier error nuevo, distinguiéndolo del antecedente de seguridad file:// registrado en la memoria.
- Registrar comandos ejecutados, resultados, pruebas manuales y pendientes reales en MEMORY.md; no declarar verificados los comportamientos que solo se inspeccionaron en código.

## 8. Orden de implementación y cierre
1. Extraer lógica existente y asegurar regresiones; añadir suma exacta, periodo y modelo del mapa con tests. [RF-1, RF-2, RF-3, RF-5]
2. Separar errores de lectura/cálculo/escritura y proteger el envío, con pruebas de preservación. [RF-7]
3. Añadir sección, leyenda, detalle, navegación y estilos específicos; comprobar interacción y accesibilidad. [RF-1, RF-3, RF-4, RF-5]
4. Integrar reloj, guardado, recuperación y foco; cubrir eventos con pruebas y navegador. [RF-6, RF-7]
5. Ejecutar node --test, verificar Chrome en escritorio/móvil y actualizar instrucciones/memoria. Cerrar solo cuando todos los criterios de aceptación tengan evidencia o figuren expresamente como pendientes. [Todos los RF]

Este plan no autoriza por sí mismo a escribir código: la instrucción vigente de esta tarea es generar documentación.
