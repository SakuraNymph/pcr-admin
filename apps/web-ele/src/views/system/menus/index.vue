<script setup lang="ts">
import type { MenuItem } from '#/api/core/menu';

import { reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElDialog,
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
} from 'element-plus';

import { createMenu, deleteMenu, getAllMenusApi, updateMenu } from '#/api/core/menu';

/** =========================
 * 权限
 * ========================= */

const { hasAccessByCodes } = useAccess();

/**
 * 注意：
 * Vben 5.7.0 的 hasAccessByCodes 参数必须是数组
 */
const canCreate = hasAccessByCodes(['system:menu:create']);
const canUpdate = hasAccessByCodes(['system:menu:update']);
const canDelete = hasAccessByCodes(['system:menu:delete']);
const canStatus = hasAccessByCodes(['system:menu:status']);

/** =========================
 * 数据区
 * ========================= */

const loading = ref(false);
const tableData = ref<MenuItem[]>([]);

async function loadMenus() {
  loading.value = true;

  try {
    const res = await getAllMenusApi();
    tableData.value = Array.isArray(res) ? res : [];
  } catch (error: any) {
    console.error(error);
    ElMessage.error(error?.message || '获取菜单失败');
  } finally {
    loading.value = false;
  }
}

/** =========================
 * 弹窗 / 表单
 * ========================= */

const dialogVisible = ref(false);
const dialogTitle = ref('新增菜单');
const isEdit = ref(false);
const formRef = ref();

const form = reactive<any>({
  id: undefined,
  parent_id: 0,
  type: 1,
  title: '',
  name: '',
  path: '',
  component: '',
  redirect: '',
  icon: '',
  sort: 0,
  status: 1,
});

const rules = {
  title: [
    {
      required: true,
      message: '请输入标题',
      trigger: 'blur',
    },
  ],
  type: [
    {
      required: true,
      message: '请选择类型',
      trigger: 'change',
    },
  ],
};

function resetForm() {
  form.id = undefined;
  form.parent_id = 0;
  form.type = 1;
  form.title = '';
  form.name = '';
  form.path = '';
  form.component = '';
  form.redirect = '';
  form.icon = '';
  form.sort = 0;
  form.status = 1;
}

function fillForm(record: Partial<MenuItem>) {
  form.id = record.id;
  form.parent_id = record.parent_id ?? 0;
  form.type = record.type ?? 1;
  form.title = record.title ?? '';
  form.name = (record as any).name ?? '';
  form.path = record.path ?? '';
  form.component = (record as any).component ?? '';
  form.redirect = (record as any).redirect ?? '';
  form.icon = (record as any).icon ?? '';
  form.sort = (record as any).sort ?? 0;
  form.status = record.status ?? 1;
}

/**
 * 打开新增菜单弹窗
 */
function openAddModal() {
  isEdit.value = false;
  dialogTitle.value = '新增菜单';

  resetForm();

  dialogVisible.value = true;
}

/**
 * 打开编辑弹窗
 */
function openEditModal(row: MenuItem) {
  isEdit.value = true;
  dialogTitle.value = '编辑菜单';

  resetForm();
  fillForm(row);

  dialogVisible.value = true;
}

/**
 * 打开新增下级菜单弹窗
 */
function openChildModal(row: MenuItem) {
  isEdit.value = false;
  dialogTitle.value = '新增下级菜单';

  resetForm();

  form.parent_id = row.id;
  form.type = 2;

  dialogVisible.value = true;
}

/**
 * 提交表单
 */
async function handleSubmit() {
  try {
    await formRef.value?.validate();

    const payload = {
      parent_id: form.parent_id,
      type: form.type,
      title: form.title,
      name: form.name,
      path: form.path,
      component: form.component,
      redirect: form.redirect,
      icon: form.icon,
      sort: form.sort,
      status: form.status,
    };

    if (isEdit.value && form.id) {
      await updateMenu(form.id, payload);

      ElMessage.success('编辑成功');
    } else {
      await createMenu(payload);

      ElMessage.success('新增成功');
    }

    dialogVisible.value = false;

    await loadMenus();
  } catch (error: any) {
    /**
     * Element Plus 表单验证失败时也会进入 catch。
     * 所以这里只处理真正的异常。
     */
    if (error) {
      console.error(error);

      if (error?.message) {
        ElMessage.error(error.message);
      }
    }
  }
}

/** =========================
 * 删除 / 状态切换
 * ========================= */

/**
 * 删除菜单
 */
