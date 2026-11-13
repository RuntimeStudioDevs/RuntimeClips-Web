// RuntimeClips-Web — Store Pinia reactivo para el Pipeline de 9 Nodos y la Oficina 2D

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  PipelineNode,
  PipelineEdge,
  LogEntry,
  PipelineState,
  ClipData,
} from '@/types/pipeline';
import type { AgentSession, AgentStatus } from '@/engine/office2d/types';

export const usePipelineStore = defineStore('pipeline', () => {
  // Estado de vista y paneles
  const currentView = ref<'office' | 'graph'>('office');
  const isInspectorOpen = ref(false);
  const isPlayerOpen = ref(false);
  const isBackendMode = ref(false); // Toggle entre Simulación Local y Backend Real

  // Estado del Pipeline Global
  const pipeline = ref<PipelineState>({
    runId: null,
    status: 'idle',
    url: 'https://youtube.com/watch?v=sample-runtime',
    sourceType: 'youtube',
    options: {
      minScore: 0.8,
      aspectRatio: '9:16',
      maxClips: 3,
    },
    startedAt: null,
    finishedAt: null,
    error: null,
    output: null,
  });

  const nodes = ref<Map<string, PipelineNode>>(new Map());
  const edges = ref<PipelineEdge[]>([
    { from: 'ingest', to: 'vision' },
    { from: 'vision', to: 'facetrack' },
    { from: 'facetrack', to: 'music' },
    { from: 'music', to: 'subtitles' },
    { from: 'subtitles', to: 'broll' },
    { from: 'broll', to: 'render' },
    { from: 'render', to: 'qa' },
    { from: 'qa', to: 'publisher' },
  ]);

  const logs = ref<LogEntry[]>([]);
  const selectedNodeKey = ref<string | null>(null);
  const activePreviewClip = ref<ClipData | null>(null);

  // Inicializar los 9 Agentes Especializados de RuntimeClips
  function initDefaultNodes() {
    const list: PipelineNode[] = [
      {
        key: 'ingest',
        label: 'Ingest & Whisper',
        subtitle: 'Descarga y audio a -14 LUFS',
        icon: '📥',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[Ingest] En espera de URL o video local.'],
      },
      {
        key: 'vision',
        label: 'Editorial Vision',
        subtitle: 'Detección de ganchos virales',
        icon: '🧠',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[Vision] Modelos Gemini / Claude listos para analizar ganchos.'],
      },
      {
        key: 'facetrack',
        label: 'Face Track UltraFace',
        subtitle: 'Rastreo facial y recorte 9:16',
        icon: '🎯',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[FaceTrack] Red ONNX UltraFace inicializada.'],
      },
      {
        key: 'music',
        label: 'Beat & Music Sync',
        subtitle: 'Análisis de tempo y ritmo',
        icon: '🎵',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[MusicSync] Detector de transitorios de audio listo.'],
      },
      {
        key: 'subtitles',
        label: 'Subtitle Styler',
        subtitle: 'Animación de subtítulos dinámicos',
        icon: '💬',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[Subtitles] Plantilla tipográfica vertical cargada.'],
      },
      {
        key: 'broll',
        label: 'B-Roll & Overlays',
        subtitle: 'Inserción de recursos visuales',
        icon: '🎨',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[B-Roll] Banco de recursos y animaciones listo.'],
      },
      {
        key: 'render',
        label: 'Render FFmpeg',
        subtitle: 'Compilación por hardware GPU',
        icon: '⚡',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[Render] Pipeline FFmpeg NVENC/libx264 configurado.'],
      },
      {
        key: 'qa',
        label: 'QA Gatekeeper',
        subtitle: 'Auditoría de calidad y límites',
        icon: '🛡️',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[QA] Reglas de validación estricta preparadas.'],
      },
      {
        key: 'publisher',
        label: 'Social Publisher',
        subtitle: 'Empaquetado ZIP y metadatos',
        icon: '🚀',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
        logs: ['[Publisher] Generador de metadatos TikTok/Reels/Shorts listo.'],
      },
    ];

    nodes.value.clear();
    for (const item of list) {
      nodes.value.set(item.key, item);
    }
  }

  // Mapeo computado de nodos a sesiones del motor 2D
  const agentSessions = computed<AgentSession[]>(() => {
    return Array.from(nodes.value.values()).map((node) => {
      let status: AgentStatus = 'idle';
      if (node.status === 'running') {
        status = node.progress > 0.8 ? 'typing' : node.progress > 0.4 ? 'tool' : 'thinking';
      } else if (node.status === 'completed') {
        status = 'done';
      } else if (node.status === 'error') {
        status = 'error';
      }

      return {
        key: node.key,
        agent: node.key,
        name: node.label,
        role: node.subtitle,
        status,
        progress: node.progress,
        taskSummary: node.status === 'running' ? `${node.label} (${Math.round(node.progress * 100)}%)` : node.label,
        startedAt: node.startedAt || undefined,
        lastEventAt: node.finishedAt || node.startedAt || undefined,
        logs: node.logs,
      };
    });
  });

  const selectedNode = computed(() => {
    return selectedNodeKey.value ? nodes.value.get(selectedNodeKey.value) || null : null;
  });

  const nodeList = computed(() => Array.from(nodes.value.values()));

  function selectNode(key: string | null) {
    selectedNodeKey.value = key;
    isInspectorOpen.value = !!key;
  }

  function addLog(nodeKey: string | null, message: string, level: LogEntry['level'] = 'info') {
    const entry: LogEntry = {
      id: Date.now() + Math.random(),
      ts: Date.now(),
      level,
      node: nodeKey,
      message,
    };
    logs.value.push(entry);
    if (logs.value.length > 200) logs.value.shift();

    if (nodeKey && nodes.value.has(nodeKey)) {
      const target = nodes.value.get(nodeKey)!;
      target.logs.push(`[${new Date().toLocaleTimeString()}] ${message}`);
      if (target.logs.length > 50) target.logs.shift();
    }
  }

  function updateNode(key: string, updates: Partial<PipelineNode>) {
    if (!nodes.value.has(key)) return;
    const current = nodes.value.get(key)!;
    nodes.value.set(key, { ...current, ...updates });
  }

  function openClipPlayer(clip: ClipData) {
    activePreviewClip.value = clip;
    isPlayerOpen.value = true;
  }

  function closeClipPlayer() {
    isPlayerOpen.value = false;
    activePreviewClip.value = null;
  }

  // Inicializar estado al cargar
  initDefaultNodes();

  return {
    currentView,
    isInspectorOpen,
    isPlayerOpen,
    isBackendMode,
    pipeline,
    nodes,
    edges,
    logs,
    selectedNodeKey,
    selectedNode,
    nodeList,
    agentSessions,
    activePreviewClip,
    initDefaultNodes,
    selectNode,
    addLog,
    updateNode,
    openClipPlayer,
    closeClipPlayer,
  };
});
