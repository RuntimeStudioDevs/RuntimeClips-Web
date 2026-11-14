# ⚡ RuntimeClips Studio (Frontend)

> **Oficina Agéntica 2D Isométrica y visualizador de pipelines de video automatizados para clips verticales (TikTok / Reels / Shorts).**

Frontend interactivo construido con **Vue 3**, **Vite**, **TypeScript** y **Pinia**, con un motor gráfico Canvas 2D isométrico nativo a 60 FPS sin dependencias pesadas.

---

## 📸 Vista de la Oficina Agéntica 2D

Cada agente del pipeline de procesamiento de video tiene una identidad, un cubículo asignado y un comportamiento autónomo:
- **En ejecución:** Se sienta en su escritorio, teclea con monitores que scrollean código en tiempo real y proyectan luz sobre la madera.
- **En descanso o esperando:** Pasea por la cafetería, se sirve café o agua con burbujas animadas, lee libros en el lounge, juega en la máquina arcade o en la mesa de ping-pong con pelota rebotando.
- **En error:** Se levanta y salta con un globo de alerta `!` solicitando atención.

---

## 🚀 Inicio Rápido

### 1. Clonar e Instalar Dependencias
```bash
git clone https://github.com/RuntimeDevs/RuntimeClips-Web.git
cd RuntimeClips-Web
npm install
```

### 2. Ejecutar en Modo Desarrollo
```bash
npm run dev
```
Abre en tu navegador: [http://localhost:5173/](http://localhost:5173/)

### 3. Compilar para Producción
```bash
npm run build
```

---

## 🔌 Conexión con el Backend

El frontend cuenta con un selector en la barra superior para alternar entre dos modos:

1. **Simulación Local:** El pipeline corre de forma sintética en el navegador (ideal para diseñar interfaces y probar animaciones).
2. **Backend en Vivo:** Se conecta a tu servidor backend mediante HTTP REST y un canal de eventos en tiempo real (Server-Sent Events) en `http://localhost:3000`.

### Servidor Mock de Referencia Incluido
Para probar la conexión en vivo de inmediato sin necesidad de tener todo el backend listo:
```bash
npm run backend:mock
```
Esto levantará un servidor Node.js en `http://localhost:3000` con endpoints de inicio, pausa, reinicio y eventos SSE.

### Contrato de API
Para conocer todos los endpoints, formato de JSON y los 9 agentes del pipeline, revisa el archivo:
👉 **[API_CONTRACT.md](./API_CONTRACT.md)**

---

## 🧱 Estructura del Proyecto

```
RuntimeClips-Web/
├── mock-backend/              # Servidor HTTP + SSE de referencia en Node.js
│   └── server.js
├── public/                    # Assets estáticos (logos de agentes, iconos)
├── src/
│   ├── assets/                # Estilos CSS globales
│   ├── components/
│   │   ├── drawer/            # Inspector lateral de agente y reproductor de reels
│   │   ├── graph/             # Vista alternativa de diagrama en árbol (DAG)
│   │   └── office/            # Canvas 2D isométrico, TopBar y métricas KPI
│   ├── engine/
│   │   └── office2d/          # Motor Canvas 2D: A* pathfinding, layouts, Z-sorting, renderer
│   ├── services/
│   │   └── backendConnector.ts # Cliente SSE y REST con reconexión automática
│   ├── stores/                # Pinia stores (pipeline reactivo y simulación)
│   ├── types/                 # Interfaces TypeScript
│   ├── App.vue                # Componente raíz
│   └── main.ts                # Entrada principal
├── API_CONTRACT.md            # Especificación completa para el backend
├── README.md                  # Este archivo
└── package.json
```

---

## 🛠️ Tecnologías

- **Framework:** Vue 3 (Composition API `<script setup>`)
- **Build Tool:** Vite 6
- **Lenguaje:** TypeScript 5
- **Estado Global:** Pinia
- **Motor Gráfico:** Canvas 2D puro con algoritmo del pintor (Z-Sorting por profundidad) y pathfinding A*
- **Estilos:** CSS3 nativo con diseño oscuro y efectos de desenfoque (*backdrop-filter*)
