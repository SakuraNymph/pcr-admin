<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import type {
  AdminItem,
  CreateAdminParams,
  UpdateAdminParams,
} from '#/api/core/admin';
import type { RoleItem } from '#/api/core/role';

import { onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElDatePicker,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElRadio,
  ElRadioGroup,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
} from 'element-plus';

import {
  createAdminApi,
  deleteAdminApi,
  getAdminsApi,
  updateAdminApi,
  updateAdminStatusApi,
} from '#/api/core/admin';
import { getRolesApi } from '#/api/core/role';

/**
 * Vben 权限码
 *
 * 这里使用 Vben 自带的权限判断机制。
 */
const { hasAccessByCodes } = useAccess();

/**
 * 是否有新增管理员权限
 */
function canCreateAdmin() {
  return hasAccessByCodes(['system:admin:create']);
}

/**
 * 是否有编辑管理员权限
 */
function canUpdateAdmin() {
  return hasAccessByCodes(['system:admin:update']);
}

/**
 * 是否有删除管理员权限
 */
function canDeleteAdmin() {
  return hasAccessByCodes(['system:admin:delete']);
}

/**
 * 是否有修改管理员状态权限
 */
function canUpdateAdminStatus() {
  return hasAccessByCodes(['system:admin:status']);
}

/**
 * 管理员列表
 */
const adminList = ref<AdminItem[]>([]);

/**
 * 角色列表
 */
const roles = ref<RoleItem[]>([]);

/**
 * 查询表单
 */
