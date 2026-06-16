function calculateProjectDeviation(project) {
  return Number(project.avance_planificado || 0) - Number(project.avance_real || 0);
}

function calculateProjectTrafficLight(project) {
  const deviation = calculateProjectDeviation(project);
  if (deviation <= 5) return 'VERDE';
  if (deviation <= 15) return 'AMARILLO';
  return 'ROJO';
}

function calculateRiskLevel(risk) {
  const probability = risk.probabilidad;
  const impact = risk.impacto;

  if (
    (probability === 'ALTA' && impact === 'ALTO') ||
    (probability === 'ALTA' && impact === 'MEDIO') ||
    (probability === 'MEDIA' && impact === 'ALTO')
  ) {
    return 'ROJO';
  }

  if (probability === 'MEDIA' && impact === 'MEDIO') return 'AMARILLO';
  return 'VERDE';
}

function calculateResourceLoad(resource) {
  const available = Number(resource.horas_disponibles_semana || 0);
  const assigned = Number(resource.horas_asignadas_semana || 0);
  if (!available) return 0;
  return Math.round((assigned / available) * 100);
}

function isPastDate(value) {
  if (!value) return false;
  const date = new Date(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

module.exports = {
  calculateProjectDeviation,
  calculateProjectTrafficLight,
  calculateRiskLevel,
  calculateResourceLoad,
  isPastDate,
};
