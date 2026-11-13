<script setup lang="ts">
import { ref } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';

const store = usePipelineStore();
const activeTab = ref<'telemetry' | 'logs'>('telemetry');

function formatTime(ts: number | null): string {
  if (!ts) return '—';
  const d = new Date(ts);
  return `${d.toLocaleTimeString('es', { hour12: false })}.${String(d.getMilliseconds()).padStart(3, '0')}`;
}

function formatDuration(ms: number | null): string {
  if (!ms) return '—';
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}
</script>

<template>
  <div v-if="store.isMessengerOpen" class="habbo-messenger-window habbo-window">
    <!-- Cabecera retro de Habbo Messenger -->
    <div class="habbo-window-header">
      <span>💬 Habbo Messenger — Consola de Agentes</span>
      <button
        type="button"
        class="habbo-close-btn"
        title="Cerrar Consola"
        @click="store.isMessengerOpen = false"
      >
        ✕
      </button>
    </div>

    <!-- Pestañas de la consola -->
    <div class="messenger-tabs">
      <button
        type="button"
        class="messenger-tab-btn"
        :class="{ active: activeTab === 'telemetry' }"
        @click="activeTab = 'telemetry'"
      >
        Nodo Seleccionado
      </button>
      <button
        type="button"
        class="messenger-tab-btn"
        :class="{ active: activeTab === 'logs' }"
        @click="activeTab = 'logs'"
      >
        Logs en Vivo ({{ store.logs.length }})
      </button>
    </div>

    <!-- Cuerpo del Messenger -->
    <div class="messenger-body habbo-box-inset">
      <!-- Pestaña 1: Telemetría del Nodo Seleccionado -->
      <div v-if="activeTab === 'telemetry'" class="telemetry-view">
        <div v-if="store.selectedNode" class="node-details">
          <div class="details-header">
            <span class="details-icon">{{ store.selectedNode.icon }}</span>
            <div>
              <h3 class="details-title">{{ store.selectedNode.label }}</h3>
              <p class="details-sub">{{ store.selectedNode.subtitle }}</p>
            </div>
            <span class="status-pill" :data-status="store.selectedNode.status">
              {{ store.selectedNode.status.toUpperCase() }}
            </span>
          </div>

          <div class="metrics-grid">
            <div class="metric-item">
              <span class="metric-label">Progreso:</span>
              <span class="metric-val">{{ Math.round((store.selectedNode.progress || 0) * 100) }}%</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Inicio:</span>
              <span class="metric-val">{{ formatTime(store.selectedNode.startedAt) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Fin:</span>
              <span class="metric-val">{{ formatTime(store.selectedNode.finishedAt) }}</span>
            </div>
            <div class="metric-item">
              <span class="metric-label">Duración:</span>
              <span class="metric-val">{{ formatDuration(store.selectedNode.durationMs) }}</span>
            </div>
          </div>

          <!-- Si tiene clips detectados (Viral / Hook) -->
          <div v-if="store.selectedNode.data?.clips?.length" class="clips-detected-box">
            <h4 class="clips-title">🔥 Ganchos Detectados para Ramas</h4>
            <div class="clips-list">
              <div
                v-for="(clip, idx) in store.selectedNode.data.clips"
                :key="clip.id || idx"
                class="clip-card habbo-box"
              >
                <div class="clip-top">
                  <span>Rama #{{ idx + 1 }}</span>
                  <span class="clip-score">{{ clip.scorePercent || 90 }}% viral</span>
                </div>
                <div class="clip-name">{{ clip.title }}</div>
                <div class="clip-duration">⏱ {{ clip.durationSec?.toFixed(1) }}s</div>
              </div>
            </div>
          </div>

          <!-- Error si falló -->
          <div v-if="store.selectedNode.error" class="node-error-box">
            <h4>Error en la etapa:</h4>
            <pre>{{ store.selectedNode.error }}</pre>
          </div>
        </div>

        <div v-else class="empty-state">
          <p>Haz clic en cualquier escritorio o agente en la sala para inspeccionar su telemetría.</p>
        </div>
      </div>

      <!-- Pestaña 2: Logs en Vivo -->
      <div v-else class="logs-view">
        <div v-if="store.logs.length" class="logs-scroll">
          <div
            v-for="log in store.logs"
            :key="log.id"
            class="log-row"
            :class="`level-${log.level}`"
          >
            <span class="log-time">{{ formatTime(log.ts) }}</span>
            <span class="log-node">[{{ log.node || 'hotel' }}]</span>
            <span class="log-msg">{{ log.message }}</span>
          </div>
        </div>
        <div v-else class="empty-state">
          <p>No hay mensajes en la consola todavía.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.habbo-messenger-window {
  width: 480px;
  height: 420px;
  right: 16px;
  bottom: 60px;
  display: flex;
  flex-direction: column;
}

.messenger-tabs {
  display: flex;
  background: var(--habbo-navy);
  border-bottom: 2px solid var(--habbo-bevel-dark);
  padding: 4px 6px 0;
  gap: 4px;
}

.messenger-tab-btn {
  padding: 4px 10px;
  background: var(--habbo-blue-dark);
  color: #94a3b8;
  border-top: 1px solid var(--habbo-bevel-light);
  border-left: 1px solid var(--habbo-bevel-light);
  border-right: 1px solid var(--habbo-bevel-dark);
  border-bottom: none;
  font-family: var(--font-pixel);
  font-size: 11px;
  cursor: pointer;
}

.messenger-tab-btn.active {
  background: var(--habbo-navy);
  color: var(--habbo-gold);
  border-top: 2px solid var(--habbo-gold);
}

.messenger-body {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
  font-family: var(--font-pixel);
}

.details-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.details-icon {
  font-size: 28px;
}

.details-title {
  margin: 0;
  font-size: 13px;
  color: var(--habbo-gold);
}

.details-sub {
  margin: 0;
  font-size: 10px;
  color: #94a3b8;
}

.status-pill {
  margin-left: auto;
  padding: 2px 6px;
  border: 1px solid #000000;
  font-size: 10px;
  font-weight: bold;
}

.status-pill[data-status='running'] {
  background: #0284c7;
  color: #ffffff;
}

.status-pill[data-status='completed'] {
  background: #16a34a;
  color: #ffffff;
}

.status-pill[data-status='error'] {
  background: #dc2626;
  color: #ffffff;
}

.status-pill[data-status='idle'] {
  background: #334155;
  color: #cbd5e1;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 6px;
  margin-bottom: 14px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  padding: 4px 8px;
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid #1e293b;
  font-size: 11px;
}

.metric-label {
  color: #94a3b8;
}

.metric-val {
  color: #ffffff;
  font-weight: bold;
}

.clips-title {
  font-size: 11px;
  color: var(--habbo-gold);
  margin: 0 0 6px 0;
}

.clips-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.clip-card {
  padding: 6px 8px;
  font-size: 11px;
}

.clip-top {
  display: flex;
  justify-content: space-between;
  color: #94a3b8;
  font-size: 9px;
  margin-bottom: 2px;
}

.clip-score {
  color: var(--habbo-gold);
  font-weight: bold;
}

.clip-name {
  color: #ffffff;
  font-weight: bold;
  line-height: 1.2;
}

.clip-duration {
  font-size: 9px;
  color: #94a3b8;
  margin-top: 2px;
}

.node-error-box {
  margin-top: 10px;
  padding: 8px;
  background: rgba(220, 38, 38, 0.2);
  border: 1px solid #ef4444;
  color: #fca5a5;
  font-size: 11px;
}

.logs-scroll {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
}

.log-row {
  display: flex;
  gap: 6px;
  line-height: 1.3;
}

.log-time {
  color: #64748b;
  flex-shrink: 0;
}

.log-node {
  color: #38bdf8;
  flex-shrink: 0;
}

.log-row.level-success .log-msg {
  color: #4ade80;
}

.log-row.level-error .log-msg {
  color: #f87171;
}

.log-row.level-warn .log-msg {
  color: #fde047;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #64748b;
  text-align: center;
  font-size: 11px;
  padding: 20px;
}
</style>
