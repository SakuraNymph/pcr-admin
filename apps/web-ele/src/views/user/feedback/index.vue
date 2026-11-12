<script lang="ts" setup>
import type {
  FeedbackCategory,
  FeedbackListItem,
  FeedbackListQuery,
  FeedbackReplyResult,
  FeedbackStatistics,
  FeedbackStatus,
  FeedbackStatusUpdateResult,
} from '#/api/core/feedback';

import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElCheckbox,
  ElDatePicker,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import {
  getFeedbackListApi,
  getFeedbackStatisticsApi,
} from '#/api/core/feedback';

import FeedbackDetailDrawer from './components/FeedbackDetailDrawer.vue';
import {
  FEEDBACK_CATEGORY_OPTIONS,
  FEEDBACK_STATUS_OPTIONS,
  feedbackStatusTagType,
  formatDateTime,
} from './feedback-utils';

const { hasAccessByCodes } = useAccess();

const canList = computed(() =>
  hasAccessByCodes(['system:feedback:list']),
);
const canStatistics = computed(() =>
  hasAccessByCodes(['system:feedback:statistics']),
);
const canDetail = computed(() =>
  hasAccessByCodes(['system:feedback:detail']),
);
const canReply = computed(() =>
  hasAccessByCodes(['system:feedback:reply']),
);
const canUpdateStatus = computed(() =>
  hasAccessByCodes(['system:feedback:status']),
);
const canMarkRead = computed(() =>
  hasAccessByCodes(['system:feedback:read']),
);

const searchForm = reactive({
  category: '' as '' | FeedbackCategory,
  dateRange: null as null | string[],
  hasUnread: false,
  nickname: '',
  publicUid: null as null | number,
  status: '' as '' | FeedbackStatus,
  title: '',
});

const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0,
});

const feedbackList = ref<FeedbackListItem[]>([]);
const listLoading = ref(false);
const listError = ref('');

const statistics = ref<FeedbackStatistics>({
  closed: 0,
  pending: 0,
  processing: 0,
  replied: 0,
  total: 0,
});
const statisticsLoading = ref(false);
const statisticsError = ref('');

const detailVisible = ref(false);
const activeFeedbackId = ref<null | number>(null);
const readDirty = ref(false);

const statusCards = computed(() => [
  {
    key: 'pending',
    label: '待处理',
    status: 0 as FeedbackStatus,
    tone: 'warning',
    value: statistics.value.pending,
  },
  {
    key: 'processing',
    label: '处理中',
    status: 1 as FeedbackStatus,
    tone: 'primary',
    value: statistics.value.processing,
  },
  {
    key: 'replied',
    label: '已回复',
    status: 2 as FeedbackStatus,
    tone: 'success',
    value: statistics.value.replied,
  },
  {
    key: 'closed',
    label: '已关闭',
    status: 3 as FeedbackStatus,
    tone: 'info',
    value: statistics.value.closed,
  },
]);

function buildQuery(): FeedbackListQuery {
  const query: FeedbackListQuery = {
    page: pagination.current_page,
  };

  if (searchForm.status !== '') {
    query.status = searchForm.status;
  }

  if (searchForm.category !== '') {
    query.category = searchForm.category;
  }

  if (searchForm.publicUid !== null) {
    query.public_uid = searchForm.publicUid;
  }

  const nickname = searchForm.nickname.trim();
  const title = searchForm.title.trim();

  if (nickname) {
    query.nickname = nickname;
  }

  if (title) {
    query.title = title;
  }

  const [startDate, endDate] = searchForm.dateRange ?? [];

  if (startDate) {
    query.start_date = startDate;
  }

  if (endDate) {
    query.end_date = endDate;
  }

  if (searchForm.hasUnread) {
    query.has_unread = 1;
  }

  return query;
}

