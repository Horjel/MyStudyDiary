# Mapa de calor del estudio

Estado: aprobada por el usuario e implementada; verificación y limitaciones registradas en tasks.md y en la memoria del proyecto.

## Contexto y objetivo
El Diario de Estudio permite registrar sesiones y consultar rachas, minutos semanales y días estudiados este mes. El mapa permitirá reconocer la distribución del esfuerzo y los días sin actividad durante las últimas semanas, sin confundir duración con constancia.
La intensidad representa minutos acumulados por día, no el número de sesiones ni una valoración de la persona.

## Usuarios
Personas que registran su estudio y quieren reconocer sus hábitos recientes, tanto desde un ordenador como desde un móvil.

## Historias de usuario
- Como estudiante, quiero ver mis últimas semanas para identificar continuidad y pausas.
- Como estudiante, quiero distinguir los días de mayor duración para comprender cómo distribuyo mi tiempo.
- Como estudiante, quiero consultar la fecha y los minutos de un día sin depender de distinguir colores.
- Como estudiante, quiero que las sesiones registradas a posteriori aparezcan en su día de estudio para obtener un historial fiel.

## Requisitos funcionales y criterios de aceptación

### RF-1. Periodo visible
Mostrar doce semanas naturales: la actual y las once anteriores, según el calendario local. El periodo fijo permite comparar el esfuerzo sin configurar la vista.
- CUANDO se muestre el mapa, EL sistema DEBERÁ presentar doce columnas de semanas, de la más antigua a la izquierda a la actual a la derecha, con siete días de lunes a domingo de arriba abajo.
- MIENTRAS el mapa esté disponible, EL sistema DEBERÁ mostrar el intervalo completo desde el lunes de la semana más antigua hasta el domingo de la actual, incluidos sus años, y aclarar «Actividad hasta hoy» con la fecha local de hoy.
- MIENTRAS el mapa esté disponible, EL sistema DEBERÁ identificar las siete filas con sus días de la semana y señalar cada cambio de mes en la columna que contenga su primer día; si hay dos meses en una columna, ambas referencias deberán ser consultables.
- CUANDO una fecha quede fuera del intervalo visible, EL sistema DEBERÁ excluirla del mapa sin modificar su sesión.

### RF-2. Total diario
Sumar la duración de todas las sesiones válidas de cada fecha de estudio, incluidas las registradas posteriormente. Una sesión válida tiene fecha real, tema no vacío y minutos numéricos, finitos y mayores que cero.
- CUANDO existan varias sesiones válidas para una fecha visible no futura, EL sistema DEBERÁ representar la suma de todos sus minutos, incluidos los decimales.
- CUANDO una fecha visible no futura carezca de sesiones y los datos se hayan leído correctamente, EL sistema DEBERÁ representar cero minutos.
- CUANDO dos sesiones guardadas tengan los mismos valores, EL sistema DEBERÁ contar ambas como registros independientes.
- CUANDO se sumen duraciones decimales, EL sistema DEBERÁ obtener el resultado de la suma decimal de los valores guardados, sin redondear cada sesión ni desplazar un resultado exacto a otro intervalo por errores de representación numérica.

### RF-3. Intensidad y leyenda
Usar umbrales fijos para que el mismo tiempo conserve su significado entre semanas; un aumento dentro del mismo intervalo no cambia el tono.
- MIENTRAS se muestre el mapa, EL sistema DEBERÁ aplicar cinco niveles: 0 minutos; más de 0 y menos de 30; de 30 a menos de 60; de 60 a menos de 120; y 120 o más.
- CUANDO el total diario pase a un intervalo superior, EL sistema DEBERÁ mostrar una intensidad mayor.
- MIENTRAS se represente actividad, EL sistema DEBERÁ usar una misma familia de color con luminosidad estrictamente decreciente entre niveles; cada par de niveles consecutivos deberá tener una relación de contraste de al menos 1,2:1. El detalle textual permitirá distinguirlos sin depender del color.
- MIENTRAS se muestre el mapa, EL sistema DEBERÁ presentar una leyenda con los cinco intervalos y su correspondencia visual.

