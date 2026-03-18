import { useState, useMemo } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { CalendarGrid } from './components/calendar/CalendarGrid';
import { useLecturesData } from './hooks/useLecturesData';
import { useLocalStorage } from './hooks/useLocalStorage';
import { getWeekWindow } from './utils/dateHelpers';
import type { AppLecture, LectureCategory } from './types';
import { STORAGE_KEYS } from './constants/config';

export default function App() {
  // 1. 获取远程数据
  const { data, isLoading, error, lastUpdated } = useLecturesData();

  // 2. 本地持久化状态: 星标讲座的 ID 列表
  const [starredIds, setStarredIds] = useLocalStorage<string[]>(STORAGE_KEYS.STARRED_LECTURES, []);

  // 3. UI 交互状态
  const [filters, setFilters] = useState({ science: true, humanity: true });
  const [selectedLectureIds, setSelectedLectureIds] = useState<string[]>([]);

  // 4. 派生状态: 计算最终需要渲染在日历上的数据 (非常关键的逻辑)
  const visibleLectures = useMemo(() => {
    if (!data) return [];

    const now = new Date();
    const { start: windowStart, end: windowEnd } = getWeekWindow(now);
    const combined: AppLecture[] = [];

    // 处理科学讲座
    if (filters.science && data.science) {
      data.science.forEach(lecture => {
        // 过滤出在 7 天视口内的数据
        if (lecture.startTimestamp >= windowStart && lecture.startTimestamp <= windowEnd) {
          combined.push({
            ...lecture,
            type: 'science',
            isStarred: starredIds.includes(lecture.id),
          });
        }
      });
    }

    // 处理人文讲座
    if (filters.humanity && data.humanity) {
      data.humanity.forEach(lecture => {
        // 过滤出在 7 天视口内的数据
        if (lecture.startTimestamp >= windowStart && lecture.startTimestamp <= windowEnd) {
          combined.push({
            ...lecture,
            type: 'humanity',
            isStarred: starredIds.includes(lecture.id),
          });
        }
      });
    }

    return combined;
  }, [data, filters, starredIds]); // 仅当数据、筛选器或星标发生变化时重新计算

  // 5. 辅助函数: 处理星标切换
  const handleToggleStar = (id: string) => {
    setStarredIds((prev: string[]) =>
      prev.includes(id) ? prev.filter(starId => starId !== id) : [...prev, id]
    );
  };

  // 6. 获取选中讲座列表 (传递给 Sidebar)
  const selectedLectures = useMemo(() => {
    if (selectedLectureIds.length === 0) return [];
    // 从可视列表中过滤出所有被选中的讲座，并按开始时间排序
    return visibleLectures
      .filter(l => selectedLectureIds.includes(l.id))
      .sort((a, b) => a.startTimestamp - b.startTimestamp);
  }, [selectedLectureIds, visibleLectures]);

  // 7. 渲染层
  return (
    <div className="w-screen h-screen overflow-hidden flex bg-gray-50 text-slate-800">

      {/* 左侧主内容区 (允许内部出现超出屏幕的滚动条) */}
      <div className="flex-1 overflow-auto relative" id="main-scroll-container">

        <Header
          lastUpdated={lastUpdated}
          filters={filters}
          onToggleFilter={(type: LectureCategory) => setFilters(prev => ({ ...prev, [type]: !prev[type] }))}
        />

        <main className="min-w-[1200px] min-h-[800px] w-max p-8 relative flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex items-center justify-center text-gray-500">正在加载最新讲座数据...</div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center text-red-500">数据加载失败，请检查网络或离线缓存状态。</div>
          ) : (
            <CalendarGrid
              lectures={visibleLectures}
              onLectureClick={(ids: string[]) => setSelectedLectureIds(ids)}
            />
          )}
        </main>
      </div>

      {/* 右侧边栏 (独立于主内容区的滚动) */}
      <Sidebar
        lectures={selectedLectures}
        onClose={() => setSelectedLectureIds([])}
        onToggleStar={handleToggleStar}
      />

    </div>
  );
}