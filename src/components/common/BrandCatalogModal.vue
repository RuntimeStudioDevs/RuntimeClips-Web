<script setup lang="ts">
import { usePipelineStore } from '@/stores/pipeline';
import { Palette, Check } from 'lucide-vue-next';

const store = usePipelineStore();
</script>

<template>
  <div v-if="store.isCatalogOpen" class="habbo-catalog-modal habbo-window">
    <div class="habbo-window-header">
      <span>🛍️ Catálogo Habbo — Brand Kits & Estilos</span>
      <button
        type="button"
        class="habbo-close-btn"
        title="Cerrar Catálogo"
        @click="store.isCatalogOpen = false"
      >
        ✕
      </button>
    </div>

    <div class="catalog-content habbo-box-inset">
      <div class="catalog-sidebar">
        <h4 class="cat-title">Secciones</h4>
        <button type="button" class="cat-nav-item active">
          <Palette :size="14" />
          <span>Brand Kits</span>
        </button>
      </div>

      <div class="catalog-main">
        <h3 class="brand-title">Identidad Visual de Video</h3>
        <p class="brand-desc">
          Elige el Brand Kit que se aplicará a los tercios inferiores, fuentes y paletas de color de tus Reels.
        </p>

        <div class="brand-cards-grid">
          <div
            v-for="brand in store.brands"
            :key="brand.id"
            class="brand-card habbo-box"
            :class="{ selected: store.selectedBrand === brand.id }"
            @click="store.selectedBrand = brand.id"
          >
            <div class="brand-card-top">
              <span class="brand-name">{{ brand.name }}</span>
              <Check v-if="store.selectedBrand === brand.id" :size="16" class="check-icon" />
            </div>

            <!-- Previsualización de paleta -->
            <div class="palette-swatches">
              <span class="swatch" style="background-color: #ff6d5a"></span>
              <span class="swatch" style="background-color: #ffe600"></span>
              <span class="swatch" style="background-color: #0d0e12"></span>
              <span class="swatch" style="background-color: #ffffff"></span>
            </div>

            <div class="brand-badge">
              <span>{{ store.selectedBrand === brand.id ? 'Seleccionado' : 'Usar este kit' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.habbo-catalog-modal {
  width: 560px;
  max-width: 90vw;
  height: 380px;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
}

.catalog-content {
  flex: 1;
  display: flex;
  padding: 10px;
  gap: 12px;
}

.catalog-sidebar {
  width: 140px;
  border-right: 1px solid var(--habbo-bevel-dark);
  padding-right: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.cat-title {
  margin: 0 0 6px 0;
  font-size: 11px;
  color: var(--habbo-gold);
}

.cat-nav-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  background: var(--habbo-navy);
  color: #ffffff;
  border: 1px solid var(--habbo-bevel-dark);
  font-family: var(--font-pixel);
  font-size: 11px;
  cursor: pointer;
  text-align: left;
}

.cat-nav-item.active {
  background: #2563eb;
  border-color: var(--habbo-gold);
}

.catalog-main {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.brand-title {
  margin: 0;
  font-size: 13px;
  color: var(--habbo-gold);
}

.brand-desc {
  margin: 4px 0 12px 0;
  font-size: 10px;
  color: #94a3b8;
  line-height: 1.3;
}

.brand-cards-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.brand-card {
  padding: 10px;
  cursor: pointer;
  transition: all 0.15s;
}

.brand-card:hover {
  filter: brightness(1.15);
}

.brand-card.selected {
  outline: 2px solid var(--habbo-gold);
}

.brand-card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.brand-name {
  font-size: 11px;
  font-weight: bold;
  color: #ffffff;
}

.check-icon {
  color: var(--habbo-gold);
}

.palette-swatches {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
}

.swatch {
  width: 18px;
  height: 18px;
  border: 1px solid #000000;
  border-radius: 2px;
}

.brand-badge {
  font-size: 9px;
  color: var(--habbo-gold);
  text-align: right;
}
</style>
