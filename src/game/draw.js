import { H, W } from './constants.js'
import { WEAPONS } from './weapons.js'

/** 绘制整帧画面 */
export function drawFrame(ctx, state) {
  const { stars, bullets, enemies, powerups, particles, player, flash, status } = state

  // 背景渐变
  const bg = ctx.createLinearGradient(0, 0, 0, H)
  bg.addColorStop(0, '#081018')
  bg.addColorStop(0.55, '#0c1a2a')
  bg.addColorStop(1, '#101820')
  ctx.fillStyle = bg
  ctx.fillRect(0, 0, W, H)

  // 星空
  for (const s of stars) {
    ctx.fillStyle = `rgba(210, 230, 255, ${0.25 + s.z * 0.4})`
    ctx.fillRect(s.x, s.y, s.s, s.s)
  }

  // 淡淡星云
  ctx.fillStyle = 'rgba(30, 90, 120, 0.08)'
  ctx.beginPath()
  ctx.ellipse(W * 0.25, H * 0.3, 160, 90, 0.4, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(120, 60, 40, 0.06)'
  ctx.beginPath()
  ctx.ellipse(W * 0.75, H * 0.55, 140, 100, -0.3, 0, Math.PI * 2)
  ctx.fill()

  // 子弹
  for (const b of bullets) {
    ctx.fillStyle = b.color || '#9ef0ff'
    ctx.shadowColor = b.color || '#5ad4ff'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }

  // 敌人
  for (const e of enemies) drawEnemy(ctx, e)

  // 道具
  for (const p of powerups) drawPowerup(ctx, p)

  // 玩家飞船
  if (status !== 'over') drawShip(ctx, player.x, player.y, player.weaponId)

  // 粒子
  for (const p of particles) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1

  // 受伤闪红
  if (flash > 0) {
    ctx.fillStyle = `rgba(255, 80, 80, ${flash * 0.45})`
    ctx.fillRect(0, 0, W, H)
  }
}

function drawShip(ctx, x, y, weaponId = 'normal') {
  ctx.save()
  ctx.translate(x, y)

  // 武器光环提示
  const weapon = WEAPONS[weaponId] || WEAPONS.normal
  if (weaponId !== 'normal') {
    ctx.strokeStyle = weapon.color
    ctx.globalAlpha = 0.45
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, 28, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }

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

/** 敌人：下落小蜜蜂（kind 不同颜色条纹） */
function drawEnemy(ctx, e) {
  ctx.save()
  ctx.translate(e.x, e.y)

  const colors = {
    1: ['#ff8a5c', '#c44b2b'],
    2: ['#ffd166', '#c48a1a'],
    3: ['#ff5e7a', '#a01d3a'],
  }
  const [c1, c2] = colors[e.kind] || colors[1]
  const s = Math.max(e.w, e.h) / 28
  const t = performance.now() / 160 + e.x * 0.02
  const flap = Math.sin(t * 3) * 0.4

  ctx.save()
  ctx.scale(s, s)

  // 翅膀
  ctx.save()
  ctx.translate(-6, -1)
  ctx.rotate(-0.5 + flap)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.beginPath()
  ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  ctx.save()
  ctx.translate(6, -1)
  ctx.rotate(0.5 - flap)
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.beginPath()
  ctx.ellipse(0, 0, 11, 6, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()

  // 身体
  ctx.fillStyle = '#ffe082'
  ctx.beginPath()
  ctx.ellipse(0, 2, 9, 11, 0, 0, Math.PI * 2)
  ctx.fill()

  // 条纹（按敌人等级变色）
  ctx.fillStyle = c2
  for (const y of [-3, 2, 7]) {
    ctx.fillRect(-8, y, 16, 2.8)
  }
  ctx.fillStyle = c1
  ctx.fillRect(-8, 2, 16, 1.5)

  // 头朝下，更像下落
  ctx.fillStyle = '#2b2110'
  ctx.beginPath()
  ctx.arc(0, 12, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.strokeStyle = '#2b2110'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(-2, 15)
  ctx.quadraticCurveTo(-7, 22, -4, 20)
  ctx.moveTo(2, 15)
  ctx.quadraticCurveTo(7, 22, 4, 20)
  ctx.stroke()
  ctx.fillStyle = c1
  ctx.beginPath()
  ctx.arc(-4, 20, 1.8, 0, Math.PI * 2)
  ctx.arc(4, 20, 1.8, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(-1.8, 12.2, 1.3, 0, Math.PI * 2)
  ctx.arc(1.8, 12.2, 1.3, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#111'
  ctx.beginPath()
  ctx.arc(-1.8, 12.5, 0.55, 0, Math.PI * 2)
  ctx.arc(1.8, 12.5, 0.55, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore() // 结束 scale

  if (e.maxHp > 1) {
    const ratio = e.hp / e.maxHp
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(-e.w / 3, e.h / 2 + 6, (e.w * 2) / 3, 3)
    ctx.fillStyle = '#7ee8ff'
    ctx.fillRect(-e.w / 3, e.h / 2 + 6, ((e.w * 2) / 3) * ratio, 3)
  }
  ctx.restore()
}

function drawPowerup(ctx, p) {
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.strokeStyle = p.color
  ctx.globalAlpha = 0.35 + Math.sin(performance.now() / 140) * 0.2
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(0, 0, p.r + 3, 0, Math.PI * 2)
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.fillStyle = p.color
  ctx.beginPath()
  ctx.arc(0, 0, p.r, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#102018'
  ctx.font = 'bold 14px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(p.label, 0, 1)
  ctx.restore()
}
