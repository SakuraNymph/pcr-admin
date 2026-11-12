<script lang="ts" setup>
import type { UploadFile, UploadUserFile } from 'element-plus';

import type { FeedbackReplyResult } from '#/api/core/feedback';

import { computed, ref, watch } from 'vue';

import {
  ElButton,
  ElInput,
  ElMessage,
  ElUpload,
} from 'element-plus';

import { replyFeedbackApi } from '#/api/core/feedback';

import {
  MAX_FEEDBACK_IMAGES,
  validateFeedbackImage,
} from '../feedback-utils';

const props = defineProps<{
  feedbackId: number;
}>();

const emit = defineEmits<{
  dirtyChange: [value: boolean];
  sent: [
    payload: { feedbackId: number; result: FeedbackReplyResult },
  ];
}>();

const content = ref('');
const fileList = ref<UploadUserFile[]>([]);
const sending = ref(false);
const uploadPercent = ref<null | number>(null);

const isDirty = computed(() => {
  return content.value.trim().length > 0 || fileList.value.length > 0;
});

const canSubmit = computed(() => {
  return !sending.value && isDirty.value;
});

watch(
  isDirty,
  (value) => {
    emit('dirtyChange', value);
  },
  { immediate: true },
);

function handleFileChange(
  uploadFile: UploadFile,
  uploadFiles: UploadFile[],
) {
  if (!uploadFile.raw) {
    return;
  }

  const error = validateFeedbackImage(uploadFile.raw);

  if (error) {
    ElMessage.warning(error);
    fileList.value = uploadFiles.filter(
      (file) => file.uid !== uploadFile.uid,
    );
  }
}

function handleExceed() {
  ElMessage.warning(`每条回复最多上传 ${MAX_FEEDBACK_IMAGES} 张图片`);
}

async function handleSend() {
  if (sending.value) {
    return;
  }

  const text = content.value.trim();
  const files: File[] = [];

  for (const file of fileList.value) {
    if (file.raw) {
      files.push(file.raw);
    }
  }

  if (!text && files.length === 0) {
    ElMessage.warning('请输入回复内容或至少上传一张图片');
    return;
  }

  sending.value = true;
  uploadPercent.value = files.length > 0 ? 0 : null;

  const feedbackId = props.feedbackId;

  try {
    const result = await replyFeedbackApi(
      feedbackId,
      { content: text, files },
      (percent) => {
        uploadPercent.value = percent;
      },
    );

    content.value = '';
    fileList.value = [];
    emit('sent', { feedbackId, result });
    ElMessage.success('回复已发送');
  } catch (error) {
    console.error('发送意见反馈回复失败:', error);
  } finally {
    sending.value = false;
    uploadPercent.value = null;
  }
}
</script>

<template>
  <div class="reply-composer">
    <div class="composer-heading">
      <span class="composer-title">回复用户</span>
      <span class="composer-tip">
        支持文字和图片，发送后不可修改
      </span>
    </div>

    <ElInput
      v-model="content"
      type="textarea"
      :rows="3"
      :maxlength="1000"
      resize="none"
      show-word-limit
      placeholder="请输入回复内容，也可以只发送图片"
      :disabled="sending"
    />

    <div class="composer-actions">
      <ElUpload
        v-model:file-list="fileList"
        action="#"
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        :auto-upload="false"
        :disabled="sending"
        :limit="MAX_FEEDBACK_IMAGES"
        list-type="picture-card"
        multiple
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
      >
        <div class="upload-trigger">
          <span class="upload-plus">+</span>
          <span>图片</span>
        </div>
      </ElUpload>

      <div class="send-area">
        <span v-if="sending" class="upload-progress">
          {{
            uploadPercent === null
              ? '发送中...'
              : `上传中 ${uploadPercent}%`
          }}
        </span>
        <ElButton
          type="primary"
          :disabled="!canSubmit"
          :loading="sending"
          @click="handleSend"
        >
          发送回复
        </ElButton>
      </div>
    </div>

    <div class="composer-note">
      最多 {{ MAX_FEEDBACK_IMAGES }} 张图片，单张不超过 5MB，仅支持
      JPG、PNG、WEBP。
    </div>
  </div>
</template>

<style scoped>
.reply-composer {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.composer-heading,
.composer-actions {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}

.composer-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.composer-tip,
.composer-note,
.upload-progress {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.composer-actions {
  align-items: flex-end;
}

.reply-composer :deep(.el-upload--picture-card),
.reply-composer :deep(.el-upload-list--picture-card .el-upload-list__item) {
  width: 72px;
  height: 72px;
}

.reply-composer :deep(.el-upload-list--picture-card) {
  display: flex;
  gap: 8px;
}

.upload-trigger {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.upload-plus {
  font-size: 20px;
  line-height: 1;
}

.send-area {
  display: flex;
  gap: 12px;
  align-items: center;
}

@media (max-width: 700px) {
  .composer-heading {
    align-items: flex-start;
    flex-direction: column;
    gap: 2px;
  }

  .composer-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .send-area {
    justify-content: flex-end;
  }
}
</style>
