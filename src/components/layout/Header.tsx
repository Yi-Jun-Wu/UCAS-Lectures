import React from 'react';
import type { LectureCategory } from '../../types';

interface HeaderProps {
  lastUpdated: string | null;
  filters: { science: boolean; humanity: boolean };
  onToggleFilter: (type: LectureCategory) => void;
}

export const Header: React.FC<HeaderProps> = ({ lastUpdated, filters, onToggleFilter }) => {
  // 格式化时间的辅助函数
  const formatTime = (isoString: string | null) => {
    if (!isoString) return '尚未同步';
    const date = new Date(isoString);
    return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <header className="sticky left-0 top-0 w-max min-w-full px-8 py-4 bg-white/90 backdrop-blur-sm border-b border-slate-200 z-400 flex justify-between items-center shadow-sm">
      
      {/* 左侧：标题与基础信息 */}
      <div className="flex flex-col">
        <div className="flex items-baseline gap-3">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            UCAS 讲座周历
          </h1>
          <span className="text-sm font-medium text-slate-400">
            {new Date().getFullYear()}
          </span>
        </div>
        <p className="text-xs text-slate-500 mt-1">
          直观展示未来 7 天的校园讲座动态
        </p>
      </div>

      {/* 右侧：状态与筛选控制 */}
      <div className="flex items-center gap-6 bg-slate-50 p-1.5 rounded-xl border border-slate-100">
        
        {/* 数据同步状态 */}
        <div className="flex flex-col items-end px-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            数据最后同步
          </span>
          <span className="text-sm font-medium text-slate-600">
            {formatTime(lastUpdated)}
          </span>
        </div>

        <div className="w-px h-8 bg-slate-200"></div>

        {/* 胶囊状筛选开关 */}
        <div className="flex gap-2 pr-1">
          <button
            onClick={() => onToggleFilter('science')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 border ${
              filters.science 
                ? 'bg-blue-100 text-blue-700 border-blue-200 shadow-sm' 
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="mr-1.5 opacity-80">🔬</span>
            科学讲座
          </button>
          
          <button
            onClick={() => onToggleFilter('humanity')}
            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all duration-200 border ${
              filters.humanity 
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 shadow-sm' 
                : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className="mr-1.5 opacity-80">📚</span>
            人文讲座
          </button>
        </div>
        
      </div>
    </header>
  );
};