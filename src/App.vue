<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'

const W = 480
const H = 720

const canvasRef = ref(null)
const score = ref(0)
const lives = ref(3)
const wave = ref(1)
const best = ref(Number(localStorage.getItem('shooter-best') || 0))
const status = ref('menu') // menu | playing | paused | over
const touch = reactive({ left: false, right: false, fire: false })

const showTouch = computed(() => status.value === 'playing' || status.value === 'paused')

let ctx = null
let raf = 0
let last = 0
let spawnTimer = 0
let shootCooldown = 0
let flash = 0
let stars = []
let particles = []
let bullets = []
let enemies = []
let keys = Object.create(null)
let dragId = null

const player = {
  x: W / 2,
  y: H - 80,
  w: 36,
  h: 40,
  speed: 320,
}

function resetGame() {
  score.value = 0
  lives.value = 3
  wave.value = 1
  spawnTimer = 0
  shootCooldown = 0
  flash = 0
  bullets = []
  enemies = []
  particles = []
  player.x = W / 2
  player.y = H - 80
  touch.left = false
  touch.right = false
  touch.fire = false
  dragId = null
  makeStars()
}

function makeStars() {
  stars = Array.from({ length: 70 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    z: 0.3 + Math.random() * 1.4,
    s: 0.6 + Math.random() * 1.8,
  }))
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
  touch.left = false
  touch.right = false
  touch.fire = false
  if (score.value > best.value) {
    best.value = score.value
    localStorage.setItem('shooter-best', String(best.value))
  }
}

function spawnEnemy() {
  const tier = Math.min(3, 1 + Math.floor(wave.value / 3))
  const size = 22 + Math.random() * 16
  enemies.push({
    x: 30 + Math.random() * (W - 60),
    y: -40,
    w: size,
    h: size,
    hp: tier,
    maxHp: tier,
    speed: 55 + wave.value * 8 + Math.random() * 30,
    drift: (Math.random() - 0.5) * 40,
    kind: tier,
  })
}

function shoot() {
  if (shootCooldown > 0 || status.value !== 'playing') return
  shootCooldown = 0.18
  bullets.push({
    x: player.x,
    y: player.y - player.h / 2,
    vy: -520,
    r: 3.5,
  })
}

function hitBurst(x, y, color, n = 10) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2
    const sp = 40 + Math.random() * 140
    particles.push({
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
}

function rectHit(a, b) {
  return (
    a.x - a.w / 2 < b.x + b.w / 2 &&
    a.x + a.w / 2 > b.x - b.w / 2 &&
    a.y - a.h / 2 < b.y + b.h / 2 &&
    a.y + a.h / 2 > b.y - b.h / 2
  )
}

function canvasToGameX(clientX) {
  const canvas = canvasRef.value
  if (!canvas) return player.x
  const rect = canvas.getBoundingClientRect()
  const ratio = W / rect.width
  return (clientX - rect.left) * ratio
}

function movePlayerTo(clientX) {
  if (status.value !== 'playing') return
  player.x = Math.max(
    player.w / 2 + 4,
    Math.min(W - player.w / 2 - 4, canvasToGameX(clientX)),
  )
}

function setPad(dir, on) {
  if (dir === 'left') touch.left = on
  if (dir === 'right') touch.right = on
  if (dir === 'fire') touch.fire = on
}

function onPadStart(dir, e) {
  e.preventDefault()
  setPad(dir, true)
  if (dir === 'fire') shoot()
}

function onPadEnd(dir, e) {
  e.preventDefault()
  setPad(dir, false)
}

function onStagePointerDown(e) {
  if (status.value !== 'playing') return
  if (e.target.closest?.('.pad')) return
  dragId = e.pointerId
  e.currentTarget.setPointerCapture?.(e.pointerId)
  movePlayerTo(e.clientX)
  touch.fire = true
  shoot()
}

function onStagePointerMove(e) {
  if (dragId !== e.pointerId || status.value !== 'playing') return
  movePlayerTo(e.clientX)
}

function onStagePointerUp(e) {
  if (dragId !== e.pointerId) return
  dragId = null
  touch.fire = false
}

function update(dt) {
  for (const s of stars) {
    s.y += s.z * 60 * dt
    if (s.y > H) {
      s.y = -2
      s.x = Math.random() * W
    }
  }

  let dx = 0
  if (keys.ArrowLeft || keys.a || keys.A || touch.left) dx -= 1
  if (keys.ArrowRight || keys.d || keys.D || touch.right) dx += 1
  if (dragId === null) {
    player.x += dx * player.speed * dt
    player.x = Math.max(player.w / 2 + 4, Math.min(W - player.w / 2 - 4, player.x))
  }

  if (keys[' '] || keys.Space || touch.fire) shoot()
  shootCooldown = Math.max(0, shootCooldown - dt)
  flash = Math.max(0, flash - dt)

  spawnTimer -= dt
  const interval = Math.max(0.35, 1.15 - wave.value * 0.06)
  if (spawnTimer <= 0) {
    spawnEnemy()
    spawnTimer = interval
  }

  bullets = bullets.filter((b) => {
    b.y += b.vy * dt
    return b.y > -20
  })

  for (const e of enemies) {
    e.y += e.speed * dt
    e.x += e.drift * dt
    if (e.x < e.w / 2 || e.x > W - e.w / 2) e.drift *= -1
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j]
      const dx2 = b.x - e.x
      const dy2 = b.y - e.y
      if (dx2 * dx2 + dy2 * dy2 < (e.w / 2 + b.r) ** 2) {
        bullets.splice(j, 1)
        e.hp -= 1
        hitBurst(b.x, b.y, '#7ee8ff', 5)
        if (e.hp <= 0) {
          score.value += 10 * e.maxHp
          hitBurst(e.x, e.y, e.kind === 1 ? '#ff8a5c' : e.kind === 2 ? '#ffd166' : '#ff5e7a', 14)
          enemies.splice(i, 1)
        }
        break
      }
    }
  }

  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i]
    if (rectHit(player, e)) {
      enemies.splice(i, 1)
      lives.value -= 1
      flash = 0.35
      hitBurst(player.x, player.y, '#ffffff', 16)
      if (lives.value <= 0) {
        gameOver()
        return
      }
      continue
    }
    if (e.y - e.h / 2 > H) {
      enemies.splice(i, 1)
      lives.value -= 1
      flash = 0.25
      if (lives.value <= 0) {
        gameOver()
        return
      }
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

  wave.value = 1 + Math.floor(score.value / 150)
}

