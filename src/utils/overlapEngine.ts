import type { AppLecture, UILecture, CongestionBadge } from '../types';
import { CALENDAR_CONFIG } from '../constants/config'; 

/**
 * [Mock] 核心排版引擎
 * 逻辑: 仅按开始时间排序，后续重叠项按数组索引无脑向右偏移缩宽
 */
export function calculateDayLayout(lectures: AppLecture[]): UILecture[] {
  // 1. 按开始时间升序排列
  const sorted = [...lectures].sort((a, b) => a.startTimestamp - b.startTimestamp);

  // 为了测试悬浮窗和侧边栏联动，这里我们把当天的所有讲座简单粗暴地设为一个重叠组
  const mockOverlappingIds = sorted.map(l => l.id);

  return sorted.map((lecture, index) => {
    const startDate = new Date(lecture.startTimestamp);
    // 将时间转化为十进制小时 (例如 08:30 -> 8.5)
    const startHour = startDate.getHours() + startDate.getMinutes() / 60;
    
    // 持续时间 (小时)
    const durationHours = (lecture.endTimestamp - lecture.startTimestamp) / (1000 * 60 * 60);

    // 计算 Y 轴的百分比定位
    // 限定在 08:00 (CALENDAR_CONFIG.START_HOUR) 之后
    const adjustedStart = Math.max(CALENDAR_CONFIG.START_HOUR, startHour);
    const topPercent = ((adjustedStart - CALENDAR_CONFIG.START_HOUR) / CALENDAR_CONFIG.TOTAL_HOURS) * 100;
    const heightPercent = (durationHours / CALENDAR_CONFIG.TOTAL_HOURS) * 100;

    // Mock 阶梯偏移: 每个后续讲座向右错开 12px，宽度减少 12px
    const indent = index * 12;

    return {
      ...lecture,
      renderTop: `${Math.max(0, topPercent)}%`,
      renderHeight: `${heightPercent}%`,
      renderLeft: `${indent}px`,
      renderWidth: `calc(100% - ${indent}px)`,
      zIndex: lecture.isStarred ? 100 + index : index, // 星标始终置顶
      overlappingIds: mockOverlappingIds, // 绑定模拟重叠组 ID
    };
  });
}

/**
 * [Mock] 拥挤度计算
 * 逻辑: 当日讲座数量 >= 2 时，随机在列内生成 1-2 个带有随机数字的提示角标
 */
export function calculateCongestionBadges(lectures: AppLecture[]): CongestionBadge[] {
  if (lectures.length < 2) return [];

  // 随机生成 1 到 2 个角标
  const badgeCount = Math.floor(Math.random() * 2) + 1; 
  
  return Array.from({ length: badgeCount }, () => ({
    top: `${Math.floor(Math.random() * 70) + 10}%`, // 随机 Y 轴位置 (10% - 80%)
    count: Math.floor(Math.random() * 4) + 2,       // 随机显示 2 - 5 的重叠数字
  }));
}