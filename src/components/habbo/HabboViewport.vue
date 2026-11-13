<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { HabboCanvasEngine } from '@/engine/habboEngine';
import { usePipelineStore } from '@/stores/pipeline';
import HabboBubble from './HabboBubble.vue';

const store = usePipelineStore();
const viewportEl = ref<HTMLElement | null>(null);
let engine: HabboCanvasEngine | null = null;

onMounted(() => {
  if (viewportEl.value) {
    engine = new HabboCanvasEngine(viewportEl.value);
  }
});

onUnmounted(() => {
  if (engine) {
    engine.dispose();
    engine = null;
  }
});

// Escuchar cambios de vista para recalcular tamaño
watch(
  () => store.currentView,
  (val) => {
    if (val === 'habbo' && engine) {
      setTimeout(() => engine?.resize(), 50);
    }
  }
);
</script>

<template>
  <div class="habbo-viewport-wrapper">
    <div ref="viewportEl" class="habbo-canvas-container"></div>

    <!-- Contenedor de burbujas de diálogo flotantes -->
    <div class="speech-bubbles-layer">
      <HabboBubble
        v-for="bubble in store.speechBubbles"
        :key="bubble.id"
        :bubble="bubble"
      />
    </div>
  </div>
</template>

<style scoped>
.habbo-viewport-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--habbo-dark);
}

.habbo-canvas-container {
  width: 100%;
  height: 100%;
}

.speech-bubbles-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}
</style>
