<script setup lang="ts">
import { onMounted } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import HabboViewport from '@/components/habbo/HabboViewport.vue';
import TreeGraphView from '@/components/graph/TreeGraphView.vue';
import HabboToolbar from '@/components/habbo/HabboToolbar.vue';
import HabboMessenger from '@/components/drawer/HabboMessenger.vue';
import ReelPlayerModal from '@/components/drawer/ReelPlayerModal.vue';
import BrandCatalogModal from '@/components/common/BrandCatalogModal.vue';

const store = usePipelineStore();

onMounted(() => {
  store.connectSSE();
  store.loadBrands();
});
</script>

<template>
  <div class="runtimeclips-app">
    <!-- Barra Superior Retro de Habbo -->
    <header class="habbo-topbar">
      <div class="brand-zone">
        <span class="hotel-icon">🏨</span>
        <h1 class="brand-title">Runtime<b>Clips</b> Hotel</h1>
        <span class="hotel-badge">Estudio Agéntico 3D</span>
      </div>

      <div class="status-zone">
        <div class="status-chip habbo-box" :data-status="store.pipeline.status">
          <span class="dot">●</span>
          <span>Pipeline: {{ store.pipeline.status.toUpperCase() }}</span>
        </div>

        <div class="status-chip habbo-box" :class="{ online: store.sseConnected }">
          <span class="dot">●</span>
          <span>SSE: {{ store.sseConnected ? 'EN LÍNEA' : 'OFFLINE' }}</span>
        </div>
      </div>
    </header>

    <!-- Área de Trabajo Principal (Habbo 3D o Grafo 2D) -->
    <main class="main-workspace">
      <!-- Vista 1: Habbo Hotel 3D -->
      <HabboViewport v-if="store.currentView === 'habbo'" />

      <!-- Vista 2: Grafo en Árbol Fork/Join 2D -->
      <TreeGraphView v-else />

      <!-- Modales flotantes estilo Habbo -->
      <HabboMessenger />
      <ReelPlayerModal />
      <BrandCatalogModal />
    </main>

    <!-- Barra Inferior de Navegación y Chat Habbo -->
    <HabboToolbar />
  </div>
</template>

<style scoped>
.runtimeclips-app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: var(--habbo-dark);
}

.habbo-topbar {
  height: 40px;
  background: var(--habbo-navy);
  border-bottom: 2px solid var(--habbo-bevel-dark);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 14px;
  z-index: 30;
  box-shadow: 0 2px 0 #000000;
}

.brand-zone {
  display: flex;
  align-items: center;
  gap: 8px;
}

.hotel-icon {
  font-size: 20px;
}

.brand-title {
  margin: 0;
  font-size: 14px;
  font-weight: normal;
  letter-spacing: 0.5px;
  color: #ffffff;
}

.brand-title b {
  color: var(--habbo-gold);
}

.hotel-badge {
  background: var(--habbo-blue-dark);
  color: #94a3b8;
  padding: 2px 6px;
  font-size: 9px;
  border: 1px solid var(--habbo-bevel-dark);
}

.status-zone {
  display: flex;
  gap: 8px;
}

.status-chip {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 2px 8px;
  font-size: 10px;
  color: #94a3b8;
}

.status-chip .dot {
  font-size: 8px;
}

.status-chip[data-status='running'] {
  color: #00f2fe;
}
.status-chip[data-status='completed'] {
  color: #2ecc71;
}
.status-chip[data-status='error'] {
  color: #e74c3c;
}

.status-chip.online {
  color: #2ecc71;
}

.main-workspace {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}
</style>
