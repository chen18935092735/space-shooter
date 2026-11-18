<script setup>
/**
 * 顶部 HUD：得分、波次、生命、当前武器
 */
defineProps({
  score: { type: Number, required: true },
  wave: { type: Number, required: true },
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
      <span class="label">波次</span>
      <strong>{{ wave }}</strong>
    </div>
    <div class="stat right">
      <span class="label">生命</span>
      <strong class="hearts">{{ '♥'.repeat(Math.max(0, lives)) }}</strong>
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
  grid-template-columns: 1fr 1fr 1fr;
  grid-template-rows: auto auto;
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
}

.stat.right {
  align-items: flex-end;
}

.weapon {
  grid-column: 1 / -1;
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 10px;
  background: rgba(20, 40, 55, 0.45);
  border: 1px solid rgba(140, 190, 220, 0.18);
}

.weapon.boosted {
  border-color: rgba(255, 209, 102, 0.45);
  background: rgba(60, 45, 20, 0.35);
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
</style>
