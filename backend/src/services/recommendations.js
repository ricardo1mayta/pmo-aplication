const { Op } = require('sequelize');
const { Project, Task, TaskStage, Risk, ScopeChange, Resource, Agreement } = require('../models');
const { isPastDate } = require('../utils/calculations');

function pushRecommendation(items, type, severity, source, message) {
  items.push({ type, severity, source, message });
}

function normalizeProjectId(projectId) {
  const parsed = Number(projectId);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function buildProjectWhere(projectId) {
  const normalizedProjectId = normalizeProjectId(projectId);
  return normalizedProjectId ? { proyecto_id: normalizedProjectId } : {};
}

function buildProjectIdWhere(projectId) {
  const normalizedProjectId = normalizeProjectId(projectId);
  return normalizedProjectId ? { id: normalizedProjectId } : {};
}

async function buildRecommendations(projectId) {
  const [projects, tasks, risks, changes, resources, agreements] = await Promise.all([
    Project.findAll({ where: buildProjectIdWhere(projectId) }),
    Task.findAll({ where: buildProjectWhere(projectId), include: [Project] }),
    Risk.findAll({ where: buildProjectWhere(projectId), include: [Project] }),
    ScopeChange.findAll({ where: buildProjectWhere(projectId), include: [Project] }),
    Resource.findAll(),
    Agreement.findAll({ where: buildProjectWhere(projectId), include: [Project] }),
  ]);

  const items = [];

  projects.forEach((project) => {
    if (project.semaforo === 'ROJO') {
      pushRecommendation(items, 'PROYECTO', 'ALTA', project.nombre, 'Proyecto en rojo. Revisar ruta critica, alcance y capacidad del equipo.');
    }
  });

  tasks.forEach((task) => {
    if (task.estado !== 'DONE' && isPastDate(task.fecha_fin)) {
      pushRecommendation(items, 'TAREA', task.prioridad === 'CRITICA' ? 'CRITICA' : 'MEDIA', task.titulo, 'Escalar con el responsable y definir nueva fecha compromiso.');
    }
    if (task.bloqueado || task.estado === 'BLOQUEADO') {
      pushRecommendation(items, 'TAREA', 'ALTA', task.titulo, 'Registrar causa del bloqueo, responsable de solucion y fecha de desbloqueo.');
    }
  });

  const qaWithDefects = tasks.filter((task) => task.estado === 'EN_QA' && Number(task.defectos || 0) > 0);
  if (qaWithDefects.length >= 3) {
    pushRecommendation(items, 'TAREA', 'ALTA', 'QA', 'Priorizar correccion de defectos antes de iniciar nuevas funcionalidades.');
  }

  risks.forEach((risk) => {
    if (risk.nivel === 'ROJO') {
      pushRecommendation(items, 'RIESGO', 'CRITICA', risk.descripcion, 'Riesgo critico. Escalar a comite o gerencia.');
    }
    if (!risk.mitigacion) {
      pushRecommendation(items, 'RIESGO', 'ALTA', risk.descripcion, 'Debe registrar un plan de mitigacion.');
    }
    if (risk.estado !== 'CERRADO' && isPastDate(risk.fecha_seguimiento)) {
      pushRecommendation(items, 'RIESGO', 'MEDIA', risk.descripcion, 'Actualizar estado del riesgo y definir nueva accion.');
    }
  });

  changes.forEach((change) => {
    if (!change.impacto_horas || !change.impacto_fecha_dias) {
      pushRecommendation(items, 'CAMBIO', 'ALTA', change.titulo, 'No debe pasar a desarrollo hasta evaluar impacto.');
    }
    if (change.estado === 'APROBADO') {
      pushRecommendation(items, 'CAMBIO', 'ALTA', change.titulo, 'Actualizar cronograma, backlog y comunicar impacto al cliente.');
    }
    if (change.estado === 'RECHAZADO' && !change.decision) {
      pushRecommendation(items, 'CAMBIO', 'MEDIA', change.titulo, 'Registrar sustento formal del rechazo.');
    }
  });

  resources.forEach((resource) => {
    if (Number(resource.carga_porcentaje) > 100) {
      pushRecommendation(items, 'RECURSO', 'ALTA', resource.nombre, 'Recurso sobreasignado. Rebalancear tareas.');
    }
  });

  const criticalTasksByOwner = tasks
    .filter((task) => task.prioridad === 'CRITICA' && task.responsable)
    .reduce((acc, task) => {
      acc[task.responsable] = (acc[task.responsable] || 0) + 1;
      return acc;
    }, {});
  Object.entries(criticalTasksByOwner).forEach(([owner, count]) => {
    if (count >= 3) {
      pushRecommendation(items, 'RECURSO', 'MEDIA', owner, 'Existe dependencia fuerte de un recurso. Documentar conocimiento y redistribuir trabajo critico.');
    }
  });

  agreements.forEach((agreement) => {
    if (agreement.estado !== 'CUMPLIDO' && isPastDate(agreement.fecha_compromiso)) {
      pushRecommendation(items, 'ACUERDO', 'MEDIA', agreement.titulo, 'Acuerdo vencido. Reprogramar compromiso y registrar responsable de cierre.');
    }
  });

  return items;
}

async function dashboardSummary(projectId) {
  const normalizedProjectId = normalizeProjectId(projectId);
  const [projects, tasks, taskStages, risks, changes, resources, agreements, recommendations] = await Promise.all([
    Project.findAll({ where: buildProjectIdWhere(normalizedProjectId) }),
    Task.findAll({ where: buildProjectWhere(normalizedProjectId) }),
    TaskStage.findAll({ where: buildProjectWhere(normalizedProjectId) }),
    Risk.findAll({ where: buildProjectWhere(normalizedProjectId) }),
    ScopeChange.findAll({ where: { ...buildProjectWhere(normalizedProjectId), estado: { [Op.in]: ['PENDIENTE', 'EN_EVALUACION'] } } }),
    Resource.findAll(),
    Agreement.findAll({ where: buildProjectWhere(normalizedProjectId) }),
    buildRecommendations(normalizedProjectId),
  ]);

  const by = (rows, field) => rows.reduce((acc, row) => {
    const key = row[field] || 'SIN_DATO';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const activeProjects = projects.filter((project) => !['FINALIZADO', 'CANCELADO'].includes(project.estado));
  const openTasks = tasks.filter((task) => task.estado !== 'DONE');
  const doneTasks = tasks.filter((task) => task.estado === 'DONE');
  const overdueTasks = openTasks.filter((task) => isPastDate(task.fecha_fin));
  const blockedTasks = tasks.filter((task) => task.bloqueado || task.estado === 'BLOQUEADO');
  const redRisks = risks.filter((risk) => risk.nivel === 'ROJO' && risk.estado !== 'CERRADO');
  const pendingChanges = changes;
  const pendingAgreements = agreements.filter((agreement) => agreement.estado !== 'CUMPLIDO');
  const pendingSignatures = taskStages.filter((stage) => ['PENDIENTE', 'ENVIADO', 'OBSERVADO'].includes(stage.estado_firma_usuario));
  const overloadedResources = resources.filter((resource) => Number(resource.carga_porcentaje) > 100);
  const averageProjectProgress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + Number(project.avance_real || 0), 0) / projects.length)
    : 0;
  const deliveryRate = tasks.length ? Math.round((doneTasks.length / tasks.length) * 100) : 0;
  const nextTasks = openTasks
    .filter((task) => task.fecha_fin)
    .sort((a, b) => String(a.fecha_fin).localeCompare(String(b.fecha_fin)))
    .slice(0, 5)
    .map((task) => ({ title: task.titulo, detail: task.fecha_fin, status: task.estado }));
  const nextProjectEnds = activeProjects
    .filter((project) => project.fecha_fin)
    .sort((a, b) => String(a.fecha_fin).localeCompare(String(b.fecha_fin)))
    .slice(0, 5)
    .map((project) => ({ title: project.nombre, detail: project.fecha_fin, status: project.semaforo }));

  return {
    selected_project_id: normalizedProjectId,
    metrics: {
      proyectos: projects.length,
      tareas_abiertas: tasks.filter((task) => task.estado !== 'DONE').length,
      riesgos_rojos: risks.filter((risk) => risk.nivel === 'ROJO').length,
      cambios_pendientes: changes.length,
      recursos_sobrecargados: resources.filter((resource) => Number(resource.carga_porcentaje) > 100).length,
    },
    charts: {
      proyectos_por_estado: by(projects, 'estado'),
      tareas_por_estado: by(tasks, 'estado'),
      riesgos_por_nivel: by(risks, 'nivel'),
      recursos_por_rol: by(resources, 'rol'),
    },
    questions: [
      {
        key: 'where_are_we',
        title: 'Donde estamos',
        answer: activeProjects.length
          ? `${activeProjects.length} proyectos activos con ${averageProjectProgress}% de avance promedio.`
          : 'No hay proyectos activos en seguimiento.',
        tone: activeProjects.some((project) => project.semaforo === 'ROJO') ? 'danger' : 'progress',
        metrics: [
          { label: 'Proyectos activos', value: activeProjects.length },
          { label: 'Avance promedio', value: `${averageProjectProgress}%` },
          { label: 'Proyectos en rojo', value: projects.filter((project) => project.semaforo === 'ROJO').length },
        ],
        items: activeProjects.slice(0, 5).map((project) => ({ title: project.nombre, detail: `${project.estado} - ${project.avance_real}%`, status: project.semaforo })),
      },
      {
        key: 'where_are_we_going',
        title: 'A donde vamos',
        answer: nextProjectEnds.length
          ? `Los proximos cierres relevantes estan concentrados en ${nextProjectEnds.length} proyecto(s).`
          : 'No hay fechas fin de proyecto registradas para proyectar el destino.',
        tone: 'progress',
        metrics: [
          { label: 'Proximos cierres', value: nextProjectEnds.length },
          { label: 'HU abiertas', value: openTasks.length },
          { label: 'HU terminadas', value: doneTasks.length },
        ],
        items: nextProjectEnds,
      },
      {
        key: 'how_are_we_doing',
        title: 'Como vamos',
        answer: tasks.length
          ? `${deliveryRate}% de HU terminadas; ${overdueTasks.length} HU vencidas requieren atencion.`
          : 'Aun no hay HU registradas para medir avance.',
        tone: overdueTasks.length ? 'warning' : 'success',
        metrics: [
          { label: 'Cumplimiento HU', value: `${deliveryRate}%` },
          { label: 'HU vencidas', value: overdueTasks.length },
          { label: 'Defectos QA', value: tasks.reduce((sum, task) => sum + Number(task.defectos || 0), 0) },
        ],
        items: nextTasks,
      },
      {
        key: 'what_blocks_us',
        title: 'Que nos bloquea',
        answer: blockedTasks.length || redRisks.length || overloadedResources.length
          ? `${blockedTasks.length} HU bloqueadas, ${redRisks.length} riesgos rojos y ${overloadedResources.length} recursos sobrecargados.`
          : 'No hay bloqueos criticos registrados.',
        tone: blockedTasks.length || redRisks.length || overloadedResources.length ? 'danger' : 'success',
        metrics: [
          { label: 'HU bloqueadas', value: blockedTasks.length },
          { label: 'Riesgos rojos', value: redRisks.length },
          { label: 'Sobrecarga', value: overloadedResources.length },
        ],
        items: [
          ...blockedTasks.slice(0, 3).map((task) => ({ title: task.titulo, detail: task.motivo_bloqueo || 'Sin motivo registrado', status: 'BLOQUEO' })),
          ...redRisks.slice(0, 2).map((risk) => ({ title: risk.descripcion, detail: risk.responsable || 'Sin responsable', status: risk.nivel })),
        ],
      },
      {
        key: 'what_needs_decision',
        title: 'Que decisiones faltan',
        answer: pendingChanges.length || pendingSignatures.length || pendingAgreements.length
          ? `${pendingChanges.length} cambios por decidir, ${pendingSignatures.length} firmas pendientes y ${pendingAgreements.length} acuerdos abiertos.`
          : 'No hay decisiones pendientes registradas.',
        tone: pendingChanges.length || pendingSignatures.length || pendingAgreements.length ? 'warning' : 'success',
        metrics: [
          { label: 'Cambios pendientes', value: pendingChanges.length },
          { label: 'Firmas usuario', value: pendingSignatures.length },
          { label: 'Acuerdos abiertos', value: pendingAgreements.length },
        ],
        items: [
          ...pendingChanges.slice(0, 3).map((change) => ({ title: change.titulo, detail: change.estado, status: 'CAMBIO' })),
          ...pendingAgreements.slice(0, 2).map((agreement) => ({ title: agreement.titulo, detail: agreement.fecha_compromiso || 'Sin fecha', status: agreement.estado })),
        ],
      },
    ],
    recommendations,
  };
}

module.exports = { buildRecommendations, dashboardSummary };
