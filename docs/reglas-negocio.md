# Reglas de negocio

1. Los roles iniciales son Administrador, Profesor, Ojeador, Director de academia, Responsable de club y Jugador.
2. En el alcance acordado, todo jugador se crea junto con su cuenta de Usuario con rol Jugador y su perfil deportivo desde el módulo Jugadores, en una sola transacción.
3. Un ojeador puede operar sin estar vinculado a un club.
4. La vinculación con clubes debe registrar estado y tipo; una declaración no implica verificación.
5. Un jugador puede ser seguido por varios ojeadores.
6. Cada ojeador administra sus propias prospecciones y evaluaciones.
7. Una nueva evaluación crea un registro histórico; no sobrescribe evaluaciones previas.
8. HistorialDeportivo registra quién creó el registro.
9. Una recomendación comparte solo información seleccionada y autorizada.
10. La respuesta de un club pertenece a una recomendación concreta.
11. Los datos de menores y los archivos privados requieren controles de acceso apropiados.
12. No tratar estadísticas desconocidas como cero.

## Acceso inicial por rol

Aplicar denegación por defecto: una acción o módulo no mencionado como permitido no concede acceso. La interfaz puede ocultar acciones, pero toda autorización debe validarse en el backend.
Cada cuenta tiene un único rol. Profesor y Director de academia se asignan a una sola academia; Responsable de club se asigna a un solo club.
Cada perfil deportivo de Jugador tiene una sola academia actual. Profesores y Directores crean/asignan jugadores a su propia academia; el Administrador puede elegir la academia.
El login se realiza con correo. Las cuentas internas creadas desde Usuarios (excepto Jugador) reciben una contraseña temporal de un solo uso y deben cambiarla en el primer acceso.
El registro público de ojeador no crea una sesión: la cuenta queda pendiente/inactiva hasta su aprobación explícita por un administrador.
Una cuenta Ojeador creada directamente por ADMIN queda activa; una solicitud pública de Ojeador siempre queda pendiente hasta su aprobación.
En Usuarios, el tipo y número de documento son obligatorios; el teléfono propio de la cuenta es opcional. El teléfono y demás datos del tutor de un menor se guardan únicamente en el perfil deportivo restringido, no en Usuario.

| Rol | Acceso y acciones acordadas |
|---|---|
| Administrador | Acceso a todos los módulos y acciones administrativas, excepto leer datos identificatorios/de contacto de tutores, prospecciones o evaluaciones privadas de ojeadores. Puede crear y gestionar academias y clubes. |
| Jugador | Solo lectura de su propio perfil en Jugadores. No puede editar, eliminar ni inhabilitar jugadores. No ve datos del tutor ni notas privadas de ojeadores. |
| Profesor | Puede consultar su academia y crear cuentas con rol Jugador. Puede crear, ver, editar e inhabilitar perfiles de jugadores de su propia academia. No accede a Clubes ni Prospección. |
| Director de academia (encargado de academia) | Puede ver, editar e inhabilitar solo su academia asignada; no crea academias. Puede crear cuentas de Jugador y Profesor y gestionar jugadores de su academia. No accede a Clubes ni Prospección. |
| Ojeador | Puede solicitar una cuenta mediante el registro público. La cuenta queda inactiva hasta que un administrador la habilite. Una vez habilitada, puede trabajar en sus propias prospecciones, evaluaciones y recomendaciones; y consultar jugadores, academias y clubes sin editar ni inhabilitar sus registros. |
| Responsable de club | Accede al módulo Clubes: gestiona el club asignado y su bandeja de recomendaciones dirigidas a ese club. No crea clubes, no accede a Usuarios, Academias, Jugadores ni Prospección. |

