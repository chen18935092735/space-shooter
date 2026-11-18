import { DROP, H, W } from './constants.js'
import { POWERUP_TYPES } from './weapons.js'

/**
 * 按当前关卡配置生成敌人
 * @param {object} level 关卡配置（见 levels.js）
 */
export function createEnemy(level) {
  const maxTier = level.maxTier || 1
  // 同关内随机一点血量，但不超过本关上限
  const tier = 1 + Math.floor(Math.random() * maxTier)
  const size = 20 + Math.random() * 16 + tier * 2
  const speed = level.speed + Math.random() * 24

  return {
    x: 30 + Math.random() * (W - 60),
    y: -40,
    w: size,
    h: size,
    hp: tier,
    maxHp: tier,
    speed,
    drift: (Math.random() - 0.5) * (28 + level.id * 5),
    kind: Math.min(3, tier),
  }
}

/**
 * 击杀后按关卡掉落率生成道具
 * @returns {object|null}
 */
export function maybeDropPowerup(enemy, level) {
  const chance = level.dropChance ?? DROP.baseChance
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
