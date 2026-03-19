export const GITHUB_RAW_BASE = 'https://raw.githubusercontent.com/Yi-Jun-Wu/UCAS-Lectures/refs/heads/main';

export const API_ENDPOINTS = {
  SCIENCE: `${GITHUB_RAW_BASE}/science/latest.json`,
  HUMANITY: `${GITHUB_RAW_BASE}/humanity/latest.json`,
};

export const STORAGE_KEYS = {
  STARRED_LECTURES: 'ucas_starred_lectures_v_one',
  CACHED_LECTURES_DATA: 'ucas_lectures_raw_cache_data', // 存储完整数据的键
  LECTURE_FILTERS: 'ucas_lectures_filters',
  UI_SCALE: 'ucas_lectures_ui_scale',
};

// 日历视图的时间边界 (24小时制)
export const CALENDAR_CONFIG = {
  START_HOUR: 8,   // 08:00 开始
  END_HOUR: 22,    // 22:00 结束
  TOTAL_HOURS: 14, // 总跨度 14 小时
};
