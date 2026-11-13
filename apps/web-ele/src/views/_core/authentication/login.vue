<script lang="ts" setup>
import PcrLoginForm from './components/PcrLoginForm.vue';

defineOptions({ name: 'Login' });
</script>

<template>
  <div class="pcr-login-page">
    <p class="pcr-login-page__kicker">ADMIN ACCESS</p>
    <h1 class="pcr-login-page__title">登录运营台</h1>
    <p class="pcr-login-page__description">
      使用管理员账号继续管理游戏数据与运营内容。
    </p>
    <PcrLoginForm class="pcr-login-page__form" />
  </div>
</template>

<style scoped>
.pcr-login-page {
  width: 100%;
  min-width: 0;
}

.pcr-login-page__kicker {
  margin: 0 0 10px;
  font-family: var(--pcr-font-family);
  font-size: var(--pcr-font-size-caption);
  font-weight: var(--pcr-font-weight-bold);
  line-height: var(--pcr-line-height-heading);
  color: var(--pcr-color-primary);
  letter-spacing: var(--pcr-letter-spacing-kicker);
}

.pcr-login-page__title {
  margin: 0;
  font-family: var(--pcr-font-family);
  font-size: 28px;
  font-weight: var(--pcr-font-weight-bold);
  line-height: var(--pcr-line-height-heading);
  color: var(--pcr-text-primary);
  letter-spacing: var(--pcr-letter-spacing-tight);
}

.pcr-login-page__description {
  margin: 10px 0 0;
  font-size: var(--pcr-font-size-body);
  line-height: var(--pcr-line-height-body);
  color: var(--pcr-text-secondary);
}

.pcr-login-page__form {
  margin-top: 28px;
}

@media (max-width: 599px) {
  .pcr-login-page__title {
    font-size: 24px;
  }

  .pcr-login-page__form {
    margin-top: 22px;
  }
}
</style>
