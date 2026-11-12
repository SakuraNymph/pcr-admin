<script setup lang="ts">
import type { MenuItem } from '#/api/core/menu';
import type { PermissionItem } from '#/api/core/permission';

import { onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElDialog,
  ElForm,
  ElFormItem,
  ElInput,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTreeSelect,
} from 'element-plus';

import { getAllMenusApi } from '#/api/core/menu';
import { createPermission, deletePermission, getPermissionsApi, updatePermission } from '#/api/core/permission';

interface PermissionForm {
  id?: number;
  name: string;
  display_name: string;
  http_method: PermissionItem['http_method'];
  http_path: string;
  menu_id: null | number;
}

interface MenuTreeSelectItem extends MenuItem {
  children?: MenuTreeSelectItem[];
  disabled?: boolean;
}

/** =========================
 * 权限
 * ========================= */

const { hasAccessByCodes } = useAccess();

/**
 * Vben 5.7.0 的 hasAccessByCodes 参数必须是数组。
 *
 * 权限说明：
 *
 * system:permission:create
 * 新增权限
 *
 * system:permission:update
 * 编辑权限
 *
 * system:permission:delete
 * 删除权限
 */
const canCreate = hasAccessByCodes(['system:permission:create']);

const canUpdate = hasAccessByCodes(['system:permission:update']);

const canDelete = hasAccessByCodes(['system:permission:delete']);

/** =========================
 * 数据
 * ========================= */

const loading = ref(false);

const permissionList = ref<PermissionItem[]>([]);

const menuList = ref<MenuTreeSelectItem[]>([]);

const menuLoading = ref(false);

/** =========================
 * 弹窗 / 表单
 * ========================= */

const dialogVisible = ref(false);

const dialogTitle = ref('新增权限');

const saving = ref(false);

const formRef = ref();

const form = reactive<PermissionForm>({
  name: '',
  display_name: '',
  http_method: 'GET',
  http_path: '',
  menu_id: null,
});

const formRules = {
  name: [
    {
      required: true,
      message: '请输入权限名称',
      trigger: 'blur',
    },
  ],
  display_name: [
    {
      required: true,
      message: '请输入权限描述',
      trigger: 'blur',
    },
  ],
  http_method: [
    {
      required: true,
      message: '请选择请求方式',
      trigger: 'change',
    },
  ],
  http_path: [
    {
      required: true,
      message: '请输入 API 路径',
      trigger: 'blur',
    },
  ],
};

const methodOptions: PermissionItem['http_method'][] = [
  'GET',
  'POST',
  'PUT',
  'PATCH',
  'DELETE',
];

/** =========================
 * 表单方法
 * ========================= */

function resetForm() {
  form.id = undefined;
  form.name = '';
  form.display_name = '';
  form.http_method = 'GET';
  form.http_path = '';
  form.menu_id = null;
}

/**
 * 标记菜单 TreeSelect 的禁用状态。
 *
 * type = 3 表示按钮权限，不允许作为 API 权限关联菜单。
 */
function markMenuDisabled(item: MenuItem): MenuTreeSelectItem {
  return {
    ...item,
    disabled: item.type === 3,
    children: item.children?.map((child) => markMenuDisabled(child)),
  };
}

/** =========================
 * 获取数据
 * ========================= */

/**
 * 获取权限列表
 */
