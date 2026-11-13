import { defineOverridesPreferences } from '@vben/preferences';
import { StorageManager } from '@vben/utils';

const THEME_MIGRATION_KEY = 'pcr-theme-default-light-v1';
const LAYOUT_MIGRATION_KEY = 'pcr-layout-v1';

interface CachedPreferences {
  app?: Record<string, unknown>;
  breadcrumb?: Record<string, unknown>;
  header?: Record<string, unknown>;
  logo?: Record<string, unknown>;
  sidebar?: Record<string, unknown>;
  tabbar?: Record<string, unknown>;
  theme?: {
    mode?: string;
    [key: string]: unknown;
  };
  widget?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * @description 项目配置文件
 * 只需要覆盖项目中的一部分配置，不需要的配置不用覆盖，会自动使用默认配置
 * !!! 更改配置后请清空缓存，否则可能不生效
 */
export const overridesPreferences = defineOverridesPreferences({
  // overrides
  app: {
    accessMode: 'backend',
    contentCompact: 'wide',
    enableCheckUpdates: false,
    enablePreferences: false,
    layout: 'sidebar-nav',
    locale: 'zh-CN',
    name: 'PCR 运营台',
  },
  breadcrumb: {
    showIcon: false,
  },
  header: {
    height: 56,
  },
  logo: {
    fit: 'contain',
    source: '/brand/pcr-mark.svg',
    sourceDark: '/brand/pcr-mark.svg',
  },
  sidebar: {
    width: 224,
  },
  tabbar: {
    height: 40,
    styleType: 'plain',
  },
  theme: {
    colorDestructive: 'hsl(0 63% 56%)',
    colorPrimary: 'hsl(226 90% 58%)',
    colorSuccess: 'hsl(162 67% 37%)',
    colorWarning: 'hsl(37 83% 43%)',
    fontSize: 16,
    mode: 'light',
    radius: '0.5',
    semiDarkHeader: false,
    semiDarkSidebar: false,
    semiDarkSidebarSub: false,
  },
  widget: {
    fullscreen: true,
    globalSearch: true,
    languageToggle: false,
    lockScreen: true,
    notification: false,
    refresh: true,
    sidebarToggle: true,
    themeToggle: true,
    timezone: false,
  },
});

export function migratePcrDefaultTheme(namespace: string) {
  const storage = new StorageManager({ prefix: namespace });

  if (storage.getItem<boolean>(THEME_MIGRATION_KEY)) {
    return;
  }

  const cachedPreferences =
    storage.getItem<CachedPreferences>('preferences');

  if (cachedPreferences?.theme?.mode === 'dark') {
    storage.setItem('preferences', {
      ...cachedPreferences,
      theme: {
        ...cachedPreferences.theme,
        mode: 'light',
      },
    });
  }

  storage.setItem(THEME_MIGRATION_KEY, true);
}

export function migratePcrLayoutPreferences(namespace: string) {
  const storage = new StorageManager({ prefix: namespace });

  if (storage.getItem<boolean>(LAYOUT_MIGRATION_KEY)) {
    return;
  }

  const cachedPreferences =
    storage.getItem<CachedPreferences>('preferences');

  if (cachedPreferences && typeof cachedPreferences === 'object') {
    storage.setItem('preferences', {
      ...cachedPreferences,
      app: {
        ...(cachedPreferences.app ?? {}),
        accessMode: 'backend',
        contentCompact: 'wide',
        enableCheckUpdates: false,
        enablePreferences: false,
        layout: 'sidebar-nav',
        locale: 'zh-CN',
        name: 'PCR 运营台',
      },
      breadcrumb: {
        ...(cachedPreferences.breadcrumb ?? {}),
        showIcon: false,
      },
      header: {
        ...(cachedPreferences.header ?? {}),
        height: 56,
      },
      logo: {
        ...(cachedPreferences.logo ?? {}),
        fit: 'contain',
        source: '/brand/pcr-mark.svg',
        sourceDark: '/brand/pcr-mark.svg',
      },
      sidebar: {
        ...(cachedPreferences.sidebar ?? {}),
        width: 224,
      },
      tabbar: {
        ...(cachedPreferences.tabbar ?? {}),
        height: 40,
        styleType: 'plain',
      },
      theme: {
        ...(cachedPreferences.theme ?? {}),
        colorDestructive: 'hsl(0 63% 56%)',
        colorPrimary: 'hsl(226 90% 58%)',
        colorSuccess: 'hsl(162 67% 37%)',
        colorWarning: 'hsl(37 83% 43%)',
        fontSize: 16,
        radius: '0.5',
        semiDarkHeader: false,
        semiDarkSidebar: false,
        semiDarkSidebarSub: false,
      },
      widget: {
        ...(cachedPreferences.widget ?? {}),
        fullscreen: true,
        globalSearch: true,
        languageToggle: false,
        lockScreen: true,
        notification: false,
        refresh: true,
        sidebarToggle: true,
        themeToggle: true,
        timezone: false,
      },
    });
  }

  storage.setItem(LAYOUT_MIGRATION_KEY, true);
}