async function loadFeedbackList(silent = false) {
  if (!canList.value) {
    return;
  }

  if (!silent) {
    listLoading.value = true;
    listError.value = '';
  }

  try {
    const result = await getFeedbackListApi(buildQuery());

    feedbackList.value = result.items;
    pagination.current_page = result.page;
    pagination.per_page = result.per_page;
    pagination.total = result.total;
    listError.value = '';
  } catch (error) {
    console.error('获取意见反馈列表失败:', error);

    if (!silent) {
      listError.value = '获取意见反馈列表失败';
    }
  } finally {
    if (!silent) {
      listLoading.value = false;
    }
  }
}

async function loadStatistics(silent = false) {
  if (!canStatistics.value) {
    return;
  }

  if (!silent) {
    statisticsLoading.value = true;
  }

  try {
    statistics.value = await getFeedbackStatisticsApi();
    statisticsError.value = '';
  } catch (error) {
    console.error('获取意见反馈统计失败:', error);

    if (!silent) {
      statisticsError.value = '统计数据加载失败';
    }
  } finally {
    if (!silent) {
      statisticsLoading.value = false;
    }
  }
}

function handleSearch() {
  pagination.current_page = 1;
  void loadFeedbackList();
}

function handleReset() {
  searchForm.category = '';
  searchForm.dateRange = null;
  searchForm.hasUnread = false;
  searchForm.nickname = '';
  searchForm.publicUid = null;
  searchForm.status = '';
  searchForm.title = '';
  pagination.current_page = 1;
  void loadFeedbackList();
}

function handleRefresh() {
  void loadFeedbackList();
  void loadStatistics();
}

function handlePageChange(page: number) {
  pagination.current_page = page;
  void loadFeedbackList();
}

function isStatusActive(status: FeedbackStatus) {
  return searchForm.status === status;
}

function handleStatusCardClick(status: FeedbackStatus) {
  searchForm.status = searchForm.status === status ? '' : status;
  handleSearch();
}

function openDetail(row: FeedbackListItem) {
  if (!canDetail.value) {
    ElMessage.warning('当前账号没有查看意见反馈详情的权限');
    return;
  }

  activeFeedbackId.value = row.id;
  detailVisible.value = true;
}

function handleReadUpdated(payload: {
  feedbackId: number;
  unreadCount: number;
}) {
  const row = feedbackList.value.find(
    (item) => item.id === payload.feedbackId,
  );

  if (row) {
    row.unread_count = payload.unreadCount;
  }

  if (!detailVisible.value) {
    if (searchForm.hasUnread) {
      void loadFeedbackList(true);
    }
    return;
  }

  readDirty.value = true;
}

function handleStatusUpdated(payload: {
  feedbackId: number;
  result: FeedbackStatusUpdateResult;
}) {
  const row = feedbackList.value.find(
    (item) => item.id === payload.feedbackId,
  );

  if (row) {
    row.status = payload.result.status;
    row.status_name = payload.result.status_name;
  }

  void loadFeedbackList(true);
  void loadStatistics(true);
}

function handleReplySent(payload: {
  feedbackId: number;
  result: FeedbackReplyResult;
}) {
  const row = feedbackList.value.find(
    (item) => item.id === payload.feedbackId,
  );

  if (row) {
    row.last_message_at = payload.result.last_message_at;
    row.status = payload.result.status;
    row.status_name = payload.result.status_name;
  }

  void loadFeedbackList(true);
}

function handleDrawerClosed() {
  activeFeedbackId.value = null;

  if (readDirty.value && searchForm.hasUnread) {
    void loadFeedbackList(true);
  }

  readDirty.value = false;
}

onMounted(() => {
  if (canList.value) {
    void loadFeedbackList();

    if (canStatistics.value) {
      void loadStatistics();
    }
  }
});
</script>