async function getPermissionList() {
  loading.value = true;

  try {
    const permissions = await getPermissionsApi();

    permissionList.value = permissions;
  } catch (error) {
    console.error(error);

    ElMessage.error('获取权限列表失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 获取菜单列表
 */
async function getMenuList() {
  menuLoading.value = true;

  try {
    const menus = await getAllMenusApi();

    menuList.value = menus.map((item) => markMenuDisabled(item));
  } catch (error) {
    console.error(error);

    ElMessage.error('获取菜单列表失败');
  } finally {
    menuLoading.value = false;
  }
}

/** =========================
 * 新增 / 编辑
 * ========================= */

/**
 * 新增权限
 */
function handleAdd() {
  resetForm();

  dialogTitle.value = '新增权限';

  dialogVisible.value = true;
}

/**
 * 编辑权限
 */
function handleEdit(row: PermissionItem) {
  form.id = row.id;
  form.name = row.name;
  form.display_name = row.display_name;
  form.http_method = row.http_method;
  form.http_path = row.http_path;
  form.menu_id = row.menu_id;

  dialogTitle.value = '编辑权限';

  dialogVisible.value = true;
}

/**
 * 保存权限
 */
async function handleSubmit() {
  if (!formRef.value) {
    return;
  }

  const valid = await formRef.value.validate();

  if (!valid) {
    return;
  }

  saving.value = true;

  try {
    const payload = {
      name: form.name,
      display_name: form.display_name,
      http_method: form.http_method,
      http_path: form.http_path,
      menu_id: form.menu_id,
    };

    if (form.id) {
      await updatePermission(form.id, payload);

      ElMessage.success('权限修改成功');
    } else {
      await createPermission(payload);

      ElMessage.success('权限创建成功');
    }

    dialogVisible.value = false;

    await getPermissionList();
  } catch (error) {
    console.error(error);

    ElMessage.error('操作失败');
  } finally {
    saving.value = false;
  }
}

/** =========================
 * 删除
 * ========================= */

async function handleDelete(row: PermissionItem) {
  try {
    await ElMessageBox.confirm(
      `确定要删除权限「${row.display_name}」吗？`,
      '删除权限',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      },
    );

    await deletePermission(row.id);

    ElMessage.success('权限删除成功');

    await getPermissionList();
  } catch (error: any) {
    /**
     * 用户取消或者关闭弹窗时不提示。
     */
    if (error === 'cancel' || error === 'close') {
      return;
    }

    console.error(error);
  }
}

/** =========================
 * 显示辅助方法
 * ========================= */

function getMethodType(method: PermissionItem['http_method']) {
  switch (method) {
    case 'DELETE': {
      return 'danger';
    }

    case 'GET': {
      return 'success';
    }

    case 'PATCH': {
      return 'warning';
    }

    case 'POST': {
      return 'primary';
    }

    case 'PUT': {
      return 'warning';
    }

    default: {
      return 'info';
    }
  }
}

function getMenuLabel(data: MenuItem) {
  return data.title || data.name;
}

/** =========================
 * 初始化
 * ========================= */

onMounted(() => {
  getPermissionList();
  getMenuList();
});
</script>

<template>
  <div class="p-5">
    <ElCard shadow="never">
      <template #header>
        <div class="flex items-center justify-between">
          <span class="text-base font-medium"> 权限管理 </span>

          <!-- 新增权限 -->
          <ElButton v-if="canCreate" type="primary" @click="handleAdd">
            新增权限
          </ElButton>
        </div>
      </template>

      <ElTable
        v-loading="loading"
        :data="permissionList"
        border
        stripe
        style="width: 100%"
      >
        <ElTableColumn label="ID" prop="id" width="80" align="center" />

        <ElTableColumn label="权限名称" prop="name" min-width="180" />

        <ElTableColumn label="权限描述" prop="display_name" min-width="180" />

        <ElTableColumn
          label="请求方式"
          prop="http_method"
          width="110"
          align="center"
        >
          <template #default="scope">
            <ElTag :type="getMethodType(scope.row.http_method)">
              {{ scope.row.http_method }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn label="API 路径" prop="http_path" min-width="300" />

        <ElTableColumn
          label="关联菜单"
          prop="menu_id"
          width="110"
          align="center"
        >
          <template #default="scope">
            {{ scope.row.menu_id ?? '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="创建时间" prop="created_at" min-width="180" />

        <!-- 操作 -->
        <ElTableColumn label="操作" width="150" fixed="right" align="center">
          <template #default="scope">
            <!-- 编辑 -->
            <ElButton
              v-if="canUpdate"
              link
              type="primary"
              @click="handleEdit(scope.row)"
            >
              编辑
            </ElButton>

            <!-- 删除 -->
            <ElButton
              v-if="canDelete"
              link
              type="danger"
              @click="handleDelete(scope.row)"
            >
              删除
            </ElButton>

            <!-- 没有操作权限 -->
            <span v-if="!canUpdate && !canDelete" class="no-permission">
              无操作权限
            </span>
          </template>
        </ElTableColumn>
      </ElTable>
    </ElCard>

    <!-- 新增 / 编辑权限 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="formRules" label-width="90px">
        <ElFormItem label="权限名称" prop="name">
          <ElInput
            v-model="form.name"
            placeholder="例如：admin:status"
            maxlength="100"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="权限描述" prop="display_name">
          <ElInput
            v-model="form.display_name"
            placeholder="例如：修改管理员状态"
            maxlength="100"
            show-word-limit
          />
        </ElFormItem>

        <ElFormItem label="请求方式" prop="http_method">
          <ElSelect
            v-model="form.http_method"
            placeholder="请选择请求方式"
            style="width: 100%"
          >
            <ElOption
              v-for="method in methodOptions"
              :key="method"
              :label="method"
              :value="method"
            />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="API 路径" prop="http_path">
          <ElInput
            v-model="form.http_path"
            placeholder="例如：/api/admin/admins/{admin}/status"
            maxlength="255"
          />
        </ElFormItem>

        <ElFormItem label="关联菜单">
          <ElTreeSelect
            v-model="form.menu_id"
            :data="menuList"
            :loading="menuLoading"
            node-key="id"
            :props="{
              label: 'title',
              children: 'children',
              disabled: 'disabled',
            }"
            :render-after-expand="false"
            check-strictly
            clearable
            filterable
            placeholder="请选择关联菜单"
            style="width: 100%"
          >
            <template #default="{ data }">
              {{ getMenuLabel(data) }}
            </template>
          </ElTreeSelect>
        </ElFormItem>
      </ElForm>

      <template #footer>
        <div>
          <ElButton @click="dialogVisible = false"> 取消 </ElButton>

          <ElButton type="primary" :loading="saving" @click="handleSubmit">
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.page-container {
  padding: 16px;
}

.no-permission {
  color: var(--el-text-color-secondary);
}
</style>
