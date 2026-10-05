# Memoria del proyecto

## Estado actual
- Repositorio público creado: https://github.com/Horjel/MyStudyDiary, rama main. Git inicializado; .gitignore excluye dependencias, configuración local y credenciales. Preparación para publicación verificada con node --test (26/26).
- Constitución en `docs/constitution.md`; spec, plan, tareas y evidencias del mapa en `specs/001-heat-map/`.
- Mapa implementado: doce semanas, intensidad por minutos diarios, detalle por selección, fechas futuras diferenciadas y actualización al cambiar de día.
- Las 38 tareas cerradas: fallos del desplegable corregidos, zona horaria en sesión y plazo real verificados. El usuario confirmó que la prueba manual pendiente de suspensión/retorno funciona bien; evidencia atribuida al usuario, como la prueba de voz anterior.
- Stack sin dependencias ni build; funciona mediante `file://`. Reglas permanentes en `AGENTS.md`.

## Organización y datos
- `study-logic.js`: fechas, validación, cálculos y modelo del mapa; recibe `today` explícito y exporta funciones para Node. Se carga antes de `app.js`.
- `app.js`: lectura/escritura, eventos, reloj, pintado y foco. `updateIndicators` comparte una fecha entre estadísticas y mapa; `renderSessions` pinta el listado.
- LocalStorage conserva su clave y el array de sesiones original; representación decimal con BigInt solo transitoria para sumar y comparar sin redondear umbrales.
- La lectura inválida bloquea guardar, incluso por envío programático. Un exceso diario oculta el mapa pero permite guardar; el exceso semanal afecta solo al indicador semanal.
- Guardado exitoso se confirma aunque el mapa exceda su límite; fallo de escritura conserva historial y formulario. Solo recargar reintenta una lectura fallida.

## Fechas, indicadores e interacción
- Racha actual puede terminar ayer; para el mensaje de estudio completado se exige sesión con fecha local de hoy. Futuras no cuentan hasta su fecha.
- Mejor racha incluye registros a posteriori. Semana de lunes a hoy; mes cuenta fechas únicas desde el día 1. Duplicados suman minutos, no días.
- Selección y foco son independientes: flechas ±1/±7 días, Enter/Espacio seleccionan, un punto de entrada con Tab. Casilla retirada/futura → hoy, sin mover foco externo.
- Temporizador de 15 s y eventos de foco, visibilidad y pageshow; comprobación previa a consultar el mapa tras reanudar. No transformar las fechas guardadas al cambiar el reloj.
- Detalle del mapa trunca a tres decimales con ≈ y texto accesible; cantidades menores que 0,001 se indican explícitamente. Intensidad siempre usa la suma exacta.
- Desde 10⁹ min, el detalle usa notación científica de cuatro cifras significativas redondeadas y texto accesible con exponente en palabras. «Ver total completo» permite consultar la suma decimal exacta, contraída inicialmente y al cambiar de día; no altera datos ni niveles.

## Diseño
- Identidad de cuaderno: hoja para formulario, mapa e historial; progreso lateral que pasa debajo en móvil. Georgia y Trebuchet MS locales.
- Mapa con tonos azules, cabeceras de meses abreviadas y nombres completos accesibles. Tabla desplazable internamente; botón del formulario aislado de las casillas.
- Capturas de escritorio y 375 px revisadas. Casillas 26 × 26 px, sin desbordamiento de página incluso con el total máximo finito.

## Verificación del mapa (05/10/2026)
- Tests escritos antes de implementar: fallos iniciales esperados; `node --test` tras corregir totales enormes: 22 tests correctos, 0 fallos, sin instalaciones.
- Node cubre decimales/exponentes, umbrales, formato, validación, protección de almacenamiento, eventos, selección/foco, guardado a medianoche y regresión de indicadores.
- Calendarios probados en procesos aislados para Europe/Madrid, America/New_York y Pacific/Auckland: 00:30, cambios de horario, febrero bisiesto y cambio de año.
- Chrome en contextos aislados: formulario, hoy/ayer/anteayer, rachas = 3, repetidas, registro a posteriori, futuras, recarga, teclado y emulación móvil/táctil.
- Chrome con reloj controlado: activación de fecha futura, retroceso de día con selección/foco y entrada de nueva semana. Lectura inválida, escritura rechazada, exceso diario/semanal y recuperación comprobados.
- Contrastes de tonos consecutivos: 1,498 / 1,636 / 1,992 / 2,216; texto secundario 6,014:1; contorno sobre separación blanca 12,020:1.
- Peticiones solo locales y un icono nativo con URL de datos. Consola actual vacía tras recarga; consola conservada puede registrar el error de seguridad file:// anterior al mapa, sin afectar guardado/recarga.
- Ajuste de presentación verificado en Chrome aislado a 375 px: detalle compacto del máximo finito, consulta completa con Enter y cierre al cambiar de día; sin desbordamiento ni errores de consola. El ejemplo largo del campo Tema sigue recortándose en móvil (detalle previo al mapa).
- Auditoría RF por RF: node --test vuelve a pasar (22/22). Chrome confirma estructura, sumas, teclado, leyenda, móvil, escritura rechazada, bloqueo de lectura y recuperación. Dos fallos de RF-6/RF-7 reproducidos con reloj controlado y foco en SUMMARY; tests existentes no cubren ese control. Sin correcciones de aplicación en esta auditoría.
- Cobertura temporal ampliada: test con cambio TZ Tokio→Los Ángeles→Tokio en proceso aislado, sesiones intactas y fechas futura/activa correctas; suspensión simulada sin ticks/eventos, actualización antes de consulta correcta. node --test final 26/26; encabezado obsoleto de la spec corregido.
- Regresiones del desplegable: dos nuevos tests fallaron inicialmente; node --test final 24/24. Control previo a click/keydown/foco, cancelación de consulta obsoleta y foco al error/hoy, conservando summary si sigue disponible. Chrome aislado verifica click, Enter y 375 px; consola final vacía. Sin cambios en cálculos, fechas guardadas ni localStorage.
- Temporizador real de Chrome actualizó el cambio de día en 7.969,9 ms (<30 s), con reloj de fecha controlado, página visible/con foco. Cambiar de pestaña desde DevTools no produjo pérdida de visibilidad/foco: no se declara suspensión real verificada. Detalles en tasks.md.
- Cierre de T38: usuario confirma la prueba manual de retorno solicitada con resultado correcto. Sin cambios de código ni nuevos tests; última ejecución automática 26/26. No quedan verificaciones pendientes registradas para el mapa.