const searchForm = reactive({
  username: '',
  nickname: '',
  status: '',
  role_id: undefined as number | undefined,
  created_start: '',
  created_end: '',
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
 * 状态修改中的管理员 ID
 */
const statusUpdatingIds = ref<number[]>([]);

/**
 * 弹窗
 */
const dialogVisible = ref(false);

/**
 * 是否编辑
 */
const isEdit = ref(false);

/**
 * 当前编辑管理员 ID
 */
const currentId = ref<null | number>(null);

/**
 * 表单
 */
const formRef = ref<FormInstance>();

const form = reactive({
  username: '',
  nickname: '',
  password: '',
  email: '',
  mobile: '',
  status: 1,
  role_ids: [] as number[],
});

/**
 * 表单验证规则
 */
const formRules: FormRules = {
  username: [
    {
      required: true,
      message: '请输入用户名',
      trigger: 'blur',
    },
    {
      max: 50,
      message: '用户名不能超过50个字符',
      trigger: 'blur',
    },
  ],
  nickname: [
    {
      required: true,
      message: '请输入昵称',
      trigger: 'blur',
    },
    {
      max: 50,
      message: '昵称不能超过50个字符',
      trigger: 'blur',
    },
  ],
  password: [
    {
      validator: (
        _rule: unknown,
        value: string,
        callback: (error?: Error) => void,
      ) => {
        /**
         * 新增时密码不能为空
         */
        if (!isEdit.value && !value) {
          callback(new Error('请输入密码'));
          return;
        }

        /**
         * 填写了密码时，至少6位
         */
        if (value && value.length < 6) {
          callback(new Error('密码至少6位'));
          return;
        }

        callback();
      },
      trigger: 'blur',
    },
  ],
  email: [
    {
      type: 'email',
      message: '请输入正确的邮箱地址',
      trigger: 'blur',
    },
  ],
  status: [
    {
      required: true,
      message: '请选择状态',
      trigger: 'change',
    },
  ],
  role_ids: [
    {
      required: true,
      type: 'array',
      min: 1,
      message: '请选择角色',
      trigger: 'change',
    },
  ],
};

/**
 * 获取管理员列表
 */
async function getAdminList() {
  loading.value = true;
  error.value = '';
  errorStatus.value = null;

  try {
    const params: {
      created_end?: string;
      created_start?: string;
      nickname?: string;
      page: number;
      per_page: number;
      role_id?: number;
      status?: number;
      username?: string;
    } = {
      page: pagination.current_page,
      per_page: pagination.per_page,
    };

    if (searchForm.username) {
      params.username = searchForm.username;
    }

    if (searchForm.nickname) {
      params.nickname = searchForm.nickname;
    }

    if (searchForm.status !== '') {
      params.status = Number(searchForm.status);
    }

    if (searchForm.role_id !== undefined) {
      params.role_id = searchForm.role_id;
    }

    if (searchForm.created_start) {
      params.created_start = searchForm.created_start;
    }

    if (searchForm.created_end) {
      params.created_end = searchForm.created_end;
    }

    const response = await getAdminsApi(params);

    adminList.value = response.data;
    pagination.current_page = response.current_page;
    pagination.per_page = response.per_page;
    pagination.total = response.total;
  } catch (err) {
    console.error('获取管理员列表失败:', err);

    adminList.value = [];
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

    const responseMessage = (
      requestError?.response as { data?: { message?: string } }
    )?.data?.message;

    // requestClient 可能只抛出响应体或 axios 原始错误，这里统一兜底识别 403
    const errorText = `${requestError?.message ?? ''} ${responseMessage ?? ''}`;

    const isForbidden =
      status === 403 || errorText.includes('403') || errorText.includes('权限');

    errorStatus.value = isForbidden ? 403 : status || null;
    error.value = isForbidden
      ? '暂无权限查看管理员列表'
      : '管理员列表加载失败，请稍后重试';
  } finally {
    loading.value = false;
  }
}

/**
 * 获取角色列表
 */
async function getRoles() {
  const response = await getRolesApi();

  roles.value = response;
}

/**
 * 搜索
 */
function handleSearch() {
  pagination.current_page = 1;
  getAdminList();
}

/**
 * 重置
 */
function handleReset() {
  searchForm.username = '';
  searchForm.nickname = '';
  searchForm.status = '';
  searchForm.role_id = undefined;
  searchForm.created_start = '';
  searchForm.created_end = '';

  pagination.current_page = 1;

  getAdminList();
}

/**
 * 当前页改变
 */
function handlePageChange(page: number) {
  pagination.current_page = page;
  getAdminList();
}

/**
 * 每页数量改变
 */
function handleSizeChange(size: number) {
  pagination.per_page = size;
  pagination.current_page = 1;
  getAdminList();
}

/**
 * 打开新增弹窗
 */
async function handleAdd() {
  isEdit.value = false;
  currentId.value = null;

  resetForm();

  /**
   * 确保打开弹窗时角色数据也是最新的
   */
  await getRoles();

  dialogVisible.value = true;
}

/**
 * 打开编辑弹窗
 */
async function handleEdit(row: AdminItem) {
  isEdit.value = true;
  currentId.value = row.id;

  /**
   * 确保打开弹窗时角色数据也是最新的
   */
  await getRoles();

  form.username = row.username;
  form.nickname = row.nickname;
  form.password = '';
  form.email = row.email || '';
  form.mobile = row.mobile || '';
  form.status = row.status;

  /**
   * 回填角色
   */
  form.role_ids = Array.isArray(row.roles)
    ? row.roles
        .filter((role) => {
          return (
            role && typeof role.id === 'number' && Number.isFinite(role.id)
          );
        })
        .map((role) => role.id)
    : [];

  dialogVisible.value = true;
}

/**
 * 重置表单
 */
function resetForm() {
  form.username = '';
  form.nickname = '';
  form.password = '';
  form.email = '';
  form.mobile = '';
  form.status = 1;
  form.role_ids = [];

  formRef.value?.clearValidate();
}

/**
 * 弹窗关闭
 */
function handleDialogClose() {
  formRef.value?.resetFields();
  currentId.value = null;
  isEdit.value = false;
}

/**
 * 提交表单
 */
async function handleSubmit() {
  if (!formRef.value) {
    return;
  }

  await formRef.value.validate();

  /**
   * 编辑
   */
  if (isEdit.value) {
    if (currentId.value === null) {
      return;
    }

    const data: UpdateAdminParams = {
      username: form.username,
      nickname: form.nickname,
      email: form.email || undefined,
      mobile: form.mobile || undefined,
      status: form.status,
      role_ids: form.role_ids,
    };

    /**
     * 编辑时密码为空：
     * 不修改原密码
     */
    if (form.password) {
      data.password = form.password;
    }

    await updateAdminApi(currentId.value, data);

    ElMessage.success('管理员修改成功');
  } else {
    /**
     * 新增
     */
    const data: CreateAdminParams = {
      username: form.username,
      nickname: form.nickname,
      password: form.password,
      email: form.email || undefined,
      mobile: form.mobile || undefined,
      status: form.status,
      role_ids: form.role_ids,
    };

    await createAdminApi(data);

    ElMessage.success('管理员新增成功');
  }

  dialogVisible.value = false;

  await getAdminList();
}

/**
 * 删除管理员
 */
async function handleDelete(row: AdminItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除管理员「${row.username}」吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      },
    );

    await deleteAdminApi(row.id);

    ElMessage.success('管理员删除成功');

    /**
     * 如果当前页只剩一条数据，
     * 删除后返回上一页
     */
    if (adminList.value.length === 1 && pagination.current_page > 1) {
      pagination.current_page -= 1;
    }

    await getAdminList();
  } catch {
    /**
     * 用户取消删除，不处理
     */
  }
}

