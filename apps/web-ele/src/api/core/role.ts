// src/api/core/role.ts
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
export async function getRolesApi() {
  return requestClient.get<RoleItem[]>('/roles');
}

/**
 * 新增角色
 */
export async function createRole(payload: Partial<RoleItem>) {
  return requestClient.post<RoleItem>('/roles', payload);
}

/**
 * 修改角色
 */
export async function updateRole(id: number, payload: Partial<RoleItem>) {
  return requestClient.put<RoleItem>(`/roles/${id}`, payload);
}

/**
 * 删除角色
 */
export async function deleteRole(id: number) {
  return requestClient.delete<void>(`/roles/${id}`);
}
