import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserRouter, Navigate, NavLink, Route, Routes, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import './App.css'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://app.sismas.pe/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pmo_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const colors = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']
const scheduleCollapseStorageKey = 'pmo_schedule_collapsed_ids'
const scheduleViewStorageKey = 'pmo_schedule_view_mode'
const sidebarCollapseStorageKey = 'pmo_sidebar_collapsed'

const iconPaths = {
  add: <path d="M12 5v14M5 12h14" />,
  addChild: <path d="M6 4v6a4 4 0 0 0 4 4h4M14 10v8M10 14h8" />,
  check: <path d="m5 12 4 4L19 6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  columns: <path d="M4 6h16M4 12h16M4 18h16M8 4v16M16 4v16" />,
  download: <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />,
  edit: <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />,
  eye: <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />,
  filter: <path d="M4 5h16M7 12h10M10 19h4" />,
  login: <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />,
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  menu: <path d="M4 6h16M4 12h16M4 18h16" />,
  panelLeft: <path d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2ZM9 3v18" />,
  save: <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2ZM7 3v6h8M7 21v-8h10v8" />,
  task: <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />,
  trash: <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />,
  user: <path d="M20 21a8 8 0 0 0-16 0M12 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8" />,
  userPlus: <path d="M16 21a7 7 0 0 0-14 0M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8M19 8v6M16 11h6" />,
  x: <path d="M18 6 6 18M6 6l12 12" />,
}

const navIcons = {
  Dashboard: 'panelLeft',
  'Canvas HU': 'columns',
  Proyectos: 'panelLeft',
  Cronograma: 'menu',
  'HU / SD': 'check',
  'Actividades HU': 'task',
  Riesgos: 'filter',
  Cambios: 'edit',
  Recursos: 'user',
  Acuerdos: 'save',
}

function Icon({ name }) {
  return (
    <svg className="icon" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  )
}

const modules = {
  projects: {
    title: 'Proyectos',
    endpoint: '/projects',
    help: {
      summary: 'Crea aqui cada iniciativa que quieras controlar de punta a punta.',
      tips: [
        'Registra objetivo, fechas, responsable, avance y presupuesto para que el sistema calcule desviacion y semaforo.',
        'Usa EN_RIESGO cuando el proyecto requiera seguimiento especial o decisiones de gestion.',
        'Despues de crear el proyecto, vincula HU / SD, riesgos, cambios y acuerdos desde sus modulos.',
      ],
    },
    filters: [],
    fields: [
      ['nombre', 'text', 'Nombre'],
      ['descripcion', 'textarea', 'Descripcion'],
      ['objetivo', 'textarea', 'Objetivo'],
      ['fecha_inicio', 'date', 'Inicio'],
      ['fecha_fin', 'date', 'Fin'],
      ['responsable', 'resource', 'Responsable'],
      ['estado', 'select', 'Estado', ['PLANIFICADO', 'EN_PROCESO', 'EN_RIESGO', 'FINALIZADO', 'CANCELADO']],
      ['avance_planificado', 'number', 'Avance planificado'],
      ['avance_real', 'number', 'Avance real'],
      ['presupuesto_estimado', 'number', 'Presupuesto estimado'],
      ['presupuesto_consumido', 'number', 'Presupuesto consumido'],
    ],
    columns: ['nombre', 'responsable', 'estado', 'semaforo', 'desviacion', 'avance_real'],
  },
  schedule: {
    title: 'Cronograma',
    endpoint: '/schedule-items',
    help: {
      summary: 'Construye la estructura dinamica del proyecto: fases, subfases, actividades, hitos o entregables.',
      tips: [
        'Cada elemento puede tener un padre opcional; si no tiene padre queda como primer nivel.',
        'Puedes crear tantos niveles como necesites: un proyecto puede tener 1 nivel y otro 5 niveles.',
        'Agrega actividades desde una fila del cronograma; los avances de los padres se calculan con el promedio de sus hijos.',
      ],
    },
    filters: ['proyecto_id', 'padre_id', 'estado', 'tipo'],
    fields: [
      ['proyecto_id', 'project', 'Proyecto'],
      ['padre_id', 'scheduleParent', 'Elemento padre'],
      ['nombre', 'text', 'Nombre'],
      ['descripcion', 'textarea', 'Descripcion'],
      ['tipo', 'select', 'Tipo', ['FASE', 'SUBFASE', 'ACTIVIDAD', 'HITO', 'ENTREGABLE', 'OTRO']],
      ['orden', 'number', 'Orden'],
      ['fecha_inicio', 'date', 'Inicio'],
      ['fecha_fin', 'date', 'Fin'],
      ['avance_planificado', 'number', 'Avance planificado'],
      ['avance_real', 'number', 'Avance real'],
      ['responsable', 'resource', 'Responsable'],
      ['estado', 'select', 'Estado', ['PENDIENTE', 'EN_PROCESO', 'EN_RIESGO', 'COMPLETADO', 'CANCELADO']],
    ],
    columns: ['tree', 'proyecto_id', 'tipo', 'responsable', 'estado', 'fecha_fin', 'avance_real'],
  },
  tasks: {
    title: 'HU / SD',
    endpoint: '/tasks',
    help: {
      summary: 'Registra el backlog y el flujo de trabajo de HU o SD del proyecto seleccionado.',
      tips: [
        'Elige primero el proyecto; luego define tipo, prioridad, responsables, fechas y avance.',
        'Marca Bloqueado y completa el motivo cuando la HU o SD no pueda avanzar.',
        'Para HU o SD criticas vencidas, el dashboard recomendara escalar y definir nueva fecha compromiso.',
      ],
    },
    filters: ['proyecto_id', 'cronograma_item_id', 'estado', 'analistas_funcionales', 'lideres_tecnicos', 'desarrolladores'],
    fields: [
      ['proyecto_id', 'project', 'Proyecto'],
      ['cronograma_item_id', 'scheduleItem', 'Elemento cronograma'],
      ['titulo', 'text', 'Titulo'],
      ['descripcion', 'textarea', 'Descripcion'],
      ['prototipo_url', 'url', 'Link prototipo'],
      ['prototipo_herramienta', 'text', 'Herramienta prototipo'],
      ['tipo', 'select', 'Tipo', ['ANALISIS', 'UX', 'DESARROLLO', 'CODE_REVIEW', 'QA', 'UAT', 'DOCUMENTACION']],
      ['prioridad', 'select', 'Prioridad', ['BAJA', 'MEDIA', 'ALTA', 'CRITICA']],
      ['estado', 'select', 'Estado', ['BACKLOG', 'EN_ANALISIS', 'EN_UX', 'EN_DESARROLLO', 'CODE_REVIEW', 'EN_QA', 'EN_UAT', 'DONE', 'BLOQUEADO']],
      ['analistas_funcionales', 'resourceMulti', 'Analistas funcionales', ['ANALISTA']],
      ['lideres_tecnicos', 'resourceMulti', 'Lideres tecnicos', ['LIDER_TECNICO']],
      ['desarrolladores', 'resourceMulti', 'Desarrolladores', ['DEV']],
      ['responsable', 'resource', 'Responsable principal'],
      ['fecha_inicio', 'date', 'Inicio'],
      ['fecha_fin', 'date', 'Fin'],
      ['avance', 'number', 'Avance'],
      ['bloqueado', 'checkbox', 'Bloqueado'],
      ['motivo_bloqueo', 'textarea', 'Motivo bloqueo'],
      ['defectos', 'number', 'Defectos'],
    ],
    columns: ['titulo', 'proyecto_id', 'cronograma_item_id', 'prototipo_url', 'analistas_funcionales', 'lideres_tecnicos', 'desarrolladores', 'prioridad', 'estado', 'avance', 'fecha_inicio', 'fecha_fin', 'dias_asignados', 'status_plazo'],
  },
  taskStages: {
    title: 'Actividades HU',
    endpoint: '/task-stages',
    help: {
      summary: 'Registra actividades paralelas por HU para controlar analisis, UX, desarrollo, QA, UAT y firma de usuario.',
      tips: [
        'La HU / SD se mantiene como registro principal; cada fila representa una actividad con responsables, fechas, avance y horas propias.',
        'Completar analisis no obliga a esperar la firma para iniciar desarrollo; registra la firma como control separado.',
        'Usa Estado plazo para detectar atrasos por actividad, no solo por la HU completa.',
      ],
    },
    filters: ['proyecto_id', 'task_id', 'cronograma_item_id', 'nombre', 'etapa', 'estado', 'estado_firma_usuario', 'responsables'],
    fields: [
      ['proyecto_id', 'project', 'Proyecto'],
      ['task_id', 'task', 'HU / SD'],
      ['cronograma_item_id', 'scheduleItem', 'Elemento cronograma'],
      ['nombre', 'text', 'Actividad'],
      ['etapa', 'select', 'Tipo actividad', ['BACKLOG', 'ANALISIS', 'UX', 'DESARROLLO', 'CODE_REVIEW', 'QA', 'UAT', 'DOCUMENTACION', 'FIRMA_USUARIO', 'DONE']],
      ['estado', 'select', 'Estado', ['PENDIENTE', 'EN_PROCESO', 'COMPLETADO', 'BLOQUEADO']],
      ['responsables', 'resourceMulti', 'Responsables', []],
      ['fecha_inicio', 'date', 'Inicio'],
      ['fecha_fin', 'date', 'Fin'],
      ['avance', 'number', 'Avance'],
      ['horas_estimadas', 'number', 'Horas estimadas'],
      ['horas_ejecutadas', 'number', 'Horas ejecutadas'],
      ['estado_firma_usuario', 'select', 'Firma usuario', ['NO_APLICA', 'PENDIENTE', 'ENVIADO', 'FIRMADO', 'OBSERVADO']],
      ['fecha_firma_usuario', 'date', 'Fecha firma usuario'],
      ['observaciones', 'textarea', 'Observaciones'],
    ],
    columns: ['task_id', 'nombre', 'proyecto_id', 'cronograma_item_id', 'etapa', 'estado', 'responsables', 'avance', 'horas_estimadas', 'horas_ejecutadas', 'estado_firma_usuario', 'fecha_inicio', 'fecha_fin', 'dias_asignados', 'status_plazo'],
  },
  risks: {
    title: 'Riesgos',
    endpoint: '/risks',
    help: {
      summary: 'Registra eventos que pueden afectar alcance, fecha, costo o calidad.',
      tips: [
        'Describe causa y consecuencia para que la accion de mitigacion sea clara.',
        'El nivel se calcula solo con probabilidad e impacto; ROJO requiere escalamiento.',
        'Completa mitigacion y fecha de seguimiento para evitar alertas pendientes.',
      ],
    },
    filters: ['proyecto_id', 'estado', 'nivel'],
    fields: [
      ['proyecto_id', 'project', 'Proyecto'],
      ['descripcion', 'textarea', 'Descripcion'],
      ['causa', 'textarea', 'Causa'],
      ['consecuencia', 'textarea', 'Consecuencia'],
      ['probabilidad', 'select', 'Probabilidad', ['BAJA', 'MEDIA', 'ALTA']],
      ['impacto', 'select', 'Impacto', ['BAJO', 'MEDIO', 'ALTO']],
      ['mitigacion', 'textarea', 'Mitigacion'],
      ['responsable', 'resource', 'Responsable'],
      ['fecha_seguimiento', 'date', 'Seguimiento'],
      ['estado', 'select', 'Estado', ['ABIERTO', 'EN_SEGUIMIENTO', 'MITIGADO', 'CERRADO']],
    ],
    columns: ['descripcion', 'proyecto_id', 'probabilidad', 'impacto', 'nivel', 'estado'],
  },
  scopeChanges: {
    title: 'Cambios',
    endpoint: '/scope-changes',
    help: {
      summary: 'Gestiona solicitudes que modifican alcance, cronograma, costo o esfuerzo.',
      tips: [
        'No apruebes un cambio hasta evaluar impacto en horas, dias y costo.',
        'Si el cambio se aprueba, actualiza cronograma, backlog y comunica el impacto.',
        'Si se rechaza, registra la decision formal para dejar trazabilidad.',
      ],
    },
    filters: ['proyecto_id', 'estado'],
    fields: [
      ['proyecto_id', 'project', 'Proyecto'],
      ['titulo', 'text', 'Titulo'],
      ['descripcion', 'textarea', 'Descripcion'],
      ['solicitante', 'text', 'Solicitante'],
      ['motivo', 'textarea', 'Motivo'],
      ['impacto_horas', 'number', 'Impacto horas'],
      ['impacto_fecha_dias', 'number', 'Impacto dias'],
      ['impacto_costo', 'number', 'Impacto costo'],
      ['estado', 'select', 'Estado', ['PENDIENTE', 'EN_EVALUACION', 'APROBADO', 'RECHAZADO', 'POSTERGADO']],
      ['decision', 'textarea', 'Decision'],
      ['fecha_solicitud', 'date', 'Solicitud'],
    ],
    columns: ['titulo', 'proyecto_id', 'solicitante', 'estado', 'impacto_horas', 'impacto_fecha_dias'],
  },
  resources: {
    title: 'Recursos',
    endpoint: '/resources',
    help: {
      summary: 'Registra el equipo disponible para asignar responsables y controlar carga.',
      tips: [
        'Crea primero los recursos para que aparezcan como responsables en otros modulos.',
        'La carga se calcula con horas asignadas sobre horas disponibles por semana.',
        'Si supera 100%, el dashboard recomendara rebalancear HU / SD.',
      ],
    },
    filters: ['rol', 'estado'],
    fields: [
      ['nombre', 'text', 'Nombre'],
      ['rol', 'select', 'Rol', ['ANALISTA', 'UX', 'DEV', 'QA', 'GESTOR', 'LIDER_TECNICO']],
      ['email', 'email', 'Email'],
      ['horas_disponibles_semana', 'number', 'Horas disponibles'],
      ['horas_asignadas_semana', 'number', 'Horas asignadas'],
      ['estado', 'select', 'Estado', ['ACTIVO', 'INACTIVO']],
    ],
    columns: ['nombre', 'rol', 'email', 'horas_asignadas_semana', 'carga_porcentaje', 'estado'],
  },
  agreements: {
    title: 'Acuerdos',
    endpoint: '/agreements',
    help: {
      summary: 'Registra compromisos, decisiones y pendientes acordados con equipo o cliente.',
      tips: [
        'Vincula el acuerdo a un proyecto y asigna responsable con fecha compromiso.',
        'Usalo para acciones de comite, aprobaciones, entregables o dependencias externas.',
        'Los acuerdos vencidos apareceran como recomendacion para reprogramar o cerrar.',
      ],
    },
    filters: ['proyecto_id', 'estado'],
    fields: [
      ['proyecto_id', 'project', 'Proyecto'],
      ['titulo', 'text', 'Titulo'],
      ['descripcion', 'textarea', 'Descripcion'],
      ['responsable', 'resource', 'Responsable'],
      ['fecha_compromiso', 'date', 'Compromiso'],
      ['estado', 'select', 'Estado', ['ABIERTO', 'EN_PROCESO', 'CUMPLIDO', 'VENCIDO']],
    ],
    columns: ['titulo', 'proyecto_id', 'responsable', 'fecha_compromiso', 'estado'],
  },
}

