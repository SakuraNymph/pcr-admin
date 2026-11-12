<script setup lang="ts">
import type { TreeNodeData } from 'element-plus';

import type { MenuItem } from '#/api/core/menu';
import type { PermissionItem } from '#/api/core/permission';
import type { RoleItem } from '#/api/core/role';

import { computed, nextTick, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElSelect,
  ElSwitch,
  ElTable,
  ElTableColumn,
  ElTag,
  ElTree,
} from 'element-plus';

import { getAllMenusApi } from '#/api/core/menu';
import { getPermissionsApi } from '#/api/core/permission';
import {
  createRoleApi,
  deleteRoleApi,
  getRoleMenusApi,
  getRolePermissionsApi,
  getRolesApi,
  updateRoleApi,
  updateRoleMenusApi,
  updateRolePermissionsApi,
} from '#/api/core/role';

const { hasAccessByCodes } = useAccess();

/**
 * =========================
 * 权限判断
 * =========================
 */

/**
 * 新增角色
 */
function canCreateRole() {
  return hasAccessByCodes(['system:role:create']);
}

/**
 * 修改角色
 */
function canUpdateRole() {
  return hasAccessByCodes(['system:role:update']);
}

/**
 * 删除角色
 */
function canDeleteRole() {
  return hasAccessByCodes(['system:role:delete']);
}

/**
 * 查看角色菜单权限
 */
function canListRoleMenus() {
  return hasAccessByCodes(['system:role:menu:list']);
}

/**
 * 修改角色菜单权限
 */
function canUpdateRoleMenus() {
  return hasAccessByCodes(['system:role:menu:update']);
}

/**
 * 查看角色 API 权限
 */
function canListRolePermissions() {
  return hasAccessByCodes(['system:role:permission:list']);
}

/**
 * 修改角色 API 权限
 */
function canUpdateRolePermissions() {
  return hasAccessByCodes(['system:role:permission:update']);
}

/**
 * 是否还有角色操作权限
 */
function hasRoleActions() {
  return (
    canListRoleMenus() ||
    canListRolePermissions() ||
    canUpdateRole() ||
    canDeleteRole()
  );
}

/**
 * =========================
 * 角色列表
 * =========================
 */

const loading = ref(false);

const tableData = ref<RoleItem[]>([]);

/**
 * 获取角色列表
 */
async function loadRoles() {
  loading.value = true;

  try {
    const response = await getRolesApi();

    tableData.value = response;
  } catch (error: any) {
    console.error('获取角色失败：', error);

    ElMessage.error(error?.message || '获取角色失败');
  } finally {
    loading.value = false;
  }
}

/**
 * =========================
 * 角色新增 / 编辑
 * =========================
 */

const dialogVisible = ref(false);

const dialogTitle = ref('新增角色');

const isEdit = ref(false);

const formRef = ref();

const form = reactive<any>({
  id: undefined,
  name: '',
  code: '',
  description: '',
  sort: 0,
  status: 1,
});

const rules = {
  name: [
    {
      required: true,
      message: '请输入角色名称',
      trigger: 'blur',
    },
  ],
  code: [
    {
      required: true,
      message: '请输入角色编码',
      trigger: 'blur',
    },
  ],
};

/**
 * 重置表单
 */
function resetForm() {
  form.id = undefined;
  form.name = '';
  form.code = '';
  form.description = '';
  form.sort = 0;
  form.status = 1;
}

/**
 * 填充编辑表单
 */
function fillForm(record: RoleItem) {
  form.id = record.id;
  form.name = record.name ?? '';
  form.code = record.code ?? '';
  form.description = record.description ?? '';
  form.sort = record.sort ?? 0;
  form.status = record.status ?? 1;
}

/**
 * 打开新增
 */
function openAddModal() {
  isEdit.value = false;
  dialogTitle.value = '新增角色';

  resetForm();

  dialogVisible.value = true;
}

/**
 * 打开编辑
 */
function openEditModal(row: RoleItem) {
  isEdit.value = true;
  dialogTitle.value = '编辑角色';

  resetForm();
  fillForm(row);

  dialogVisible.value = true;
}

