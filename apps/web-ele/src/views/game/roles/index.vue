<script lang="ts" setup>
import type { CreateGameRolePayload, GameRoleItem, GameRoleListResult, UpdateGameRolePayload } from '#/api/core/game-role';

import { computed, onMounted, reactive, ref } from 'vue';

import { useAccess } from '@vben/access';

import {
  ElButton,
  ElCard,
  ElCol,
  ElDatePicker,
  ElDescriptions,
  ElDescriptionsItem,
  ElDialog,
  ElEmpty,
  ElForm,
  ElFormItem,
  ElImage,
  ElInput,
  ElInputNumber,
  ElMessage,
  ElMessageBox,
  ElOption,
  ElPagination,
  ElRow,
  ElSelect,
  ElTable,
  ElTableColumn,
  ElTag,
} from 'element-plus';

import { createGameRoleApi, deleteGameRoleApi, getGameRoleApi, getGameRolesApi, updateGameRoleApi } from '#/api/core/game-role';

const { hasAccessByCodes } = useAccess();

/**
 * 权限
 */
const canCreate = computed(() => hasAccessByCodes(['system:game-role:create']));

const canDetail = computed(() => hasAccessByCodes(['system:game-role:detail']));

const canUpdate = computed(() => hasAccessByCodes(['system:game-role:update']));

const canDelete = computed(() => hasAccessByCodes(['system:game-role:delete']));

/**
 * 列表
 */
const loading = ref(false);
const gameRoles = ref<GameRoleItem[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);

/**
 * 搜索条件
 */
const searchForm = reactive({
  name: '',
  element: undefined as number | undefined,
  atk_type: undefined as number | undefined,
  position: undefined as number | undefined,
  is_clan_battle: undefined as boolean | undefined,
  status: undefined as boolean | undefined,
  obtain: undefined as number | undefined,
  probability: undefined as number | undefined,
});

/**
 * 新增 / 编辑弹窗
 */
const dialogVisible = ref(false);
const dialogLoading = ref(false);
const dialogTitle = ref('');
const isEdit = ref(false);
const formRef = ref();

const form = reactive<CreateGameRolePayload & { id: number }>({
  id: 0,
  name_a: '',
  name_b: '',
  nickname: '',
  element: 1,
  atk_type: 1,
  is_clan_battle: false,
  search_area_width: 0,
  position: 1,
  obtain: 1,
  probability: 1,
  up_time: null,
  status: true,
});

/**
 * 详情弹窗
 */
const detailVisible = ref(false);
const detailLoading = ref(false);
const detailData = ref<GameRoleItem | null>(null);

/**
 * 表单验证
 */
const formRules = {
  id: [
    {
      required: true,
      message: '请输入角色ID',
      trigger: 'blur',
    },
    {
      type: 'number',
      min: 1,
      message: '角色ID必须大于0',
      trigger: 'blur',
    },
  ],
  name_a: [
    {
      required: true,
      message: '请输入名称A',
      trigger: 'blur',
    },
  ],
  nickname: [
    {
      required: true,
      message: '请输入昵称',
      trigger: 'blur',
    },
  ],
  search_area_width: [
    {
      required: true,
      message: '请输入搜索范围',
      trigger: 'blur',
    },
  ],
  element: [
    {
      required: true,
      message: '请选择属性',
      trigger: 'change',
    },
  ],
  atk_type: [
    {
      required: true,
      message: '请选择攻击类型',
      trigger: 'change',
    },
  ],
  position: [
    {
      required: true,
      message: '请选择位置',
      trigger: 'change',
    },
  ],
  obtain: [
    {
      required: true,
      message: '请选择获取方式',
      trigger: 'change',
    },
  ],
  probability: [
    {
      required: true,
      message: '请选择概率',
      trigger: 'change',
    },
  ],
};

/**
 * 属性配置
 */
const elementOptions = [
  {
    value: 1,
    label: '火',
    type: 'danger',
  },
  {
    value: 2,
    label: '水',
    type: 'primary',
  },
  {
    value: 3,
    label: '风',
    type: 'success',
  },
  {
    value: 4,
    label: '光',
    type: 'warning',
  },
  {
    value: 5,
    label: '暗',
    type: 'info',
  },
] as const;

