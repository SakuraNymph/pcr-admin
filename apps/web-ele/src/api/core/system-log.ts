// src/api/core/system-log.ts
import { requestClient } from '#/api/request';

/**
 * -------------------------------------------------------------------------
 * 1. 数据模型
 * -------------------------------------------------------------------------
 */

/**
 * 系统日志
 */
export interface SystemLogItem {
  /** 主键 */
  id: number;

  /** 管理员 ID */
  admin_id: null | number;

  /** 管理员用户名 */
  admin_username: null | string;

  /** 模块 */
  module: string;

  /** 操作 */
  action: string;

  /** 操作对象类型 */
  target_type: null | string;

  /** 操作对象 ID */
  target_id: null | number;

  /** 操作描述 */
  description: null | string;

  /** HTTP 请求方法 */
  method: string;

  /** 请求路径 */
  path: string;

  /** 请求数据 */
  request_data: null | Record<string, any>;

  /** 数据变化 */
  changes: null | Record<string, any>;

  /** 执行结果：0=失败，1=成功 */
  result: number;

  /** 错误信息 */
  error_message: null | string;

  /** IP 地址 */
  ip: null | string;

  /** User-Agent */
  user_agent: null | string;

  /** 创建时间 */
  created_at: string;
}

/**
 * 系统日志分页数据
 */
export interface SystemLogPage {
  /** 当前页 */
  current_page: number;

  /** 当前页数据 */
  data: SystemLogItem[];

  /** 最后一页 */
  last_page: number;

  /** 每页数量 */
  per_page: number;

  /** 总数量 */
  total: number;

  /** 当前页第一条记录 */
  from: null | number;

  /** 当前页最后一条记录 */
  to: null | number;
}

/**
 * 系统日志查询参数
 */
export interface SystemLogQuery {
  /** 管理员用户名 */
  admin_username?: string;

  /** 模块 */
  module?: string;

  /** 操作 */
  action?: string;

  /** 操作对象类型 */
  target_type?: string;

  /** 执行结果：0=失败，1=成功 */
  result?: number;

  /** 开始日期 */
  created_start?: string;

  /** 结束日期 */
  created_end?: string;

  /** 页码 */
  page?: number;

  /** 每页数量 */
  per_page?: number;
}

/**
 * -------------------------------------------------------------------------
 * 2. API
 * -------------------------------------------------------------------------
 */

/**
 * 获取系统日志列表
 */
export async function getSystemLogsApi(params?: SystemLogQuery) {
  return requestClient.get<SystemLogPage>('/system-logs', {
    params,
  });
}

/**
 * 获取系统日志详情
 */
export async function getSystemLogDetailApi(id: number) {
  return requestClient.get<SystemLogItem>(`/system-logs/${id}`);
}
