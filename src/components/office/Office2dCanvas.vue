<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import { Office2dRenderer } from '@/engine/office2d/renderer';

const store = usePipelineStore();
const canvasContainer = ref<HTMLDivElement | null>(null);
let renderer: Office2dRenderer | null = null;
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  if (!canvasContainer.value) return;

  renderer = new Office2dRenderer(canvasContainer.value, {
    isDark: true,
    onSelectAgent: (key) => {
      store.selectNode(key);
    },
    onHoverAgent: () => {
      // Feedback visual opcional
    },
  });

  // Enviar estado inicial de los 9 agentes
  renderer.updateSessions(store.agentSessions);

  // Escuchar redimensionamiento del contenedor
  resizeObserver = new ResizeObserver(() => {
    renderer?.resize();
  });
  resizeObserver.observe(canvasContainer.value);
});

// Reactividad: actualizar personajes y tareas cuando cambie el store
watch(
  () => store.agentSessions,
  (sessions) => {
    renderer?.updateSessions(sessions);
  },
  { deep: true }
);

// Desplazamiento suave de la cámara cuando se abre el panel lateral (inset)
watch(
  () => store.isInspectorOpen,
  (isOpen) => {
    const drawerWidth = isOpen ? 380 : 0;
    renderer?.setInset(drawerWidth);
  }
);

// Sincronizar selección externa de agente
watch(
  () => store.selectedNodeKey,
  (key) => {
    if (renderer) {
      renderer.selectedKey = key;
    }
  }
);

onUnmounted(() => {
  resizeObserver?.disconnect();
  renderer?.destroy();
  renderer = null;
});
</script>

<template>
  <div class="office-viewport" ref="canvasContainer">
    <!-- Leyenda de Estados en la esquina inferior izquierda -->
    <div class="status-legend">
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #8b6be6"></span>
        <span>Pensando</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #3b8ee0"></span>
        <span>Ejecutando</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #22a874"></span>
        <span>Escribiendo</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #e09412"></span>
        <span>Esperándote</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #5f9a4c"></span>
        <span>Listo</span>
      </div>
      <div class="legend-item">
        <span class="legend-dot" style="background-color: #de4b40"></span>
        <span>Error</span>
      </div>
    </div>

    <!-- Píldora de ayuda interactiva -->
    <div class="office-hint">
      <span class="hint-dot"></span>
      Haz clic en cualquier agente para ver sus logs y decisiones en vivo
    </div>
  </div>
</template>

<style scoped>
.office-viewport {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #0b0f19;
}

.status-legend {
  position: absolute;
  bottom: 18px;
  left: 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 16px;
  background: rgba(15, 23, 42, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  z-index: 10;
  pointer-events: none;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: #94a3b8;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}

.office-hint {
  position: absolute;
  top: 16px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 9999px;
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 500;
  pointer-events: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.hint-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background-color: #38bdf8;
  box-shadow: 0 0 8px #38bdf8;
}
</style>