/**
 * 提交角色
 */
async function handleSubmit() {
  try {
    await formRef.value?.validate();

    const payload = {
      name: form.name,
      code: form.code,
      description: form.description,
      sort: form.sort,
      status: form.status,
    };

    if (isEdit.value && form.id) {
      await updateRoleApi(form.id, payload);

      ElMessage.success('编辑成功');
    } else {
      await createRoleApi(payload);

      ElMessage.success('新增成功');
    }

    dialogVisible.value = false;

    await loadRoles();
  } catch (error: any) {
    if (error) {
      console.error(error);

      if (error?.message) {
        ElMessage.error(error.message);
      }
    }
  }
}

/**
 * 删除角色
 */
async function handleDelete(row: RoleItem) {
  try {
    await ElMessageBox.confirm(`确认删除角色「${row.name}」吗？`, '提示', {
      type: 'warning',
    });

    await deleteRoleApi(row.id);

    ElMessage.success('删除成功');

    await loadRoles();
  } catch (error) {
    if (error !== 'cancel' && error !== 'close') {
      console.error(error);
    }
  }
}

/**
 * 修改角色状态
 */
async function handleStatusChange(row: RoleItem, value: boolean) {
  const oldStatus = row.status;

  try {
    await updateRoleApi(row.id, {
      status: value ? 1 : 0,
    });

    row.status = value ? 1 : 0;

    ElMessage.success('状态更新成功');
  } catch (error: any) {
    console.error(error);

    row.status = oldStatus;

    ElMessage.error(error?.message || '状态更新失败');
  }
}

/**
 * =========================
 * 菜单权限
 * =========================
 */

const menuDialogVisible = ref(false);

const currentRole = ref<null | RoleItem>(null);

const menuLoading = ref(false);

const menuTree = ref<MenuItem[]>([]);

const checkedMenuIds = ref<number[]>([]);

const menuTreeRef = ref();

/**
 * 菜单类型名称
 */
function getMenuTypeName(type: number) {
  switch (Number(type)) {
    case 1: {
      return '目录';
    }

    case 2: {
      return '菜单';
    }

    case 3: {
      return '按钮';
    }

    default: {
      return '未知';
    }
  }
}

/**
 * 菜单节点显示名称
 */
function getMenuLabel(data: TreeNodeData) {
  const title = typeof data.title === 'string' ? data.title : '';
  const fallbackTitle = typeof data.name === 'string' ? data.name : '';

  return `${title || fallbackTitle}（${getMenuTypeName(Number(data.type))}）`;
}

/**
 * 打开菜单权限
 */
async function openMenuModal(row: RoleItem) {
  if (!canListRoleMenus()) {
    ElMessage.warning('没有查看角色菜单权限');
    return;
  }

  currentRole.value = row;

  menuDialogVisible.value = true;

  menuLoading.value = true;

  checkedMenuIds.value = [];

  try {
    const [allMenus, roleMenus] = await Promise.all([
      getAllMenusApi(),
      getRoleMenusApi(row.id),
    ]);

    menuTree.value = allMenus;
    checkedMenuIds.value = roleMenus
      .map((menu) => menu.id)
      .filter((id) => Number.isInteger(id) && id > 0);

    await nextTick();

    if (menuTreeRef.value) {
      menuTreeRef.value.setCheckedKeys(checkedMenuIds.value);
    }
  } catch (error: any) {
    console.error('获取菜单权限失败：', error);

    ElMessage.error(error?.message || '获取菜单权限失败');
  } finally {
    menuLoading.value = false;
  }
}

/**
 * 关闭菜单权限
 */
function closeMenuModal() {
  menuDialogVisible.value = false;

  currentRole.value = null;

  menuTree.value = [];

  checkedMenuIds.value = [];
}

/**
 * 菜单选中变化
 */
