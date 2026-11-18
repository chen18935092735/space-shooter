import { DIFFICULTY, DROP, H, W } from './constants.js'
import { POWERUP_TYPES } from './weapons.js'

/**
 * 生成一名敌人
 * 波次越高：速度越快、血量分层越多
 */
export function createEnemy(wave) {
  const tier = Math.min(4, 1 + Math.floor((wave - 1) / 2))
  const size = 20 + Math.random() * 16 + tier * 2
  const speed =
    DIFFICULTY.baseSpeed +
    wave * DIFFICULTY.speedPerWave +
    Math.random() * DIFFICULTY.speedJitter

  return {
    x: 30 + Math.random() * (W - 60),
    y: -40,
    w: size,
    h: size,
    hp: tier,
    maxHp: tier,
    speed,
    drift: (Math.random() - 0.5) * (30 + wave * 4),
    kind: Math.min(3, tier),
  }
}

/** 当前波次的刷怪间隔（秒） */
export function spawnInterval(wave) {
  return Math.max(
    DIFFICULTY.spawnMin,
    DIFFICULTY.spawnStart - (wave - 1) * DIFFICULTY.spawnCutPerWave,
  )
}

/**
 * 击杀后有概率掉落道具
 * @returns {object|null}
 */
export function maybeDropPowerup(enemy, wave) {
  const chance = Math.min(DROP.maxChance, DROP.baseChance + (wave - 1) * DROP.chancePerWave)
  if (Math.random() > chance) return null

  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)]
  return {
    x: enemy.x,
    y: enemy.y,
    r: 14,
    vy: DROP.fallSpeed,
    ...type,
  }
}

/** 爆炸粒子 */
export function createBurst(x, y, color, n = 10) {
  const list = []
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 40 + Math.random() * 140
    list.push({
      x,
      y,
      vx: Math.cos(a) * sp,
      vy: Math.sin(a) * sp,
      life: 0.35 + Math.random() * 0.45,
      max: 0.8,
      color,
      size: 1.5 + Math.random() * 2.5,
    })
  }
  return list
}

/** 背景星空 */
export function createStars(count = 70) {
  return Array.from({ length: count }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    z: 0.3 + Math.random() * 1.4,
    s: 0.6 + Math.random() * 1.8,
  }))
}
