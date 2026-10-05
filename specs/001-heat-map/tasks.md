# Tareas: mapa de calor

Basadas en spec.md y plan.md. Implementación y verificaciones registradas el 05/10/2026; las casillas abiertas indican comprobaciones aún pendientes. Evidencias al final del documento.
Orden topológico de ejecución; las dependencias indicadas son requisitos previos. Estimaciones por tarea: 15–30 minutos, incluida su comprobación. Si una tarea supera 30 minutos, dividir el trabajo restante antes de continuar, conservando RF y criterios. No marcar una casilla sin evidencia.
Usar solo herramientas nativas y datos aislados. No modificar el formato de sesiones ni instalar dependencias. Actualizar MEMORY.md al terminar cada sesión de trabajo.

## A. Base y lógica existente

- [x] **T01 — Extraer utilidades de fecha y validación a study-logic.js.** 25 min. Dependencias: ninguna. RF: RF-1, RF-2, RF-5, RF-7.
  Hecho cuando: index.html carga el script clásico antes de app.js; no hay utilidades duplicadas, el analizador usa una base fija, y las funciones se importan desde Node sin DOM y funcionan mediante file://.

- [x] **T02 — Extraer cálculos existentes y hacer explícito today.** 25 min. Dependencias: T01. RF: RF-6, RF-7.
  Hecho cuando: las cuatro estadísticas reciben today desde app.js, la lógica no consulta el reloj y registrar una sesión actualiza las cifras como antes.

- [x] **T03 — Añadir pruebas de regresión de fechas y estadísticas.** 25 min. Dependencias: T02. RF: RF-1, RF-2, RF-5, RF-6.
  Hecho cuando: node --test ejecuta tests/study-logic.test.cjs con casos de racha desde ayer, récord antiguo, duplicados, futuras, total semanal, días mensuales y entradas no mutadas, todos correctos.

## B. Precisión, periodo y modelo

- [x] **T04 — Convertir minutos a decimal exacto.** 25 min. Dependencias: T03. RF: RF-2, RF-7.
  Hecho cuando: toExactMinutes representa enteros, decimales, notación exponencial y valores finitos extremos mediante coeficiente y escala; las pruebas importan la función de producción y pasan.

- [x] **T05 — Sumar y comparar decimales exactos.** 25 min. Dependencias: T04. RF: RF-2, RF-3, RF-7.
  Hecho cuando: las pruebas confirman diez veces 0,1 igual a 1, suma independiente del orden, comparación de escalas distintas y detección de exceso frente al límite exacto definido en el plan.

- [x] **T06 — Implementar los cinco niveles.** 15 min. Dependencias: T05. RF: RF-3.
  Hecho cuando: las pruebas de 0; 0,5; 29,999; 30; 59,999; 60; 119,999 y 120 devuelven los niveles previstos y añadir minutos nunca reduce el nivel.

- [x] **T07 — Formatear minutos para la consulta.** 25 min. Dependencias: T05. RF: RF-4.
  Hecho cuando: las pruebas verifican formato español, eliminación de ceros finales, ≈29,999 para 29,9999, descripción accesible de aproximación, menos de 0,001 y totales enormes sin convertirlos a Number.

- [x] **T08 — Calcular el intervalo y las 84 fechas locales.** 25 min. Dependencias: T03. RF: RF-1, RF-5.
  Hecho cuando: las pruebas obtienen doce columnas lunes–domingo, límites inclusivos, hoy único, futuras diferenciadas y referencias del mes inicial y cambios de mes, sin alterar today.

- [x] **T09 — Acumular sesiones por día visible.** 20 min. Dependencias: T05, T08. RF: RF-2, RF-5.
  Hecho cuando: sumDailyMinutes pasa pruebas de registros repetidos, múltiples sesiones, registro a posteriori, primer lunes incluido, domingo anterior excluido y sesiones futuras o exteriores ignoradas.

- [x] **T10 — Componer el modelo completo del mapa.** 25 min. Dependencias: T06, T07, T08, T09. RF: RF-1, RF-2, RF-3, RF-4, RF-5, RF-7.
  Hecho cuando: buildHeatMap devuelve intervalo, semanas, fechas, niveles y vacío hasta hoy; futuras sin nivel ni total ficticio; un exceso diario devuelve error sin mapa parcial, con pruebas correctas.