function toChartData(source = {}) {
  return Object.entries(source).map(([name, value]) => ({ name, value }))
}

function hasFieldType(module, type) {
  return module.fields.some(([, fieldType]) => fieldType === type) || module.filters.includes('proyecto_id')
}

function buildScheduleOptions(items) {
  const byParent = items.reduce((acc, item) => {
    const key = item.padre_id || 'root'
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})

  Object.values(byParent).forEach((group) => {
    group.sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || a.nombre.localeCompare(b.nombre))
  })

  const walk = (parentId = 'root', level = 0) => (byParent[parentId] || []).flatMap((item) => [
    { ...item, level, label: `${'  '.repeat(level)}${item.nombre}` },
    ...walk(item.id, level + 1),
  ])

  return walk()
}

function getScheduleChildren(items) {
  const visibleIds = new Set(items.map((item) => Number(item.id)))
  return items.reduce((acc, item) => {
    const key = item.padre_id && visibleIds.has(Number(item.padre_id)) ? item.padre_id : 'root'
    acc[key] = acc[key] || []
    acc[key].push(item)
    return acc
  }, {})
}

function sortScheduleGroups(byParent) {
  Object.values(byParent).forEach((group) => {
    group.sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0) || a.nombre.localeCompare(b.nombre))
  })
}

function buildScheduleTreeRows(items, collapsedIds) {
  const byParent = getScheduleChildren(items)
  sortScheduleGroups(byParent)

  const countDescendants = (itemId) => (byParent[itemId] || []).reduce((total, child) => total + 1 + countDescendants(child.id), 0)

  const walk = (parentId = 'root', level = 0) => (byParent[parentId] || []).flatMap((item) => {
    const children = byParent[item.id] || []
    const row = {
      ...item,
      level,
      label: `${'  '.repeat(level)}${item.nombre}`,
      hasChildren: children.length > 0,
      childCount: countDescendants(item.id),
    }

    return collapsedIds.has(item.id) ? [row] : [row, ...walk(item.id, level + 1)]
  })

  return walk()
}

function buildScheduleActivityRows(items) {
  const byId = new Map(items.map((item) => [Number(item.id), item]))
  const byParent = getScheduleChildren(items)
  sortScheduleGroups(byParent)

  const getPath = (item) => {
    const names = []
    let current = item
    while (current) {
      names.unshift(current.nombre)
      current = current.padre_id ? byId.get(Number(current.padre_id)) : null
    }
    return names.join(' / ')
  }

  const hasActivityAncestor = (item) => {
    let current = item.padre_id ? byId.get(Number(item.padre_id)) : null
    while (current) {
      if (current.tipo === 'ACTIVIDAD') return true
      current = current.padre_id ? byId.get(Number(current.padre_id)) : null
    }
    return false
  }

  const walk = (parentId = 'root', level = 0) => (byParent[parentId] || []).flatMap((item) => {
    const children = byParent[item.id] || []
    const row = {
      ...item,
      level,
      label: getPath(item),
      hasChildren: children.length > 0,
      childCount: children.length,
      activityPath: getPath(item),
    }
    const descendants = walk(item.id, level + 1)
    return item.tipo === 'ACTIVIDAD' || hasActivityAncestor(item) ? [row, ...descendants] : descendants
  })

  return walk()
}

function escapeXml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function toProjectDate(value, endOfDay = false) {
  if (!value) return ''
  return `${value}T${endOfDay ? '17:00:00' : '08:00:00'}`
}

function toProjectDuration(start, finish) {
  if (!start || !finish) return 'PT0H0M0S'
  const startDate = new Date(`${start}T00:00:00`)
  const finishDate = new Date(`${finish}T00:00:00`)
  const days = Math.max(1, Math.floor((finishDate - startDate) / 86400000) + 1)
  return `PT${days * 8}H0M0S`
}

