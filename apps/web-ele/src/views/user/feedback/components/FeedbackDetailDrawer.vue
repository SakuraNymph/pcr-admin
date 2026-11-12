<script lang="ts" setup>
import type {
  FeedbackDetail,
  FeedbackReplyResult,
  FeedbackStatus,
  FeedbackStatusUpdateResult,
} from '#/api/core/feedback';

import { computed, nextTick, ref, watch } from 'vue';

import { useMediaQuery } from '@vueuse/core';
import {
  ElAvatar,
  ElButton,
  ElDescriptions,
  ElDescriptionsItem,
  ElDrawer,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTag,
} from 'element-plus';

import {
  getFeedbackDetailApi,
  markFeedbackReadApi,
  updateFeedbackStatusApi,
} from '#/api/core/feedback';

import {
  FEEDBACK_STATUS_OPTIONS,
  feedbackStatusTagType,
  formatDateTime,
} from '../feedback-utils';
import FeedbackConversation from './FeedbackConversation.vue';
import FeedbackReplyComposer from './FeedbackReplyComposer.vue';

const props = defineProps<{
  canMarkRead: boolean;
  canReply: boolean;
  canUpdateStatus: boolean;
  canViewDetail: boolean;
  feedbackId: null | number;
  modelValue: boolean;
}>();

const emit = defineEmits<{
  closed: [];
  readUpdated: [payload: { feedbackId: number; unreadCount: number }];
  replySent: [
    payload: { feedbackId: number; result: FeedbackReplyResult },
  ];
  statusUpdated: [
    payload: { feedbackId: number; result: FeedbackStatusUpdateResult },
  ];
  'update:modelValue': [value: boolean];
}>();

const isMobile = useMediaQuery('(max-width: 900px)');

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
});

const drawerSize = computed(() => (isMobile.value ? '100%' : '860px'));

const descriptionColumns = computed(() => (isMobile.value ? 1 : 2));

const detail = ref<FeedbackDetail | null>(null);
const detailError = ref('');
const detailLoading = ref(false);
const statusDraft = ref<FeedbackStatus>(0);
const statusUpdating = ref(false);
const readInFlight = ref(false);
const replyDraftDirty = ref(false);
const closeConfirmationInFlight = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

let requestSequence = 0;

const statusChanged = computed(() => {
  return Boolean(detail.value && statusDraft.value !== detail.value.status);
});

const userInitial = computed(() => {
  return (
    detail.value?.nickname ||
    detail.value?.user?.nickname ||
    '用'
  )
    .slice(0, 1)
    .toUpperCase();
});