### RF-4. Consulta de un día
Ofrecer información precisa también a quienes no distinguen los tonos.
- CUANDO la persona seleccione mediante ratón, toque o teclado un día visible no futuro, EL sistema DEBERÁ mostrar su fecha completa y sus minutos totales en texto.
- CUANDO se abra o recargue la página con datos válidos, EL sistema DEBERÁ seleccionar hoy y mostrar su detalle.
- CUANDO se acceda al mapa con Tab, EL sistema DEBERÁ situar el foco en el día seleccionado; las flechas arriba y abajo DEBERÁN moverlo un día atrás o adelante, y las flechas izquierda y derecha siete días atrás o adelante. Si el destino queda fuera del periodo o es futuro, el foco DEBERÁ permanecer en su posición.
- CUANDO se pulse Enter o Espacio sobre un día enfocado, o se haga clic o se toque una casilla disponible, EL sistema DEBERÁ seleccionar ese día. Mover el foco sin activarlo no DEBERÁ cambiar la selección; Tab y Mayús+Tab DEBERÁN permitir salir del mapa sin recorrer todas las casillas.
- MIENTRAS exista un día seleccionado y los datos sean fiables, EL sistema DEBERÁ mantener visible su detalle hasta seleccionar otro día, salir de la página o quedar esa fecha fuera de los días disponibles.
- CUANDO se presente un total decimal, EL sistema DEBERÁ usar formato español y hasta tres decimales visibles, eliminando ceros finales. Si hay cifras adicionales no nulas, DEBERÁ truncar a tres decimales y anteponer «≈» junto con una indicación accesible de valor aproximado; si el total positivo es menor que 0,001 minutos, DEBERÁ indicar «Menos de 0,001 min». La intensidad DEBERÁ corresponder al total sin truncar.

- CUANDO un total sea igual o superior a 1.000.000.000 minutos, EL sistema DEBERÁ mostrarlo en notación científica con cuatro cifras significativas, redondeadas al valor más próximo (mitades hacia arriba), y señalar si es aproximado. La descripción accesible DEBERÁ expresar con palabras el exponente. Esta regla sustituye la presentación decimal ordinaria para estos totales extremos.
- CUANDO se muestre un total abreviado, EL sistema DEBERÁ ofrecer «Ver total completo», contraído inicialmente, que permita consultar el total decimal exacto sin alterar la intensidad ni los datos. Al cambiar de día seleccionado, DEBERÁ cerrarse; para totales ordinarios o errores, DEBERÁ ocultarse.

### RF-5. Hoy y fechas futuras
Separar los días aún no transcurridos de los días sin estudio.
- MIENTRAS hoy pertenezca al mapa, EL sistema DEBERÁ identificarlo visualmente y mediante texto accesible.
- CUANDO una casilla corresponda a una fecha futura de la semana actual, EL sistema DEBERÁ identificarla como futura, deshabilitar su selección y excluir sus sesiones de la intensidad.
- CUANDO llegue la fecha de una sesión guardada por adelantado, EL sistema DEBERÁ incluirla en el total de ese día.

### RF-6. Actualización
Mantener la representación coherente con las sesiones y el paso del tiempo.
- CUANDO se abra o recargue el diario y los datos estén disponibles, EL sistema DEBERÁ representar las sesiones guardadas del intervalo visible.
- CUANDO se guarde correctamente una sesión, EL sistema DEBERÁ actualizar el mapa sin requerir recarga.
- CUANDO falle el guardado de una sesión, EL sistema DEBERÁ conservar los datos previamente guardados, informar del fallo y mantener la actividad basada en esos datos; el periodo podrá cambiar si cambia la fecha local.
- MIENTRAS la página esté visible y su ejecución no esté suspendida, aunque no tenga el foco, EL sistema DEBERÁ detectar cambios en la fecha local en un máximo de treinta segundos. CUANDO vuelva a estar visible, recupere el foco o se reanude tras una suspensión, DEBERÁ actualizarse antes de permitir una nueva consulta del mapa.
- CUANDO la fecha local avance o retroceda por medianoche, ajuste de reloj o cambio de zona horaria, EL sistema DEBERÁ recalcular el periodo y hoy sin cambiar las fechas de estudio guardadas.
- CUANDO se actualice la representación, EL sistema DEBERÁ usar una única fecha local de referencia para todo el mapa y su detalle; si coincide con un guardado, la referencia DEBERÁ ser la vigente tras finalizar ese intento de guardado, conservando la fecha de estudio elegida por la persona.
- CUANDO una actualización afecte al día seleccionado, EL sistema DEBERÁ actualizar su detalle; SI ese día abandona el periodo o pasa a ser futuro, DEBERÁ seleccionar hoy. Si el foco estaba en una casilla que deja de estar disponible, DEBERÁ trasladarlo a hoy; si estaba fuera del mapa, no DEBERÁ moverlo.

