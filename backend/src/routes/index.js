const express = require('express');
const { register, login, me } = require('../controllers/authController');
const crudController = require('../controllers/crudController');
const scheduleController = require('../controllers/scheduleController');
const { authenticate, authorize } = require('../middleware/auth');
const { Project, Task, TaskStage, Risk, ScopeChange, Resource, Agreement } = require('../models');
const { buildRecommendations, dashboardSummary } = require('../services/recommendations');

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.get('/auth/me', authenticate, me);

router.use(authenticate);

router.get('/dashboard', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await dashboardSummary(req.query.proyecto_id || req.query.project_id || req.query.projectId));
  } catch (error) {
    next(error);
  }
});

router.get('/recommendations', async (req, res, next) => {
  try {
    res.set('Cache-Control', 'no-store');
    res.json(await buildRecommendations(req.query.proyecto_id || req.query.project_id || req.query.projectId));
  } catch (error) {
    next(error);
  }
});

function mountCrud(path, controller, options = {}) {
  router.get(path, controller.list);
  router.post(path, options.writeGuard || ((req, res, next) => next()), controller.create);
  router.get(`${path}/:id`, controller.get);
  router.put(`${path}/:id`, options.writeGuard || ((req, res, next) => next()), controller.update);
  router.delete(`${path}/:id`, authorize('ADMIN', 'GESTOR'), controller.remove);
}

mountCrud('/projects', crudController(Project));
mountCrud('/schedule-items', scheduleController);
mountCrud('/tasks', crudController(Task, {
  filters: ['proyecto_id', 'cronograma_item_id', 'estado', 'responsable', 'analistas_funcionales', 'lideres_tecnicos', 'desarrolladores'],
  partialFilters: ['responsable', 'analistas_funcionales', 'lideres_tecnicos', 'desarrolladores'],
}));
mountCrud('/task-stages', crudController(TaskStage, {
  filters: ['proyecto_id', 'task_id', 'cronograma_item_id', 'nombre', 'etapa', 'estado', 'responsables', 'estado_firma_usuario'],
  partialFilters: ['nombre', 'responsables'],
}));
mountCrud('/risks', crudController(Risk, { filters: ['proyecto_id', 'estado', 'nivel'] }));
mountCrud('/scope-changes', crudController(ScopeChange, { filters: ['proyecto_id', 'estado'] }));
mountCrud('/resources', crudController(Resource, { filters: ['rol', 'estado'] }));
mountCrud('/agreements', crudController(Agreement, { filters: ['proyecto_id', 'estado'] }));

module.exports = router;
