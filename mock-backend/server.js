/**
 * RuntimeClips — Servidor Mock de Referencia para el Backend
 * Cero dependencias externas. Se ejecuta con:
 *   node mock-backend/server.js
 *   o: npm run backend:mock
 *
 * Expone endpoints REST y stream SSE en http://localhost:3000
 * para que el frontend de la Oficina 2D se conecte en vivo.
 */

import http from 'node:http';

const PORT = process.env.PORT || 3000;

// Lista de los 9 agentes en orden de pipeline
const NODES = [
  { key: 'ingest', label: 'Ingest & Whisper', icon: '📥' },
  { key: 'vision', label: 'Editorial Vision', icon: '🧠' },
  { key: 'facetrack', label: 'Face Track UltraFace', icon: '🎯' },
  { key: 'music', label: 'Beat & Music Sync', icon: '🎵' },
  { key: 'subtitles', label: 'Subtitle Styler', icon: '💬' },
  { key: 'broll', label: 'B-Roll & Overlays', icon: '🎨' },
  { key: 'render', label: 'Render FFmpeg', icon: '⚡' },
  { key: 'qa', label: 'QA Gatekeeper', icon: '🛡️' },
  { key: 'publisher', label: 'Social Publisher', icon: '🚀' },
];

let pipelineState = {
  status: 'idle',
  url: '',
  options: {},
  startedAt: null,
  finishedAt: null,
  clips: [],
};

const sseClients = new Set();
let runInterval = null;
let currentNodeIndex = 0;
let nodeProgress = 0;

function broadcastSSE(data) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  for (const res of sseClients) {
    res.write(message);
  }
}

function startMockPipeline(url, options) {
  if (runInterval) clearInterval(runInterval);

  pipelineState.status = 'running';
  pipelineState.url = url;
  pipelineState.options = options;
  pipelineState.startedAt = Date.now();
  pipelineState.clips = [];
  currentNodeIndex = 0;
  nodeProgress = 0;

  broadcastSSE({
    type: 'pipeline_status',
    status: 'running',
  });

  broadcastSSE({
    type: 'log',
    message: `[Pipeline] Iniciado procesamiento de video: ${url}`,
    level: 'info',
  });

  // Empezar con el primer nodo
  activateNode(NODES[0].key);

  runInterval = setInterval(() => {
    if (pipelineState.status !== 'running') return;

    nodeProgress += 0.2;
    const currentNode = NODES[currentNodeIndex];

    if (nodeProgress <= 1.0) {
      broadcastSSE({
        type: 'node_update',
        nodeKey: currentNode.key,
        updates: {
          status: 'running',
          progress: Math.min(1.0, nodeProgress),
          logs: [`[${currentNode.key}] Procesando fragmento (${Math.round(nodeProgress * 100)}%)...`],
        },
      });

      broadcastSSE({
        type: 'log',
        nodeKey: currentNode.key,
        message: `${currentNode.icon} [${currentNode.label}] Progreso: ${Math.round(nodeProgress * 100)}%`,
        level: 'info',
      });
    } else {
      // Nodo completado
      broadcastSSE({
        type: 'node_update',
        nodeKey: currentNode.key,
        updates: {
          status: 'completed',
          progress: 1.0,
          finishedAt: Date.now(),
        },
      });

      broadcastSSE({
        type: 'log',
        nodeKey: currentNode.key,
        message: `✅ [${currentNode.label}] Tarea completada con éxito.`,
        level: 'success',
      });

      // Pasar al siguiente nodo o finalizar
      currentNodeIndex++;
      nodeProgress = 0;

      if (currentNodeIndex < NODES.length) {
        activateNode(NODES[currentNodeIndex].key);
      } else {
        // Fin del pipeline: generar clips de ejemplo
        finishMockPipeline();
      }
    }
  }, 1000);
}

function activateNode(nodeKey) {
  broadcastSSE({
    type: 'node_update',
    nodeKey,
    updates: {
      status: 'running',
      progress: 0.1,
      startedAt: Date.now(),
      logs: [`[${nodeKey}] Agente activado en cubículo.`],
    },
  });
}

