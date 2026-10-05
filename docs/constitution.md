# Constitución del Diario de Estudio

1. **Stack simple:** HTML, CSS y JavaScript puros; sin dependencias ni build; debe funcionar abriendo `index.html` mediante `file://`.
2. **Spec y código:** cada cambio funcional requiere una especificación aprobada con criterios de aceptación; el código debe cumplirla sin añadir funciones no solicitadas.
3. **Responsabilidades separadas:** HTML estructura, CSS presenta y JavaScript calcula; las funciones de cálculo reciben datos y devuelven resultados sin acceder al DOM ni a localStorage.
4. **Pruebas sin instalaciones:** verificar los criterios de aceptación; probar cálculos modificados y casos límite con herramientas nativas de JavaScript o Node, y cambios de interfaz en navegador; registrar resultados en `MEMORY.md`.
5. **Datos protegidos:** conservar las sesiones y la compatibilidad de localStorage; cualquier cambio de formato requiere aprobación y migración sin pérdidas; usar datos aislados para las pruebas.
6. **Idioma consistente:** identificadores descriptivos en inglés, siguiendo el código existente; interfaz, comentarios y documentación en español.
