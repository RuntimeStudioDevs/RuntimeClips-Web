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
      // Opcional: feedback adicional en estado
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

// Desplazamiento suave de la cámara cuando se abre el panel lateral
watch(
  () => store.isInspectorOpen,
  (isOpen) => {
    const drawerWidth = isOpen ? 380 : 0;
    renderer?.setInset(drawerWidth);
  }
);

// Sincronizar selección externa de agente (si se selecciona desde otro modal)
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
    <!-- Overlay de atajos rápidos -->
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

.office-hint {
  position: absolute;
  bottom: 16px;
  left: 20px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  background: rgba(15, 23, 42, 0.75);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 9999px;
  color: #94a3b8;
  font-size: 12px;
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