/**
 * 修改管理员状态
 *
 * 后端接口不需要提交 status，
 * 只需要调用：
 * PUT /admins/{id}/status
 *
 * 后端会根据当前状态进行 1 / 0 切换。
 */
async function handleStatusChange(
  row: AdminItem,
  value: boolean | number | string,
) {
  if (statusUpdatingIds.value.includes(row.id)) {
    return;
  }

  const oldStatus = row.status;

  /**
   * 根据 Switch 当前值，
   * 立即更新页面状态。
   */
  const newStatus = value ? 1 : 0;

  row.status = newStatus;

  statusUpdatingIds.value.push(row.id);

  try {
    const response = await updateAdminStatusApi(row.id);

    /**
     * 使用后端返回的最终状态校准前端状态。
     */
    row.status = response.status;

    ElMessage.success(row.status === 1 ? '管理员已启用' : '管理员已禁用');
  } catch (error) {
    /**
     * 接口失败，恢复原状态。
     */
    row.status = oldStatus;

    console.error(error);
  } finally {
    statusUpdatingIds.value = statusUpdatingIds.value.filter(
      (id) => id !== row.id,
    );
  }
}

/**
 * 状态文字
 */
function getStatusText(status: number) {
  return status === 1 ? '正常' : '禁用';
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
 *
 * 按照 created_at 原始时间进行排序，
 * 不按照格式化后的显示字符串排序。
 */
function sortByCreatedAt(a: AdminItem, b: AdminItem) {
  const timeA = new Date(a.created_at).getTime();
  const timeB = new Date(b.created_at).getTime();

  return timeA - timeB;
}

/**
 * 初始化
 */
onMounted(async () => {
  /**
   * 页面打开时：
   *
   * 1. 获取管理员列表
   * 2. 获取角色列表
   *
   * 这样角色筛选框在页面加载后就会有数据，
   * 而不需要先点击新增管理员。
   */
  await Promise.all([getAdminList(), getRoles()]);
});
</script>

<template>
  <div class="pcr-page admin-page">
    <!-- 筛选区域 -->
    <section class="pcr-filter-panel pcr-filter-panel--compact pcr-surface">
      <ElForm
        :model="searchForm"
        class="pcr-filter-row"
        label-position="left"
        @submit.prevent="handleSearch"
      >
        <ElFormItem class="pcr-filter-item pcr-filter-item--md" label="用户名">
          <ElInput
            v-model="searchForm.username"
            placeholder="请输入用户名"
            clearable
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem class="pcr-filter-item pcr-filter-item--sm" label="昵称">
          <ElInput
            v-model="searchForm.nickname"
            placeholder="请输入昵称"
            clearable
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem class="pcr-filter-item pcr-filter-item--xs" label="状态">
          <ElSelect
            v-model="searchForm.status"
            placeholder="请选择状态"
            clearable
          >
            <ElOption label="全部" value="" />

            <ElOption label="正常" :value="1" />

            <ElOption label="禁用" :value="0" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem class="pcr-filter-item pcr-filter-item--sm" label="角色">
          <ElSelect
            v-model="searchForm.role_id"
            placeholder="请选择角色"
            clearable
          >
            <ElOption
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem
          class="pcr-filter-item pcr-filter-item--range"
          label="创建时间"
        >
          <div class="pcr-filter-range">
            <ElDatePicker
              v-model="searchForm.created_start"
              type="date"
              placeholder="开始日期"
              value-format="YYYY-MM-DD"
            />

            <span class="pcr-filter-range__sep">至</span>

            <ElDatePicker
              v-model="searchForm.created_end"
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

    <!-- 管理员表格 -->
    <section class="pcr-table-shell">
      <div class="pcr-table-head">
        <span class="pcr-table-head__count">
          共 {{ pagination.total }} 个管理员
        </span>
        <div class="pcr-table-head__tools">
          <ElButton v-if="canCreateAdmin()" type="primary" @click="handleAdd">
            新增管理员
          </ElButton>
        </div>
      </div>

      <div v-if="error" class="table-state">
        <p class="table-state__title">{{ error }}</p>
        <ElButton
          v-if="errorStatus !== 403"
          type="primary"
          plain
          @click="getAdminList()"
        >
          重新加载
        </ElButton>
      </div>

      <template v-else>
        <ElTable
          v-loading="loading"
          :data="adminList"
          element-loading-text="加载管理员数据…"
          element-loading-background="var(--pcr-bg-surface)"
          style="width: 100%"
        >
          <ElTableColumn
            prop="id"
            label="ID"
            width="46"
            align="center"
            label-class-name="col-id"
          />

          <ElTableColumn
            prop="username"
            label="用户名"
            min-width="96"
            show-overflow-tooltip
          />

          <ElTableColumn prop="nickname" label="昵称" min-width="108" />

          <ElTableColumn label="角色" min-width="176">
            <template #default="scope">
              <div v-if="scope.row.roles?.length" class="role-tags">
                <span
                  v-for="role in scope.row.roles"
                  :key="role.id"
                  class="pcr-soft-tag pcr-soft-tag--primary"
                >
                  {{ role.name }}
                </span>
              </div>

              <span v-else class="cell-muted"> - </span>
            </template>
          </ElTableColumn>

          <ElTableColumn
            prop="email"
            label="邮箱"
            min-width="128"
            show-overflow-tooltip
          />

          <ElTableColumn
            prop="mobile"
            label="手机号"
            min-width="112"
            show-overflow-tooltip
          />

          <!-- 状态 -->
          <ElTableColumn label="状态" width="64" align="center">
            <template #default="scope">
              <ElSwitch
                v-if="canUpdateAdminStatus()"
                :model-value="scope.row.status === 1"
                :active-value="true"
                :inactive-value="false"
                :loading="statusUpdatingIds.includes(scope.row.id)"
                @change="handleStatusChange(scope.row, $event)"
              />

              <span
                v-else
                class="pcr-soft-tag"
                :class="
                  scope.row.status === 1
                    ? 'pcr-soft-tag--success'
                    : 'pcr-soft-tag--muted'
                "
              >
                {{ getStatusText(scope.row.status) }}
              </span>
            </template>
          </ElTableColumn>

          <ElTableColumn label="最后登录时间" min-width="120">
            <template #default="scope">
              {{ formatDateTime(scope.row.last_login_at) }}
            </template>
          </ElTableColumn>

          <ElTableColumn
            prop="last_login_ip"
            label="最后登录IP"
            min-width="104"
            show-overflow-tooltip
          />

          <!-- 创建时间 -->
          <ElTableColumn
            label="创建时间"
            min-width="120"
            sortable
            :sort-method="sortByCreatedAt"
          >
            <template #default="scope">
              {{ formatDateTime(scope.row.created_at) }}
            </template>
          </ElTableColumn>

          <ElTableColumn label="操作" width="96" fixed="right" align="center">
            <template #default="scope">
              <div class="table-actions">
                <ElButton
                  v-if="canUpdateAdmin()"
                  type="primary"
                  link
                  @click="handleEdit(scope.row)"
                >
                  编辑
                </ElButton>

                <ElButton
                  v-if="canDeleteAdmin()"
                  type="danger"
                  link
                  @click="handleDelete(scope.row)"
                >
                  删除
                </ElButton>

                <span
                  v-if="!canUpdateAdmin() && !canDeleteAdmin()"
                  class="no-permission"
                >
                  无操作权限
                </span>
              </div>
            </template>
          </ElTableColumn>

          <template #empty>
            <div class="table-empty">
              <ElEmpty :image-size="72" description="暂无管理员数据" />
              <p>调整筛选条件或新增管理员后再试</p>
            </div>
          </template>
        </ElTable>

        <!-- 分页 -->
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

    <!-- 新增 / 编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑管理员' : '新增管理员'"
      width="600px"
      destroy-on-close
      modal-class="pcr-admin-dialog"
      @closed="handleDialogClose"
    >
      <ElForm
        ref="formRef"
        :model="form"
        :rules="formRules"
        class="admin-form"
        label-width="90px"
      >
        <ElFormItem label="用户名" prop="username">
          <ElInput
            v-model="form.username"
            placeholder="请输入用户名"
            maxlength="50"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="昵称" prop="nickname">
          <ElInput
            v-model="form.nickname"
            placeholder="请输入昵称"
            maxlength="50"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="密码" prop="password">
          <ElInput
            v-model="form.password"
            type="password"
            show-password
            :placeholder="isEdit ? '不修改密码请留空' : '请输入密码，至少6位'"
          />
        </ElFormItem>

        <ElFormItem label="邮箱" prop="email">
          <ElInput
            v-model="form.email"
            placeholder="请输入邮箱"
            maxlength="100"
          />
        </ElFormItem>

        <ElFormItem label="手机号" prop="mobile">
          <ElInput
            v-model="form.mobile"
            placeholder="请输入手机号"
            maxlength="20"
          />
        </ElFormItem>

        <ElFormItem label="状态" prop="status">
          <ElRadioGroup v-model="form.status">
            <ElRadio :value="1"> 正常 </ElRadio>

            <ElRadio :value="0"> 禁用 </ElRadio>
          </ElRadioGroup>
        </ElFormItem>

        <ElFormItem label="角色" prop="role_ids">
          <ElSelect
            v-model="form.role_ids"
            multiple
            clearable
            placeholder="请选择角色"
            style="width: 100%"
          >
            <ElOption
              v-for="role in roles"
              :key="role.id"
              :label="role.name"
              :value="role.id"
            />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="dialogVisible = false"> 取消 </ElButton>

          <ElButton type="primary" @click="handleSubmit"> 确定 </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.admin-page {
  min-width: 0;
}

.admin-page :deep(.el-table .cell) {
  padding: 0 6px;
}

.admin-page :deep(th.col-id .cell) {
  padding: 0;
  white-space: nowrap;
}

.table-actions {
  display: inline-flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}

.table-actions :deep(.el-button + .el-button) {
  margin-left: 0;
}

.role-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.role-tags :deep(.pcr-soft-tag) {
  height: 22px;
  padding: 0 6px;
}

.cell-muted {
  color: var(--pcr-text-muted);
}

.no-permission {
  font-size: var(--pcr-font-size-caption);
  color: var(--pcr-text-muted);
}

.table-state {
  display: flex;
  flex-direction: column;
  gap: var(--pcr-space-3);
  align-items: center;
  padding: var(--pcr-space-7) 0;
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

.admin-form :deep(.el-input__wrapper),
.admin-form :deep(.el-select__wrapper) {
  min-height: 36px;
  border-radius: var(--pcr-radius-md);
}

.dialog-footer {
  display: flex;
  gap: var(--pcr-space-2);
  justify-content: flex-end;
}

.dialog-footer :deep(.el-button) {
  height: 36px;
  padding: 0 18px;
  margin-left: 0;
  border-radius: var(--pcr-radius-md);
}

@media (max-width: 600px) {
  .admin-page {
    padding: var(--pcr-space-4);
  }
}
</style>

<style>
.pcr-admin-dialog .el-dialog {
  display: flex;
  flex-direction: column;
  max-width: calc(100vw - 24px);
  max-height: calc(100vh - 48px);
  margin: 24px auto !important;
  overflow: hidden;
  background: var(--pcr-bg-surface);
  border: var(--pcr-border-width) solid var(--pcr-border);
  border-radius: var(--pcr-radius-lg);
  box-shadow: var(--pcr-shadow-overlay);
}

.pcr-admin-dialog .el-dialog__header {
  padding-bottom: var(--pcr-space-3);
  margin-right: 0;
  border-bottom: var(--pcr-border-width) solid var(--pcr-border);
}

.pcr-admin-dialog .el-dialog__title {
  font-size: var(--pcr-font-size-section-title);
  font-weight: var(--pcr-font-weight-semibold);
  color: var(--pcr-text-primary);
}

.pcr-admin-dialog .el-dialog__body {
  flex: 1 1 auto;
  min-height: 0;
  padding-top: var(--pcr-space-4);
  overflow-y: auto;
}

.pcr-admin-dialog .el-dialog__footer {
  padding-top: var(--pcr-space-3);
  border-top: var(--pcr-border-width) solid var(--pcr-border);
}
</style>
