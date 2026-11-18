<script setup>
import { onMounted, ref } from 'vue'
import LevelSelect from './LevelSelect.vue'

/**
 * 游戏舞台：画布、触控、菜单/关卡/通关遮罩
 */
defineProps({
  W: { type: Number, required: true },
  H: { type: Number, required: true },
  status: { type: String, required: true },
  score: { type: Number, required: true },
  best: { type: Number, required: true },
  level: { type: Number, required: true },
  levelName: { type: String, required: true },
  levels: { type: Array, required: true },
  unlocked: { type: Number, required: true },
  pickupTip: { type: String, default: '' },
})

const emit = defineEmits([
  'start',
  'start-level',
  'retry',
  'next',
  'menu',
  'toggle-pause',
  'pointer-down',
  'pointer-move',
  'pointer-up',
  'ready',
])

const canvasEl = ref(null)

onMounted(() => {
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

    <!-- 主菜单 + 选关 -->
    <div v-if="status === 'menu'" class="overlay menu">
      <p class="brand">星际射击</p>
      <p class="tag">共 10 关，击杀达标即可通关；敌人越往后越快</p>
      <button class="btn" @click="emit('start')">继续挑战</button>
      <LevelSelect :levels="levels" :unlocked="unlocked" @pick="emit('start-level', $event)" />
      <p class="hint">电脑：WASD 移动 · 空格射击 · 手机拖动自动开火</p>
      <p class="hint">道具：散=散弹 · 速=速射 · 重=重型双炮</p>
      <p v-if="best" class="best">最高分 {{ best }}</p>
    </div>

    <div v-else-if="status === 'paused'" class="overlay dim">
      <p class="title">已暂停</p>
      <button class="btn" @click="emit('toggle-pause')">继续</button>
      <button class="btn ghost" @click="emit('menu')">返回选关</button>
    </div>

    <div v-else-if="status === 'clear'" class="overlay">
      <p class="title">第 {{ level }} 关通过</p>
      <p class="tag">{{ levelName }}</p>
      <p class="scoreline">当前总分 <strong>{{ score }}</strong></p>
      <button class="btn" @click="emit('next')">下一关</button>
      <button class="btn ghost" @click="emit('menu')">返回选关</button>
    </div>

    <div v-else-if="status === 'win'" class="overlay">
      <p class="title">全部通关！</p>
      <p class="tag">你征服了全部 10 个关卡</p>
      <p class="scoreline">最终得分 <strong>{{ score }}</strong></p>
      <p class="best">最高分 {{ best }}</p>
      <button class="btn" @click="emit('menu')">返回选关</button>
    </div>

    <div v-else-if="status === 'over'" class="overlay">
      <p class="title">挑战失败</p>
      <p class="tag">倒在第 {{ level }} 关 · {{ levelName }}</p>
      <p class="scoreline">本局得分 <strong>{{ score }}</strong></p>
      <button class="btn" @click="emit('retry')">重试本关</button>
      <button class="btn ghost" @click="emit('menu')">返回选关</button>
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
  padding: 20px 16px;
  text-align: center;
  background: rgba(6, 10, 18, 0.72);
  backdrop-filter: blur(3px);
  z-index: 4;
}

.overlay.menu {
  justify-content: flex-start;
  padding-top: 28px;
  overflow: auto;
}

.overlay.dim {
  background: rgba(6, 10, 18, 0.55);
}

.brand {
  font-size: clamp(28px, 9vw, 40px);
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
  font-size: 30px;
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
  margin-top: 2px;
  padding: 11px 26px;
  border-radius: 999px;
  background: linear-gradient(180deg, #5ad4ff, #1f8fb8);
  color: #041018;
  font-weight: 700;
  letter-spacing: 0.06em;
  box-shadow: 0 8px 24px rgba(40, 160, 210, 0.35);
  -webkit-tap-highlight-color: transparent;
}

.btn.ghost {
  background: transparent;
  color: rgba(210, 230, 245, 0.85);
  border: 1px solid rgba(150, 200, 230, 0.3);
  box-shadow: none;
}

.btn:active {
  transform: translateY(1px);
}
</style>
