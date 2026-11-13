<script lang="ts" setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import { AuthPageLayout, ThemeToggle } from '@vben/layouts';
import { preferences } from '@vben/preferences';

import { $t } from '#/locales';

defineOptions({ name: 'AuthenticationLayout' });

const route = useRoute();
const isLogin = computed(() => route.name === 'Login');
const appName = computed(() => preferences.app.name);
const logo = computed(() => preferences.logo.source);
const logoDark = computed(() => preferences.logo.sourceDark);
</script>

<template>
  <AuthPageLayout
    v-if="!isLogin"
    :app-name="appName"
    :logo="logo"
    :logo-dark="logoDark"
    :page-description="$t('authentication.pageDesc')"
    :page-title="$t('authentication.pageTitle')"
  />

  <div v-else class="pcr-auth">
    <ThemeToggle class="pcr-auth__theme" />

    <div class="pcr-auth__frame">
      <section class="pcr-auth__brand">
        <div class="pcr-auth__brand-head">
          <img
            :alt="appName"
            :src="logo"
            class="pcr-auth__mark"
            height="36"
            width="36"
          />
          <div>
            <p class="pcr-auth__brand-name">{{ appName }}</p>
            <p class="pcr-auth__brand-sub">游戏数据运营平台</p>
          </div>
        </div>

        <div class="pcr-auth__intro">
          <p class="pcr-auth__kicker">PCR GAME DATA</p>
          <p class="pcr-auth__headline">
            角色、BOSS 与作业数据，<br />
            一个运营台。
          </p>
          <p class="pcr-auth__lede">
            面向 PCR 游戏运营团队的数据管理与内容协作平台。
          </p>
          <ul class="pcr-auth__modules">
            <li>角色数据</li>
            <li>BOSS 管理</li>
            <li>作业管理</li>
          </ul>
        </div>

        <div aria-hidden="true" class="pcr-auth__visual">
          <div class="pcr-auth__visual-head">
            <span class="pcr-auth__visual-title">数据视图</span>
            <span class="pcr-auth__visual-dots">
              <i></i>
              <i></i>
              <i></i>
            </span>
          </div>
          <div class="pcr-auth__bars">
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </section>

      <section class="pcr-auth__panel">
        <div class="pcr-auth__mobile-brand">
          <img
            :alt="appName"
            :src="logo"
            class="pcr-auth__mark"
            height="32"
            width="32"
          />
          <div>
            <p class="pcr-auth__brand-name">{{ appName }}</p>
            <p class="pcr-auth__brand-sub">游戏数据运营平台</p>
          </div>
        </div>

        <div class="pcr-auth__card">
          <RouterView />
        </div>

        <p class="pcr-auth__note">仅限授权管理员访问</p>
      </section>
    </div>
  </div>
</template>

<style scoped>
.pcr-auth {
  position: relative;
  min-width: 0;
  min-height: 100vh;
  overflow-x: hidden;
  color: var(--pcr-text-primary);
  background: var(--pcr-bg-page);
}

.pcr-auth__theme {
  position: fixed;
  top: 20px;
  right: 24px;
  z-index: 10;
}

.pcr-auth__frame {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 420px;
  gap: 64px;
  align-items: center;
  width: 100%;
  max-width: 1280px;
  min-height: 100vh;
  margin: 0 auto;
  padding: 48px 40px;
}

.pcr-auth__brand {
  display: flex;
  flex-direction: column;
  gap: 36px;
  min-width: 0;
  padding: 8px 0;
}

