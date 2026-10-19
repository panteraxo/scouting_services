# Flujo de trabajo de tareas

1. Ejecutar `/plan-task descripción`.
2. Revisar clasificación, dependencias y criterios.
3. Ejecutar `/implement-task SCP-XXX: descripción`.
4. Revisar el diff y ejecutar `/review-task`.
5. Aceptar los cambios y actualizar el estado de la tarea.

Para cambios pequeños se puede pedir implementación directa, pero siempre debe revisarse el diff.