function handleMenuCheckChange(
  data: MenuItem,
  checkedInfo: {
    checkedKeys: Array<number | string>;
    halfCheckedKeys: Array<number | string>;
  },
) {
  console.log('当前变化节点：', data);

  console.log('完全选中：', checkedInfo.checkedKeys);

  console.log('半选中：', checkedInfo.halfCheckedKeys);
}

/**
 * 获取最终需要保存的菜单 ID
 */
function getSaveMenuIds() {
  if (!menuTreeRef.value) {
    return [];
  }

  const checkedKeys = menuTreeRef.value.getCheckedKeys() || [];

  const halfCheckedKeys = menuTreeRef.value.getHalfCheckedKeys?.() || [];

  const menuIds = [...checkedKeys, ...halfCheckedKeys]
    .map(Number)
    .filter((id: number) => Number.isInteger(id) && id > 0);

  return [...new Set(menuIds)];
}

/**
 * 保存菜单权限
 */
async function handleSaveMenus() {
  if (!canUpdateRoleMenus()) {
    ElMessage.warning('没有修改角色菜单权限');
    return;
  }

  if (!currentRole.value) {
    ElMessage.error('当前角色不存在');
    return;
  }

  try {
    menuLoading.value = true;

    const menuIds = getSaveMenuIds();

    await updateRoleMenusApi(currentRole.value.id, menuIds);

    ElMessage.success('菜单权限保存成功');

    closeMenuModal();
  } catch (error: any) {
    console.error('保存菜单权限失败：', error);

    ElMessage.error(error?.message || '保存菜单权限失败');
  } finally {
    menuLoading.value = false;
  }
}

/**
 * =========================
 * API 权限
 * =========================
 */

const permissionDialogVisible = ref(false);

const permissionLoading = ref(false);

const permissionSaving = ref(false);

const permissionList = ref<PermissionItem[]>([]);

const selectedPermissionIds = ref<number[]>([]);

const currentRolePermissionIds = ref<number[]>([]);

const permissionTableRef = ref();

const permissionKeyword = ref('');

const permissionMethod = ref<'' | PermissionItem['http_method']>('');

