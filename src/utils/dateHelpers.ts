import type { AppLecture } from '../types';

/**
 * 获取以 referenceDate 为基准的 7 天时间戳边界
 * 例如：今天(周三)的 00:00:00 到 下周二的 23:59:59
 */
export function getWeekWindow(referenceDate: Date): { start: number; end: number } {
  const start = new Date(referenceDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 7); // 第8天的 00:00:00
  
  return { 
    start: start.getTime(), 
    end: end.getTime() - 1 // 减去 1 毫秒，即第7天的 23:59:59.999
  };
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