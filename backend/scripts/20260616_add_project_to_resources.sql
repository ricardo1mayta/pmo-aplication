-- Migra recursos globales a recursos por proyecto.
-- Supone tablas `resources` y `projects` creadas por Sequelize en MySQL.
-- Recomendado: ejecutar primero en un respaldo o entorno espejo.

ALTER TABLE resources
  ADD COLUMN proyecto_id INT NULL AFTER id;

INSERT INTO resources (
  proyecto_id,
  nombre,
  rol,
  email,
  horas_disponibles_semana,
  horas_asignadas_semana,
  carga_porcentaje,
  estado,
  created_at,
  updated_at
)
SELECT
  p.id AS proyecto_id,
  r.nombre,
  r.rol,
  r.email,
  r.horas_disponibles_semana,
  r.horas_asignadas_semana,
  r.carga_porcentaje,
  r.estado,
  r.created_at,
  NOW() AS updated_at
FROM resources r
JOIN projects p
  ON 1 = 1
LEFT JOIN resources existing
  ON existing.proyecto_id = p.id
 AND existing.nombre = r.nombre
 AND existing.rol = r.rol
 AND COALESCE(existing.email, '') = COALESCE(r.email, '')
WHERE r.proyecto_id IS NULL
  AND existing.id IS NULL;

DELETE FROM resources
WHERE proyecto_id IS NULL;

ALTER TABLE resources
  MODIFY COLUMN proyecto_id INT NOT NULL;

ALTER TABLE resources
  ADD INDEX idx_resources_proyecto_id (proyecto_id);

ALTER TABLE resources
  ADD CONSTRAINT fk_resources_project
  FOREIGN KEY (proyecto_id) REFERENCES projects(id)
  ON DELETE CASCADE
  ON UPDATE CASCADE;