.pcr-auth__brand-head,
.pcr-auth__mobile-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pcr-auth__mark {
  flex: none;
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.pcr-auth__brand-name {
  margin: 0;
  font-family: var(--pcr-font-family);
  font-size: 16px;
  font-weight: var(--pcr-font-weight-bold);
  line-height: 1.2;
  color: var(--pcr-text-primary);
  letter-spacing: -0.01em;
}

.pcr-auth__brand-sub {
  margin: 3px 0 0;
  font-size: var(--pcr-font-size-caption);
  line-height: 1.3;
  color: var(--pcr-text-muted);
  letter-spacing: 0.06em;
}

.pcr-auth__intro {
  min-width: 0;
}

.pcr-auth__kicker {
  margin: 0 0 14px;
  font-family: var(--pcr-font-family);
  font-size: var(--pcr-font-size-caption);
  font-weight: var(--pcr-font-weight-bold);
  line-height: var(--pcr-line-height-heading);
  color: var(--pcr-color-primary);
  letter-spacing: var(--pcr-letter-spacing-kicker);
}

.pcr-auth__headline {
  margin: 0;
  font-family: var(--pcr-font-family);
  font-size: 40px;
  font-weight: var(--pcr-font-weight-bold);
  line-height: 1.24;
  color: var(--pcr-text-primary);
  letter-spacing: -0.03em;
}

.pcr-auth__lede {
  max-width: 440px;
  margin: 16px 0 0;
  font-size: 15px;
  line-height: 1.7;
  color: var(--pcr-text-secondary);
}

.pcr-auth__modules {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 24px 0 0;
  padding: 0;
  list-style: none;
}

.pcr-auth__modules li {
  padding: 6px 12px;
  font-size: var(--pcr-font-size-caption);
  font-weight: var(--pcr-font-weight-semibold);
  line-height: 1.3;
  color: var(--pcr-color-primary);
  background: var(--pcr-color-primary-soft);
  border-radius: var(--pcr-radius-pill);
}

.pcr-auth__modules li:nth-child(2) {
  color: var(--pcr-color-secondary);
  background: var(--pcr-color-secondary-soft);
}

.pcr-auth__visual {
  width: 100%;
  max-width: 480px;
  padding: 18px 20px 20px;
  background: var(--pcr-bg-surface);
  border: var(--pcr-border-width) solid var(--pcr-border);
  border-radius: var(--pcr-radius-lg);
}

.pcr-auth__visual-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pcr-auth__visual-title {
  font-size: var(--pcr-font-size-caption);
  font-weight: var(--pcr-font-weight-semibold);
  line-height: 1.3;
  color: var(--pcr-text-muted);
  letter-spacing: 0.08em;
}

.pcr-auth__visual-dots {
  display: inline-flex;
  gap: 5px;
}

.pcr-auth__visual-dots i {
  width: 6px;
  height: 6px;
  background: var(--pcr-border-strong);
  border-radius: 50%;
}

.pcr-auth__visual-dots i:first-child {
  background: var(--pcr-color-primary);
}

.pcr-auth__visual-dots i:nth-child(2) {
  background: var(--pcr-color-secondary);
}

.pcr-auth__bars {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 150px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--pcr-border);
}

.pcr-auth__bars span {
  flex: 1;
  max-width: 36px;
  background: var(--pcr-color-primary-soft);
  border-radius: var(--pcr-radius-sm) var(--pcr-radius-sm) 3px 3px;
}

.pcr-auth__bars span:nth-child(1) {
  height: 32%;
}

.pcr-auth__bars span:nth-child(2) {
  height: 56%;
}

.pcr-auth__bars span:nth-child(3) {
  height: 42%;
  background: var(--pcr-color-secondary-soft);
}

.pcr-auth__bars span:nth-child(4) {
  height: 74%;
  background: var(--pcr-color-primary);
}

.pcr-auth__bars span:nth-child(5) {
  height: 50%;
}

.pcr-auth__bars span:nth-child(6) {
  height: 88%;
  background: var(--pcr-color-secondary);
}

.pcr-auth__bars span:nth-child(7) {
  height: 64%;
}

.pcr-auth__panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.pcr-auth__mobile-brand {
  display: none;
}

.pcr-auth__card {
  width: 100%;
  max-width: 420px;
  padding: 38px 34px;
  background: var(--pcr-bg-surface);
  border: var(--pcr-border-width) solid var(--pcr-border);
  border-radius: 18px;
  box-shadow: var(--pcr-shadow-overlay);
}

.pcr-auth__note {
  margin: 18px 0 0;
  font-size: var(--pcr-font-size-caption);
  line-height: 1.4;
  color: var(--pcr-text-muted);
}

@media (max-width: 1279px) {
  .pcr-auth__frame {
    gap: 40px;
    padding: 40px 32px;
  }

  .pcr-auth__headline {
    font-size: 34px;
  }
}

@media (max-width: 1024px) {
  .pcr-auth__frame {
    grid-template-columns: minmax(0, 1fr);
    justify-items: center;
    gap: 0;
    padding: 72px 24px 40px;
  }

  .pcr-auth__brand {
    display: none;
  }

  .pcr-auth__panel {
    width: 100%;
  }

  .pcr-auth__mobile-brand {
    display: flex;
    margin-bottom: 22px;
  }

  .pcr-auth__mobile-brand .pcr-auth__mark {
    width: 32px;
    height: 32px;
    border-radius: 9px;
  }
}

@media (max-width: 599px) {
  .pcr-auth__theme {
    top: 12px;
    right: 12px;
  }

  .pcr-auth__frame {
    padding: 64px 16px 32px;
  }

  .pcr-auth__mobile-brand {
    margin-bottom: 18px;
  }

  .pcr-auth__card {
    padding: 28px 20px;
    border-radius: 16px;
  }
}
</style>
