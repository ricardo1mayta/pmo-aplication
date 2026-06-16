const { sequelize, Resource, Task } = require('../src/models');
const { Op } = require('sequelize');

const leaders = ['RICARDO MAYTA', 'JEAN PAUL CASTILLO'];

const rows = [
  ['HU020', 'EDER', 'RICARDO MAYTA', '22/05/2026', '03/06/2026', ['LUIS MUÑOZ']],
  ['HU021', 'EDER', 'RICARDO MAYTA', '04/06/2026', '10/06/2026', ['LUIS MUÑOZ']],
  ['HU022', 'EDER', 'RICARDO MAYTA', '11/06/2026', '12/06/2026', ['LUIS MUÑOZ']],
  ['HU023', 'EDER', 'RICARDO MAYTA', '15/06/2026', '15/06/2026', ['LUIS MUÑOZ']],
  ['HU024', 'EDER', 'RICARDO MAYTA', '16/06/2026', '16/06/2026', ['LUIS MUÑOZ']],
  ['HU025', 'EDER', 'RICARDO MAYTA', '17/06/2026', '17/06/2026', ['LUIS MUÑOZ']],
  ['HU026', 'EDER', 'RICARDO MAYTA', '18/06/2026', '18/06/2026', ['LUIS MUÑOZ']],
  ['HU069', 'EDER', 'RICARDO MAYTA', '19/06/2026', '19/06/2026', ['LUIS MUÑOZ']],
  ['HU070', 'EDER', 'JEAN PAUL CASTILLO', '04/06/2026', '08/06/2026', ['JHOAM CARLOS']],
  ['HU071', 'EDER', 'JEAN PAUL CASTILLO', '09/06/2026', '09/06/2026', ['JHOAM CARLOS']],
  ['HU072', 'EDER', 'JEAN PAUL CASTILLO', '10/06/2026', '12/06/2026', ['JHOAM CARLOS']],
  ['HU073', 'EDER', 'JEAN PAUL CASTILLO', '15/06/2026', '15/06/2026', ['JHOAM CARLOS']],
  ['HU074', 'EDER', 'JEAN PAUL CASTILLO', '16/06/2026', '16/06/2026', ['JHOAM CARLOS']],
  ['HU075', 'EDER', 'JEAN PAUL CASTILLO', '17/06/2026', '17/06/2026', ['JHOAM CARLOS']],
  ['HU076', 'EDER', 'JEAN PAUL CASTILLO', '18/06/2026', '18/06/2026', ['JHOAM CARLOS']],
  ['HU077', 'EDER', 'JEAN PAUL CASTILLO', '19/06/2026', '19/06/2026', ['JHOAM CARLOS']],
  ['HU061', 'LUZ', 'JEAN PAUL CASTILLO', '04/06/2026', '10/06/2026', ['JOSÉ BUSTAMANTE']],
  ['HU062', 'LUZ', 'JEAN PAUL CASTILLO', '11/06/2026', '12/06/2026', ['JOSÉ BUSTAMANTE']],
  ['HU063', 'LUZ', 'JEAN PAUL CASTILLO', '15/06/2026', '16/06/2026', ['JOSÉ BUSTAMANTE']],
  ['HU064', 'LUZ', 'JEAN PAUL CASTILLO', '17/06/2026', '19/06/2026', ['JOSÉ BUSTAMANTE']],
  ['HU065', 'LUZ', 'JEAN PAUL CASTILLO', '22/06/2026', '23/06/2026', ['JOSÉ BUSTAMANTE']],
  ['HU066', 'LUZ', 'JEAN PAUL CASTILLO', '24/06/2026', '26/06/2026', ['JOSÉ BUSTAMANTE']],
  ['HU067', 'LUZ', 'JEAN PAUL CASTILLO', '26/06/2026', '29/06/2026', ['JOSÉ BUSTAMANTE']],
  ['HU068', 'LUZ', 'JEAN PAUL CASTILLO', '30/06/2026', '01/07/2026', ['JOSÉ BUSTAMANTE']],
  ['HU094', 'RINA', 'JEAN PAUL CASTILLO', '04/06/2026', '11/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU095', 'RINA', 'JEAN PAUL CASTILLO', '12/06/2026', '15/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU096', 'RINA', 'JEAN PAUL CASTILLO', '16/06/2026', '17/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU097', 'RINA', 'JEAN PAUL CASTILLO', '18/06/2026', '19/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU098', 'RINA', 'JEAN PAUL CASTILLO', '22/06/2026', '22/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU099', 'RINA', 'JEAN PAUL CASTILLO', '23/06/2026', '23/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU100', 'RINA', 'JEAN PAUL CASTILLO', '24/06/2026', '24/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU101', 'RINA', 'JEAN PAUL CASTILLO', '25/06/2026', '25/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU102', 'RINA', 'JEAN PAUL CASTILLO', '26/06/2026', '26/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU103', 'RINA', 'JEAN PAUL CASTILLO', '29/06/2026', '29/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU104', 'RINA', 'JEAN PAUL CASTILLO', '30/06/2026', '30/06/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU105', 'RINA', 'JEAN PAUL CASTILLO', '01/07/2026', '01/07/2026', ['IRENIO', 'LUIS MIGUEL', 'JHOAM CARLOS']],
  ['HU106', 'RINA', 'JEAN PAUL CASTILLO', '11/06/2026', null, ['ALAN GARCIA']],
  ['HU107', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU108', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU109', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU110', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU111', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU112', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU113', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU114', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU115', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU116', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU117', 'RINA', 'JEAN PAUL CASTILLO', null, null, ['ALAN GARCIA']],
  ['HU165', 'RINA', 'JEAN PAUL CASTILLO', null, '25/06/2026', ['ALAN GARCIA']],
  ['HU135', 'ROGGER', 'RICARDO MAYTA', '08/06/2026', '16/06/2026', ['GUIDO POCOHUANCA']],
  ['HU136', 'ROGGER', 'RICARDO MAYTA', '17/06/2026', '18/06/2026', ['GUIDO POCOHUANCA']],
  ['HU137', 'ROGGER', 'RICARDO MAYTA', '19/06/2026', '22/06/2026', ['GUIDO POCOHUANCA']],
  ['HU138', 'ROGGER', 'RICARDO MAYTA', '23/06/2026', '25/06/2026', ['GUIDO POCOHUANCA']],
  ['HU132', 'OLIVER', 'RICARDO MAYTA', '03/06/2026', '11/06/2026', ['ROGER MOREANO']],
  ['HU133', 'OLIVER', 'RICARDO MAYTA', '12/06/2026', '15/06/2026', ['ROGER MOREANO']],
  ['HU134', 'OLIVER', 'RICARDO MAYTA', '16/06/2026', '17/06/2026', ['ROGER MOREANO']],
  ['HU139', 'OLIVER', 'RICARDO MAYTA', '03/06/2026', '11/06/2026', ['MICHAEL ACOSTA']],
  ['HU140', 'OLIVER', 'RICARDO MAYTA', '12/06/2026', '15/06/2026', ['MICHAEL ACOSTA']],
  ['HU141', 'OLIVER', 'RICARDO MAYTA', '16/06/2026', '17/06/2026', ['MICHAEL ACOSTA']],
  ['HU154', 'OLIVER', 'RICARDO MAYTA', '18/06/2026', '19/06/2026', ['ROGER MOREANO', 'MICHAEL ACOSTA']],
  ['HU166', 'OLIVER', 'RICARDO MAYTA', '02/06/2026', '11/06/2026', ['LUZ DELIA']],
  ['HU167', 'OLIVER', 'RICARDO MAYTA', '12/06/2026', '18/06/2026', ['LUZ DELIA']],
  ['HU168', 'OLIVER', 'RICARDO MAYTA', '19/06/2026', '25/06/2026', ['LUZ DELIA']],
  ['HU169', 'OLIVER', 'RICARDO MAYTA', '26/06/2026', '30/06/2026', ['LUZ DELIA']],
  ['HU142', 'LUZ', 'RICARDO MAYTA', '05/06/2026', '11/06/2026', ['JUNIOR']],
  ['HU143', 'LUZ', 'RICARDO MAYTA', '12/06/2026', '17/06/2026', ['JUNIOR']],
  ['HU144', 'LUZ', 'RICARDO MAYTA', '18/06/2026', '19/06/2026', ['JUNIOR']],
  ['HU145', 'LUZ', 'RICARDO MAYTA', '22/06/2026', '23/06/2026', ['JUNIOR']],
  ['HU146', 'LUZ', 'RICARDO MAYTA', '24/06/2026', '25/06/2026', ['JUNIOR']],
  ['HU147', 'LUZ', 'RICARDO MAYTA', '26/06/2026', '26/06/2026', ['JUNIOR']],
  ['HU148', 'LUZ', 'RICARDO MAYTA', '01/07/2026', '01/07/2026', ['JUNIOR']],
  ['HU129', 'LUZ', 'RICARDO MAYTA', '04/06/2026', '10/06/2026', ['ADOLFO']],
  ['HU130', 'LUZ', 'RICARDO MAYTA', '11/06/2026', '19/06/2026', ['ADOLFO']],
  ['HU131', 'LUZ', 'RICARDO MAYTA', '23/06/2026', '25/06/2026', ['ADOLFO']],
  ['HU125', 'EDER', 'JEAN PAUL CASTILLO', null, null, ['GUIDO GUTIERREZ']],
  ['HU126', 'EDER', 'JEAN PAUL CASTILLO', null, null, ['GUIDO GUTIERREZ']],
  ['HU156', 'EDER', 'JEAN PAUL CASTILLO', '04/06/2026', '11/06/2026', ['GUIDO GUTIERREZ']],
  ['HU157', 'EDER', 'JEAN PAUL CASTILLO', '12/06/2026', '19/06/2026', ['GUIDO GUTIERREZ']],
];

