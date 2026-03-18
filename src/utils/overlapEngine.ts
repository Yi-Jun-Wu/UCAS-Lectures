import type { AppLecture, UILecture, CongestionBadge } from '../types';

// 1. 核心排版引擎：将单日的业务数据转换为带有绝对定位坐标的 UI 数据
export declare function calculateDayLayout(lectures: AppLecture[]): UILecture[];

// 2. 拥挤度计算：扫描一天的区块，返回重叠数大于等于 2 的时间段及数量
export declare function calculateCongestionBadges(lectures: AppLecture[]): CongestionBadge[];