function buildProjectXml(items, projectName = 'Cronograma PMO') {
  const sortedRows = buildScheduleTreeRows(items, new Set())
  const childIds = new Set(items.filter((item) => item.padre_id).map((item) => Number(item.padre_id)))
  const outlineCounters = []
  const taskXml = sortedRows.map((item, index) => {
    outlineCounters[item.level] = (outlineCounters[item.level] || 0) + 1
    outlineCounters.length = item.level + 1
    const outlineNumber = outlineCounters.join('.')
    const uid = index + 1
    const start = toProjectDate(item.fecha_inicio)
    const finish = toProjectDate(item.fecha_fin, true)
    const percentComplete = Math.max(0, Math.min(100, Math.round(Number(item.avance_real || 0))))
    const isSummary = childIds.has(Number(item.id)) ? 1 : 0
    const isMilestone = item.tipo === 'HITO' ? 1 : 0

    return `    <Task>
      <UID>${uid}</UID>
      <ID>${uid}</ID>
      <Name>${escapeXml(item.nombre)}</Name>
      <Type>1</Type>
      <IsNull>0</IsNull>
      <CreateDate>${new Date().toISOString().slice(0, 19)}</CreateDate>
      <WBS>${outlineNumber}</WBS>
      <OutlineNumber>${outlineNumber}</OutlineNumber>
      <OutlineLevel>${Number(item.level || 0) + 1}</OutlineLevel>
      <Priority>500</Priority>
      <Start>${start}</Start>
      <Finish>${finish}</Finish>
      <Duration>${toProjectDuration(item.fecha_inicio, item.fecha_fin)}</Duration>
      <DurationFormat>7</DurationFormat>
      <Summary>${isSummary}</Summary>
      <Milestone>${isMilestone}</Milestone>
      <PercentComplete>${percentComplete}</PercentComplete>
      <Notes>${escapeXml(item.descripcion || '')}</Notes>
    </Task>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Project xmlns="http://schemas.microsoft.com/project">
  <Name>${escapeXml(projectName)}</Name>
  <Title>${escapeXml(projectName)}</Title>
  <ScheduleFromStart>1</ScheduleFromStart>
  <StartDate>${toProjectDate(sortedRows.find((item) => item.fecha_inicio)?.fecha_inicio || new Date().toISOString().slice(0, 10))}</StartDate>
  <MinutesPerDay>480</MinutesPerDay>
  <MinutesPerWeek>2400</MinutesPerWeek>
  <DaysPerMonth>20</DaysPerMonth>
  <DefaultStartTime>08:00:00</DefaultStartTime>
  <DefaultFinishTime>17:00:00</DefaultFinishTime>
  <Tasks>
${taskXml}
  </Tasks>
</Project>
`
}

function getXmlText(node, tagName) {
  return node.getElementsByTagNameNS('*', tagName)[0]?.textContent?.trim() || ''
}

function toDateOnly(value) {
  return value ? value.slice(0, 10) : ''
}

function parseProjectXmlTasks(fileContent) {
  const documentXml = new DOMParser().parseFromString(fileContent, 'application/xml')
  const parserError = documentXml.getElementsByTagName('parsererror')[0]
  if (parserError) throw new Error('El XML no tiene un formato valido.')

  const tasks = Array.from(documentXml.getElementsByTagNameNS('*', 'Task'))
    .map((task, index) => {
      const name = getXmlText(task, 'Name')
      const outlineLevel = Number(getXmlText(task, 'OutlineLevel') || 1)
      const milestone = getXmlText(task, 'Milestone') === '1'
      const summary = getXmlText(task, 'Summary') === '1'
      const percentComplete = Number(getXmlText(task, 'PercentComplete') || 0)

      return {
        sourceIndex: index,
        name,
        notes: getXmlText(task, 'Notes'),
        outlineLevel: Number.isFinite(outlineLevel) && outlineLevel > 0 ? outlineLevel : 1,
        start: toDateOnly(getXmlText(task, 'Start')),
        finish: toDateOnly(getXmlText(task, 'Finish')),
        percentComplete: Number.isFinite(percentComplete) ? Math.max(0, Math.min(100, percentComplete)) : 0,
        tipo: milestone ? 'HITO' : summary ? 'FASE' : 'ACTIVIDAD',
      }
    })
    .filter((task) => task.name)

  if (!tasks.length) throw new Error('No se encontraron elementos dentro del XML.')
  return tasks
}

function downloadTextFile(filename, content, type = 'application/xml') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function escapeCsv(value) {
  const text = String(value ?? '')
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text
}

function buildCsv(rows, columns) {
  return [
    columns.map(escapeCsv).join(','),
    ...rows.map((row) => columns.map((column) => escapeCsv(row[column])).join(',')),
  ].join('\n')
}

function parseCsv(content) {
  const rows = []
  let row = []
  let value = ''
  let quoted = false

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]
    const nextChar = content[index + 1]

    if (quoted) {
      if (char === '"' && nextChar === '"') {
        value += '"'
        index += 1
      } else if (char === '"') {
        quoted = false
      } else {
        value += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(value)
      value = ''
    } else if (char === '\n') {
      row.push(value)
      rows.push(row)
      row = []
      value = ''
    } else if (char !== '\r') {
      value += char
    }
  }

  row.push(value)
  rows.push(row)

  const [headers = [], ...dataRows] = rows.filter((item) => item.some((cell) => cell !== ''))
  return dataRows.map((dataRow) => Object.fromEntries(headers.map((header, index) => [header, dataRow[index] ?? ''])))
}

function getExpandableScheduleIds(items) {
  const byParent = getScheduleChildren(items)
  return items.filter((item) => (byParent[item.id] || []).length > 0).map((item) => item.id)
}

function getStoredScheduleCollapsedIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(scheduleCollapseStorageKey) || '[]')
    return new Set(Array.isArray(stored) ? stored : [])
  } catch {
    return new Set()
  }
}

function getStoredScheduleViewMode() {
  return localStorage.getItem(scheduleViewStorageKey) === 'activities' ? 'activities' : 'tree'
}

function columnLabel(column) {
  const labels = {
    tree: 'Elemento',
    proyecto_id: 'Proyecto',
    padre_id: 'Elemento padre',
    cronograma_item_id: 'Elemento cronograma',
    task_id: 'HU / SD',
    etapa: 'Tipo actividad',
    fecha_inicio: 'Inicio',
    fecha_fin: 'Fecha fin',
    dias_asignados: 'Dias asignados',
    status_plazo: 'Estado plazo',
    avance_real: 'Avance real',
    horas_estimadas: 'Horas estimadas',
    horas_ejecutadas: 'Horas ejecutadas',
    estado_firma_usuario: 'Firma usuario',
    fecha_firma_usuario: 'Fecha firma usuario',
    prototipo_url: 'Prototipo',
    prototipo_herramienta: 'Herramienta prototipo',
    carga_porcentaje: 'Carga',
    impacto_fecha_dias: 'Impacto dias',
    impacto_horas: 'Impacto horas',
  }

  return labels[column] || column.replaceAll('_', ' ')
}

function statusClass(value) {
  const normalized = String(value || '').toLowerCase()
  if (['finalizado', 'completado', 'done', 'cumplido', 'cerrado', 'mitigado', 'aprobado', 'activo', 'firmado'].includes(normalized)) return 'success'
  if (['en_proceso', 'en_analisis', 'en_ux', 'en_desarrollo', 'code_review', 'en_qa', 'en_uat', 'en_seguimiento', 'en_evaluacion', 'planificado', 'pendiente', 'enviado', 'backlog', 'postergado'].includes(normalized)) return 'progress'
  if (['en_riesgo', 'bloqueado', 'vencido', 'critica', 'rojo', 'observado'].includes(normalized)) return 'danger'
  if (['cancelado', 'rechazado', 'inactivo', 'no_aplica'].includes(normalized)) return 'muted'
  return 'neutral'
}

function useAuth() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('pmo_user') || 'null'))
  const login = (payload) => {
    localStorage.setItem('pmo_token', payload.token)
    localStorage.setItem('pmo_user', JSON.stringify(payload.user))
    setUser(payload.user)
  }
  const logout = () => {
    localStorage.removeItem('pmo_token')
    localStorage.removeItem('pmo_user')
    setUser(null)
  }
  return { user, login, logout }
}

function AuthPage({ onAuth }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'GESTOR' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function submit(event) {
    event.preventDefault()
    setError('')
    try {
      const path = mode === 'login' ? '/auth/login' : '/auth/register'
      const { data } = await api.post(path, form)
      onAuth(data)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo autenticar.')
    }
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div>
          <p className="eyebrow">PMO ligera</p>
          <h1>Control inteligente de proyectos</h1>
        </div>
        <form onSubmit={submit} className="form stack">
          <div className="segmented">
            <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}><Icon name="user" />Login</button>
            <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}><Icon name="userPlus" />Registro</button>
          </div>
          {mode === 'register' && (
            <>
              <label>Nombre<input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} /></label>
              <label>Rol<select value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}>{['ADMIN', 'GESTOR', 'ANALISTA', 'UX', 'DEV', 'QA', 'LIDER_TECNICO'].map((item) => <option key={item}>{item}</option>)}</select></label>
            </>
          )}
          <label>Email<input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></label>
          <label>Password<input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit"><Icon name={mode === 'login' ? 'login' : 'userPlus'} />{mode === 'login' ? 'Ingresar' : 'Crear usuario'}</button>
        </form>
      </section>
    </main>
  )
}

