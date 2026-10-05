# AGENTS.md — Diario de Estudio
Web estática para registrar sesiones de estudio y motivarse viendo la racha de días
seguidos. Proyecto didáctico: el código debe poder entenderlo alguien que empieza a
programar.
## Stack y estructura
- HTML, CSS y JavaScript puros: sin frameworks, librerías, npm, bundler ni build.
- `index.html` (estructura), `styles.css` (estilos), `study-logic.js` (cálculos puros) y `app.js` (interfaz, eventos y almacenamiento).
- `study-logic.js` se carga antes de `app.js` como script clásico; exporta también sus funciones para los tests de Node. Los cálculos reciben `today` explícitamente y no consultan DOM, almacenamiento ni reloj actual.
- Debe funcionar abriendo `index.html` con doble clic (`file://`): nada de módulos ES
(`type="module"`), `fetch` a archivos locales ni nada que requiera servidor.
## Convenciones
- Textos de la interfaz en español.
- Código simple, nombres descriptivos y comentarios solo donde aporten.
- Diseño limpio y responsive; cualquier pantalla nueva debe verse bien en el móvil.
## Datos
- localStorage, clave `diario-estudio-sesiones`: array de `{ date: "AAAA-MM-DD", topic,
minutes }`.
- Si cambias la forma de los datos, mantén compatibilidad con lo ya guardado o el usuario
perderá sus sesiones.
## Fechas y racha (fácil equivocarse)
- Trabaja siempre con la fecha local del usuario. Nunca uses `toISOString()` ni `new
Date("AAAA-MM-DD")`: se interpretan en UTC y desplazan el día.
- Racha = días consecutivos con al menos 1 sesión que terminan hoy. Si hoy no hay sesión
pero ayer sí, la racha sigue viva y se cuenta desde ayer.
- Varias sesiones el mismo día cuentan como un solo día. Las fechas futuras no suman.
## Total semanal
- Semana de lunes a domingo según el calendario local del usuario.
- Sumar los minutos desde el lunes hasta hoy, ambos incluidos; excluir fechas futuras.
- Varias sesiones del mismo día suman todas sus duraciones.
- Las sesiones registradas a posteriori cuentan según su fecha de estudio.
## Días estudiados este mes
- Mes natural según el calendario local: desde el día 1 hasta hoy, ambos incluidos.
- Contar fechas únicas con al menos una sesión válida; no hace falta que sean consecutivas.
- Varias sesiones del mismo día cuentan como un día, independientemente de su duración.
- Excluir fechas futuras e incluir sesiones registradas a posteriori según su fecha de estudio.
## Mapa de calor
- Doce semanas de lunes a domingo, incluida la actual; solo sumar actividad hasta hoy según fecha local.
- Niveles diarios: 0, más de 0 y menos de 30, 30 a menos de 60, 60 a menos de 120, 120 o más minutos.
- Sumar decimales exactamente en memoria; no guardar BigInt ni cambiar el formato de las sesiones.
- Ante lectura inválida, bloquear el registro sin sobrescribir el historial; un exceso de cálculo no invalida las sesiones ni bloquea guardar.
- Spec, plan y tareas: `specs/001-heat-map/`.
## Forma de trabajar
- Haz solo lo que se pide: no añadas funcionalidades por tu cuenta.
- Cambios pequeños y enfocados; no reescribas lo que ya funciona.
- Al terminar, resume qué has cambiado y cualquier decisión que deba revisar.
## Límites
- ✅ Siempre: respetar las reglas de fechas y racha, mantener los textos en español.
✅ Siempre: actualizar `MEMORY.md` al terminar cada tarea. 

- ⚠️ Pregunta antes: crear archivos nuevos, cambiar el formato de los datos guardados.
- 🚫 Nunca: añadir dependencias, frameworks o un paso de build.
## Verificación
- Ejecutar `node --test` sin instalar dependencias: `tests/study-logic.test.cjs` y `tests/app.test.cjs`.
- Después de cada cambio, verifica con el MCP de Chrome 
DevTools: abre `index.html`, prueba la funcionalidad, revisa la consola y comprueba la 
vista móvil. 
- Usar un contexto aislado de Chrome para las pruebas; no borrar ni alterar el historial real del usuario.
## Memoria
- Al empezar, lee `MEMORY.md` para conocer el estado del proyecto y las decisiones
tomadas.
- Al terminar una tarea, actualízalo: estado actual, decisiones importantes (con su
porqué) y errores a evitar.
- Mantenlo breve (máximo ~50 líneas): resume o elimina lo que ya no aporte.
- Si algo se convierte en una regla permanente, propón moverlo a `AGENTS.md` en lugar de
dejarlo en la memoria.
- No guardes nunca datos sensibles (claves, tokens, datos personales). 

## Comandos 
- Tests: `node --test` 
 
## Reglas 
- Lee `docs/constitution.md` y la spec activa (`specs/NNN-*/`) antes de tocar código. 
