<script lang="ts" setup>
import type { UserItem, UserListParams } from '#/api/core/user-management';

import { onMounted, reactive, ref } from 'vue';

import {
  ElButton,
  ElDatePicker,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import { getUsersApi } from '#/api/core/user-management';

/**
 * 用户列表
 */
const userList = ref<UserItem[]>([]);

/**
 * 查询表单
 */
const searchForm = reactive({
  nickname: '',
  email: '',
  is_subscribe: '',
  start_date: '',
  end_date: '',
});

/**
 * 分页
 */
const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0,
});

/**
 * 加载状态
 */
const loading = ref(false);

/**
 * 加载失败状态
 */
const error = ref('');

const errorStatus = ref<null | number>(null);

/**
 * 获取用户列表
 */
async function getUserList() {
  loading.value = true;
  error.value = '';
  errorStatus.value = null;

  try {
    const params: UserListParams = {
      page: pagination.current_page,
      pageSize: pagination.per_page,
    };

    if (searchForm.nickname) {
      params.nickname = searchForm.nickname.trim();
    }

    if (searchForm.email) {
      params.email = searchForm.email.trim();
    }

    if (searchForm.is_subscribe !== '') {
      params.is_subscribe = Number(searchForm.is_subscribe);
    }

    if (searchForm.start_date) {
      params.start_date = searchForm.start_date;
    }

    if (searchForm.end_date) {
      params.end_date = searchForm.end_date;
    }

    const response = await getUsersApi(params);

    userList.value = response.items;
    pagination.total = response.total;
  } catch (err) {
    console.error('获取用户列表失败:', err);

    userList.value = [];
    pagination.total = 0;

    const requestError = err as {
      code?: number | string;
      message?: string;
      response?: { status?: number };
      status?: number;
    };

    const status = Number(
      requestError?.response?.status ??
        requestError?.status ??
        requestError?.code ??
        0,
    );

    // requestClient 只抛出响应体，403 时通过后端权限提示文案兜底识别
    const isForbidden =
      status === 403 ||
      (typeof requestError?.message === 'string' &&
        requestError.message.includes('权限'));

    errorStatus.value = isForbidden ? 403 : status || null;
    error.value = isForbidden
      ? '暂无权限查看用户列表'
      : '用户列表加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

/**
 * 搜索
 */
function handleSearch() {
  pagination.current_page = 1;
  getUserList();
}

/**
 * 重置
 */
function handleReset() {
  searchForm.nickname = '';
  searchForm.email = '';
  searchForm.is_subscribe = '';
  searchForm.start_date = '';
  searchForm.end_date = '';

  pagination.current_page = 1;

  getUserList();
}

/**
 * 当前页改变
 */
function handlePageChange(page: number) {
  pagination.current_page = page;
  getUserList();
}

/**
 * 每页数量改变
 */
function handleSizeChange(size: number) {
  pagination.per_page = size;
  pagination.current_page = 1;
  getUserList();
}

/**
 * 时间格式化
 */
function formatDateTime(value: null | string) {
  if (!value) {
    return '-';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 创建时间排序
 */
function sortByCreatedAt(a: UserItem, b: UserItem) {
  const timeA = new Date(a.created_at).getTime();
  const timeB = new Date(b.created_at).getTime();

  return timeA - timeB;
}

/**
 * 修改时间排序
 */
function sortByUpdatedAt(a: UserItem, b: UserItem) {
  const timeA = new Date(a.updated_at).getTime();
  const timeB = new Date(b.updated_at).getTime();

  return timeA - timeB;
}

/**
 * 初始化
 */
onMounted(() => {
  getUserList();
});
</script>

<template>
  <div class="pcr-page users-page">
    <section class="pcr-filter-panel pcr-filter-panel--compact pcr-surface">
      <ElForm
        :model="searchForm"
        class="pcr-filter-row"
        label-position="left"
        @submit.prevent="handleSearch"
      >
        <ElFormItem class="pcr-filter-item pcr-filter-item--md" label="昵称">
          <ElInput
            v-model="searchForm.nickname"
            placeholder="请输入昵称"
            clearable
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem class="pcr-filter-item pcr-filter-item--lg" label="邮箱">
          <ElInput
            v-model="searchForm.email"
            placeholder="请输入邮箱"
            clearable
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem class="pcr-filter-item pcr-filter-item--xs" label="订阅">
          <ElSelect
            v-model="searchForm.is_subscribe"
            placeholder="请选择"
            clearable
          >
            <ElOption label="全部" value="" />

            <ElOption label="已订阅" :value="1" />

            <ElOption label="未订阅" :value="0" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem
          class="pcr-filter-item pcr-filter-item--range"
          label="注册时间"
        >
          <div class="pcr-filter-range">
            <ElDatePicker
              v-model="searchForm.start_date"
              type="date"
              placeholder="开始日期"
              value-format="YYYY-MM-DD"
            />

            <span class="pcr-filter-range__sep">至</span>

            <ElDatePicker
              v-model="searchForm.end_date"
              type="date"
              placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </div>
        </ElFormItem>

        <div class="pcr-filter-actions">
          <ElButton class="pcr-filter-reset" @click="handleReset">
            重置
          </ElButton>

          <ElButton type="primary" @click="handleSearch"> 搜索 </ElButton>
        </div>
      </ElForm>
    </section>

    <section class="pcr-table-shell">
      <div class="pcr-table-head">
        <span class="pcr-table-head__count">
          共 {{ pagination.total }} 条
        </span>
      </div>

      <div v-if="error" class="table-state">
        <p class="table-state__title">{{ error }}</p>
        <ElButton
          v-if="errorStatus !== 403"
          type="primary"
          plain
          @click="getUserList()"
        >
          重新加载
        </ElButton>
      </div>

      <template v-else>
        <ElTable
          v-loading="loading"
          :data="userList"
          element-loading-background="var(--pcr-bg-surface)"
          element-loading-text="加载用户数据…"
          row-key="id"
          style="width: 100%"
        >
          <ElTableColumn prop="id" label="UID" width="72" align="center" />

          <ElTableColumn prop="nickname" label="昵称" min-width="116">
            <template #default="scope">
              <span class="user-name" :title="scope.row.nickname || ''">
                {{ scope.row.nickname || '-' }}
              </span>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="email" label="邮箱" min-width="180">
            <template #default="scope">
              <span class="user-email" :title="scope.row.email || ''">
                {{ scope.row.email || '-' }}
              </span>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="ip" label="IP地址" min-width="126">
            <template #default="scope">
              <span class="user-mono">{{ scope.row.ip || '-' }}</span>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="country" label="国家" min-width="86">
            <template #default="scope">
              {{ scope.row.country || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="province" label="省份" min-width="86">
            <template #default="scope">
              {{ scope.row.province || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn prop="city" label="城市" min-width="86">
            <template #default="scope">
              {{ scope.row.city || '-' }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="订阅" width="96" align="center">
            <template #default="scope">
              <span
                class="pcr-soft-tag"
                :class="
                  scope.row.is_subscribe
                    ? 'pcr-soft-tag--success'
                    : 'pcr-soft-tag--muted'
                "
              >
                {{ scope.row.is_subscribe ? '已订阅' : '未订阅' }}
              </span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            label="注册时间"
            min-width="150"
            sortable
            :sort-method="sortByCreatedAt"
          >
            <template #default="scope">
              <span class="user-time">
                {{ formatDateTime(scope.row.created_at) }}
              </span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            label="修改时间"
            min-width="150"
            sortable
            :sort-method="sortByUpdatedAt"
          >
            <template #default="scope">
              <span class="user-time">
                {{ formatDateTime(scope.row.updated_at) }}
              </span>
            </template>
          </ElTableColumn>

          <template #empty>
            <div class="table-empty">
              <ElEmpty :image-size="72" description="暂无用户数据" />
              <p>调整筛选条件后再试</p>
            </div>
          </template>
        </ElTable>

        <div class="pcr-table-foot">
          <ElPagination
            v-model:current-page="pagination.current_page"
            v-model:page-size="pagination.per_page"
            :page-sizes="[10, 20, 50, 100]"
            :total="pagination.total"
            class="pcr-pagination"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </template>
    </section>
  </div>
</template>

<style scoped>
.users-page {
  min-width: 0;
}

.user-name {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: var(--pcr-font-weight-medium);
  color: var(--pcr-text-primary);
}

.user-email {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--pcr-text-secondary);
}

.user-mono {
  font-variant-numeric: tabular-nums;
  color: var(--pcr-text-secondary);
}

.user-time {
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
  white-space: nowrap;
}

.table-state {
  display: flex;
  flex-direction: column;
  gap: var(--pcr-space-3);
  align-items: center;
  justify-content: center;
  min-height: 260px;
  padding: var(--pcr-space-7) var(--pcr-space-4);
  text-align: center;
}

.table-state__title {
  margin: 0;
  font-size: var(--pcr-font-size-small);
  color: var(--pcr-text-secondary);
}

.table-empty {
  display: flex;
  flex-direction: column;
  gap: var(--pcr-space-2);
  align-items: center;
  padding: var(--pcr-space-6) 0;
}

.table-empty p {
  margin: 0;
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}
</style>
