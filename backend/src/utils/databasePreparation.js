const { QueryTypes } = require('sequelize');

async function tableExists(sequelize, tableName) {
  const rows = await sequelize.query('SHOW TABLES LIKE ?', {
    replacements: [tableName],
    type: QueryTypes.SELECT,
  });

  return rows.length > 0;
}

async function columnExists(sequelize, tableName, columnName) {
  const rows = await sequelize.query(
    `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = ?
        AND column_name = ?
      LIMIT 1
    `,
    {
      replacements: [tableName, columnName],
      type: QueryTypes.SELECT,
    },
  );

  return rows.length > 0;
}

async function prepareResourceProjectReferences(sequelize) {
  const [hasResourcesTable, hasProjectsTable] = await Promise.all([
    tableExists(sequelize, 'resources'),
    tableExists(sequelize, 'projects'),
  ]);

  if (!hasResourcesTable || !hasProjectsTable) return;

  const fallbackProjects = await sequelize.query('SELECT id FROM projects ORDER BY id LIMIT 1', {
    type: QueryTypes.SELECT,
  });
  const fallbackProjectId = fallbackProjects[0]?.id;

  if (!fallbackProjectId) return;

  const hasProjectColumn = await columnExists(sequelize, 'resources', 'proyecto_id');
  if (!hasProjectColumn) {
    await sequelize.query('ALTER TABLE resources ADD COLUMN proyecto_id INT NULL AFTER id');
  }

  await sequelize.query(
    `
      UPDATE resources r
      LEFT JOIN projects p ON p.id = r.proyecto_id
      SET r.proyecto_id = ?
      WHERE r.proyecto_id IS NULL
         OR p.id IS NULL
    `,
    { replacements: [fallbackProjectId] },
  );
}

async function prepareDatabase(sequelize) {
  await prepareResourceProjectReferences(sequelize);
}

module.exports = { prepareDatabase };
