const { sequelize, Task, TaskStage } = require('../src/models');

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const tasks = await Task.findAll({ where: { proyecto_id: 2 } });
  let created = 0;
  let existing = 0;

  for (const task of tasks) {
    const [stage, wasCreated] = await TaskStage.findOrCreate({
      where: {
        proyecto_id: task.proyecto_id,
        task_id: task.id,
        etapa: 'DESARROLLO',
      },
      defaults: {
        proyecto_id: task.proyecto_id,
        task_id: task.id,
        cronograma_item_id: task.cronograma_item_id,
        etapa: 'DESARROLLO',
        estado: task.estado === 'DONE' ? 'COMPLETADO' : 'PENDIENTE',
        fecha_inicio: task.fecha_inicio,
        fecha_fin: task.fecha_fin,
        avance: task.avance,
        responsables: task.desarrolladores || task.responsable,
        observaciones: 'Creado desde la planificación actual de la HU.',
      },
    });

    if (!wasCreated) {
      await stage.update({
        cronograma_item_id: task.cronograma_item_id,
        fecha_inicio: stage.fecha_inicio || task.fecha_inicio,
        fecha_fin: stage.fecha_fin || task.fecha_fin,
        responsables: stage.responsables || task.desarrolladores || task.responsable,
      });
      existing += 1;
    } else {
      created += 1;
    }
  }

  console.log(JSON.stringify({ created, existing, total: tasks.length }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
