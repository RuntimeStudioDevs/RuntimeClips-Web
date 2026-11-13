<script setup lang="ts">
import { ref, computed } from 'vue';
import { usePipelineStore } from '@/stores/pipeline';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-vue-next';

const store = usePipelineStore();
const zoom = ref(1);
const pan = ref({ x: 40, y: 80 });
const isDragging = ref(false);
const startPos = ref({ x: 0, y: 0 });

const NODE_W = 200;
const NODE_H = 75;

// Cálculo de posiciones de nodos en árbol (Fork/Join)
const nodePositions = computed(() => {
  const map = new Map<string, { x: number; y: number }>();
  const nodes = store.nodeList;

  const branches = [...new Set(nodes.filter((n) => n.branchId).map((n) => n.branchId))];
  const branchCount = Math.max(1, branches.length);
  const rowHeight = 95;
  const centerY = 40 + ((branchCount - 1) * rowHeight) / 2;

  const trunkX: Record<string, number> = { input: 30, ingest: 270, transcribe: 510, hook: 750 };
  const joinX: Record<string, number> = { collector: 1980, player: 2220 };

  nodes.forEach((node, idx) => {
    if (trunkX[node.key] !== undefined) {
      map.set(node.key, { x: trunkX[node.key], y: centerY });
    } else if (joinX[node.key] !== undefined) {
      map.set(node.key, { x: joinX[node.key], y: centerY });
    } else if (node.branchId) {
      const bIdx = branches.indexOf(node.branchId);
      const rowY = 40 + bIdx * rowHeight;
      if (node.key.startsWith('reframe-')) map.set(node.key, { x: 1020, y: rowY });
      else if (node.key.startsWith('overlays-')) map.set(node.key, { x: 1260, y: rowY });
      else if (node.key.startsWith('captions-')) map.set(node.key, { x: 1500, y: rowY });
      else if (node.key.startsWith('render-')) map.set(node.key, { x: 1740, y: rowY });
      else map.set(node.key, { x: 1020 + (idx % 4) * 240, y: rowY });
    } else {
      map.set(node.key, { x: 30 + idx * 240, y: centerY });
    }
  });

  return map;
});

// Generación de rutas Bézier SVG para las aristas
const edgePaths = computed(() => {
  return store.edges
    .map((e) => {
      const a = nodePositions.value.get(e.from);
      const b = nodePositions.value.get(e.to);
      if (!a || !b) return null;

      const sx = a.x + NODE_W;
      const sy = a.y + NODE_H / 2;
      const tx = b.x;
      const ty = b.y + NODE_H / 2;
      const dx = tx - sx;
      const bend = Math.max(40, dx / 2);

      const d = `M ${sx} ${sy} C ${sx + bend} ${sy}, ${tx - bend} ${ty}, ${tx} ${ty}`;
      const toNode = store.nodes.get(e.to);
      const active = toNode?.status === 'running';
      const done = toNode?.status === 'completed';

      return { d, active, done, from: e.from, to: e.to };
    })
    .filter(Boolean);
});

function onPointerDown(e: PointerEvent) {
  if ((e.target as HTMLElement).closest('.graph-node')) return;
  isDragging.value = true;
  startPos.value = { x: e.clientX - pan.value.x, y: e.clientY - pan.value.y };
}

function onPointerMove(e: PointerEvent) {
  if (!isDragging.value) return;
  pan.value = { x: e.clientX - startPos.value.x, y: e.clientY - startPos.value.y };
}

function onPointerUp() {
  isDragging.value = false;
}

function zoomIn() {
  zoom.value = Math.min(2.0, zoom.value * 1.2);
}

function zoomOut() {
  zoom.value = Math.max(0.4, zoom.value / 1.2);
}

function zoomFit() {
  zoom.value = 0.85;
  pan.value = { x: 40, y: 120 };
}
</script>

