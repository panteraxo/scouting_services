# Modelo de datos — borrador

Entidades iniciales propuestas:
- Usuario
- Rol / UsuarioRol
- Academia
- Club
- UsuarioOrganizacion
- Ojeador
- OjeadorClub
- Jugador
- HistorialDeportivo
- Evidencia
- Prospeccion
- Evaluacion
- Recomendacion
- RecomendacionEvaluacion
- RespuestaRecomendacion

Reglas esenciales:
- En el alcance acordado, cada Jugador se crea desde el módulo Jugadores junto con su cuenta Usuario de rol Jugador y su perfil deportivo, en una sola transacción. El módulo Usuarios no crea cuentas Jugador.
- Cada Usuario tiene un único rol. Profesor y Director de academia tienen una sola academia asignada; Responsable de club tiene un solo club asignado.
- Cada perfil Jugador tiene una sola academia actual; Profesores y Directores solo pueden crear/asignar jugadores a la suya.
- Ojeador amplía la cuenta Usuario, no duplica sus datos personales.
- Ojeador puede vincularse con cero o varios clubes.
- Prospeccion relaciona un ojeador con un jugador.
- Evaluacion pertenece a una prospección y conserva su histórico.
- HistorialDeportivo pertenece al jugador y registra su autor.
- Recomendacion relaciona una prospección con un club.
- Las evaluaciones y notas privadas no se comparten automáticamente.
- Para jugadores menores se registra fecha de nacimiento y datos de tutor; la autorización explícita del tutor es requisito antes de compartir datos con un club.
- Los datos del tutor requieren control de acceso por rol y no se exponen en la vista del jugador ni a responsables de club.
- Academia y Club distinguen estado operativo de estado de verificación; nuevas organizaciones comienzan pendientes y solo ADMIN modifica la verificación.
- El logo se almacena como URL en el MVP. Departamento/provincia/distrito se referencian desde un catálogo local UBIGEO de INEI.
- Los conteos de jugadores, aspirantes, profesores y equipos son proyecciones derivadas de relaciones; no se inventan ni se rellenan con cero cuando se desconocen.
- Academia y Club tienen códigos visibles generados por el servidor (`ACA-000001` / `CLU-000001`), estado operativo y estado de verificación separados. Se crean activos y pendientes de verificación.
- El tipo de academia/club es texto libre en esta fase; RUC, nombre, logo URL, año de fundación, descripción, UBIGEO, dirección y contacto institucional se definen según los campos requeridos del PDF.
- `UserOrganization` mantiene como máximo una organización por usuario: academia para Profesor, Director y Jugador; club para Responsable de club. Un club puede tener varios responsables. La asignación del responsable se implementa en SCP-004.
- Academia puede registrar grupos formativos y sede. El nombre del representante no se captura como texto obligatorio: el valor mostrado se deriva de la cuenta con rol Director de academia activa asignada mediante `UserOrganization`; el valor legacy almacenado solo sirve como respaldo. Sus medios de contacto son institucionales y no se duplican DNI, email ni teléfono personales del representante.
- El Responsable de club y su cargo se derivan de `UserOrganization` en SCP-004; no se duplican sus datos personales en Club.
- `UserOrganization.position` almacena el cargo funcional del Responsable de club. El teléfono de Usuario es opcional y pertenece a esa cuenta; los datos del tutor quedan separados en el perfil deportivo restringido.
- `PlayerProfile` almacena su propio `ubigeoCode` de residencia, distinto del UBIGEO de su academia; fecha de nacimiento es la fuente de edad.
- `PlayerProfile.profileStatus` distingue `INCOMPLETE` de `COMPLETE`; un menor creado por ADMIN queda incompleto hasta que staff registra el tutor. El Ojeador solo ve perfiles completos.
- `PlayerGuardian` se almacena separado del perfil general. La autorización registra estado, fecha y actor, con revocación; no se guardan archivos binarios en el MVP.
- `HistorialDeportivo` guarda resultado explícito y marcadores separados; una corrección mantiene el creador original y añade revisión/motivo, mientras un `POST` siempre agrega una entrada nueva.
- En la proyección para Ojeador, la residencia se reduce a departamento/provincia y la academia informa su estado de verificación; la consulta interna conserva el UBIGEO completo.
- Los años de experiencia no se guardan como campo editable; se derivan de la fecha de la primera actividad de HistorialDeportivo y son desconocidos si no hay historial.
- HistorialDeportivo usa catálogos controlados para posiciones, actividad, nivel competitivo y participación; el resultado explícito se valida contra el marcador cuando ambos goles se conocen.
- La completitud del perfil exige fecha de nacimiento, UBIGEO de residencia, posición, pie dominante, talla, peso y, para menores, tutor.
- Los datos de tutor de un jugador que alcanza la mayoría de edad se conservan pero dejan de exponerse; cualquier perfil existente, activo o inactivo, bloquea el cambio de rol de la cuenta hasta definir un proceso de retiro.
- `Prospeccion` tiene un único autor ojeador y un jugador; la clave única es `(scout_id, player_id)`. Su contenido no se comparte con Admin, academia, jugador ni club.
- `Evaluacion` pertenece a una prospección, registra el autor y es inmutable. Las nuevas evaluaciones forman el histórico; no se editan ni borran.
- `Prospeccion.status` usa `FOLLOWING`, `PAUSED` y `CLOSED`; el cierre no elimina evaluaciones ni historial de actividad.
- La evidencia se guarda como URL opcional; no hay archivos binarios de evaluación en el MVP.
- `Recomendacion` relaciona una `Prospeccion` con un `Club`, registra autor, carta, estado y una instantánea inmutable de los datos seleccionados. No se comparte la entidad privada de evaluación; se comparte una copia de los campos seleccionados.
- `RecomendacionEvaluacion` y `RecomendacionHistorial` registran qué evaluaciones e historiales eligió el ojeador para compartir. Solo esos elementos, sin notas privadas, entran en la instantánea.
- `RespuestaRecomendacion` pertenece a una recomendación y registra estado (`INTERESTED`, `INFO_REQUESTED`, `NOT_INTERESTED`), mensaje, actor del club y fecha. El historial de respuestas se conserva; la vigente es la más reciente.
- Las recomendaciones a menores requieren consentimiento del tutor `GRANTED` al momento del envío. El envío de un adulto queda autorizado por la acción explícita del ojeador autor.
- ADMIN solo obtiene metadatos de recomendación; no la carta, instantánea, notas ni evaluaciones no seleccionadas.

Este documento es una propuesta inicial, no una migración ni un esquema definitivo. Confirmar cardinalidades y campos antes de crear tablas.
