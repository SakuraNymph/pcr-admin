<script lang="ts" setup>
import type { UserItem, UserListParams } from '#/api/core/user-management';

import { onMounted, reactive, ref } from 'vue';

import {
  ElButton,
  ElCard,
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
  ElTag,
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
  ip: '',
  country: '',
  province: '',
  city: '',
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
 * 获取用户列表
 */
async function getUserList() {
  loading.value = true;

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

    if (searchForm.ip) {
      params.ip = searchForm.ip.trim();
    }

    if (searchForm.country) {
      params.country = searchForm.country.trim();
    }

    if (searchForm.province) {
      params.province = searchForm.province.trim();
    }

    if (searchForm.city) {
      params.city = searchForm.city.trim();
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
  searchForm.ip = '';
  searchForm.country = '';
  searchForm.province = '';
  searchForm.city = '';
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
  <div class="p-4">
    <ElCard shadow="never">
      <!-- 查询区域 -->
      <ElForm :model="searchForm" inline class="mb-4">
        <ElFormItem label="昵称">
          <ElInput
            v-model="searchForm.nickname"
            placeholder="请输入昵称"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem label="邮箱">
          <ElInput
            v-model="searchForm.email"
            placeholder="请输入邮箱"
            clearable
            style="width: 180px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem label="IP">
          <ElInput
            v-model="searchForm.ip"
            placeholder="请输入IP地址"
            clearable
            style="width: 150px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem label="国家">
          <ElInput
            v-model="searchForm.country"
            placeholder="请输入国家"
            clearable
            style="width: 130px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem label="省份">
          <ElInput
            v-model="searchForm.province"
            placeholder="请输入省份"
            clearable
            style="width: 130px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem label="城市">
          <ElInput
            v-model="searchForm.city"
            placeholder="请输入城市"
            clearable
            style="width: 130px"
            @keyup.enter="handleSearch"
          />
        </ElFormItem>

        <ElFormItem label="订阅">
          <ElSelect
            v-model="searchForm.is_subscribe"
            placeholder="请选择"
            clearable
            style="width: 120px"
          >
            <ElOption label="全部" value="" />

            <ElOption label="已订阅" :value="1" />

            <ElOption label="未订阅" :value="0" />
          </ElSelect>
        </ElFormItem>

        <ElFormItem label="注册时间">
          <ElDatePicker
            v-model="searchForm.start_date"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
        </ElFormItem>

        <ElFormItem label="至">
          <ElDatePicker
            v-model="searchForm.end_date"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 140px"
          />
        </ElFormItem>

        <ElFormItem>
          <ElButton type="primary" @click="handleSearch"> 搜索 </ElButton>

          <ElButton @click="handleReset"> 重置 </ElButton>
        </ElFormItem>
      </ElForm>

      <!-- 用户表格 -->
      <ElTable
        v-loading="loading"
        :data="userList"
        border
        stripe
        style="width: 100%"
      >
        <ElTableColumn prop="id" label="UID" width="80" align="center" />

        <ElTableColumn prop="nickname" label="昵称" min-width="130">
          <template #default="scope">
            {{ scope.row.nickname || '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn prop="email" label="邮箱" min-width="200">
          <template #default="scope">
            {{ scope.row.email || '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn prop="ip" label="IP地址" min-width="150" />

        <ElTableColumn prop="country" label="国家" min-width="100">
          <template #default="scope">
            {{ scope.row.country || '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn prop="province" label="省份" min-width="100">
          <template #default="scope">
            {{ scope.row.province || '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn prop="city" label="城市" min-width="100">
          <template #default="scope">
            {{ scope.row.city || '-' }}
          </template>
        </ElTableColumn>

        <ElTableColumn label="订阅" width="90" align="center">
          <template #default="scope">
            <ElTag :type="scope.row.is_subscribe ? 'success' : 'info'">
              {{ scope.row.is_subscribe ? '已订阅' : '未订阅' }}
            </ElTag>
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="注册时间"
          min-width="180"
          sortable
          :sort-method="sortByCreatedAt"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.created_at) }}
          </template>
        </ElTableColumn>

        <ElTableColumn
          label="修改时间"
          min-width="180"
          sortable
          :sort-method="sortByUpdatedAt"
        >
          <template #default="scope">
            {{ formatDateTime(scope.row.updated_at) }}
          </template>
        </ElTableColumn>

        <template #empty>
          <ElEmpty description="暂无用户数据" />
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
  </div>
</template>
