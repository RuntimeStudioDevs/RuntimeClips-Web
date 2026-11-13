<script setup lang="ts">
import { computed } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import { mockSimulator } from '@/stores/mock';

const store = usePipelineStore();

const isRunning = computed(() => store.pipeline.status === 'running');
const hasClips = computed(() => (store.pipeline.output?.clips?.length || 0) > 0);

function toggleRun() {
  if (isRunning.value) {
    mockSimulator.stop();
    store.pipeline.status = 'idle';
  } else {
    mockSimulator.run();
  }
}

function handleReset() {
  mockSimulator.stop();
  store.initDefaultNodes();
  store.pipeline.status = 'idle';
  store.pipeline.output = null;
  store.addLog(null, 'Estado del pipeline reiniciado.', 'info');
}

function handleInjectError() {
  mockSimulator.injectError('render');
}

function toggleBackendMode() {
  store.isBackendMode = !store.isBackendMode;
  if (store.isBackendMode) {
    mockSimulator.stop();
    store.addLog(null, 'Conectando al backend de tu compañero (http://localhost:3000)...', 'info');
  } else {
    store.addLog(null, 'Cambiado a Modo Simulación Local.', 'info');
  }
}

function openPlayer() {
  if (store.pipeline.output?.clips?.length) {
    store.openClipPlayer(store.pipeline.output.clips[0]);
  }
}

function toggleGraph() {
  store.currentView = store.currentView === 'office' ? 'graph' : 'office';
}
</script>

<template>
  <header class="topbar">
    <!-- Logotipo y Nombre -->
    <div class="brand-group">
      <div class="brand-logo">
        <span class="logo-icon">⚡</span>
      </div>
      <div>
        <div class="brand-title">RuntimeClips Studio</div>
        <div class="brand-badge">Oficina Agéntica 2D</div>
      </div>
    </div>

    <!-- Controles del Pipeline -->
    <div class="pipeline-controls">
      <button
        class="control-btn"
        :class="{ 'is-running': isRunning, 'is-idle': !isRunning }"
        @click="toggleRun"
      >
        <span class="btn-icon">{{ isRunning ? '⏸' : '▶' }}</span>
        <span>{{ isRunning ? 'Pausar' : 'Iniciar Pipeline' }}</span>
      </button>

      <button class="control-btn secondary" @click="handleReset" title="Reiniciar todos los nodos">
        <span class="btn-icon">↺</span>
        <span>Reiniciar</span>
      </button>

      <button
        v-if="isRunning"
        class="control-btn danger"
        @click="handleInjectError"
        title="Simular fallo en un nodo"
      >
        <span>⚠️ Simular Error</span>
      </button>
    </div>

    <!-- Selector de Modo y Acciones de Visualización -->
    <div class="right-actions">
      <!-- Toggle Modo Dual -->
      <button
        class="mode-toggle-btn"
        :class="{ 'is-backend': store.isBackendMode }"
        @click="toggleBackendMode"
        title="Alternar entre simulación local y backend real"
      >
        <span class="mode-dot"></span>
        <span>{{ store.isBackendMode ? 'Backend en Vivo' : 'Simulación Local' }}</span>
      </button>

      <!-- Botón Reproductor de Clips -->
      <button
        class="nav-btn"
        :class="{ 'has-content': hasClips }"
        @click="openPlayer"
        :disabled="!hasClips"
        title="Ver clips verticales generados"
      >
        <span>🎬</span>
        <span>Clips ({{ store.pipeline.output?.clips?.length || 0 }})</span>
      </button>

      <!-- Botón Grafo DAG -->
      <button
        class="nav-btn"
        :class="{ active: store.currentView === 'graph' }"
        @click="toggleGraph"
        title="Alternar vista de grafo de dependencias"
      >
        <span>📊</span>
        <span>{{ store.currentView === 'graph' ? 'Ver Oficina 2D' : 'Ver Grafo' }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 24px;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
  z-index: 40;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-logo {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 10px rgba(2, 132, 199, 0.4);
}

.logo-icon {
  font-size: 20px;
}

.brand-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.01em;
}

.brand-badge {
  font-size: 11px;
  color: #38bdf8;
  font-weight: 600;
}

.pipeline-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.control-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.15s ease;
}

.control-btn.is-idle {
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
}

.control-btn.is-running {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #ffffff;
  box-shadow: 0 2px 10px rgba(245, 158, 11, 0.3);
}

.control-btn.secondary {
  background: rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.control-btn.danger {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.control-btn:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.btn-icon {
  font-size: 12px;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.mode-toggle-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.mode-toggle-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.mode-toggle-btn.is-backend {
  border-color: #10b981;
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
}

.mode-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #38bdf8;
  box-shadow: 0 0 6px #38bdf8;
}

.mode-toggle-btn.is-backend .mode-dot {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.nav-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #cbd5e1;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.nav-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.1);
  color: #f8fafc;
}

.nav-btn.has-content {
  background: rgba(2, 132, 199, 0.2);
  border-color: #0284c7;
  color: #38bdf8;
}

.nav-btn.active {
  background: rgba(56, 189, 248, 0.2);
  border-color: #38bdf8;
  color: #ffffff;
}

.nav-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
