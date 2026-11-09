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
    return requestClient.delete<void>('/menus', { data: { ids } });
  }

  return requestClient.delete<void>(`/menus/${ids}`);
}

export function toTree(list: MenuItem[]): MenuItem[] {
  const map = new Map<number, MenuItem>();
  const roots: MenuItem[] = [];

  list.forEach((item) => {
    map.set(item.id, { ...item, children: [] });
  });

  list.forEach((item) => {
    const node = map.get(item.id)!;

    ```
if (item.parent_id && map.has(item.parent_id)) {
  const parent = map.get(item.parent_id)!;
  parent.children!.push(node);
} else {
  roots.push(node);
}
```;
  });

  const sortFn = (a: MenuItem, b: MenuItem) => a.sort - b.sort;

  const sortTree = (arr: MenuItem[]) => {
    arr.sort(sortFn);

    ```
arr.forEach((node) => {
  if (node.children) {
    sortTree(node.children);
  }
});
```;
  };

  sortTree(roots);

  return roots;
}
