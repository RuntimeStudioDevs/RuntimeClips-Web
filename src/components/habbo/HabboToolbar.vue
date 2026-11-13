<script setup lang="ts">
import { ref } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import { HabboMockSimulator } from '@/stores/mock';
import {
  Building2,
  GitFork,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Film,
  Volume2,
  VolumeX,
  Play,
  Loader2,
} from 'lucide-vue-next';

const store = usePipelineStore();
const inputUrl = ref('');
const mockSim = new HabboMockSimulator();
const isSubmitting = ref(false);

async function handleStart() {
  const url = inputUrl.value.trim();
  if (!url) return;

  isSubmitting.value = true;
  try {
    await store.startPipeline(url, { clipLimit: 'all', workers: 2 });
    inputUrl.value = '';
  } catch (err: any) {
    alert(err.message || 'No se pudo contactar al servidor del backend.');
  } finally {
    isSubmitting.value = false;
  }
}

function handleMock() {
  if (mockSim.isRunning) {
    mockSim.stop();
  } else {
    mockSim.run();
  }
}
</script>

<template>
  <footer class="habbo-bottom-toolbar">
    <!-- 1. Info de la Sala Habbo -->
    <div class="room-info habbo-box">
      <span class="room-icon">🏨</span>
      <div class="room-texts">
        <span class="room-title">RuntimeClips Studio</span>
        <span class="room-owner">Sala Pública · 10 Agentes</span>
      </div>
    </div>

    <!-- 2. Barra de Chat y Lanzador de Video -->
    <form class="habbo-chat-bar" @submit.prevent="handleStart">
      <input
        v-model="inputUrl"
        type="text"
        placeholder="Pega URL de YouTube o escribe orden a los agentes..."
        spellcheck="false"
        class="habbo-chat-input"
        :disabled="store.pipeline.status === 'running' || isSubmitting"
      />
      <button
        type="submit"
        class="habbo-btn habbo-btn-gold"
        :disabled="store.pipeline.status === 'running' || isSubmitting || !inputUrl.trim()"
      >
        <Loader2 v-if="isSubmitting" class="spin" :size="14" />
        <Play v-else :size="14" />
        <span>Procesar</span>
      </button>
    </form>

    <!-- 3. Botones de Acción Clásicos de Habbo -->
    <div class="habbo-action-buttons">
      <!-- Selector de Vista: Habbo 3D vs Grafo n8n -->
      <button
        type="button"
        class="habbo-btn"
        :class="{ active: store.currentView === 'habbo' }"
        title="Cambiar a Sala Habbo 3D"
        @click="store.currentView = store.currentView === 'habbo' ? 'graph' : 'habbo'"
      >
        <Building2 v-if="store.currentView === 'graph'" :size="16" />
        <GitFork v-else :size="16" />
        <span>{{ store.currentView === 'habbo' ? 'Ver Grafo' : 'Ver Habbo' }}</span>
      </button>

      <!-- Botón Consola / Messenger -->
      <button
        type="button"
        class="habbo-btn"
        :class="{ active: store.isMessengerOpen }"
        title="Abrir Consola y Logs de Agentes"
        @click="store.isMessengerOpen = !store.isMessengerOpen"
      >
        <MessageSquare :size="16" />
        <span>Consola</span>
      </button>

      <!-- Botón Catálogo de Brand Kits -->
      <button
        type="button"
        class="habbo-btn"
        :class="{ active: store.isCatalogOpen }"
        title="Abrir Catálogo de Brand Kits"
        @click="store.isCatalogOpen = !store.isCatalogOpen"
      >
        <ShoppingBag :size="16" />
        <span>Catálogo</span>
      </button>

      <!-- Botón Cine y Reproductor -->
      <button
        type="button"
        class="habbo-btn"
        :class="{ active: store.isPlayerOpen }"
        title="Ver Reels Generados y Descargas"
        @click="store.isPlayerOpen = !store.isPlayerOpen"
      >
        <Film :size="16" />
        <span>Cine</span>
      </button>

      <!-- Botón Simular Mock -->
      <button
        type="button"
        class="habbo-btn habbo-btn-gold"
        title="Simular flujo completo en 8 segundos"
        @click="handleMock"
      >
        <Sparkles :size="16" />
        <span>{{ mockSim.isRunning ? 'Detener' : 'Simular' }}</span>
      </button>

      <!-- Botón Silenciar / Sonido -->
      <button
        type="button"
        class="habbo-btn"
        title="Silenciar / Activar audio retro"
        @click="store.toggleSound"
      >
        <VolumeX v-if="store.isMuted" :size="16" />
        <Volume2 v-else :size="16" />
      </button>
    </div>
  </footer>
</template>

<style scoped>
.habbo-bottom-toolbar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 52px;
  background: var(--habbo-navy);
  border-top: 2px solid var(--habbo-bevel-light);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 12px;
  gap: 12px;
  z-index: 40;
  box-shadow: 0 -2px 0 #000000;
}

.room-info {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 10px;
  background: var(--habbo-blue-dark);
  flex-shrink: 0;
}

.room-icon {
  font-size: 18px;
}

.room-texts {
  display: flex;
  flex-direction: column;
}

.room-title {
  font-size: 11px;
  font-weight: bold;
  color: var(--habbo-gold);
}

.room-owner {
  font-size: 9px;
  color: #94a3b8;
}

.habbo-chat-bar {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  max-width: 650px;
}

.habbo-chat-input {
  flex: 1;
  background: #ffffff;
  color: #000000;
  border: 2px solid #000000;
  border-radius: 4px;
  padding: 6px 12px;
  font-family: var(--font-pixel);
  font-size: 12px;
  outline: none;
  box-shadow: inset 1px 1px 2px rgba(0, 0, 0, 0.4);
}

.habbo-chat-input:focus {
  border-color: var(--habbo-gold);
}

.habbo-action-buttons {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.habbo-btn.active {
  background: #2563eb;
  border-top-color: #60a5fa;
  border-left-color: #60a5fa;
  border-right-color: #1e3a8a;
  border-bottom-color: #1e3a8a;
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>
