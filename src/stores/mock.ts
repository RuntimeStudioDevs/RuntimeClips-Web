// RuntimeClips-Web — Simulador Mock de Pipeline con Diálogos Habbo
// Permite probar todo el entorno, avatares, furni y globos de diálogo sin depender del backend.

import { usePipelineStore } from './pipeline';
import type { PipelineNode, PipelineEdge, ClipData } from '@/types/pipeline';
import { habboAudio } from '@/engine/audio';

export class HabboMockSimulator {
  private timerIds: number[] = [];
  public isRunning = false;

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const id = window.setTimeout(resolve, ms);
      this.timerIds.push(id);
    });
  }

  public stop(): void {
    this.isRunning = false;
    for (const id of this.timerIds) clearTimeout(id);
    this.timerIds = [];
  }

  public async run(): Promise<void> {
    this.stop();
    this.isRunning = true;
    const store = usePipelineStore();

    habboAudio.playDoorbell();

    // 1. Iniciar estado
    store.pipeline.status = 'running';
    store.pipeline.startedAt = Date.now();
    store.pipeline.error = null;
    store.pipeline.output = null;

    // Resetear nodos troncales
    for (const node of store.nodes.values()) {
      node.status = 'idle';
      node.progress = 0;
      node.startedAt = null;
      node.finishedAt = null;
      node.data = null;
    }

    store.logs.push({
      id: Date.now(),
      ts: Date.now(),
      level: 'info',
      node: 'input',
      message: '[Habbo Studio] Simulador autónomo iniciado.',
    });

    await this.delay(500);
    if (!this.isRunning) return;

    // 2. Nexus (Input)
    this.updateNode(store, 'input', { status: 'running', startedAt: Date.now() });
    store.triggerAgentSpeech('input', 'Nexus: ¡Bienvenido al Hotel! Validando video...');
    await this.delay(800);
    if (!this.isRunning) return;
    this.updateNode(store, 'input', { status: 'completed', progress: 1, finishedAt: Date.now() });
    store.triggerAgentSpeech('input', 'Nexus: URL verificada. Pasando a Byte.');

    // 3. Byte (Ingest)
    this.updateNode(store, 'ingest', { status: 'running', startedAt: Date.now() });
    store.triggerAgentSpeech('ingest', 'Byte: Descargando stream 1080p...');
    await this.delay(400);
    if (!this.isRunning) return;
    this.updateNode(store, 'ingest', { progress: 0.5 });
    await this.delay(500);
    if (!this.isRunning) return;
    this.updateNode(store, 'ingest', { status: 'completed', progress: 1, finishedAt: Date.now() });
    store.triggerAgentSpeech('ingest', 'Byte: Buffer listo en memoria.');

    // 4. Echo (Transcribe)
    this.updateNode(store, 'transcribe', { status: 'running', startedAt: Date.now() });
    store.triggerAgentSpeech('transcribe', 'Echo: Analizando audio Whisper a -14 LUFS...');
    await this.delay(900);
    if (!this.isRunning) return;
    this.updateNode(store, 'transcribe', { status: 'completed', progress: 1, finishedAt: Date.now() });
    store.triggerAgentSpeech('transcribe', 'Echo: Transcripción con marcas temporales lista.');

    // 5. Viral (Hook)
    this.updateNode(store, 'hook', { status: 'running', startedAt: Date.now() });
    store.triggerAgentSpeech('hook', 'Viral: ¡Buscando picos virales con 0% solapamiento!');
    await this.delay(1000);
    if (!this.isRunning) return;

    const mockClips: ClipData[] = [
      { id: 'clip-1', branchId: 'clip-1', score: 0.95, scorePercent: 95, title: 'El secreto que nadie te cuenta de la IA', durationSec: 30.0, sizeMb: '14.2', file: 'clip-1.mp4' },
      { id: 'clip-2', branchId: 'clip-2', score: 0.89, scorePercent: 89, title: 'Por qué esta herramienta supera a todas', durationSec: 32.0, sizeMb: '15.1', file: 'clip-2.mp4' },
      { id: 'clip-3', branchId: 'clip-3', score: 0.84, scorePercent: 84, title: 'Cómo automatizar tu flujo en 3 pasos', durationSec: 28.0, sizeMb: '12.8', file: 'clip-3.mp4' },
    ];

    this.updateNode(store, 'hook', {
      status: 'completed',
      progress: 1,
      finishedAt: Date.now(),
      data: { clips: mockClips, totalCandidates: 3 },
    });
    store.triggerAgentSpeech('hook', 'Viral: ¡3 ganchos detectados! Abriendo bahías de clips.');
    habboAudio.playDoorbell();

    // 6. Expansión de ramas de clips
    const clipIds = ['clip-1', 'clip-2', 'clip-3'];
    const newEdges: PipelineEdge[] = [
      { from: 'input', to: 'ingest' },
      { from: 'ingest', to: 'transcribe' },
      { from: 'transcribe', to: 'hook' },
    ];

    clipIds.forEach((cid, idx) => {
      const num = idx + 1;
      const branchNodes: PipelineNode[] = [
        { key: `reframe-${cid}`, branchId: cid, label: `Reframe #${num}`, subtitle: 'Focus — UltraFace ONNX', icon: '📐', status: 'idle', progress: 0, startedAt: null, finishedAt: null, durationMs: null, data: null, error: null },
        { key: `overlays-${cid}`, branchId: cid, label: `Overlays #${num}`, subtitle: 'Vector — HyperFrames', icon: '🎨', status: 'idle', progress: 0, startedAt: null, finishedAt: null, durationMs: null, data: null, error: null },
        { key: `captions-${cid}`, branchId: cid, label: `Subtítulos #${num}`, subtitle: 'Typo — Dinámicos ASS', icon: '💬', status: 'idle', progress: 0, startedAt: null, finishedAt: null, durationMs: null, data: null, error: null },
        { key: `render-${cid}`, branchId: cid, label: `Render #${num}`, subtitle: 'Master — FFmpeg NVENC', icon: '🎞️', status: 'idle', progress: 0, startedAt: null, finishedAt: null, durationMs: null, data: null, error: null },
      ];

      for (const bn of branchNodes) {
        store.nodes.set(bn.key, bn);
      }

      newEdges.push(
        { from: 'hook', to: `reframe-${cid}` },
        { from: `reframe-${cid}`, to: `overlays-${cid}` },
        { from: `overlays-${cid}`, to: `captions-${cid}` },
        { from: `captions-${cid}`, to: `render-${cid}` },
        { from: `render-${cid}`, to: 'collector' }
      );
    });

    newEdges.push({ from: 'collector', to: 'player' });
    store.edges = newEdges;

    await this.delay(600);
    if (!this.isRunning) return;

    // 7. Ejecución paralela de las 3 ramas
    // Reframe
    for (const cid of clipIds) this.updateNode(store, `reframe-${cid}`, { status: 'running' });
    store.triggerAgentSpeech('reframe-clip-1', 'Focus: Centrado de cara 9:16 en curso.');
    await this.delay(700);
    if (!this.isRunning) return;
    for (const cid of clipIds) this.updateNode(store, `reframe-${cid}`, { status: 'completed', progress: 1 });

    // Overlays
    for (const cid of clipIds) this.updateNode(store, `overlays-${cid}`, { status: 'running' });
    store.triggerAgentSpeech('overlays-clip-1', 'Vector: Diseñando capas y barras de avance.');
    await this.delay(700);
    if (!this.isRunning) return;
    for (const cid of clipIds) this.updateNode(store, `overlays-${cid}`, { status: 'completed', progress: 1 });

    // Captions
    for (const cid of clipIds) this.updateNode(store, `captions-${cid}`, { status: 'running' });
    store.triggerAgentSpeech('captions-clip-1', 'Typo: Sincronizando palabras clave con acento.');
    await this.delay(700);
    if (!this.isRunning) return;
    for (const cid of clipIds) this.updateNode(store, `captions-${cid}`, { status: 'completed', progress: 1 });

    // Render
    for (const cid of clipIds) this.updateNode(store, `render-${cid}`, { status: 'running' });
    store.triggerAgentSpeech('render-clip-1', 'Master: Renderizando video vertical final...');
    await this.delay(800);
    if (!this.isRunning) return;
    for (const cid of clipIds) this.updateNode(store, `render-${cid}`, { status: 'completed', progress: 1 });

    // 8. Boxer (Collector)
    this.updateNode(store, 'collector', { status: 'running' });
    store.triggerAgentSpeech('collector', 'Boxer: Empaquetando los 3 clips en archivo ZIP...');
    await this.delay(800);
    if (!this.isRunning) return;

    const output = {
      totalClips: 3,
      zipFile: 'Habbo_Clips_Pack.zip',
      zipUrl: '#',
      zipSizeMb: '42.1',
      clips: mockClips,
    };

    this.updateNode(store, 'collector', { status: 'completed', progress: 1, data: output });
    store.triggerAgentSpeech('collector', 'Boxer: ¡Paquete .ZIP listo para descarga!');

    // 9. Showcase (Player)
    this.updateNode(store, 'player', { status: 'completed', progress: 1, data: output });
    store.triggerAgentSpeech('player', 'Showcase: ¡Reels disponibles en la cartelera del cine!');

    store.pipeline.status = 'completed';
    store.pipeline.finishedAt = Date.now();
    store.pipeline.output = output;
    store.activePreviewClip = mockClips[0];

    habboAudio.playFanfare();
    this.isRunning = false;
  }

  private updateNode(store: ReturnType<typeof usePipelineStore>, key: string, patch: Partial<PipelineNode>): void {
    const node = store.nodes.get(key);
    if (node) {
      Object.assign(node, patch);
      if (patch.status === 'completed') habboAudio.playBubble();
    }
  }
}
