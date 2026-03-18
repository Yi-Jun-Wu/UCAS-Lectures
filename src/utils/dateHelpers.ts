import type { AppLecture } from '../types';

/**
 * 获取物理位置固定(周一至周日)，但内容始终为未来7天的环绕式数组
 */
export function getWrappingWeekDays(referenceDate: Date): Date[] {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  // 1. 生成: 今天, 明天, ..., 6天后
  const next7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  // 2. 排序: 强行按 周一 到 周日 的物理位置重新排列
  // JS 的 getDay() 返回 0-6 (0是周日)。我们将周日映射为 7 以便排序。
  return next7Days.sort((a, b) => {
    const dayA = a.getDay() === 0 ? 7 : a.getDay();
    const dayB = b.getDay() === 0 ? 7 : b.getDay();
    return dayA - dayB;
  });
}

// 注意：原先的 getWeekWindow 也要改用这个新函数来计算边界
export function getWeekWindow(referenceDate: Date): { start: number; end: number } {
  // 因为是未来 7 天，直接取 start 为今天，end 为 6 天后的 23:59:59 即可，无需管物理排序
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
  return { start: start.getTime(), end: end.getTime() };
}

/**
 * 辅助函数: 判断两个时间是否是同一天
 */
export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * 获取从 startDate 开始的 7 天 Date 对象数组
 */
export function getNextSevenDays(startDate: Date): Date[] {
  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    return date;
  });
}

/**
 * 将扁平的讲座数组，按天分发到 7 个数组中
 */
export function groupLecturesByDay(lectures: AppLecture[], days: Date[]): AppLecture[][] {
  // 初始化 7 个空数组
  const grouped: AppLecture[][] = Array.from({ length: 7 }, () => []);

  if (days.length === 0) return grouped;
  
  const startOfDayZero = days[0].getTime();

  lectures.forEach(lecture => {
    // 通过毫秒差计算该讲座属于 0-6 中的哪一天
    const diffTime = lecture.startTimestamp - startOfDayZero;
    const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // 如果讲座刚好在计算的 7 天视口内，则推入对应数组
    if (dayIndex >= 0 && dayIndex < 7) {
      grouped[dayIndex].push(lecture);
    }
  });

  return grouped;
}

/**
 * 格式化日期标题 (例如: "周三 03/18")
 */
export function formatDayHeader(date: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayName = weekdays[date.getDay()];
  
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return `${dayName} ${month}/${day}`;
}