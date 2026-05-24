export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function normalizeVector(dx, dy) {
  const len = Math.hypot(dx, dy)
  if (len === 0) return { dx: 0, dy: 0 }
  return { dx: dx / len, dy: dy / len }
}

export function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}
