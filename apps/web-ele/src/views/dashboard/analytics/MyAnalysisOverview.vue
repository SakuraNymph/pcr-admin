<script setup lang="ts">
// ❌ 删掉这行报错的导入：
// import { Card, CardContent } from '@vben-core/shadcn-ui';

// ✅ 改为从 @vben/common-ui 中直接导入公共组件和图标组件
import { VbenCountToAnimator } from '@vben/common-ui';

export interface StatCardItem {
  title: string;
  value: number;
  subValue: number;
  subRatio?: string;
}

defineProps<{
  items: StatCardItem[];
}>();
</script>

<template>
  <div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-6">
    <template v-for="item in items" :key="item.title">
      <!-- 原来的 <Card> 换成纯 Tailwind CSS 样式的圆角阴影 div 容器 -->
      <div
        class="w-full rounded-xl border bg-card text-card-foreground shadow-sm"
      >
        <div class="flex flex-col justify-between gap-3 p-6">
          <!-- 第一层：标题 + 图标 -->
          <div class="flex items-center justify-between">
            <span class="text-sm font-medium text-muted-foreground">
              {{ item.title }}
            </span>
          </div>

          <!-- 第二层：核心数据（加大加粗） -->
          <div class="text-3xl font-bold tracking-tight text-foreground">
            <VbenCountToAnimator :end-val="item.value" :start-val="1" />
          </div>

          <!-- 第三层：对比数据 -->
          <div class="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>环比:</span>
            <VbenCountToAnimator :end-val="item.subValue" :start-val="1" />
            <span
              v-if="item.subRatio"
              :class="
                item.subRatio.startsWith('+')
                  ? 'text-green-500'
                  : 'text-red-500'
              "
              class="font-medium"
            >
              ({{ item.subRatio }})
            </span>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>
