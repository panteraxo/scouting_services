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
- Jugador puede existir sin Usuario.
- Ojeador amplía la cuenta Usuario, no duplica sus datos personales.
- Ojeador puede vincularse con cero o varios clubes.
- Prospeccion relaciona un ojeador con un jugador.
- Evaluacion pertenece a una prospección y conserva su histórico.
- HistorialDeportivo pertenece al jugador y registra su autor.
- Recomendacion relaciona una prospección con un club.
- Las evaluaciones y notas privadas no se comparten automáticamente.

Este documento es una propuesta inicial, no una migración ni un esquema definitivo. Confirmar cardinalidades y campos antes de crear tablas.
