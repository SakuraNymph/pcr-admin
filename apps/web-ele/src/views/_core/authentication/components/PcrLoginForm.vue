<script lang="ts" setup>
import type { FormInstance, FormRules } from 'element-plus';

import { computed, reactive, ref } from 'vue';

import { ElButton, ElForm, ElFormItem, ElInput } from 'element-plus';

import { useAuthStore } from '#/store';

defineOptions({ name: 'PcrLoginForm' });

const props = withDefaults(
  defineProps<{
    embedded?: boolean;
    showForgetPassword?: boolean;
    showRegister?: boolean;
    showRememberMe?: boolean;
    subTitle?: string;
    title?: string;
  }>(),
  {
    embedded: false,
    showForgetPassword: false,
    showRegister: false,
    showRememberMe: false,
    subTitle: '',
    title: '',
  },
);

const headingTitle = computed(() =>
  props.embedded ? '登录已过期' : props.title,
);
const headingSubTitle = computed(() =>
  props.embedded ? '请重新登录' : props.subTitle,
);

const authStore = useAuthStore();
const formRef = ref<FormInstance>();

const form = reactive({
  username: '',
  password: '',
});

const rules: FormRules = {
  username: [
    {
      message: '请输入管理员账号',
      required: true,
      trigger: 'blur',
    },
  ],
  password: [
    {
      message: '请输入登录密码',
      required: true,
      trigger: 'blur',
    },
  ],
};

async function handleSubmit() {
  if (authStore.loginLoading) {
    return;
  }

  const valid = await formRef.value?.validate().catch(() => false);
  if (!valid) {
    return;
  }

  try {
    await authStore.authLogin({
      username: form.username,
      password: form.password,
    });
  } catch {
    // 登录失败提示由请求拦截器统一处理
  }
}
</script>

<template>
  <div
    :class="{ 'pcr-login-form--embedded': embedded }"
    class="pcr-login-form"
    @keydown.enter.prevent="handleSubmit"
  >
    <header
      v-if="headingTitle || headingSubTitle"
      class="pcr-login-form__header"
    >
      <h2 v-if="headingTitle" class="pcr-login-form__title">
        {{ headingTitle }}
      </h2>
      <p v-if="headingSubTitle" class="pcr-login-form__subtitle">
        {{ headingSubTitle }}
      </p>
    </header>

    <ElForm
      ref="formRef"
      :model="form"
      :rules="rules"
      hide-required-asterisk
      label-position="top"
    >
      <ElFormItem label="管理员账号" prop="username">
        <ElInput
          v-model="form.username"
          :disabled="authStore.loginLoading"
          autocomplete="username"
          clearable
          name="username"
          placeholder="请输入管理员账号"
          size="large"
        />
      </ElFormItem>

      <ElFormItem label="登录密码" prop="password">
        <ElInput
          v-model="form.password"
          :disabled="authStore.loginLoading"
          autocomplete="current-password"
          name="password"
          placeholder="请输入登录密码"
          show-password
          size="large"
          type="password"
        />
      </ElFormItem>

      <ElButton
        :aria-busy="authStore.loginLoading"
        :loading="authStore.loginLoading"
        class="pcr-login-form__submit"
        size="large"
        type="primary"
        @click="handleSubmit"
      >
        登录
      </ElButton>
    </ElForm>
  </div>
</template>

<style scoped>
.pcr-login-form {
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  text-align: left;
}

.pcr-login-form__header {
  margin-bottom: 22px;
  text-align: center;
}

.pcr-login-form__title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.3;
  color: var(--pcr-text-primary);
  letter-spacing: -0.01em;
}

.pcr-login-form__subtitle {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--pcr-text-secondary);
}

.pcr-login-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.pcr-login-form :deep(.el-form-item__label) {
  padding-bottom: 7px;
  font-size: 13px;
  font-weight: 500;
  line-height: 1.4;
  color: var(--pcr-text-secondary);
}

.pcr-login-form :deep(.el-form-item__error) {
  padding-top: 5px;
  font-size: 12px;
  color: var(--pcr-danger);
}

.pcr-login-form :deep(.el-input__wrapper) {
  min-height: 44px;
  padding: 1px 12px;
  background: var(--pcr-bg-subtle);
  border-radius: var(--pcr-radius-md);
  box-shadow: 0 0 0 1px var(--pcr-border) inset;
  transition:
    box-shadow 0.16s ease,
    background-color 0.16s ease;
}

.pcr-login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px var(--pcr-border-strong) inset;
}

.pcr-login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px var(--pcr-color-primary) inset,
    var(--pcr-shadow-focus);
}

.pcr-login-form :deep(.el-form-item.is-error .el-input__wrapper) {
  box-shadow: 0 0 0 1px var(--pcr-danger) inset;
}

.pcr-login-form :deep(.el-input.is-disabled .el-input__wrapper) {
  background: var(--pcr-bg-subtle);
  box-shadow: 0 0 0 1px var(--pcr-border) inset;
  opacity: 0.6;
}

.pcr-login-form :deep(.el-input__inner) {
  height: 40px;
  font-size: 14px;
  color: var(--pcr-text-primary);
}

.pcr-login-form :deep(.el-input__inner::placeholder) {
  color: var(--pcr-text-muted);
}

.pcr-login-form :deep(.el-input__clear),
.pcr-login-form :deep(.el-input__password) {
  color: var(--pcr-text-muted);
}

.pcr-login-form__submit {
  width: 100%;
  height: 44px;
  margin-top: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--pcr-color-primary-foreground);
  background: var(--pcr-color-primary);
  border-color: var(--pcr-color-primary);
  border-radius: var(--pcr-radius-md);
  box-shadow: none;
}

.pcr-login-form__submit:hover,
.pcr-login-form__submit:focus {
  color: var(--pcr-color-primary-foreground);
  background: var(--pcr-color-primary-hover);
  border-color: var(--pcr-color-primary-hover);
}

.pcr-login-form__submit:active {
  background: var(--pcr-color-primary-active);
  border-color: var(--pcr-color-primary-active);
}

.pcr-login-form__submit.is-disabled,
.pcr-login-form__submit.is-loading {
  color: var(--pcr-color-primary-foreground);
  background: var(--pcr-color-primary);
  border-color: var(--pcr-color-primary);
}

.pcr-login-form--embedded .pcr-login-form__header {
  margin-bottom: 18px;
}

.pcr-login-form--embedded .pcr-login-form__title {
  font-size: 19px;
}
</style>
