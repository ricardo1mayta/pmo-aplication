const express = require('express');
const cors = require('cors');
require('dotenv').config();

const routes = require('./routes');
const { sequelize } = require('./models');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api', routes);

app.use((error, req, res, next) => {
  const status = error.status || (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError' ? 400 : 500);
  res.status(status).json({
    message: error.message || 'Error interno del servidor.',
    details: error.errors?.map((item) => item.message),
  });
});

async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    app.listen(port, () => {
      console.log(`PMO API escuchando en http://localhost:${port}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar la API:', error.message);
    process.exit(1);
  }
}

if (require.main === module) start();

module.exports = app;
