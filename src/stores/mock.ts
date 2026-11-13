// RuntimeClips-Web — Orquestador de Simulación Autónoma de 9 Nodos

import { usePipelineStore } from './pipeline';
import type { ClipData } from '@/types/pipeline';

export class RuntimeMockSimulator {
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

    // 1. Iniciar estado global del pipeline
    store.pipeline.status = 'running';
    store.pipeline.startedAt = Date.now();
    store.pipeline.error = null;
    store.pipeline.output = null;

    // Resetear todos los 9 nodos a 'idle'
    for (const node of store.nodes.values()) {
      node.status = 'idle';
      node.progress = 0;
      node.startedAt = null;
      node.finishedAt = null;
      node.error = null;
    }

    store.addLog(null, '🚀 Orquestador autónomo de RuntimeClips iniciado (Pipeline de 9 nodos).', 'info');

    // --- Nodo 1: Ingest & Whisper
    await this.stepNode('ingest', 'Descargando stream 1080p y extrayendo pista de audio...', [
      { progress: 0.35, msg: 'Descarga HTTP completada (42.8 MB).' },
      { progress: 0.75, msg: 'Normalización de audio Whisper a -14 LUFS.' },
      { progress: 1.0, msg: 'Transcripción generada con timestamps a nivel de palabra.' },
    ]);
    if (!this.isRunning) return;

    // --- Nodo 2: Editorial Vision
    await this.stepNode('vision', 'Evaluando transcripción con Gemini 2.5 Pro para detección de ganchos virales...', [
      { progress: 0.4, msg: 'Analizando retención y curvas de dopamina en el guion.' },
      { progress: 0.8, msg: '3 ganchos virales detectados con 0% de solapamiento temporal.' },
      { progress: 1.0, msg: 'Storyboard editorial y títulos magnéticos redactados.' },
    ]);
    if (!this.isRunning) return;

    // --- Nodo 3: Face Track UltraFace
    await this.stepNode('facetrack', 'Ejecutando modelo ONNX UltraFace para seguimiento y reencuadre 9:16...', [
      { progress: 0.5, msg: 'Detección de puntos faciales clave y centrado dinámico.' },
      { progress: 1.0, msg: 'Curva de reencuadre suave suavizada sin sacudidas.' },
    ]);
    if (!this.isRunning) return;

    // --- Nodo 4: Beat & Music Sync
    await this.stepNode('music', 'Analizando BPM y transitorios de audio para sincronización rítmica...', [
      { progress: 0.6, msg: 'Detección de compases y cortes musicales calculados.' },
      { progress: 1.0, msg: 'Puntos de corte acoplados al ritmo de la música.' },
    ]);
    if (!this.isRunning) return;

    // --- Nodo 5: Subtitle Styler
    await this.stepNode('subtitles', 'Generando capas de subtítulos dinámicos estilo TikTok / Reels...', [
      { progress: 0.5, msg: 'Aplicando efecto karaoke palabra por palabra.' },
      { progress: 1.0, msg: 'Composición de color y contraste validada (accesibilidad).' },
    ]);
    if (!this.isRunning) return;

    // --- Nodo 6: B-Roll & Overlays
    await this.stepNode('broll', 'Seleccionando e insertando planos de recurso y stickers contextuales...', [
      { progress: 0.5, msg: 'Asociando conceptos clave a clips complementarios B-Roll.' },
      { progress: 1.0, msg: 'Superposiciones gráficas y transiciones renderizadas.' },
    ]);
    if (!this.isRunning) return;

    // --- Nodo 7: Render FFmpeg
    await this.stepNode('render', 'Compilando clips finales con aceleración de hardware NVENC/FFmpeg...', [
      { progress: 0.3, msg: 'Renderizando clip 1/3 (1080x1920 60fps)...' },
      { progress: 0.7, msg: 'Renderizando clip 2/3 y 3/3...' },
      { progress: 1.0, msg: '3 archivos MP4 generados con perfil H.264 High.' },
    ]);
    if (!this.isRunning) return;

    // --- Nodo 8: QA Gatekeeper
    await this.stepNode('qa', 'Auditando calidad técnica, sonoridad LUFS y coherencia de encuadre...', [
      { progress: 0.5, msg: 'Comprobando límites de duración (<60s) y proporción vertical.' },
      { progress: 1.0, msg: 'Auditoría aprobada con puntuación técnica 98/100.' },
    ]);
    if (!this.isRunning) return;

    // --- Nodo 9: Social Publisher
    await this.stepNode('publisher', 'Generando paquete ZIP final y metadatos para publicación...', [
      { progress: 0.5, msg: 'Generando copys, hashtags virales y llamadas a la acción.' },
      { progress: 1.0, msg: 'Paquete de entrega empaquetado en runtime-clips-final.zip.' },
    ]);
    if (!this.isRunning) return;

    // Finalización exitosa del pipeline
    const mockClips: ClipData[] = [
      {
        id: 'clip-1',
        branchId: 'clip-1',
        score: 0.96,
        scorePercent: 96,
        title: 'El secreto que nadie te cuenta de los Agentes de IA',
        durationSec: 32.5,
        sizeMb: '14.8 MB',
        file: 'runtime_clip_01.mp4',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      },
      {
        id: 'clip-2',
        branchId: 'clip-2',
        score: 0.91,
        scorePercent: 91,
        title: 'Por qué tu flujo de trabajo cambiará para siempre',
        durationSec: 28.0,
        sizeMb: '12.4 MB',
        file: 'runtime_clip_02.mp4',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      },
      {
        id: 'clip-3',
        branchId: 'clip-3',
        score: 0.88,
        scorePercent: 88,
        title: 'Cómo automatizar la producción de video en 3 minutos',
        durationSec: 35.2,
        sizeMb: '16.1 MB',
        file: 'runtime_clip_03.mp4',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      },
    ];

    store.pipeline.status = 'completed';
    store.pipeline.finishedAt = Date.now();
    store.pipeline.output = {
      totalClips: 3,
      zipFile: 'runtime-clips-final.zip',
      zipUrl: '#',
      zipSizeMb: '43.3 MB',
      clips: mockClips,
    };

    store.addLog(null, '🎉 ¡Pipeline completado con éxito! 3 clips verticales listos para descargar.', 'success');
  }

  private async stepNode(
    key: string,
    initialMsg: string,
    subSteps: Array<{ progress: number; msg: string }>
  ): Promise<void> {
    const store = usePipelineStore();
    store.updateNode(key, { status: 'running', startedAt: Date.now(), progress: 0.1 });
    store.addLog(key, initialMsg, 'info');

    for (const step of subSteps) {
      await this.delay(650);
      if (!this.isRunning) return;
      store.updateNode(key, { progress: step.progress });
      store.addLog(key, step.msg, 'info');
    }

    await this.delay(400);
    if (!this.isRunning) return;
    store.updateNode(key, { status: 'completed', progress: 1.0, finishedAt: Date.now() });
    store.addLog(key, `Paso ${key.toUpperCase()} finalizado con éxito.`, 'success');
  }

  public injectError(key = 'render'): void {
    const store = usePipelineStore();
    store.updateNode(key, {
      status: 'error',
      error: 'Error de memoria VRAM en codificador FFmpeg NVENC.',
    });
    store.addLog(key, '❌ Fallo crítico detectado en el agente: VRAM Insuficiente.', 'error');
  }
}

export const mockSimulator = new RuntimeMockSimulator();
