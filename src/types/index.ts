// 原始数据接口 (保持你定义的结构)
export interface MergedLecture {
  id: string;                 // 纯字母特征码 (符合你的无数字 FourCC 偏好风格)
  seriesName: string;
  title: string;
  creditHours: string;
  department: string;
  targetAudience: string;
  speaker: string;
  isAppointmentRequired: boolean;
  sourceUrl: string;
  startTimestamp: number;
  endTimestamp: number;
  rawTimeStr: string;
  mainVenue: string;
  parallelVenue: string;
  introduction: string;
  lastUpdatedAt: string;
}

// 讲座类型枚举 (使用纯字符串而非数字)
export type LectureCategory = 'science' | 'humanity';

// 同步状态类型
export type SyncStatus = 'idle' | 'fetching' | 'success' | 'error' | 'offline';

// 地点类型
export type CampusLocation = '雁栖湖' | '中关村' | '玉泉路' | '未知';

// 扩展后的应用级讲座数据 (App.tsx 派发给子组件的数据)
export interface AppLecture extends MergedLecture {
  type: LectureCategory;
  isStarred: boolean;
  locations: CampusLocation[]; // 新增：计算后的地点标签
}

// 新增：GitHub Raw JSON 的顶层包裹结构
export interface RawLectureResponse {
  generatedAt: string;
  total: number;
  lectures: MergedLecture[];
}

// 新增：Hook 返回的数据聚合格式
export interface AggregatedLectures {
  science: MergedLecture[];
  humanity: MergedLecture[];
}

// 经过 overlapEngine 计算后，带有渲染坐标的讲座对象
export interface UILecture extends AppLecture {
  renderTop: string;      // 例如: "15.5%"
  renderHeight: string;   // 例如: "10%"
  renderLeft: string;     // 例如: "0px" 或 "12px" (用于重叠错开)
  renderWidth: string;    // 例如: "100%" 或 "calc(100% - 12px)"
  zIndex: number;         // 基础层级，加星标的会加上特定基数

  overlappingIds: string[]; // 记录与当前讲座重叠的其他讲座 ID 列表, 包含它自身的 ID
}

// 4. 全局筛选器状态接口
export interface AppFilters {
  science: boolean;
  humanity: boolean;
  locations: CampusLocation[]; // 新增：当前选中的地点
}

// 拥挤度指示器的数据结构
export interface CongestionBadge {
  top: string;            // Y轴绝对定位
  count: number;          // 重叠的数量
}

export interface TooltipState {
  ids: string[]; // 当前悬浮的重叠组 IDs
  x: number;     // 鼠标屏幕X坐标
  y: number;     // 鼠标屏幕Y坐标
}