/**
 * 获取属性名称
 */
function getElementLabel(value: number) {
  const element = elementOptions.find((item) => item.value === value);

  return element?.label ?? String(value);
}

/**
 * 获取属性 Tag 类型
 */
function getElementTagType(value: number) {
  const element = elementOptions.find((item) => item.value === value);

  return element?.type ?? 'info';
}

/**
 * 解析列表接口返回结果
 */
function parseListResult(response: any): GameRoleListResult {
  /**
   * requestClient 已经解包为：
   *
   * {
   *   items: [],
   *   total: 10,
   *   page: 1,
   *   pageSize: 20
   * }
   */
  if (Array.isArray(response?.items)) {
    return {
      items: response.items,
      total: Number(response.total ?? 0),
      page: Number(response.page ?? page.value),
      pageSize: Number(response.pageSize ?? pageSize.value),
    };
  }

  /**
   * requestClient 已经解包为 Laravel paginator：
   *
   * {
   *   current_page: 1,
   *   data: [],
   *   total: 10,
   *   per_page: 20
   * }
   */
  if (Array.isArray(response?.data)) {
    return {
      items: response.data,
      total: Number(response.total ?? 0),
      page: Number(response.current_page ?? page.value),
      pageSize: Number(response.per_page ?? pageSize.value),
    };
  }

  /**
   * 外层还有 ApiResponse
   */
  const data = response?.data;

  if (Array.isArray(data?.items)) {
    return {
      items: data.items,
      total: Number(data.total ?? 0),
      page: Number(data.page ?? page.value),
      pageSize: Number(data.pageSize ?? pageSize.value),
    };
  }

  /**
   * 外层 ApiResponse + Laravel paginator
   */
  if (Array.isArray(data?.data)) {
    return {
      items: data.data,
      total: Number(data.total ?? 0),
      page: Number(data.current_page ?? page.value),
      pageSize: Number(data.per_page ?? pageSize.value),
    };
  }

  return {
    items: [],
    total: 0,
    page: page.value,
    pageSize: pageSize.value,
  };
}

/**
 * 加载游戏角色列表
 */
async function loadGameRoles() {
  loading.value = true;

  try {
    const response = await getGameRolesApi({
      page: page.value,
      pageSize: pageSize.value,
      name: searchForm.name || undefined,
      element: searchForm.element,
      atk_type: searchForm.atk_type,
      position: searchForm.position,
      is_clan_battle: searchForm.is_clan_battle,
      status: searchForm.status,
      obtain: searchForm.obtain,
      probability: searchForm.probability,
    });

    const result = parseListResult(response);

    gameRoles.value = result.items;
    total.value = result.total;
  } catch (error) {
    console.error('获取游戏角色列表失败:', error);
    ElMessage.error('获取游戏角色列表失败');
  } finally {
    loading.value = false;
  }
}

/**
 * 搜索
 */
function handleSearch() {
  page.value = 1;
  loadGameRoles();
}

/**
 * 重置搜索
 */
function handleReset() {
  searchForm.name = '';
  searchForm.element = undefined;
  searchForm.atk_type = undefined;
  searchForm.position = undefined;
  searchForm.is_clan_battle = undefined;
  searchForm.status = undefined;
  searchForm.obtain = undefined;
  searchForm.probability = undefined;

  page.value = 1;
  loadGameRoles();
}

/**
 * 当前页变化
 */
function handlePageChange(value: number) {
  page.value = value;
  loadGameRoles();
}

/**
 * 每页数量变化
 */
function handlePageSizeChange(value: number) {
  pageSize.value = value;
  page.value = 1;
  loadGameRoles();
}

/**
 * 重置编辑表单
 */
function resetForm() {
  form.id = 0;
  form.name_a = '';
  form.name_b = '';
  form.nickname = '';
  form.element = 1;
  form.atk_type = 1;
  form.is_clan_battle = false;
  form.search_area_width = 0;
  form.position = 1;
  form.obtain = 1;
  form.probability = 1;
  form.up_time = null;
  form.status = true;

  formRef.value?.clearValidate();
}

