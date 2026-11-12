// src/api/core/role.ts
import type { MenuItem } from '#/api/core/menu';
import type { PermissionItem } from '#/api/core/permission';

import { requestClient } from '#/api/request';

/**
 * -------------------------------------------------------------------------
 * 1. 数据模型
 * -------------------------------------------------------------------------
 */

export interface RoleItem {
  /** 主键 */
  id: number;

  /** 角色名称 */
  name: string;

  /** 角色编码 */
  code: string;

  /** 角色描述 */
  description: string;

  /** 排序 */
  sort: number;

  /** 状态：0=禁用，1=启用 */
  status: number;

  /** 创建时间 */
  created_at?: string;

  /** 更新时间 */
  updated_at?: string;
}

/**
 * -------------------------------------------------------------------------
 * 2. API
 * -------------------------------------------------------------------------
 */

/**
 * 获取角色列表
 */
export async function getRolesApi(): Promise<RoleItem[]> {
  return requestClient.get<RoleItem[]>('/roles');
}

/**
 * 新增角色
 */
export async function createRoleApi(
  payload: Partial<RoleItem>,
): Promise<RoleItem> {
  return requestClient.post<RoleItem>('/roles', payload);
}

/**
 * 修改角色
 */
export async function updateRoleApi(
  id: number,
  payload: Partial<RoleItem>,
): Promise<RoleItem> {
  return requestClient.put<RoleItem>(`/roles/${id}`, payload);
}

/**
 * 删除角色
 */
export async function deleteRoleApi(id: number): Promise<null> {
  return requestClient.delete<null>(`/roles/${id}`);
}

/**
 * 获取角色拥有的菜单
 */
export async function getRoleMenusApi(roleId: number): Promise<MenuItem[]> {
  return requestClient.get<MenuItem[]>(`/roles/${roleId}/menus`);
}

/**
 * 保存角色菜单
 */
export async function updateRoleMenusApi(
  roleId: number,
  menuIds: number[],
): Promise<unknown> {
  return requestClient.put<unknown>(`/roles/${roleId}/menus`, {
    menu_ids: menuIds,
  });
}

/**
 * 获取角色拥有的 API 权限
 */
export async function getRolePermissionsApi(
  roleId: number,
): Promise<PermissionItem[]> {
  return requestClient.get<PermissionItem[]>(
    `/roles/${roleId}/permissions`,
  );
}

/**
 * 保存角色 API 权限
 *
 * 后端使用 sync：传入什么就保存什么。
 */
export async function updateRolePermissionsApi(
  roleId: number,
  permissionIds: number[],
): Promise<unknown> {
  return requestClient.put<unknown>(`/roles/${roleId}/permissions`, {
    permission_ids: permissionIds,
  });
}