### RF-7. Ausencia de actividad y errores
No presentar datos desconocidos como ausencia de estudio.
- CUANDO la lectura sea correcta y no haya actividad desde el primer lunes visible hasta hoy, aunque existan sesiones futuras o anteriores al intervalo, EL sistema DEBERÁ mostrar los días transcurridos a cero y el mensaje «No hay sesiones entre el inicio del periodo y hoy. Registra una sesión para verla aquí».
- SI no puede leerse el historial o lo leído no es una colección de sesiones válidas, ENTONCES EL sistema DEBERÁ mostrar «No se puede leer el historial. Recarga la página para volver a intentarlo», deshabilitar el registro de sesiones y marcar el mapa y los indicadores dependientes del historial como no disponibles. La ausencia de historial guardado o una colección vacía válida DEBERÁN tratarse como ausencia de sesiones, no como error.
- SI cualquier registro del historial es inválido, aunque esté fuera del periodo o sea futuro, ENTONCES EL sistema DEBERÁ aplicar el error de lectura al historial completo, sin mostrar resultados parciales como fiables ni sobrescribir los registros originales.
- SI la suma de un día visible no futuro supera el mayor total numérico finito admitido por el diario, ENTONCES EL sistema DEBERÁ mostrar «No se puede mostrar la actividad porque un total diario es demasiado grande», sin presentar el mapa ni permitir consultas del mismo. Solo los indicadores cuyo propio cálculo no sea representable DEBERÁN marcarse como no disponibles; el registro de nuevas sesiones seguirá permitido mientras el historial sea válido.
- CUANDO un guardado correcto provoque ese exceso de total diario, EL sistema DEBERÁ conservar la sesión guardada, confirmar su guardado y mostrar el error de cálculo; no DEBERÁ afirmar que las sesiones no se han modificado.
- MIENTRAS el mapa esté en error, EL sistema DEBERÁ retirar el detalle y la selección anteriores y mostrar el estado de error como texto accesible; si el foco estaba en el mapa, DEBERÁ trasladarlo a ese estado sin mover el foco de otros controles.
- CUANDO se recargue tras un error de lectura, EL sistema DEBERÁ volver a leer y validar el historial; si el error persiste, DEBERÁ mantener el estado de error y el bloqueo del registro. No habrá reintentos automáticos de lectura en esta versión.
- CUANDO una recarga permita recuperar datos válidos o una actualización del periodo elimine el exceso de total diario visible, EL sistema DEBERÁ volver a mostrar el mapa, retirar su error y seleccionar hoy. La recuperación solo DEBERÁ mover el foco al día de hoy si este estaba en el estado de error del mapa.