/**
 * 拆分角色名称
 */
function splitRoleName(name: string) {
  const match = name.match(/^(.+?)（(.+)）$/);

  if (match) {
    return {
      name_a: match[1] ?? '',
      name_b: match[2] ?? '',
    };
  }

  return {
    name_a: name,
    name_b: '',
  };
}

/**
 * 新增角色
 */
function handleCreate() {
  if (!canCreate.value) {
    return;
  }

  isEdit.value = false;
  dialogTitle.value = '新增游戏角色';

  resetForm();

  dialogVisible.value = true;
}

/**
 * 编辑角色
 */
function handleEdit(row: GameRoleItem) {
  if (!canUpdate.value) {
    return;
  }

  isEdit.value = true;
  dialogTitle.value = '编辑游戏角色';

  const name = splitRoleName(row.name);

  form.id = row.id;
  form.name_a = name.name_a;
  form.name_b = name.name_b;
  form.nickname = row.nickname;
  form.element = row.element;
  form.atk_type = row.atk_type;
  form.is_clan_battle = row.is_clan_battle;
  form.search_area_width = row.search_area_width;
  form.position = row.position;
  form.obtain = row.obtain ?? 1;
  form.probability = row.probability ?? 1;
  form.up_time = row.up_time;
  form.status = row.status;

  formRef.value?.clearValidate();

  dialogVisible.value = true;
}

/**
 * 提交新增 / 编辑
 */
async function handleSubmit() {
  if (!formRef.value) {
    return;
  }

  const valid = await formRef.value.validate();

  if (!valid) {
    return;
  }

  dialogLoading.value = true;

  try {
    if (isEdit.value) {
      const payload: UpdateGameRolePayload = {
        name_a: form.name_a,
        name_b: form.name_b || undefined,
        nickname: form.nickname,
        element: form.element,
        atk_type: form.atk_type,
        is_clan_battle: form.is_clan_battle,
        search_area_width: form.search_area_width,
        position: form.position,
        obtain: form.obtain,
        probability: form.probability,
        up_time: form.up_time || null,
        status: form.status,
      };

      await updateGameRoleApi(form.id, payload);

      ElMessage.success('游戏角色修改成功');
    } else {
      const payload: CreateGameRolePayload = {
        id: form.id,
        name_a: form.name_a,
        name_b: form.name_b || undefined,
        nickname: form.nickname,
        element: form.element,
        atk_type: form.atk_type,
        is_clan_battle: form.is_clan_battle,
        search_area_width: form.search_area_width,
        position: form.position,
        obtain: form.obtain,
        probability: form.probability,
        up_time: form.up_time || null,
        status: form.status,
      };

      await createGameRoleApi(payload);

      ElMessage.success('游戏角色创建成功');
    }

    dialogVisible.value = false;

    await loadGameRoles();
  } catch (error) {
    console.error('保存游戏角色失败:', error);
  } finally {
    dialogLoading.value = false;
  }
}

/**
 * 删除角色
 */
