import React from 'react';
import type { LectureCategory, AppFilters, CampusLocation, SyncStatus } from '../../types';

interface HeaderProps {
  // 过滤相关
  filters: AppFilters;
  onToggleType: (type: LectureCategory) => void;
  onToggleLocation: (location: CampusLocation) => void;
  
  // 同步状态相关
  syncStatus: SyncStatus;
  lastUpdated: string | null;       // 数据源更新时间 (JSON 里的 generatedAt)
  localSyncTime: number | null;     // 本地实际成功拉取的时间
  onRefresh: () => void;            // 手动触发更新的方法
}

export const Header: React.FC<HeaderProps> = ({ 
  filters, onToggleType, onToggleLocation, 
  syncStatus, lastUpdated, localSyncTime, onRefresh 
}) => {
  
  // 格式化时间的辅助函数 (例如: "03/18 14:30")
  const formatTime = (timeInfo: string | number | null) => {
    if (!timeInfo) return '--/--';
    const date = new Date(timeInfo);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // 根据当前同步状态，计算同步按钮的 UI 表现
  const getSyncButtonUI = () => {
    switch (syncStatus) {
      case 'fetching':
        return { icon: '↻', text: '同步中...', colorClass: 'bg-blue-100 text-blue-700 border-blue-200 cursor-wait', disabled: true };
      case 'success':
      case 'idle':
        return { icon: '✓', text: '已同步', colorClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100', disabled: false };
      case 'offline':
        return { icon: '☁️', text: '离线缓存', colorClass: 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200', disabled: false };
      case 'error':
        return { icon: '⚠️', text: '同步失败', colorClass: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', disabled: false };
      default:
        return { icon: '↻', text: '刷新', colorClass: 'bg-slate-50 text-slate-700 border-slate-200', disabled: false };
    }
  };

  const syncUI = getSyncButtonUI();
  const locationOptions: CampusLocation[] = ['雁栖湖', '中关村', '玉泉路', '未知'];

  return (
    <header className="sticky left-0 top-0 w-max min-w-full px-8 py-3 bg-white/95 backdrop-blur-md border-b border-slate-200 z-50 flex justify-between items-center shadow-sm">
      
      {/* 1. 左侧：标题与基础信息 */}
      <div className="flex flex-col shrink-0">
        <div className="flex items-baseline gap-2">
          <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">
            UCAS 讲座周历
          </h1>
          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
            {new Date().getFullYear()}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 mt-0.5 tracking-wide">
          校园讲座动态时空速览
        </p>
      </div>

      {/* 2. 中侧：地点筛选 (紧凑分段控制器) */}
      <div className="flex flex-col mx-6 flex-1 max-w-md">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 ml-1">
          校区筛选
        </span>
        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200/60">
          {locationOptions.map(loc => {
            const isActive = filters.locations.includes(loc);
            return (
              <button
                key={loc}
                onClick={() => onToggleLocation(loc)}
                className={`flex-1 text-xs py-1 font-semibold rounded-md transition-all duration-200 ${
                  isActive 
                    ? 'bg-white text-slate-800 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                {loc}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. 右侧：类型筛选与同步状态面板 */}
      <div className="flex items-center gap-5 shrink-0">
        
        {/* 类型筛选 */}
        <div className="flex gap-2">
          <button
            onClick={() => onToggleType('science')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              filters.science 
                ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm' 
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className={!filters.science ? 'grayscale opacity-60' : ''}>🔬</span> 科学
          </button>
          
          <button
            onClick={() => onToggleType('humanity')}
            className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 border flex items-center gap-1.5 ${
              filters.humanity 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' 
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className={!filters.humanity ? 'grayscale opacity-60' : ''}>📚</span> 人文
          </button>
        </div>
        
        <div className="w-px h-8 bg-slate-200"></div>

        {/* 动态同步状态盘 */}
        <div className="flex flex-col items-end min-w-[110px]">
          <button
            onClick={onRefresh}
            disabled={syncUI.disabled}
            className={`px-2.5 py-1 text-xs font-bold rounded-md border flex items-center gap-1.5 transition-colors ${syncUI.colorClass}`}
            title="点击手动拉取最新数据"
          >
            <span className={`inline-block ${syncStatus === 'fetching' ? 'animate-spin' : ''}`}>
              {syncUI.icon}
            </span>
            {syncUI.text}
          </button>
          
          {/* 数据源说明小字 */}
          <div className="text-[9px] text-slate-400 mt-1 whitespace-nowrap flex gap-2">
            <span title={`您的设备最后成功拉取的时间: ${formatTime(localSyncTime)}`}>
              更新: {formatTime(localSyncTime)}
            </span>
            <span title={`数据源仓库最新生成的时间: ${formatTime(lastUpdated)}`}>
              数据: {formatTime(lastUpdated)}
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};