- [x] **T11 — Comprobar calendario en tres zonas horarias.** 25 min. Dependencias: T10. RF: RF-1, RF-5, RF-6.
  Hecho cuando: node --test lanza procesos aislados para Europe/Madrid, America/New_York y Pacific/Auckland y verifica 00:30, cambio estacional, febrero bisiesto, cambio de año y domingo→lunes sin fechas omitidas o repetidas.

## C. Validación, protección y pruebas de integración

- [x] **T12 — Distinguir historial vacío de historial inválido.** 20 min. Dependencias: T03. RF: RF-7.
  Hecho cuando: decodeSessions y validateSessions pasan casos de clave ausente, colección vacía, JSON malformado, estructura inválida y registro inválido antiguo/futuro; no filtran datos ni escriben almacenamiento.

- [x] **T13 — Preparar dobles mínimos de integración.** 25 min. Dependencias: T02, T12. RF: RF-6, RF-7.
  Hecho cuando: tests/app.test.cjs ejecuta scripts reales con reloj controlado, almacenamiento en memoria y DOM acotado; puede observar escrituras, mensajes y eventos sin instalar dependencias ni copiar lógica de negocio.

- [x] **T14 — Bloquear el registro tras una lectura inválida.** 25 min. Dependencias: T12, T13. RF: RF-7.
  Hecho cuando: un fallo de acceso o validación muestra el mensaje especificado, deshabilita el formulario y marca indicadores/listado como no disponibles; una prueba de envío programático confirma cero escrituras y datos originales intactos.

- [x] **T15 — Proteger el guardado y su referencia temporal.** 25 min. Dependencias: T14. RF: RF-6, RF-7.
  Hecho cuando: las pruebas verifican sustitución del historial en memoria solo tras escritura correcta, conservación del formulario y datos ante fallo, formato original sin BigInt y una referencia de hoy capturada después del intento, incluso a medianoche.

- [x] **T16 — Detectar exceso semanal independientemente del mapa.** 25 min. Dependencias: T05, T10, T15. RF: RF-6, RF-7.
  Hecho cuando: las pruebas distinguen exceso diario de suma semanal excesiva; únicamente los cálculos no representables quedan no disponibles, mientras rachas y días mensuales siguen correctos con historial válido.

## D. Interfaz básica y estados

- [x] **T17 — Añadir la sección semántica del mapa.** 20 min. Dependencias: T10, T14. RF: RF-1, RF-3, RF-4, RF-7.
  Hecho cuando: index.html contiene la sección entre formulario e historial, con espacios diferenciados para intervalo, tabla, leyenda, detalle y error; los identificadores son únicos y los títulos están asociados.

- [x] **T18 — Pintar calendario y cabeceras desde el modelo.** 25 min. Dependencias: T17. RF: RF-1, RF-2, RF-3, RF-5.
  Hecho cuando: un historial aislado produce siete filas y doce columnas, ambos extremos con año, «Actividad hasta hoy», meses compartidos consultables y futuras no activables; el pintado usa textContent y no calcula totales.

- [x] **T19 — Añadir detalle y selección mediante clic o toque.** 25 min. Dependencias: T07, T18. RF: RF-4, RF-5.
  Hecho cuando: hoy está seleccionado inicialmente, activar otra casilla actualiza el detalle persistente y aria-pressed, hoy comunica aria-current y las futuras nunca se seleccionan; los nombres accesibles incluyen fecha y total.

- [x] **T20 — Mostrar vacío, error de lectura y exceso diario.** 25 min. Dependencias: T14, T16, T19. RF: RF-6, RF-7.
  Hecho cuando: las pruebas diferencian ausencia de actividad hasta hoy, lectura fallida y exceso; el error retira mapa/detalle/selección, usa el texto literal de la spec y permite coexistir con «Sesión guardada» cuando procede.

## E. Teclado, selección y foco

- [x] **T21 — Calcular destinos de navegación por teclado.** 20 min. Dependencias: T08. RF: RF-4, RF-5.
  Hecho cuando: getNextHeatMapDate pasa pruebas de desplazamiento ±1/±7 días y permanencia al superar límites o alcanzar fechas futuras.

- [x] **T22 — Conectar teclado y punto único de Tab.** 25 min. Dependencias: T19, T21. RF: RF-4, RF-5.
  Hecho cuando: Tab entra por la selección, flechas solo mueven el foco, Enter/Espacio seleccionan y Tab/Mayús+Tab salen sin recorrer 84 días; tras salir y volver, la entrada vuelve a la selección.