async function handleDelete(row: GameRoleItem) {
  if (!canDelete.value) {
    return;
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除游戏角色「${row.name}」吗？`,
      '删除确认',
      {
        type: 'warning',
        confirmButtonText: '确定删除',
        cancelButtonText: '取消',
      },
    );

    await deleteGameRoleApi(row.id);

    ElMessage.success('游戏角色删除成功');

    if (gameRoles.value.length === 1 && page.value > 1) {
      page.value -= 1;
    }

    await loadGameRoles();
  } catch (error: any) {
    if (error === 'cancel' || error === 'close') {
      return;
    }

    console.error('删除游戏角色失败:', error);
  }
}

/**
 * 查看详情
 */
async function handleDetail(row: GameRoleItem) {
  if (!canDetail.value) {
    return;
  }

  detailVisible.value = true;
  detailLoading.value = true;
  detailData.value = null;

  try {
    const response = await getGameRoleApi(row.id);

    detailData.value = response;
  } catch (error) {
    console.error('获取游戏角色详情失败:', error);
    ElMessage.error('获取游戏角色详情失败');
    detailVisible.value = false;
  } finally {
    detailLoading.value = false;
  }
}

/**
 * 获取头像文件名
 *
 * 后端已经返回 image_url：
 *
 * http://lara.test/roles/100231.webp
 *
 * 这里仅用于详情页面显示文件名。
 */
function getImageFileName(row: GameRoleItem) {
  if (!row.image_url) {
    return '-';
  }

  const parts = row.image_url.split('/');

  return parts.at(-1) || '-';
}

/**
 * 攻击类型
 */
function getAtkTypeLabel(value: number) {
  const map: Record<number, string> = {
    [-1]: '魔法',
    0: '辅助',
    1: '物理',
  };

  return map[value] ?? String(value);
}

/**
 * 位置
 */
function getPositionLabel(value: number) {
  const map: Record<number, string> = {
    1: '前卫',
    2: '中卫',
    3: '后卫',
  };

  return map[value] ?? String(value);
}

/**
 * 获取方式
 */
function getObtainLabel(value: null | number | undefined) {
  if (value === null || value === undefined) {
    return '-';
  }

  const map: Record<number, string> = {
    1: '抽卡获取',
    2: '活动获取',
    3: '兑换获取',
  };

  return map[value] ?? String(value);
}

/**
 * 概率
 */
function getProbabilityLabel(value: null | number | undefined) {
  if (value === null || value === undefined) {
    return '-';
  }

  const map: Record<number, string> = {
    1: '0.7%',
    2: '1.4%',
  };

  return map[value] ?? String(value);
}

/**
 * 初始化
 */
onMounted(() => {
  loadGameRoles();
});
</script>

<template>
  <div class="game-role-page">
    <!-- 搜索区域 -->
    <ElCard shadow="never" class="search-card">
      <ElForm :model="searchForm" label-width="90px">
        <ElRow :gutter="16">
          <ElCol :span="6">
            <ElFormItem label="角色名称">
              <ElInput
                v-model="searchForm.name"
                clearable
                placeholder="请输入角色名称"
                @keyup.enter="handleSearch"
              />
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem label="属性">
              <ElSelect
                v-model="searchForm.element"
                clearable
                placeholder="请选择属性"
                style="width: 100%"
              >
                <ElOption
                  v-for="item in elementOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem label="攻击类型">
              <ElSelect
                v-model="searchForm.atk_type"
                clearable
                placeholder="请选择攻击类型"
                style="width: 100%"
              >
                <ElOption label="魔法" :value="-1" />
                <ElOption label="辅助" :value="0" />
                <ElOption label="物理" :value="1" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem label="位置">
              <ElSelect
                v-model="searchForm.position"
                clearable
                placeholder="请选择位置"
                style="width: 100%"
              >
                <ElOption label="前卫" :value="1" />
                <ElOption label="中卫" :value="2" />
                <ElOption label="后卫" :value="3" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem label="会战角色">
              <ElSelect
                v-model="searchForm.is_clan_battle"
                clearable
                placeholder="请选择"
                style="width: 100%"
              >
                <ElOption label="是" :value="true" />
                <ElOption label="否" :value="false" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem label="状态">
              <ElSelect
                v-model="searchForm.status"
                clearable
                placeholder="请选择状态"
                style="width: 100%"
              >
                <ElOption label="启用" :value="true" />
                <ElOption label="禁用" :value="false" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem label="获取方式">
              <ElSelect
                v-model="searchForm.obtain"
                clearable
                placeholder="请选择"
                style="width: 100%"
              >
                <ElOption label="抽卡获取" :value="1" />
                <ElOption label="活动获取" :value="2" />
                <ElOption label="兑换获取" :value="3" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <ElCol :span="6">
            <ElFormItem label="概率">
              <ElSelect
                v-model="searchForm.probability"
                clearable
                placeholder="请选择"
                style="width: 100%"
              >
                <ElOption label="0.7%" :value="1" />
                <ElOption label="1.4%" :value="2" />
              </ElSelect>
            </ElFormItem>
          </ElCol>
        </ElRow>

        <div class="search-actions">
          <ElButton type="primary" @click="handleSearch"> 搜索 </ElButton>

          <ElButton @click="handleReset"> 重置 </ElButton>

          <ElButton v-if="canCreate" type="success" @click="handleCreate">
            新增角色
          </ElButton>
        </div>
      </ElForm>
    </ElCard>

    <!-- 游戏角色列表 -->
    <ElCard shadow="never" class="table-card">
      <ElTable
        v-loading="loading"
        :data="gameRoles"
        border
        stripe
        row-key="id"
        style="width: 100%"
      >
        <!-- ID -->
        <ElTableColumn prop="id" label="角色ID" width="90" align="center" />

        <!-- 头像 -->
        <ElTableColumn label="头像" width="90" align="center">
          <template #default="{ row }">
            <ElImage
              v-if="row.image_url"
              :src="row.image_url"
              fit="cover"
              class="role-avatar"
              :preview-src-list="[row.image_url]"
              preview-teleported
            />

            <span v-else>-</span>
          </template>
        </ElTableColumn>

        <!-- 名称 -->
        <ElTableColumn
          prop="name"
          label="角色名称"
          min-width="180"
          show-overflow-tooltip
        />

        <!-- 昵称 -->
        <ElTableColumn
          prop="nickname"
          label="昵称"
          width="130"
          show-overflow-tooltip
        />

        <!-- 属性 -->
        <ElTableColumn label="属性" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="getElementTagType(row.element)" effect="dark">
              {{ getElementLabel(row.element) }}
            </ElTag>
          </template>
        </ElTableColumn>

        <!-- 攻击类型 -->
        <ElTableColumn label="攻击类型" width="100" align="center">
          <template #default="{ row }">
            {{ getAtkTypeLabel(row.atk_type) }}
          </template>
        </ElTableColumn>

        <!-- 位置 -->
        <ElTableColumn label="位置" width="90" align="center">
          <template #default="{ row }">
            {{ getPositionLabel(row.position) }}
          </template>
        </ElTableColumn>

        <!-- 会战角色 -->
        <ElTableColumn label="会战角色" width="100" align="center">
          <template #default="{ row }">
            <ElTag :type="row.is_clan_battle ? 'success' : 'info'">
              {{ row.is_clan_battle ? '是' : '否' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <!-- 获取方式 -->
        <ElTableColumn label="获取方式" width="110" align="center">
          <template #default="{ row }">
            {{ getObtainLabel(row.obtain) }}
          </template>
        </ElTableColumn>

        <!-- 概率 -->
        <ElTableColumn label="概率" width="80" align="center">
          <template #default="{ row }">
            {{ getProbabilityLabel(row.probability) }}
          </template>
        </ElTableColumn>

        <!-- 使用次数 -->
        <ElTableColumn label="使用次数" width="100" align="center">
          <template #default="{ row }">
            {{ row.use_times ?? 0 }}
          </template>
        </ElTableColumn>

        <!-- 更新时间 -->
        <ElTableColumn label="更新时间" width="120" align="center">
          <template #default="{ row }">
            {{ row.up_time || '-' }}
          </template>
        </ElTableColumn>

        <!-- 状态 -->
        <ElTableColumn label="状态" width="80" align="center">
          <template #default="{ row }">
            <ElTag :type="row.status ? 'success' : 'danger'">
              {{ row.status ? '启用' : '禁用' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <!-- 操作 -->
        <ElTableColumn label="操作" width="190" fixed="right" align="center">
          <template #default="{ row }">
            <ElButton
              v-if="canDetail"
              link
              type="primary"
              @click="handleDetail(row)"
            >
              详情
            </ElButton>

            <ElButton
              v-if="canUpdate"
              link
              type="primary"
              @click="handleEdit(row)"
            >
              编辑
            </ElButton>

            <ElButton
              v-if="canDelete"
              link
              type="danger"
              @click="handleDelete(row)"
            >
              删除
            </ElButton>

            <span
              v-if="!canDetail && !canUpdate && !canDelete"
              class="no-action"
            >
              无操作权限
            </span>
          </template>
        </ElTableColumn>
      </ElTable>

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-wrapper">
        <ElPagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
        />
      </div>

      <ElEmpty
        v-if="!loading && gameRoles.length === 0"
        description="暂无游戏角色数据"
      />
    </ElCard>

    <!-- 新增 / 编辑 -->
    <ElDialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="720px"
      :close-on-click-modal="false"
    >
      <ElForm
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="110px"
      >
        <ElRow :gutter="20">
          <ElCol :span="12">
            <ElFormItem label="角色ID" prop="id">
              <ElInputNumber
                v-model="form.id"
                :min="1"
                :disabled="isEdit"
                controls-position="right"
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="昵称" prop="nickname">
              <ElInput
                v-model="form.nickname"
                placeholder="请输入昵称"
                maxlength="100"
                show-word-limit
              />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="名称A" prop="name_a">
              <ElInput
                v-model="form.name_a"
                placeholder="请输入名称A"
                maxlength="100"
                show-word-limit
              />
            </ElFormItem>
          </ElCol>

          <ElCol :span="12">
            <ElFormItem label="名称B">
              <ElInput
                v-model="form.name_b"
                placeholder="可选"
                maxlength="100"
                show-word-limit
              />
            </ElFormItem>
          </ElCol>

          <!-- 属性 -->
          <ElCol :span="12">
            <ElFormItem label="属性" prop="element">
              <ElSelect
                v-model="form.element"
                class="element-select"
                style="width: 100%"
              >
                <ElOption
                  v-for="item in elementOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                  class="element-select-option"
                >
                  <div class="element-option">
                    <ElTag :type="item.type" effect="dark" size="small">
                      {{ item.label }}
                    </ElTag>
                  </div>
                </ElOption>
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <!-- 攻击类型 -->
          <ElCol :span="12">
            <ElFormItem label="攻击类型" prop="atk_type">
              <ElSelect v-model="form.atk_type" style="width: 100%">
                <ElOption label="魔法" :value="-1" />
                <ElOption label="辅助" :value="0" />
                <ElOption label="物理" :value="1" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <!-- 搜索范围 -->
          <ElCol :span="12">
            <ElFormItem label="搜索范围" prop="search_area_width">
              <ElInputNumber
                v-model="form.search_area_width"
                :min="0"
                controls-position="right"
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>

          <!-- 位置 -->
          <ElCol :span="12">
            <ElFormItem label="位置" prop="position">
              <ElSelect v-model="form.position" style="width: 100%">
                <ElOption label="前卫" :value="1" />
                <ElOption label="中卫" :value="2" />
                <ElOption label="后卫" :value="3" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <!-- 获取方式 -->
          <ElCol :span="12">
            <ElFormItem label="获取方式" prop="obtain">
              <ElSelect v-model="form.obtain" style="width: 100%">
                <ElOption label="抽卡获取" :value="1" />
                <ElOption label="活动获取" :value="2" />
                <ElOption label="兑换获取" :value="3" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <!-- 概率 -->
          <ElCol :span="12">
            <ElFormItem label="概率" prop="probability">
              <ElSelect v-model="form.probability" style="width: 100%">
                <ElOption label="0.7%" :value="1" />
                <ElOption label="1.4%" :value="2" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <!-- 会战角色 -->
          <ElCol :span="12">
            <ElFormItem label="会战角色">
              <ElSelect v-model="form.is_clan_battle" style="width: 100%">
                <ElOption label="是" :value="true" />
                <ElOption label="否" :value="false" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <!-- 状态 -->
          <ElCol :span="12">
            <ElFormItem label="状态">
              <ElSelect v-model="form.status" style="width: 100%">
                <ElOption label="启用" :value="true" />
                <ElOption label="禁用" :value="false" />
              </ElSelect>
            </ElFormItem>
          </ElCol>

          <!-- 更新时间 -->
          <ElCol :span="12">
            <ElFormItem label="更新时间">
              <ElDatePicker
                v-model="form.up_time"
                type="date"
                value-format="YYYY-MM-DD"
                placeholder="请选择日期"
                style="width: 100%"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>

      <template #footer>
        <ElButton :disabled="dialogLoading" @click="dialogVisible = false">
          取消
        </ElButton>

        <ElButton type="primary" :loading="dialogLoading" @click="handleSubmit">
          保存
        </ElButton>
      </template>
    </ElDialog>

    <!-- 详情 -->
    <ElDialog v-model="detailVisible" title="游戏角色详情" width="760px">
      <div v-loading="detailLoading">
        <template v-if="detailData">
          <div class="detail-header">
            <ElImage
              v-if="detailData.image_url"
              :src="detailData.image_url"
              fit="cover"
              class="detail-avatar"
              :preview-src-list="[detailData.image_url]"
              preview-teleported
            />

            <div class="detail-title">
              <div class="detail-name">
                {{ detailData.name }}
              </div>

              <div class="detail-nickname">
                {{ detailData.nickname }}
              </div>
            </div>
          </div>

          <ElDescriptions :column="2" border class="detail-descriptions">
            <ElDescriptionsItem label="角色ID">
              {{ detailData.id }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="Role ID">
              {{ detailData.role_id }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="1星 ID">
              {{ detailData.role_id_1 }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="3星 ID">
              {{ detailData.role_id_3 }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="6星 ID">
              {{ detailData.role_id_6 ?? '-' }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="属性">
              <ElTag
                :type="getElementTagType(detailData.element)"
                effect="dark"
              >
                {{ getElementLabel(detailData.element) }}
              </ElTag>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="攻击类型">
              {{ getAtkTypeLabel(detailData.atk_type) }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="位置">
              {{ getPositionLabel(detailData.position) }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="会战角色">
              {{ detailData.is_clan_battle ? '是' : '否' }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="搜索范围">
              {{ detailData.search_area_width }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="获取方式">
              {{ getObtainLabel(detailData.obtain) }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="概率">
              {{ getProbabilityLabel(detailData.probability) }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="使用次数">
              {{ detailData.use_times ?? 0 }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="状态">
              <ElTag :type="detailData.status ? 'success' : 'danger'">
                {{ detailData.status ? '启用' : '禁用' }}
              </ElTag>
            </ElDescriptionsItem>

            <ElDescriptionsItem label="更新时间">
              {{ detailData.up_time || '-' }}
            </ElDescriptionsItem>

            <ElDescriptionsItem label="头像文件">
              {{ getImageFileName(detailData) }}
            </ElDescriptionsItem>
          </ElDescriptions>
        </template>
      </div>
    </ElDialog>
  </div>
</template>

<style scoped>
.game-role-page {
  padding: 16px;
}

.search-card {
  margin-bottom: 16px;
}

.table-card {
  margin-bottom: 16px;
}

.search-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.role-avatar {
  width: 52px;
  height: 52px;
  border-radius: 8px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

.no-action {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

/*
 * 属性选择框
 *
 * Element Plus 的 ElOption 默认行高与 ElTag 高度组合后，
 * 容易出现标签偏上、下方留白的问题。
 * 这里统一设置选项高度，并让内部内容上下居中。
 */
.element-select-option {
  height: 36px;
  line-height: 36px;
}

.element-option {
  display: flex;
  align-items: center;
  height: 36px;
  line-height: normal;
}

.element-option :deep(.el-tag) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.detail-header {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
}

.detail-avatar {
  width: 96px;
  height: 96px;
  margin-right: 20px;
  border-radius: 12px;
}

.detail-title {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detail-name {
  font-size: 20px;
  font-weight: 600;
}

.detail-nickname {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.detail-descriptions {
  margin-top: 8px;
}

/*
 * 暗属性使用紫色。
 *
 * Element Plus 默认没有紫色 Tag 类型，
 * 所以通过 :deep() 覆盖暗属性对应的 info Tag。
 */
.element-option :deep(.el-tag--info),
:deep(.el-table .el-tag--info) {
  --el-tag-bg-color: #722ed1;
  --el-tag-border-color: #722ed1;
  --el-tag-hover-color: #722ed1;
  --el-tag-text-color: #fff;
}

:deep(.el-descriptions .el-tag--info) {
  --el-tag-bg-color: #722ed1;
  --el-tag-border-color: #722ed1;
  --el-tag-hover-color: #722ed1;
  --el-tag-text-color: #fff;
}
</style>
