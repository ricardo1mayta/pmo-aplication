const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const {
  calculateProjectDeviation,
  calculateProjectTrafficLight,
  calculateRiskLevel,
  calculateResourceLoad,
} = require('../utils/calculations');

const User = sequelize.define('User', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  password_hash: { type: DataTypes.STRING, allowNull: false },
  rol: {
    type: DataTypes.ENUM('ADMIN', 'GESTOR', 'ANALISTA', 'UX', 'DEV', 'QA', 'LIDER_TECNICO'),
    allowNull: false,
    defaultValue: 'GESTOR',
  },
  estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), allowNull: false, defaultValue: 'ACTIVO' },
}, {
  indexes: [{ name: 'email', unique: true, fields: ['email'] }],
});

const Project = sequelize.define('Project', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: DataTypes.TEXT,
  objetivo: DataTypes.TEXT,
  fecha_inicio: DataTypes.DATEONLY,
  fecha_fin: DataTypes.DATEONLY,
  responsable: DataTypes.STRING,
  estado: {
    type: DataTypes.ENUM('PLANIFICADO', 'EN_PROCESO', 'EN_RIESGO', 'FINALIZADO', 'CANCELADO'),
    allowNull: false,
    defaultValue: 'PLANIFICADO',
  },
  semaforo: {
    type: DataTypes.ENUM('VERDE', 'AMARILLO', 'ROJO'),
    allowNull: false,
    defaultValue: 'VERDE',
  },
  avance_planificado: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  avance_real: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  desviacion: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  presupuesto_estimado: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
  presupuesto_consumido: { type: DataTypes.DECIMAL(12, 2), allowNull: false, defaultValue: 0 },
});

Project.beforeValidate((project) => {
  project.desviacion = calculateProjectDeviation(project);
  project.semaforo = calculateProjectTrafficLight(project);
});

const Task = sequelize.define('Task', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  descripcion: DataTypes.TEXT,
  tipo: {
    type: DataTypes.ENUM('ANALISIS', 'UX', 'DESARROLLO', 'CODE_REVIEW', 'QA', 'UAT', 'DOCUMENTACION'),
    allowNull: false,
    defaultValue: 'ANALISIS',
  },
  prioridad: {
    type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA', 'CRITICA'),
    allowNull: false,
    defaultValue: 'MEDIA',
  },
  estado: {
    type: DataTypes.ENUM('BACKLOG', 'EN_ANALISIS', 'EN_UX', 'EN_DESARROLLO', 'CODE_REVIEW', 'EN_QA', 'EN_UAT', 'DONE', 'BLOQUEADO'),
    allowNull: false,
    defaultValue: 'BACKLOG',
  },
  responsable: DataTypes.STRING,
  fecha_inicio: DataTypes.DATEONLY,
  fecha_fin: DataTypes.DATEONLY,
  avance: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  prototipo_url: { type: DataTypes.STRING(1000), validate: { isUrl: true } },
  prototipo_herramienta: DataTypes.STRING,
  analistas_funcionales: DataTypes.TEXT,
  lideres_tecnicos: DataTypes.TEXT,
  desarrolladores: DataTypes.TEXT,
  bloqueado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
  motivo_bloqueo: DataTypes.TEXT,
  defectos: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
});

const ScheduleItem = sequelize.define('ScheduleItem', {
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: DataTypes.TEXT,
  tipo: {
    type: DataTypes.ENUM('FASE', 'SUBFASE', 'ACTIVIDAD', 'HITO', 'ENTREGABLE', 'OTRO'),
    allowNull: false,
    defaultValue: 'ACTIVIDAD',
  },
  orden: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  fecha_inicio: DataTypes.DATEONLY,
  fecha_fin: DataTypes.DATEONLY,
  avance_planificado: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  avance_real: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  responsable: DataTypes.STRING,
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'EN_RIESGO', 'COMPLETADO', 'CANCELADO'),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
});

const TaskStage = sequelize.define('TaskStage', {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Actividad HU',
  },
  etapa: {
    type: DataTypes.ENUM('BACKLOG', 'ANALISIS', 'UX', 'DESARROLLO', 'CODE_REVIEW', 'QA', 'UAT', 'DOCUMENTACION', 'FIRMA_USUARIO', 'DONE'),
    allowNull: false,
    defaultValue: 'BACKLOG',
  },
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'BLOQUEADO'),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  fecha_inicio: DataTypes.DATEONLY,
  fecha_fin: DataTypes.DATEONLY,
  avance: { type: DataTypes.DECIMAL(5, 2), allowNull: false, defaultValue: 0 },
  horas_estimadas: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
  horas_ejecutadas: { type: DataTypes.DECIMAL(8, 2), allowNull: false, defaultValue: 0 },
  responsables: DataTypes.TEXT,
  estado_firma_usuario: {
    type: DataTypes.ENUM('NO_APLICA', 'PENDIENTE', 'ENVIADO', 'FIRMADO', 'OBSERVADO'),
    allowNull: false,
    defaultValue: 'NO_APLICA',
  },
  fecha_firma_usuario: DataTypes.DATEONLY,
  observaciones: DataTypes.TEXT,
});

