// Stateless helpers — actual overlap registration is in GameScene

export function applyKnockback(scene, target, source, force = 120) {
  if (!target.body) return
  const angle = Phaser.Math.Angle.Between(source.x, source.y, target.x, target.y)
  target.setVelocity(Math.cos(angle) * force, Math.sin(angle) * force)
  scene.time.delayedCall(150, () => {
    if (target.active) target.setVelocity(0, 0)
  })
}