- [x] **T23 — Resolver transiciones de selección y foco en lógica pura.** 25 min. Dependencias: T10, T21. RF: RF-4, RF-6, RF-7.
  Hecho cuando: resolveHeatMapInteraction pasa pruebas de selección conservada, fecha eliminada/futura→hoy, entrada en error y recuperación, sin solicitar mover un foco externo.

- [x] **T24 — Aplicar restauración de foco y anuncios.** 25 min. Dependencias: T20, T22, T23. RF: RF-4, RF-6, RF-7.
  Hecho cuando: las pruebas de integración conservan el foco válido al repintar, llevan el foco interno al error y a hoy al recuperar, respetan foco externo y actualizan regiones vivas de detalle/error sin anunciar todo el calendario.

## F. Actualización y recuperación

- [x] **T25 — Integrar carga y guardado con el mapa.** 20 min. Dependencias: T15, T20, T24. RF: RF-4, RF-6, RF-7.
  Hecho cuando: cargar selecciona hoy, guardar actualiza sin recarga el día afectado y su detalle, un fallo conserva actividad anterior y un guardado que causa exceso conserva tanto la sesión como la confirmación.

- [x] **T26 — Actualizar por temporizador y eventos del navegador.** 25 min. Dependencias: T25. RF: RF-5, RF-6.
  Hecho cuando: las pruebas con reloj controlado verifican intervalo de 15 segundos, visibilidad, foco, retorno a página y comprobación previa a interacción; toda actualización comparte today y no relee un historial fallido.

- [x] **T27 — Comprobar saltos de reloj y medianoche.** 25 min. Dependencias: T11, T26. RF: RF-1, RF-5, RF-6.
  Hecho cuando: las pruebas cubren avance/retroceso de día y zona horaria, semana nueva, sesión futura que se activa y guardado a medianoche; las fechas guardadas permanecen intactas y selección/foco siguen las reglas.

- [x] **T28 — Verificar recuperación y errores persistentes.** 20 min. Dependencias: T24, T26. RF: RF-6, RF-7.
  Hecho cuando: un fallo de lectura persistente mantiene bloqueo tras recarga, una recarga válida recupera hoy y un día desbordado que sale del periodo restaura el mapa; no existen reintentos automáticos de lectura.

## G. Diseño y adaptación

- [x] **T29 — Fijar paleta y leyenda verificables.** 20 min. Dependencias: T18. RF: RF-3.
  Hecho cuando: los cinco tonos comparten familia azul, su luminosidad decrece y cada par adyacente alcanza contraste ≥1,2:1; la leyenda muestra los cinco intervalos exactos y se registran las mediciones.

- [x] **T30 — Aislar estilos de casillas y estados.** 25 min. Dependencias: T22, T29. RF: RF-3, RF-4, RF-5.
  Hecho cuando: las casillas no heredan márgenes/anchura/rellenos del botón de guardar, miden al menos 24 × 24 px y distinguen hoy, futuro, foco y selección; el formulario mantiene su aspecto y funcionamiento.

- [x] **T31 — Adaptar tabla, leyenda y detalle a móvil.** 25 min. Dependencias: T30. RF: RF-1, RF-3, RF-4.
  Hecho cuando: a 375 px todas las semanas son consultables mediante desplazamiento interno, el documento no desborda, cabeceras y totales largos no se recortan y enfocar una casilla la hace visible respetando movimiento reducido.

## H. Verificación final y documentación

- [x] **T32 — Ejecutar la batería completa de Node.** 20 min. Dependencias: T28, T31. RF: RF-1 a RF-7.
  Hecho cuando: node --test desde la raíz descubre y supera todos los tests, incluidos procesos de zonas horarias, sin instalaciones; se registra el resultado y cualquier fallo genera una tarea correctiva sin cerrar esta.

- [x] **T33 — Probar el flujo normal mediante file://.** 25 min. Dependencias: T32. RF: RF-1, RF-2, RF-3, RF-4, RF-5, RF-6.
  Hecho cuando: Chrome DevTools en contexto aislado confirma carga, hoy/ayer/anteayer, duplicados, registro a posteriori, futura y recarga, con mapa e indicadores correctos y persistencia del formato original.