<template>
  <div class="feedback-page p-4">
    <template v-if="canList">
      <ElCard
        v-if="canStatistics"
        v-loading="statisticsLoading"
        shadow="never"
        class="statistics-card"
      >
        <div v-if="statisticsError" class="statistics-error">
          <span>{{ statisticsError }}</span>
          <ElButton link type="primary" @click="loadStatistics()">
            重试
          </ElButton>
        </div>

        <div v-else class="statistics-grid">
          <button
            v-for="card in statusCards"
            :key="card.key"
            type="button"
            class="stat-card"
            :class="[
              `stat-card--${card.tone}`,
              { 'is-active': isStatusActive(card.status) },
            ]"
            :aria-pressed="isStatusActive(card.status)"
            @click="handleStatusCardClick(card.status)"
          >
            <span class="stat-card__label">{{ card.label }}</span>
            <strong class="stat-card__value">{{ card.value }}</strong>
          </button>

          <div class="stat-card stat-card--total">
            <span class="stat-card__label">总数</span>
            <strong class="stat-card__value">
              {{ statistics.total }}
            </strong>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="never" class="filter-card">
        <ElForm
          :model="searchForm"
          inline
          class="feedback-filter"
          @submit.prevent="handleSearch"
        >
          <ElFormItem label="状态">
            <ElSelect
              v-model="searchForm.status"
              placeholder="全部"
              style="width: 120px"
            >
              <ElOption label="全部" value="" />
              <ElOption
                v-for="option in FEEDBACK_STATUS_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="分类">
            <ElSelect
              v-model="searchForm.category"
              placeholder="全部"
              style="width: 130px"
            >
              <ElOption label="全部" value="" />
              <ElOption
                v-for="option in FEEDBACK_CATEGORY_OPTIONS"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </ElSelect>
          </ElFormItem>

          <ElFormItem label="UID">
            <ElInputNumber
              v-model="searchForm.publicUid"
              :controls="false"
              :min="1"
              placeholder="公开 UID"
              style="width: 130px"
            />
          </ElFormItem>

          <ElFormItem label="昵称">
            <ElInput
              v-model="searchForm.nickname"
              clearable
              maxlength="100"
              placeholder="请输入昵称"
              style="width: 140px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>

          <ElFormItem label="标题">
            <ElInput
              v-model="searchForm.title"
              clearable
              maxlength="100"
              placeholder="请输入标题"
              style="width: 160px"
              @keyup.enter="handleSearch"
            />
          </ElFormItem>

          <ElFormItem label="创建日期">
            <ElDatePicker
              v-model="searchForm.dateRange"
              type="daterange"
              unlink-panels
              value-format="YYYY-MM-DD"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              style="width: 240px"
            />
          </ElFormItem>

          <ElFormItem>
            <ElCheckbox v-model="searchForm.hasUnread">
              仅看未读
            </ElCheckbox>
          </ElFormItem>

          <ElFormItem>
            <ElButton type="primary" @click="handleSearch">
              搜索
            </ElButton>
            <ElButton @click="handleReset">重置</ElButton>
            <ElButton :loading="listLoading" @click="handleRefresh">
              刷新
            </ElButton>
          </ElFormItem>
        </ElForm>
      </ElCard>

      <ElCard shadow="never" class="list-card">
        <div class="table-heading">
          <span class="table-title">反馈列表</span>
          <span class="table-total">
            共 {{ pagination.total }} 条
          </span>
        </div>

        <ElTable
          v-loading="listLoading"
          :data="feedbackList"
          border
          row-key="id"
          stripe
          style="width: 100%"
        >
          <ElTableColumn
            prop="public_uid"
            label="UID"
            width="100"
            align="center"
          />

          <ElTableColumn
            prop="nickname"
            label="昵称"
            min-width="120"
            show-overflow-tooltip
          >
            <template #default="scope">
              {{ scope.row.nickname || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn
            prop="category_name"
            label="分类"
            width="110"
            align="center"
          >
            <template #default="scope">
              <ElTag type="info" effect="plain" size="small">
                {{ scope.row.category_name }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn
            prop="title"
            label="标题"
            min-width="220"
            show-overflow-tooltip
          />

          <ElTableColumn
            prop="status_name"
            label="状态"
            width="100"
            align="center"
          >
            <template #default="scope">
              <ElTag
                :type="feedbackStatusTagType(scope.row.status)"
                size="small"
              >
                {{ scope.row.status_name }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn
            prop="unread_count"
            label="未读"
            width="100"
            align="center"
          >
            <template #default="scope">
              <ElTag
                v-if="scope.row.unread_count > 0"
                type="danger"
                effect="light"
                size="small"
              >
                {{ scope.row.unread_count }} 未读
              </ElTag>
              <span v-else class="text-muted">-</span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            prop="created_at"
            label="创建时间"
            min-width="170"
          >
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </ElTableColumn>

          <ElTableColumn
            prop="last_message_at"
            label="最后消息"
            min-width="170"
          >
            <template #default="scope">
              {{ formatDateTime(scope.row.last_message_at) }}
            </template>
          </ElTableColumn>

          <ElTableColumn
            label="操作"
            width="90"
            fixed="right"
            align="center"
          >
            <template #default="scope">
              <ElButton
                v-if="canDetail"
                type="primary"
                link
                @click="openDetail(scope.row)"
              >
                查看
              </ElButton>
              <span v-else class="text-muted">无权限</span>
            </template>
          </ElTableColumn>

          <template #empty>
            <div class="table-empty">
              <ElEmpty
                :description="listError || '暂无意见反馈'"
              />
              <ElButton
                v-if="listError"
                type="primary"
                plain
                @click="loadFeedbackList()"
              >
                重新加载
              </ElButton>
            </div>
          </template>
        </ElTable>

        <div v-if="pagination.total > 0" class="pagination-wrap">
          <ElPagination
            v-model:current-page="pagination.current_page"
            :page-size="pagination.per_page"
            :total="pagination.total"
            background
            layout="total, prev, pager, next, jumper"
            @current-change="handlePageChange"
          />
        </div>
      </ElCard>

      <FeedbackDetailDrawer
        v-model="detailVisible"
        :feedback-id="activeFeedbackId"
        :can-view-detail="canDetail"
        :can-reply="canReply"
        :can-update-status="canUpdateStatus"
        :can-mark-read="canMarkRead"
        @read-updated="handleReadUpdated"
        @reply-sent="handleReplySent"
        @status-updated="handleStatusUpdated"
        @closed="handleDrawerClosed"
      />
    </template>

    <ElCard v-else shadow="never">
      <ElEmpty description="当前账号没有意见反馈查看权限" />
    </ElCard>
  </div>
</template>

<style scoped>
.feedback-page {
  min-height: 100%;
}

.statistics-card,
.filter-card,
.list-card {
  border-radius: 10px;
}

.filter-card,
.list-card {
  margin-top: 16px;
}

.statistics-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
  padding: 14px 16px;
  font: inherit;
  text-align: left;
  cursor: pointer;
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 10px;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    transform 0.2s ease;
}

.stat-card:hover {
  border-color: var(--el-border-color);
  transform: translateY(-1px);
}

.stat-card__label {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.stat-card__value {
  font-size: 26px;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.stat-card--warning {
  background: var(--el-color-warning-light-9);
}

.stat-card--primary {
  background: var(--el-color-primary-light-9);
}

.stat-card--success {
  background: var(--el-color-success-light-9);
}

.stat-card--info {
  background: var(--el-color-info-light-9);
}

.stat-card--total {
  cursor: default;
  background: var(--el-fill-color-lighter);
}

.stat-card.is-active {
  border-color: var(--el-color-primary);
  box-shadow: inset 0 0 0 1px var(--el-color-primary);
}

.statistics-error {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: center;
  min-height: 72px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.feedback-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 0;
}

.table-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.table-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.table-total,
.text-muted {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.table-empty {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  padding: 20px 0;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  overflow-x: auto;
}

@media (max-width: 1100px) {
  .statistics-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 700px) {
  .statistics-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .feedback-filter :deep(.el-form-item) {
    width: 100%;
    margin-right: 0;
  }

  .feedback-filter :deep(.el-form-item__content),
  .feedback-filter :deep(.el-select),
  .feedback-filter :deep(.el-input),
  .feedback-filter :deep(.el-input-number),
  .feedback-filter :deep(.el-date-editor) {
    width: 100% !important;
  }

  .pagination-wrap {
    justify-content: flex-start;
  }
}
</style>