function drawShip(x, y) {
  ctx.save()
  ctx.translate(x, y)
  ctx.fillStyle = 'rgba(90, 220, 255, 0.18)'
  ctx.beginPath()
  ctx.ellipse(0, 6, 22, 14, 0, 0, Math.PI * 2)
  ctx.fill()
  const g = ctx.createLinearGradient(0, -22, 0, 20)
  g.addColorStop(0, '#9ef0ff')
  g.addColorStop(0.45, '#2bb8e8')
  g.addColorStop(1, '#14688a')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.moveTo(0, -22)
  ctx.lineTo(16, 14)
  ctx.lineTo(6, 10)
  ctx.lineTo(0, 18)
  ctx.lineTo(-6, 10)
  ctx.lineTo(-16, 14)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = '#dff9ff'
  ctx.beginPath()
  ctx.ellipse(0, -4, 5, 8, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = `rgba(255, 180, 80, ${0.5 + Math.random() * 0.5})`
  ctx.beginPath()
  ctx.moveTo(-5, 16)
  ctx.lineTo(0, 26 + Math.random() * 8)
  ctx.lineTo(5, 16)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawEnemy(e) {
  ctx.save()
  ctx.translate(e.x, e.y)
  const colors = {
    1: ['#ff8a5c', '#c44b2b'],
    2: ['#ffd166', '#c48a1a'],
    3: ['#ff5e7a', '#a01d3a'],
  }
  const [c1, c2] = colors[e.kind] || colors[1]
  ctx.fillStyle = c2
  ctx.beginPath()
  ctx.moveTo(0, e.h / 2)
  ctx.lineTo(e.w / 2, -e.h / 4)
  ctx.lineTo(e.w / 4, -e.h / 2)
  ctx.lineTo(-e.w / 4, -e.h / 2)
  ctx.lineTo(-e.w / 2, -e.h / 4)
  ctx.closePath()
  ctx.fill()
  ctx.fillStyle = c1
  ctx.beginPath()
  ctx.arc(0, -2, e.w * 0.18, 0, Math.PI * 2)
  ctx.fill()
  if (e.maxHp > 1) {
    const ratio = e.hp / e.maxHp
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(-e.w / 3, e.h / 2 + 4, (e.w * 2) / 3, 3)
    ctx.fillStyle = '#7ee8ff'
    ctx.fillRect(-e.w / 3, e.h / 2 + 4, ((e.w * 2) / 3) * ratio, 3)
  }
  ctx.restore()
}

function draw() {
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#081018')
  bg.addColorStop(0.55, '#0c1a2a')
  bg.addColorStop(1, '#101820')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  for (const s of stars) {
    ctx.fillStyle = `rgba(210, 230, 255, ${0.25 + s.z * 0.4})`
    ctx.fillRect(s.x, s.y, s.s, s.s)
  }

  ctx.fillStyle = 'rgba(30, 90, 120, 0.08)'
  ctx.beginPath()
  ctx.ellipse(W * 0.25, H * 0.3, 160, 90, 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(120, 60, 40, 0.06)'
  ctx.beginPath()
  ctx.ellipse(W * 0.75, H * 0.55, 140, 100, -0.3, 0, Math.PI * 2)
  ctx.fill()

  for (const b of bullets) {
    ctx.fillStyle = '#9ef0ff'
    ctx.shadowColor = '#5ad4ff'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
    ctx.fillStyle = 'rgba(158, 240, 255, 0.35)'
    ctx.fillRect(b.x - 1.5, b.y, 3, 12)
  }

  for (const e of enemies) drawEnemy(e)
  if (status.value !== 'over') drawShip(player.x, player.y)

  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 80, 80, ${flash * 0.45})`
    ctx.fillRect(0, 0, W, H)
  }
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

function preventGesture(e) {
  if (e.touches && e.touches.length > 1) e.preventDefault()
}

onMounted(() => {
  const canvas = canvasRef.value
  ctx = canvas.getContext('2d')
  canvas.width = W
  canvas.height = H
  makeStars()
  draw()
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  document.addEventListener('gesturestart', preventGesture, { passive: false })
})

onUnmounted(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  document.removeEventListener('gesturestart', preventGesture)
})
</script>

<template>
  <div class="page">
    <div class="frame">
      <header class="hud">
        <div class="stat">
          <span class="label">得分</span>
          <strong>{{ score }}</strong>
        </div>
        <div class="stat center">
          <span class="label">波次</span>
          <strong>{{ wave }}</strong>
        </div>
        <div class="stat right">
          <span class="label">生命</span>
          <strong class="hearts">{{ '♥'.repeat(Math.max(0, lives)) }}</strong>
        </div>
      </header>

      <div
        class="stage"
        @pointerdown="onStagePointerDown"
        @pointermove="onStagePointerMove"
        @pointerup="onStagePointerUp"
        @pointercancel="onStagePointerUp"
      >
        <canvas ref="canvasRef" :width="W" :height="H"></canvas>

        <div v-if="showTouch" class="controls" @pointerdown.stop>
          <div class="pad-group">
            <button
              class="pad"
              :class="{ on: touch.left }"
              aria-label="向左"
              @pointerdown="onPadStart('left', $event)"
              @pointerup="onPadEnd('left', $event)"
              @pointerleave="onPadEnd('left', $event)"
              @pointercancel="onPadEnd('left', $event)"
            >
              ◀
            </button>
            <button
              class="pad"
              :class="{ on: touch.right }"
              aria-label="向右"
              @pointerdown="onPadStart('right', $event)"
              @pointerup="onPadEnd('right', $event)"
              @pointerleave="onPadEnd('right', $event)"
              @pointercancel="onPadEnd('right', $event)"
            >
              ▶
            </button>
          </div>
          <button
            class="pad fire"
            :class="{ on: touch.fire }"
            aria-label="射击"
            @pointerdown="onPadStart('fire', $event)"
            @pointerup="onPadEnd('fire', $event)"
            @pointerleave="onPadEnd('fire', $event)"
            @pointercancel="onPadEnd('fire', $event)"
          >
            开火
          </button>
        </div>

        <button
          v-if="status === 'playing'"
          class="pause-btn"
          type="button"
          @click.stop="togglePause"
          @pointerdown.stop
        >
          暂停
        </button>

        <div v-if="status === 'menu'" class="overlay">
          <p class="brand">星际射击</p>
          <p class="tag">电脑键盘或手机触屏都能玩，清掉来袭的敌机</p>
          <button class="btn" @click="startGame">开始游戏</button>
          <p class="hint">电脑：← → 移动 · 空格射击</p>
          <p class="hint">手机：按住左右键，或手指拖飞船；点开火射击</p>
          <p v-if="best" class="best">最高分 {{ best }}</p>
        </div>

        <div v-else-if="status === 'paused'" class="overlay dim">
          <p class="title">已暂停</p>
          <button class="btn" @click="togglePause">继续</button>
        </div>

        <div v-else-if="status === 'over'" class="overlay">
          <p class="title">游戏结束</p>
          <p class="scoreline">本局得分 <strong>{{ score }}</strong></p>
          <p class="best">最高分 {{ best }}</p>
          <button class="btn" @click="startGame">再来一局</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.page {
  min-height: 100%;
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: max(8px, env(safe-area-inset-top)) max(8px, env(safe-area-inset-right))
    max(8px, env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-left));
  background:
    radial-gradient(ellipse 80% 50% at 50% -10%, rgba(40, 120, 160, 0.22), transparent 55%),
    radial-gradient(ellipse 60% 40% at 80% 100%, rgba(160, 70, 40, 0.12), transparent 50%),
    #060912;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
}

.frame {
  width: min(100%, 480px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hud {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  align-items: end;
  padding: 0 4px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat.center {
  align-items: center;
}

.stat.right {
  align-items: flex-end;
}

.label {
  font-size: 11px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(180, 210, 230, 0.55);
}

.stat strong {
  font-size: 22px;
  font-variant-numeric: tabular-nums;
  color: #e9f6ff;
  font-weight: 700;
}

.hearts {
  color: #ff6b7a !important;
  letter-spacing: 0.08em;
  font-size: 18px !important;
}

.stage {
  position: relative;
  border-radius: 14px;
  overflow: hidden;
  box-shadow:
    0 0 0 1px rgba(120, 180, 220, 0.18),
    0 24px 60px rgba(0, 0, 0, 0.55);
  touch-action: none;
}

canvas {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: top;
  background: #081018;
  touch-action: none;
}

.controls {
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: 14px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  pointer-events: none;
  z-index: 2;
}

.pad-group {
  display: flex;
  gap: 10px;
  pointer-events: auto;
}

.pad {
  pointer-events: auto;
  width: 64px;
  height: 64px;
  border-radius: 18px;
  background: rgba(12, 24, 36, 0.55);
  border: 1px solid rgba(150, 210, 240, 0.28);
  color: #d8f3ff;
  font-size: 22px;
  font-weight: 700;
  backdrop-filter: blur(4px);
  -webkit-tap-highlight-color: transparent;
  touch-action: none;
}

.pad.on {
  background: rgba(60, 160, 200, 0.45);
  border-color: rgba(130, 220, 255, 0.7);
}

.pad.fire {
  width: 78px;
  height: 78px;
  border-radius: 50%;
  font-size: 15px;
  letter-spacing: 0.08em;
  background: rgba(180, 70, 50, 0.45);
  border-color: rgba(255, 150, 120, 0.45);
}

.pad.fire.on {
  background: rgba(230, 90, 60, 0.65);
  border-color: rgba(255, 180, 140, 0.8);
}

.pause-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 3;
  padding: 6px 12px;
  border-radius: 999px;
  background: rgba(8, 16, 24, 0.55);
  border: 1px solid rgba(150, 200, 230, 0.25);
  color: rgba(220, 235, 245, 0.9);
  font-size: 12px;
  letter-spacing: 0.06em;
  backdrop-filter: blur(4px);
  -webkit-tap-highlight-color: transparent;
}

.overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 24px;
  text-align: center;
  background: rgba(6, 10, 18, 0.72);
  backdrop-filter: blur(3px);
  z-index: 4;
}

.overlay.dim {
  background: rgba(6, 10, 18, 0.55);
}

.brand {
  font-size: clamp(28px, 9vw, 42px);
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #f2fbff;
  text-shadow: 0 0 28px rgba(90, 210, 255, 0.35);
}

.tag {
  max-width: 280px;
  color: rgba(200, 220, 235, 0.75);
  font-size: 14px;
  line-height: 1.5;
}

.title {
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

.scoreline {
  color: rgba(210, 230, 245, 0.85);
}

.scoreline strong {
  color: #7ee8ff;
  font-size: 1.2em;
}

.best {
  font-size: 13px;
  color: rgba(255, 209, 102, 0.85);
}

.hint {
  font-size: 12px;
  color: rgba(170, 195, 215, 0.55);
  line-height: 1.4;
}

.btn {
  margin-top: 6px;
  padding: 12px 28px;
  border-radius: 999px;
  background: linear-gradient(180deg, #5ad4ff, #1f8fb8);
  color: #041018;
  font-weight: 700;
  letter-spacing: 0.06em;
  box-shadow: 0 8px 24px rgba(40, 160, 210, 0.35);
  transition: transform 0.15s ease, filter 0.15s ease;
  -webkit-tap-highlight-color: transparent;
}

.btn:hover {
  transform: translateY(-1px);
  filter: brightness(1.08);
}

.btn:active {
  transform: translateY(1px);
}

@media (min-width: 700px) {
  .controls {
    opacity: 0.35;
  }

  .controls:hover,
  .pad.on {
    opacity: 1;
  }
}
</style>
