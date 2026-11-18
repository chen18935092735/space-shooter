/**
 * 关卡配置（共 10 关）
 * killTarget：本关需要击杀的敌人数
 * speed：敌人基础速度
 * spawn：刷怪间隔（秒，越小越密）
 * maxTier：敌人最高血量等级 1~4
 * dropChance：击杀掉落道具概率
 * burstChance：一次刷出两只的概率
 */

export const TOTAL_LEVELS = 10

/** 已解锁最高关卡本地存储键 */
export const UNLOCK_KEY = 'shooter-unlock'

export const LEVELS = [
  {
    id: 1,
    name: '初入星域',
    tip: '熟悉操控，轻松热身',
    killTarget: 8,
    speed: 48,
    spawn: 1.35,
    maxTier: 1,
    dropChance: 0.1,
    burstChance: 0,
  },
  {
    id: 2,
    name: '流星雨',
    tip: '敌人稍快，注意走位',
    killTarget: 12,
    speed: 58,
    spawn: 1.15,
    maxTier: 1,
    dropChance: 0.14,
    burstChance: 0.05,
  },
  {
    id: 3,
    name: '巡逻舰队',
    tip: '开始出现稍硬的敌机',
    killTarget: 15,
    speed: 68,
    spawn: 1.0,
    maxTier: 2,
    dropChance: 0.16,
    burstChance: 0.08,
  },
  {
    id: 4,
    name: '碎星战场',
    tip: '道具更常见，抓紧强化',
    killTarget: 18,
    speed: 78,
    spawn: 0.9,
    maxTier: 2,
    dropChance: 0.2,
    burstChance: 0.12,
  },
  {
    id: 5,
    name: '高速追击',
    tip: '刷怪加快，别漏敌',
    killTarget: 20,
    speed: 90,
    spawn: 0.78,
    maxTier: 2,
    dropChance: 0.22,
    burstChance: 0.16,
  },
  {
    id: 6,
    name: '装甲来袭',
    tip: '厚血敌人增多',
    killTarget: 22,
    speed: 100,
    spawn: 0.7,
    maxTier: 3,
    dropChance: 0.24,
    burstChance: 0.18,
  },
  {
    id: 7,
    name: '夹击攻势',
    tip: '经常成双刷出',
    killTarget: 25,
    speed: 112,
    spawn: 0.62,
    maxTier: 3,
    dropChance: 0.26,
    burstChance: 0.28,
  },
  {
    id: 8,
    name: '风暴前线',
    tip: '节奏很快，保持移动',
    killTarget: 28,
    speed: 125,
    spawn: 0.52,
    maxTier: 3,
    dropChance: 0.28,
    burstChance: 0.32,
  },
  {
    id: 9,
    name: '绝境突围',
    tip: '高强度压迫，武器很关键',
    killTarget: 32,
    speed: 140,
    spawn: 0.44,
    maxTier: 4,
    dropChance: 0.3,
    burstChance: 0.36,
  },
  {
    id: 10,
    name: '终极决战',
    tip: '最后一关，全力开火！',
    killTarget: 40,
    speed: 155,
    spawn: 0.36,
    maxTier: 4,
    dropChance: 0.34,
    burstChance: 0.42,
  },
]

/** 按关卡 id 取配置（1~10） */
export function getLevel(id) {
  return LEVELS.find((lv) => lv.id === id) || LEVELS[0]
}

/** 读取已解锁最高关卡（至少为 1） */
export function loadUnlockedLevel() {
  const n = Number(localStorage.getItem(UNLOCK_KEY) || 1)
  return Math.min(TOTAL_LEVELS, Math.max(1, n || 1))
}

/** 通关后解锁下一关 */
export function saveUnlockedLevel(levelId) {
  const next = Math.min(TOTAL_LEVELS, levelId)
  const cur = loadUnlockedLevel()
  if (next > cur) localStorage.setItem(UNLOCK_KEY, String(next))
}