function Layout({ user, logout }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem(sidebarCollapseStorageKey) === 'true')

  function toggleSidebar() {
    setSidebarCollapsed((current) => {
      const next = !current
      localStorage.setItem(sidebarCollapseStorageKey, String(next))
      return next
    })
  }

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-user">
            <p className="eyebrow">PMO App</p>
            <strong>{user?.nombre}</strong>
            <span>{user?.rol}</span>
          </div>
          <button
            className="ghost icon-button sidebar-toggle"
            type="button"
            onClick={toggleSidebar}
            title={sidebarCollapsed ? 'Expandir menu' : 'Colapsar menu'}
            aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Colapsar menu lateral'}
          >
            <Icon name={sidebarCollapsed ? 'menu' : 'panelLeft'} />
          </button>
        </div>
        <nav>
          <NavLink to="/" title="Dashboard"><Icon name={navIcons.Dashboard} /><span>Dashboard</span></NavLink>
          <NavLink to="/hu-flow" title="Canvas HU"><Icon name={navIcons['Canvas HU']} /><span>Canvas HU</span></NavLink>
          {Object.entries(modules).map(([key, module]) => (
            <NavLink key={key} to={`/${key}`} title={module.title}>
              <Icon name={navIcons[module.title] || 'panelLeft'} />
              <span>{module.title}</span>
            </NavLink>
          ))}
        </nav>
        <button className="ghost sidebar-logout" onClick={logout} title="Salir"><Icon name="logout" /><span>Salir</span></button>
      </aside>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/hu-flow" element={<HuFlowBoard />} />
        {Object.entries(modules).map(([key, module]) => (
          <Route key={key} path={`/${key}`} element={<CrudPage key={key} module={module} />} />
        ))}
      </Routes>
    </div>
  )
}

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [projects, setProjects] = useState([])
  const [projectId, setProjectId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const dashboardRequestId = useRef(0)

  useEffect(() => {
    let active = true
    api.get('/projects').then(({ data }) => {
      if (!active) return
      setProjects(data)
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'No se pudo cargar el dashboard.')
    })
    return () => {
      active = false
    }
  }, [])

  const loadDashboard = useCallback(async (nextProjectId) => {
    const requestId = dashboardRequestId.current + 1
    dashboardRequestId.current = requestId
    setError('')
    setLoading(true)
    try {
      const params = nextProjectId ? { proyecto_id: nextProjectId, _ts: Date.now() } : { _ts: Date.now() }
      const { data } = await api.get('/dashboard', { params })
      if (dashboardRequestId.current !== requestId) return
      setSummary(data)
    } catch (err) {
      if (dashboardRequestId.current !== requestId) return
      setError(err.response?.data?.message || 'No se pudo cargar el dashboard.')
    } finally {
      if (dashboardRequestId.current === requestId) setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadDashboard(projectId)
  }, [loadDashboard, projectId])

  function changeProject(nextProjectId) {
    setProjectId(nextProjectId)
  }

  if (error) return <main className="content"><p className="error">{error}</p></main>

  const selectedProject = projects.find((project) => Number(project.id) === Number(projectId))
  const loadedProjectId = summary?.selected_project_id ? String(summary.selected_project_id) : ''

  return (
    <main className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Panel ejecutivo</p>
          <h1>Dashboard</h1>
        </div>
      </header>
      <section className="dashboard-filters">
        <label>Proyecto
          <select value={projectId} onChange={(event) => changeProject(event.target.value)}>
            <option value="">Todos los proyectos</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.nombre}</option>)}
          </select>
        </label>
        <div>
          <span>Vista actual</span>
          <strong>{selectedProject?.nombre || 'Portafolio completo'}{loading && summary ? ' - actualizando' : ''}</strong>
          {summary && loadedProjectId !== projectId && <small>Datos cargados: {loadedProjectId || 'portafolio'}</small>}
        </div>
      </section>
      {loading && !summary && <p>Cargando...</p>}
      {summary && <section className="question-board">
        {summary.questions?.map((question) => (
          <article className={`question-card ${question.tone}`} key={question.key}>
            <div className="question-header">
              <span>{question.title}</span>
              <strong>{question.answer}</strong>
            </div>
            <div className="question-metrics">
              {question.metrics.map((metric) => (
                <div key={metric.label}>
                  <span>{metric.label}</span>
                  <strong>{metric.value}</strong>
                </div>
              ))}
            </div>
            <div className="question-items">
              {question.items.map((item, index) => (
                <div key={`${question.key}-${index}`}>
                  <span className={`status-badge ${statusClass(item.status)}`}>{item.status}</span>
                  <p><strong>{item.title}</strong><small>{item.detail}</small></p>
                </div>
              ))}
              {!question.items.length && <p className="empty-inline">Sin elementos criticos.</p>}
            </div>
          </article>
        ))}
      </section>}
      {summary && <section className="metrics">
        {Object.entries(summary.metrics).map(([key, value]) => (
          <article className="metric" key={key}>
            <span>{key.replaceAll('_', ' ')}</span>
            <strong>{value}</strong>
          </article>
        ))}
      </section>}
      {summary && <section className="chart-grid">
        <Chart title="Proyectos por estado" data={toChartData(summary.charts.proyectos_por_estado)} />
        <Chart title="HU / SD por estado" data={toChartData(summary.charts.tareas_por_estado)} />
        <PiePanel title="Riesgos por nivel" data={toChartData(summary.charts.riesgos_por_nivel)} />
        <PiePanel title="Recursos por rol" data={toChartData(summary.charts.recursos_por_rol)} />
      </section>}
      {summary && <section className="recommendations">
        <h2>Recomendaciones automaticas</h2>
        <div className="rec-list">
          {summary.recommendations.map((item, index) => (
            <article className={`rec ${item.severity.toLowerCase()}`} key={`${item.type}-${index}`}>
              <span>{item.type} · {item.severity}</span>
              <strong>{item.source}</strong>
              <p>{item.message}</p>
            </article>
          ))}
          {!summary.recommendations.length && <p>No hay alertas activas.</p>}
        </div>
      </section>}
    </main>
  )
}

function Chart({ title, data }) {
  return (
    <section className="chart-panel">
      <h2>{title}</h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="value" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}

function PiePanel({ title, data }) {
  return (
    <section className="chart-panel">
      <h2>{title}</h2>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" outerRadius={92} label>
            {data.map((entry, index) => <Cell key={entry.name} fill={colors[index % colors.length]} />)}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </section>
  )
}

const huFlowColumns = [
  { key: 'BACKLOG', label: 'Backlog' },
  { key: 'EN_ANALISIS', label: 'Analisis' },
  { key: 'EN_UX', label: 'UX' },
  { key: 'EN_DESARROLLO', label: 'Desarrollo' },
  { key: 'CODE_REVIEW', label: 'Code review' },
  { key: 'EN_QA', label: 'QA' },
  { key: 'EN_UAT', label: 'UAT' },
  { key: 'BLOQUEADO', label: 'Bloqueado' },
  { key: 'DONE', label: 'Terminado' },
]

const activityOrder = ['ANALISIS', 'UX', 'DESARROLLO', 'CODE_REVIEW', 'QA', 'UAT', 'DOCUMENTACION', 'FIRMA_USUARIO']

function splitPeople(value) {
  return String(value || '').split(/\n|,/).map((item) => item.trim()).filter(Boolean)
}

function activityTone(activity) {
  if (activity.estado === 'BLOQUEADO') return 'danger'
  if (activity.estado_firma_usuario === 'OBSERVADO') return 'danger'
  if (activity.estado === 'COMPLETADO' || activity.estado_firma_usuario === 'FIRMADO') return 'success'
  if (activity.estado === 'EN_PROCESO' || Number(activity.avance || 0) > 0 || ['PENDIENTE', 'ENVIADO'].includes(activity.estado_firma_usuario)) return 'progress'
  return 'muted'
}

function HuFlowBoard() {
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [activities, setActivities] = useState([])
  const [filters, setFilters] = useState({ proyecto_id: '', responsable: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    Promise.all([
      api.get('/projects'),
      api.get('/tasks'),
      api.get('/task-stages'),
    ]).then(([projectsResponse, tasksResponse, activitiesResponse]) => {
      if (!active) return
      setProjects(projectsResponse.data)
      setTasks(tasksResponse.data)
      setActivities(activitiesResponse.data)
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'No se pudo cargar el canvas de HU.')
    }).finally(() => {
      if (active) setLoading(false)
    })

    return () => {
      active = false
    }
  }, [])

  const activitiesByTask = useMemo(() => activities.reduce((acc, activity) => {
    const taskId = Number(activity.task_id)
    if (!acc[taskId]) acc[taskId] = []
    acc[taskId].push(activity)
    return acc
  }, {}), [activities])

  const ownerOptions = useMemo(() => {
    const people = new Set()
    tasks.forEach((task) => {
      splitPeople(task.responsable).forEach((person) => people.add(person))
      splitPeople(task.analistas_funcionales).forEach((person) => people.add(person))
      splitPeople(task.lideres_tecnicos).forEach((person) => people.add(person))
      splitPeople(task.desarrolladores).forEach((person) => people.add(person))
    })
    activities.forEach((activity) => splitPeople(activity.responsables).forEach((person) => people.add(person)))
    return [...people].sort((a, b) => a.localeCompare(b))
  }, [activities, tasks])

  const filteredTasks = useMemo(() => tasks.filter((task) => {
    if (filters.proyecto_id && Number(task.proyecto_id) !== Number(filters.proyecto_id)) return false
    if (!filters.responsable) return true
    const haystack = [
      task.responsable,
      task.analistas_funcionales,
      task.lideres_tecnicos,
      task.desarrolladores,
      ...(activitiesByTask[task.id] || []).map((activity) => activity.responsables),
    ].join('\n')
    return splitPeople(haystack).some((person) => person === filters.responsable)
  }), [activitiesByTask, filters.proyecto_id, filters.responsable, tasks])

  const tasksByStatus = useMemo(() => huFlowColumns.reduce((acc, column) => {
    acc[column.key] = filteredTasks
      .filter((task) => task.estado === column.key)
      .sort((a, b) => String(a.fecha_fin || '').localeCompare(String(b.fecha_fin || '')) || String(a.titulo).localeCompare(String(b.titulo)))
    return acc
  }, {}), [filteredTasks])

  const selectedProject = projects.find((project) => Number(project.id) === Number(filters.proyecto_id))
  const activeTasks = filteredTasks.filter((task) => task.estado !== 'DONE').length
  const blockedTasks = filteredTasks.filter((task) => task.estado === 'BLOQUEADO').length
  const pendingSignatures = activities.filter((activity) => (
    (!filters.proyecto_id || Number(activity.proyecto_id) === Number(filters.proyecto_id)) &&
    ['PENDIENTE', 'ENVIADO', 'OBSERVADO'].includes(activity.estado_firma_usuario)
  )).length

  if (loading) return <main className="content"><p>Cargando...</p></main>
  if (error) return <main className="content"><p className="error">{error}</p></main>

  return (
    <main className="content flow-content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Flujo operativo</p>
          <h1>Canvas HU</h1>
        </div>
      </header>

      <section className="flow-controls">
        <label>Proyecto
          <select value={filters.proyecto_id} onChange={(event) => setFilters({ ...filters, proyecto_id: event.target.value })}>
            <option value="">Todos</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.nombre}</option>)}
          </select>
        </label>
        <label>Responsable
          <select value={filters.responsable} onChange={(event) => setFilters({ ...filters, responsable: event.target.value })}>
            <option value="">Todos</option>
            {ownerOptions.map((person) => <option key={person} value={person}>{person}</option>)}
          </select>
        </label>
        <div className="flow-summary">
          <article><span>Proyecto</span><strong>{selectedProject?.nombre || 'Todos'}</strong></article>
          <article><span>HU activas</span><strong>{activeTasks}</strong></article>
          <article><span>Bloqueadas</span><strong>{blockedTasks}</strong></article>
          <article><span>Firmas pendientes</span><strong>{pendingSignatures}</strong></article>
        </div>
      </section>

      <section className="hu-canvas" aria-label="Canvas de flujo de HU">
        {huFlowColumns.map((column) => (
          <section className="flow-column" key={column.key}>
            <header>
              <span>{column.label}</span>
              <strong>{tasksByStatus[column.key]?.length || 0}</strong>
            </header>
            <div className="flow-card-list">
              {(tasksByStatus[column.key] || []).map((task) => (
                <HuFlowCard key={task.id} task={task} activities={activitiesByTask[task.id] || []} projects={projects} />
              ))}
              {!tasksByStatus[column.key]?.length && <p className="flow-empty">Sin HU</p>}
            </div>
          </section>
        ))}
      </section>
    </main>
  )
}

