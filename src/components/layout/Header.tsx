// components/layout/Header.tsx
import React from 'react';
import type { LectureCategory, AppFilters, CampusLocation, SyncStatus } from '../../types';

interface HeaderProps {
  filters: AppFilters;
  onToggleType: (type: LectureCategory) => void;
  onToggleLocation: (location: CampusLocation) => void;
  syncStatus: SyncStatus;
  lastUpdated: string | null;
  localSyncTime: number | null;
  onRefresh: () => void;
  scale: number;
  onScaleChange: (scale: number | ((prev: number) => number)) => void;
}

export const Header: React.FC<HeaderProps> = ({
  filters, onToggleType, onToggleLocation,
  syncStatus, lastUpdated, localSyncTime, onRefresh,
  scale, onScaleChange
}) => {

  const formatTime = (timeInfo: string | number | null) => {
    if (!timeInfo) return '--/--';
    const date = new Date(timeInfo);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  const getSyncButtonUI = () => {
    switch (syncStatus) {
      case 'fetching': return { icon: '↻', text: '同步中...', colorClass: 'bg-blue-50 text-blue-700 border-blue-200 cursor-wait', disabled: true };
      case 'success':
      case 'idle': return { icon: '✓', text: '已同步', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', disabled: false };
      case 'offline': return { icon: '☁️', text: '离线模式', colorClass: 'bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-200', disabled: false };
      case 'error': return { icon: '⚠️', text: '同步失败', colorClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', disabled: false };
      default: return { icon: '↻', text: '刷新', colorClass: 'bg-slate-50 text-slate-700 border-slate-200', disabled: false };
    }
  };

  const syncUI = getSyncButtonUI();
  const locationOptions: CampusLocation[] = ['雁栖湖', '中关村', '玉泉路', '未知'];

  // ---> 定义校区专属的色彩配置 <---
  const locThemes: Record<CampusLocation, { active: string; default: string }> = {
    '雁栖湖': { active: 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-sm', default: 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50' },
    '中关村': { active: 'bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200 shadow-sm', default: 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50' },
    '玉泉路': { active: 'bg-amber-100 text-amber-700 border-amber-200 shadow-sm', default: 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50' },
    '未知': { active: 'bg-slate-200 text-slate-700 border-slate-300 shadow-sm', default: 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50' }
  };

  return (
    <header className="sticky left-0 top-0 w-max min-w-full px-8 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 flex gap-10 justify-between items-center shadow-sm">

      {/* ================= 1. 左侧：品牌与标识 ================= */}
      <div className="flex flex-col shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">UCAS 讲座周历</h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">{new Date().getFullYear()}</span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 tracking-wide">校园讲座动态时空速览</p>
      </div>

      {/* ================= 2. 中间：全局同步状态 ================= */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <button
          onClick={onRefresh}
          disabled={syncUI.disabled}
          className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 transition-colors shadow-sm ${syncUI.colorClass}`}
          title="点击手动拉取最新数据"
        >
          <span className={`inline-block ${syncStatus === 'fetching' ? 'animate-spin' : ''}`}>
            {syncUI.icon}
          </span>
          {syncUI.text}
        </button>

        <div className="text-[9px] text-slate-400 mt-1.5 flex flex-col items-center gap-0.5 opacity-80">
          <span title={`您的设备最后成功拉取的时间`}>更新: {formatTime(localSyncTime)}</span>
          <span title={`数据源仓库最新生成的时间`}>数据: {formatTime(lastUpdated)}</span>
        </div>
      </div>

      {/* ================= 3. 右侧：控制台 (过滤器 + 缩放) ================= */}
      <div className="flex items-center gap-4 shrink-0 bg-slate-50 p-1.5 rounded-xl border border-slate-100">

        {/* 校区筛选：2x2 网格，多彩配置 */}
        <div className="flex items-center gap-2 pr-2 border-r border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase ml-1" style={{ writingMode: 'vertical-lr' }}>校区</span>
          <div className="grid grid-cols-2 gap-1.5">
            {locationOptions.map(loc => {
              const isActive = filters.locations.includes(loc);
              const theme = locThemes[loc];
              return (
                <button
                  key={loc}
                  onClick={() => onToggleLocation(loc)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded border transition-all duration-200 ${isActive ? theme.active : theme.default
                    }`}
                >
                  {loc}
                </button>
              );
            })}
          </div>
        </div>

        {/* 类型筛选：保持不变 */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggleType('science')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 border flex items-center gap-1.5 ${filters.science ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <span className={!filters.science ? 'grayscale opacity-60' : ''}>🔬</span> 科学
          </button>

          <button
            onClick={() => onToggleType('humanity')}
            className={`px-3 py-2 rounded-lg text-sm font-bold transition-all duration-200 border flex items-center gap-1.5 ${filters.humanity ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <span className={!filters.humanity ? 'grayscale opacity-60' : ''}>📚</span> 人文
          </button>
        </div>

        <div className="w-px h-8 bg-slate-200 mx-1"></div>

        {/* 缩放控制器 */}
        <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm mr-1">
          <button
            onClick={() => onScaleChange(s => Math.max(0.4, s - 0.1))}
            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded transition-colors disabled:opacity-30" disabled={scale <= 0.4} title="缩小"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /></svg>
          </button>
          <span className="text-[10px] font-bold text-slate-600 w-10 text-center select-none">{Math.round(scale * 100)}%</span>
          <button
            onClick={() => onScaleChange(s => Math.min(1.5, s + 0.1))}
            className="w-7 h-7 flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded transition-colors disabled:opacity-30" disabled={scale >= 1.5} title="放大"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
          </button>
        </div>

      </div>
    </header>
  );
};