// import type { AppLecture } from '../types';

// /**
//  * 获取物理位置固定(周一至周日)，但内容始终为未来7天的环绕式数组
//  */
// export function getWrappingWeekDays(referenceDate: Date): Date[] {
//   const start = new Date(referenceDate);
//   start.setHours(0, 0, 0, 0);

//   // 1. 生成: 今天, 明天, ..., 6天后
//   const next7Days = Array.from({ length: 7 }, (_, i) => {
//     const d = new Date(start);
//     d.setDate(start.getDate() + i);
//     return d;
//   });

//   // 2. 排序: 强行按 周一 到 周日 的物理位置重新排列
//   // JS 的 getDay() 返回 0-6 (0是周日)。我们将周日映射为 7 以便排序。
//   return next7Days.sort((a, b) => {
//     const dayA = a.getDay() === 0 ? 7 : a.getDay();
//     const dayB = b.getDay() === 0 ? 7 : b.getDay();
//     return dayA - dayB;
//   });
// }

// // 注意：原先的 getWeekWindow 也要改用这个新函数来计算边界
// export function getWeekWindow(referenceDate: Date): { start: number; end: number } {
//   // 因为是未来 7 天，直接取 start 为今天，end 为 6 天后的 23:59:59 即可，无需管物理排序
//   const start = new Date(referenceDate);
//   start.setHours(0, 0, 0, 0);
//   const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000 - 1);
//   return { start: start.getTime(), end: end.getTime() };
// }

// /**
//  * 辅助函数: 判断两个时间是否是同一天
//  */
// export function isSameDay(d1: Date, d2: Date): boolean {
//   return d1.getFullYear() === d2.getFullYear() &&
//          d1.getMonth() === d2.getMonth() &&
//          d1.getDate() === d2.getDate();
// }

// /**
//  * 获取从 startDate 开始的 7 天 Date 对象数组
//  */
// export function getNextSevenDays(startDate: Date): Date[] {
//   const start = new Date(startDate);
//   start.setHours(0, 0, 0, 0);

//   return Array.from({ length: 7 }, (_, i) => {
//     const date = new Date(start);
//     date.setDate(start.getDate() + i);
//     return date;
//   });
// }

/**
 * 将扁平的讲座数组，按天分发到 7 个数组中
 */
export function groupLecturesByDay(lectures: AppLecture[], days: Date[]): AppLecture[][] {
  const grouped: AppLecture[][] = Array.from({ length: 7 }, () => []);

  lectures.forEach(lecture => {
    const lectureDate = new Date(lecture.startTimestamp);
    
    // 核心修复: 通过 isSameDay 精准匹配物理列，彻底无视数组的排序顺序
    const dayIndex = days.findIndex(day => isSameDay(lectureDate, day));

    // 只要在这 7 天的视口内，就塞进对应的物理列
    if (dayIndex !== -1) {
      grouped[dayIndex].push(lecture);
    }
  });

  return grouped;
}

// /**
//  * 格式化日期标题 (例如: "周三 03/18")
//  */
// export function formatDayHeader(date: Date): string {
//   const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
//   const dayName = weekdays[date.getDay()];
  
//   const month = (date.getMonth() + 1).toString().padStart(2, '0');
//   const day = date.getDate().toString().padStart(2, '0');
  
//   return `${dayName} ${month}/${day}`;
// }

// utils/dateHelpers.ts
import type { AppLecture } from '../types';

export function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

/**
 * 核心引擎：根据视图模式和时间偏移量，生成物理排布为周一至周日的 7 天数组
 * @param mode 'complete' (完整自然周) | 'rolling' (循环流)
 * @param offset 偏移量 (整数)
 */
export function getGridDays(mode: 'complete' | 'rolling', offset: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (mode === 'rolling') {
    // 循环模式：以“真实的今天”加上偏移量作为时间锚点
    // offset = 0 -> 从今天开始7天; offset = 1 -> 从7天后开始7天; offset = -1 -> 从7天前开始7天
    const startAnchor = new Date(today);
    startAnchor.setDate(startAnchor.getDate() + offset * 7);

    // 1. 生成这 7 天
    const rollingDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startAnchor);
      d.setDate(startAnchor.getDate() + i);
      return d;
    });

    // 2. 强制按照物理周一到周日重新排序 (维持蓝线稳定)
    return rollingDays.sort((a, b) => {
      const dayA = a.getDay() === 0 ? 7 : a.getDay();
      const dayB = b.getDay() === 0 ? 7 : b.getDay();
      return dayA - dayB;
    });
    
  } else {
    // 完整周模式：寻找本周真实的星期一作为锚点
    const currentDayOfWeek = today.getDay() === 0 ? 7 : today.getDay();
    const mondayAnchor = new Date(today);
    
    // 退回到本周一，然后加上 offset 的周数
    mondayAnchor.setDate(mondayAnchor.getDate() - currentDayOfWeek + 1 + offset * 7);

    // 完整周天生就是周一到周日，直接按顺序生成即可
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mondayAnchor);
      d.setDate(mondayAnchor.getDate() + i);
      return d;
    });
  }
}

// 适配原有的辅助函数...
export function formatDayHeader(date: Date): string {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const dayName = weekdays[date.getDay()];
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${dayName} ${month}/${day}`;
}