const clientSummary = computed(() => {
  if (!detail.value) {
    return '-';
  }

  const parts = [
    detail.value.client_type,
    detail.value.client_version,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(' / ') : '-';
});

watch(
  () => [props.modelValue, props.feedbackId] as const,
  ([open, feedbackId]) => {
    if (open && feedbackId) {
      resetDetail();
      void loadDetail();
    }
  },
);

function resetDetail() {
  detail.value = null;
  detailError.value = '';
  replyDraftDirty.value = false;
  statusDraft.value = 0;
}

async function loadDetail() {
  const feedbackId = props.feedbackId;

  if (!feedbackId) {
    return;
  }

  if (!props.canViewDetail) {
    detailError.value = '当前账号没有查看意见反馈详情的权限';
    return;
  }

  const sequence = ++requestSequence;

  detailLoading.value = true;
  detailError.value = '';

  try {
    const result = await getFeedbackDetailApi(feedbackId);

    if (
      sequence !== requestSequence ||
      !props.modelValue ||
      props.feedbackId !== feedbackId
    ) {
      return;
    }

    detail.value = result;
    statusDraft.value = result.status;

    await nextTick();
    scrollToBottom();
    void markReadIfNeeded(result);
  } catch (error) {
    console.error('获取意见反馈详情失败:', error);

    if (sequence === requestSequence && !detail.value) {
      detailError.value = '获取意见反馈详情失败';
    }
  } finally {
    if (sequence === requestSequence) {
      detailLoading.value = false;
    }
  }
}

async function markReadIfNeeded(current: FeedbackDetail) {
  if (
    !props.canMarkRead ||
    current.unread_count <= 0 ||
    readInFlight.value
  ) {
    return;
  }

  let lastUserMessage = null;

  for (let index = current.messages.length - 1; index >= 0; index -= 1) {
    const message = current.messages[index];

    if (message?.sender_type === 1) {
      lastUserMessage = message;
      break;
    }
  }

  if (!lastUserMessage) {
    return;
  }

  readInFlight.value = true;

  try {
    const result = await markFeedbackReadApi(
      current.id,
      lastUserMessage.id,
    );

    if (detail.value?.id === current.id) {
      detail.value = {
        ...detail.value,
        unread_count: result.unread_count,
      };
    }

    emit('readUpdated', {
      feedbackId: current.id,
      unreadCount: result.unread_count,
    });
  } catch (error) {
    console.warn('标记意见反馈已读失败:', error);
  } finally {
    readInFlight.value = false;
  }
}

function scrollToBottom() {
  const container = scrollContainer.value;

  if (container) {
    container.scrollTop = container.scrollHeight;
  }
}

async function handleUpdateStatus() {
  if (
    !detail.value ||
    !props.canUpdateStatus ||
    !statusChanged.value ||
    statusUpdating.value
  ) {
    return;
  }

  const feedbackId = detail.value.id;
  statusUpdating.value = true;

  try {
    const result = await updateFeedbackStatusApi(
      feedbackId,
      statusDraft.value,
    );

    if (detail.value?.id === feedbackId) {
      detail.value = {
        ...detail.value,
        status: result.status,
        status_name: result.status_name,
      };
    }

    emit('statusUpdated', { feedbackId, result });
    ElMessage.success('反馈状态更新成功');
  } catch (error) {
    console.error('更新意见反馈状态失败:', error);
  } finally {
    statusUpdating.value = false;
  }
}

async function handleReplySent(payload: {
  feedbackId: number;
  result: FeedbackReplyResult;
}) {
  const { feedbackId, result } = payload;

  if (detail.value?.id !== feedbackId) {
    emit('replySent', payload);
    return;
  }

  detail.value = {
    ...detail.value,
    last_message_at: result.last_message_at,
    messages: [...detail.value.messages, result.message],
    status: result.status,
    status_name: result.status_name,
  };
  statusDraft.value = result.status;

  emit('replySent', { feedbackId, result });

  await nextTick();
  scrollToBottom();
}

function handleReplyDraftChange(dirty: boolean) {
  replyDraftDirty.value = dirty;
}

async function handleBeforeClose(done: () => void) {
  if (!replyDraftDirty.value) {
    done();
    return;
  }

  if (closeConfirmationInFlight.value) {
    return;
  }

  closeConfirmationInFlight.value = true;

  try {
    await ElMessageBox.confirm(
      '回复内容或图片尚未发送，关闭后草稿将丢失。是否继续关闭？',
      '关闭意见反馈详情',
      {
        cancelButtonText: '继续编辑',
        confirmButtonText: '关闭',
        type: 'warning',
      },
    );

    replyDraftDirty.value = false;
    done();
  } catch {
    return;
  } finally {
    closeConfirmationInFlight.value = false;
  }
}

function handleClosed() {
  requestSequence += 1;
  detailLoading.value = false;
  resetDetail();
  emit('closed');
}
</script>

<template>
  <ElDrawer
    v-model="visible"
    class="feedback-detail-drawer"
    title="意见反馈详情"
    :size="drawerSize"
    :before-close="handleBeforeClose"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    destroy-on-close
    @closed="handleClosed"
  >
    <div v-loading="detailLoading" class="feedback-detail">
      <div ref="scrollContainer" class="feedback-detail__scroll">
        <template v-if="detail">
          <section class="detail-summary">
            <div class="summary-heading">
              <div class="summary-copy">
                <h2 class="summary-title">{{ detail.title }}</h2>
                <div class="summary-tags">
                  <ElTag
                    :type="feedbackStatusTagType(detail.status)"
                    effect="light"
                  >
                    {{ detail.status_name }}
                  </ElTag>
                  <ElTag type="info" effect="plain">
                    {{ detail.category_name }}
                  </ElTag>
                  <ElTag
                    v-if="detail.unread_count > 0"
                    type="danger"
                    effect="light"
                  >
                    {{ detail.unread_count }} 条未读
                  </ElTag>
                </div>
              </div>

              <ElButton
                :loading="detailLoading"
                @click="loadDetail"
              >
                刷新
              </ElButton>
            </div>

            <div class="summary-user">
              <ElAvatar
                :size="44"
                :src="detail.user?.avatar_url || undefined"
              >
                {{ userInitial }}
              </ElAvatar>
              <div class="summary-user__copy">
                <div class="summary-user__name">
                  {{ detail.nickname || '未设置昵称' }}
                </div>
                <div class="summary-user__meta">
                  UID {{ detail.public_uid }}
                  <span v-if="detail.user?.registered_at">
                    · 注册于
                    {{ formatDateTime(detail.user.registered_at) }}
                  </span>
                </div>
              </div>
            </div>

            <ElDescriptions
              :column="descriptionColumns"
              border
              size="small"
              class="summary-descriptions"
            >
              <ElDescriptionsItem label="反馈 ID">
                {{ detail.id }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="分类">
                {{ detail.category_name }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="提交时间">
                {{ formatDateTime(detail.created_at) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="最后消息">
                {{ formatDateTime(detail.last_message_at) }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="客户端">
                {{ clientSummary }}
              </ElDescriptionsItem>
              <ElDescriptionsItem label="当前状态">
                <ElTag
                  :type="feedbackStatusTagType(detail.status)"
                  size="small"
                >
                  {{ detail.status_name }}
                </ElTag>
              </ElDescriptionsItem>
            </ElDescriptions>

            <div v-if="canUpdateStatus" class="status-editor">
              <span class="status-editor__label">修改状态</span>
              <ElSelect
                v-model="statusDraft"
                class="status-editor__select"
                :disabled="statusUpdating"
              >
                <ElOption
                  v-for="option in FEEDBACK_STATUS_OPTIONS"
                  :key="option.value"
                  :label="option.label"
                  :value="option.value"
                />
              </ElSelect>
              <ElButton
                type="primary"
                plain
                :disabled="!statusChanged || statusUpdating"
                :loading="statusUpdating"
                @click="handleUpdateStatus"
              >
                更新状态
              </ElButton>
            </div>
          </section>

          <section class="conversation-section">
            <div class="section-title">消息记录</div>
            <FeedbackConversation :detail="detail" />
          </section>
        </template>

        <div v-else-if="detailError" class="detail-state">
          <div class="detail-state__text">{{ detailError }}</div>
          <ElButton type="primary" @click="loadDetail">
            重新加载
          </ElButton>
        </div>

        <div v-else-if="!detailLoading" class="detail-state">
          <div class="detail-state__text">暂无可展示的反馈详情</div>
        </div>
      </div>

      <div v-if="detail && canReply" class="feedback-detail__footer">
        <FeedbackReplyComposer
          :key="detail.id"
          :feedback-id="detail.id"
          @dirty-change="handleReplyDraftChange"
          @sent="handleReplySent"
        />
      </div>

      <div
        v-else-if="detail && !canReply"
        class="feedback-detail__footer permission-note"
      >
        当前账号没有回复意见反馈的权限
      </div>
    </div>
  </ElDrawer>
</template>

<style scoped>
.feedback-detail-drawer :deep(.el-drawer__body) {
  display: flex;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.feedback-detail {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
}

.feedback-detail__scroll {
  flex: 1;
  min-height: 0;
  padding: 20px 20px 12px;
  overflow-y: auto;
}

.feedback-detail__footer {
  flex: 0 0 auto;
  padding: 14px 20px 18px;
  background: var(--el-bg-color);
  border-top: 1px solid var(--el-border-color-lighter);
}

.detail-summary {
  padding: 18px;
  background: var(--el-fill-color-lighter);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
}

.summary-heading,
.summary-user,
.status-editor {
  display: flex;
  gap: 12px;
  align-items: center;
}

.summary-heading {
  align-items: flex-start;
  justify-content: space-between;
}

.summary-copy {
  min-width: 0;
}

.summary-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
  overflow-wrap: anywhere;
}

.summary-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 10px;
}

.summary-user {
  margin-top: 18px;
}

.summary-user__copy {
  min-width: 0;
}

.summary-user__name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.summary-user__meta {
  margin-top: 3px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow-wrap: anywhere;
}

.summary-descriptions {
  margin-top: 16px;
}

.status-editor {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.status-editor__label {
  flex: 0 0 auto;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.status-editor__select {
  width: 150px;
}

.conversation-section {
  margin-top: 22px;
}

.section-title {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.detail-state {
  display: flex;
  flex-direction: column;
  gap: 14px;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.detail-state__text {
  color: var(--el-text-color-secondary);
}

.permission-note {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  text-align: center;
}

@media (max-width: 700px) {
  .feedback-detail__scroll {
    padding: 14px 14px 10px;
  }

  .feedback-detail__footer {
    padding: 12px 14px 14px;
  }

  .detail-summary {
    padding: 14px;
  }

  .summary-heading {
    gap: 10px;
  }

  .summary-title {
    font-size: 16px;
  }

  .status-editor {
    align-items: stretch;
    flex-direction: column;
  }

  .status-editor__select {
    width: 100%;
  }
}
</style>