function parseDate(value) {
  if (!value) return null;
  const [day, month, year] = value.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

async function ensureResource(nombre, rol, proyectoId = 2) {
  await Resource.findOrCreate({
    where: { proyecto_id: proyectoId, nombre },
    defaults: {
      proyecto_id: proyectoId,
      nombre,
      rol,
      horas_disponibles_semana: 40,
      horas_asignadas_semana: 0,
      estado: 'ACTIVO',
    },
  });
}

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  for (const leader of leaders) await ensureResource(leader, 'LIDER_TECNICO');

  let updated = 0;
  const missing = [];

  for (const [code, analyst, leader, start, end, developers] of rows) {
    await ensureResource(analyst, 'ANALISTA');
    for (const developer of developers) await ensureResource(developer, 'DEV');

    const task = await Task.findOne({
      where: {
        [Op.and]: [
          { proyecto_id: 2 },
          sequelize.where(sequelize.fn('LOWER', sequelize.col('titulo')), 'LIKE', `%${code.toLowerCase()}%`),
        ],
      },
    });

    if (!task) {
      missing.push(code);
      continue;
    }

    await task.update({
      analistas_funcionales: analyst,
      lideres_tecnicos: leader,
      desarrolladores: developers.join('\n'),
      responsable: developers.join('\n'),
      fecha_inicio: parseDate(start),
      fecha_fin: parseDate(end),
    });
    updated += 1;
  }

  console.log(JSON.stringify({ updated, missing, total: rows.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