function HuFlowCard({ task, activities, projects }) {
  const project = projects.find((item) => Number(item.id) === Number(task.proyecto_id))
  const orderedActivities = [...activities].sort((a, b) => activityOrder.indexOf(a.etapa) - activityOrder.indexOf(b.etapa))
  const owners = [
    ...splitPeople(task.analistas_funcionales),
    ...splitPeople(task.lideres_tecnicos),
    ...splitPeople(task.desarrolladores),
    ...splitPeople(task.responsable),
  ]
  const uniqueOwners = [...new Set(owners)].slice(0, 4)
  const pendingSignature = orderedActivities.find((activity) => ['PENDIENTE', 'ENVIADO', 'OBSERVADO'].includes(activity.estado_firma_usuario))

  return (
    <article className={`flow-card ${statusClass(task.estado)}`}>
      <div className="flow-card-topline">
        <span>#{task.id}</span>
        <span className={`status-badge ${statusClass(task.prioridad)}`}>{task.prioridad}</span>
      </div>
      <h2>{task.titulo}</h2>
      <p>{project?.nombre || 'Sin proyecto'}</p>
      <ProgressValue value={task.avance} />
      <div className="flow-meta">
        <span>{task.fecha_inicio || 'Sin inicio'}</span>
        <span>{task.fecha_fin || 'Sin fin'}</span>
      </div>
      {uniqueOwners.length > 0 && <PeopleList value={uniqueOwners.join('\n')} />}
      <div className="activity-strip">
        {orderedActivities.map((activity) => (
          <span className={activityTone(activity)} key={activity.id} title={`${activity.nombre} - ${activity.estado}`}>
            {activity.etapa}
          </span>
        ))}
        {!orderedActivities.length && <span className="muted">Sin actividades</span>}
      </div>
      {pendingSignature && (
        <div className={`signature-note ${activityTone(pendingSignature)}`}>
          <strong>Firma usuario</strong>
          <span>{pendingSignature.estado_firma_usuario}</span>
        </div>
      )}
    </article>
  )
}

