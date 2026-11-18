<script setup>
/**
 * 应用入口壳层：组装 HUD + 游戏舞台
 * 具体玩法逻辑在 src/game/useGame.js
 */
import GameHud from './components/GameHud.vue'
import GameStage from './components/GameStage.vue'
import { useGame } from './game/useGame.js'

const {
  W,
  H,
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
} = useGame()
</script>

<template>
  <div class="page">
    <div class="frame">
      <GameHud
        :score="score"
        :wave="wave"
        :lives="lives"
        :weapon-name="weaponName"
        :weapon-time="weaponTime"
        :weapon-id="weaponId"
      />

      <GameStage
        :W="W"
        :H="H"
        :status="status"
        :score="score"
        :best="best"
        :pickup-tip="pickupTip"
        @ready="bindCanvas"
        @start="startGame"
        @toggle-pause="togglePause"
        @pointer-down="onStagePointerDown"
        @pointer-move="onStagePointerMove"
        @pointer-up="onStagePointerUp"
      />
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
</style>
