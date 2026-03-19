import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import type { AppLecture } from '../../types';

interface HoverTooltipProps {
  lectures: AppLecture[];
  x: number;
  y: number;
}

export const HoverTooltip: React.FC<HoverTooltipProps> = ({ lectures, x, y }) => {
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (lectures.length === 0) return;

    // 简单的边界检测：如果靠右，就在鼠标左边显示；靠下就在鼠标上边显示
    const tooltipWidth = 320; 
    const tooltipHeight = lectures.length > 1 ? Math.min(lectures.length * 80 + 50, 400) : 150;
    
    const offset = 15; // 距离鼠标的偏移量
    let finalX = x + offset;
    let finalY = y + offset;

    if (finalX + tooltipWidth > window.innerWidth) {
      finalX = x - tooltipWidth - offset;
    }
    if (finalY + tooltipHeight > window.innerHeight) {
      finalY = y - tooltipHeight - offset;
    }

    setStyle({
      left: `${finalX}px`,
      top: `${finalY}px`,
    });
  }, [x, y, lectures]);

  if (lectures.length === 0) return null;

  const content = (
    <div 
      className="fixed z-[9999] w-80 bg-white/95 backdrop-blur shadow-2xl rounded-xl border border-slate-200 pointer-events-none p-4 transition-opacity duration-150"
      style={style}
    >
      {lectures.length === 1 ? (
        // 单个讲座展示
        <div className="flex flex-col gap-2 text-sm">
          <div className="font-bold text-slate-800 leading-snug">
            {lectures[0].isStarred && <span className="text-orange-500 mr-1">★</span>}
            {lectures[0].title}
          </div>
          {lectures[0].speaker && <div className="text-slate-600 font-medium">🗣 {lectures[0].speaker}</div>}
          <div className="text-slate-500">🕒 {lectures[0].rawTimeStr}</div>
          <div className="text-slate-500">📍 {lectures[0].mainVenue}</div>
          
          <div className="flex gap-2 mt-1">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${lectures[0].type === 'science' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'}`}>
              {lectures[0].type === 'science' ? '科学前沿' : '人文'}
            </span>
            {lectures[0].isAppointmentRequired && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-700">需预约</span>
            )}
          </div>
        </div>
      ) : (
        // 多个重叠讲座展示
        <div className="flex flex-col max-h-[400px]">
          <div className="text-xs font-bold text-rose-500 mb-3 border-b border-rose-100 pb-2">
            ⚠️ 此时段有 {lectures.length} 场讲座
          </div>
          <div className="overflow-hidden flex flex-col gap-3">
            {lectures.map(l => (
              <div key={l.id} className="flex flex-col gap-1 pb-3 border-b border-slate-50 last:border-0 last:pb-0">
                <div className="font-bold text-sm text-slate-800 leading-tight line-clamp-2">
                  <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${l.type === 'science' ? 'bg-blue-500' : 'bg-emerald-500'}`}></span>
                  {l.isStarred && <span className="text-orange-500 mr-1">★</span>}
                  {l.title}
                </div>
                <div className="text-xs text-slate-500 flex justify-between">
                  <span className="truncate pr-2">📍 {l.mainVenue}</span>
                  {l.isAppointmentRequired && <span className="text-amber-600 shrink-0">需预约</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return createPortal(content, document.body);
};