function CrudPage({ module }) {
  const initialForm = useMemo(() => Object.fromEntries(module.fields.map(([name, type, , options]) => {
    if (type === 'checkbox') return [name, false]
    if (['project', 'resource', 'resourceMulti', 'scheduleParent', 'scheduleItem', 'task'].includes(type)) return [name, '']
    return [name, options?.[0] || '']
  })), [module])
  const taskModule = modules.tasks
  const initialTaskForm = useMemo(() => Object.fromEntries(taskModule.fields.map(([name, type, , options]) => {
    if (type === 'checkbox') return [name, false]
    if (['project', 'resource', 'resourceMulti', 'scheduleParent', 'scheduleItem', 'task'].includes(type)) return [name, '']
    return [name, options?.[0] || '']
  })), [taskModule])
  const [catalogs, setCatalogs] = useState({ projects: [], resources: [], scheduleItems: [], tasks: [] })
  const [rows, setRows] = useState([])
  const [form, setForm] = useState(initialForm)
  const [taskForm, setTaskForm] = useState(initialTaskForm)
  const [editing, setEditing] = useState(null)
  const [viewing, setViewing] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [filters, setFilters] = useState({})
  const [collapsedScheduleIds, setCollapsedScheduleIds] = useState(getStoredScheduleCollapsedIds)
  const [scheduleViewMode, setScheduleViewMode] = useState(getStoredScheduleViewMode)
  const [error, setError] = useState('')
  const importFileInputRef = useRef(null)
  const taskFileInputRef = useRef(null)
  const isScheduleModule = module.endpoint === '/schedule-items'
  const isTasksModule = module.endpoint === '/tasks'
  const isTaskStagesModule = module.endpoint === '/task-stages'
  const needsProjects = hasFieldType(module, 'project')
  const needsResources = hasFieldType(module, 'resource') || hasFieldType(module, 'resourceMulti')
  const needsScheduleItems = isScheduleModule || hasFieldType(module, 'scheduleParent') || hasFieldType(module, 'scheduleItem') || module.filters.includes('padre_id')
  const needsTasks = hasFieldType(module, 'task') || module.filters.includes('task_id')

  const load = useCallback(async () => {
    const { data } = await api.get(module.endpoint, { params: filters })
    setRows(data)
  }, [filters, module.endpoint])

  function updateFilter(field, value) {
    setFilters((current) => {
      const next = { ...current }
      if (value) next[field] = value
      else delete next[field]
      return next
    })
  }

  function clearFilters() {
    setFilters({})
  }

  const loadCatalogs = useCallback(async () => {
    const requests = []
    if (needsProjects) requests.push(api.get('/projects'))
    if (needsResources) requests.push(api.get('/resources', { params: { estado: 'ACTIVO' } }))
    if (needsScheduleItems) requests.push(api.get('/schedule-items'))
    if (needsTasks) requests.push(api.get('/tasks'))

    const responses = await Promise.all(requests)
    let index = 0
    const projects = needsProjects ? responses[index++].data : []
    const resources = needsResources ? responses[index++].data : []
    const scheduleItems = needsScheduleItems ? buildScheduleOptions(responses[index]?.data || []) : []
    if (needsScheduleItems) index += 1
    const tasks = needsTasks ? responses[index].data : []
    setCatalogs({ projects, resources, scheduleItems, tasks })
  }, [needsProjects, needsResources, needsScheduleItems, needsTasks])

  useEffect(() => {
    let active = true
    const requests = []
    if (needsProjects) requests.push(api.get('/projects'))
    if (needsResources) requests.push(api.get('/resources', { params: { estado: 'ACTIVO' } }))
    if (needsScheduleItems) requests.push(api.get('/schedule-items'))
    if (needsTasks) requests.push(api.get('/tasks'))

    Promise.all(requests).then((responses) => {
      if (!active) return
      let index = 0
      const projects = needsProjects ? responses[index++].data : []
      const resources = needsResources ? responses[index++].data : []
      const scheduleItems = needsScheduleItems ? buildScheduleOptions(responses[index]?.data || []) : []
      if (needsScheduleItems) index += 1
      const tasks = needsTasks ? responses[index].data : []
      setCatalogs({ projects, resources, scheduleItems, tasks })
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'No se pudieron cargar catalogos.')
    })

    return () => {
      active = false
    }
  }, [needsProjects, needsResources, needsScheduleItems, needsTasks])

  useEffect(() => {
    let active = true
    api.get(module.endpoint, { params: filters }).then(({ data }) => {
      if (active) setRows(data)
    }).catch((err) => {
      if (active) setError(err.response?.data?.message || 'No se pudieron cargar datos.')
    })
    return () => {
      active = false
    }
  }, [filters, module.endpoint])

  async function submit(event) {
    event.preventDefault()
    setError('')
    const payload = normalizePayload(form)
    try {
      if (editing) await api.put(`${module.endpoint}/${editing}`, payload)
      else await api.post(module.endpoint, payload)
      setForm(initialForm)
      setEditing(null)
      setModalOpen(false)
      await loadCatalogs()
      await load()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar.')
    }
  }

  async function submitTask(event) {
    event.preventDefault()
    setError('')
    try {
      await api.post(taskModule.endpoint, normalizePayload(taskForm))
      setTaskForm(initialTaskForm)
      setTaskModalOpen(false)
      await loadCatalogs()
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo guardar la HU / SD.')
    }
  }

  async function remove(id) {
    await api.delete(`${module.endpoint}/${id}`)
    await loadCatalogs()
    await load()
  }

  function edit(row) {
    setError('')
    setEditing(row.id)
    setForm({ ...initialForm, ...row })
    setModalOpen(true)
  }

  function view(row) {
    setError('')
    setViewing(row)
  }

  function addScheduleChild(row) {
    setError('')
    setEditing(null)
    setForm({
      ...initialForm,
      proyecto_id: row.proyecto_id,
      padre_id: row.id,
      tipo: 'ACTIVIDAD',
      estado: 'PENDIENTE',
      orden: Number(row.childCount || 0) + 1,
    })
    setModalOpen(true)
  }

  function addTaskFromSchedule(row) {
    setError('')
    setTaskForm({
      ...initialTaskForm,
      proyecto_id: row.proyecto_id,
      cronograma_item_id: row.id,
      titulo: row.nombre,
      estado: 'BACKLOG',
      prioridad: 'MEDIA',
      fecha_inicio: row.fecha_inicio || '',
      fecha_fin: row.fecha_fin || '',
      responsable: row.responsable || '',
      desarrolladores: row.responsable || '',
    })
    setTaskModalOpen(true)
  }

  function openCreateModal() {
    setError('')
    setEditing(null)
    setForm(initialForm)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditing(null)
    setForm(initialForm)
    setError('')
  }

  function closeViewModal() {
    setViewing(null)
    setError('')
  }

  function closeTaskModal() {
    setTaskModalOpen(false)
    setTaskForm(initialTaskForm)
    setError('')
  }

  const expandableScheduleIds = useMemo(() => (
    isScheduleModule ? getExpandableScheduleIds(rows) : []
  ), [isScheduleModule, rows])
  const visibleCollapsedScheduleIds = useMemo(() => {
    if (!isScheduleModule) return collapsedScheduleIds
    const validIds = new Set(rows.map((row) => row.id))
    return new Set([...collapsedScheduleIds].filter((id) => validIds.has(id)))
  }, [collapsedScheduleIds, isScheduleModule, rows])
  const displayRows = useMemo(() => (
    isScheduleModule
      ? scheduleViewMode === 'activities'
        ? buildScheduleActivityRows(rows)
        : buildScheduleTreeRows(rows, visibleCollapsedScheduleIds)
      : rows
  ), [isScheduleModule, rows, scheduleViewMode, visibleCollapsedScheduleIds])
  const allScheduleCollapsed = expandableScheduleIds.length > 0 && expandableScheduleIds.every((id) => visibleCollapsedScheduleIds.has(id))

  function toggleScheduleRow(id) {
    setCollapsedScheduleIds((current) => {
      const next = new Set(current)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      localStorage.setItem(scheduleCollapseStorageKey, JSON.stringify([...next]))
      return next
    })
  }

  function setScheduleSummaryView(collapsed) {
    const next = collapsed ? new Set(expandableScheduleIds) : new Set()
    localStorage.setItem(scheduleCollapseStorageKey, JSON.stringify([...next]))
    setCollapsedScheduleIds(next)
  }

  function setScheduleView(value) {
    localStorage.setItem(scheduleViewStorageKey, value)
    setScheduleViewMode(value)
  }

  function exportScheduleXml() {
    if (!rows.length) {
      setError('No hay elementos de cronograma para exportar.')
      return
    }

    const selectedProject = catalogs.projects.find((project) => Number(project.id) === Number(filters.proyecto_id))
    const projectName = selectedProject?.nombre || 'Cronograma PMO'
    const safeName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'cronograma'
    downloadTextFile(`${safeName}-project.xml`, buildProjectXml(rows, projectName))
  }

  async function importScheduleXml(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!filters.proyecto_id) {
      setError('Selecciona un proyecto antes de importar el XML.')
      return
    }

    setError('')
    try {
      const content = await file.text()
      const importedTasks = parseProjectXmlTasks(content)
      const parentByLevel = new Map()
      const orderByParent = new Map()

      for (const importedTask of importedTasks) {
        const parentId = importedTask.outlineLevel > 1 ? parentByLevel.get(importedTask.outlineLevel - 1) || null : null
        const parentKey = parentId || 'root'
        const nextOrder = (orderByParent.get(parentKey) || 0) + 1
        orderByParent.set(parentKey, nextOrder)

        const { data: created } = await api.post('/schedule-items', normalizePayload({
          proyecto_id: filters.proyecto_id,
          padre_id: parentId,
          nombre: importedTask.name,
          descripcion: importedTask.notes,
          tipo: importedTask.tipo,
          orden: nextOrder,
          fecha_inicio: importedTask.start,
          fecha_fin: importedTask.finish,
          avance_planificado: importedTask.percentComplete,
          avance_real: importedTask.percentComplete,
          responsable: '',
          estado: importedTask.percentComplete >= 100 ? 'COMPLETADO' : 'PENDIENTE',
        }))

        parentByLevel.set(importedTask.outlineLevel, created.id)
        Array.from(parentByLevel.keys())
          .filter((level) => level > importedTask.outlineLevel)
          .forEach((level) => parentByLevel.delete(level))
      }

      await loadCatalogs()
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo importar el XML.')
    }
  }

  function exportTasksCsv() {
    if (!rows.length) {
      setError('No hay HU para exportar.')
      return
    }

    const columns = ['id', ...taskModule.fields.map(([name]) => name)]
    const selectedProject = catalogs.projects.find((project) => Number(project.id) === Number(filters.proyecto_id))
    const projectName = selectedProject?.nombre || 'hu'
    const safeName = projectName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'hu'
    downloadTextFile(`${safeName}-hu.csv`, buildCsv(rows, columns), 'text/csv;charset=utf-8')
  }

  async function importTasksCsv(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setError('')
    try {
      const importedRows = parseCsv(await file.text())
      if (!importedRows.length) throw new Error('El archivo no contiene HU para importar.')

      for (const importedRow of importedRows) {
        const payload = normalizePayload({
          ...initialTaskForm,
          ...importedRow,
          proyecto_id: importedRow.proyecto_id || filters.proyecto_id,
        })

        if (!payload.proyecto_id) throw new Error('Cada HU debe tener proyecto_id o debes filtrar un proyecto antes de importar.')
        if (!payload.titulo) throw new Error('Cada HU debe tener titulo.')

        const existingById = payload.id ? rows.find((row) => Number(row.id) === Number(payload.id)) : null
        const existingByTitle = rows.find((row) => (
          Number(row.proyecto_id) === Number(payload.proyecto_id) &&
          String(row.titulo || '').trim().toLowerCase() === String(payload.titulo || '').trim().toLowerCase()
        ))
        const existing = existingById || existingByTitle
        const body = Object.fromEntries(Object.entries(payload).filter(([key]) => key !== 'id'))

        if (existing) await api.put(`/tasks/${existing.id}`, body)
        else await api.post('/tasks', body)
      }

      await loadCatalogs()
      await load()
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'No se pudo importar el archivo de HU.')
    }
  }

  return (
    <main className="content">
      <header className="page-header">
        <div>
          <p className="eyebrow">Gestion</p>
          <h1>{module.title}</h1>
        </div>
        <button className="ghost" onClick={openCreateModal}><Icon name="add" />Nuevo</button>
      </header>

      {module.help && (
        <section className="help-panel">
          <strong>{module.help.summary}</strong>
          <ul>
            {module.help.tips.map((tip) => <li key={tip}>{tip}</li>)}
          </ul>
        </section>
      )}

      {module.filters.length > 0 && (
        <section className="filters-panel">
          <div className="filters-header">
            <div>
              <strong>Filtros</strong>
              <span>{Object.values(filters).filter(Boolean).length} activos</span>
            </div>
            <button className="ghost" type="button" onClick={clearFilters}>Limpiar</button>
          </div>
          <div className="filters-grid">
            {module.filters.map((field) => (
              <FilterField key={field} module={module} field={field} value={filters[field] || ''} catalogs={catalogs} filters={filters} onChange={(value) => updateFilter(field, value)} />
            ))}
            <button className="secondary" type="button" onClick={load}><Icon name="filter" />Aplicar</button>
          </div>
        </section>
      )}

      {error && !modalOpen && !taskModalOpen && <p className="error page-error">{error}</p>}

      <section className="work-grid">
        <section className="table-wrap">
          {(isScheduleModule || isTasksModule) && (
            <div className="table-toolbar">
              <div>
                <strong>{isScheduleModule ? (scheduleViewMode === 'activities' ? 'Actividades y subactividades' : 'Vista del cronograma') : 'Carga de HU'}</strong>
                <span>{displayRows.length} de {rows.length} elementos visibles</span>
              </div>
              <div className="toolbar-actions">
                {isScheduleModule && (
                  <>
                    <div className="view-switch" role="group" aria-label="Vista del cronograma">
                      <button className={scheduleViewMode === 'tree' ? 'active' : ''} type="button" onClick={() => setScheduleView('tree')}>Estructura</button>
                      <button className={scheduleViewMode === 'activities' ? 'active' : ''} type="button" onClick={() => setScheduleView('activities')}>Actividades</button>
                    </div>
                    <button className="secondary" type="button" onClick={exportScheduleXml}><Icon name="download" />Exportar XML</button>
                    <button className="secondary" type="button" onClick={() => importFileInputRef.current?.click()}><Icon name="add" />Importar XML</button>
                    <input ref={importFileInputRef} type="file" accept=".xml,application/xml,text/xml" className="sr-only" onChange={importScheduleXml} />
                    {scheduleViewMode === 'tree' && (
                      <>
                        <button className="secondary" type="button" onClick={() => setScheduleSummaryView(!allScheduleCollapsed)}>
                          <Icon name={allScheduleCollapsed ? 'chevronDown' : 'chevronRight'} />
                          {allScheduleCollapsed ? 'Expandir todo' : 'Ver resumen'}
                        </button>
                        <button className="ghost" type="button" onClick={() => setScheduleSummaryView(false)}><Icon name="chevronDown" />Abrir niveles</button>
                      </>
                    )}
                  </>
                )}
                {isTasksModule && (
                  <>
                    <button className="secondary" type="button" onClick={exportTasksCsv}><Icon name="download" />Exportar HU</button>
                    <button className="secondary" type="button" onClick={() => taskFileInputRef.current?.click()}><Icon name="add" />Importar HU</button>
                    <input ref={taskFileInputRef} type="file" accept=".csv,text/csv" className="sr-only" onChange={importTasksCsv} />
                  </>
                )}
              </div>
            </div>
          )}
          <table>
            <thead>
              <tr>
                {module.columns.map((column) => <th key={column}>{columnLabel(column)}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr className={isScheduleModule ? `schedule-row level-${Math.min(row.level || 0, 4)} ${row.hasChildren ? 'summary-row' : ''}` : ''} key={row.id}>
                  {module.columns.map((column) => (
                    <td key={column}>
                      {isScheduleModule && column === 'tree' ? (
                        scheduleViewMode === 'activities'
                          ? <ScheduleActivityCell row={row} />
                          : <ScheduleTreeCell row={row} collapsed={visibleCollapsedScheduleIds.has(row.id)} onToggle={toggleScheduleRow} />
                      ) : (
                        <Value value={column === 'tree' ? row : row[column]} column={column} row={row} catalogs={catalogs} />
                      )}
                    </td>
                  ))}
                  <td className="actions">
                    {isScheduleModule && (
                      <>
                        <button className="secondary icon-button" type="button" onClick={() => addScheduleChild(row)} title="Agregar actividad" aria-label={`Agregar actividad a ${row.nombre || row.titulo}`}>
                          <Icon name="addChild" />
                        </button>
                        {!row.hasChildren && (
                          <button className="primary icon-button" type="button" onClick={() => addTaskFromSchedule(row)} title="Agregar HU / SD" aria-label={`Agregar HU / SD a ${row.nombre}`}>
                            <Icon name="task" />
                          </button>
                        )}
                      </>
                    )}
                    {(isTasksModule || isTaskStagesModule) && (
                      <button className="ghost icon-button" type="button" onClick={() => view(row)} title={isTasksModule ? 'Ver HU / SD' : 'Ver actividad'} aria-label={`Ver ${row.nombre || row.titulo || 'registro'}`}>
                        <Icon name="eye" />
                      </button>
                    )}
                    <button className="ghost icon-button" type="button" onClick={() => edit(row)} title="Editar" aria-label={`Editar ${row.nombre || row.titulo || 'registro'}`}>
                      <Icon name="edit" />
                    </button>
                    <button className="danger icon-button" type="button" onClick={() => remove(row.id)} title="Eliminar" aria-label={`Eliminar ${row.nombre || row.titulo || 'registro'}`}>
                      <Icon name="trash" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="empty">Sin registros.</p>}
        </section>
      </section>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeModal()
        }}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="crud-modal-title">
            <header className="modal-header">
              <div>
                <p className="eyebrow">{module.title}</p>
                <h2 id="crud-modal-title">{editing ? 'Editar registro' : 'Nuevo registro'}</h2>
              </div>
              <button className="ghost icon-button" type="button" onClick={closeModal} title="Cerrar" aria-label="Cerrar modal">
                <Icon name="x" />
              </button>
            </header>
            <form className="form modal-form" onSubmit={submit}>
              <div className="modal-form-grid">
                {module.fields.map(([name, type, label, options]) => (
                  <Field key={name} type={type} label={label} options={options} value={form[name]} form={form} catalogs={catalogs} onChange={(value) => setForm({ ...form, [name]: value })} />
                ))}
              </div>
              {needsProjects && catalogs.projects.length === 0 && <p className="hint">Crea un proyecto antes de registrar elementos vinculados.</p>}
              {error && <p className="error">{error}</p>}
              <footer className="modal-actions">
                <button className="ghost" type="button" onClick={closeModal}>Cancelar</button>
                <button className="primary" type="submit"><Icon name={editing ? 'save' : 'add'} />{editing ? 'Actualizar' : 'Crear'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {viewing && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeViewModal()
        }}>
          <section className="modal-panel detail-modal-panel" role="dialog" aria-modal="true" aria-labelledby="view-modal-title">
            <header className="modal-header">
              <div>
                <p className="eyebrow">{module.title}</p>
                <h2 id="view-modal-title">{isTasksModule ? 'Ver HU / SD' : 'Ver actividad'}</h2>
              </div>
              <button className="ghost icon-button" type="button" onClick={closeViewModal} title="Cerrar" aria-label="Cerrar vista">
                <Icon name="x" />
              </button>
            </header>
            <div className="modal-form view-modal">
              <DetailView row={viewing} module={module} catalogs={catalogs} isTasksModule={isTasksModule} />
              <footer className="modal-actions">
                <button className="primary" type="button" onClick={closeViewModal}><Icon name="check" />Cerrar</button>
              </footer>
            </div>
          </section>
        </div>
      )}

      {taskModalOpen && (
        <div className="modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget) closeTaskModal()
        }}>
          <section className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="task-modal-title">
            <header className="modal-header">
              <div>
                <p className="eyebrow">HU / SD</p>
                <h2 id="task-modal-title">Nueva HU / SD del cronograma</h2>
              </div>
              <button className="ghost icon-button" type="button" onClick={closeTaskModal} title="Cerrar" aria-label="Cerrar modal">
                <Icon name="x" />
              </button>
            </header>
            <form className="form modal-form" onSubmit={submitTask}>
              <div className="modal-form-grid">
                {taskModule.fields.map(([name, type, label, options]) => (
                  <Field key={name} type={type} label={label} options={options} value={taskForm[name]} form={taskForm} catalogs={catalogs} onChange={(value) => setTaskForm({ ...taskForm, [name]: value })} />
                ))}
              </div>
              {error && <p className="error">{error}</p>}
              <footer className="modal-actions">
                <button className="ghost" type="button" onClick={closeTaskModal}>Cancelar</button>
                <button className="primary" type="submit"><Icon name="task" />Crear HU / SD</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  )
}

