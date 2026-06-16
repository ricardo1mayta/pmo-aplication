const jwt = require('jsonwebtoken');
const { User } = require('../models');

async function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) return res.status(401).json({ message: 'Token requerido.' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await User.findByPk(payload.id, { attributes: ['id', 'nombre', 'email', 'rol', 'estado'] });
    if (!user || user.estado !== 'ACTIVO') return res.status(401).json({ message: 'Usuario no autorizado.' });
    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalido o expirado.' });
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.rol)) return res.status(403).json({ message: 'Permisos insuficientes.' });
    next();
  };
}

module.exports = { authenticate, authorize };
