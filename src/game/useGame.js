import { computed, onUnmounted, reactive, ref } from 'vue'
import { BEST_KEY, DIFFICULTY, H, PLAYER, W } from './constants.js'
import { drawFrame } from './draw.js'
import {
  createBurst,
  createEnemy,
  createStars,
  maybeDropPowerup,
  spawnInterval,
} from './entities.js'
import { WEAPONS, createShots } from './weapons.js'

/**
 * 游戏主逻辑 composable
 * 负责：状态、输入、更新、绘制、武器与道具
 */
export function useGame() {
  const canvasRef = ref(null)
  const score = ref(0)
  const lives = ref(PLAYER.lives)
  const wave = ref(1)
  const best = ref(Number(localStorage.getItem(BEST_KEY) || 0))
  const status = ref('menu') // menu | playing | paused | over
  const touchMode = ref(false)
  /** 当前武器 id */
  const weaponId = ref('normal')
  /** 强化剩余时间（秒），默认武器为 0 */
  const weaponTime = ref(0)
  /** 拾取提示短文案 */
  const pickupTip = ref('')

  const weaponName = computed(() => WEAPONS[weaponId.value]?.name || '标准炮')

  // —— 可变运行时（不必做成响应式，避免每帧触发渲染）——
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

  function resetGame() {
    score.value = 0
    lives.value = PLAYER.lives
    wave.value = 1
    weaponId.value = 'normal'
    player.weaponId = 'normal'
    weaponTime.value = 0
    pickupTip.value = ''
    tipTimer = 0
    spawnTimer = 0.4
    shootCooldown = 0
    flash = 0
    bullets = []
    enemies = []
    powerups = []
    particles = []
    player.x = W / 2
    player.y = H - 80
    dragId = null
    stars = createStars()
  }

  function startGame() {
    resetGame()
    status.value = 'playing'
    last = performance.now()
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(loop)
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

  function update(dt) {
    // 星空滚动（后期更快一点，增加压迫感）
    const starMul = 1 + (wave.value - 1) * 0.08
    for (const s of stars) {
      s.y += s.z * 60 * starMul * dt
      if (s.y > H) {
        s.y = -2
        s.x = Math.random() * W
      }
    }

    // 键盘移动
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

    // 开火：手机自动；电脑空格
    if (touchMode.value || keys[' '] || keys.Space) shoot()
    shootCooldown = Math.max(0, shootCooldown - dt)
    flash = Math.max(0, flash - dt)

    // 武器计时
    if (weaponId.value !== 'normal') {
      weaponTime.value = Math.max(0, weaponTime.value - dt)
      if (weaponTime.value <= 0) clearWeapon()
    }

    // 提示计时
    if (tipTimer > 0) {
      tipTimer -= dt
      if (tipTimer <= 0) pickupTip.value = ''
    }

    // 刷怪（随波次加速）
    spawnTimer -= dt
    if (spawnTimer <= 0) {
      enemies.push(createEnemy(wave.value))
      // 高波次偶尔连刷两只
      if (wave.value >= 5 && Math.random() < 0.28) {
        enemies.push(createEnemy(wave.value))
      }
      spawnTimer = spawnInterval(wave.value)
    }

    // 子弹运动
    bullets = bullets.filter((b) => {
      b.x += (b.vx || 0) * dt
      b.y += (b.vy || 0) * dt
      b.life = (b.life ?? 1) - dt
      return b.y > -30 && b.y < H + 30 && b.x > -40 && b.x < W + 40 && b.life > 0
    })

    // 敌人运动
    for (const e of enemies) {
      e.y += e.speed * dt
      e.x += e.drift * dt
      if (e.x < e.w / 2 || e.x > W - e.w / 2) e.drift *= -1
    }

    // 道具下落
    powerups = powerups.filter((p) => {
      p.y += p.vy * dt
      return p.y < H + 30
    })

    // 子弹 vs 敌人
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
            score.value += 10 * e.maxHp
            particles.push(
              ...createBurst(
                e.x,
                e.y,
                e.kind === 1 ? '#ff8a5c' : e.kind === 2 ? '#ffd166' : '#ff5e7a',
                14,
              ),
            )
            const drop = maybeDropPowerup(e, wave.value)
            if (drop) powerups.push(drop)
            enemies.splice(i, 1)
          }
          break
        }
      }
    }

    // 拾取道具
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

    // 敌人撞击 / 漏过底部
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

    // 粒子
    particles = particles.filter((p) => {
      p.life -= dt
      p.x += p.vx * dt
      p.y += p.vy * dt
      p.vx *= 0.96
      p.vy *= 0.96
      return p.life > 0
    })

    // 根据分数推进波次（敌人因此持续加速）
    wave.value = 1 + Math.floor(score.value / DIFFICULTY.scorePerWave)
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
    if ((e.key === 'Enter' || e.key === ' ') && (status.value === 'menu' || status.value === 'over')) {
      startGame()
    }
  }

  function onKeyUp(e) {
    keys[e.key] = false
  }

  function bindCanvas(canvas) {
    // 由 GameStage 在挂载后传入真实 canvas 节点
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

  onUnmounted(unbind)

  return {
    W,
    H,
    canvasRef,
    score,
    lives,
    wave,
    best,
    status,
    weaponId,
    weaponName,
    weaponTime,
    pickupTip,
    startGame,
    togglePause,
    bindCanvas,
    onStagePointerDown,
    onStagePointerMove,
    onStagePointerUp,
  }
}