function finishMockPipeline() {
  clearInterval(runInterval);
  runInterval = null;
  pipelineState.status = 'completed';
  pipelineState.finishedAt = Date.now();

  const sampleClips = [
    {
      id: 'clip-1',
      title: 'Momento Clave: La Revelación Inesperada',
      hook: 'No te vas a creer lo que pasó aquí...',
      startClock: '00:01:14',
      endClock: '00:01:48',
      startSec: 74,
      endSec: 108,
      durationSec: 34.0,
      score: 0.94,
      scorePercent: 94,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    },
    {
      id: 'clip-2',
      title: 'Clímax: Estrategia de Crecimiento Viral',
      hook: 'El secreto que nadie te cuenta sobre retención...',
      startClock: '00:03:20',
      endClock: '00:03:52',
      startSec: 200,
      endSec: 232,
      durationSec: 32.0,
      score: 0.88,
      scorePercent: 88,
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    },
  ];

  pipelineState.clips = sampleClips;

  broadcastSSE({
    type: 'pipeline_status',
    status: 'completed',
    output: {
      videoUrl: sampleClips[0].videoUrl,
      clips: sampleClips,
    },
  });

  for (const clip of sampleClips) {
    broadcastSSE({
      type: 'clip_generated',
      clip,
    });
  }

  broadcastSSE({
    type: 'log',
    message: `🎉 Pipeline completado: Se generaron ${sampleClips.length} clips verticales listos para publicación.`,
    level: 'success',
  });
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host}`);

  // SSE Stream: GET /api/pipeline/events
  if (url.pathname === '/api/pipeline/events' && req.method === 'GET') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    });

    res.write('data: {"type":"log","message":"[MockBackend] Conectado al canal de eventos en vivo","level":"info"}\n\n');
    sseClients.add(res);

    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  // REST: GET /api/pipeline/status
  if (url.pathname === '/api/pipeline/status' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(pipelineState));
    return;
  }

  // REST: POST /api/pipeline/start
  if (url.pathname === '/api/pipeline/start' && req.method === 'POST') {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        const payload = JSON.parse(body || '{}');
        startMockPipeline(payload.url || 'https://youtube.com/watch?v=demo', payload.options || {});
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, status: 'running' }));
      } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'JSON inválido' }));
      }
    });
    return;
  }

  // REST: POST /api/pipeline/pause
  if (url.pathname === '/api/pipeline/pause' && req.method === 'POST') {
    if (runInterval) clearInterval(runInterval);
    pipelineState.status = 'idle';
    broadcastSSE({ type: 'pipeline_status', status: 'idle' });
    broadcastSSE({ type: 'log', message: 'Pipeline pausado desde API.', level: 'warn' });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, status: 'idle' }));
    return;
  }

  // REST: POST /api/pipeline/reset
  if (url.pathname === '/api/pipeline/reset' && req.method === 'POST') {
    if (runInterval) clearInterval(runInterval);
    pipelineState.status = 'idle';
    pipelineState.clips = [];
    currentNodeIndex = 0;
    nodeProgress = 0;

    for (const node of NODES) {
      broadcastSSE({
        type: 'node_update',
        nodeKey: node.key,
        updates: { status: 'idle', progress: 0, logs: [] },
      });
    }

    broadcastSSE({ type: 'pipeline_status', status: 'idle', output: null });
    broadcastSSE({ type: 'log', message: 'Pipeline reiniciado desde API.', level: 'info' });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, status: 'idle' }));
    return;
  }

  // Ruta no encontrada
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada', path: url.pathname }));
});

server.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 RuntimeClips Mock Backend corriendo en:`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   - Stream SSE: http://localhost:${PORT}/api/pipeline/events`);
  console.log(`   - REST Start: POST http://localhost:${PORT}/api/pipeline/start`);
  console.log(`=================================================`);
});