TaskStage.beforeValidate((stage) => {
  if (!stage.nombre) stage.nombre = stage.etapa ? `Actividad ${stage.etapa}` : 'Actividad HU';
  if (Number(stage.avance || 0) >= 100) stage.estado = 'COMPLETADO';
  if (stage.estado === 'COMPLETADO' && Number(stage.avance || 0) < 100) stage.avance = 100;
});

const taskActivityPriority = ['UAT', 'QA', 'CODE_REVIEW', 'DESARROLLO', 'UX', 'ANALISIS', 'DOCUMENTACION', 'FIRMA_USUARIO', 'BACKLOG', 'DONE'];
const taskStatusByStage = {
  BACKLOG: 'BACKLOG',
  ANALISIS: 'EN_ANALISIS',
  UX: 'EN_UX',
  DESARROLLO: 'EN_DESARROLLO',
  CODE_REVIEW: 'CODE_REVIEW',
  QA: 'EN_QA',
  UAT: 'EN_UAT',
  DOCUMENTACION: 'EN_DESARROLLO',
  FIRMA_USUARIO: 'EN_UAT',
  DONE: 'DONE',
};

function getActivityPriority(stage) {
  const index = taskActivityPriority.indexOf(stage.etapa);
  return index === -1 ? taskActivityPriority.length : index;
}

function average(values) {
  const cleanValues = values.map((value) => Number(value || 0)).filter((value) => Number.isFinite(value));
  if (!cleanValues.length) return null;
  const total = cleanValues.reduce((sum, value) => sum + value, 0);
  return Math.round((total / cleanValues.length) * 100) / 100;
}

async function syncScheduleNodeProgress(itemId) {
  if (!itemId) return null;

  const item = await ScheduleItem.findByPk(itemId);
  if (!item) return null;

  const children = await ScheduleItem.findAll({ where: { padre_id: itemId } });
  const childAverage = children.length ? average(children.map((child) => child.avance_real)) : null;

  if (childAverage !== null) {
    await item.update({
      avance_planificado: average(children.map((child) => child.avance_planificado)),
      avance_real: childAverage,
      estado: childAverage >= 100 ? 'COMPLETADO' : item.estado === 'COMPLETADO' ? 'EN_PROCESO' : item.estado,
    });
    return item.padre_id;
  }

  const linkedTasks = await Task.findAll({ where: { cronograma_item_id: itemId } });
  const taskAverage = linkedTasks.length ? average(linkedTasks.map((task) => task.avance)) : null;

  if (taskAverage !== null) {
    await item.update({
      avance_real: taskAverage,
      estado: taskAverage >= 100 ? 'COMPLETADO' : item.estado === 'COMPLETADO' ? 'EN_PROCESO' : item.estado,
    });
    return item.padre_id;
  }

  const linkedStages = await TaskStage.findAll({ where: { cronograma_item_id: itemId } });
  const stageAverage = linkedStages.length ? average(linkedStages.map((stage) => stage.avance)) : null;

  if (stageAverage !== null) {
    await item.update({
      avance_real: stageAverage,
      estado: stageAverage >= 100 ? 'COMPLETADO' : item.estado === 'COMPLETADO' ? 'EN_PROCESO' : item.estado,
    });
  }

  return item.padre_id;
}

async function syncScheduleBranches(startIds) {
  const pending = [...new Set(startIds.filter(Boolean).map(Number))];
  const visited = new Set();

  while (pending.length) {
    const itemId = pending.shift();
    if (visited.has(itemId)) continue;
    visited.add(itemId);

    const parentId = await syncScheduleNodeProgress(itemId);
    if (parentId) pending.push(Number(parentId));
  }
}

