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

/**
 * 难度曲线：波次越高，敌人越快、刷得越密
 * speedMul / spawn 会随 wave 平滑上升
 */
export const DIFFICULTY = {
  /** 第 1 波基础速度 */
  baseSpeed: 42,
  /** 每波额外速度 */
  speedPerWave: 11,
  /** 速度随机浮动 */
  speedJitter: 22,
  /** 初始刷怪间隔（秒） */
  spawnStart: 1.35,
  /** 最短刷怪间隔（秒） */
  spawnMin: 0.28,
  /** 每波缩短的刷怪间隔 */
  spawnCutPerWave: 0.07,
  /** 击杀多少分升一波（大约） */
  scorePerWave: 140,
}

/** 道具掉落概率（击杀时判定） */
export const DROP = {
  /** 基础掉落率 */
  baseChance: 0.12,
  /** 每波额外掉落率，有上限 */
  chancePerWave: 0.015,
  maxChance: 0.38,
  /** 道具下落速度 */
  fallSpeed: 95,
}
