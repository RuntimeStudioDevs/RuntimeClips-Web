<script setup lang="ts">
import { usePipelineStore } from '@/stores/pipeline';
import { Download, Package } from 'lucide-vue-next';

const store = usePipelineStore();
</script>

<template>
  <div v-if="store.isPlayerOpen" class="habbo-cinema-modal habbo-window">
    <div class="habbo-window-header">
      <span>🎬 Sala de Proyección Habbo — Reels 9:16</span>
      <button
        type="button"
        class="habbo-close-btn"
        title="Cerrar Cine"
        @click="store.isPlayerOpen = false"
      >
        ✕
      </button>
    </div>

    <div class="cinema-content habbo-box-inset">
      <!-- 1. Banner de descarga .ZIP maestro -->
      <div v-if="store.pipeline.output?.zipUrl" class="zip-download-banner habbo-box">
        <Package :size="24" class="zip-icon" />
        <div class="zip-info">
          <h4>{{ store.pipeline.output.totalClips || 0 }} Reels Listos en Paquete</h4>
          <p>{{ store.pipeline.output.zipFile }} ({{ store.pipeline.output.zipSizeMb }} MB)</p>
        </div>
        <a
          :href="store.pipeline.output.zipUrl"
          :download="store.pipeline.output.zipFile || 'clips.zip'"
          class="habbo-btn habbo-btn-gold"
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
              class="habbo-btn download-single-btn"
            >
              <Download :size="12" />
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
              class="gallery-item habbo-box"
              :class="{ active: store.activePreviewClip?.file === clip.file }"
              @click="store.activePreviewClip = clip"
            >
              <div class="gallery-item-top">
                <span>Reel #{{ idx + 1 }}</span>
                <span class="score">{{ clip.scorePercent || 90 }}% viral</span>
              </div>
              <div class="gallery-item-title">{{ clip.title }}</div>
              <div class="gallery-item-meta">
                <span>⏱ {{ clip.durationSec.toFixed(1) }}s</span>
                <span>{{ clip.sizeMb }} MB</span>
              </div>
            </div>

            <div v-if="!(store.pipeline.output?.clips?.length)" class="no-clips">
              <p>Aún no hay clips generados. Inicia un video o pulsa 'Simular' para verlos aquí.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.habbo-cinema-modal {
  width: 680px;
  max-width: 90vw;
  height: 540px;
  max-height: 85vh;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
}

.cinema-content {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
}

.zip-download-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #1e3a5f;
}

.zip-icon {
  color: var(--habbo-gold);
}

.zip-info {
  flex: 1;
}

.zip-info h4 {
  margin: 0;
  font-size: 12px;
  color: #ffffff;
}

.zip-info p {
  margin: 0;
  font-size: 10px;
  color: #94a3b8;
}

.cinema-split {
  flex: 1;
  display: flex;
  gap: 12px;
  min-height: 0;
}

.player-screen-box {
  width: 250px;
  height: 100%;
  background: #000000;
  border: 2px solid #000000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.video-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.reel-video {
  flex: 1;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.download-single-btn {
  margin-top: 4px;
  width: 100%;
  text-decoration: none;
}

.video-placeholder {
  color: #64748b;
  text-align: center;
  padding: 20px;
  font-size: 11px;
}

.gallery-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.gallery-heading {
  margin: 0 0 6px 0;
  font-size: 11px;
  color: var(--habbo-gold);
}

.gallery-scroll {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-right: 4px;
}

.gallery-item {
  padding: 8px 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.gallery-item:hover {
  filter: brightness(1.15);
}

.gallery-item.active {
  outline: 2px solid var(--habbo-gold);
}

.gallery-item-top {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #94a3b8;
}

.gallery-item-top .score {
  color: var(--habbo-gold);
  font-weight: bold;
}

.gallery-item-title {
  font-size: 11px;
  font-weight: bold;
  color: #ffffff;
  margin: 2px 0;
}

.gallery-item-meta {
  display: flex;
  justify-content: space-between;
  font-size: 9px;
  color: #64748b;
}

.no-clips {
  color: #64748b;
  text-align: center;
  padding: 30px 10px;
  font-size: 11px;
}
</style>
