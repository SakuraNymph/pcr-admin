import type { RouteRecordStringComponent } from '@vben/types';

import { requestClient } from '#/api/request';

export interface MenuItem {
  id: number;
  parent_id: number;
  type: number;
  name: string;
  path: string;
  component: string;
  redirect: string;
  title: string;
  icon: string;
  permission: string;
  sort: number;
  hidden: number;
  keep_alive: number;
  affix_tab: number;
  iframe_src: string;
  link: string;
  status: number;
  created_at?: string;
  updated_at?: string;
  children?: MenuItem[];
}

export interface MenuDeleteResult {
  ids: number[];
  deleted_count: number;
}

export async function getUserMenusApi() {
  return requestClient.get<RouteRecordStringComponent[]>('/menus');
}

export async function getAllMenusApi() {
  return requestClient.get<MenuItem[]>('/menus_list');
}

export async function createMenu(payload: Partial<MenuItem>) {
  return requestClient.post<MenuItem>('/menus', payload);
}

export async function updateMenu(id: number, payload: Partial<MenuItem>) {
  return requestClient.put<MenuItem>(`/menus/${id}`, payload);
}

export async function deleteMenu(ids: number | number[]) {
  if (Array.isArray(ids)) {
    return requestClient.delete<MenuDeleteResult>('/menus', { data: { ids } });
  }

  return requestClient.delete<MenuDeleteResult>(`/menus/${ids}`);
}