function FilterField({ module, field, value, catalogs, filters, onChange }) {
  if (field === 'proyecto_id') {
    return (
      <label>Proyecto
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Todos</option>
          {catalogs.projects.map((project) => <option key={project.id} value={project.id}>{project.nombre}</option>)}
        </select>
      </label>
    )
  }

  if (field === 'padre_id') {
    const items = catalogs.scheduleItems.filter((item) => !filters.proyecto_id || Number(item.proyecto_id) === Number(filters.proyecto_id))
    return (
      <ScheduleItemFilter id="schedule-parent-filter-options" label="Elemento padre" items={items} value={value} onChange={onChange} />
    )
  }

  if (field === 'cronograma_item_id') {
    const items = catalogs.scheduleItems.filter((item) => !filters.proyecto_id || Number(item.proyecto_id) === Number(filters.proyecto_id))
    return (
      <ScheduleItemFilter id="schedule-item-filter-options" label="Elemento cronograma" items={items} value={value} onChange={onChange} />
    )
  }

  if (field === 'task_id') {
    const tasks = catalogs.tasks.filter((task) => !filters.proyecto_id || Number(task.proyecto_id) === Number(filters.proyecto_id))
    return <TaskFilter id="task-filter-options" label="HU / SD" tasks={tasks} value={value} onChange={onChange} />
  }

  const fieldConfig = module.fields.find(([name]) => name === field)
  if (fieldConfig?.[1] === 'resourceMulti') {
    const [, , label, roles] = fieldConfig
    const resources = catalogs.resources.filter((resource) => !roles?.length || roles.includes(resource.rol))
    return <ResourceAutocomplete id={`${field}-filter-options`} label={label} resources={resources} value={value} onChange={onChange} />
  }

  if (fieldConfig?.[1] === 'resource') {
    return <ResourceAutocomplete id={`${field}-filter-options`} label={fieldConfig[2]} resources={catalogs.resources} value={value} onChange={onChange} />
  }

  if (fieldConfig?.[1] === 'select') {
    const [, , label, options] = fieldConfig
    return (
      <label>{label}
        <select value={value} onChange={(event) => onChange(event.target.value)}>
          <option value="">Todos</option>
          {options.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
      </label>
    )
  }

  return <label>{field.replaceAll('_', ' ')}<input value={value} onChange={(event) => onChange(event.target.value)} /></label>
}

function ScheduleItemFilter({ id, label, items, value, onChange }) {
  const optionLabel = (item) => `${item.label.trim()} (#${item.id})`
  const selected = items.find((item) => Number(item.id) === Number(value))
  const [draft, setDraft] = useState({ value: '', text: '' })
  const query = draft.value === String(value || '') ? draft.text : selected ? optionLabel(selected) : ''

  function update(nextQuery) {
    const match = items.find((item) => optionLabel(item) === nextQuery)
    const nextValue = match ? String(match.id) : ''
    setDraft({ value: nextValue, text: nextQuery })
    onChange(nextValue)
  }

  return (
    <label>{label}
      <input
        list={id}
        placeholder="Buscar..."
        value={query}
        onChange={(event) => update(event.target.value)}
      />
      <datalist id={id}>
        {items.map((item) => <option key={item.id} value={optionLabel(item)} />)}
      </datalist>
    </label>
  )
}

function ResourceAutocomplete({ id, label, resources, value, onChange }) {
  const [draft, setDraft] = useState({ value: '', text: '' })
  const query = draft.value === String(value || '') ? draft.text : value || ''

  function update(nextQuery) {
    const match = resources.find((resource) => resource.nombre === nextQuery)
    const nextValue = match ? match.nombre : nextQuery
    setDraft({ value: nextValue, text: nextQuery })
    onChange(nextValue)
  }

  return (
    <label>{label}
      <input
        list={id}
        placeholder="Buscar responsable..."
        value={query}
        onChange={(event) => update(event.target.value)}
      />
      <datalist id={id}>
        {resources.map((resource) => <option key={resource.id} value={resource.nombre}>{resource.rol}</option>)}
      </datalist>
    </label>
  )
}

function TaskFilter({ id, label, tasks, value, onChange }) {
  const optionLabel = (task) => `${task.titulo} (#${task.id})`
  const selected = tasks.find((task) => Number(task.id) === Number(value))
  const [draft, setDraft] = useState({ value: '', text: '' })
  const query = draft.value === String(value || '') ? draft.text : selected ? optionLabel(selected) : ''

  function update(nextQuery) {
    const match = tasks.find((task) => optionLabel(task) === nextQuery)
    const nextValue = match ? String(match.id) : ''
    setDraft({ value: nextValue, text: nextQuery })
    onChange(nextValue)
  }

  return (
    <label>{label}
      <input
        list={id}
        placeholder="Buscar HU..."
        value={query}
        onChange={(event) => update(event.target.value)}
      />
      <datalist id={id}>
        {tasks.map((task) => <option key={task.id} value={optionLabel(task)} />)}
      </datalist>
    </label>
  )
}

function Field({ type, label, options, value, form, catalogs, onChange }) {
  if (type === 'textarea') return <label>{label}<textarea value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>
  if (type === 'select') return <label>{label}<select value={value || options[0]} onChange={(e) => onChange(e.target.value)}>{options.map((item) => <option key={item}>{item}</option>)}</select></label>
  if (type === 'project') {
    return (
      <label>{label}
        <select value={value || ''} onChange={(event) => onChange(event.target.value)} required>
          <option value="">Selecciona un proyecto</option>
          {catalogs.projects.map((project) => <option key={project.id} value={project.id}>{project.nombre}</option>)}
        </select>
      </label>
    )
  }
  if (type === 'scheduleParent') {
    const items = catalogs.scheduleItems.filter((item) => Number(item.proyecto_id) === Number(form.proyecto_id) && Number(item.id) !== Number(form.id))
    return (
      <label>{label}
        <select value={value || ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">Sin padre - primer nivel</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    )
  }
  if (type === 'scheduleItem') {
    const items = catalogs.scheduleItems.filter((item) => Number(item.proyecto_id) === Number(form.proyecto_id))
    return (
      <label>{label}
        <select value={value || ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">Sin vincular</option>
          {items.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
        </select>
      </label>
    )
  }
  if (type === 'task') {
    const tasks = catalogs.tasks.filter((task) => Number(task.proyecto_id) === Number(form.proyecto_id))
    return (
      <label>{label}
        <select value={value || ''} onChange={(event) => onChange(event.target.value)} required>
          <option value="">Selecciona una HU / SD</option>
          {tasks.map((task) => <option key={task.id} value={task.id}>{task.titulo}</option>)}
        </select>
      </label>
    )
  }
  if (type === 'resource') {
    return (
      <label>{label}
        <select value={value || ''} onChange={(event) => onChange(event.target.value)}>
          <option value="">Sin asignar</option>
          {catalogs.resources.map((resource) => <option key={resource.id} value={resource.nombre}>{resource.nombre} - {resource.rol}</option>)}
        </select>
      </label>
    )
  }
  if (type === 'resourceMulti') {
    const allowedRoles = options || []
    const selected = String(value || '').split('\n').map((item) => item.trim()).filter(Boolean)
    const resources = catalogs.resources.filter((resource) => !allowedRoles.length || allowedRoles.includes(resource.rol))

    return (
      <label>{label}
        <select
          multiple
          value={selected}
          onChange={(event) => onChange(Array.from(event.target.selectedOptions).map((option) => option.value).join('\n'))}
        >
          {resources.map((resource) => <option key={resource.id} value={resource.nombre}>{resource.nombre} - {resource.rol}</option>)}
        </select>
      </label>
    )
  }
  if (type === 'checkbox') return <label className="check"><input type="checkbox" checked={Boolean(value)} onChange={(e) => onChange(e.target.checked)} />{label}</label>
  return <label>{label}<input type={type} value={value || ''} onChange={(e) => onChange(e.target.value)} /></label>
}

function ScheduleTreeCell({ row, collapsed, onToggle }) {
  return (
    <div className="schedule-tree-cell" style={{ '--level': row.level || 0 }}>
      {row.hasChildren ? (
        <button
          aria-label={collapsed ? `Expandir ${row.nombre}` : `Colapsar ${row.nombre}`}
          className="tree-toggle"
          type="button"
          onClick={() => onToggle(row.id)}
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} />
        </button>
      ) : (
        <span className="tree-spacer" />
      )}
      <span className="tree-title">{row.nombre}</span>
      {row.hasChildren && <span className="child-count">{row.childCount}</span>}
    </div>
  )
}

function ScheduleActivityCell({ row }) {
  return (
    <div className="schedule-activity-cell">
      <span className="tree-title">{row.nombre}</span>
      {row.activityPath && row.activityPath !== row.nombre && <span className="activity-path">{row.activityPath}</span>}
    </div>
  )
}

function Value({ value, column, row, catalogs }) {
  if (column === 'tree') {
    const item = catalogs.scheduleItems.find((scheduleItem) => Number(scheduleItem.id) === Number(value?.id || value))
    return item ? <span className="tree-cell" style={{ paddingLeft: `${item.level * 18}px` }}>{item.nombre}</span> : String(value?.nombre || value || '')
  }
  if (column === 'proyecto_id') {
    const project = catalogs.projects.find((item) => Number(item.id) === Number(value))
    return project ? project.nombre : String(value ?? '')
  }
  if (column === 'task_id') {
    const task = catalogs.tasks.find((item) => Number(item.id) === Number(value))
    return task ? task.titulo : String(value ?? '')
  }
  if (['padre_id', 'cronograma_item_id'].includes(column)) {
    const item = catalogs.scheduleItems.find((scheduleItem) => Number(scheduleItem.id) === Number(value))
    return item ? item.label.trim() : String(value ?? '')
  }
  if (['analistas_funcionales', 'lideres_tecnicos', 'desarrolladores', 'responsables'].includes(column)) return <PeopleList value={value} />
  if (column === 'prototipo_url') return <PrototypeLink url={value} label={row.prototipo_herramienta} />
  if (['estado', 'estado_firma_usuario'].includes(column)) return <span className={`status-badge ${statusClass(value)}`}>{value}</span>
  if (column === 'dias_asignados') return <AssignedDays row={row} />
  if (column === 'status_plazo') return <DeadlineStatus row={row} />
  if (['avance_planificado', 'avance_real', 'avance'].includes(column)) return <ProgressValue value={value} />
  if (['semaforo', 'nivel'].includes(column)) return <span className={`pill ${String(value).toLowerCase()}`}>{value}</span>
  if (column === 'carga_porcentaje') return <span className={Number(value) > 100 ? 'text-danger' : ''}>{value}%</span>
  return String(value ?? '')
}

function ReadOnlyField({ label, name, value, row = {}, catalogs = {} }) {
  const empty = value === null || value === undefined || value === ''

  return (
    <div className={name === 'descripcion' || name === 'observaciones' || name === 'motivo_bloqueo' ? 'view-field wide' : 'view-field'}>
      <span>{label}</span>
      <div>
        {empty ? (
          <em>Sin dato</em>
        ) : name ? (
          <Value value={value} column={name} row={row} catalogs={catalogs} />
        ) : (
          String(value)
        )}
      </div>
    </div>
  )
}

function DetailView({ row, module, catalogs, isTasksModule }) {
  const title = isTasksModule ? row.titulo : row.nombre
  const subtitle = isTasksModule ? row.descripcion : row.observaciones
  const project = catalogs.projects.find((item) => Number(item.id) === Number(row.proyecto_id))
  const scheduleItem = catalogs.scheduleItems.find((item) => Number(item.id) === Number(row.cronograma_item_id))
  const task = catalogs.tasks.find((item) => Number(item.id) === Number(row.task_id))
  const dateRange = row.fecha_inicio || row.fecha_fin ? `${row.fecha_inicio || 'Sin inicio'} - ${row.fecha_fin || 'Sin fin'}` : 'Sin rango'
  const mainFields = isTasksModule
    ? ['proyecto_id', 'cronograma_item_id', 'tipo', 'prioridad', 'estado', 'avance', 'fecha_inicio', 'fecha_fin', 'prototipo_url', 'prototipo_herramienta']
    : ['proyecto_id', 'task_id', 'cronograma_item_id', 'etapa', 'estado', 'avance', 'fecha_inicio', 'fecha_fin', 'horas_estimadas', 'horas_ejecutadas', 'estado_firma_usuario', 'fecha_firma_usuario']
  const peopleFields = isTasksModule
    ? ['analistas_funcionales', 'lideres_tecnicos', 'desarrolladores', 'responsable']
    : ['responsables']
  const notesFields = isTasksModule
    ? ['descripcion', 'motivo_bloqueo', 'defectos']
    : ['observaciones']
  const fieldByName = new Map(module.fields.map(([name, , label]) => [name, label]))

  const renderFields = (fields) => fields
    .filter((name) => fieldByName.has(name))
    .map((name) => <ReadOnlyField key={name} label={fieldByName.get(name)} name={name} row={row} value={row[name]} catalogs={catalogs} />)

  return (
    <div className="detail-view">
      <section className="detail-hero">
        <div>
          <span className={`status-badge ${statusClass(row.estado)}`}>{row.estado}</span>
          <h3>{title || `Registro #${row.id}`}</h3>
          {subtitle && <p>{subtitle}</p>}
        </div>
        <div className="detail-progress">
          <ProgressValue value={row.avance} />
        </div>
      </section>

      <section className="detail-kpis">
        <article><span>Proyecto</span><strong>{project?.nombre || 'Sin proyecto'}</strong></article>
        <article><span>{isTasksModule ? 'Cronograma' : 'HU / SD'}</span><strong>{isTasksModule ? scheduleItem?.label?.trim() || 'Sin vincular' : task?.titulo || 'Sin HU / SD'}</strong></article>
        <article><span>Fechas</span><strong>{dateRange}</strong></article>
      </section>

      <section className="detail-section">
        <h3>Datos principales</h3>
        <div className="view-grid">{renderFields(mainFields)}</div>
      </section>

      <section className="detail-section">
        <h3>Responsables</h3>
        <div className="view-grid">{renderFields(peopleFields)}</div>
      </section>

      <section className="detail-section">
        <h3>Detalle</h3>
        <div className="view-grid">{renderFields(notesFields)}</div>
      </section>
    </div>
  )
}

function PrototypeLink({ url, label }) {
  if (!url) return ''
  return (
    <a className="prototype-link" href={url} target="_blank" rel="noreferrer">
      {label || 'Abrir'}
    </a>
  )
}

function AssignedDays({ row }) {
  if (!row?.fecha_inicio || !row?.fecha_fin) return <span className="days-badge muted">Sin rango</span>
  const startDate = new Date(`${row.fecha_inicio}T00:00:00`)
  const endDate = new Date(`${row.fecha_fin}T00:00:00`)
  const days = Math.floor((endDate - startDate) / 86400000) + 1
  if (days < 1) return <span className="days-badge danger">Rango inválido</span>
  return <span className="days-badge">{days} dia{days === 1 ? '' : 's'}</span>
}

function DeadlineStatus({ row }) {
  if (!row?.fecha_fin) return <span className="deadline-badge muted">Sin fecha</span>
  if (Number(row.avance || 0) >= 100 || ['DONE', 'COMPLETADO', 'FINALIZADO', 'CERRADO'].includes(row.estado)) return <span className="deadline-badge success">Cerrado</span>

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const endDate = new Date(`${row.fecha_fin}T00:00:00`)
  const diffDays = Math.ceil((endDate - today) / 86400000)

  if (diffDays < 0) return <span className="deadline-badge danger">Atrasado</span>
  if (diffDays === 0) return <span className="deadline-badge warning">Vence hoy</span>
  return <span className="deadline-badge progress">{diffDays} dias</span>
}

function PeopleList({ value }) {
  const people = String(value || '').split(/\n|,/).map((item) => item.trim()).filter(Boolean)
  if (!people.length) return ''

  return (
    <span className="people-list">
      {people.map((person) => <span key={person}>{person}</span>)}
    </span>
  )
}

function ProgressValue({ value }) {
  const percent = Math.max(0, Math.min(100, Number(value || 0)))
  const tone = percent >= 90 ? 'success' : percent >= 50 ? 'progress' : percent > 0 ? 'warning' : 'muted'

  return (
    <span className={`progress-value ${tone}`}>
      <span className="progress-track"><span style={{ width: `${percent}%` }} /></span>
      <strong>{percent}%</strong>
    </span>
  )
}

function normalizePayload(form) {
  return Object.fromEntries(Object.entries(form).map(([key, value]) => {
    if (value === '') return [key, null]
    if (['proyecto_id', 'padre_id', 'cronograma_item_id', 'task_id', 'impacto_fecha_dias', 'defectos', 'orden'].includes(key)) return [key, value === null ? null : Number(value)]
    if (key.startsWith('avance') || key.startsWith('presupuesto') || key.startsWith('impacto_') || key.startsWith('horas_')) return [key, value === null ? null : Number(value)]
    return [key, value]
  }))
}

function App() {
  const auth = useAuth()
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={auth.user ? <Navigate to="/" /> : <AuthPage onAuth={auth.login} />} />
        <Route path="/*" element={auth.user ? <Layout user={auth.user} logout={auth.logout} /> : <Navigate to="/auth" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
