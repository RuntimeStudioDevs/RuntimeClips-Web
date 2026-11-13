<script setup lang="ts">
import { usePipelineStore } from '@/stores/pipeline';
import OfficeTopBar from '@/components/office/OfficeTopBar.vue';
import Office2dCanvas from '@/components/office/Office2dCanvas.vue';
import AgentInspectorDrawer from '@/components/office/AgentInspectorDrawer.vue';
import TreeGraphView from '@/components/graph/TreeGraphView.vue';
import ReelPlayerModal from '@/components/drawer/ReelPlayerModal.vue';

const store = usePipelineStore();
</script>

<template>
  <div class="runtimeclips-app">
    <!-- Barra Superior de Controles y Estado -->
    <OfficeTopBar />

    <!-- Área de Trabajo Principal -->
    <main class="main-workspace">
      <!-- Vista 1: Oficina Agéntica Isométrica 2D -->
      <Office2dCanvas v-if="store.currentView === 'office'" />

      <!-- Vista 2: Grafo en Árbol Fork/Join 2D -->
      <TreeGraphView v-else />

      <!-- Panel Inspector Lateral Derecho -->
      <AgentInspectorDrawer />

      <!-- Modal de Previsualización y Descarga de Reels -->
      <ReelPlayerModal />
    </main>
  </div>
</template>

<style scoped>
.runtimeclips-app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background-color: #0b0f19;
}

.main-workspace {
  position: relative;
  flex: 1;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
}
</style>
