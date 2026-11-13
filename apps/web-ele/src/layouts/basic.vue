<script lang="ts" setup>
import { computed, watch } from 'vue';
import { useRouter } from 'vue-router';

import { AuthenticationLoginExpiredModal } from '@vben/common-ui';
import { useWatermark } from '@vben/hooks';
import { BasicLayout, LockScreen, UserDropdown } from '@vben/layouts';
import { preferences, usePreferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';

import { useAuthStore } from '#/store';
import PcrLoginForm from '#/views/_core/authentication/components/PcrLoginForm.vue';

interface AdminDisplayUser {
  avatar?: string;
  homePath?: string;
  nickname?: string;
  realName?: string;
  username?: string;
}

const router = useRouter();
const userStore = useUserStore();
const authStore = useAuthStore();
const accessStore = useAccessStore();
const { destroyWatermark, updateWatermark } = useWatermark();
const { isDark } = usePreferences();

const currentUser = computed(
  () => userStore.userInfo as AdminDisplayUser | null,
);
const displayName = computed(() => {
  const user = currentUser.value;
  return user?.nickname || user?.realName || user?.username || '管理员';
});
const accountName = computed(() => currentUser.value?.username || '');
const avatar = computed(() => {
  if (currentUser.value?.avatar) {
    return currentUser.value.avatar;
  }

  const firstCharacter = displayName.value.trim().charAt(0);
  const initial = /^[A-Za-z0-9\u4E00-\u9FA5]$/.test(firstCharacter)
    ? firstCharacter.toUpperCase()
    : 'P';
  const fallback = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="64" height="64" rx="32" fill="#EEF3FF"/><text x="32" y="32" dy=".35em" text-anchor="middle" font-family="Arial,Helvetica,sans-serif" font-size="26" font-weight="600" fill="#3563F4">${initial}</text></svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallback)}`;
});

async function handleLogout() {
  await authStore.logout(false);
}

function handleClickLogo() {
  router.push(currentUser.value?.homePath || '/');
}

watch(
  () => ({
    accountName: accountName.value,
    content: preferences.app.watermarkContent,
    displayName: displayName.value,
    enable: preferences.app.watermark,
    isDark: isDark.value,
  }),
  async ({
    accountName: accountNameValue,
    content,
    displayName: displayNameValue,
    enable,
    isDark: isDarkValue,
  }) => {
    if (enable) {
      const watermarkColor = isDarkValue
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 0, 0, 0.12)';

      await updateWatermark({
        advancedStyle: {
          colorStops: [
            {
              color: watermarkColor,
              offset: 0,
            },
            {
              color: watermarkColor,
              offset: 1,
            },
          ],
          type: 'linear',
        },
        content:
          content ||
          [displayNameValue, accountNameValue].filter(Boolean).join(' · ') ||
          'PCR 运营台',
      });
    } else {
      destroyWatermark();
    }
  },
  {
    immediate: true,
  },
);
</script>

<template>
  <BasicLayout
    class="pcr-admin-layout"
    @clear-preferences-and-logout="handleLogout"
    @click-logo="handleClickLogo"
  >
    <template #logo-text>
      <span class="pcr-brand-wordmark">
        <span class="pcr-brand-wordmark__name">PCR</span>
        <span class="pcr-brand-wordmark__sub">运营台</span>
      </span>
    </template>
    <template #user-dropdown>
      <div class="pcr-user-entry">
        <span class="pcr-user-entry__name">{{ displayName }}</span>
        <UserDropdown
          :avatar="avatar"
          :description="accountName"
          :text="displayName"
          @logout="handleLogout"
        />
      </div>
    </template>
    <template #extra>
      <AuthenticationLoginExpiredModal
        v-model:open="accessStore.loginExpired"
        :avatar="avatar"
      >
        <PcrLoginForm
          :key="accessStore.loginExpired ? 'expired' : 'idle'"
          embedded
        />
      </AuthenticationLoginExpiredModal>
    </template>
    <template #lock-screen>
      <LockScreen :avatar="avatar" @to-login="handleLogout" />
    </template>
  </BasicLayout>
</template>