async function syncTaskFromStages(taskId) {
  if (!taskId) return;

  const task = await Task.findByPk(taskId);
  if (!task) return;

  const stages = await TaskStage.findAll({ where: { task_id: taskId } });
  if (!stages.length) return;

  const datesStart = stages.map((stage) => stage.fecha_inicio).filter(Boolean).sort();
  const datesEnd = stages.map((stage) => stage.fecha_fin).filter(Boolean).sort();
  const totalProgress = stages.reduce((sum, stage) => sum + Number(stage.avance || 0), 0);
  const averageProgress = Math.round((totalProgress / stages.length) * 100) / 100;
  const blockedStage = stages.find((stage) => stage.estado === 'BLOQUEADO');
  const activeStages = stages
    .filter((stage) => stage.estado === 'EN_PROCESO' || (stage.estado !== 'COMPLETADO' && Number(stage.avance || 0) > 0))
    .sort((a, b) => getActivityPriority(a) - getActivityPriority(b));
  const pendingStages = stages
    .filter((stage) => stage.estado !== 'COMPLETADO' && stage.etapa !== 'DONE')
    .sort((a, b) => getActivityPriority(a) - getActivityPriority(b));
  const pendingSignatureStage = stages.find((stage) => ['PENDIENTE', 'ENVIADO', 'OBSERVADO'].includes(stage.estado_firma_usuario));
  const activeStage = activeStages[0] || pendingStages[0] || pendingSignatureStage;
  const hasPendingUserSignature = Boolean(pendingSignatureStage);
  const allComplete = stages.every((stage) => stage.estado === 'COMPLETADO' || stage.etapa === 'DONE' || Number(stage.avance || 0) >= 100) && !hasPendingUserSignature;

  const updatedTask = await task.update({
    fecha_inicio: datesStart[0] || task.fecha_inicio,
    fecha_fin: datesEnd[datesEnd.length - 1] || task.fecha_fin,
    avance: allComplete ? 100 : averageProgress,
    estado: blockedStage ? 'BLOQUEADO' : allComplete ? 'DONE' : taskStatusByStage[activeStage?.etapa] || task.estado,
    responsable: activeStage?.responsables || task.responsable,
  });

  await syncScheduleBranches([updatedTask.cronograma_item_id]);
}

const Risk = sequelize.define('Risk', {
  descripcion: { type: DataTypes.TEXT, allowNull: false },
  causa: DataTypes.TEXT,
  consecuencia: DataTypes.TEXT,
  probabilidad: { type: DataTypes.ENUM('BAJA', 'MEDIA', 'ALTA'), allowNull: false, defaultValue: 'MEDIA' },
  impacto: { type: DataTypes.ENUM('BAJO', 'MEDIO', 'ALTO'), allowNull: false, defaultValue: 'MEDIO' },
  nivel: { type: DataTypes.ENUM('VERDE', 'AMARILLO', 'ROJO'), allowNull: false, defaultValue: 'VERDE' },
  mitigacion: DataTypes.TEXT,
  responsable: DataTypes.STRING,
  fecha_seguimiento: DataTypes.DATEONLY,
  estado: {
    type: DataTypes.ENUM('ABIERTO', 'EN_SEGUIMIENTO', 'MITIGADO', 'CERRADO'),
    allowNull: false,
    defaultValue: 'ABIERTO',
  },
});

Risk.beforeValidate((risk) => {
  risk.nivel = calculateRiskLevel(risk);
});

const ScopeChange = sequelize.define('ScopeChange', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  descripcion: DataTypes.TEXT,
  solicitante: DataTypes.STRING,
  motivo: DataTypes.TEXT,
  impacto_horas: DataTypes.DECIMAL(8, 2),
  impacto_fecha_dias: DataTypes.INTEGER,
  impacto_costo: DataTypes.DECIMAL(12, 2),
  estado: {
    type: DataTypes.ENUM('PENDIENTE', 'EN_EVALUACION', 'APROBADO', 'RECHAZADO', 'POSTERGADO'),
    allowNull: false,
    defaultValue: 'PENDIENTE',
  },
  decision: DataTypes.TEXT,
  fecha_solicitud: DataTypes.DATEONLY,
});

ScopeChange.beforeValidate((change) => {
  if (change.estado === 'APROBADO') {
    const hasHours = change.impacto_horas !== null && change.impacto_horas !== undefined;
    const hasDays = change.impacto_fecha_dias !== null && change.impacto_fecha_dias !== undefined;
    const hasCost = change.impacto_costo !== null && change.impacto_costo !== undefined;
    if (!hasHours || !hasDays || !hasCost) {
      throw new Error('No se puede aprobar un cambio sin impacto evaluado en horas, fecha y costo.');
    }
  }
});

