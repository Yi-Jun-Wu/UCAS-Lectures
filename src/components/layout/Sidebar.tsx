import React, { useEffect, useState } from 'react';
import type { AppLecture } from '../../types';

interface SidebarProps {
  lectures: AppLecture[];
  onClose: () => void;
  onToggleStar: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ lectures, onClose, onToggleStar }) => {
  // 控制在多个讲座时，哪一个处于完整展开状态
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 当传入的讲座列表变化时，重置展开状态
  useEffect(() => {
    if (lectures.length > 0) {
      // 优先展开加星标的，否则展开第一个
      const starred = lectures.find(l => l.isStarred);
      setExpandedId(starred ? starred.id : lectures[0].id);
    } else {
      setExpandedId(null);
    }
  }, [lectures]);

  // 如果没有选中任何讲座，不渲染 (或者你可以在外层控制 translate-x 动画)
  if (lectures.length === 0) return null;

  return (
    <aside className="w-96 h-full bg-white shadow-[-10px_0_30px_-15px_rgba(0,0,0,0.1)] flex flex-col shrink-0 z-40 border-l border-slate-200">
      
      {/* 侧边栏头部 (固定) */}
      <div className="p-4 flex justify-between items-center border-b border-slate-200 bg-slate-50 sticky top-0">
        <h2 className="text-lg font-bold text-slate-800">
          {lectures.length > 1 ? `⚠️ 该时段有 ${lectures.length} 场讲座` : '讲座详情'}
        </h2>
        <button 
          onClick={onClose} 
          className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 hover:text-slate-800 transition-colors"
          title="关闭"
        >
          ✕
        </button>
      </div>

      {/* 侧边栏内容区 (可滚动) */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 bg-slate-50/50">
        {lectures.map((lecture) => {
          const isExpanded = lectures.length === 1 || expandedId === lecture.id;

          return (
            <div 
              key={lecture.id} 
              className={`bg-white rounded-xl border transition-all duration-200 overflow-hidden ${
                isExpanded ? 'border-blue-200 shadow-md' : 'border-slate-200 shadow-sm hover:border-blue-300 hover:shadow cursor-pointer'
              }`}
            >
              {/* --- 卡片头部 (始终可见，点击切换展开状态) --- */}
              <div 
                className={`p-4 ${isExpanded ? 'bg-blue-50/30 border-b border-slate-100' : ''}`}
                onClick={() => setExpandedId(lecture.id)}
              >
                <div className="flex justify-between items-start gap-2">
                  <h3 className="font-bold text-slate-800 leading-snug flex-1">
                    {lecture.title}
                  </h3>
                  {/* 星标按钮 (阻止冒泡，以免触发卡片的折叠/展开) */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onToggleStar(lecture.id); }}
                    className="p-1 -mt-1 -mr-1 shrink-0 transition-transform active:scale-75"
                    title={lecture.isStarred ? "取消星标" : "标为重要"}
                  >
                    <svg 
                      className={`w-7 h-7 ${lecture.isStarred ? 'text-orange-400 fill-orange-400' : 'text-slate-300 fill-transparent hover:text-orange-300'}`} 
                      viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385c.148.621-.531 1.115-1.071.794l-4.755-2.825a.562.562 0 00-.58 0l-4.755 2.825c-.54.321-1.219-.173-1.071-.794l1.285-5.385a.563.563 0 00-.182-.557l-4.204-3.602c-.38-.325-.178-.95.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                    </svg>
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${lecture.type === 'science' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {lecture.type === 'science' ? '科学讲座' : '人文讲座'}
                  </span>
                  {lecture.isAppointmentRequired && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-700">需预约</span>
                  )}
                  {/* 在折叠状态下，额外显示时间和地点以便于快速区分 */}
                  {!isExpanded && (
                    <span className="text-xs text-slate-500 line-clamp-1 mt-1 w-full">
                      🕒 {lecture.rawTimeStr} | 📍 {lecture.mainVenue}
                    </span>
                  )}
                </div>
              </div>

              {/* --- 卡片详情区 (仅在展开时可见) --- */}
              {isExpanded && (
                <div className="p-4 flex flex-col gap-4 text-sm">
                  
                  {/* 核心信息网格排布 (两列，高度压缩) */}
                  <div className="grid grid-cols-2 gap-y-3 gap-x-4 bg-slate-50 p-3 rounded-lg border border-slate-100">
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-xs mb-0.5">时间</span>
                      <span className="font-medium text-slate-700">{lecture.rawTimeStr}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-xs mb-0.5">主会场</span>
                      <span className="font-medium text-slate-700">{lecture.mainVenue || '待定'}</span>
                    </div>
                    {lecture.parallelVenue && (
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-xs mb-0.5">分会场</span>
                        <span className="font-medium text-slate-700">{lecture.parallelVenue}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-slate-400 block text-xs mb-0.5">主讲人</span>
                      <span className="font-medium text-slate-700">{lecture.speaker || '未知'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs mb-0.5">学时</span>
                      <span className="font-medium text-slate-700">{lecture.creditHours || '无'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs mb-0.5">主办部门</span>
                      <span className="font-medium text-slate-700 truncate block" title={lecture.department}>{lecture.department || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-xs mb-0.5">面向对象</span>
                      <span className="font-medium text-slate-700 truncate block" title={lecture.targetAudience}>{lecture.targetAudience || '全体'}</span>
                    </div>
                  </div>

                  {/* 简介区 (内联滚动) */}
                  {lecture.introduction && (
                    <div className="mt-1">
                      <h4 className="text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">讲座简介</h4>
                      {/* max-h-48 限制高度，overflow-y-auto 允许内部滚动，保留完整信息但不破坏整体布局 */}
                      <div className="text-slate-600 leading-relaxed text-sm bg-white border border-slate-100 p-3 rounded-lg max-h-48 overflow-y-auto shadow-inner">
                        {lecture.introduction}
                      </div>
                    </div>
                  )}

                  {/* 底部操作区 */}
                  <div className="pt-3 border-t border-slate-100 mt-2">
                    <a 
                      href={`https://sep.ucas.ac.cn${lecture.sourceUrl}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center justify-center w-full py-2 bg-slate-800 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium shadow-sm"
                    >
                      前往 SEP 系统查看详情 ↗
                    </a>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};