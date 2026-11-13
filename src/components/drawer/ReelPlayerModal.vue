<script setup lang="ts">
import { usePipelineStore } from '@/stores/pipeline';
import { Download, Package } from 'lucide-vue-next';

const store = usePipelineStore();
</script>

<template>
  <div v-if="store.isPlayerOpen" class="modal-backdrop" @click.self="store.isPlayerOpen = false">
    <div class="cinema-modal">
      <div class="modal-header">
        <div class="header-title">
          <span>🎬</span>
          <span>Sala de Proyección — Reels 9:16</span>
        </div>
        <button
          type="button"
          class="modal-close-btn"
          title="Cerrar reproductor"
          @click="store.isPlayerOpen = false"
        >
          ✕
        </button>
      </div>

      <div class="modal-body">
        <!-- 1. Banner de descarga .ZIP maestro -->
        <div v-if="store.pipeline.output?.zipUrl" class="zip-download-banner">
          <div class="zip-icon-box">
            <Package :size="24" class="zip-icon" />
          </div>
          <div class="zip-info">
            <h4>{{ store.pipeline.output.totalClips || 0 }} Reels Listos en Paquete</h4>
            <p>{{ store.pipeline.output.zipFile }} ({{ store.pipeline.output.zipSizeMb }})</p>
          </div>
          <a
            :href="store.pipeline.output.zipUrl"
            :download="store.pipeline.output.zipFile || 'clips.zip'"
            class="zip-btn"
          >
            <Download :size="14" />
            <span>Descargar .ZIP</span>
          </a>
        </div>

        <div class="cinema-split">
          <!-- 2. Pantalla de Cine 9:16 -->
          <div class="player-screen-box">
            <div v-if="store.activePreviewClip?.videoUrl" class="video-container">
              <video
                :src="store.activePreviewClip.videoUrl"
                controls
                autoplay
                playsinline
                class="reel-video"
              ></video>
              <a
                :href="store.activePreviewClip.videoUrl"
                :download="store.activePreviewClip.file || 'reel.mp4'"
                class="download-single-btn"
              >
                <Download :size="13" />
                <span>Descargar este Reel</span>
              </a>
            </div>
            <div v-else class="video-placeholder">
              <p>Selecciona un Reel de la cartelera para reproducir.</p>
            </div>
          </div>

          <!-- 3. Cartelera de Reels -->
          <div class="gallery-column">
            <h4 class="gallery-heading">Cartelera de Reels</h4>
            <div class="gallery-scroll">
              <div
                v-for="(clip, idx) in store.pipeline.output?.clips || []"
                :key="clip.id || idx"
                class="gallery-item"
                :class="{ active: store.activePreviewClip?.file === clip.file }"
                @click="store.activePreviewClip = clip"
              >
                <div class="gallery-item-top">
                  <span class="reel-badge">Reel #{{ idx + 1 }}</span>
                  <span class="score-badge">{{ clip.scorePercent || 90 }}% viral</span>
                </div>
                <div class="gallery-item-title">{{ clip.title }}</div>
                <div class="gallery-item-meta">
                  <span>⏱ {{ clip.durationSec.toFixed(1) }}s</span>
                  <span>{{ clip.sizeMb }}</span>
                </div>
              </div>

              <div v-if="!(store.pipeline.output?.clips?.length)" class="no-clips">
                <p>Aún no hay clips generados. Inicia el pipeline para verlos aquí.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.cinema-modal {
  width: 720px;
  max-width: 92vw;
  max-height: 90vh;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(30, 41, 59, 0.6);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
}

.modal-close-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 16px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.15s;
}

.modal-close-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #ffffff;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.zip-download-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 18px;
  background: linear-gradient(135deg, rgba(2, 132, 199, 0.15), rgba(56, 189, 248, 0.1));
  border: 1px solid rgba(56, 189, 248, 0.3);
  border-radius: 12px;
  gap: 16px;
}

.zip-icon-box {
  color: #38bdf8;
}

.zip-info {
  flex: 1;
}

.zip-info h4 {
  margin: 0;
  font-size: 14px;
  color: #f8fafc;
}

.zip-info p {
  margin: 2px 0 0 0;
  font-size: 12px;
  color: #94a3b8;
}

.zip-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: #0284c7;
  color: #ffffff;
  font-size: 12px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 8px;
  transition: all 0.15s;
}

.zip-btn:hover {
  background: #0369a1;
}

.cinema-split {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: 20px;
}

.player-screen-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: #020617;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 12px;
}

.video-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  gap: 10px;
}

.reel-video {
  width: 100%;
  max-height: 420px;
  border-radius: 8px;
  background: #000000;
}

.download-single-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
  border-radius: 6px;
}

.video-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 380px;
  text-align: center;
  color: #64748b;
  font-size: 12px;
  padding: 20px;
}

.gallery-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gallery-heading {
  margin: 0;
  font-size: 13px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.gallery-scroll {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 440px;
  overflow-y: auto;
}

.gallery-item {
  padding: 12px 14px;
  background: rgba(30, 41, 59, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.gallery-item:hover {
  background: rgba(30, 41, 59, 0.8);
  border-color: rgba(56, 189, 248, 0.3);
}

.gallery-item.active {
  border-color: #38bdf8;
  background: rgba(56, 189, 248, 0.1);
}

.gallery-item-top {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  margin-bottom: 6px;
}

.reel-badge {
  font-weight: 700;
  color: #38bdf8;
}

.score-badge {
  color: #4ade80;
  font-weight: 600;
}

.gallery-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #f1f5f9;
  line-height: 1.4;
  margin-bottom: 8px;
}

.gallery-item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #94a3b8;
}

.no-clips {
  padding: 30px;
  text-align: center;
  color: #64748b;
  font-size: 13px;
}
</style>
