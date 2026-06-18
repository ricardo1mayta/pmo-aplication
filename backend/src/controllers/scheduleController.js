const { ScheduleItem, syncProjectProgress, syncScheduleBranches } = require('../models');

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

async function validateParent(payload, currentId = null) {
  if (!payload.padre_id) return;

  if (currentId && Number(payload.padre_id) === Number(currentId)) {
    throw badRequest('Un elemento no puede ser su propio padre.');
  }

  const parent = await ScheduleItem.findByPk(payload.padre_id);
  if (!parent) throw badRequest('El elemento padre seleccionado no existe.');

  if (Number(parent.proyecto_id) !== Number(payload.proyecto_id)) {
    throw badRequest('El elemento padre debe pertenecer al mismo proyecto.');
  }

  let ancestor = parent;
  while (ancestor?.padre_id) {
    if (currentId && Number(ancestor.padre_id) === Number(currentId)) {
      throw badRequest('No se puede mover un elemento dentro de uno de sus descendientes.');
    }
    ancestor = await ScheduleItem.findByPk(ancestor.padre_id);
  }
}

const scheduleController = {
  async list(req, res, next) {
    try {
      const where = {};
      for (const field of ['proyecto_id', 'padre_id', 'estado', 'tipo']) {
        if (req.query[field]) where[field] = req.query[field];
      }
      const rows = await ScheduleItem.findAll({ where, order: [['created_at', 'DESC']] });
      res.json(rows);
    } catch (error) {
      next(error);
    }
  },

  async get(req, res, next) {
    try {
      const row = await ScheduleItem.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: 'Registro no encontrado.' });
      res.json(row);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      await validateParent(req.body);
      const row = await ScheduleItem.create(req.body);
      await syncScheduleBranches([row.id, row.padre_id]);
      await syncProjectProgress([row.proyecto_id]);
      res.status(201).json(await ScheduleItem.findByPk(row.id));
    } catch (error) {
      next(error);
    }
  },

  async update(req, res, next) {
    try {
      const row = await ScheduleItem.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: 'Registro no encontrado.' });

      const oldParentId = row.padre_id;
      const nextPayload = { ...row.toJSON(), ...req.body };
      await validateParent(nextPayload, row.id);
      await row.update(req.body);
      await syncScheduleBranches([row.id, oldParentId, row.padre_id]);
      await syncProjectProgress([row.previous('proyecto_id'), row.proyecto_id]);

      res.json(await ScheduleItem.findByPk(row.id));
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const row = await ScheduleItem.findByPk(req.params.id);
      if (!row) return res.status(404).json({ message: 'Registro no encontrado.' });

      const parentId = row.padre_id;
      const projectId = row.proyecto_id;
      await row.destroy();
      await syncScheduleBranches([parentId]);
      await syncProjectProgress([projectId]);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

module.exports = scheduleController;
