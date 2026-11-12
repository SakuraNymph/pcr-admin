<script lang="ts" setup>
import type {
  FeedbackDetail,
  FeedbackImage,
  FeedbackMessage,
} from '#/api/core/feedback';

import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

import { ChevronLeft, ChevronRight, X } from '@vben/icons';

import { ElAvatar, ElImage, ElImageViewer } from 'element-plus';

import { formatDateTime } from '../feedback-utils';

const props = defineProps<{
  detail: FeedbackDetail;
}>();

const previewImages = computed(() =>
  props.detail.messages.flatMap((message) => message.images),
);

const previewUrls = computed(() =>
  previewImages.value.map((image) => image.url),
);

const previewTotal = computed(() => previewImages.value.length);
const previewVisible = ref(false);
const previewIndex = ref(0);
const previewViewerRef = ref<null | {
  setActiveItem: (index: number) => void;
}>(null);

const userInitial = computed(() =>
  (props.detail.nickname || props.detail.user?.nickname || '用')
    .slice(0, 1)
    .toUpperCase(),
);

function getSenderLabel(message: FeedbackMessage) {
  return message.sender_type === 1
    ? props.detail.nickname || props.detail.user?.nickname || '用户'
    : '管理员';
}

function getPreviewIndex(image: FeedbackImage) {
  return previewImages.value.findIndex((item) => item.id === image.id);
}

function openPreview(image: FeedbackImage) {
  const index = getPreviewIndex(image);

  if (index < 0) {
    return;
  }

  previewIndex.value = index;
  previewVisible.value = true;
}

function closePreview() {
  previewVisible.value = false;
}

function handlePreviewSwitch(index: number) {
  previewIndex.value = index;
}

function showPreviousImage() {
  const total = previewTotal.value;

  if (total <= 1) {
    return;
  }

  const index = (previewIndex.value - 1 + total) % total;
  previewIndex.value = index;
  previewViewerRef.value?.setActiveItem(index);
}

function showNextImage() {
  const total = previewTotal.value;

  if (total <= 1) {
    return;
  }

  const index = (previewIndex.value + 1) % total;
  previewIndex.value = index;
  previewViewerRef.value?.setActiveItem(index);
}

function handleDocumentKeydown(event: KeyboardEvent) {
  if (!previewVisible.value) {
    return;
  }

  if (event.key === 'Escape') {
    event.preventDefault();
    event.stopPropagation();
    closePreview();
    return;
  }

  if (previewTotal.value <= 1) {
    return;
  }

  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    event.stopPropagation();
    showPreviousImage();
  } else if (event.key === 'ArrowRight') {
    event.preventDefault();
    event.stopPropagation();
    showNextImage();
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleDocumentKeydown, true);
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDocumentKeydown, true);
});
</script>

<template>
  <div class="conversation">
    <div
      v-for="message in detail.messages"
      :key="message.id"
      class="message-row"
      :class="{ 'is-admin': message.sender_type === 2 }"
    >
      <ElAvatar
        v-if="message.sender_type === 1"
        :size="36"
        :src="detail.user?.avatar_url || undefined"
        class="message-avatar"
      >
        {{ userInitial }}
      </ElAvatar>

      <div class="message-bubble">
        <div class="message-meta">
          <span class="message-sender">
            {{ getSenderLabel(message) }}
          </span>
          <span class="message-time">
            {{ formatDateTime(message.created_at) }}
          </span>
        </div>

        <div v-if="message.content" class="message-content">
          {{ message.content }}
        </div>

        <div v-if="message.images.length > 0" class="message-images">
          <button
            v-for="image in message.images"
            :key="image.id"
            type="button"
            class="message-image-button"
            :aria-label="`预览图片：${image.original_name}`"
            @click="openPreview(image)"
          >
            <ElImage
              :src="image.url"
              :alt="image.original_name"
              class="message-image"
              fit="cover"
            >
              <template #error>
                <div class="image-error">图片失效</div>
              </template>
            </ElImage>
          </button>
        </div>
      </div>

      <ElAvatar
        v-if="message.sender_type === 2"
        :size="36"
        class="message-avatar admin-avatar"
      >
        管
      </ElAvatar>
    </div>

    <div v-if="detail.messages.length === 0" class="conversation-empty">
      暂无消息记录
    </div>

    <Teleport to="body">
      <div
        v-if="previewVisible"
        class="feedback-image-viewer"
        role="dialog"
        aria-modal="true"
        aria-label="图片预览"
      >
        <ElImageViewer
          ref="previewViewerRef"
          :url-list="previewUrls"
          :initial-index="previewIndex"
          :teleported="false"
          :hide-on-click-modal="true"
          :close-on-press-escape="true"
          infinite
          @close="closePreview"
          @switch="handlePreviewSwitch"
        >
          <div class="feedback-image-viewer__controls">
            <div
              class="feedback-image-viewer__progress"
              role="status"
              aria-live="polite"
              :aria-label="`第 ${previewIndex + 1} 张，共 ${previewTotal} 张`"
            >
              {{ previewIndex + 1 }} / {{ previewTotal }}
            </div>

            <button
              type="button"
              class="feedback-image-viewer__control feedback-image-viewer__close"
              aria-label="关闭图片预览"
              aria-keyshortcuts="Escape"
              title="关闭图片预览（Esc）"
              @click.stop="closePreview"
            >
              <X aria-hidden="true" />
            </button>

            <template v-if="previewTotal > 1">
              <button
                type="button"
                class="feedback-image-viewer__control feedback-image-viewer__previous"
                aria-label="上一张图片"
                aria-keyshortcuts="ArrowLeft"
                title="上一张图片（←）"
                @click.stop="showPreviousImage"
              >
                <ChevronLeft aria-hidden="true" />
              </button>

              <button
                type="button"
                class="feedback-image-viewer__control feedback-image-viewer__next"
                aria-label="下一张图片"
                aria-keyshortcuts="ArrowRight"
                title="下一张图片（→）"
                @click.stop="showNextImage"
              >
                <ChevronRight aria-hidden="true" />
              </button>
            </template>
          </div>

          <template #viewer-error>
            <div class="feedback-image-viewer__error">
              图片加载失败，请关闭后刷新详情
            </div>
          </template>
        </ElImageViewer>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.conversation {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 4px 0 24px;
}

