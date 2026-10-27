# Base de datos

Motor: **MySQL 8**.

El esquema lo gestiona JPA/Hibernate a partir de las entidades del backend (`backend/scouting`). No se usa Flyway en este proyecto.

Esta carpeta se reserva para notas, decisiones y datos de desarrollo no sensibles. No mantener SQL manual que contradiga el modelo de entidades.

## Corrección para bases locales existentes

`PlayerHistoryRevision.snapshotJson` está mapeado como `@Lob`, pero una base creada con una versión anterior puede conservar `snapshot_json` como `TINYTEXT`, lo que impide guardar el snapshot completo del historial. Aplicar una vez sobre la base local:

```sql
ALTER TABLE player_history_revisions
    MODIFY snapshot_json LONGTEXT NOT NULL;

ALTER TABLE recommendations
    MODIFY snapshot_json LONGTEXT NOT NULL;
```

Hibernate no cambia el tipo de una columna existente con `ddl-auto=update`; por eso la corrección es manual para instalaciones ya creadas.
