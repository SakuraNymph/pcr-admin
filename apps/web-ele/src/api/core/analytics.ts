import { requestClient } from '#/api/request';

// 1. 顶部统计卡片单项类型 (对应 analytics 数组里的每一项)
export interface AnalysisOverviewItem {
  title: string; // 卡片标题（如 "今日访问量"、"本月访问量"）
  value: number; // 当前数值
  subValue: number; // 对比数值（如昨日/上月数值）
  subRatio: string; // 环比/变化率（如 "-100%"、"-72%" 或 "-"）
}

// 2. 趋势折线图单项类型 (对应 trend 数组里的每一项)
export interface AnalysisTrendItem {
  month: string; // 月份（格式："YYYY-MM"）
  visits: number; // 访问量
  new_users: number; // 新增用户数
  new_registers: number; // 新增注册数
}

// 3. 接口返回的 data 完整数据结构
export interface StatisticsData {
  data: AnalysisOverviewItem[];
}

// 4. 接口返回的 data 完整数据结构
export interface trendData {
  data: AnalysisTrendItem[];
}

/**
 * 获取首页/看板统计数据
 */
export async function getStatistics() {
  return requestClient.get<StatisticsData>('/analytics');
}

/**
 * 获取首页/折线图数据
 */
export async function getTrendData() {
  return requestClient.get<trendData>('/trend');
}