## Requisitos no funcionales
- Interfaz y mensajes en español, con vocabulario coherente con el diario existente.
- Todas las consultas disponibles mediante teclado, ratón y pantalla táctil; cada día deberá comunicar fecha, total, condición de hoy y selección cuando corresponda. Los futuros deberán comunicar fecha y condición de futuro. Detalles y errores nuevos deberán anunciarse sin depender exclusivamente del color o de pasar el ratón.
- Texto con contraste mínimo 4,5:1; indicadores de foco y selección con contraste mínimo 3:1 frente al fondo adyacente. Cada casilla seleccionable tendrá un área de interacción mínima de 24 × 24 px.
- A 375 px de ancho, las doce semanas y la leyenda deben poder consultarse sin recortar información ni provocar desplazamiento horizontal de toda la página; se permite desplazamiento dentro del mapa.
- Fechas basadas en el calendario local, sin desplazamientos por zona horaria ni cambios de horario estacional.
- Conservación de las sesiones y de las reglas de cálculo de los indicadores existentes cuando los datos sean válidos; los estados de error de RF-7 prevalecen sobre la presentación normal de cifras. Consultar el mapa no modifica datos.
- Comportamiento comprobable con datos de prueba aislados de las sesiones reales del usuario.

## Casos límite
- Historial vacío o actividad solo anterior al periodo: días transcurridos a cero; futuros deshabilitados.
- Primer lunes visible: incluido; domingo anterior: excluido. El domingo de la semana actual cuenta solo cuando llegue su fecha.
- Cambio de domingo a lunes: entra una semana y sale la más antigua; el mapa mantiene doce columnas.
- Cambio de mes o año, febrero bisiesto, sesiones a las 00:30 y cambio de horario: cada registro conserva su fecha de estudio local.
- Sesiones de 10 y 20 minutos el mismo día: total 30 y nivel de 30 a menos de 60.
- Totales 0, 0,5, 29,999, 30, 59,999, 60, 119,999 y 120: niveles determinados por los límites exactos, antes del formato de presentación.
- Total 29,9999: detalle «≈29,999 min» y nivel inferior a 30; total 0,0004: «Menos de 0,001 min» y primer nivel positivo. Diez sesiones de 0,1 min suman 1 min, sin aproximación visible.
- Duración muy alta pero finita: nivel máximo y consulta de su total; suma no finita: error visible.
- Registro a posteriori: actualiza su fecha si está visible; si está fuera del periodo, no altera el mapa.
- Fallo de lectura frente a fallo de guardado: el primero impide presentar actividad fiable; el segundo conserva el último mapa válido.
- Historial con estructura inválida, registro inválido antiguo o futuro: error global de lectura; no se permite guardar. Historial ausente o colección vacía: estado vacío válido.
- Actividad solo futura: días transcurridos a cero y mensaje de ausencia de actividad hasta hoy.
- Cambio de zona horaria, salto o retroceso del reloj y guardado a medianoche: aplicar la fecha local de referencia sin desplazar las fechas de estudio elegidas.
- Selección o foco en el día que sale del intervalo o se vuelve futuro: selección y, cuando corresponda, foco pasan a hoy.
- Fallo transitorio y recarga: recuperar el mapa y seleccionar hoy solo tras validar correctamente los datos; con fallo persistente se mantiene el error.

## Fuera de alcance
- Elegir otro intervalo, navegar a periodos anteriores o comparar periodos.
- Filtrar por tema, mostrar el detalle de cada sesión, editar o borrar sesiones desde el mapa.
- Objetivos diarios, premios, notificaciones, predicciones y recomendaciones.
- Exportar, compartir o sincronizar el mapa.
- Personalizar colores o umbrales; escalas relativas al máximo de cada usuario.
- Reparar automáticamente registros inválidos o gestionar varias pestañas simultáneas.

## Criterios de finalización
- Especificación aprobada antes de implementar.
- Todos los criterios RF-1 a RF-7 verificados, incluidos límites de intensidad, fechas locales, errores y cambios de semana.
- Consulta comprobada con teclado y toque, así como en escritorio y a 375 px de ancho.
- Lectura tras recarga y actualización tras guardado comprobadas con datos aislados; ausencia de pérdida de sesiones y de regresiones en los indicadores existentes.
- Resultados de verificación y posibles limitaciones registrados en la memoria del proyecto, conforme a la constitución; ningún criterio pendiente se declara cumplido.

## Dudas abiertas
No quedan dudas de alcance tras la delegación de decisiones y la aprobación. Cualquier ambigüedad nueva se registrará como [NECESITA ACLARACIÓN] antes de implementar.
