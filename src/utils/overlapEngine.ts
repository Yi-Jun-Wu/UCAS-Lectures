import type { AppLecture, UILecture, CongestionBadge } from '../types';
import { CALENDAR_CONFIG } from '../constants/config';

// 辅助函数：判断两个讲座是否有时间重叠 (开区间，即刚好首尾相接不算重叠)
function isOverlapping(l1: AppLecture, l2: AppLecture): boolean {
  return Math.max(l1.startTimestamp, l2.startTimestamp) < Math.min(l1.endTimestamp, l2.endTimestamp);
}

// ==========================================
// 1. 核心排版引擎
// ==========================================
export function calculateDayLayout(lectures: AppLecture[]): UILecture[] {
  if (lectures.length === 0) return [];

  // --- Step 1: 确定视觉 Z 轴顺序 (从底向上) ---
  const sortedLectures = [...lectures].sort((a, b) => {
    // 1. 星标排在上层 (后处理)
    if (a.isStarred !== b.isStarred) return a.isStarred ? 1 : -1;
    // 2. 开始时间晚的排在上层
    if (a.startTimestamp !== b.startTimestamp) return a.startTimestamp - b.startTimestamp;
    // 3. 开始时间一致时，结束时间早的(时间短的)排在上层
    return b.endTimestamp - a.endTimestamp; 
  });

  // 用于存储计算过程中的中间变量
  const layoutMetrics = sortedLectures.map(lecture => ({
    lecture,
    indentLevel: 0,
    sameStartCount: 0,
    zIndex: 0,
  }));

  // --- Step 2 & 3: 动态规划计算 X 轴阶梯与 Y 轴微调 ---
  for (let i = 0; i < layoutMetrics.length; i++) {
    const current = layoutMetrics[i];
    let maxOverlappingIndent = -1;
    let sameStartCount = 0;

    // 扫描它底层的(先处理的)所有讲座
    for (let j = 0; j < i; j++) {
      const prev = layoutMetrics[j];
      
      // 如果时间有交集
      if (isOverlapping(current.lecture, prev.lecture)) {
        if (prev.indentLevel > maxOverlappingIndent) {
          maxOverlappingIndent = prev.indentLevel;
        }
      }

      // 如果开始时间完全一致
      if (current.lecture.startTimestamp === prev.lecture.startTimestamp) {
        sameStartCount++;
      }
    }

    current.indentLevel = maxOverlappingIndent + 1;
    current.sameStartCount = sameStartCount;
    // 基础 zIndex 为在排序数组中的索引，星标获得绝对霸权加成
    current.zIndex = current.lecture.isStarred ? 100 + i : i; 
  }

  // --- Step 4: 生成结果并组装 overlappingIds ---
  return layoutMetrics.map((currentMetric) => {
    const { lecture, indentLevel, sameStartCount, zIndex } = currentMetric;

    // 1. 找出所有重叠的兄弟节点
    const overlappingSiblings = layoutMetrics
      .filter(m => m.lecture.id !== lecture.id && isOverlapping(lecture, m.lecture));

    // 2. 划分为两组
    const exactMatches: typeof layoutMetrics = [];
    const partialMatches: typeof layoutMetrics = [];

    overlappingSiblings.forEach(m => {
      if (m.lecture.startTimestamp === lecture.startTimestamp && m.lecture.endTimestamp === lecture.endTimestamp) {
        exactMatches.push(m);
      } else {
        partialMatches.push(m);
      }
    });

    // 3. 严格执行用户定义的排序策略
    // 完全一致组：按视觉从上到下 (zIndex 降序)
    exactMatches.sort((a, b) => b.zIndex - a.zIndex);
    
    // 剩余重叠组：按开始时间早晚升序 -> 开始时间一致则视觉从上到下
    partialMatches.sort((a, b) => {
      if (a.lecture.startTimestamp !== b.lecture.startTimestamp) {
        return a.lecture.startTimestamp - b.lecture.startTimestamp;
      }
      return b.zIndex - a.zIndex;
    });

    // 4. 拼接 overlappingIds
    const overlappingIds = [
      lecture.id,
      ...exactMatches.map(m => m.lecture.id),
      ...partialMatches.map(m => m.lecture.id)
    ];

    // --- 最终计算 CSS 物理坐标 ---
    const startHour = new Date(lecture.startTimestamp).getHours() + new Date(lecture.startTimestamp).getMinutes() / 60;
    const durationHours = (lecture.endTimestamp - lecture.startTimestamp) / (1000 * 60 * 60);

    const adjustedStartHour = Math.max(CALENDAR_CONFIG.START_HOUR, startHour);
    const baseTopPercent = ((adjustedStartHour - CALENDAR_CONFIG.START_HOUR) / CALENDAR_CONFIG.TOTAL_HOURS) * 100;
    const baseHeightPercent = (durationHours / CALENDAR_CONFIG.TOTAL_HOURS) * 100;

    const xIndentPx = indentLevel * 12; // 每个阶梯向右缩进 12px
    const yOffsetPx = sameStartCount * 4; // 每个同起点向下错开 4px

    return {
      ...lecture,
      // 使用 CSS calc() 完美融合百分比与像素微调
      renderTop: `calc(${Math.max(0, baseTopPercent)}% + ${yOffsetPx}px)`,
      renderHeight: `calc(${baseHeightPercent}% - ${yOffsetPx}px)`,
      renderLeft: `${xIndentPx}px`,
      renderWidth: `calc(100% - ${xIndentPx}px)`,
      zIndex,
      overlappingIds,
    };
  });
}


// ==========================================
// 2. 拥挤度计算 (扫描线算法)
// ==========================================
export function calculateCongestionBadges(lectures: AppLecture[]): CongestionBadge[] {
  if (lectures.length < 2) return [];

  const events: { time: number; type: 'start' | 'end' }[] = [];
  lectures.forEach(l => {
    events.push({ time: l.startTimestamp, type: 'start' });
    events.push({ time: l.endTimestamp, type: 'end' });
  });

  // 排序：时间相同的，先离开(end)再进入(start)，防止瞬间误判重叠
  events.sort((a, b) => {
    if (a.time !== b.time) return a.time - b.time;
    return a.type === 'end' ? -1 : 1;
  });

  const badges: CongestionBadge[] = [];
  let currentOverlaps = 0;
  let maxOverlapsInCluster = 0;
  let clusterStartTime: number | null = null;

  for (const event of events) {
    if (event.type === 'start') {
      currentOverlaps++;
      if (currentOverlaps === 2 && clusterStartTime === null) {
        clusterStartTime = event.time;
        maxOverlapsInCluster = 2;
      }
      if (currentOverlaps > maxOverlapsInCluster) {
        maxOverlapsInCluster = currentOverlaps;
      }
    } else {
      currentOverlaps--;
      if (currentOverlaps < 2 && clusterStartTime !== null) {
        const startHour = new Date(clusterStartTime).getHours() + new Date(clusterStartTime).getMinutes() / 60;
        const topPercent = ((Math.max(CALENDAR_CONFIG.START_HOUR, startHour) - CALENDAR_CONFIG.START_HOUR) / CALENDAR_CONFIG.TOTAL_HOURS) * 100;

        badges.push({ top: `${Math.max(0, topPercent)}%`, count: maxOverlapsInCluster });
        clusterStartTime = null;
        maxOverlapsInCluster = 0;
      }
    }
  }

  return badges;
}
