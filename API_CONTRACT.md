# RuntimeClips — Especificación y Contrato de API para el Backend

Este documento define la interfaz de comunicación entre el frontend de **RuntimeClips Studio** (Oficina Agéntica 2D) y el backend de procesamiento de video.

---

## 🏗️ 1. Arquitectura y Flujo de Datos

El frontend opera en dos modos:
1. **Simulación Local:** Ejecuta un pipeline sintético en el navegador para demostraciones rápidas.
2. **Backend en Vivo:** Se conecta a tu servidor mediante **HTTP REST** (para órdenes de control) y un **Stream SSE** (Server-Sent Events) en `/api/pipeline/events` (o WebSockets) para recibir el estado y logs en tiempo real.

```
+------------------------------------+                  +--------------------------------------+
|  RuntimeClips Frontend (Vue 3)     |                  |  Backend de Orquestación (Node/Py)   |
|                                    |                  |                                      |
|  [ Iniciar Pipeline ]              | -- POST /start -> |  Recibe URL y opciones              |
|  [ Pausar / Reiniciar ]            | -- POST /pause -> |  Controla ejecución de workers      |
|                                    |                  |                                      |
|  Oficina 2D (Renderiza avatares,   | <- SSE Events --- |  Emite:                              |
|  monitores, burbujas y logs)       |    (Stream)      |   - node_update                      |
|                                    |                  |   - log                              |
|                                    |                  |   - clip_generated                   |
+------------------------------------+                  +--------------------------------------+
```

---

## 👥 2. Los 9 Nodos / Agentes Especializados

Cada agente en la oficina está mapeado a una clave única (`nodeKey`):

| `nodeKey` | Nombre del Agente | Rol en el Pipeline | Camiseta / Color |
|---|---|---|---|
| `ingest` | Ingest & Whisper | Descarga video y normaliza audio a -14 LUFS | Azul (`#0284c7`) |
| `vision` | Editorial Vision | Análisis multimodal (Gemini/Claude) y ganchos virales | Violeta (`#8b5cf6`) |
| `facetrack` | Face Track UltraFace | Detección facial ONNX y reencuadre dinámico 9:16 | Naranja (`#f97316`) |
| `music` | Beat & Music Sync | Detección de BPM, ritmo y mezcla de fondo | Rosa (`#ec4899`) |
| `subtitles` | Dynamic Subtitles | Transcripción palabra por palabra y estilo animado | Esmeralda (`#10b981`) |
| `broll` | B-Roll & Overlays | Inserción de imágenes, videos de apoyo y memes | Cian (`#06b6d4`) |
| `render` | Render FFmpeg GPU | Renderizado por hardware NVENC/libx264 a 60 FPS | Rojo (`#ef4444`) |
| `qa` | QA Gatekeeper | Auditoría de ritmo, volumen y verificación de límites | Amarillo (`#eab308`) |
| `publisher` | Social Publisher | Empaquetado de clips verticales y metadatos | Verde Lima (`#22c55e`) |

---

## 🚦 3. Ciclo de Estados de un Nodo

Los estados admitidos para cada nodo son:
- `'idle'`: En espera (el personaje pasea por la cafetería, lounge o juega ping-pong).
- `'running'`: En procesamiento activo (el personaje se sienta en su escritorio, teclea en el monitor y el monitor scrollea código con reflejo de luz).
- `'completed'`: Tarea terminada con éxito (muestra globo con `✓` verde).
- `'error'`: Fallo o excepción detectada (el personaje se levanta y salta con globo `!`).

---

## 🌐 4. Endpoints REST

La URL base por defecto es `http://localhost:3000` (configurable mediante `VITE_BACKEND_URL`).

### `POST /api/pipeline/start`
Inicia el procesamiento del video.

**Request Body:**
```json
{
  "url": "https://www.youtube.com/watch?v=ejemplo",
  "options": {
    "aspectRatio": "9:16",
    "minScore": 0.8,
    "maxClips": 3
  }
}
```

**Response (200 OK):**
```json
{
  "ok": true,
  "status": "running"
}
```

---

### `POST /api/pipeline/pause`
Pausa el pipeline.

**Response (200 OK):**
```json
{
  "ok": true,
  "status": "idle"
}
```

---

### `POST /api/pipeline/reset`
Reinicia los 9 nodos al estado inicial (`idle`, `progress: 0`).

**Response (200 OK):**
```json
{
  "ok": true,
  "status": "idle"
}
```

---

### `GET /api/pipeline/status`
Consulta el estado global actual.

**Response (200 OK):**
```json
{
  "status": "running",
  "url": "https://www.youtube.com/watch?v=ejemplo",
  "startedAt": 1731600000000,
  "finishedAt": null,
  "clips": []
}
```

---

## ⚡ 5. Stream en Tiempo Real (Server-Sent Events)

El frontend abre una conexión persistente a:
```http
GET /api/pipeline/events
Accept: text/event-stream
```

Cada mensaje enviado por el servidor debe tener el formato SSE estándar:
```
data: <JSON_EN_UNA_SOLA_LINEA>\n\n
```

### Tipos de Eventos JSON:

#### A. Actualización de un Nodo (`node_update`)
Mueve al agente a su cubículo, actualiza su barra de progreso y sus líneas de log.
```json
{
  "type": "node_update",
  "nodeKey": "facetrack",
  "updates": {
    "status": "running",
    "progress": 0.65,
    "logs": ["[FaceTrack] Rostro detectado en x:340, y:120 (Confianza: 98%)"]
  }
}
```

#### B. Log General o de Nodo (`log`)
Agrega una línea en la consola y en el inspector lateral:
```json
{
  "type": "log",
  "nodeKey": "render",
  "message": "Renderizando frame 450/1200...",
  "level": "info"
}
```
*Valores posibles para `level`:* `'info' | 'warn' | 'error' | 'success'`.

#### C. Estado Global del Pipeline (`pipeline_status`)
```json
{
  "type": "pipeline_status",
  "status": "completed",
  "output": {
    "videoUrl": "https://miservidor.com/salidas/reel-final.mp4",
    "clips": [ ... ]
  }
}
```

#### D. Clip Vertical Generado (`clip_generated`)
Habilita el botón **"Clips (N)"** en la barra superior y permite previsualizar y descargar el reel en el modal:
```json
{
  "type": "clip_generated",
  "clip": {
    "id": "clip-01",
    "title": "Gancho Viral: Por qué el 99% falla",
    "hook": "Esto nadie te lo explica sobre retención...",
    "startClock": "00:01:10",
    "endClock": "00:01:45",
    "startSec": 70.0,
    "endSec": 105.0,
    "durationSec": 35.0,
    "score": 0.95,
    "scorePercent": 95,
    "videoUrl": "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
  }
}
```

---

## 🧪 6. Probar Inmediatamente con el Servidor Mock Incluido

Para verificar la conexión antes de programar tu propio backend, puedes correr el mock nativo que dejamos preparado en el repositorio:
```bash
npm run backend:mock
```
Esto levantará el servidor en `http://localhost:3000`. Luego entra al frontend, activa **"Backend en Vivo"** y pulsa **"Iniciar Pipeline"**. Verás cómo la oficina reacciona a los eventos emitidos por el servidor.
