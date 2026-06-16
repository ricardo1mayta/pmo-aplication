const { Op } = require('sequelize');

function crudController(Model, options = {}) {
  const include = options.include || [];

  return {
    async list(req, res, next) {
      try {
        const where = {};
        for (const field of options.filters || []) {
          if (!req.query[field]) continue;
          if (options.partialFilters?.includes(field)) where[field] = { [Op.like]: `%${req.query[field]}%` };
          else where[field] = req.query[field];
        }
        const rows = await Model.findAll({ where, include, order: [['created_at', 'DESC']] });
        res.json(rows);
      } catch (error) {
        next(error);
      }
    },

    async get(req, res, next) {
      try {
        const row = await Model.findByPk(req.params.id, { include });
        if (!row) return res.status(404).json({ message: 'Registro no encontrado.' });
        res.json(row);
      } catch (error) {
        next(error);
      }
    },

    async create(req, res, next) {
      try {
        const row = await Model.create(req.body);
        res.status(201).json(row);
      } catch (error) {
        next(error);
      }
    },

    async update(req, res, next) {
      try {
        const row = await Model.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'Registro no encontrado.' });
        await row.update(req.body);
        res.json(row);
      } catch (error) {
        next(error);
      }
    },

    async remove(req, res, next) {
      try {
        const row = await Model.findByPk(req.params.id);
        if (!row) return res.status(404).json({ message: 'Registro no encontrado.' });
        await row.destroy();
        res.status(204).send();
      } catch (error) {
        next(error);
      }
    },
  };
}

module.exports = crudController;
