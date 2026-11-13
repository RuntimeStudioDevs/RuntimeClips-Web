<script setup lang="ts">
import type { HabboSpeechBubble } from '@/types/pipeline';

defineProps<{
  bubble: HabboSpeechBubble;
}>();
</script>

<template>
  <div
    class="habbo-speech-bubble"
    :style="{
      left: `${bubble.screenX}px`,
      top: `${bubble.screenY}px`,
    }"
  >
    <div class="bubble-content">
      <span class="bubble-avatar-badge">{{ bubble.agentName.charAt(0) }}</span>
      <span class="bubble-text">
        <b>{{ bubble.agentName }}:</b> {{ bubble.text }}
      </span>
    </div>
    <!-- Puntero triangular hacia la cabeza -->
    <div class="bubble-pointer"></div>
  </div>
</template>

<style scoped>
.habbo-speech-bubble {
  position: absolute;
  transform: translate(-50%, -100%);
  z-index: 50;
  pointer-events: none;
  animation: bubble-pop 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.bubble-content {
  display: flex;
  align-items: center;
  gap: 6px;
  background-color: var(--habbo-bubble-bg);
  color: #000000;
  border: 1px solid #000000;
  box-shadow: 2px 2px 0px rgba(0, 0, 0, 0.4);
  padding: 4px 10px;
  border-radius: 6px;
  max-width: 280px;
  font-family: var(--font-pixel);
  font-size: 11px;
  line-height: 1.3;
  letter-spacing: 0.2px;
}

.bubble-avatar-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  background: var(--habbo-navy);
  color: #ffffff;
  border: 1px solid #000000;
  border-radius: 3px;
  font-size: 10px;
  font-weight: bold;
  flex-shrink: 0;
}

.bubble-text b {
  color: #1e3a8a;
  margin-right: 3px;
}

.bubble-pointer {
  position: absolute;
  left: 50%;
  bottom: -6px;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 6px solid transparent;
  border-right: 6px solid transparent;
  border-top: 6px solid #000000;
}

.bubble-pointer::after {
  content: '';
  position: absolute;
  left: -5px;
  top: -7px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--habbo-bubble-bg);
}

@keyframes bubble-pop {
  0% {
    opacity: 0;
    transform: translate(-50%, -85%) scale(0.85);
  }
  100% {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
  }
}
</style>