async function handleDelete(row: MenuItem) {
  try {
    await ElMessageBox.confirm(`确认删除菜单「${row.title}」吗？`, '提示', {
      type: 'warning',
    });

    await deleteMenu([row.id]);

    ElMessage.success('删除成功');

    await loadMenus();
  } catch (error) {
    /**
     * 用户点击取消或者关闭弹窗时不提示。
     */
    if (error !== 'cancel' && error !== 'close') {
      console.error(error);
    }
  }
}

/**
 * 修改菜单状态
 */
async function handleStatusChange(row: MenuItem, value: boolean) {
  try {
    await updateMenu(row.id, {
      status: value ? 1 : 0,
    });

    row.status = value ? 1 : 0;

    ElMessage.success('状态更新成功');
  } catch (error: any) {
    console.error(error);

    ElMessage.error(error?.message || '状态更新失败');

    /**
     * 请求失败后恢复原状态。
     */
    row.status = row.status === 1 ? 1 : 0;
  }
}

/**
 * 菜单类型文字
 */
function typeText(type: number) {
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
      return '--';
    }
  }
}

loadMenus();
</script>

<template>
  <div class="page-container">
    <!-- 工具栏 -->
    <div class="toolbar">
      <ElButton v-if="canCreate" type="primary" @click="openAddModal">
        新增菜单
      </ElButton>
    </div>

    <!-- 菜单列表 -->
    <ElTable
      v-loading="loading"
      :data="tableData"
      row-key="id"
      border
      default-expand-all
      :tree-props="{ children: 'children' }"
      style="width: 100%"
    >
      <ElTableColumn type="index" label="序号" width="70" />

      <ElTableColumn prop="title" label="标题" min-width="180" />

      <ElTableColumn label="类型" width="100">
        <template #default="{ row }">
          {{ typeText(row.type) }}
        </template>
      </ElTableColumn>

      <ElTableColumn prop="path" label="路径" min-width="180" />

      <ElTableColumn prop="component" label="组件路径" min-width="220" />

      <ElTableColumn prop="sort" label="排序" width="90" />

      <!-- 状态 -->
      <ElTableColumn label="状态" width="100">
        <template #default="{ row }">
          <!-- 有权限：显示开关 -->
          <ElSwitch
            v-if="canStatus"
            :model-value="Number(row.status) === 1"
            @change="(val) => handleStatusChange(row, !!val)"
          />

          <!-- 没有权限：只显示状态 -->
          <span v-else>
            {{ Number(row.status) === 1 ? '启用' : '禁用' }}
          </span>
        </template>
      </ElTableColumn>

      <!-- 操作 -->
      <ElTableColumn label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <!-- 编辑 -->
          <ElButton
            v-if="canUpdate"
            type="primary"
            link
            @click="openEditModal(row)"
          >
            编辑
          </ElButton>

          <!-- 新增下级 -->
          <ElButton
            v-if="canCreate"
            type="success"
            link
            @click="openChildModal(row)"
          >
            新增下级
          </ElButton>

          <!-- 删除 -->
          <ElButton
            v-if="canDelete"
            type="danger"
            link
            @click="handleDelete(row)"
          >
            删除
          </ElButton>

          <!-- 没有任何操作权限 -->
          <span
            v-if="!canUpdate && !canCreate && !canDelete"
            class="no-permission"
          >
            无操作权限
          </span>
        </template>
      </ElTableColumn>
    </ElTable>

    <!-- 新增 / 编辑弹窗 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
      destroy-on-close
    >
      <ElForm ref="formRef" :model="form" :rules="rules" label-width="100px">
        <ElFormItem label="父级ID" prop="parent_id">
          <ElInputNumber
            v-model="form.parent_id"
            :min="0"
            style="width: 100%"
          />
        </ElFormItem>

        <ElFormItem label="类型" prop="type">
          <ElSelect v-model="form.type" style="width: 100%">
            <ElOption :value="1" label="目录" />

            <ElOption :value="2" label="菜单" />

            <ElOption :value="3" label="按钮" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="标题" prop="title">
          <ElInput v-model="form.title" placeholder="请输入标题" />
        </ElFormItem>

        <ElFormItem label="路由名称" prop="name">
          <ElInput v-model="form.name" placeholder="例如：SystemMenu" />
        </ElFormItem>

        <ElFormItem label="路由路径" prop="path">
          <ElInput v-model="form.path" placeholder="例如：/system/menu" />
        </ElFormItem>

        <ElFormItem label="组件路径" prop="component">
          <ElInput
            v-model="form.component"
            placeholder="例如：/dashboard/menus/index"
          />
        </ElFormItem>

        <ElFormItem label="重定向" prop="redirect">
          <ElInput v-model="form.redirect" />
        </ElFormItem>

        <ElFormItem label="图标" prop="icon">
          <ElInput v-model="form.icon" />
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

.no-permission {
  color: var(--el-text-color-secondary);
}
</style>
