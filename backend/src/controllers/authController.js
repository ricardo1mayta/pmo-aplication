const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

function sign(user) {
  return jwt.sign(
    { id: user.id, email: user.email, rol: user.rol },
    process.env.JWT_SECRET || 'dev_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' },
  );
}

async function register(req, res, next) {
  try {
    const { nombre, email, password, rol = 'GESTOR' } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'Nombre, email y password son obligatorios.' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(409).json({ message: 'El email ya esta registrado.' });

    const password_hash = await bcrypt.hash(password, 10);
    const user = await User.create({ nombre, email, password_hash, rol });
    res.status(201).json({
      token: sign(user),
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (error) {
    next(error);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ message: 'Credenciales invalidas.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ message: 'Credenciales invalidas.' });

    res.json({
      token: sign(user),
      user: { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol },
    });
  } catch (error) {
    next(error);
  }
}

async function me(req, res) {
  res.json(req.user);
}

module.exports = { register, login, me };
