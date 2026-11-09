<script lang="ts" setup>
import type { SystemLogItem, SystemLogQuery } from '#/api/core/system-log';

import { onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElDatePicker,
  ElDrawer,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElOption,
  ElPagination,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { getSystemLogDetailApi, getSystemLogsApi } from '#/api/core/system-log';

const { hasAccessByCodes } = useAccess();

/**
 * ============================================================
 * 查询条件
 * ============================================================
 */

const searchForm = reactive({
  admin_username: '',
  module: '',
  action: '',
  target_type: '',
  result: '',
  created_start: '',
  created_end: '',
});

/**
 * ============================================================
 * 分页
 * ============================================================
 */

const pagination = reactive({
  current_page: 1,
  per_page: 20,
  total: 0,
});

/**
 * ============================================================
 * 日志列表
 * ============================================================
 */

const systemLogList = ref<SystemLogItem[]>([]);

const loading = ref(false);

/**
 * ============================================================
 * 日志详情
 * ============================================================
 */

const detailVisible = ref(false);

const detailLoading = ref(false);

const currentLog = ref<null | SystemLogItem>(null);

/**
 * ============================================================
 * 模块选项
 * ============================================================
 */

const moduleOptions = [
  {
    label: '认证',
    value: 'auth',
  },
  {
    label: '管理员',
    value: 'admin',
  },
  {
    label: '角色',
    value: 'role',
  },
  {
    label: '菜单',
    value: 'menu',
  },
  {
    label: 'API权限',
    value: 'permission',
  },
  {
    label: '用户',
    value: 'user',
  },
  {
    label: '邮件',
    value: 'mail',
  },
  {
    label: '角色数据',
    value: 'character',
  },
  {
    label: '作业',
    value: 'team',
  },
  {
    label: '系统',
    value: 'system',
  },
];

/**
 * ============================================================
 * 操作选项
 * ============================================================
 */

const actionOptions = [
  {
    label: '创建',
    value: 'create',
  },
  {
    label: '修改',
    value: 'update',
  },
  {
    label: '删除',
    value: 'delete',
  },
  {
    label: '状态修改',
    value: 'status',
  },
  {
    label: '分配',
    value: 'assign',
  },
  {
    label: '同步',
    value: 'sync',
  },
  {
    label: '发送',
    value: 'send',
  },
  {
    label: '登录',
    value: 'login',
  },
  {
    label: '退出登录',
    value: 'logout',
  },
];

/**
 * ============================================================
 * 操作对象选项
 * ============================================================
 */

const targetTypeOptions = [
  {
    label: '管理员',
    value: 'Admin',
  },
  {
    label: '角色',
    value: 'Role',
  },
  {
    label: '菜单',
    value: 'Menu',
  },
  {
    label: 'API权限',
    value: 'Permission',
  },
  {
    label: '用户',
    value: 'User',
  },
  {
    label: '角色数据',
    value: 'Character',
  },
  {
    label: '作业',
    value: 'Team',
  },
];

/**
 * ============================================================
 * 显示文字转换
 * ============================================================
 */

/**
 * 模块名称
 */
function getModuleText(module: null | string) {
  const item = moduleOptions.find((option) => option.value === module);

  return item?.label || module || '-';
}

/**
 * 操作名称
 */
function getActionText(action: null | string) {
  const item = actionOptions.find((option) => option.value === action);

  return item?.label || action || '-';
}

/**
 * 对象名称
 */
function getTargetTypeText(targetType: null | string) {
  const item = targetTypeOptions.find((option) => option.value === targetType);

  return item?.label || targetType || '-';
}

/**
 * ============================================================
 * 执行结果
 * ============================================================
 */

/**
 * 结果文字
 */
function getResultText(result: number) {
  return result === 1 ? '成功' : '失败';
}

/**
 * 结果标签类型
 */
function getResultTagType(result: number) {
  return result === 1 ? 'success' : 'danger';
}

/**
 * ============================================================
 * HTTP 方法
 * ============================================================
 */

function getMethodTagType(method: string) {
  switch (method.toUpperCase()) {
    case 'DELETE': {
      return 'danger';
    }

    case 'GET': {
      return 'info';
    }

    case 'PATCH':
    case 'PUT': {
      return 'warning';
    }

    case 'POST': {
      return 'success';
    }

    default: {
      return 'info';
    }
  }
}

/**
 * ============================================================
 * 时间格式化
 * ============================================================
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
 * ============================================================
 * JSON 格式化
 * ============================================================
 */

function formatJson(data: unknown) {
  if (data === null || data === undefined) {
    return '-';
  }

  if (typeof data === 'string') {
    if (!data.trim()) {
      return '-';
    }

    try {
      const parsed = JSON.parse(data);

      return JSON.stringify(parsed, null, 2);
    } catch {
      return data;
    }
  }

  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
}

/**
 * ============================================================
 * 获取日志列表
 * ============================================================
 */

async function getSystemLogList() {
  loading.value = true;

  try {
    const params: SystemLogQuery = {
      page: pagination.current_page,
      per_page: pagination.per_page,
    };

    /**
     * 管理员用户名
     */
    if (searchForm.admin_username) {
      params.admin_username = searchForm.admin_username;
    }

    /**
     * 模块
     */
    if (searchForm.module) {
      params.module = searchForm.module;
    }

    /**
     * 操作
     */
    if (searchForm.action) {
      params.action = searchForm.action;
    }

    /**
     * 操作对象
     */
    if (searchForm.target_type) {
      params.target_type = searchForm.target_type;
    }

    /**
     * 执行结果
     */
    if (searchForm.result !== '') {
      params.result = Number(searchForm.result);
    }

    /**
     * 开始日期
     */
    if (searchForm.created_start) {
      params.created_start = searchForm.created_start;
    }

    /**
     * 结束日期
     */
    if (searchForm.created_end) {
      params.created_end = searchForm.created_end;
    }

    const response = await getSystemLogsApi(params);

    systemLogList.value = response.data;

    pagination.current_page = response.current_page;
    pagination.per_page = response.per_page;
    pagination.total = response.total;
  } finally {
    loading.value = false;
  }
}

/**
 * ============================================================
 * 搜索
 * ============================================================
 */

function handleSearch() {
  pagination.current_page = 1;

  getSystemLogList();
}

/**
 * ============================================================
 * 重置
 * ============================================================
 */

function handleReset() {
  searchForm.admin_username = '';
  searchForm.module = '';
  searchForm.action = '';
  searchForm.target_type = '';
  searchForm.result = '';
  searchForm.created_start = '';
  searchForm.created_end = '';

  pagination.current_page = 1;

  getSystemLogList();
}

/**
 * ============================================================
 * 分页
 * ============================================================
 */

function handlePageChange(page: number) {
  pagination.current_page = page;

  getSystemLogList();
}

function handleSizeChange(size: number) {
  pagination.per_page = size;
  pagination.current_page = 1;

  getSystemLogList();
}

/**
 * ============================================================
 * 查看日志详情
 * ============================================================
 */

async function handleViewDetail(row: SystemLogItem) {
  const hasDetailPermission = hasAccessByCodes(['system:system-log:detail']);

  if (!hasDetailPermission) {
    ElMessage.warning('没有查看日志详情的权限');
    return;
  }

  detailVisible.value = true;
  detailLoading.value = true;
  currentLog.value = null;

  try {
    const response = await getSystemLogDetailApi(row.id);

    /**
     * 兼容：
     *
     * response = 日志对象
     *
     * 或：
     *
     * response = {
     *   data: 日志对象
     * }
     */
    const responseData = response as SystemLogItem & {
      data?: SystemLogItem;
    };

    currentLog.value =
      responseData.data && typeof responseData.data === 'object'
        ? responseData.data
        : responseData;
  } catch (error) {
    console.error('获取系统日志详情失败:', error);

    ElMessage.error('获取系统日志详情失败');
  } finally {
    detailLoading.value = false;
  }
}

/**
 * ============================================================
 * Drawer
 * ============================================================
 */

function handleDetailClose() {
  currentLog.value = null;
}

/**
 * ============================================================
 * 初始化
 * ============================================================
 */

onMounted(() => {
  getSystemLogList();
});
</script>

<template>
  <div class="p-4">
    <ElCard shadow="never">
      <!-- 查询区域 -->
      <ElForm :model="searchForm" inline class="mb-4">
        <!-- 管理员 -->
        <ElFormItem label="管理员">
          <ElInput
            v-model="searchForm.admin_username"
            placeholder="请输入管理员用户名"
            clearable
            style="width: 160px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <!-- 模块 -->
        <ElFormItem label="模块">
          <ElSelect
            v-model="searchForm.module"
            placeholder="请选择模块"
            clearable
            style="width: 130px"
          >
            <ElOption
              v-for="item in moduleOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>

        <!-- 操作 -->
        <ElFormItem label="操作">
          <ElSelect
            v-model="searchForm.action"
            placeholder="请选择操作"
            clearable
            style="width: 130px"
          >
            <ElOption
              v-for="item in actionOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>

        <!-- 对象 -->
        <ElFormItem label="对象">
          <ElSelect
            v-model="searchForm.target_type"
            placeholder="请选择对象"
            clearable
            style="width: 130px"
          >
            <ElOption
              v-for="item in targetTypeOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </ElSelect>
        </ElFormItem>

        <!-- 结果 -->
        <ElFormItem label="结果">
          <ElSelect
            v-model="searchForm.result"
            placeholder="请选择结果"
            clearable
            style="width: 110px"
          >
            <ElOption label="成功" :value="1" />

            <ElOption label="失败" :value="0" />
          </ElSelect>
        </ElFormItem>

        <!-- 开始日期 -->
        <ElFormItem label="时间">
          <ElDatePicker
            v-model="searchForm.created_start"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
        </ElFormItem>

        <!-- 结束日期 -->
        <ElFormItem label="至">
          <ElDatePicker
            v-model="searchForm.created_end"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
        </ElFormItem>

        <!-- 查询 -->
        <ElFormItem>
          <ElButton type="primary" @click="handleSearch"> 搜索 </ElButton>

          <ElButton @click="handleReset"> 重置 </ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 日志列表 -->
      <ElTable
        v-loading="loading"
        :data="systemLogList"
        border
        stripe
        style="width: 100%"
      >
        <!-- ID -->
        <ElTableColumn prop="id" label="ID" width="70" align="center" />

        <!-- 管理员 -->
        <ElTableColumn prop="admin_username" label="管理员" width="120" />

        <!-- 模块 -->
        <ElTableColumn label="模块" width="100" align="center">
          <template #default="scope">
            {{ getModuleText(scope.row.module) }}
          </template>
        </ElTableColumn>

        <!-- 操作 -->
        <ElTableColumn label="操作" width="100" align="center">
          <template #default="scope">
            {{ getActionText(scope.row.action) }}
          </template>
        </ElTableColumn>

        <!-- 对象 -->
        <ElTableColumn label="对象" width="110" align="center">
          <template #default="scope">
            {{ getTargetTypeText(scope.row.target_type) }}

            <template v-if="scope.row.target_id">
              #{{ scope.row.target_id }}
            </template>
          </template>
        </ElTableColumn>

        <!-- 描述 -->
        <ElTableColumn
          prop="description"
          label="操作描述"
          min-width="150"
          show-overflow-tooltip
        />

        <!-- 请求方式 -->
        <ElTableColumn label="请求方式" width="100" align="center">
          <template #default="scope">
            <ElTag :type="getMethodTagType(scope.row.method)" size="small">
              {{ scope.row.method }}
            </ElTag>
          </template>
        </ElTableColumn>

        <!-- 请求路径 -->
        <ElTableColumn
          prop="path"
          label="请求路径"
          min-width="220"
          show-overflow-tooltip
        />

        <!-- IP -->
        <ElTableColumn prop="ip" label="IP" width="140" />

        <!-- 结果 -->
        <ElTableColumn label="结果" width="90" align="center">
          <template #default="scope">
            <ElTag :type="getResultTagType(scope.row.result)" size="small">
              {{ getResultText(scope.row.result) }}
            </ElTag>
          </template>
        </ElTableColumn>

        <!-- 时间 -->
        <ElTableColumn label="时间" min-width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </ElTableColumn>

        <!-- 操作 -->
        <ElTableColumn label="操作" width="90" fixed="right" align="center">
          <template #default="scope">
            <ElButton
              v-if="hasAccessByCodes(['system:system-log:detail'])"
              type="primary"
              link
              @click="handleViewDetail(scope.row)"
            >
              查看
            </ElButton>
          </template>
        </ElTableColumn>

        <!-- 空数据 -->
        <template #empty>
          <ElEmpty description="暂无系统日志" />
        </template>
      </ElTable>

      <!-- 分页 -->
      <div class="mt-4 flex justify-end">
        <ElPagination
          v-model:current-page="pagination.current_page"
          v-model:page-size="pagination.per_page"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </ElCard>

    <!-- 日志详情 -->
    <ElDrawer
      v-model="detailVisible"
      title="系统日志详情"
      size="650px"
      destroy-on-close
      @closed="handleDetailClose"
    >
      <div v-loading="detailLoading" class="pr-2">
        <template v-if="currentLog">
          <!-- 基本信息 -->
          <ElCard shadow="never" class="mb-4">
            <template #header>
              <span class="font-medium">基本信息</span>
            </template>

            <div class="grid grid-cols-2 gap-y-4 text-sm">
              <!-- ID -->
              <div>
                <span class="text-gray-500">日志 ID：</span>
                <span>{{ currentLog.id }}</span>
              </div>

              <!-- 管理员 -->
              <div>
                <span class="text-gray-500">管理员：</span>
                <span>
                  {{ currentLog.admin_username || '-' }}
                </span>
              </div>

              <!-- 模块 -->
              <div>
                <span class="text-gray-500">模块：</span>
                <span>
                  {{ getModuleText(currentLog.module) }}
                </span>
              </div>

              <!-- 操作 -->
              <div>
                <span class="text-gray-500">操作：</span>
                <span>
                  {{ getActionText(currentLog.action) }}
                </span>
              </div>

              <!-- 操作对象 -->
              <div>
                <span class="text-gray-500">操作对象：</span>
                <span>
                  {{ getTargetTypeText(currentLog.target_type) }}

                  <template v-if="currentLog.target_id">
                    #{{ currentLog.target_id }}
                  </template>
                </span>
              </div>

              <!-- 结果 -->
              <div>
                <span class="text-gray-500">执行结果：</span>

                <ElTag :type="getResultTagType(currentLog.result)" size="small">
                  {{ getResultText(currentLog.result) }}
                </ElTag>
              </div>

              <!-- 请求方式 -->
              <div>
                <span class="text-gray-500">请求方式：</span>

                <ElTag :type="getMethodTagType(currentLog.method)" size="small">
                  {{ currentLog.method }}
                </ElTag>
              </div>

              <!-- IP -->
              <div>
                <span class="text-gray-500">IP：</span>
                <span>
                  {{ currentLog.ip || '-' }}
                </span>
              </div>

              <!-- 时间 -->
              <div class="col-span-2">
                <span class="text-gray-500">操作时间：</span>
                <span>
                  {{ formatDateTime(currentLog.created_at) }}
                </span>
              </div>

              <!-- 描述 -->
              <div class="col-span-2">
                <span class="text-gray-500">操作描述：</span>
                <span>
                  {{ currentLog.description || '-' }}
                </span>
              </div>

              <!-- 请求路径 -->
              <div class="col-span-2">
                <span class="text-gray-500">请求路径：</span>
                <span class="break-all">
                  {{ currentLog.path || '-' }}
                </span>
              </div>
            </div>
          </ElCard>

          <!-- 请求数据 -->
          <ElCard shadow="never" class="mb-4">
            <template #header>
              <span class="font-medium">请求数据</span>
            </template>

            <div class="overflow-hidden rounded-md bg-[#1e1e1e]">
              <pre
                class="m-0 max-h-[350px] overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-[13px] leading-6 text-[#d4d4d4]"
                >{{ formatJson(currentLog.request_data) }}</pre>
            </div>
          </ElCard>

          <!-- 数据变化 -->
          <ElCard shadow="never" class="mb-4">
            <template #header>
              <span class="font-medium">数据变化</span>
            </template>

            <div class="overflow-hidden rounded-md bg-[#1e1e1e]">
              <pre
                class="m-0 max-h-[350px] overflow-auto whitespace-pre-wrap break-all p-4 font-mono text-[13px] leading-6 text-[#d4d4d4]"
                >{{ formatJson(currentLog.changes) }}</pre>
            </div>
          </ElCard>

          <!-- 错误信息 -->
          <ElCard v-if="currentLog.error_message" shadow="never" class="mb-4">
            <template #header>
              <span class="font-medium">错误信息</span>
            </template>

            <div class="break-all text-sm text-red-500">
              {{ currentLog.error_message }}
            </div>
          </ElCard>

          <!-- User-Agent -->
          <ElCard shadow="never">
            <template #header>
              <span class="font-medium">User-Agent</span>
            </template>

            <div class="break-all text-sm leading-6">
              {{ currentLog.user_agent || '-' }}
            </div>
          </ElCard>
        </template>

        <ElEmpty v-else-if="!detailLoading" description="暂无日志详情" />
      </div>
    </ElDrawer>
  </div>
</template>
