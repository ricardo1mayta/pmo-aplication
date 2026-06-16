const { sequelize, Task, TaskStage } = require('../src/models');

const stageOrder = ['BACKLOG', 'ANALISIS', 'UX', 'DESARROLLO', 'CODE_REVIEW', 'QA', 'UAT', 'DONE'];
const taskStatusByStage = {
  BACKLOG: 'BACKLOG',
  ANALISIS: 'EN_ANALISIS',
  UX: 'EN_UX',
  DESARROLLO: 'EN_DESARROLLO',
  CODE_REVIEW: 'CODE_REVIEW',
  QA: 'EN_QA',
  UAT: 'EN_UAT',
  DONE: 'DONE',
};

async function syncTask(taskId) {
  const task = await Task.findByPk(taskId);
  if (!task) return false;

  const stages = await TaskStage.findAll({ where: { task_id: taskId } });
  if (!stages.length) return false;

  const datesStart = stages.map((stage) => stage.fecha_inicio).filter(Boolean).sort();
  const datesEnd = stages.map((stage) => stage.fecha_fin).filter(Boolean).sort();
  const totalProgress = stages.reduce((sum, stage) => sum + Number(stage.avance || 0), 0);
  const averageProgress = Math.round((totalProgress / stages.length) * 100) / 100;
  const blockedStage = stages.find((stage) => stage.estado === 'BLOQUEADO');
  const incompleteStages = stages.filter((stage) => stage.estado !== 'COMPLETADO' && stage.etapa !== 'DONE');
  const activeStage = incompleteStages.sort((a, b) => stageOrder.indexOf(a.etapa) - stageOrder.indexOf(b.etapa))[0];
  const allComplete = stages.every((stage) => stage.estado === 'COMPLETADO' || stage.etapa === 'DONE' || Number(stage.avance || 0) >= 100);

  await task.update({
    fecha_inicio: datesStart[0] || task.fecha_inicio,
    fecha_fin: datesEnd[datesEnd.length - 1] || task.fecha_fin,
    avance: allComplete ? 100 : averageProgress,
    estado: blockedStage ? 'BLOQUEADO' : allComplete ? 'DONE' : taskStatusByStage[activeStage?.etapa] || task.estado,
    responsable: activeStage?.responsables || task.responsable,
  });

  return true;
}

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: true });

  const stages = await TaskStage.findAll({ attributes: ['task_id'] });
  const taskIds = [...new Set(stages.map((stage) => stage.task_id))];
  let synced = 0;

  for (const taskId of taskIds) {
    if (await syncTask(taskId)) synced += 1;
  }

  console.log(JSON.stringify({ synced }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sequelize.close();
  });
