<script setup>
/**
 * 关卡选择：显示 10 关，未解锁的不可点
 */
defineProps({
  levels: { type: Array, required: true },
  unlocked: { type: Number, required: true },
})

defineEmits(['pick'])
</script>

<template>
  <div class="levels">
    <button
      v-for="lv in levels"
      :key="lv.id"
      class="lv"
      type="button"
      :disabled="lv.id > unlocked"
      :class="{ locked: lv.id > unlocked, current: lv.id === unlocked }"
      @click="$emit('pick', lv.id)"
    >
      <span class="num">{{ lv.id }}</span>
      <span class="name">{{ lv.id > unlocked ? '未解锁' : lv.name }}</span>
    </button>
  </div>
</template>

<style scoped>
.levels {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  width: min(100%, 320px);
  max-height: 220px;
  overflow: auto;
  padding: 2px;
  margin-top: 4px;
}

.lv {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(18, 36, 52, 0.75);
  border: 1px solid rgba(130, 190, 230, 0.22);
  color: #e8f6ff;
  text-align: left;
  -webkit-tap-highlight-color: transparent;
}

.lv.current {
  border-color: rgba(90, 212, 255, 0.65);
  box-shadow: 0 0 0 1px rgba(90, 212, 255, 0.2);
}

.lv.locked {
  opacity: 0.45;
  cursor: not-allowed;
}

.lv:not(.locked):active {
  transform: scale(0.98);
}

.num {
  font-size: 12px;
  color: rgba(160, 200, 230, 0.7);
}

.name {
  font-size: 13px;
  font-weight: 700;
}
</style>
