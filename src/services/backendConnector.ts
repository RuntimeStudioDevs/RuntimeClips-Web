// RuntimeClips-Web — Conector SSE / WebSocket / REST para Backend Real
// Permite comunicar el frontend de la Oficina 2D con la API de orquestación de video.

import { usePipelineStore } from '@/stores/pipeline';
import type { PipelineNode, ClipData, LogEntry, PipelineOutput } from '@/types/pipeline';

export interface ServerEventPayload {
  type: 'node_update' | 'pipeline_status' | 'log' | 'clip_generated';
  nodeKey?: string;
  status?: 'idle' | 'running' | 'completed' | 'error';
  updates?: Partial<PipelineNode>;
  output?: Partial<PipelineOutput>;
  message?: string;
  level?: LogEntry['level'];
  clip?: ClipData;
}

export class BackendConnector {
  private eventSource: EventSource | null = null;
  private backendUrl: string;
  private reconnectTimer: number | null = null;
  private isConnecting = false;

  constructor() {
    this.backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }

  public getBackendUrl(): string {
    return this.backendUrl;
  }

  public setBackendUrl(url: string): void {
    this.backendUrl = url;
  }

  /**
   * Conecta con el canal Server-Sent Events (SSE) del backend para recibir
   * actualizaciones en tiempo real de los 9 agentes y de los clips generados.
   */
  public connectSSE(): void {
    this.disconnect();
    this.isConnecting = true;
    const store = usePipelineStore();

    try {
      const sseUrl = `${this.backendUrl}/api/pipeline/events`;
      this.eventSource = new EventSource(sseUrl);

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        store.addLog(
          null,
          `Conexión establecida con el backend en ${this.backendUrl}`,
          'success'
        );
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data: ServerEventPayload = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch (err) {
          console.error('[BackendConnector] Error parseando evento:', err);
        }
      };

      this.eventSource.onerror = () => {
        if (this.isConnecting) return;
        store.addLog(
          null,
          `Conexión con backend interrumpida. Reintentando en 3s...`,
          'warn'
        );
        this.disconnect();
        this.scheduleReconnect();
      };
    } catch (e) {
      console.error('[BackendConnector] No se pudo iniciar EventSource:', e);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = window.setTimeout(() => {
      const store = usePipelineStore();
      if (store.isBackendMode) {
        this.connectSSE();
      }
    }, 3000);
  }

  /**
   * Procesa los eventos emitidos por el backend y los sincroniza con Pinia.
   */
  private handleServerEvent(event: ServerEventPayload): void {
    const store = usePipelineStore();

    switch (event.type) {
      case 'node_update':
        if (event.nodeKey && event.updates) {
          store.updateNode(event.nodeKey, event.updates);
        }
        break;

      case 'pipeline_status':
        if (event.status) {
          store.pipeline.status = event.status;
        }
        if (event.output) {
          store.pipeline.output = {
            totalClips: event.output.clips?.length || 0,
            zipFile: event.output.zipFile || '',
            zipUrl: event.output.zipUrl || '',
            zipSizeMb: event.output.zipSizeMb || 0,
            clips: event.output.clips || [],
            videoUrl: event.output.videoUrl,
          };
        }
        break;

      case 'log':
        if (event.message) {
          store.addLog(event.nodeKey || null, event.message, event.level || 'info');
        }
        break;

      case 'clip_generated':
        if (event.clip) {
          if (!store.pipeline.output) {
            store.pipeline.output = {
              totalClips: 0,
              zipFile: '',
              zipUrl: '',
              zipSizeMb: 0,
              clips: [],
            };
          }
          store.pipeline.output.clips.push(event.clip);
          store.pipeline.output.totalClips = store.pipeline.output.clips.length;
          store.addLog(
            'publisher',
            `🎬 Nuevo clip vertical disponible: "${event.clip.title || 'Clip sin título'}" (${event.clip.durationSec.toFixed(1)}s)`,
            'success'
          );
        }
        break;
    }
  }

  /**
   * Ordena al backend iniciar el procesamiento de video con una URL y opciones.
   */
  public async startPipeline(
    url: string,
    options: { aspectRatio?: string; minScore?: number; maxClips?: number } = {}
  ): Promise<boolean> {
    const store = usePipelineStore();
    try {
      store.addLog(null, `Enviando solicitud de inicio a ${this.backendUrl}/api/pipeline/start...`, 'info');
      const res = await fetch(`${this.backendUrl}/api/pipeline/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, options }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Error HTTP ${res.status}: ${errText}`);
      }

      store.pipeline.status = 'running';
      store.addLog(null, `Pipeline iniciado exitosamente en el backend.`, 'success');
      return true;
    } catch (err: any) {
      store.addLog(
        null,
        `⚠️ Error al contactar backend: ${err.message || err}. Verifica que tu servidor esté corriendo en ${this.backendUrl}.`,
        'error'
      );
      return false;
    }
  }

  /**
   * Pausa el pipeline en el backend.
   */
  public async pausePipeline(): Promise<boolean> {
    const store = usePipelineStore();
    try {
      const res = await fetch(`${this.backendUrl}/api/pipeline/pause`, {
        method: 'POST',
      });
      if (res.ok) {
        store.pipeline.status = 'idle';
        store.addLog(null, 'Pipeline pausado en el backend.', 'info');
        return true;
      }
      return false;
    } catch (err: any) {
      store.addLog(null, `No se pudo pausar el backend: ${err.message}`, 'error');
      return false;
    }
  }

  /**
   * Reinicia los nodos y el pipeline en el backend.
   */
  public async resetPipeline(): Promise<boolean> {
    const store = usePipelineStore();
    try {
      const res = await fetch(`${this.backendUrl}/api/pipeline/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        store.initDefaultNodes();
        store.pipeline.status = 'idle';
        store.pipeline.output = null;
        store.addLog(null, 'Pipeline reiniciado en el backend.', 'info');
        return true;
      }
      return false;
    } catch (err: any) {
      store.addLog(null, `No se pudo reiniciar el backend: ${err.message}`, 'error');
      return false;
    }
  }

  public disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    this.isConnecting = false;
  }
}

export const backendConnector = new BackendConnector();