const permissionFilterMethodOptions: Array<'' | PermissionItem['http_method']> =
  ['', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Element Plus 表格正在同步已选状态
 *
 * 防止 toggleRowSelection 触发 selection-change
 * 后又把 selectedPermissionIds 覆盖掉。
 */
const syncingPermissionSelection = ref(false);

/**
 * 当前筛选后的 API 权限
 */
const filteredPermissions = computed(() => {
  const keyword = permissionKeyword.value.trim().toLowerCase();

  return permissionList.value.filter((permission) => {
    const name = String(permission.name || '').toLowerCase();

    const displayName = String(permission.display_name || '').toLowerCase();

    const httpPath = String(permission.http_path || '').toLowerCase();

    const matchKeyword =
      !keyword ||
      name.includes(keyword) ||
      displayName.includes(keyword) ||
      httpPath.includes(keyword);

    const matchMethod =
      !permissionMethod.value ||
      permission.http_method === permissionMethod.value;

    return matchKeyword && matchMethod;
  });
});

/**
 * 打开 API 权限
 */
async function openPermissionModal(row: RoleItem) {
  if (!canListRolePermissions()) {
    ElMessage.warning('没有查看角色 API 权限');

    return;
  }

  console.log('========== 打开 API 权限 ==========');

  console.log('当前角色：', row);

  currentRole.value = row;

  permissionDialogVisible.value = true;

  permissionLoading.value = true;

  permissionKeyword.value = '';

  permissionMethod.value = '';

  permissionList.value = [];

  selectedPermissionIds.value = [];

  currentRolePermissionIds.value = [];

  try {
    /**
     * 这里明确同时请求：
     *
     * 1. 全部 API 权限
     * 2. 当前角色 API 权限
     */
    const [allPermissions, rolePermissions] = await Promise.all([
      getPermissionsApi(),
      getRolePermissionsApi(row.id),
    ]);

    /**
     * 全部 API 权限
     */
    permissionList.value = allPermissions;

    /**
     * 当前角色已有 API 权限
     */
    const rolePermissionIds = [
      ...new Set(
        rolePermissions
          .map((permission) => permission.id)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];

    currentRolePermissionIds.value = rolePermissionIds;

    selectedPermissionIds.value = [...rolePermissionIds];

    console.log('全部 API 权限：', permissionList.value);

    console.log('当前角色 API 权限 ID：', currentRolePermissionIds.value);

    /**
     * 等待表格渲染完成，然后真正勾选
     * Element Plus selection checkbox。
     */
    await nextTick();

    await syncPermissionTableSelection();
  } catch (error: any) {
    console.error('获取角色 API 权限失败：', error);

    ElMessage.error(error?.message || '获取角色 API 权限失败');
  } finally {
    permissionLoading.value = false;
  }
}

/**
 * 将 selectedPermissionIds 同步到 Element Plus 表格
 */
async function syncPermissionTableSelection() {
  await nextTick();

  if (!permissionTableRef.value) {
    return;
  }

  syncingPermissionSelection.value = true;

  try {
    const selectedIds = new Set(selectedPermissionIds.value.map(Number));

    /**
     * 先清除当前表格所有选中状态
     */
    permissionTableRef.value.clearSelection();

    /**
     * 再按照 selectedPermissionIds
     * 重新勾选
     */
    filteredPermissions.value.forEach((permission) => {
      const permissionId = Number(permission.id);

      if (selectedIds.has(permissionId)) {
        permissionTableRef.value.toggleRowSelection(permission, true);
      }
    });
  } finally {
    syncingPermissionSelection.value = false;
  }
}

/**
 * API 权限筛选变化
 */
async function handlePermissionFilterChange() {
  await syncPermissionTableSelection();
}

/**
 * 关闭 API 权限弹窗
 */
function closePermissionModal() {
  permissionDialogVisible.value = false;

  permissionKeyword.value = '';

  permissionMethod.value = '';

  permissionList.value = [];

  selectedPermissionIds.value = [];

  currentRolePermissionIds.value = [];

  permissionTableRef.value?.clearSelection();
}

/**
 * API 权限选择变化
 */
function handlePermissionSelectionChange(selection: PermissionItem[]) {
  /**
   * 如果是程序主动同步 checkbox，
   * 不处理 selection-change。
   */
  if (syncingPermissionSelection.value) {
    return;
  }

  /**
   * 当前可见权限 ID
   */
  const visibleIds = new Set(
    filteredPermissions.value.map((permission) => Number(permission.id)),
  );

  /**
   * 当前可见且被选中的 ID
   */
  const selectedVisibleIds = new Set(
    selection.map((permission) => Number(permission.id)),
  );

  /**
   * 保留当前筛选条件之外的已选权限
   */
  const hiddenSelectedIds = selectedPermissionIds.value.filter(
    (id) => !visibleIds.has(Number(id)),
  );

  /**
   * 当前筛选结果中新的选中权限
   */
  const newSelectedIds = [...selectedVisibleIds];

  selectedPermissionIds.value = [
    ...new Set([...hiddenSelectedIds, ...newSelectedIds]),
  ];
}

/**
 * 全选当前筛选出来的 API 权限
 */
async function selectAllVisiblePermissions() {
  if (!canUpdateRolePermissions()) {
    ElMessage.warning('没有修改角色 API 权限');

    return;
  }

  const visibleIds = filteredPermissions.value.map((permission) =>
    Number(permission.id),
  );

  selectedPermissionIds.value = [
    ...new Set([...selectedPermissionIds.value, ...visibleIds]),
  ];

  await syncPermissionTableSelection();
}

/**
 * 取消当前筛选出来的 API 权限
 */
async function clearAllVisiblePermissions() {
  if (!canUpdateRolePermissions()) {
    ElMessage.warning('没有修改角色 API 权限');

    return;
  }

  const visibleIds = new Set(
    filteredPermissions.value.map((permission) => Number(permission.id)),
  );

  selectedPermissionIds.value = selectedPermissionIds.value.filter(
    (id) => !visibleIds.has(Number(id)),
  );

  await syncPermissionTableSelection();
}

/**
 * 保存 API 权限
 */
async function handleSavePermissions() {
  if (!canUpdateRolePermissions()) {
    ElMessage.warning('没有修改角色 API 权限');

    return;
  }

  if (!currentRole.value) {
    ElMessage.error('当前角色不存在');

    return;
  }

  try {
    permissionSaving.value = true;

    const permissionIds = [
      ...new Set(
        selectedPermissionIds.value
          .map(Number)
          .filter((id) => Number.isInteger(id) && id > 0),
      ),
    ];

    console.log('准备保存角色 API 权限');

    console.log('角色 ID：', currentRole.value.id);

    console.log('权限 ID：', permissionIds);

    await updateRolePermissionsApi(currentRole.value.id, permissionIds);

    ElMessage.success('API 权限保存成功');

    closePermissionModal();
  } catch (error: any) {
    console.error('保存 API 权限失败：', error);

    ElMessage.error(error?.message || '保存 API 权限失败');
  } finally {
    permissionSaving.value = false;
  }
}

/**
 * HTTP Method 标签颜色
 */
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

/**
 * 页面初始化
 */
loadRoles();
</script>

<template>
  <div class="page-container">
    <div class="toolbar">
      <ElButton v-if="canCreateRole()" type="primary" @click="openAddModal">
        新增角色
      </ElButton>
    </div>

    <ElTable v-loading="loading" :data="tableData" border style="width: 100%">
      <ElTableColumn type="index" label="序号" width="70" />

      <ElTableColumn prop="name" label="角色名称" min-width="160" />

      <ElTableColumn prop="code" label="角色编码" min-width="180" />

      <ElTableColumn prop="description" label="描述" min-width="220" />

      <ElTableColumn prop="sort" label="排序" width="90" />

      <ElTableColumn label="状态" width="100">
        <template #default="scope">
          <ElSwitch
            v-if="scope?.row && canUpdateRole()"
            :model-value="Number(scope.row.status) === 1"
            @change="(value) => handleStatusChange(scope.row, !!value)"
          />

          <ElTag
            v-else-if="scope?.row"
            :type="Number(scope.row.status) === 1 ? 'success' : 'info'"
          >
            {{ Number(scope.row.status) === 1 ? '启用' : '禁用' }}
          </ElTag>
        </template>
      </ElTableColumn>

      <ElTableColumn label="操作" min-width="350" fixed="right">
        <template #default="scope">
          <template v-if="scope?.row">
            <ElButton
              v-if="canListRoleMenus()"
              type="success"
              link
              @click="openMenuModal(scope.row)"
            >
              菜单权限
            </ElButton>

            <ElButton
              v-if="canListRolePermissions()"
              type="warning"
              link
              @click="openPermissionModal(scope.row)"
            >
              API权限
            </ElButton>

            <ElButton
              v-if="canUpdateRole()"
              type="primary"
              link
              @click="openEditModal(scope.row)"
            >
              编辑
            </ElButton>

            <ElButton
              v-if="canDeleteRole()"
              type="danger"
              link
              @click="handleDelete(scope.row)"
            >
              删除
            </ElButton>

            <span v-if="!hasRoleActions()" class="no-permission">
              无操作权限
            </span>
          </template>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 新增 / 编辑角色 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="角色名称" prop="name">
          <ElInput v-model="form.name" placeholder="请输入角色名称" />
        </ElFormItem>

        <ElFormItem label="角色编码" prop="code">
          <ElInput v-model="form.code" placeholder="例如：data_admin" />
        </ElFormItem>

        <ElFormItem label="描述" prop="description">
          <ElInput
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入角色描述"
          />
        </ElFormItem>

        <ElFormItem label="排序" prop="sort">
          <ElInputNumber v-model="form.sort" :min="0" style="width: 100%" />
        </ElFormItem>

        <ElFormItem label="状态" prop="status">
          <ElSelect v-model="form.status" style="width: 100%">
            <ElOption :value="1" label="启用" />

            <ElOption :value="0" label="禁用" />
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

    <!-- 菜单权限 -->
    <ElDialog
      v-model="menuDialogVisible"
      :title="`${currentRole?.name || ''} - 菜单权限`"
      width="650px"
      destroy-on-close
      @closed="closeMenuModal"
    >
      <div v-loading="menuLoading" class="menu-tree-container">
        <ElTree
          ref="menuTreeRef"
          :data="menuTree"
          node-key="id"
          show-checkbox
          default-expand-all
          :default-checked-keys="checkedMenuIds"
          :props="{
            label: getMenuLabel,
            children: 'children',
          }"
          @check="handleMenuCheckChange"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="closeMenuModal"> 取消 </ElButton>

          <ElButton
            v-if="canUpdateRoleMenus()"
            type="primary"
            :loading="menuLoading"
            @click="handleSaveMenus"
          >
            保存
          </ElButton>
        </div>
      </template>
    </ElDialog>

    <!-- API 权限 -->
    <ElDialog
      v-model="permissionDialogVisible"
      :title="`${currentRole?.name || ''} - API权限`"
      width="1100px"
      destroy-on-close
      @closed="closePermissionModal"
    >
      <div v-loading="permissionLoading" class="permission-container">
        <!-- 筛选区域 -->
        <div class="permission-toolbar">
          <ElInput
            v-model="permissionKeyword"
            clearable
            placeholder="搜索权限名称、描述或 API 路径"
            style="width: 320px"
            @input="handlePermissionFilterChange"
          />

          <ElSelect
            v-model="permissionMethod"
            clearable
            placeholder="请求方式"
            style="width: 140px"
            @change="handlePermissionFilterChange"
          >
            <ElOption
              v-for="method in permissionFilterMethodOptions"
              :key="method || 'all'"
              :label="method || '全部'"
              :value="method"
            />
          </ElSelect>

          <ElButton
            v-if="canUpdateRolePermissions()"
            type="primary"
            @click="selectAllVisiblePermissions"
          >
            全选当前
          </ElButton>

          <ElButton
            v-if="canUpdateRolePermissions()"
            @click="clearAllVisiblePermissions"
          >
            取消当前
          </ElButton>

          <span class="selected-count">
            已选择
            {{ selectedPermissionIds.length }}
            项
          </span>
        </div>

        <!-- API 权限列表 -->
        <ElTable
          ref="permissionTableRef"
          :data="filteredPermissions"
          border
          stripe
          height="480"
          row-key="id"
          @selection-change="handlePermissionSelectionChange"
        >
          <ElTableColumn type="selection" width="55" align="center" />

          <ElTableColumn prop="name" label="权限名称" min-width="220" />

          <ElTableColumn prop="display_name" label="权限描述" min-width="180" />

          <ElTableColumn
            label="请求方式"
            prop="http_method"
            width="100"
            align="center"
          >
            <template #default="scope">
              <ElTag
                v-if="scope?.row"
                :type="getMethodType(scope.row.http_method)"
              >
                {{ scope.row.http_method }}
              </ElTag>
            </template>
          </ElTableColumn>

          <ElTableColumn prop="http_path" label="API路径" min-width="320" />

          <ElTableColumn
            prop="menu_id"
            label="菜单ID"
            width="90"
            align="center"
          >
            <template #default="scope">
              {{ scope?.row?.menu_id ?? '-' }}
            </template>
          </ElTableColumn>
        </ElTable>

        <ElEmpty
          v-if="!permissionLoading && filteredPermissions.length === 0"
          description="没有找到 API 权限"
        />
      </div>

      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="closePermissionModal"> 取消 </ElButton>

          <ElButton
            v-if="canUpdateRolePermissions()"
            type="primary"
            :loading="permissionSaving"
            @click="handleSavePermissions"
          >
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

.toolbar {
  margin-bottom: 16px;
}

.dialog-footer {
  text-align: right;
}

.menu-tree-container {
  min-height: 300px;
  max-height: 500px;
  padding: 8px 16px;
  overflow-y: auto;
}

.permission-container {
  min-height: 300px;
}

.permission-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.selected-count {
  margin-left: auto;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.no-permission {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
