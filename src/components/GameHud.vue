<script setup>
/**
 * 顶部 HUD：得分、关卡进度、生命、当前武器
 */
defineProps({
  score: { type: Number, required: true },
  level: { type: Number, required: true },
  levelName: { type: String, required: true },
  kills: { type: Number, required: true },
  killTarget: { type: Number, required: true },
  lives: { type: Number, required: true },
  weaponName: { type: String, required: true },
  weaponTime: { type: Number, required: true },
  weaponId: { type: String, required: true },
})
</script>

<template>
  <header class="hud">
    <div class="stat">
      <span class="label">得分</span>
      <strong>{{ score }}</strong>
    </div>
    <div class="stat center">
      <span class="label">关卡 {{ level }}/10</span>
      <strong class="level-name">{{ levelName }}</strong>
    </div>
    <div class="stat right">
      <span class="label">生命</span>
      <strong class="hearts">{{ '♥'.repeat(Math.max(0, lives)) }}</strong>
    </div>

    <div class="progress">
      <span class="label">击杀进度</span>
      <div class="bar">
        <i :style="{ width: `${Math.min(100, (kills / killTarget) * 100)}%` }"></i>
      </div>
      <strong>{{ Math.min(kills, killTarget) }}/{{ killTarget }}</strong>
    </div>

    <div class="weapon" :class="{ boosted: weaponId !== 'normal' }">
      <span class="label">武器</span>
      <strong>
        {{ weaponName }}
        <template v-if="weaponId !== 'normal'"> · {{ Math.ceil(weaponTime) }}s</template>
      </strong>
    </div>
  </header>
</template>

<style scoped>
.hud {
  display: grid;
  grid-template-columns: 1fr 1.4fr 1fr;
  gap: 6px 8px;
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
  text-align: center;
}

.stat.right {
  align-items: flex-end;
}

.level-name {
  font-size: 15px !important;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;
}

.progress,
.weapon {
  grid-column: 1 / -1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(20, 40, 55, 0.45);
  border: 1px solid rgba(140, 190, 220, 0.18);
}

.progress strong {
  font-size: 13px;
  color: #dff6ff;
  font-variant-numeric: tabular-nums;
  min-width: 48px;
  text-align: right;
}

.bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.bar i {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #2bb8e8, #7ee8ff);
  border-radius: inherit;
  transition: width 0.15s ease;
}

.weapon.boosted {
  border-color: rgba(255, 209, 102, 0.45);
  background: rgba(60, 45, 20, 0.35);
}

.weapon {
  justify-content: space-between;
}

.weapon strong {
  font-size: 14px;
  color: #dff6ff;
}

.weapon.boosted strong {
  color: #ffe29a;
}

.label {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: rgba(180, 210, 230, 0.55);
  white-space: nowrap;
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
</style>
