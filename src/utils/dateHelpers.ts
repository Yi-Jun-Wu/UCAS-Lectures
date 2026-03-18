import type { AppLecture } from '../types';

export declare function getWeekWindow(referenceDate: Date): { start: number; end: number };

// 1. 获取从今天开始的 7 天 Date 对象数组
export declare function getNextSevenDays(startDate: Date): Date[];

// 2. 将扁平的讲座数组，按天分发到 7 个数组中
// 逻辑: 遍历 lectures, 判断讲座的 startTimestamp 落在 7 天中的哪一天, 分门别类
export declare function groupLecturesByDay(
  lectures: AppLecture[], 
  days: Date[]
): AppLecture[][];

// 3. 格式化日期标题 (例如: "周三 03/18")
export declare function formatDayHeader(date: Date): string;