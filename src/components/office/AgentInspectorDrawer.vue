<script setup lang="ts">
import { computed } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import { STATUS_COLORS } from '@/engine/office2d/renderer';

const store = usePipelineStore();

const node = computed(() => store.selectedNode);
const isOpen = computed(() => store.isInspectorOpen && !!node.value);

const statusColor = computed(() => {
  if (!node.value) return '#94a3b8';
  return STATUS_COLORS[node.value.status] || '#94a3b8';
});

const statusLabel = computed(() => {
  if (!node.value) return 'Inactivo';
  switch (node.value.status) {
    case 'running':
      return 'Procesando...';
    case 'completed':
      return 'Completado';
    case 'error':
      return 'Error Crítico';
    default:
      return 'En Espera';
  }
});

function closeDrawer() {
  store.selectNode(null);
}

function openPlayer() {
  if (store.pipeline.output?.clips?.length) {
    store.openClipPlayer(store.pipeline.output.clips[0]);
  }
}

function openGraph() {
  store.currentView = 'graph';
}
</script>

<template>
  <aside class="inspector-drawer" :class="{ 'is-open': isOpen }">
    <div v-if="node" class="drawer-content">
      <!-- Encabezado del Agente -->
      <div class="drawer-header">
        <div class="agent-avatar-box">
          <span class="agent-icon">{{ node.icon }}</span>
          <span class="status-indicator" :style="{ backgroundColor: statusColor }"></span>
        </div>

        <div class="agent-meta">
          <h2 class="agent-title">{{ node.label }}</h2>
          <p class="agent-subtitle">{{ node.subtitle }}</p>
          <div class="status-pill" :style="{ borderColor: statusColor, color: statusColor }">
            {{ statusLabel }}
          </div>
        </div>

        <button class="close-btn" @click="closeDrawer" title="Cerrar panel">✕</button>
      </div>

      <!-- Barra de Progreso -->
      <div class="progress-section">
        <div class="progress-info">
          <span>Avance de la tarea</span>
          <span class="progress-percent">{{ Math.round(node.progress * 100) }}%</span>
        </div>
        <div class="progress-bar-track">
          <div
            class="progress-bar-fill"
            :style="{ width: `${Math.round(node.progress * 100)}%`, backgroundColor: statusColor }"
          ></div>
        </div>
      </div>

      <!-- Consola de Terminal / Logs en Tiempo Real -->
      <div class="terminal-section">
        <div class="terminal-header">
          <span class="terminal-title">Terminal de Actividad en Vivo</span>
          <span class="terminal-badge">stdout</span>
        </div>
        <div class="terminal-body">
          <div v-if="!node.logs || !node.logs.length" class="empty-logs">
            No hay registros disponibles para este agente.
          </div>
          <div
            v-for="(line, idx) in node.logs"
            :key="idx"
            class="log-line"
            :class="{ 'is-err': line.includes('❌') || line.includes('Error') }"
          >
            {{ line }}
          </div>
        </div>
      </div>

      <!-- Acciones Rápidas -->
      <div class="drawer-actions">
        <button
          v-if="store.pipeline.output?.clips?.length"
          class="action-btn primary"
          @click="openPlayer"
        >
          🎬 Ver Clips Verticales ({{ store.pipeline.output.clips.length }})
        </button>

        <button class="action-btn secondary" @click="openGraph">
          📊 Ver Grafo del Pipeline
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.inspector-drawer {
  position: absolute;
  top: 0;
  right: 0;
  width: 380px;
  height: 100%;
  background: rgba(15, 23, 42, 0.95);
  backdrop-filter: blur(16px);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: -8px 0 32px rgba(0, 0, 0, 0.5);
  transform: translateX(100%);
  transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 50;
  display: flex;
  flex-direction: column;
}

.inspector-drawer.is-open {
  transform: translateX(0);
}

.drawer-content {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 24px;
  box-sizing: border-box;
  gap: 20px;
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  position: relative;
}

.agent-avatar-box {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: rgba(30, 41, 59, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.agent-icon {
  font-size: 26px;
}

.status-indicator {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #0f172a;
}

.agent-meta {
  flex: 1;
}

.agent-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #f8fafc;
}

.agent-subtitle {
  margin: 2px 0 8px 0;
  font-size: 12px;
  color: #94a3b8;
}

.status-pill {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid currentColor;
  font-size: 11px;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.04);
}

.close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.close-btn:hover {
  color: #f8fafc;
  background: rgba(255, 255, 255, 0.1);
}

.progress-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #94a3b8;
}

.progress-percent {
  font-weight: 700;
  color: #f8fafc;
}

.progress-bar-track {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.terminal-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #020617;
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  overflow: hidden;
}

.terminal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: rgba(30, 41, 59, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

.terminal-title {
  font-size: 11px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.terminal-badge {
  font-size: 10px;
  color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
  padding: 1px 6px;
  border-radius: 4px;
}

.terminal-body {
  flex: 1;
  padding: 12px;
  overflow-y: auto;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 11px;
  line-height: 1.6;
  color: #cbd5e1;
}

.log-line {
  margin-bottom: 4px;
  word-break: break-word;
}

.log-line.is-err {
  color: #f87171;
}

.empty-logs {
  color: #64748b;
  font-style: italic;
}

.drawer-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  border: none;
}

.action-btn.primary {
  background: linear-gradient(135deg, #0284c7, #38bdf8);
  color: #ffffff;
  box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
}

.action-btn.primary:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.action-btn.secondary {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
}

.action-btn.secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}
</style>
