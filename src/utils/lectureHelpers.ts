import type { MergedLecture, CampusLocation } from '../types';

/**
 * 从原始讲座数据中提取校区地点标签
 * 采用降级检索策略：会场 -> 全文(标题+简介) -> 未知
 */
export function extractLocations(lecture: MergedLecture): CampusLocation[] {
  const targetLocations: CampusLocation[] = ['雁栖湖', '中关村', '玉泉路'];
  const foundLocations = new Set<CampusLocation>();

  // 1. 优先检索高信噪比字段 (会场)
  const venueText = `${lecture.mainVenue} ${lecture.parallelVenue}`;
  targetLocations.forEach(loc => {
    if (venueText.includes(loc)) {
      foundLocations.add(loc);
    }
  });

  // 如果在会场中找到了明确的地点，直接返回
  if (foundLocations.size > 0) {
    return Array.from(foundLocations);
  }

  // 2. 降级检索：如果会场没写，去标题和简介里全文“捞”一下
  const fullText = `${lecture.title} ${lecture.introduction}`;
  targetLocations.forEach(loc => {
    if (fullText.includes(loc)) {
      foundLocations.add(loc);
    }
  });

  // 如果在正文中找到了，返回
  if (foundLocations.size > 0) {
    return Array.from(foundLocations);
  }

  // 3. 兜底策略：没有任何明确的地点信息
  return ['未知'];
}