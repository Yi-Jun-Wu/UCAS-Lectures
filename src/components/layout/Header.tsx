// components/layout/Header.tsx
import React from 'react';
import { version } from '../../../package.json';
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
      <div className="flex items-center gap-3 shrink-0">
        
        {/* 文字列 (上下两行) */}
        <div className="flex flex-col gap-1 justify-center">
          
          {/* 第一行：标题 + 年份 */}
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">UCAS 讲座周历</h1>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {new Date().getFullYear()}
            </span>
          </div>
          
          {/* 第二行：副标题 + 版本号 */}
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-[10px] text-slate-500 tracking-wide">校园讲座动态时空速览</p>
            {/* 颜色优化：使用柔和的淡蓝色，字号调至 9px，融入副标题的视觉层级 */}
            <span className="text-[9px] font-bold text-blue-400/80 bg-blue-50/60 px-1.5 py-[1px] rounded border border-blue-100/50 font-mono tracking-wider">
              v{version}
            </span>
          </div>
          
        </div>

        {/* 右侧：GitHub 图标 (利用外层 flex items-center 自动跨两行垂直居中) */}
        <div className="flex items-center pl-1 border-l border-slate-100/80">
          <a
            href="https://github.com/Yi-Jun-Wu/UCAS-Lectures"
            target="_blank"
            rel="noopener noreferrer"
            // 默认颜色调浅，hover 时加深，提供良好的交互反馈
            className="text-slate-300 hover:text-slate-600 transition-colors"
            title="View source on GitHub"
          >
            {/* 图标稍微放大一点(18px)，以压住左侧两行文字的阵脚 */}
            <svg className="w-[40px] h-[40px]" fill="currentColor" viewBox="0 0 24 24">
              <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
            </svg>
          </a>
        </div>

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