- [x] **T34 — Probar errores y conservación en Chrome.** 25 min. Dependencias: T33. RF: RF-6, RF-7.
  Hecho cuando: con datos aislados se comprueban lectura inválida y escritura rechazada, exceso diario/semanal, bloqueo y recuperación; el historial original no se sobrescribe durante error y los mensajes distinguen correctamente cada estado.

- [x] **T35 — Verificar teclado, toque y semántica accesible.** 25 min. Dependencias: T34. RF: RF-1, RF-4, RF-5, RF-6, RF-7.
  Hecho cuando: se registra evidencia de navegación y activación reales, entrada/salida por Tab, nombres y estados accesibles, anuncios de detalle/error con lector de pantalla y foco en cambios/errores; si falta alguna herramienta, esa comprobación queda pendiente y la tarea no se cierra.

- [x] **T36 — Medir contraste y capturar escritorio/móvil.** 25 min. Dependencias: T35. RF: RF-1, RF-3, RF-4, RF-5.
  Hecho cuando: existen capturas en escritorio y 375 px y mediciones que confirman casillas ≥24 × 24, texto ≥4,5:1, foco/selección ≥3:1 en todos sus fondos y tonos consecutivos ≥1,2:1; no hay recortes ni desbordamiento de página.

- [x] **T37 — Revisar consola y funcionamiento sin recursos externos.** 15 min. Dependencias: T36. RF: RF-6, RF-7; constitución.
  Hecho cuando: se revisan consola y peticiones tras carga/guardado/recarga por file://; cualquier error nuevo queda investigado y resuelto o bloquea el cierre, diferenciándolo del antecedente file:// de la memoria; no se requieren descargas externas.

- [x] **T38 — Actualizar instrucciones y cerrar trazabilidad.** 25 min. Dependencias: T37. RF: RF-1 a RF-7; constitución.
  Hecho cuando: AGENTS.md documenta study-logic.js y node --test; MEMORY.md resume decisiones, comandos, resultados y pendientes en unas 50 líneas; cada criterio de la spec tiene evidencia identificable en tests o registro manual y solo se marcan las tareas realmente completadas.

## Cobertura de referencia
| RF | Tareas principales |
| --- | --- |
| RF-1 | T01, T03, T08, T10, T11, T17, T18, T27, T31, T33, T35, T36 |
| RF-2 | T01, T03, T04, T05, T09, T10, T18, T33 |
| RF-3 | T05, T06, T10, T17, T18, T29, T30, T31, T33, T36 |
| RF-4 | T07, T10, T17, T19, T21–T25, T30, T31, T33, T35, T36 |
| RF-5 | T01, T03, T08–T11, T18, T19, T21, T22, T26, T27, T30, T33, T35, T36 |
| RF-6 | T02, T03, T11, T13, T15, T16, T20, T23–T28, T33–T35, T37 |
| RF-7 | T01, T02, T04, T05, T10, T12–T17, T20, T23–T25, T28, T34, T35, T37 |

T32 y T38 cubren transversalmente RF-1 a RF-7. La matriz orienta la ejecución; la evidencia debe cubrir cada criterio, no solo el identificador global del RF.

