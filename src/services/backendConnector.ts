// RuntimeClips-Web — Conector SSE / WebSocket para Backend Real

import { usePipelineStore } from '@/stores/pipeline';
import type { PipelineNode } from '@/types/pipeline';

export class BackendConnector {
  private eventSource: EventSource | null = null;
  private ws: WebSocket | null = null;
  private backendUrl: string;

  constructor(backendUrl = 'http://localhost:3000') {
    this.backendUrl = backendUrl;
  }

  public connectSSE(): void {
    this.disconnect();
    const store = usePipelineStore();

    try {
      this.eventSource = new EventSource(`${this.backendUrl}/api/pipeline/events`);

      this.eventSource.onopen = () => {
        store.addLog(null, `Conexión establecida con el backend en ${this.backendUrl}`, 'success');
      };

      this.eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleServerEvent(data);
        } catch (err) {
          console.error('Error parseando evento del backend:', err);
        }
      };

      this.eventSource.onerror = (err) => {
        console.warn('Conexión con backend interrumpida (esperando reconexión)...', err);
      };
    } catch (e) {
      console.error('No se pudo iniciar EventSource:', e);
    }
  }

  private handleServerEvent(event: any): void {
    const store = usePipelineStore();

    if (event.type === 'node_update' && event.nodeKey) {
      store.updateNode(event.nodeKey, event.updates as Partial<PipelineNode>);
    } else if (event.type === 'pipeline_status') {
      store.pipeline.status = event.status;
      if (event.output) store.pipeline.output = event.output;
    } else if (event.type === 'log') {
      store.addLog(event.nodeKey || null, event.message, event.level || 'info');
    }
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const backendConnector = new BackendConnector();