const Resource = sequelize.define('Resource', {
  proyecto_id: { type: DataTypes.INTEGER, allowNull: false },
  nombre: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.ENUM('ANALISTA', 'UX', 'DEV', 'QA', 'GESTOR', 'LIDER_TECNICO'), allowNull: false },
  email: { type: DataTypes.STRING, validate: { isEmail: true } },
  horas_disponibles_semana: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 40 },
  horas_asignadas_semana: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
  carga_porcentaje: { type: DataTypes.DECIMAL(6, 2), allowNull: false, defaultValue: 0 },
  estado: { type: DataTypes.ENUM('ACTIVO', 'INACTIVO'), allowNull: false, defaultValue: 'ACTIVO' },
});

Resource.beforeValidate((resource) => {
  resource.carga_porcentaje = calculateResourceLoad(resource);
});

Task.afterSave(async (task) => {
  await syncScheduleBranches([task.previous('cronograma_item_id'), task.cronograma_item_id]);
});

Task.afterDestroy(async (task) => {
  await syncScheduleBranches([task.cronograma_item_id]);
});

TaskStage.afterSave(async (stage) => {
  await syncTaskFromStages(stage.task_id);
  await syncScheduleBranches([stage.previous('cronograma_item_id'), stage.cronograma_item_id]);
});

TaskStage.afterDestroy(async (stage) => {
  await syncTaskFromStages(stage.task_id);
  await syncScheduleBranches([stage.cronograma_item_id]);
});

const Agreement = sequelize.define('Agreement', {
  titulo: { type: DataTypes.STRING, allowNull: false },
  descripcion: DataTypes.TEXT,
  responsable: DataTypes.STRING,
  fecha_compromiso: DataTypes.DATEONLY,
  estado: { type: DataTypes.ENUM('ABIERTO', 'EN_PROCESO', 'CUMPLIDO', 'VENCIDO'), allowNull: false, defaultValue: 'ABIERTO' },
});

Project.hasMany(Task, { foreignKey: { name: 'proyecto_id', allowNull: false }, onDelete: 'CASCADE' });
Task.belongsTo(Project, { foreignKey: 'proyecto_id' });

Project.hasMany(ScheduleItem, { foreignKey: { name: 'proyecto_id', allowNull: false }, onDelete: 'CASCADE' });
ScheduleItem.belongsTo(Project, { foreignKey: 'proyecto_id' });

ScheduleItem.hasMany(ScheduleItem, { as: 'children', foreignKey: { name: 'padre_id', allowNull: true }, onDelete: 'CASCADE' });
ScheduleItem.belongsTo(ScheduleItem, { as: 'parent', foreignKey: 'padre_id' });

ScheduleItem.hasMany(Task, { foreignKey: { name: 'cronograma_item_id', allowNull: true }, onDelete: 'SET NULL' });
Task.belongsTo(ScheduleItem, { as: 'scheduleItem', foreignKey: 'cronograma_item_id' });

Project.hasMany(TaskStage, { foreignKey: { name: 'proyecto_id', allowNull: false }, onDelete: 'CASCADE' });
TaskStage.belongsTo(Project, { foreignKey: 'proyecto_id' });

Task.hasMany(TaskStage, { foreignKey: { name: 'task_id', allowNull: false }, onDelete: 'CASCADE' });
TaskStage.belongsTo(Task, { as: 'task', foreignKey: 'task_id' });

ScheduleItem.hasMany(TaskStage, { foreignKey: { name: 'cronograma_item_id', allowNull: true }, onDelete: 'SET NULL' });
TaskStage.belongsTo(ScheduleItem, { as: 'scheduleItem', foreignKey: 'cronograma_item_id' });

Project.hasMany(Risk, { foreignKey: { name: 'proyecto_id', allowNull: false }, onDelete: 'CASCADE' });
Risk.belongsTo(Project, { foreignKey: 'proyecto_id' });

Project.hasMany(ScopeChange, { foreignKey: { name: 'proyecto_id', allowNull: false }, onDelete: 'CASCADE' });
ScopeChange.belongsTo(Project, { foreignKey: 'proyecto_id' });

Project.hasMany(Resource, { foreignKey: { name: 'proyecto_id', allowNull: false }, onDelete: 'CASCADE' });
Resource.belongsTo(Project, { foreignKey: 'proyecto_id' });

Project.hasMany(Agreement, { foreignKey: { name: 'proyecto_id', allowNull: false }, onDelete: 'CASCADE' });
Agreement.belongsTo(Project, { foreignKey: 'proyecto_id' });

module.exports = { sequelize, User, Project, ScheduleItem, Task, TaskStage, Risk, ScopeChange, Resource, Agreement };