Reglas complementarias de acceso:
- Los profesores y directores de academia solo consultan y gestionan jugadores de su academia asignada.
- En Academias, el Profesor tiene consulta de su propia academia; el Director puede editar e inhabilitar solo la academia asignada. La creación de academias corresponde al Administrador.
- En Clubes, el Responsable de club solo gestiona el club asignado; la creación de clubes corresponde al Administrador. El Ojeador tiene consulta de directorio de academias y clubes, sin edición ni inhabilitación.
- Los datos identificatorios y de contacto del tutor de un menor se limitan a Ojeadores, Profesores y Directores de academia. No se muestran al jugador ni al responsable del club.
- Antes de compartir con un club información de un menor, se requiere autorización explícita del tutor. La recomendación comparte únicamente los datos seleccionados y autorizados; las notas privadas de ojeadores no se comparten.
- En el sistema, cada jugador se crea desde el módulo Jugadores junto con su cuenta de Usuario con rol Jugador y su perfil deportivo, en una sola transacción; un fallo al crear el perfil revierte la cuenta. Profesores y Directores de academia lo crean en su propia academia; el Administrador debe indicar la academia. El módulo Usuarios ya no crea cuentas Jugador.
- Para determinar si corresponde tutor, se registra la fecha de nacimiento, no una edad fija. Los campos concretos de autorización y su comprobación se definirán antes de implementar el flujo de compartición.
- La lectura de jugadores por parte de responsables de club y los accesos a módulos no detallados quedan denegados hasta que se defina y apruebe una regla específica.
- Las notas privadas de prospección/evaluación son visibles únicamente para el ojeador autor; ni otros ojeadores ni administradores las consultan. Solo pueden compartirse datos seleccionados mediante una recomendación autorizada.
- La vigencia operativa (activo/inhabilitado) de una academia o club es independiente de su verificación. Las organizaciones nuevas quedan pendientes de verificación y solo el Administrador puede cambiar ese estado.
- En el MVP, logos se registran mediante URL; la carga binaria de archivos queda pendiente de definir almacenamiento.
- Las ubicaciones usan códigos UBIGEO de INEI incluidos en un catálogo local; no se consulta un proveedor externo en tiempo de ejecución.
- Los conteos de jugadores, aspirantes, profesores y equipos se derivan de relaciones reales. Si la relación aún no existe o el dato se desconoce, no se presenta como cero.
- Las academias y clubes nuevos se crean operativamente activos y pendientes de verificación; el directorio de ojeadores muestra solo organizaciones activas y verificadas.
- La verificación tiene estados Pendiente, Verificada o Rechazada. Solo ADMIN puede verificar, rechazar, reabrir o revocar; cambios sensibles realizados por Director/Responsable reinician la verificación a Pendiente.
- Un Director o Responsable puede inhabilitar su organización asignada; solo ADMIN puede reactivarla. La inhabilitación no desactiva cuentas ni elimina relaciones, y la organización queda en solo lectura para sus usuarios asignados.
- Los tipos de academia y club se capturan como texto libre en esta fase. Los códigos visibles se generan en servidor como `ACA-000001` y `CLU-000001`.
- En este alcance los clubes se registran en Perú; el país se fija como PE y la ubicación se valida con UBIGEO.
- No se almacenan DNI, teléfono ni correo personales de representantes por separado; se usan los contactos institucionales. El representante de una academia se deriva de su cuenta de Director de academia activa asignada y no se captura como texto obligatorio; el valor legacy, si existe, solo es respaldo. El responsable de club se vincula mediante Usuario en SCP-004.
- El cargo del Responsable de club se almacena en su asignación `UserOrganization`, no como dato duplicado de Club.
- No se crean ni asignan cuentas a una academia o club inhabilitado hasta que ADMIN reactive la organización.
- ADMIN puede restablecer una contraseña mediante una contraseña temporal de un solo uso que obliga a cambiarla en el siguiente acceso.
- El perfil deportivo guarda la ubicación UBIGEO de residencia del jugador, separada de la ubicación de su academia.
- HistorialDeportivo registra el resultado del equipo como selección explícita; los marcadores se almacenan aparte y, si ambos están presentes, deben ser consistentes.
- La autorización del tutor registra estado, fecha y usuario que la registró; puede revocarse. En el MVP no se cargan documentos binarios de autorización.
- Una entrada histórica nueva siempre se agrega; una corrección permitida conserva al autor original y registra motivo/revisión. No hay borrado físico.
- ADMIN puede crear el perfil deportivo de un menor como incompleto, sin acceder a datos del tutor. El Profesor/Director de la academia registra el tutor; el perfil incompleto no aparece al Ojeador.
- El Ojeador puede ver perfiles activos aunque la academia esté pendiente/rechazada de verificación, siempre que la academia esté operativamente activa; la ficha indica ese estado. Los directorios de academias/clubes siguen mostrando solo organizaciones activas y verificadas.
- El Ojeador ve residencia del jugador con precisión de departamento/provincia, no distrito. Los filtros internos pueden usar el UBIGEO completo.
- En estadísticas, partido oficial, amistoso y partido de torneo cuentan como partidos; entrenamiento y prueba deportiva no.
- Catálogos iniciales de posiciones: arquero; defensa central/lateral/carrilero; mediocampistas defensivo/central/ofensivo/izquierdo/derecho; extremos izquierdo/derecho; segundo delantero; delantero centro. Categorías de edad: Sub-8, Sub-10, Sub-12, Sub-13, Sub-14, Sub-15, Sub-16, Sub-17, Sub-18, Sub-20, Sub-23 y Senior.
- Actividades: partido oficial, amistoso, torneo, entrenamiento y prueba deportiva. Nivel competitivo: academia, local, regional, nacional e internacional. Participación: titular, suplente o no jugó.
- El resultado Ganó/Empató/Perdió se registra explícitamente; si se registran los goles de ambos equipos, el resultado debe coincidir con el marcador.
- Los años de experiencia se calculan desde la fecha de la primera actividad histórica registrada; si no hay historial, se muestran como desconocidos.
- Un perfil se considera completo cuando tiene fecha de nacimiento, UBIGEO de residencia, posición, pie dominante, talla y peso; si el jugador es menor, además debe tener tutor registrado.
- Si un jugador alcanza la mayoría de edad, sus datos de tutor se conservan por trazabilidad, pero dejan de exponerse por API y no se usan para compartir. Si una corrección de fecha vuelve a ser menor, se reevalúa el acceso y el consentimiento.
- Mientras exista cualquier perfil deportivo, activo o inactivo, no se cambia el rol de la cuenta. El retiro de un perfil requiere un proceso futuro; no se permite dejar perfiles huérfanos ni cambiar silenciosamente de rol.
- Una prospección pertenece a un ojeador y a un jugador. Solo el ojeador autor ve o modifica su prospección y sus evaluaciones; ni Admin, ni staff de academia, ni jugador, ni club acceden a ese contenido.
- Un jugador puede ser seguido por varios ojeadores, pero cada ojeador mantiene como máximo una prospección por jugador. Los estados son En seguimiento, Pausada y Cerrada; cerrar no borra evaluaciones.
- Cada evaluación es un registro histórico inmutable: una nueva evaluación se agrega y nunca sobrescribe ni elimina una anterior. Las correcciones se hacen mediante una nueva evaluación, no editando la anterior.
- La evidencia de prospección/evaluación es una URL de video o enlace externo; no se cargan archivos binarios en el MVP.
- El jugador no ve prospecciones ni evaluaciones privadas; su acceso sigue limitado a su perfil deportivo.
- Una recomendación la crea el ojeador autor de la prospección y se dirige a un club activo y verificado. Comparte solo el resumen deportivo y los historiales/evaluaciones que el ojeador seleccione, junto con una carta; nunca notas privadas, tutor, cuenta ni datos no seleccionados.
- Para recomendar a un menor se exige consentimiento vigente del tutor con estado otorgado. Para un adulto, el envío explícito del ojeador autor es la autorización registrada.
- La recomendación congela una instantánea de lo compartido al momento del envío; cambios posteriores del perfil no alteran lo que el club ya recibió.
- El Responsable de club solo ve recomendaciones dirigidas a su club asignado y puede registrar una respuesta con estado interesado, solicita más información o no interesado, junto con mensaje y fecha.
- ADMIN puede consultar únicamente metadatos de auditoría de recomendaciones (estado, ojeador, club, jugador y fechas); no accede a la carta, la instantánea compartida, notas privadas ni evaluaciones no seleccionadas.
- Una recomendación no se elimina. El jugador no accede a recomendaciones ni a la bandeja de clubes.