<template>
  <div
    class="tree-graph-container"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
  >
    <!-- Lienzo del grafo transformable -->
    <div
      class="graph-world"
      :style="{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
      }"
    >
      <!-- Cables SVG animados -->
      <svg class="graph-edges" width="3000" height="1500">
        <g v-for="(edge, idx) in edgePaths" :key="idx">
          <path
            :d="edge!.d"
            class="graph-cable"
            :class="{ active: edge!.active, done: edge!.done }"
          />
        </g>
      </svg>

      <!-- Nodos en Árbol -->
      <div
        v-for="node in store.nodeList"
        :key="node.key"
        class="graph-node habbo-box"
        :class="{
          selected: store.selectedNodeKey === node.key,
          [node.status]: true,
        }"
        :style="{
          left: `${nodePositions.get(node.key)?.x || 0}px`,
          top: `${nodePositions.get(node.key)?.y || 0}px`,
        }"
        @click.stop="store.selectNode(node.key)"
      >
        <span class="node-icon">{{ node.icon }}</span>
        <div class="node-info">
          <div class="node-title">{{ node.label }}</div>
          <div class="node-sub">{{ node.subtitle }}</div>
        </div>
        <div class="node-status-badge" :data-status="node.status">
          {{ node.status === 'completed' ? '✓' : node.status === 'running' ? '●' : '○' }}
        </div>
      </div>
    </div>

    <!-- Herramientas de zoom -->
    <div class="graph-zoom-tools">
      <button type="button" class="habbo-btn" title="Acercar" @click="zoomIn">
        <ZoomIn :size="14" />
      </button>
      <button type="button" class="habbo-btn" title="Alejar" @click="zoomOut">
        <ZoomOut :size="14" />
      </button>
      <button type="button" class="habbo-btn" title="Ajustar" @click="zoomFit">
        <Maximize2 :size="14" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.tree-graph-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: var(--habbo-dark);
  background-image: radial-gradient(circle, #1a2a3a 1px, transparent 1.2px);
  background-size: 24px 24px;
  cursor: grab;
}

.tree-graph-container:active {
  cursor: grabbing;
}

.graph-world {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: 0 0;
}

.graph-edges {
  position: absolute;
  left: 0;
  top: 0;
  pointer-events: none;
}

.graph-cable {
  fill: none;
  stroke: #334e68;
  stroke-width: 3;
  transition: stroke 0.3s;
}

.graph-cable.active {
  stroke: #00f2fe;
  stroke-dasharray: 8 6;
  animation: cable-dash 0.6s linear infinite;
  filter: drop-shadow(0 0 4px #00f2fe);
}

.graph-cable.done {
  stroke: #2ecc71;
}

@keyframes cable-dash {
  to {
    stroke-dashoffset: -14;
  }
}

.graph-node {
  position: absolute;
  width: 200px;
  height: 75px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 12px;
  cursor: pointer;
  background: var(--habbo-navy);
  border-radius: 4px;
  transition: transform 0.15s, border-color 0.15s;
}

.graph-node:hover {
  transform: translateY(-2px);
  filter: brightness(1.15);
}

.graph-node.selected {
  outline: 2px solid var(--habbo-gold);
  box-shadow: 0 0 10px rgba(248, 207, 44, 0.4);
}

.graph-node.running {
  border-color: #00f2fe;
  box-shadow: 0 0 8px rgba(0, 242, 254, 0.3);
}

.graph-node.completed {
  border-color: #2ecc71;
}

.graph-node.error {
  border-color: #e74c3c;
}

.node-icon {
  font-size: 24px;
}

.node-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.node-title {
  font-size: 11px;
  font-weight: bold;
  color: #ffffff;
}

.node-sub {
  font-size: 9px;
  color: #94a3b8;
}

.node-status-badge {
  font-size: 11px;
  font-weight: bold;
}

.node-status-badge[data-status='running'] {
  color: #00f2fe;
}
.node-status-badge[data-status='completed'] {
  color: #2ecc71;
}
.node-status-badge[data-status='error'] {
  color: #e74c3c;
}

.graph-zoom-tools {
  position: absolute;
  left: 14px;
  bottom: 64px;
  display: flex;
  gap: 6px;
  z-index: 10;
}
</style>