## Evidencias de ejecución (05/10/2026)
- Tests escritos primero: T01 falló inicialmente por módulo inexistente; posteriormente, los tests del mapa fallaron por funciones aún no implementadas. Resultado tras implementar: `node --test`, 20 tests, 20 correctos, 0 fallos.
- RF-1/RF-5: tests «periodo local completo» y «calendarios y cambios horarios»; Chrome confirma 84 casillas, siete filas, intervalo completo con años, hoy único y seis futuros no activables un lunes. Referencias completas de meses en cabeceras accesibles y abreviadas en pantalla.
- RF-2/RF-3: tests de sumas, niveles y modelo; Chrome sumó dos sesiones de 120 min en la misma fecha a 240, ubicó una sesión registrada a posteriori y excluyó la futura. Diez décimas suman exactamente uno en los tests.
- RF-4: tests de formato y navegación; Chrome verificó flechas, Enter, Espacio, salida con Tab y retorno con Mayús+Tab a la selección. A 375 px se comprobó activación en emulación táctil y consulta persistente. El árbol accesible comunica fechas, totales, aproximación, hoy y selección.
- RF-6: tests de eventos, fallo/éxito de escritura a medianoche y foco; Chrome guardó hoy/ayer/anteayer, mostró ambas rachas en 3 y recuperó sesiones tras recarga. Con reloj controlado se verificó avance a una fecha futura, retroceso con foco trasladado a hoy y cambio de semana.
- RF-7: tests de lectura global, exceso y recuperación; Chrome confirmó bloqueo de envío programático con historial inválido intacto, error persistente tras recarga, recuperación con datos válidos, escritura rechazada conservando formulario e historial, exceso diario con confirmación de guardado y exceso semanal con mapa aún disponible.
- T29/T30/T36: tonos #eef3ff, #b4c9f5, #799de0, #4268b4, #20365d; contrastes consecutivos 1,498 / 1,636 / 1,992 / 2,216. Texto secundario sobre blanco 6,014:1; contorno oscuro sobre separación blanca 12,020:1. Casillas de 26 × 26 px.
- T31/T36: capturas adjuntas en la sesión de Chrome a 1280 px y 375 px; documento móvil de 375 px sin desbordamiento. Desplazamiento interno permite llegar a las doce semanas. Total máximo finito consultable con ajuste de líneas y documento aún de 375 px.
- T37: peticiones de la aplicación limitadas a archivos locales; el icono nativo de fecha usa una URL de datos. Sin errores JavaScript en la consola de la página tras recargar. La consola conservada puede mostrar el error de seguridad file:// ya registrado antes de esta funcionalidad, sin impedir guardar o recuperar datos.
- T35: el usuario confirmó haber realizado las pruebas pendientes de T35/T38 y señaló como único problema restante la presentación de totales enormes. Cierre basado en su confirmación; la prueba hablada no fue ejecutada por el agente.
- Ajuste posterior de RF-4: desde 10⁹ min, cifra científica compacta y control nativo «Ver total completo», cerrado por defecto. Spec y plan actualizados. Tests de umbral, redondeo, máximo finito, precisión completa y transiciones: `node --test`, 22 correctos, 0 fallos.
- Chrome aislado a 375 px: máximo finito mostrado como «≈1,798 × 10³⁰⁸ min», detalle de unos 61 px de alto; total completo desplegable con Enter, sin desbordamiento y cerrado/oculto al cambiar a un día ordinario. Nombre accesible expresa el exponente con palabras. Consola vacía; datos originales conservados.
- T38: instrucciones, memoria, spec, plan y evidencias actualizados; las 38 tareas quedan cerradas. La comprobación manual anterior se atribuye al usuario y la del ajuste de presentación a tests/Chrome.

## Auditoría posterior de conformidad
El cierre anterior queda supersedido por esta auditoría: se reabren T24, T26 y T38. No se ha modificado el código de aplicación.
- `node --test`: 22 pruebas correctas, 0 fallos. Los tests de integración simulan elementos, no la ejecución real de eventos del desplegable.
- RF-1 a RF-5: Chrome aislado con reloj 07/10/2026 muestra 7 filas × 12 columnas, intervalo 20/07–11/10 con años, cabeceras de semanas con ambos meses, hoy seleccionado, cuatro futuros no activables, duplicados sumados y fecha exterior preservada. Los cinco niveles y leyenda coinciden.
- RF-4: navegador real verifica Tab, flechas sin cambiar selección, Enter/Espacio, salida y regreso con Tab/Mayús+Tab. Vista móvil 375 px, documento de 375 px, casillas 26 × 26 y desplazamiento interno. Contrastes consecutivos 1,498 / 1,636 / 1,992 / 2,216. No se repitió prueba de voz; se conserva confirmación previa del usuario.
- RF-6 FALLA: seleccionado 04/10 con total 10⁹ y foco en «Ver total completo»; adelantar reloj de 07/10/2026 a 01/01/2027 sin disparar evento y activar summary abre el total anterior con «Actividad hasta hoy: 7 de octubre». La consulta del desplegable no ejecuta el control previo de fecha requerido tras reanudación.
- RF-7 FALLA: guardar dos sesiones futuras de Number.MAX_VALUE para 08/10, volver a seleccionar 04/10 y enfocar summary; adelantar reloj a 08/10 y disparar foco de ventana. Aparece el error diario y se oculta el mapa, pero document.activeElement sigue siendo SUMMARY, no el estado de error. El control está dentro del mapa pero fuera de heatTable, que es la única zona reconocida para restaurar foco.
- Resto de RF-7: Chrome confirma historial inválido intacto tras envío programático, cuatro indicadores no disponibles, recuperación tras recarga válida, fallo de escritura con datos/formulario conservados y exceso diario con sesión confirmada y registro habilitado.
- Cobertura incompleta: cambio real de zona horaria durante una sesión, reanudación real tras suspensión y medición de latencia máxima de 30 s no están cubiertos por los tests actuales. Se verifican eventos/relojes simulados y temporizador configurado a 15 s, que no equivalen a esas pruebas completas.
- Criterios de finalización: aprobación previa y flujos normales verificados; criterio «todos los RF verificados» falla por los hallazgos. La protección de datos pasa los escenarios ensayados; documentación actualizada con limitaciones. Encabezado «Sin implementación» de spec.md desactualizado. Veredicto: cumplimiento parcial, no cerrar la spec hasta corregir y verificar los fallos.

