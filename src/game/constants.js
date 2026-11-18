/** 画布与基础数值（逻辑坐标，和屏幕显示比例无关） */
export const W = 480
export const H = 720

/** 本地最高分存储键 */
export const BEST_KEY = 'shooter-best'

/** 玩家基础属性 */
export const PLAYER = {
  w: 36,
  h: 40,
  speed: 340,
  /** 开局生命 */
  lives: 3,
}

/** 道具下落等通用掉落参数 */
export const DROP = {
  /** 默认掉落率（关卡可覆盖） */
  baseChance: 0.12,
  /** 道具下落速度 */
  fallSpeed: 95,
}
