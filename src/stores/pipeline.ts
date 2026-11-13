// RuntimeClips-Web — Store Pinia reactivo para el Pipeline, SSE y Estado de la Sala Habbo

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  PipelineNode,
  PipelineEdge,
  LogEntry,
  PipelineState,
  BrandKit,
  HabboSpeechBubble,
  ClipData,
} from '@/types/pipeline';
import { habboAudio } from '@/engine/audio';

export const usePipelineStore = defineStore('pipeline', () => {
  // Estado de vista
  const currentView = ref<'habbo' | 'graph'>('habbo');
  const isMessengerOpen = ref(false);
  const isCatalogOpen = ref(false);
  const isPlayerOpen = ref(false);
  const isMuted = ref(habboAudio.isMuted());

  // Estado del Pipeline
  const pipeline = ref<PipelineState>({
    runId: null,
    status: 'idle',
    url: null,
    sourceType: null,
    options: {},
    startedAt: null,
    finishedAt: null,
    error: null,
    output: null,
  });

  const nodes = ref<Map<string, PipelineNode>>(new Map());
  const edges = ref<PipelineEdge[]>([
    { from: 'input', to: 'ingest' },
    { from: 'ingest', to: 'transcribe' },
    { from: 'transcribe', to: 'hook' },
  ]);
  const logs = ref<LogEntry[]>([]);
  const selectedNodeKey = ref<string | null>(null);
  const activePreviewClip = ref<ClipData | null>(null);

  // Brand Kits
  const brands = ref<BrandKit[]>([{ id: 'default', name: 'Cyberpunk Habbo' }]);
  const selectedBrand = ref('default');

  // Globos de diálogo Habbo
  const speechBubbles = ref<HabboSpeechBubble[]>([]);

  // SSE connection
  let eventSource: EventSource | null = null;
  const sseConnected = ref(false);

  // Nodos como array ordenado para templates
  const nodeList = computed(() => Array.from(nodes.value.values()));
  const selectedNode = computed(() =>
    selectedNodeKey.value ? nodes.value.get(selectedNodeKey.value) ?? null : null
  );

  // Inicializar nodos troncales por defecto
  function initDefaultNodes() {
    const trunk: PipelineNode[] = [
      {
        key: 'input',
        label: 'Recepción y URL',
        subtitle: 'Nexus — Entrada',
        icon: '📥',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
      },
      {
        key: 'ingest',
        label: 'Servidor de Descarga',
        subtitle: 'Byte — Datacenter',
        icon: '⚡',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
      },
      {
        key: 'transcribe',
        label: 'Cabina Acústica Whisper',
        subtitle: 'Echo — Estudio',
        icon: '🎙️',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
      },
      {
        key: 'hook',
        label: 'Despacho de Dirección',
        subtitle: 'Viral — Viralidad',
        icon: '🎯',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
      },
      {
        key: 'collector',
        label: 'Empaquetador .ZIP',
        subtitle: 'Boxer — Almacén',
        icon: '📦',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
      },
      {
        key: 'player',
        label: 'Cine de Proyección',
        subtitle: 'Showcase — Cartelera',
        icon: '🎬',
        status: 'idle',
        progress: 0,
        startedAt: null,
        finishedAt: null,
        durationMs: null,
        data: null,
        error: null,
      },
    ];

    nodes.value.clear();
    for (const node of trunk) {
      nodes.value.set(node.key, node);
    }
  }

  // Conectar con el stream SSE del backend
  function connectSSE() {
    if (eventSource) return;

    try {
      eventSource = new EventSource('/api/pipeline/stream');

      eventSource.onopen = () => {
        sseConnected.value = true;
      };

      eventSource.onerror = () => {
        sseConnected.value = false;
      };

      eventSource.addEventListener('snapshot', (e: MessageEvent) => {
        const snap = JSON.parse(e.data);
        pipeline.value = snap.pipeline;
        edges.value = snap.edges || [];
        logs.value = snap.logs || [];

        nodes.value.clear();
        for (const n of snap.nodes || []) {
          nodes.value.set(n.key, n);
        }
      });

      eventSource.addEventListener('graph_expanded', (e: MessageEvent) => {
        const data = JSON.parse(e.data);
        edges.value = data.edges || [];

        for (const n of data.nodes || []) {
          nodes.value.set(n.key, n);
        }
        habboAudio.playDoorbell();
      });

      eventSource.addEventListener('node', (e: MessageEvent) => {
        const n: PipelineNode = JSON.parse(e.data);
        const prev = nodes.value.get(n.key);
        nodes.value.set(n.key, n);

        if (n.status === 'completed' && prev?.status !== 'completed') {
          habboAudio.playBubble();
          // Añadir globo de diálogo automático
          triggerAgentSpeech(n.key, getSuccessMessageForNode(n.key));
        } else if (n.status === 'error' && prev?.status !== 'error') {
          habboAudio.playErrorBobba();
          triggerAgentSpeech(n.key, `¡Bobba! Ocurrió un error en esta etapa.`);
        }
      });

      eventSource.addEventListener('log', (e: MessageEvent) => {
        const entry: LogEntry = JSON.parse(e.data);
        logs.value.push(entry);
        if (logs.value.length > 500) logs.value.shift();
      });

      eventSource.addEventListener('pipeline', (e: MessageEvent) => {
        pipeline.value = JSON.parse(e.data);
        if (pipeline.value.status === 'completed') {
          habboAudio.playFanfare();
          if (pipeline.value.output?.clips?.length) {
            activePreviewClip.value = pipeline.value.output.clips[0];
            isPlayerOpen.value = true;
          }
        }
      });
    } catch (err) {
      console.warn('Backend offline o inaccesible (modo local mock disponible):', err);
    }
  }

  function getSuccessMessageForNode(key: string): string {
    if (key === 'input') return 'Nexus: ¡URL verificada y aceptada!';
    if (key === 'ingest') return 'Byte: Video 1080p descargado al servidor.';
    if (key === 'transcribe') return 'Echo: Audio a -14 LUFS y transcripción lista.';
    if (key === 'hook') return 'Viral: ¡Ganchos detectados! Despachando a producción.';
    if (key.startsWith('reframe')) return 'Focus: Reencuadre 9:16 UltraFace listo.';
    if (key.startsWith('overlays')) return 'Vector: Capas visuales aplicadas.';
    if (key.startsWith('captions')) return 'Typo: Subtítulos dinámicos renderizados.';
    if (key.startsWith('render')) return 'Master: ¡Reel final exportado en MP4!';
    if (key === 'collector') return 'Boxer: ¡Paquete .ZIP sellado y empaquetado!';
    if (key === 'player') return 'Showcase: ¡Reels listos en la gran pantalla!';
    return '¡Etapa completada con éxito!';
  }

  // Activa una burbuja de diálogo flotante para un agente
  function triggerAgentSpeech(agentKey: string, text: string) {
    const bubbleId = `${agentKey}-${Date.now()}`;
    const agentNames: Record<string, string> = {
      input: 'Nexus',
      ingest: 'Byte',
      transcribe: 'Echo',
      hook: 'Viral',
      collector: 'Boxer',
      player: 'Showcase',
    };
    const name = agentNames[agentKey] || (agentKey.startsWith('reframe') ? 'Focus' : agentKey.startsWith('overlays') ? 'Vector' : agentKey.startsWith('captions') ? 'Typo' : 'Master');

    // Descartar burbujas anteriores del mismo agente
    speechBubbles.value = speechBubbles.value.filter((b) => b.agentKey !== agentKey);

    speechBubbles.value.push({
      id: bubbleId,
      agentKey,
      agentName: name,
      text,
      screenX: 0, // Se actualiza por speech.ts en el loop Three.js
      screenY: 0,
      createdAt: Date.now(),
      expiresAt: Date.now() + 5000,
    });

    habboAudio.playBubble();

    setTimeout(() => {
      speechBubbles.value = speechBubbles.value.filter((b) => b.id !== bubbleId);
    }, 5000);
  }

  // Iniciar ejecución real hacia el backend de tu amigo
  async function startPipeline(url: string, options: Record<string, any> = {}) {
    const res = await fetch('/api/pipeline/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        options: {
          ...options,
          brandId: selectedBrand.value,
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Error ${res.status} al iniciar pipeline.`);
    }

    return await res.json();
  }

  // Cargar Brand Kits
  async function loadBrands() {
    try {
      const res = await fetch('/api/brands');
      if (!res.ok) return;
      const data = await res.json();
      if (data.brands && data.brands.length) {
        brands.value = data.brands.map((b: any) =>
          typeof b === 'string' ? { id: b, name: b.toUpperCase() } : b
        );
      }
    } catch {
      // Usar defaults
    }
  }

  function selectNode(key: string | null) {
    selectedNodeKey.value = key;
    if (key) {
      habboAudio.playFurniClick();
      isMessengerOpen.value = true;
    }
  }

  function toggleSound() {
    isMuted.value = habboAudio.toggleMute();
    if (!isMuted.value) habboAudio.playFurniClick();
  }

  initDefaultNodes();

  return {
    currentView,
    isMessengerOpen,
    isCatalogOpen,
    isPlayerOpen,
    isMuted,
    pipeline,
    nodes,
    edges,
    logs,
    selectedNodeKey,
    selectedNode,
    nodeList,
    activePreviewClip,
    brands,
    selectedBrand,
    speechBubbles,
    sseConnected,
    connectSSE,
    startPipeline,
    selectNode,
    toggleSound,
    triggerAgentSpeech,
    loadBrands,
  };
});
