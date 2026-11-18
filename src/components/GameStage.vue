<script setup>
import { onMounted, ref } from 'vue'

/**
 * 游戏舞台：画布、触控、菜单/暂停/结束遮罩
 */
defineProps({
  W: { type: Number, required: true },
  H: { type: Number, required: true },
  status: { type: String, required: true },
  score: { type: Number, required: true },
  best: { type: Number, required: true },
  pickupTip: { type: String, default: '' },
})

const emit = defineEmits([
  'start',
  'toggle-pause',
  'pointer-down',
  'pointer-move',
  'pointer-up',
  'ready',
])

const canvasEl = ref(null)

onMounted(() => {
  // 把画布节点交给父级，用于绑定 2D 上下文
  emit('ready', canvasEl.value)
})
</script>

<template>
  <div
    class="stage"
    @pointerdown="emit('pointer-down', $event)"
    @pointermove="emit('pointer-move', $event)"
    @pointerup="emit('pointer-up', $event)"
    @pointercancel="emit('pointer-up', $event)"
  >
    <canvas ref="canvasEl" :width="W" :height="H"></canvas>

    <p v-if="pickupTip && status === 'playing'" class="tip">{{ pickupTip }}</p>

    <button
      v-if="status === 'playing'"
      class="pause-btn"
      type="button"
      @click.stop="emit('toggle-pause')"
      @pointerdown.stop
    >
      暂停
    </button>

    <div v-if="status === 'menu'" class="overlay">
      <p class="brand">星际射击</p>
      <p class="tag">敌人会越来越快，记得捡道具强化武器</p>
      <button class="btn" @click="emit('start')">开始游戏</button>
      <p class="hint">电脑：WASD / 方向键移动 · 空格射击</p>
      <p class="hint">手机：拖动飞行 · 自动开火</p>
      <p class="hint">道具：散=散弹 · 速=速射 · 重=重型双炮</p>
      <p v-if="best" class="best">最高分 {{ best }}</p>
    </div>

    <div v-else-if="status === 'paused'" class="overlay dim">
      <p class="title">已暂停</p>
      <button class="btn" @click="emit('toggle-pause')">继续</button>
    </div>

    <div v-else-if="status === 'over'" class="overlay">
      <p class="title">游戏结束</p>
      <p class="scoreline">本局得分 <strong>{{ score }}</strong></p>
      <p class="best">最高分 {{ best }}</p>
      <button class="btn" @click="emit('start')">再来一局</button>
    </div>
  </div>
</template>

<style scoped>
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

.tip {
  position: absolute;
  top: 48px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  padding: 6px 14px;
  border-radius: 999px;
  background: rgba(8, 18, 28, 0.7);
  border: 1px solid rgba(255, 209, 102, 0.45);
  color: #ffe29a;
  font-size: 13px;
  white-space: nowrap;
  pointer-events: none;
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
  max-width: 300px;
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
</style>
