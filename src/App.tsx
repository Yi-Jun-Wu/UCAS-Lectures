import { useState, useMemo, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CalendarGrid } from './components/calendar/CalendarGrid';
import { useLecturesData } from './hooks/useLecturesData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getWeekWindow } from './utils/dateHelpers';
import { extractLocations } from './utils/lectureHelpers';
import type { AppLecture, LectureCategory, CampusLocation, AppFilters } from './types';
import { STORAGE_KEYS } from './constants/config';

export default function App() {
  // 1. 挂载强化后的状态机数据引擎
  const { data, syncStatus, lastUpdated, localSyncTime, refetch } = useLecturesData();

  // 2. 本地持久化状态 (星标 & 缩放比例)
  const [starredIds, setStarredIds] = useLocalStorage<string[]>(STORAGE_KEYS.STARRED_LECTURES, []);
  const [uiScale, setUiScale] = useLocalStorage<number>('ucas_ui_scale', 1);

  // 3. UI 交互状态
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);

  // 综合筛选器状态 (默认全选)
  const [filters, setFilters] = useState<AppFilters>({
    science: true,
    humanity: true,
    locations: ['雁栖湖', '中关村', '玉泉路', '未知']
  });

  // ==========================================
  // 核心逻辑：数据清洗与交叉派生
  // ==========================================
  const visibleLectures = useMemo(() => {
    if (!data) return [];

    const now = new Date();
    const { start: windowStart, end: windowEnd } = getWeekWindow(now);
    const combined: AppLecture[] = [];

    // 辅助函数：处理单个维度的数组流
    const processCategory = (rawLectures: any[], categoryType: LectureCategory) => {
      rawLectures.forEach(lecture => {
        // A. 时间窗口过滤
        if (lecture.startTimestamp >= windowStart && lecture.startTimestamp <= windowEnd) {

          // B. 提取计算地点标签
          const lectureLocations = extractLocations(lecture);

          // C. 地点交叉过滤：只要讲座的任何一个地点在当前选中的过滤器中，就保留
          const hasMatchingLocation = lectureLocations.some(loc => filters.locations.includes(loc));

          if (hasMatchingLocation) {
            combined.push({
              ...lecture,
              type: categoryType,
              isStarred: starredIds.includes(lecture.id),
              locations: lectureLocations, // 挂载到应用级数据上
            });
          }
        }
      });
    };

    if (filters.science && data.science) processCategory(data.science, 'science');
    if (filters.humanity && data.humanity) processCategory(data.humanity, 'humanity');

    return combined;
  }, [data, filters, starredIds]);

  // ==========================================
  // 交互处理器
  // ==========================================

  // 切换类型筛选
  const handleToggleType = (type: LectureCategory) => {
    setFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // 切换地点筛选
  const handleToggleLocation = (loc: CampusLocation) => {
    setFilters(prev => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter(l => l !== loc) // 取消选中
        : [...prev.locations, loc]              // 增加选中
    }));
  };

  // 星标切换
  const handleToggleStar = (id: string) => {
    setStarredIds(prev => prev.includes(id) ? prev.filter(starId => starId !== id) : [...prev, id]);
  };

  // 获取侧边栏需要展示的列表
  const selectedLectures = useMemo(() => {
    if (selectedLectureIds.length === 0) return [];
    // 严格按照引擎返回的 ID 顺序进行映射
    return selectedLectureIds
      .map(id => visibleLectures.find(l => l.id === id))
      .filter((l): l is AppLecture => l !== undefined);
  }, [selectedLectureIds, visibleLectures]);

  // 边界保护：如果过滤导致选中的讲座在视图中消失，自动收起侧边栏
  useEffect(() => {
    if (selectedLectureIds.length > 0 && selectedLectures.length === 0) {
      setSelectedLectureIds([]);
    }
  }, [selectedLectures.length, selectedLectureIds.length]);


  // ==========================================
  // 渲染层
  // ==========================================
  return (
    <div className="w-screen h-screen overflow-hidden flex bg-gray-50 text-slate-800">

      {/* 主内容区 */}
      <div className="flex-1 overflow-auto relative" id="main-scroll-container">

        {/* 接入重构后的全功能 Header */}
        <Header
          filters={filters}
          onToggleType={handleToggleType}
          onToggleLocation={handleToggleLocation}
          syncStatus={syncStatus}
          lastUpdated={lastUpdated}
          localSyncTime={localSyncTime}
          onRefresh={refetch}
        // scale={uiScale}
        // onScaleChange={setUiScale}
        />

        <main
          className="min-w-[1200px] min-h-[800px] w-max p-8 relative flex flex-col mx-auto transform-origin-top transition-transform"
          style={{ zoom: uiScale }} // 全局缩放控制
        >
          {/* 结合状态机优化加载提示 */}
          {(!data && syncStatus === 'fetching') ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-3">
              <span className="text-3xl animate-spin">↻</span>
              <p className="font-medium tracking-widest">正在连接数据源...</p>
            </div>
          ) : (!data && syncStatus === 'error') ? (
            <div className="flex-1 flex flex-col items-center justify-center text-rose-500 gap-2">
              <span className="text-4xl">⚠️</span>
              <p className="font-bold">加载失败，请检查网络连接</p>
              <button onClick={() => refetch(true)} className="mt-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200">重试</button>
            </div>
          ) : (
            <CalendarGrid
              lectures={visibleLectures}
              onLectureClick={setSelectedLectureIds}
            />
          )}
        </main>
      </div>

      {/* 侧边栏 */}
      <Sidebar
        lectures={selectedLectures}
        onClose={() => setSelectedLectureIds([])}
        onToggleStar={handleToggleStar}
      />

    </div>
  );
}