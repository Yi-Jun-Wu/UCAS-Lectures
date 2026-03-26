import React, { useMemo } from 'react';
import type { AppLecture } from '../../types';
import { calculateDayLayout, calculateCongestionBadges } from '../../utils/overlapEngine';
import { LectureBlock } from './LectureBlock'; // 下方提供的简易子组件

interface ColumnDayProps {
  date: Date;
  lectures: AppLecture[];
  isHighlightLeft: boolean;
  onLectureClick: (ids: string[]) => void;
  onHoverEnter: (ids: string[], x: number, y: number) => void;
  onHoverMove: (x: number, y: number) => void;
  onHoverLeave: () => void;
}

export const ColumnDay: React.FC<ColumnDayProps> = (
  { date: _data, lectures, isHighlightLeft, onLectureClick, onHoverEnter, onHoverMove, onHoverLeave }
) => {
  // 1. 通过排版引擎计算每个讲座的绝对坐标
  const uiLectures = useMemo(() => calculateDayLayout(lectures), [lectures]);
  
  // 2. 计算需要显示的拥挤度指示器 (比如右上角的数字 "3")
  const congestionBadges = useMemo(() => calculateCongestionBadges(lectures), [lectures]);

  return (
    <div 
      className={`flex-1 relative border-r border-slate-100 min-h-full ${
        (isHighlightLeft) ? 
          // 今天：提高层级(z-20)，加粗蓝边，并向左投射白色渐变阴影(-25px的偏移)
          'border-l-4 border-l-blue-500 bg-blue-50/10 z-20 shadow-[-25px_0_20px_-5px_rgba(255,255,255,0.85)] ring-1 ring-blue-500/10' 
          // 其他天：普通右边框，基础层级(z-10)
          : 'border-r border-slate-100 z-10'
      }`}
    >
      {/* 渲染讲座区块 */}
      {uiLectures.map(uiLecture => (
        <LectureBlock 
          key={uiLecture.id} 
          lecture={uiLecture} 
          onClick={onLectureClick}
          onHoverEnter={onHoverEnter}
          onHoverLeave={onHoverLeave}
          onHoverMove={onHoverMove}
        />
      ))}

      {/* 渲染拥挤度指示器 */}
      {congestionBadges.map((badge, index) => (
        <div 
          key={`badge-${index}`}
          className="absolute right-1 w-5 h-5 bg-slate-800 text-white text-[10px] font-bold flex items-center justify-center rounded-md z-[150] shadow-sm opacity-80 pointer-events-none"
          style={{ top: badge.top }}
          title={`该时间段有 ${badge.count} 个重叠讲座`}
        >
          {badge.count}
        </div>
      ))}
    </div>
  );
};