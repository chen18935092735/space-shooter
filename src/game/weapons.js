/**
 * 武器系统
 * - normal  ：默认单发
 * - shotgun ：散弹，一次射出多发扇形子弹
 * - rapid   ：速射，射速极快
 * - heavy   ：重型双炮，伤害高、带轻微穿透感（更大子弹）
 */

/** 武器配置表 */
export const WEAPONS = {
  normal: {
    id: 'normal',
    name: '标准炮',
    /** 两次射击最短间隔（秒） */
    cooldown: 0.2,
    /** 道具持续时间；null 表示永久（默认武器） */
    duration: null,
    color: '#9ef0ff',
  },
  shotgun: {
    id: 'shotgun',
    name: '散弹枪',
    cooldown: 0.32,
    duration: 12,
    color: '#ffd166',
  },
  rapid: {
    id: 'rapid',
    name: '速射机枪',
    cooldown: 0.08,
    duration: 10,
    color: '#7CFFB2',
  },
  heavy: {
    id: 'heavy',
    name: '重型双炮',
    cooldown: 0.26,
    duration: 11,
    color: '#ff7ab8',
  },
}

/** 道具类型与对应武器（掉落物展示用） */
export const POWERUP_TYPES = [
  { id: 'shotgun', label: '散', color: '#ffd166', weapon: 'shotgun' },
  { id: 'rapid', label: '速', color: '#7CFFB2', weapon: 'rapid' },
  { id: 'heavy', label: '重', color: '#ff7ab8', weapon: 'heavy' },
]

/**
 * 根据当前武器生成子弹列表
 * @param {string} weaponId
 * @param {{ x: number, y: number, h: number }} player
 * @returns {Array<object>}
 */
export function createShots(weaponId, player) {
  const muzzleY = player.y - player.h / 2
  const x = player.x

  if (weaponId === 'shotgun') {
    // 扇形 5 发散弹
    const angles = [-0.35, -0.18, 0, 0.18, 0.35]
    return angles.map((angle) => {
      const speed = 500
      return {
        x,
        y: muzzleY,
        vx: Math.sin(angle) * speed,
        vy: -Math.cos(angle) * speed,
        r: 3,
        damage: 1,
        color: WEAPONS.shotgun.color,
        life: 1.2,
      }
    })
  }

  if (weaponId === 'rapid') {
    return [
      {
        x,
        y: muzzleY,
        vx: 0,
        vy: -620,
        r: 2.6,
        damage: 1,
        color: WEAPONS.rapid.color,
        life: 1.4,
      },
    ]
  }

  if (weaponId === 'heavy') {
    // 左右双炮，伤害更高、体积更大
    return [-10, 10].map((ox) => ({
      x: x + ox,
      y: muzzleY,
      vx: 0,
      vy: -480,
      r: 5.5,
      damage: 2,
      color: WEAPONS.heavy.color,
      life: 1.6,
    }))
  }

  // 默认单发
  return [
    {
      x,
      y: muzzleY,
      vx: 0,
      vy: -520,
      r: 3.5,
      damage: 1,
      color: WEAPONS.normal.color,
      life: 1.5,
    },
  ]
}
