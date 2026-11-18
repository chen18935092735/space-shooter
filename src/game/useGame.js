import { computed, onUnmounted, reactive, ref } from 'vue'
import { BEST_KEY, H, PLAYER, W } from './constants.js'
import { drawFrame } from './draw.js'
import { createBurst, createEnemy, createStars, maybeDropPowerup } from './entities.js'
import {
  LEVELS,
  TOTAL_LEVELS,
  getLevel,
  loadUnlockedLevel,
  saveUnlockedLevel,
} from './levels.js'
import { WEAPONS, createShots } from './weapons.js'

/**
 * 游戏主逻辑 composable
 * 含：关卡进度、输入、更新、绘制、武器与道具
 */
export function useGame() {
  const canvasRef = ref(null)
  const score = ref(0)
  const lives = ref(PLAYER.lives)
  /** 当前关卡 1~10 */
  const level = ref(1)
  /** 本关已击杀 */
  const kills = ref(0)
  const best = ref(Number(localStorage.getItem(BEST_KEY) || 0))
  /** 已解锁最高关卡 */
  const unlocked = ref(loadUnlockedLevel())
  /**
   * 状态：
   * menu | playing | paused | over | clear | win
   */
  const status = ref('menu')
  const touchMode = ref(false)
  const weaponId = ref('normal')
  const weaponTime = ref(0)
  const pickupTip = ref('')

  const weaponName = computed(() => WEAPONS[weaponId.value]?.name || '标准炮')
  const levelInfo = computed(() => getLevel(level.value))
  const killTarget = computed(() => levelInfo.value.killTarget)
  const levelName = computed(() => levelInfo.value.name)
  const levels = LEVELS

  // —— 运行时（非响应式，减少每帧开销）——
  let ctx = null
  let raf = 0
  let last = 0
  let spawnTimer = 0
  let shootCooldown = 0
  let flash = 0
  let tipTimer = 0
  let stars = []
  let particles = []
  let bullets = []
  let enemies = []
  let powerups = []
  let keys = Object.create(null)
  let dragId = null
  let dragOffsetX = 0
  let dragOffsetY = 0
  /** 本关是否已停止刷怪（目标达成后清场） */
  let spawning = true

  const player = reactive({
    x: W / 2,
    y: H - 80,
    w: PLAYER.w,
    h: PLAYER.h,
    speed: PLAYER.speed,
    weaponId: 'normal',
  })

  function clampPlayer() {
    player.x = Math.max(player.w / 2 + 4, Math.min(W - player.w / 2 - 4, player.x))
    player.y = Math.max(player.h / 2 + 4, Math.min(H - player.h / 2 - 4, player.y))
  }

  function showTip(text) {
    pickupTip.value = text
    tipTimer = 2.2
  }

  function setWeapon(id) {
    const cfg = WEAPONS[id] || WEAPONS.normal
    weaponId.value = id
    player.weaponId = id
    weaponTime.value = cfg.duration || 0
    showTip(`获得 ${cfg.name}！`)
  }

  function clearWeapon() {
    weaponId.value = 'normal'
    player.weaponId = 'normal'
    weaponTime.value = 0
    showTip('强化结束，恢复标准炮')
  }

  /** 重置一关内的战场状态（保留总分/生命由调用方决定） */
  function resetBattlefield() {
    kills.value = 0
    weaponId.value = 'normal'
    player.weaponId = 'normal'
    weaponTime.value = 0
    pickupTip.value = ''
    tipTimer = 0
    spawnTimer = 0.5
    shootCooldown = 0
    flash = 0
    bullets = []
    enemies = []
    powerups = []
    particles = []
    player.x = W / 2
    player.y = H - 80
    dragId = null
    spawning = true
    stars = createStars()
    const lv = getLevel(level.value)
    showTip(`第 ${lv.id} 关 · ${lv.name}`)
  }

  /**
   * 开始指定关卡
   * @param {number} [levelId]
   * @param {{ keepScore?: boolean, keepLives?: boolean }} [opts]
   */
  function startLevel(levelId = 1, opts = {}) {
    const id = Math.min(TOTAL_LEVELS, Math.max(1, levelId))
    if (id > unlocked.value) return

    level.value = id
    if (!opts.keepScore) score.value = 0
    if (!opts.keepLives) lives.value = PLAYER.lives
    resetBattlefield()
    status.value = 'playing'
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(loop)
  }

  /** 从菜单开打：默认进已解锁的最新关，也可点选 */
  function startGame() {
    startLevel(Math.min(unlocked.value, TOTAL_LEVELS))
  }

  function retryLevel() {
    startLevel(level.value)
  }

  function nextLevel() {
    if (level.value >= TOTAL_LEVELS) {
      status.value = 'win'
      return
    }
    // 通关后进入下一关，保留总分，补一条命（最多 3）
    lives.value = Math.min(PLAYER.lives, lives.value + 1)
    startLevel(level.value + 1, { keepScore: true, keepLives: true })
  }

  function togglePause() {
    if (status.value === 'playing') {
      status.value = 'paused'
      cancelAnimationFrame(raf)
    } else if (status.value === 'paused') {
      status.value = 'playing'
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
  }

  function gameOver() {
    status.value = 'over'
    cancelAnimationFrame(raf)
    dragId = null
    if (score.value > best.value) {
      best.value = score.value
      localStorage.setItem(BEST_KEY, String(best.value))
    }
  }

  function clearLevel() {
    cancelAnimationFrame(raf)
    dragId = null
    // 解锁下一关
    const unlockTo = Math.min(TOTAL_LEVELS, level.value + 1)
    saveUnlockedLevel(unlockTo)
    unlocked.value = loadUnlockedLevel()

    if (score.value > best.value) {
      best.value = score.value
      localStorage.setItem(BEST_KEY, String(best.value))
    }

    if (level.value >= TOTAL_LEVELS) {
      status.value = 'win'
    } else {
      status.value = 'clear'
    }
  }

  function shoot() {
    if (shootCooldown > 0 || status.value !== 'playing') return
    const cfg = WEAPONS[weaponId.value] || WEAPONS.normal
    shootCooldown = cfg.cooldown
    bullets.push(...createShots(weaponId.value, player))
  }

  function rectHit(a, b) {
    return (
      a.x - a.w / 2 < b.x + b.w / 2 &&
      a.x + a.w / 2 > b.x - b.w / 2 &&
      a.y - a.h / 2 < b.y + b.h / 2 &&
      a.y + a.h / 2 > b.y - b.h / 2
    )
  }

  function clientToGame(clientX, clientY) {
    const canvas = canvasRef.value
    if (!canvas) return { x: player.x, y: player.y }
    const rect = canvas.getBoundingClientRect()
    return {
      x: ((clientX - rect.left) / rect.width) * W,
      y: ((clientY - rect.top) / rect.height) * H,
    }
  }

  function movePlayerByPointer(clientX, clientY) {
    if (status.value !== 'playing') return
    const pos = clientToGame(clientX, clientY)
    player.x = pos.x - dragOffsetX
    player.y = pos.y - dragOffsetY
    clampPlayer()
  }

  function onStagePointerDown(e) {
    if (status.value !== 'playing') return
    if (e.target.closest?.('.pause-btn')) return
    if (e.pointerType === 'touch' || e.pointerType === 'pen') touchMode.value = true
    dragId = e.pointerId
    e.currentTarget.setPointerCapture?.(e.pointerId)
    const pos = clientToGame(e.clientX, e.clientY)
    const near =
      Math.abs(pos.x - player.x) < player.w * 1.8 && Math.abs(pos.y - player.y) < player.h * 1.8
    if (near) {
      dragOffsetX = pos.x - player.x
      dragOffsetY = pos.y - player.y
    } else {
      dragOffsetX = 0
      dragOffsetY = player.h * 0.6
    }
    movePlayerByPointer(e.clientX, e.clientY)
  }

  function onStagePointerMove(e) {
    if (dragId !== e.pointerId || status.value !== 'playing') return
    movePlayerByPointer(e.clientX, e.clientY)
  }

  function onStagePointerUp(e) {
    if (dragId !== e.pointerId) return
    dragId = null
  }

  function hurtPlayer() {
    lives.value -= 1
    flash = 0.35
    particles.push(...createBurst(player.x, player.y, '#ffffff', 16))
    if (lives.value <= 0) gameOver()
  }

  function onEnemyKilled(enemy) {
    score.value += 10 * enemy.maxHp
    kills.value += 1
    particles.push(
      ...createBurst(
        enemy.x,
        enemy.y,
        enemy.kind === 1 ? '#ff8a5c' : enemy.kind === 2 ? '#ffd166' : '#ff5e7a',
        14,
      ),
    )
    const drop = maybeDropPowerup(enemy, getLevel(level.value))
    if (drop) powerups.push(drop)

    // 达到击杀目标后停止刷怪，清完场上敌人即通关
    if (kills.value >= killTarget.value) {
      spawning = false
      if (enemies.length === 0) clearLevel()
    }
  }

  function update(dt) {
    const lv = getLevel(level.value)
    const starMul = 1 + (level.value - 1) * 0.06
    for (const s of stars) {
      s.y += s.z * 60 * starMul * dt
      if (s.y > H) {
        s.y = -2
        s.x = Math.random() * W
      }
    }

    if (dragId === null) {
      let dx = 0
      let dy = 0
      if (keys.ArrowLeft || keys.a || keys.A) dx -= 1
      if (keys.ArrowRight || keys.d || keys.D) dx += 1
      if (keys.ArrowUp || keys.w || keys.W) dy -= 1
      if (keys.ArrowDown || keys.s || keys.S) dy += 1
      if (dx || dy) {
        const len = Math.hypot(dx, dy) || 1
        player.x += (dx / len) * player.speed * dt
        player.y += (dy / len) * player.speed * dt
        clampPlayer()
      }
    }

    if (touchMode.value || keys[' '] || keys.Space) shoot()
    shootCooldown = Math.max(0, shootCooldown - dt)
    flash = Math.max(0, flash - dt)

    if (weaponId.value !== 'normal') {
      weaponTime.value = Math.max(0, weaponTime.value - dt)
      if (weaponTime.value <= 0) clearWeapon()
    }

    if (tipTimer > 0) {
      tipTimer -= dt
      if (tipTimer <= 0) pickupTip.value = ''
    }

    // 刷怪：未达击杀目标才继续刷
    if (spawning) {
      spawnTimer -= dt
      if (spawnTimer <= 0) {
        enemies.push(createEnemy(lv))
        if (Math.random() < (lv.burstChance || 0)) {
          enemies.push(createEnemy(lv))
        }
        spawnTimer = lv.spawn
      }
    }

    bullets = bullets.filter((b) => {
      b.x += (b.vx || 0) * dt
      b.y += (b.vy || 0) * dt
      b.life = (b.life ?? 1) - dt
      return b.y > -30 && b.y < H + 30 && b.x > -40 && b.x < W + 40 && b.life > 0
    })

    for (const e of enemies) {
      e.y += e.speed * dt
      e.x += e.drift * dt
      if (e.x < e.w / 2 || e.x > W - e.w / 2) e.drift *= -1
    }

    powerups = powerups.filter((p) => {
      p.y += p.vy * dt
      return p.y < H + 30
    })

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j]
        const dx2 = b.x - e.x
        const dy2 = b.y - e.y
        if (dx2 * dx2 + dy2 * dy2 < (e.w / 2 + b.r) ** 2) {
          bullets.splice(j, 1)
          e.hp -= b.damage || 1
          particles.push(...createBurst(b.x, b.y, b.color || '#7ee8ff', 5))
          if (e.hp <= 0) {
            enemies.splice(i, 1)
            onEnemyKilled(e)
            if (status.value !== 'playing') return
          }
          break
        }
      }
    }

    // 击杀达标且场上已清空 → 通关
    if (!spawning && enemies.length === 0 && kills.value >= killTarget.value) {
      clearLevel()
      return
    }

    for (let i = powerups.length - 1; i >= 0; i--) {
      const p = powerups[i]
      const dx = p.x - player.x
      const dy = p.y - player.y
      if (dx * dx + dy * dy < (p.r + player.w * 0.45) ** 2) {
        setWeapon(p.weapon)
        particles.push(...createBurst(p.x, p.y, p.color, 12))
        powerups.splice(i, 1)
      }
    }

    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i]
      if (rectHit(player, e)) {
        enemies.splice(i, 1)
        hurtPlayer()
        if (status.value !== 'playing') return
        continue
      }
      if (e.y - e.h / 2 > H) {
        enemies.splice(i, 1)
        hurtPlayer()
        if (status.value !== 'playing') return
      }
    }

    particles = particles.filter((p) => {
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.96
      p.vy *= 0.96
      return p.life > 0
    })
  }

  function draw() {
    if (!ctx) return
    drawFrame(ctx, {
      stars,
      bullets,
      enemies,
      powerups,
      particles,
      player,
      flash,
      status: status.value,
    })
  }

  function loop(t) {
    if (status.value !== 'playing') return
    const dt = Math.min(0.033, (t - last) / 1000)
    last = t
    update(dt)
    draw()
    if (status.value === 'playing') raf = requestAnimationFrame(loop)
  }

  function onKeyDown(e) {
    keys[e.key] = true
    if (e.key === ' ' || e.key === 'Space') e.preventDefault()
    if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
      if (status.value === 'playing' || status.value === 'paused') togglePause()
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (status.value === 'menu') startGame()
      else if (status.value === 'over') retryLevel()
      else if (status.value === 'clear') nextLevel()
      else if (status.value === 'win') status.value = 'menu'
    }
  }

  function onKeyUp(e) {
    keys[e.key] = false
  }

  function bindCanvas(canvas) {
    canvasRef.value = canvas
    if (!canvas) return
    ctx = canvas.getContext('2d')
    canvas.width = W
    canvas.height = H
    touchMode.value = window.matchMedia('(pointer: coarse)').matches
    stars = createStars()
    draw()
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
  }

  function unbind() {
    cancelAnimationFrame(raf)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
  }

  function backToMenu() {
    cancelAnimationFrame(raf)
    status.value = 'menu'
    dragId = null
  }

  onUnmounted(unbind)

  return {
    W,
    H,
    canvasRef,
    score,
    lives,
    level,
    levelName,
    kills,
    killTarget,
    levels,
    unlocked,
    best,
    status,
    weaponId,
    weaponName,
    weaponTime,
    pickupTip,
    startGame,
    startLevel,
    retryLevel,
    nextLevel,
    backToMenu,
    togglePause,
    bindCanvas,
    onStagePointerDown,
    onStagePointerMove,
    onStagePointerUp,
  }
}