## Corrección de los dos fallos del desplegable
- Tests escritos primero en tests/app.test.cjs: «consultar el desplegable tras reanudar actualiza la fecha y cancela una consulta obsoleta» y «foco del desplegable va al error y a hoy al recuperar, sin perder foco si sigue válido». Ambos fallaron antes de la corrección; después, `node --test`: 24 correctos, 0 fallos.
- RF-6/T26: click y keydown del desplegable comprueban la fecha antes de la activación nativa y cancelan la acción si la selección ha caducado o el mapa está en error; al recibir foco también se comprueba la fecha.
- RF-7/T24: el foco dentro del desplegable se considera foco del mapa; pasa al error cuando el mapa se oculta y a hoy al recuperarse. Si el día y el desplegable siguen disponibles, se conserva el foco original; los controles externos mantienen las reglas anteriores.
- Chrome aislado: salto 07/10/2026→01/01/2027 y click en summary actualiza periodo/selección, cierra/oculta el desplegable y enfoca hoy. Entrada en error al llegar 08/10 con dos sesiones futuras extremas enfoca heat-error; recuperación enfoca hoy. Repetido el control de fecha con Enter a 375 px, activación normal preservada y documento sin desbordamiento. Consola final vacía.
- T24 y T26 se vuelven a cerrar para los criterios de sus tareas. T38 permanece abierta por las comprobaciones globales pendientes de la auditoría (zona horaria durante una sesión y reanudación/plazo real); corregir estos dos fallos no equivale a repetir toda la auditoría.

## Ampliación de cobertura temporal
- Nuevo test «cambiar la zona horaria en una sesión recalcula hoy sin cambiar los registros»: proceso aislado cambia TZ Asia/Tokyo→America/Los_Angeles→Asia/Tokyo, manteniendo el instante fijo. Hoy retrocede/avanza, la sesión pasa a futura/activa, selección ajustada y texto guardado intacto. Correcto.
- Nuevo test «tras omitir temporizadores durante una suspensión se actualiza antes de consultar»: no entrega eventos ni ticks durante el salto y activa el desplegable. Antes de consultar, actualiza hoy y retira el total obsoleto. Correcto; es una simulación, no suspensión real de Chrome.
- `node --test`: 26 correctos, 0 fallos. No hubo cambios funcionales para esta ampliación de cobertura.
- Chrome con reloj controlado y temporizador real: cambio 04/10→05/10 detectado en 7.969,9 ms; página visible y con foco. Periodo pasó a 20/07–11/10. Dentro del límite de 30 s, sin invocar manualmente checkDayChange ni eventos de reactivación.
- Intento de prueba de retorno desde otra pestaña: DevTools mantiene la página inspeccionada visible y con foco; no genera un visibilitychange real en este entorno. No equivale a una suspensión y no se cuenta como prueba superada.
- T38 sigue abierta únicamente por esa validación en navegador de suspensión/retorno real (incluida página visible sin foco); los escenarios deterministas de reanudación y eventos sí pasan. Encabezado de la spec actualizado para retirar «Sin implementación».

## Cierre final
- El usuario confirmó haber realizado la prueba manual de retorno solicitada y que funciona bien. Esta evidencia procede del usuario, no de Chrome DevTools del agente; no se especificaron duración ni fecha del escenario.
- T38 cerrada tras registrar esa confirmación en la memoria. Las 38 tareas quedan completadas; los fallos históricos de la auditoría fueron corregidos y la última batería automática pasó 26/26. No se ha cambiado código en este cierre documental.