.message-row {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.message-row.is-admin {
  justify-content: flex-end;
}

.message-avatar {
  flex: 0 0 auto;
  margin-top: 2px;
}

.admin-avatar {
  background: var(--el-color-primary);
  color: #fff;
}

.message-bubble {
  max-width: 78%;
  padding: 12px 14px;
  background: var(--el-fill-color-light);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.message-row.is-admin .message-bubble {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary-light-7);
}

.message-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.message-sender {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.message-content {
  font-size: 14px;
  line-height: 1.75;
  color: var(--el-text-color-primary);
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.message-images {
  display: grid;
  grid-template-columns: repeat(3, 88px);
  gap: 8px;
  margin-top: 10px;
}

.message-image-button {
  width: 88px;
  height: 88px;
  padding: 0;
  overflow: hidden;
  cursor: zoom-in;
  background: transparent;
  border: 0;
  border-radius: 8px;
  transition:
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.message-image-button:hover {
  box-shadow: 0 0 0 2px var(--el-color-primary-light-5);
}

.message-image-button:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: 2px;
}

.message-image {
  width: 100%;
  height: 100%;
  border-radius: 8px;
}

.image-error {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  background: var(--el-fill-color);
}

.conversation-empty {
  padding: 28px 0;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.feedback-image-viewer :deep(.el-image-viewer__close),
.feedback-image-viewer :deep(.el-image-viewer__next),
.feedback-image-viewer :deep(.el-image-viewer__prev) {
  display: none;
}

.feedback-image-viewer :deep(.el-image-viewer__canvas) {
  box-sizing: border-box;
  padding: 72px 96px 104px;
}

.feedback-image-viewer__controls {
  position: absolute;
  inset: 0;
  z-index: 2;
  pointer-events: none;
}

.feedback-image-viewer__control {
  position: absolute;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  padding: 0;
  color: #fff;
  pointer-events: auto;
  cursor: pointer;
  background: rgb(0 0 0 / 62%);
  border: 1px solid rgb(255 255 255 / 26%);
  border-radius: 50%;
  box-shadow: 0 4px 14px rgb(0 0 0 / 18%);
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    transform 0.2s ease;
}

.feedback-image-viewer__control:hover {
  background: rgb(0 0 0 / 80%);
  border-color: rgb(255 255 255 / 46%);
}

.feedback-image-viewer__control:focus-visible {
  outline: 2px solid var(--el-color-primary-light-3);
  outline-offset: 3px;
}

.feedback-image-viewer__close {
  top: 24px;
  right: 24px;
}

.feedback-image-viewer__close:hover {
  transform: scale(1.05);
}

.feedback-image-viewer__previous,
.feedback-image-viewer__next {
  top: 50%;
  transform: translateY(-50%);
}

.feedback-image-viewer__previous {
  left: 24px;
}

.feedback-image-viewer__next {
  right: 24px;
}

.feedback-image-viewer__previous:hover,
.feedback-image-viewer__next:hover {
  transform: translateY(-50%) scale(1.05);
}

.feedback-image-viewer__previous:active,
.feedback-image-viewer__next:active {
  transform: translateY(-50%) scale(0.96);
}

.feedback-image-viewer__progress {
  position: absolute;
  top: 24px;
  left: 24px;
  padding: 7px 12px;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  color: #fff;
  background: rgb(0 0 0 / 62%);
  border: 1px solid rgb(255 255 255 / 22%);
  border-radius: 999px;
}

.feedback-image-viewer__error {
  max-width: min(420px, calc(100vw - 48px));
  padding: 20px 24px;
  color: #fff;
  text-align: center;
  background: rgb(0 0 0 / 55%);
  border: 1px solid rgb(255 255 255 / 18%);
  border-radius: 12px;
}

@media (max-width: 700px) {
  .message-bubble {
    max-width: 86%;
  }

  .message-images {
    grid-template-columns: repeat(3, 76px);
  }

  .message-image-button {
    width: 76px;
    height: 76px;
  }

  .feedback-image-viewer :deep(.el-image-viewer__canvas) {
    padding: 68px 64px 92px;
  }

  .feedback-image-viewer :deep(.el-image-viewer__actions) {
    bottom: 18px;
  }

  .feedback-image-viewer__control {
    width: 48px;
    height: 48px;
  }

  .feedback-image-viewer__close {
    top: 12px;
    right: 12px;
  }

  .feedback-image-viewer__previous {
    left: 12px;
  }

  .feedback-image-viewer__next {
    right: 12px;
  }

  .feedback-image-viewer__progress {
    top: 14px;
    left: 12px;
    padding: 6px 10px;
    font-size: 12px;
  }
}
</style>
